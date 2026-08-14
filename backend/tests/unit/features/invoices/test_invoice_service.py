# --- Symulacja interakcji z bazą danych (zastąp rzeczywistymi wywołaniami DB) ---
from datetime import date
from decimal import Decimal

from features.invoices.invoice_models import SellerDTO
from features.invoices.invoice_service import InvoiceService
from shared.mariadb.mariadb_connection import MariaDBConnection


class MockDB(MariaDBConnection):
    def __init__(self):
        pass

    def fetchone(self, query, params: tuple):
        # Symulacja pobierania pojedynczego wiersza
        if "FROM Fakt F WHERE F.Id" in query:
            return {
                "Id": 1,
                "Rodzaj": "S",  # S - sprzedaż, K - korygująca
                "Numer": 123,
                "Sufiks": "/2024",
                "OddzialId": 1,
                "Data": date(2024, 1, 15),
                "DataSprz": date(2024, 1, 10),
                "KontrId": 101,
                "FPlatId": 6,  # Identyfikator formy płatności (np. 6 dla 'Przelew')
                "TermPlat": date(2024, 1, 30),
                "Opis": "Faktura sprzedaży",
                "IdFKor": None,
                "NumerFKor": None,
                "DataFKor": None,
            }
        elif "FROM Kontrah K WHERE K.Id" in query:
            return {
                "NIP": "5213031333",
                "Nazwa1": "Firma Klienta Sp. z o.o.",
                "Nazwa2": "",
                "Ulica": "Testowa",
                "Dom": "10",
                "Lokal": "5",
                "KodP": "00-001",
                "Miejsce": "Warszawa",
                "Telefon1": "123456789",
                "eMail": "klient@example.com",
                "NRB": "PL61109010140000071219812874",
            }
        elif "FROM Oddzialy O WHERE O.Id" in query:
            return {
                "Id": 1,
                "Symbol": "MAIN",
                "Nazwa": "Główny Oddział",
                "Ulica": "Centralna",
                "Dom": "1",
                "Lokal": "",
                "KodP": "00-000",
                "Miejsce": "Warszawa",
            }
        elif "FROM Slowniki WHERE Id = %s AND Rodzaj = 'FPL'" in query:
            # Mapowanie FPlatId na nazwy form płatności
            if params[0] == 1:
                return {"Nazwa": "Gotówka"}
            if params[0] == 2:
                return {"Nazwa": "Karta"}
            if params[0] == 3:
                return {"Nazwa": "Bon"}
            if params[0] == 4:
                return {"Nazwa": "Czek"}
            if params[0] == 5:
                return {"Nazwa": "Kredyt"}
            if params[0] == 6:
                return {"Nazwa": "Przelew"}
            if params[0] == 7:
                return {"Nazwa": "Mobilna"}
        return None

    def fetchall(self, query, params):
        # Symulacja pobierania wielu wierszy dla pozycji faktury
        if "FROM Fakts FS" in query:
            return [
                {
                    "Lp": 1,
                    "TowId": 1001,
                    "Ilosc": 2.0,
                    "JmId": 10,  # Identyfikator jednostki miary (np. 10 dla 'szt.')
                    "Cena": Decimal(100.00),
                    "StVat": "23",  # Stawka VAT jako string
                    "ItemOpis": "Opis towaru A",
                    "TowarNazwa": "Towar A",
                    "TowarSymbol": "TA-001",
                    "PKWiU": "20.13.24.0",
                    "VatProcent": 23,  # Procent VAT
                    "Jm": "szt.",
                },
                {
                    "Lp": 2,
                    "TowId": 1002,
                    "Ilosc": 1.0,
                    "JmId": 10,
                    "Cena": Decimal(50.00),
                    "StVat": "8",
                    "ItemOpis": "Opis usługi B",
                    "TowarNazwa": "Usługa B",
                    "TowarSymbol": "UB-002",
                    "PKWiU": "62.01.11.0",
                    "VatProcent": 8,
                    "Jm": "szt.",
                },
            ]
        return []


def test_get_invoice_data(seller_dto: SellerDTO):
    # Given: An InvoiceService
    invoice_service = InvoiceService(MockDB(), seller_dto)
    invoice_id = 1
    # When: An invoice is gotten
    invoice_data = invoice_service.get_invoice_data(invoice_id)
    # Then: The invoice data is returned
    assert invoice_data
    assert invoice_data.header
    assert invoice_data.items
    assert invoice_data.buyer
    assert invoice_data.seller
    assert invoice_data.payment_method_name
