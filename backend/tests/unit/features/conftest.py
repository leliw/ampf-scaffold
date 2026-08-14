from time import sleep

import httpx2
import pytest
import pytest_asyncio
from ampf.testing import ContainerFactory
from features.invoices.invoice_models import SellerDTO
from features.invoices.ksef_invoice_response_model import Base
from integrations.ksef.ksef_config import KsefConfig
from sqlalchemy import create_engine, text
from sqlalchemy.orm import Session, sessionmaker


@pytest_asyncio.fixture
async def async_client():
    async with httpx2.AsyncClient() as client:
        yield client


@pytest.fixture
def ksef_config() -> KsefConfig:
    return KsefConfig(
        base_url="https://api-test.ksef.mf.gov.pl/v2",
        token="20260409-EC-297A6F7000-AD8D046090-37|nip-9837666078|7bed954b28c844a5a382a6e4bcdd2ad8684025c2592a4b1fa4aaf4bce569eb44",
        nip="9837666078",
    )


@pytest.fixture
def seller_dto() -> SellerDTO:
    return SellerDTO(
        nip="9837666078",
        nazwa="Moja Firma Sp. z o.o.",
        bank_account="PL00100000000000000000000000",
        ulica="Wiejska",
        dom="6",
        lokal="",
        kod_p="80-299",
        miejsce="Gdańsk",
    )


@pytest.fixture(scope="session", autouse=True)
def mariadb_url(container_factory: ContainerFactory) -> str:
    """Fixture using the factory to start Chunker service."""
    url = container_factory(
        image="mariadb:10.6",
        name="unittest_mariadb",
        ports=["3306/tcp"],
        environment={"MYSQL_ROOT_PASSWORD": "p455w0rd"},
    )
    port = url.split(":")[-1]
    return f"mariadb+mariadbconnector://root:p455w0rd@127.0.0.1:{port}"


@pytest.fixture(scope="session")
def mariadb_database_url(mariadb_url: str) -> str:
    database_name = "test_db"
    sleep(5)
    try:
        engine = create_engine(mariadb_url, isolation_level="AUTOCOMMIT")
        with engine.connect() as conn:
            conn.execute(text(f"CREATE DATABASE IF NOT EXISTS {database_name}"))
        ret = f"{mariadb_url}/{database_name}"
        engine = create_engine(ret)
        Base.metadata.create_all(bind=engine)
        return ret
    except Exception as e:
        print(e)
        raise


@pytest.fixture(scope="session")
def db(mariadb_database_url: str) -> Session: # type: ignore
    engine = create_engine(
        mariadb_database_url,
        pool_size=5,
        max_overflow=10,
        pool_pre_ping=True,
        pool_recycle=3600,
    )
    session = sessionmaker(bind=engine, autoflush=True)
    db = session()
    try:
        yield db # type: ignore
    finally:
        db.close()