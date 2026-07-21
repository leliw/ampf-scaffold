from ampf.auth import AuthConfig, DefaultUser, ResetPasswordMailConfig, SmtpConfig
from pydantic_settings import BaseSettings, SettingsConfigDict
from version import __version__


class AppConfig(BaseSettings):
    model_config = SettingsConfigDict(env_nested_delimiter="__")

    version: str = __version__
    production: bool = True

    data_dir: str = "./data/"

    auth: AuthConfig = AuthConfig(jwt_secret_key="")
    default_user: DefaultUser = DefaultUser(username="admin", password="")
    smtp: SmtpConfig = SmtpConfig()
    reset_password_mail: ResetPasswordMailConfig = ResetPasswordMailConfig()
