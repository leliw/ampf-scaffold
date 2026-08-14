import datetime
from decimal import ROUND_HALF_UP, Decimal

from integrations.ksef.generated.schemat_fa_283_29_v1_0_e import (
    Faktura,
    Podmiot2Gv,
    Podmiot2Jst,
    Tadres,
    TformaPlatnosci,
    TkluczWartosc,
    TkodFormularza,
    TkodKraju,
    TkodWaluty,
    Tnaglowek,
    TnaglowekWariantFormularza,
    Tpodmiot1,
    Tpodmiot2,
    TrachunekBankowy,
    TrodzajFaktury,
    TstawkaPodatku,
    Twybor1,
    Twybor12,
)
from xsdata.formats.dataclass.serializers import XmlSerializer
from xsdata.formats.dataclass.serializers.config import SerializerConfig
from xsdata.models.datatype import XmlDateTime

from .invoice_models import InvoiceFullDTO

GROSZ = Decimal("0.01")


class KsefInvoiceConverter:
    @staticmethod
    def map_db_data(db_data: InvoiceFullDTO) -> Faktura:
        """
        Mapuje dane z bazy danych na obiekty dataclass Faktura.
        """
        header_data = db_data.header
        buyer_data = db_data.buyer
        seller_data = db_data.seller
        items_data = db_data.items
        payment_method_name = db_data.payment_method_name

        # Naglowek
        now = datetime.datetime.now(datetime.timezone.utc)
        naglowek = Tnaglowek(
            kod_formularza=Tnaglowek.KodFormularza(value=TkodFormularza.FA),
            wariant_formularza=TnaglowekWariantFormularza.VALUE_3,
            data_wytworzenia_fa=XmlDateTime.from_datetime(now),
            system_info="Hanza2",
        )

        # Podmiot1 (Sprzedawca)
        podmiot1_adres = Tadres(
            kod_kraju=TkodKraju.PL,
            adres_l1=f"{seller_data.ulica} {seller_data.dom}{f'/{seller_data.lokal}' if seller_data.lokal else ''}",
            adres_l2=f"{seller_data.kod_p} {seller_data.miejsce}",
        )
        podmiot1 = Faktura.Podmiot1(
            dane_identyfikacyjne=Tpodmiot1(nip=seller_data.nip, nazwa=seller_data.nazwa),
            adres=podmiot1_adres,
        )

        # Podmiot2 (Nabywca)
        podmiot2_adres = Tadres(
            kod_kraju=TkodKraju.PL,
            adres_l1=f"{buyer_data.ulica} {buyer_data.dom}{f'/{buyer_data.lokal}' if buyer_data.lokal else ''}",
            adres_l2=f"{buyer_data.kod_p} {buyer_data.miejsce}",
        )
        podmiot2 = Faktura.Podmiot2(
            dane_identyfikacyjne=Tpodmiot2(
                nip=buyer_data.nip.replace("-", ""),
                nazwa=f"{buyer_data.nazwa1} {buyer_data.nazwa2 or ''}".strip(),
            ),
            adres=podmiot2_adres,
            jst=Podmiot2Jst.VALUE_2,  # Zakładamy, że nie jest jednostką samorządu terytorialnego
            gv=Podmiot2Gv.VALUE_2,  # Zakładamy, że nie jest członkiem grupy VAT
        )

        # Pozycje faktury (FaWiersz)
        fa_wiersze = []
        total_net = Decimal("0.00")
        total_vat = Decimal("0.00")
        vat_summary = {
            "23": {"net": Decimal("0.00"), "vat": Decimal("0.00")},
            "8": {"net": Decimal("0.00"), "vat": Decimal("0.00")},
            "5": {"net": Decimal("0.00"), "vat": Decimal("0.00")},
            "0 KR": {"net": Decimal("0.00"), "vat": Decimal("0.00")},
            "0 WDT": {"net": Decimal("0.00"), "vat": Decimal("0.00")},
            "0 EX": {"net": Decimal("0.00"), "vat": Decimal("0.00")},
            "zw": {"net": Decimal("0.00"), "vat": Decimal("0.00")},
            "oo": {"net": Decimal("0.00"), "vat": Decimal("0.00")},
            "np I": {"net": Decimal("0.00"), "vat": Decimal("0.00")},
            "np II": {"net": Decimal("0.00"), "vat": Decimal("0.00")},
            "3": {"net": Decimal("0.00"), "vat": Decimal("0.00")},
            "4": {"net": Decimal("0.00"), "vat": Decimal("0.00")},
            "7": {"net": Decimal("0.00"), "vat": Decimal("0.00")},
            "22": {"net": Decimal("0.00"), "vat": Decimal("0.00")},
        }

        for item in items_data:
            net_value = (Decimal(str(item.ilosc)) * item.cena).quantize(GROSZ, rounding=ROUND_HALF_UP)
            vat_amount = (net_value * (item.vat_procent / Decimal("100.00"))).quantize(GROSZ, rounding=ROUND_HALF_UP)

            total_net += net_value
            total_vat += vat_amount

            # Mapowanie StVat na enum TstawkaPodatku
            stawka_vat_enum = None
            try:
                stawka_vat_enum = TstawkaPodatku(item.st_vat)
            except ValueError:
                # Obsługa przypadków, gdy StVat z DB może nie mapować się bezpośrednio do enuma
                if item.st_vat == "23%":
                    stawka_vat_enum = TstawkaPodatku.VALUE_23
                elif item.st_vat == "8%":
                    stawka_vat_enum = TstawkaPodatku.VALUE_8
                elif item.st_vat == "5%":
                    stawka_vat_enum = TstawkaPodatku.VALUE_5
                elif item.st_vat == "0 KR":
                    stawka_vat_enum = TstawkaPodatku.VALUE_0_KR
                elif item.st_vat == "0 WDT":
                    stawka_vat_enum = TstawkaPodatku.VALUE_0_WDT
                elif item.st_vat == "0 EX":
                    stawka_vat_enum = TstawkaPodatku.VALUE_0_EX
                elif item.st_vat == "zw":
                    stawka_vat_enum = TstawkaPodatku.ZW
                elif item.st_vat == "oo":
                    stawka_vat_enum = TstawkaPodatku.OO
                elif item.st_vat == "np I":
                    stawka_vat_enum = TstawkaPodatku.NP_I
                elif item.st_vat == "np II":
                    stawka_vat_enum = TstawkaPodatku.NP_II
                elif item.st_vat == "3%":
                    stawka_vat_enum = TstawkaPodatku.VALUE_3
                elif item.st_vat == "4%":
                    stawka_vat_enum = TstawkaPodatku.VALUE_4
                elif item.st_vat == "7%":
                    stawka_vat_enum = TstawkaPodatku.VALUE_7
                elif item.st_vat == "22%":
                    stawka_vat_enum = TstawkaPodatku.VALUE_22
                else:
                    print(f"Ostrzeżenie: Nieznana stawka VAT '{item.st_vat}'. Pomijam podsumowanie VAT dla tej stawki.")
                    continue

            if stawka_vat_enum:
                vat_summary[stawka_vat_enum.value]["net"] += net_value
                vat_summary[stawka_vat_enum.value]["vat"] += vat_amount

            fa_wiersze.append(
                Faktura.Fa.FaWiersz(
                    nr_wiersza_fa=item.lp,
                    p_7=item.towar_nazwa.strip()[:256],
                    indeks=item.towar_symbol,
                    pkwi_u=item.pkwiu or None,
                    p_8_a=item.jm,
                    p_8_b=f"{item.ilosc:.0f}",
                    p_9_a=f"{item.cena:.2f}",
                    p_11=f"{net_value:.2f}",
                    p_11_vat=f"{vat_amount:.2f}",
                    p_12=stawka_vat_enum,
                )
            )

        # Mapowanie nazwy formy płatności na enum TformaPlatnosci
        forma_platnosci_enum = None
        if payment_method_name == "gotówka":
            forma_platnosci_enum = TformaPlatnosci.VALUE_1
        elif payment_method_name == "Karta":
            forma_platnosci_enum = TformaPlatnosci.VALUE_2
        elif payment_method_name == "Bon":
            forma_platnosci_enum = TformaPlatnosci.VALUE_3
        elif payment_method_name == "Czek":
            forma_platnosci_enum = TformaPlatnosci.VALUE_4
        elif payment_method_name == "Kredyt":
            forma_platnosci_enum = TformaPlatnosci.VALUE_5
        elif payment_method_name == "przelew":
            forma_platnosci_enum = TformaPlatnosci.VALUE_6
        elif payment_method_name == "Mobilna":
            forma_platnosci_enum = TformaPlatnosci.VALUE_7
        else:
            print(f"Ostrzeżenie: Nieznana forma płatności '{payment_method_name}'. Używam domyślnej 'Przelew'.")
        if not forma_platnosci_enum:
            forma_platnosci_enum = TformaPlatnosci.VALUE_6  # Domyślnie Przelew

        # Fa (Główne dane faktury)
        fa = Faktura.Fa(
            kod_waluty=TkodWaluty.PLN,
            p_1=header_data.data.isoformat(),
            p_2=f"F{header_data.rodzaj}/{header_data.numer}/{header_data.sufiks}",
            p_6=header_data.data_sprz.isoformat(),
            p_13_1=f"{vat_summary['23']['net']:.2f}" if vat_summary["23"]["net"] > 0 else None,
            p_14_1=f"{vat_summary['23']['vat']:.2f}" if vat_summary["23"]["vat"] > 0 else None,
            p_13_2=f"{vat_summary['8']['net']:.2f}" if vat_summary["8"]["net"] > 0 else None,
            p_14_2=f"{vat_summary['8']['vat']:.2f}" if vat_summary["8"]["vat"] > 0 else None,
            p_13_3=f"{vat_summary['5']['net']:.2f}" if vat_summary["5"]["net"] > 0 else None,
            p_14_3=f"{vat_summary['5']['vat']:.2f}" if vat_summary["5"]["vat"] > 0 else None,
            p_13_6_1=f"{vat_summary['0 KR']['net']:.2f}" if vat_summary["0 KR"]["net"] > 0 else None,
            p_13_6_2=f"{vat_summary['0 WDT']['net']:.2f}" if vat_summary["0 WDT"]["net"] > 0 else None,
            p_13_6_3=f"{vat_summary['0 EX']['net']:.2f}" if vat_summary["0 EX"]["net"] > 0 else None,
            p_13_7=f"{vat_summary['zw']['net']:.2f}" if vat_summary["zw"]["net"] > 0 else None,
            p_13_8=f"{vat_summary['np I']['net']:.2f}" if vat_summary["np I"]["net"] > 0 else None,
            p_13_9=f"{vat_summary['np II']['net']:.2f}" if vat_summary["np II"]["net"] > 0 else None,
            p_13_10=f"{vat_summary['oo']['net']:.2f}" if vat_summary["oo"]["net"] > 0 else None,
            p_15=f"{(total_net + total_vat):.2f}",
            adnotacje=Faktura.Fa.Adnotacje(
                p_16=Twybor12.VALUE_2,  # Nie dotyczy metody kasowej
                p_17=Twybor12.VALUE_2,  # Nie dotyczy samofakturowania
                p_18=Twybor12.VALUE_2,  # Nie dotyczy odwrotnego obciążenia
                p_18_a=Twybor12.VALUE_2,  # Nie dotyczy mechanizmu podzielonej płatności
                zwolnienie=Faktura.Fa.Adnotacje.Zwolnienie(p_19_n=Twybor1.VALUE_1),  # Nie dotyczy zwolnienia
                nowe_srodki_transportu=Faktura.Fa.Adnotacje.NoweSrodkiTransportu(
                    p_22_n=Twybor1.VALUE_1
                ),  # Nie dotyczy nowych środków transportu
                p_23=Twybor12.VALUE_2,  # Nie dotyczy procedury uproszczonej
                pmarzy=Faktura.Fa.Adnotacje.Pmarzy(p_pmarzy_n=Twybor1.VALUE_1),  # Nie dotyczy procedur marży
            ),
            rodzaj_faktury=TrodzajFaktury.VAT if header_data.rodzaj == "S" else TrodzajFaktury.KOR,
            fa_wiersz=fa_wiersze,
            platnosc=Faktura.Fa.Platnosc(
                termin_platnosci=[Faktura.Fa.Platnosc.TerminPlatnosci(termin=header_data.term_plat.isoformat())],
                forma_platnosci=forma_platnosci_enum,
                rachunek_bankowy=[TrachunekBankowy(nr_rb=seller_data.bank_account)],
            ),
            dodatkowy_opis=[TkluczWartosc(klucz="Opis", wartosc=header_data.opis)] if header_data.opis else [],
        )
        if db_data.deposit and db_data.deposit > Decimal("0.00"):
            obciazenie = Faktura.Fa.Rozliczenie.Obciazenia(
                kwota=f"{db_data.deposit:.2f}",
                powod="Kaucja za opakowania zwrotne",
            )
            if fa.rozliczenie is None:
                fa.rozliczenie = Faktura.Fa.Rozliczenie(obciazenia=[obciazenie])
            else:
                fa.rozliczenie.obciazenia.append(obciazenie)
            fa.rozliczenie.do_zaplaty = f"{(total_net + total_vat + db_data.deposit):.2f}"
        # Utworzenie obiektu Faktura
        faktura = Faktura(naglowek=naglowek, podmiot1=podmiot1, podmiot2=podmiot2, fa=fa)

        return faktura

    @staticmethod
    def generate_xml(faktura_obj: Faktura) -> str:
        """
        Generuje string XML z obiektu Faktura.
        """
        config = SerializerConfig(pretty_print=True, xml_declaration=True, encoding="UTF-8")
        serializer = XmlSerializer(config=config)
        xml_output = serializer.render(faktura_obj)
        return xml_output
