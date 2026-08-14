from features.invoices.invoice_models import SellerDTO
from features.invoices.invoice_service import InvoiceService
from features.invoices.ksef_invoice_converter import KsefInvoiceConverter

from tests.unit.features.invoices.test_invoice_service import MockDB


def test_generate_xml(seller_dto: SellerDTO):
    # Given: An invoice data
    invoice_service = InvoiceService(MockDB(), seller_dto)
    invoice_id = 1
    invoice_data = invoice_service.get_invoice_data(invoice_id)
    # When: The invoice data is mapped
    faktura_object = KsefInvoiceConverter.map_db_data(invoice_data)
    # And: XML is generated
    xml_invoice = KsefInvoiceConverter.generate_xml(faktura_object)
    # Then: XMl is returned
    assert xml_invoice
    assert xml_invoice.startswith("<?xml")
