from dataclasses import dataclass
from datetime import date
from decimal import Decimal
from typing import List, Optional

from pydantic import BaseModel


@dataclass
class InvoiceItemDTO:
    lp: int
    tow_id: int
    ilosc: Decimal
    jm_id: int
    cena: Decimal
    st_vat: str
    item_opis: Optional[str]
    towar_nazwa: str
    towar_symbol: str
    pkwiu: Optional[str]
    vat_procent: Decimal
    jm: str


@dataclass
class BuyerDTO:
    nip: str
    nazwa1: str
    nazwa2: Optional[str]
    ulica: str
    dom: str
    lokal: Optional[str]
    kod_p: str
    miejsce: str
    telefon1: Optional[str]
    email: Optional[str]
    nrb: Optional[str]


@dataclass
class SellerDTO:
    nip: str
    nazwa: str
    bank_account: str
    ulica: str
    dom: str
    lokal: Optional[str]
    kod_p: str
    miejsce: str


@dataclass
class InvoiceHeaderDTO:
    id: int
    rodzaj: str
    numer: str
    sufiks: str
    oddzial_id: int
    data: date
    data_sprz: date
    kontr_id: int
    f_plat_id: int
    term_plat: date
    opis: Optional[str]
    id_f_kor: Optional[int] = None
    numer_f_kor: Optional[str] = None
    data_f_kor: Optional[date] = None
    waluta: str = "PLN"
    kurs: Decimal = Decimal("1.0000")
    czy_mpp: bool = False
    przyczyna_korekty: Optional[str] = None
    ksef_id_pierwotnej: Optional[str] = None


@dataclass
class InvoiceFullDTO:
    header: InvoiceHeaderDTO
    items: List[InvoiceItemDTO]
    buyer: BuyerDTO
    seller: SellerDTO
    payment_method_name: str
    deposit: Optional[Decimal] = None

class InvoiceHeader(BaseModel):
    Id: int
    Rodzaj: str
    Numer: int
    Sufiks: str
    Data: date
    DataSprz: date
    NazwaS: str
