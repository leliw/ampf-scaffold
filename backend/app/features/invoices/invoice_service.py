from decimal import Decimal

from shared.mariadb import MariaDBConnection

from .invoice_models import BuyerDTO, InvoiceFullDTO, InvoiceHeader, InvoiceHeaderDTO, InvoiceItemDTO, SellerDTO


class InvoiceService:
    def __init__(self, db_connection: MariaDBConnection, seller_dto: SellerDTO):
        self.db_connection = db_connection
        # Dane sprzedawcy (firmy wystawiającej fakturę) - placeholder
        self.seller_dto = seller_dto

    def get_invoice_data(self, invoice_id: int) -> InvoiceFullDTO:
        """
        Pobiera dane faktury z symulowanej bazy danych.
        W rzeczywistym kodzie należy zastąpić to rzeczywistymi wywołaniami do bazy danych.
        """
        invoice_header = self.db_connection.fetchone(
            "SELECT F.Id, F.Rodzaj, F.Numer, F.Sufiks, F.OddzialId, F.Data, F.DataSprz, F.KontrId, F.FPlatId, F.TermPlat, F.Opis, F.IdFKor, F.NumerFKor, F.DataFKor FROM Fakt F WHERE F.Id = %s;",
            (invoice_id,),
        )
        if not invoice_header:
            raise ValueError(f"Invoice with ID {invoice_id} not found.")

        invoice_items = self.db_connection.fetchall(
            """
            SELECT
                FS.Lp, FS.TowId, FS.Ilosc, FS.JmId, FS.Cena, FS.StVat, FS.Opis AS ItemOpis,
                T.Nazwa AS TowarNazwa, T.Symbol1 AS TowarSymbol, T.PKWiU,
                SV.Procent AS VatProcent,
                JM.Symbol AS Jm
            FROM Fakts FS
            JOIN Towary T ON FS.TowId = T.Id
            JOIN StVat SV ON FS.StVat = SV.StVat
            JOIN Slowniki JM ON FS.JmId = JM.Id AND JM.Rodzaj = 'JMia'
            WHERE FS.FaktId = %s
            ORDER BY FS.Lp;
            """,
            (invoice_id,),
        )

        buyer_data = self.db_connection.fetchone(
            "SELECT K.NIP, K.Nazwa1, K.Nazwa2, K.Ulica, K.Dom, K.Lokal, K.KodP, K.Miejsce, K.Telefon1, K.eMail, K.NRB FROM Kontrah K WHERE K.Id = %s;",
            (invoice_header["KontrId"],),
        )
        if not buyer_data:
            raise ValueError(f"Buyer with ID {invoice_header['KontrId']} not found.")

        payment_method_data = self.db_connection.fetchone(
            "SELECT Nazwa FROM Slowniki WHERE Id = %s AND Rodzaj = 'FPLA';",
            (invoice_header["FPlatId"],),
        )
        payment_method_name = payment_method_data["Nazwa"] if payment_method_data else "Nieokreślona"

        header_dto = InvoiceHeaderDTO(
            id=invoice_header["Id"],
            rodzaj=invoice_header["Rodzaj"],
            numer=invoice_header["Numer"],
            sufiks=invoice_header["Sufiks"],
            oddzial_id=invoice_header["OddzialId"],
            data=invoice_header["Data"],
            data_sprz=invoice_header["DataSprz"],
            kontr_id=invoice_header["KontrId"],
            f_plat_id=invoice_header["FPlatId"],
            term_plat=invoice_header["TermPlat"],
            opis=invoice_header["Opis"],
            id_f_kor=invoice_header.get("IdFKor"),
            numer_f_kor=invoice_header.get("NumerFKor"),
            data_f_kor=invoice_header.get("DataFKor"),
        )

        items_dto = [
            InvoiceItemDTO(
                lp=item["Lp"],
                tow_id=item["TowId"],
                ilosc=item["Ilosc"],
                jm_id=item["JmId"],
                cena=item["Cena"],
                st_vat=item["StVat"],
                item_opis=item["ItemOpis"],
                towar_nazwa=item["TowarNazwa"],
                towar_symbol=item["TowarSymbol"],
                pkwiu=item["PKWiU"],
                vat_procent=item["VatProcent"],
                jm=item["Jm"],
            )
            for item in invoice_items
            if item["StVat"] != "np"  # Pomijamy opakowania zwrotne
        ]
        deposit = 0
        for item in invoice_items:
            if item["StVat"] == "np":
                deposit += item["Cena"] * Decimal(str(item["Ilosc"]))
        buyer_dto = BuyerDTO(
            nip=buyer_data["NIP"],
            nazwa1=buyer_data["Nazwa1"],
            nazwa2=buyer_data.get("Nazwa2"),
            ulica=buyer_data["Ulica"],
            dom=buyer_data["Dom"],
            lokal=buyer_data.get("Lokal"),
            kod_p=buyer_data["KodP"],
            miejsce=buyer_data["Miejsce"],
            telefon1=buyer_data.get("Telefon1"),
            email=buyer_data.get("eMail"),
            nrb=buyer_data.get("NRB"),
        )

        return InvoiceFullDTO(
            header=header_dto,
            items=items_dto,
            buyer=buyer_dto,
            seller=self.seller_dto,
            payment_method_name=payment_method_name,
            deposit=Decimal(f"{deposit:.2f}") if deposit > 0 else None,
        )

    def get_all(self, invoice_id: int) -> list[InvoiceHeader]:
        return [
            InvoiceHeader.model_validate(r)
            for r in self.db_connection.fetchall(
                """
            SELECT F.Id, F.Rodzaj, F.Numer, F.Sufiks, F.Data, F.DataSprz, K.NazwaS, F.FPlatId, F.TermPlat, F.Opis, F.IdFKor, F.NumerFKor, F.DataFKor 
                FROM Fakt F join Kontrah K on F.KontrId = K.Id
                WHERE F.Id > %s
                ORDER BY F.Data asc, F.Numer asc
            ;
            """,
                (invoice_id,),
            )
        ]
