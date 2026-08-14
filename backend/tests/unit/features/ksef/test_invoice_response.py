from features.invoices.ksef_invoice_response_model import KsefInvoiceResponse
from features.invoices.ksef_invoice_response_service import KsefInvoiceResponseService
from integrations.ksef.ksef_model import KsefInvoiceResponseDto
from sqlalchemy.orm import Session


def test_post(db: Session):
    # Given: A service
    service = KsefInvoiceResponseService(db)
    # And: A response
    dto = KsefInvoiceResponseDto.model_validate_json("""
{
    "ordinal_number": 1,
    "reference_number": "20260708-EE-487FDA2000-810BCF7DF5-D6",
    "invoice_hash": "lKD07dIXwd/ufEeob+kkCFQXCopj90424j+nOFcMo00=",
    "invoicing_date": "2026-07-08T21:07:01.154346Z",
    "status": {
        "code": 200,
        "description": "Sukces",
        "details": null,
        "extensions": null
    },
    "invoice_number": "FS/59/2026",
    "ksef_number": "8761723578-20260708-A28AFF400001-16",
    "acquisition_date": "2026-07-08T21:07:01.224052Z",
    "upo_download_url": "https://api.ksef.mf.gov.pl/storage/01/20260708-so-487fd3b000-e5abc3ef10-63/invoice-upo/upo_8761723578-20260708-A28AFF400001-16.xml?skoid=de8ba688-c575-439a-9df5-aa04c3157c03&sktid=647754c7-3974-4442-a425-c61341b61c69&skt=2026-07-08T19%3A13%3A04Z&ske=2026-07-15T19%3A13%3A04Z&sks=b&skv=2025-01-05&sv=2025-01-05&st=2026-07-08T21%3A02%3A02Z&se=2026-07-11T21%3A07%3A02Z&sr=b&sp=r&sig=tENwYBw7Qjhq%2BHbV31cOu8LlfeZyHB5jtsumpvqS6aY%3D",
    "upo_download_url_expiration_date": "2026-07-11T21:07:02.257865Z",
    "invoicing_mode": "Online"
}""")
    response = KsefInvoiceResponse.from_dto(dto)
    # When: It is saved in database
    ret = service.post(response)
    # Then: An autoincrement id is set
    assert ret.id
    # And: response is stored
    assert service.get(ret.id)

