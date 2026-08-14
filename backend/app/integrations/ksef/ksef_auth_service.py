import asyncio
import base64
import json
import logging
from typing import Literal

import httpx2
from cryptography import x509
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.asymmetric import padding

from .ksef_model import KsefRedeemResponse

_log = logging.getLogger(__name__)


class KsefAuthService:
    def __init__(self, client: httpx2.AsyncClient, base_url: str, nip: str, token: str):
        self.client = client
        self.base_url = base_url
        self.nip = nip
        self.token = token
        self.public_keys: list[dict] | None = None

    async def get_access_token(self) -> KsefRedeemResponse:
        # 1. Get Challenge
        challenge_res = await self.client.post(
            f"{self.base_url}/auth/challenge", json={"contextIdentifier": {"type": "Nip", "value": self.nip}}
        )
        challenge_res.raise_for_status()
        challenge_data = challenge_res.json()

        # 2. Encrypt Token
        encrypted_token = self._encrypt_token(challenge_data["timestampMs"], await self._get_public_key())

        # 3. Auth Session
        auth_res = await self.client.post(
            f"{self.base_url}/auth/ksef-token",
            json={
                "challenge": challenge_data["challenge"],
                "contextIdentifier": {"type": "Nip", "value": self.nip},
                "encryptedToken": encrypted_token,
            },
        )
        auth_res.raise_for_status()
        auth_data = auth_res.json()

        reference_number = auth_data.get("referenceNumber")
        session_token = auth_data["authenticationToken"]["token"]   # tymczasowy JWT

        if not reference_number:
            raise ValueError("Brak referenceNumber w odpowiedzi /ksef-token")

        # === NOWOŚĆ: Polling statusu ===
        max_attempts = 30
        delay = 0.6  # start 600ms

        for attempt in range(max_attempts):
            status_res = await self.client.get(
                f"{self.base_url}/auth/{reference_number}",
                headers={"Authorization": f"Bearer {session_token}"}
            )
            status_res.raise_for_status()
            status_data = status_res.json()

            status_code = status_data.get("status", {}).get("code")

            if status_code == 200:
                break  # uwierzytelnianie zakończone sukcesem
            elif status_code == 100:
                await asyncio.sleep(delay)
                delay = min(delay * 1.3, 2.0)  # prosty backoff
                continue
            else:
                # inny status błędu
                _log.warning(f"Nieoczekiwany status uwierzytelniania: {status_code} - {status_data}")
                raise Exception(f"Uwierzytelnianie nie powiodło się: {status_code}")

        else:
            raise TimeoutError(f"Timeout pollingu statusu po {max_attempts} próbach")
        # 4. Redeem JWT
        redeem_res = await self.client.post(
            f"{self.base_url}/auth/token/redeem", headers={"Authorization": f"Bearer {session_token}"}
        )
        if redeem_res.status_code == 400:
            _log.warning(json.dumps(redeem_res.json(), indent=4))
        redeem_res.raise_for_status()
        return KsefRedeemResponse(**redeem_res.json())

    async def _get_public_keys(self) -> list[dict]:
        if self.public_keys is None:
            response = await self.client.get(f"{self.base_url}/security/public-key-certificates")
            response.raise_for_status()
            self.public_keys = response.json()
        if not self.public_keys:
            raise ValueError("Nie znaleziono kluczy publicznych")
        return self.public_keys

    async def _get_public_key(
        self, key_name: Literal["KsefTokenEncryption", "SymmetricKeyEncryption"] = "KsefTokenEncryption"
    ):
        public_keys = await self._get_public_keys()
        ksef_token_cert_base64 = None
        for entry in public_keys:
            if key_name in entry.get("usage", []):
                ksef_token_cert_base64 = entry["certificate"]
                break

        if not ksef_token_cert_base64:
            raise ValueError(f"Nie znaleziono certyfikatu z usage {key_name}")
        cert_der = base64.b64decode(ksef_token_cert_base64)
        return x509.load_der_x509_certificate(cert_der).public_key()

    def _encrypt_token(self, timestamp_ms: int, public_key) -> str:
        data = f"{self.token}|{timestamp_ms}".encode()
        encrypted = public_key.encrypt(
            data, padding.OAEP(mgf=padding.MGF1(algorithm=hashes.SHA256()), algorithm=hashes.SHA256(), label=None)
        )
        return base64.b64encode(encrypted).decode("utf-8")
