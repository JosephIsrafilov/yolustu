from pydantic import BaseModel

class LoginInput(BaseModel):
    phone: str
    password: str
