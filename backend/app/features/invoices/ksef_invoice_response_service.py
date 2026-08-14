from sqlalchemy.orm import Session

from .ksef_invoice_response_model import KsefInvoiceResponse


class KsefInvoiceResponseService:
    def __init__(self, db: Session) -> None:
        self.db = db

    def post(self, value: KsefInvoiceResponse) -> KsefInvoiceResponse:
        self.db.add(value)
        self.db.commit()
        self.db.refresh(value)
        return value

    def get(self, key: int)  -> KsefInvoiceResponse:
        ret = self.db.query(KsefInvoiceResponse).filter(KsefInvoiceResponse.id == key).first()
        if not ret:
            raise ValueError(f"KsefInvoiceResponse with id {key} not found")
        return ret