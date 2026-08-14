import pytest
from features.invoices.invoice_models import SellerDTO
from features.invoices.invoice_service import InvoiceService
from features.invoices.ksef_invoice_converter import KsefInvoiceConverter
from features.invoices.ksef_invoice_response_service import KsefInvoiceResponseService
from features.invoices.ksef_invoice_service import KsefInvoiceService
from integrations.ksef.ksef_client import KsefClient
from integrations.ksef.ksef_model import KsefInvoiceResponseDto

from tests.unit.features.invoices.test_invoice_service import MockDB


@pytest.fixture
def ksef_invoice_service(async_client, ksef_config, seller_dto: SellerDTO) -> KsefInvoiceService:
    ksef_client = KsefClient(async_client, **ksef_config.model_dump())
    invoice_service = InvoiceService(MockDB(), seller_dto)
    response_service = KsefInvoiceResponseService(None) # type: ignore
    return KsefInvoiceService(invoice_service, response_service, ksef_client, KsefInvoiceConverter())


@pytest.mark.asyncio
async def test_send_invoice(ksef_invoice_service: KsefInvoiceService):
    # Given: KSEF invoice service
    # And: An invoice ID
    invoice_id = 1
    # When: An invoice is sent
    reference_number = await ksef_invoice_service.send_invoice(invoice_id)
    # Then: The number is returned
    assert reference_number is not None


@pytest.mark.skip("Session mock is needed")
@pytest.mark.asyncio
async def test_send_invoice_and_wait_for_processing(ksef_invoice_service: KsefInvoiceService):
    # Given: KSEF invoice service
    # And: An invoice ID
    invoice_id = 1
    # When: An invoice is sent
    status = await ksef_invoice_service.send_invoice_and_wait_for_processing(invoice_id)
    # Then: The number is returned
    assert status is not None
    assert isinstance(status, KsefInvoiceResponseDto)
