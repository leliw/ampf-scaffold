from datetime import datetime, timezone
from typing import Self

from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column
from sqlalchemy import JSON, DateTime, String, text

from integrations.ksef.ksef_model import KsefInvoiceProcessingStatusExtensions, KsefInvoiceResponseDto


class Base(DeclarativeBase):
    pass


class KsefInvoiceResponse(Base):
    __tablename__ = "ksef_invoice_response"
    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)

    # Pola wspólne
    ordinal_number: Mapped[int]
    reference_number: Mapped[str] = mapped_column(String(100), unique=True, index=True)
    invoice_hash: Mapped[str] = mapped_column(String(255))
    invoicing_date: Mapped[datetime]

    # Status
    status_code: Mapped[int]
    status_description: Mapped[str] = mapped_column(String(500))
    status_details: Mapped[list[str] | None] = mapped_column(JSON, nullable=True)

    # Extensions
    original_session_reference_number: Mapped[str | None] = mapped_column(String(100), nullable=True)
    original_ksef_number: Mapped[str | None] = mapped_column(String(100), nullable=True)

    # Pola sukcesu (status 200)
    invoice_number: Mapped[str | None] = mapped_column(String(100), nullable=True)
    ksef_number: Mapped[str | None] = mapped_column(String(50), nullable=True, index=True)
    acquisition_date: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    upo_download_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    upo_download_url_expiration_date: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    invoicing_mode: Mapped[str | None] = mapped_column(String(50), nullable=True)

    # Dodatkowe przydatne pola
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=lambda: datetime.now(timezone.utc), server_default=text("CURRENT_TIMESTAMP")
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        server_default=text("CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP"),
    )

    # Opcjonalnie: pełne oryginalne dane jako JSON
    raw_response: Mapped[dict | None] = mapped_column(JSON, nullable=True)

    @classmethod
    def from_dto(cls, dto: KsefInvoiceResponseDto) -> Self:
        status = dto.status
        ext = status.extensions or KsefInvoiceProcessingStatusExtensions()  # pyright: ignore[reportCallIssue]

        return cls(
            ordinal_number=dto.ordinal_number,
            reference_number=dto.reference_number,
            invoice_hash=dto.invoice_hash,
            invoicing_date=dto.invoicing_date,
            status_code=status.code,
            status_description=status.description,
            status_details=status.details,
            original_session_reference_number=ext.original_session_reference_number,
            original_ksef_number=ext.original_ksef_number,
            invoice_number=dto.invoice_number,
            ksef_number=dto.ksef_number,
            acquisition_date=dto.acquisition_date,
            upo_download_url=dto.upo_download_url,
            upo_download_url_expiration_date=dto.upo_download_url_expiration_date,
            invoicing_mode=dto.invoicing_mode,
        )
