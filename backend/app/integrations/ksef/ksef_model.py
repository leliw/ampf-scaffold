from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class KsefAuthToken(BaseModel):
    token: str
    valid_until: datetime = Field(alias="validUntil")


class KsefRedeemResponse(BaseModel):
    access_token: KsefAuthToken = Field(alias="accessToken")


class KsefInvoiceProcessingStatusExtensions(BaseModel):
    original_session_reference_number: str | None = Field(None, alias="originalSessionReferenceNumber")
    original_ksef_number: str | None = Field(None, alias="originalKsefNumber")


class KsefInvoiceProcessingStatus(BaseModel):
    code: int
    description: str
    details: list[str] | None = None
    extensions: KsefInvoiceProcessingStatusExtensions | None = None


class KsefInvoiceResponseDto(BaseModel):
    model_config = ConfigDict(validate_by_name=True, validate_by_alias=True)

    # Pola wspólne dla wszystkich odpowiedzi
    ordinal_number: int = Field(..., alias="ordinalNumber")
    reference_number: str = Field(..., alias="referenceNumber")
    invoice_hash: str = Field(..., alias="invoiceHash")
    invoicing_date: datetime = Field(..., alias="invoicingDate")
    status: KsefInvoiceProcessingStatus

    # Pola opcjonalne (zależne od statusu)
    invoice_number: str | None = Field(None, alias="invoiceNumber")

    # Nowe pola dla statusu 200 (Sukces)
    ksef_number: str | None = Field(None, alias="ksefNumber")
    acquisition_date: datetime | None = Field(None, alias="acquisitionDate")
    upo_download_url: str | None = Field(None, alias="upoDownloadUrl")
    upo_download_url_expiration_date: datetime | None = Field(None, alias="upoDownloadUrlExpirationDate")
    invoicing_mode: str | None = Field(None, alias="invoicingMode")
