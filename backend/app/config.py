import os


class Settings:
    def __init__(self) -> None:
        self.app_name = os.getenv("APP_NAME", "VendorFlow AI")
        self.database_url = os.getenv(
            "DATABASE_URL",
            "postgresql://postgres:postgres@localhost:5432/vendorflow",
        )
        self.jwt_secret_key = os.getenv("JWT_SECRET_KEY", "dev-secret-key")
        self.jwt_algorithm = os.getenv("JWT_ALGORITHM", "HS256")


settings = Settings()
