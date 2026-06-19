import logging
import secrets
from datetime import timedelta
from uuid import UUID

from fastapi import BackgroundTasks, HTTPException, status
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.email import send_email
from app.core.security import (
    create_access_token,
    create_refresh_token,
    get_password_hash,
    verify_password,
)
from app.domains.identity.dependencies import CurrentUser
from app.domains.identity.models import User
from app.domains.identity.repositories import UserRepository
from app.domains.identity.schemas import LoginInput, UserCreate, UserUpdate

logger = logging.getLogger(__name__)


def mask_phone_number(phone: str) -> str:
    if len(phone) <= 4:
        return "*" * len(phone)
    if len(phone) <= 8:
        return f"{phone[:2]}****{phone[-2:]}"
    return f"{phone[:4]}****{phone[-4:]}"


class IdentityService:
    def __init__(self, db: Session):
        self.users = UserRepository(db)

    def request_otp(self, phone: str, redis_client):
        self._send_otp(phone, redis_client)
        return {"message": "OTP sent successfully", "phone": phone}

    def verify_otp(self, phone: str, otp: str, redis_client):
        stored_otp = redis_client.get(f"otp:{phone}")
        stored_otp_str = (
            stored_otp.decode("utf-8") if isinstance(stored_otp, bytes) else stored_otp
        )
        if not stored_otp_str or stored_otp_str != otp:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid or expired OTP",
            )

        redis_client.delete(f"otp:{phone}")
        user = self.users.get_by_phone(phone)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        self.users.mark_verified(user)
        return {"message": "Account verified successfully"}

    def register(self, user_in: UserCreate, redis_client):
        if self.users.get_by_phone(user_in.phone):
            raise HTTPException(status_code=400, detail="Phone already registered")
        if user_in.email and self.users.get_by_email(user_in.email):
            raise HTTPException(status_code=400, detail="Email already registered")

        user = self.users.create(user_in, get_password_hash(user_in.password))
        # MVP: phone OTP gating removed. Accounts are active on registration;
        # email verification happens separately on the profile page. The SMS OTP
        # machinery (_send_otp / request_otp / verify_otp) is left intact for
        # later re-enablement.
        return self._create_auth_session(user, redis_client)

    def login(self, login_data: LoginInput, redis_client):
        user = self.users.get_by_phone(login_data.phone)

        if not user or not verify_password(login_data.password, user.hashed_password):  # type: ignore[arg-type]
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect phone or password",
            )

        return self._create_auth_session(user, redis_client)

    def refresh_token(self, refresh_token: str, redis_client):
        user_id_bytes = redis_client.get(f"refresh_token:{refresh_token}")
        if not user_id_bytes:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid or expired refresh token",
            )

        redis_client.delete(f"refresh_token:{refresh_token}")

        user_id_str = (
            user_id_bytes.decode("utf-8")
            if isinstance(user_id_bytes, bytes)
            else str(user_id_bytes)
        )
        try:
            user_id = UUID(user_id_str)
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token payload",
            )

        user = self.users.get_by_id(user_id)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid or expired refresh token",
            )

        return self._create_auth_session(user, redis_client)

    def _create_auth_session(self, user: User, redis_client):
        tokens = self._create_tokens(str(user.id), redis_client)
        return {
            "accessToken": tokens["access_token"],
            "refreshToken": tokens["refresh_token"],
            "user": user,
        }

    def _create_tokens(self, user_id_str: str, redis_client):
        access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(
            data={"sub": user_id_str}, expires_delta=access_token_expires
        )

        refresh_token = create_refresh_token()
        redis_client.setex(
            f"refresh_token:{refresh_token}", 30 * 24 * 60 * 60, user_id_str
        )

        return {
            "access_token": access_token,
            "refresh_token": refresh_token,
            "token_type": "bearer",
        }

    def get_user(self, user_id: UUID) -> User:
        user = self.users.get_by_id(user_id)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        return user

    def get_current_user_model(self, current_user: CurrentUser) -> User:
        return self.get_user(current_user.id)

    def update_current_user(
        self, current_user: CurrentUser, user_in: UserUpdate
    ) -> User:
        user = self.get_current_user_model(current_user)
        if user_in.role is not None:
            if user_in.role in {"driver", "admin"} and user_in.role != user.role:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Invalid role",
                )
            if user_in.role not in {"passenger", "driver", "admin"}:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Invalid role",
                )
        if (
            user_in.phone
            and user_in.phone != user.phone
            and self.users.get_by_phone(user_in.phone)
        ):
            raise HTTPException(status_code=400, detail="Phone already registered")

        if user_in.email and user_in.email != user.email:
            if self.users.get_by_email(user_in.email):
                raise HTTPException(status_code=400, detail="Email already registered")

        return self.users.update(user, user_in)

    def submit_verification(self, current_user: CurrentUser, document_url: str) -> User:
        user = self.get_current_user_model(current_user)
        user.role = "passenger"  # type: ignore[assignment]
        user.is_verified = False  # type: ignore[assignment]
        user.verification_ai_review = None  # type: ignore[assignment]
        return self.users.update_verification_status(user, "pending", document_url)

    def register_device_token(self, current_user: CurrentUser, token: str):
        self.users.add_device_token(current_user.id, token)

    @staticmethod
    def _send_otp(phone: str, redis_client):
        otp = (
            "123456"
            if not settings.SMS_ENABLED
            else str(secrets.randbelow(900000) + 100000)
        )
        redis_client.setex(f"otp:{phone}", 300, otp)
        if not settings.SMS_ENABLED:
            # ponytail: dev fallback — OTP visible in CloudWatch/stdout logs
            logger.info("SMS OTP (dev) for %s: %s", phone, otp)
            return otp

        try:
            import boto3

            client_kwargs = {"region_name": settings.AWS_REGION}
            if settings.AWS_ACCESS_KEY_ID and settings.AWS_SECRET_ACCESS_KEY:
                client_kwargs["aws_access_key_id"] = settings.AWS_ACCESS_KEY_ID
                client_kwargs["aws_secret_access_key"] = settings.AWS_SECRET_ACCESS_KEY

            sns = boto3.client("sns", **client_kwargs)
            message_attributes = {
                "AWS.SNS.SMS.SMSType": {
                    "DataType": "String",
                    "StringValue": "Transactional",
                }
            }
            if settings.SMS_SENDER_ID:
                message_attributes["AWS.SNS.SMS.SenderID"] = {
                    "DataType": "String",
                    "StringValue": settings.SMS_SENDER_ID,
                }

            sns.publish(
                PhoneNumber=phone,
                Message=(
                    f"Your Yolmates verification code is: {otp}. "
                    "It expires in 5 minutes."
                ),
                MessageAttributes=message_attributes,
            )
        except Exception:
            logger.exception("SNS SMS failed for %s", mask_phone_number(phone))
            raise HTTPException(status_code=500, detail="Failed to send OTP")

        logger.info("OTP SMS sent to %s", mask_phone_number(phone))
        return otp

    def request_password_reset(
        self, email: str, redis_client, background_tasks: BackgroundTasks
    ):
        import re

        email = email.strip().lower()
        if not re.match(r"^[\w\.-]+@[\w\.-]+\.\w+$", email):
            raise HTTPException(status_code=422, detail="Invalid email format")

        user = self.users.get_by_email(email)
        if not user:
            raise HTTPException(
                status_code=404, detail="No account found with this email."
            )

        self._send_email_code(email, redis_client)
        return {
            "message": "If this email is registered, you will receive a reset code."
        }

    def reset_password(self, email: str, code: str, new_password: str, redis_client):
        stored_code = redis_client.get(f"pwd_reset:{email}")

        stored_code_str = (
            stored_code.decode("utf-8")
            if isinstance(stored_code, bytes)
            else stored_code
        )

        if not stored_code_str or stored_code_str != code:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid or expired reset code",
            )

        user = self.users.get_by_email(email)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        user.hashed_password = get_password_hash(new_password)  # type: ignore[assignment]
        self.users.db.commit()

        redis_client.delete(f"pwd_reset:{email}")
        return {"message": "Password reset successfully"}

    def request_phone_password_reset(self, phone: str, redis_client):
        user = self.users.get_by_phone(phone)
        if not user:
            raise HTTPException(
                status_code=404, detail="No account found with this phone."
            )

        otp = "123456"
        redis_client.setex(f"pwd_reset_phone:{phone}", 600, otp)
        logger.info("Phone password reset OTP (mock) for %s: %s", phone, otp)
        return {
            "message": "Password reset OTP sent to phone.",
            "otp": otp,
        }

    def reset_password_phone(
        self, phone: str, code: str, new_password: str, redis_client
    ):
        stored_code = redis_client.get(f"pwd_reset_phone:{phone}")
        stored_code_str = (
            stored_code.decode("utf-8")
            if isinstance(stored_code, bytes)
            else stored_code
        )

        if not stored_code_str or stored_code_str != code:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid or expired reset code",
            )

        user = self.users.get_by_phone(phone)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        user.hashed_password = get_password_hash(new_password)  # type: ignore[assignment]
        self.users.db.commit()

        redis_client.delete(f"pwd_reset_phone:{phone}")
        return {"message": "Password reset successfully"}

    @staticmethod
    def _send_email_code(email: str, redis_client):
        from app.core.email import send_email

        otp = str(secrets.randbelow(900000) + 100000)
        redis_client.setex(f"pwd_reset:{email}", 600, otp)  # 10 mins expiry

        send_email(
            to_email=email,
            subject="Yolmates - Password Reset Code",
            html_content=f"<p>Your password reset code is: <strong>{otp}</strong></p><p>This code expires in 10 minutes.</p>",
            text_content=f"Your password reset code is: {otp}\n\nThis code expires in 10 minutes.",
        )

        logger.info("Password reset OTP generated for %s", email)
        return otp

    def request_email_verification(
        self,
        current_user: CurrentUser,
        redis_client,
        background_tasks: BackgroundTasks,
    ):
        user = self.get_current_user_model(current_user)
        if not user.email:
            raise HTTPException(status_code=400, detail="No email address on file")
        if user.is_email_verified:
            raise HTTPException(status_code=400, detail="Email is already verified")

        background_tasks.add_task(
            self._send_email_verify_code, user.email, redis_client
        )

        return {"message": "Verification code sent to your email"}

    def verify_email(self, current_user: CurrentUser, otp: str, redis_client):
        user = self.get_current_user_model(current_user)
        if not user.email:
            raise HTTPException(status_code=400, detail="No email address on file")

        stored_code = redis_client.get(f"email_verify:{user.email}")
        stored_code_str = (
            stored_code.decode("utf-8")
            if isinstance(stored_code, bytes)
            else stored_code
        )

        if not stored_code_str or stored_code_str != otp:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid or expired verification code",
            )

        user.is_email_verified = True  # type: ignore[assignment]
        self.users.db.commit()
        self.users.db.refresh(user)
        redis_client.delete(f"email_verify:{user.email}")

        return user

    @staticmethod
    def _send_email_verify_code(email: str, redis_client):
        otp = str(secrets.randbelow(900000) + 100000)
        redis_client.setex(f"email_verify:{email}", 600, otp)

        subject = "Yolmates - Verify your email"
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <style>
                body {{
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
                    background-color: #f5f8fa;
                    margin: 0;
                    padding: 0;
                }}
                .container {{
                    max-width: 600px;
                    margin: 40px auto;
                    background: #ffffff;
                    border-radius: 16px;
                    box-shadow: 0 4px 24px rgba(0,0,0,0.06);
                    overflow: hidden;
                }}
                .header {{
                    background-color: #054752;
                    padding: 32px 24px;
                    text-align: center;
                }}
                .header h1 {{
                    color: #ffffff;
                    margin: 0;
                    font-size: 28px;
                    font-weight: 800;
                    letter-spacing: -0.5px;
                }}
                .content {{
                    padding: 40px 32px;
                    color: #1a202c;
                    line-height: 1.6;
                }}
                .content h2 {{
                    color: #054752;
                    font-size: 20px;
                    margin-top: 0;
                    margin-bottom: 16px;
                }}
                .otp-box {{
                    background-color: #f0fdf4;
                    border: 2px dashed #16a34a;
                    border-radius: 12px;
                    padding: 24px;
                    text-align: center;
                    margin: 32px 0;
                }}
                .otp-code {{
                    font-size: 36px;
                    font-weight: 800;
                    color: #16a34a;
                    letter-spacing: 8px;
                    font-family: monospace;
                }}
                .footer {{
                    background-color: #f8fafc;
                    padding: 24px;
                    text-align: center;
                    color: #64748b;
                    font-size: 13px;
                    border-top: 1px solid #e2e8f0;
                }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>Yolmates</h1>
                </div>
                <div class="content">
                    <h2>Verify Your Email</h2>
                    <p>Hello,</p>
                    <p>Please use the verification code below to confirm your email address and secure your Yolmates account.</p>
                    
                    <div class="otp-box">
                        <div class="otp-code">{otp}</div>
                    </div>
                    
                    <p>This code will expire in <strong>10 minutes</strong>. If you did not request this verification, please ignore this email.</p>
                </div>
                <div class="footer">
                    <p>&copy; 2026 Yolmates. All rights reserved.</p>
                </div>
            </div>
        </body>
        </html>
        """
        text_content = f"Your email verification code is: {otp}\n\nThis code will expire in 10 minutes."

        send_email(
            to_email=email,
            subject=subject,
            html_content=html_content,
            text_content=text_content,
        )

        logger.info("Email verification simulation for %s: %s", email, otp)
        return otp
