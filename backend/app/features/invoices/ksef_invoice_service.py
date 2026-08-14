from features.invoices.ksef_invoice_response_model import KsefInvoiceResponse
from features.invoices.ksef_invoice_response_service import KsefInvoiceResponseService
from integrations.ksef.ksef_client import KsefClient

from .invoice_service import InvoiceService
from .ksef_invoice_converter import KsefInvoiceConverter


class KsefInvoiceService:
    def __init__(self, invoice_service: InvoiceService, response_service: KsefInvoiceResponseService, ksef_client: KsefClient, converter: KsefInvoiceConverter):
        self.invoice_service = invoice_service
        self.response_service = response_service
        self.ksef_client = ksef_client
        self.converter = converter

    async def send_invoice(self, invoice_id: int) -> str:
        xml_content = self._get_invoice_xml(invoice_id)
        async with await self.ksef_client.open_online_session() as session:
            return await session.send_invoice(xml_content)

    async def send_invoice_and_wait_for_processing(self, invoice_id: int) -> KsefInvoiceResponse:
        xml_content = self._get_invoice_xml(invoice_id)
        async with await self.ksef_client.open_online_session() as session:
            invoice_ref = await session.send_invoice(xml_content)
            response_dto = await session.wait_until_invoice_processed(invoice_ref)
            response = KsefInvoiceResponse.from_dto(response_dto)
            return self.response_service.post(response)

    def _get_invoice_xml(self, invoice_id: int) -> str:
        db_data = self.invoice_service.get_invoice_data(invoice_id)
        invoice_obj = self.converter.map_db_data(db_data)
        return self.converter.generate_xml(invoice_obj)
