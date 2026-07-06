from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    database_url: str
    jwt_secret_key: str
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    refresh_token_expire_days: int = 7

    sendgrid_api_key: str = ""
    sendgrid_from_email: str = ""
    twilio_account_sid: str = ""
    twilio_auth_token: str = ""
    twilio_from_number: str = ""

    google_maps_api_key: str = ""
    environment: str = "development"

    class Config:
        env_file = ".env"


settings = Settings()
