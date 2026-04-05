import jwt
import os
from dotenv import load_dotenv
load_dotenv()

QR_SECRET = os.getenv("QR_SECRET", "qr_secret_fuerza_fit_2024")

def generate_member_qr_token(member_id: int) -> str:
    payload = {"member_id": member_id, "type": "gym_qr"}
    return jwt.encode(payload, QR_SECRET, algorithm="HS256")

def validate_member_qr_token(token: str) -> int:
    try:
        payload = jwt.decode(token, QR_SECRET, algorithms=["HS256"])
        if payload.get("type") != "gym_qr":
            raise ValueError("Token inválido")
        return payload["member_id"]
    except jwt.InvalidTokenError:
        raise ValueError("QR inválido o manipulado")