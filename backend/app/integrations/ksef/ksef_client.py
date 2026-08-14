import base64
import os

import httpx2
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.asymmetric import padding

from .ksef_auth_service import KsefAuthService
from .ksef_session import KsefSession


class KsefClient:
    def __init__(self, client: httpx2.AsyncClient, base_url: str, nip: str, token: str):
        self.client = client
        self.base_url = base_url
        self.auth = KsefAuthService(client, base_url, nip, token)

    async def open_online_session(self, form_code: dict | None = None):
        if form_code is None:
            form_code = {"systemCode": "FA (3)", "schemaVersion": "1-0E", "value": "FA"}
        token_data = await self.auth.get_access_token()
        session_data = await self._open_online_session(token_data.access_token.token, form_code)

        return KsefSession(
            client=self.client,
            base_url=self.base_url,
            token=token_data.access_token.token,
            reference_number=session_data["referenceNumber"],
            aes_key=session_data["aes_key"],
            iv=session_data["iv"],
        )

    async def _open_online_session(self, token: str, form_code: dict):
        """Otwiera sesję online i zwraca referenceNumber + aes_key + iv"""
        aes_key = os.urandom(32)  # 256-bit klucz AES
        iv = os.urandom(16)  # Initialization Vector

        public_key = await self.auth._get_public_key("SymmetricKeyEncryption")
        encrypted_key = public_key.encrypt(  # type: ignore
            aes_key, padding.OAEP(mgf=padding.MGF1(algorithm=hashes.SHA256()), algorithm=hashes.SHA256(), label=None)
        )

        payload = {
            "formCode": form_code,
            "encryption": {
                "encryptedSymmetricKey": base64.b64encode(encrypted_key).decode(),
                "initializationVector": base64.b64encode(iv).decode(),
            },
        }

        resp = await self.client.post(
            f"{self.base_url}/sessions/online",
            json=payload,
            headers={
                "Authorization": f"Bearer {token}",
                "Content-Type": "application/json",
                "X-Error-Format": "problem-details",
            },
        )
        resp.raise_for_status()
        data = resp.json()

        # Dodajemy klucze do zwracanego słownika
        data["aes_key"] = aes_key
        data["iv"] = iv
        return data

    async def download_upo(self, upo_url: str) -> str:
        resp = await self.client.get(upo_url)
        resp.raise_for_status()
        return resp.content.decode("utf-8")
