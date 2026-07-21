from enum import StrEnum


class Role(StrEnum):
    ADMIN = "admin"
    USER = "user"


ROLE_DESCRIPTIONS = {
    Role.ADMIN: "Admin user",
    Role.USER: "Standard user",
}
