from pydantic import BaseModel

class LoginInput(BaseModel):
    phone: str
    password: str # For now, but Yolüstü mainly uses OTP
