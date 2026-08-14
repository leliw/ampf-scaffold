import asyncio
import base64
import hashlib
import logging

import httpx2
from cryptography.hazmat.primitives import padding
from cryptography.hazmat.primitives.ciphers import Cipher, algorithms, modes

from .ksef_model import KsefInvoiceResponseDto

_log = logging.getLogger(__name__)


class KsefSession:
    def __init__(
        self, client: httpx2.AsyncClient, base_url: str, token: str, reference_number: str, aes_key: bytes, iv: bytes
    ):
        self.client = client
        self.base_url = base_url
        self.token = token
        self.reference_number = reference_number
        self.aes_key = aes_key
        self.iv = iv

    async def __aenter__(self):
        await self._wait_until_session_active()
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        await self._close_session()

    async def _wait_until_session_active(self):
        for _ in range(10):
            resp = await self.client.get(
                f"{self.base_url}/sessions/{self.reference_number}", headers={"Authorization": f"Bearer {self.token}"}
            )
            resp.raise_for_status()
            status = resp.json()["status"]["code"]
            if status == 100:  # ACTIVE
                return
            await asyncio.sleep(0.5)
        raise Exception("Session not active in time")

    async def _close_session(self):
        await self.client.post(
            f"{self.base_url}/sessions/online/{self.reference_number}/close",
            headers={"Authorization": f"Bearer {self.token}"},
        )

    async def get_status(self):
        resp = await self.client.get(
            f"{self.base_url}/sessions/{self.reference_number}", headers={"Authorization": f"Bearer {self.token}"}
        )
        resp.raise_for_status()
        return resp.json()

    async def send_invoice(self, invoice_xml: str) -> str:
        xml_bytes = invoice_xml.encode("utf-8")
        padder = padding.PKCS7(128).padder()
        padded_xml = padder.update(xml_bytes) + padder.finalize()
        cipher = Cipher(algorithms.AES(self.aes_key), modes.CBC(self.iv))
        encryptor = cipher.encryptor()
        encrypted = encryptor.update(padded_xml) + encryptor.finalize()

        # Hashe (wymagane przez KSeF)
        invoice_hash = hashlib.sha256(xml_bytes).digest()
        encrypted_hash = hashlib.sha256(encrypted).digest()

        payload = {
            "invoiceHash": base64.b64encode(invoice_hash).decode(),
            "invoiceSize": len(xml_bytes),
            "encryptedInvoiceHash": base64.b64encode(encrypted_hash).decode(),
            "encryptedInvoiceSize": len(encrypted),
            "encryptedInvoiceContent": base64.b64encode(encrypted).decode(),
            "offlineMode": False,
        }

        resp = await self.client.post(
            f"{self.base_url}/sessions/online/{self.reference_number}/invoices",
            json=payload,
            headers={
                "Authorization": f"Bearer {self.token}",
                "Content-Type": "application/json",
                "X-Error-Format": "problem-details",
            },
        )
        if resp.status_code == 400:
            _log.warning(resp.json())
        resp.raise_for_status()
        return resp.json()["referenceNumber"]

    async def get_invoice_status(self, invoice_reference: str) -> KsefInvoiceResponseDto:
        """Sprawdza aktualny status faktury + zwraca ksefNumber i link do UPO"""
        resp = await self.client.get(
            f"{self.base_url}/sessions/{self.reference_number}/invoices/{invoice_reference}",
            headers={"Authorization": f"Bearer {self.token}", "X-Error-Format": "problem-details"},
        )
        resp.raise_for_status()
        return KsefInvoiceResponseDto.model_validate(resp.json())

    async def wait_until_invoice_processed(
        self, invoice_reference: str, min_delay: float = 1.0, max_delay: float = 30.0, max_total_time: float = 300.0
    ) -> KsefInvoiceResponseDto:
        delay = min_delay
        elapsed_time = 0.0

        while elapsed_time < max_total_time:
            invoice_status = await self.get_invoice_status(invoice_reference)

            if invoice_status.status.code != 150:  # Processing
                return invoice_status

            _log.info(f"Faktura {invoice_reference} wciąż przetwarzana. Następna próba za {delay}s...")

            await asyncio.sleep(delay)
            elapsed_time += delay
            delay = min(delay * 1.5, max_delay)

        _log.error(f"Przekroczono limit czasu ({max_total_time}s) dla faktury {invoice_reference}")
        return invoice_status
