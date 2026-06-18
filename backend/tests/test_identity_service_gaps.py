"""Service-layer unit tests for IdentityService — covers missed lines."""

import sys
import pytest
from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import cast
from types import SimpleNamespace
from unittest.mock import MagicMock
from uuid import UUID, uuid4

from fastapi import BackgroundTasks, HTTPException
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.security import get_password_hash
from app.domains.identity.dependencies import CurrentUser
from app.domains.identity.repositories import UserRepository
from app.domains.identity.schemas import LoginInput, UserCreate, UserUpdate
from app.domains.identity import services as identity_services
from app.domains.identity.services import IdentityService


@dataclass
class FakeUser:
    id: UUID
    phone: str
    email: str | None
    first_name: str
    last_name: str
    role: str
    hashed_password: str
    is_verified: bool = False
    is_email_verified: bool = False
    verification_status: str = "none"
    document_url: str | None = None
    created_at: datetime = field(default_factory=lambda: datetime.now(timezone.utc))
    rating: float = 5.0
    total_rides: int = 0


class FakeDb:
    def commit(self):
        pass

    def refresh(self, x):
        pass


class FakeUserRepo:
    def __init__(self):
        self.by_id: dict[UUID, FakeUser] = {}
        self.by_phone: dict[str, FakeUser] = {}
        self.by_email: dict[str, FakeUser] = {}
        self.db = FakeDb()
        self.device_tokens: list[tuple] = []

    def _add(self, user: FakeUser):
        self.by_id[user.id] = user
        self.by_phone[user.phone] = user
        if user.email:
            self.by_email[user.email] = user

    def get_by_id(self, user_id: UUID):
        return self.by_id.get(user_id)

    def get_by_phone(self, phone: str):
        return self.by_phone.get(phone)

    def get_by_email(self, email: str):
        return self.by_email.get(email)

    def create(self, user_in, hashed_password: str) -> FakeUser:
        u = FakeUser(
            id=uuid4(),
            phone=user_in.phone,
            email=user_in.email,
            first_name=user_in.first_name,
            last_name=user_in.last_name,
            role=user_in.role or "passenger",
            hashed_password=hashed_password,
        )
        self._add(u)
        return u

    def mark_verified(self, user: FakeUser) -> FakeUser:
        user.is_verified = True
        return user

    def update(self, user: FakeUser, user_in) -> FakeUser:
        for f in (
            "first_name",
            "last_name",
            "phone",
            "email",
            "role",
            "city",
            "bio",
            "avatar_url",
            "language",
        ):
            v = getattr(user_in, f, None)
            if v is not None:
                setattr(user, f, v)
        return user

    def add_device_token(self, user_id: UUID, token: str):
        self.device_tokens.append((user_id, token))

    def update_verification_status(self, user, status, document_url=None):
        user.verification_status = status
        if document_url:
            user.document_url = document_url
        return user


class FakeRedis:
    def __init__(self):
        self.store: dict[str, str] = {}
        self.ttls: dict[str, int] = {}

    def get(self, key):
        return self.store.get(key)

    def setex(self, key, ttl, value):
        self.store[key] = value
        self.ttls[key] = ttl
        return True

    def delete(self, key):
        self.store.pop(key, None)


def make_service():
    svc = IdentityService(db=cast(Session, None))
    repo = FakeUserRepo()
    svc.users = cast(UserRepository, repo)
    return svc, repo, FakeRedis()


def make_cu(user_id: UUID, role="passenger") -> CurrentUser:
    return CurrentUser(
        id=user_id,
        phone="+994000000000",
        first_name="T",
        last_name="U",
        role=role,
        is_verified=True,
        is_blocked=False,
    )


# request_otp
def test_request_otp_stores_key():
    svc, _, redis = make_service()
    r = svc.request_otp("+994501234567", redis)
    assert r["phone"] == "+994501234567"
    assert "otp:+994501234567" in redis.store
    assert redis.ttls["otp:+994501234567"] == 300


def test_request_otp_sms_disabled_stores_otp_without_sns(monkeypatch):
    svc, _, redis = make_service()

    monkeypatch.setattr(settings, "SMS_ENABLED", False)
    monkeypatch.setattr(identity_services.secrets, "randbelow", lambda _: 23456)

    response = svc.request_otp("+994501234567", redis)

    assert response == {
        "message": "OTP sent successfully",
        "phone": "+994501234567",
    }
    assert redis.store["otp:+994501234567"] == "123456"
    assert redis.ttls["otp:+994501234567"] == 300


def test_request_otp_sms_enabled_calls_sns_publish(monkeypatch, caplog):
    svc, _, redis = make_service()
    sns_client = MagicMock()
    boto3_client = MagicMock(return_value=sns_client)

    monkeypatch.setattr(settings, "SMS_ENABLED", True)
    monkeypatch.setattr(settings, "AWS_REGION", "eu-central-1")
    monkeypatch.setattr(settings, "AWS_ACCESS_KEY_ID", "")
    monkeypatch.setattr(settings, "AWS_SECRET_ACCESS_KEY", "")
    monkeypatch.setattr(settings, "SMS_SENDER_ID", "Yolmates")
    monkeypatch.setattr(identity_services.secrets, "randbelow", lambda _: 23456)
    monkeypatch.setitem(sys.modules, "boto3", SimpleNamespace(client=boto3_client))

    with caplog.at_level("INFO", logger="app.domains.identity.services"):
        response = svc.request_otp("+994513944224", redis)

    assert response == {
        "message": "OTP sent successfully",
        "phone": "+994513944224",
    }
    assert redis.store["otp:+994513944224"] == "123456"
    assert redis.ttls["otp:+994513944224"] == 300
    boto3_client.assert_called_once_with("sns", region_name="eu-central-1")
    sns_client.publish.assert_called_once_with(
        PhoneNumber="+994513944224",
        Message="Your Yolmates verification code is: 123456. It expires in 5 minutes.",
        MessageAttributes={
            "AWS.SNS.SMS.SMSType": {
                "DataType": "String",
                "StringValue": "Transactional",
            },
            "AWS.SNS.SMS.SenderID": {
                "DataType": "String",
                "StringValue": "Yolmates",
            },
        },
    )
    assert "OTP SMS sent to +994****4224" in caplog.text
    assert "123456" not in caplog.text


def test_request_otp_sms_enabled_sns_failure_raises_500(monkeypatch):
    svc, _, redis = make_service()
    sns_client = MagicMock()
    sns_client.publish.side_effect = RuntimeError("sns down")

    monkeypatch.setattr(settings, "SMS_ENABLED", True)
    monkeypatch.setattr(settings, "AWS_REGION", "eu-central-1")
    monkeypatch.setattr(settings, "AWS_ACCESS_KEY_ID", "")
    monkeypatch.setattr(settings, "AWS_SECRET_ACCESS_KEY", "")
    monkeypatch.setattr(settings, "SMS_SENDER_ID", "Yolmates")
    monkeypatch.setattr(identity_services.secrets, "randbelow", lambda _: 23456)
    monkeypatch.setitem(
        sys.modules,
        "boto3",
        SimpleNamespace(client=MagicMock(return_value=sns_client)),
    )

    with pytest.raises(HTTPException) as exc:
        svc.request_otp("+994513944224", redis)

    assert exc.value.status_code == 500
    assert exc.value.detail == "Failed to send OTP"
    assert redis.store["otp:+994513944224"] == "123456"
    assert redis.ttls["otp:+994513944224"] == 300


# verify_otp
def test_verify_otp_wrong_code_raises_400():
    svc, _, redis = make_service()
    redis.store["otp:+994501234567"] = "111111"
    with pytest.raises(HTTPException) as exc:
        svc.verify_otp("+994501234567", "000000", redis)
    assert exc.value.status_code == 400


def test_verify_otp_user_not_found_raises_404():
    svc, _, redis = make_service()
    redis.store["otp:+994501234567"] = "111111"
    with pytest.raises(HTTPException) as exc:
        svc.verify_otp("+994501234567", "111111", redis)
    assert exc.value.status_code == 404


def test_verify_otp_success():
    svc, repo, redis = make_service()
    u = FakeUser(
        id=uuid4(),
        phone="+994501234567",
        email=None,
        first_name="A",
        last_name="B",
        role="passenger",
        hashed_password="x",
    )
    repo._add(u)
    redis.store["otp:+994501234567"] = "111111"
    result = svc.verify_otp("+994501234567", "111111", redis)
    assert result["message"] == "Account verified successfully"
    assert u.is_verified is True


# register
def test_register_duplicate_phone_raises_400():
    svc, repo, redis = make_service()
    repo._add(
        FakeUser(
            id=uuid4(),
            phone="+994501234567",
            email=None,
            first_name="X",
            last_name="Y",
            role="passenger",
            hashed_password="x",
        )
    )
    with pytest.raises(HTTPException) as exc:
        svc.register(
            UserCreate(
                phone="+994501234567",
                email=None,
                first_name="A",
                last_name="B",
                password="password123",
            ),
            redis,
        )
    assert exc.value.status_code == 400


def test_register_duplicate_email_raises_400():
    svc, repo, redis = make_service()
    repo._add(
        FakeUser(
            id=uuid4(),
            phone="+994501234560",
            email="dup@x.com",
            first_name="X",
            last_name="Y",
            role="passenger",
            hashed_password="x",
        )
    )
    with pytest.raises(HTTPException) as exc:
        svc.register(
            UserCreate(
                phone="+994501234567",
                email="dup@x.com",
                first_name="A",
                last_name="B",
                password="password123",
            ),
            redis,
        )
    assert exc.value.status_code == 400


def test_register_success_returns_tokens():
    svc, _, redis = make_service()
    result = svc.register(
        UserCreate(
            phone="+994501234567",
            email=None,
            first_name="A",
            last_name="B",
            password="password123",
        ),
        redis,
    )
    assert "accessToken" in result
    assert "refreshToken" in result


# login
def test_login_unknown_phone_raises_401():
    svc, _, redis = make_service()
    with pytest.raises(HTTPException) as exc:
        svc.login(LoginInput(phone="+994999999999", password="pass"), redis)
    assert exc.value.status_code == 401


def test_login_wrong_password_raises_401():
    svc, repo, redis = make_service()
    repo._add(
        FakeUser(
            id=uuid4(),
            phone="+994501234567",
            email=None,
            first_name="A",
            last_name="B",
            role="passenger",
            hashed_password=get_password_hash("correct"),
        )
    )
    with pytest.raises(HTTPException) as exc:
        svc.login(LoginInput(phone="+994501234567", password="wrong"), redis)
    assert exc.value.status_code == 401


def test_login_success():
    svc, repo, redis = make_service()
    repo._add(
        FakeUser(
            id=uuid4(),
            phone="+994501234567",
            email=None,
            first_name="A",
            last_name="B",
            role="passenger",
            hashed_password=get_password_hash("password123"),
        )
    )
    result = svc.login(LoginInput(phone="+994501234567", password="password123"), redis)
    assert "accessToken" in result


# refresh_token
def test_refresh_missing_token_raises_401():
    svc, _, redis = make_service()
    with pytest.raises(HTTPException) as exc:
        svc.refresh_token("not-there", redis)
    assert exc.value.status_code == 401


def test_refresh_invalid_uuid_raises_401():
    svc, _, redis = make_service()
    redis.store["refresh_token:tok"] = "not-a-uuid"
    with pytest.raises(HTTPException) as exc:
        svc.refresh_token("tok", redis)
    assert exc.value.status_code == 401


def test_refresh_user_gone_raises_401():
    svc, _, redis = make_service()
    redis.store["refresh_token:tok"] = str(uuid4())
    with pytest.raises(HTTPException) as exc:
        svc.refresh_token("tok", redis)
    assert exc.value.status_code == 401


def test_refresh_success():
    svc, repo, redis = make_service()
    u = FakeUser(
        id=uuid4(),
        phone="+994501234567",
        email=None,
        first_name="A",
        last_name="B",
        role="passenger",
        hashed_password="x",
    )
    repo._add(u)
    redis.store["refresh_token:valid-tok"] = str(u.id)
    result = svc.refresh_token("valid-tok", redis)
    assert "accessToken" in result


# get_user
def test_get_user_not_found_raises_404():
    svc, _, _ = make_service()
    with pytest.raises(HTTPException) as exc:
        svc.get_user(uuid4())
    assert exc.value.status_code == 404


# update_current_user
def test_update_user_cannot_escalate_to_driver():
    svc, repo, _ = make_service()
    u = FakeUser(
        id=uuid4(),
        phone="+994501234567",
        email=None,
        first_name="A",
        last_name="B",
        role="passenger",
        hashed_password="x",
    )
    repo._add(u)
    with pytest.raises(HTTPException) as exc:
        svc.update_current_user(make_cu(u.id, "passenger"), UserUpdate(role="driver"))
    assert exc.value.status_code == 400


def test_update_user_duplicate_phone_raises_400():
    svc, repo, _ = make_service()
    u1 = FakeUser(
        id=uuid4(),
        phone="+994501111111",
        email=None,
        first_name="A",
        last_name="B",
        role="passenger",
        hashed_password="x",
    )
    u2 = FakeUser(
        id=uuid4(),
        phone="+994502222222",
        email=None,
        first_name="C",
        last_name="D",
        role="passenger",
        hashed_password="x",
    )
    repo._add(u1)
    repo._add(u2)
    with pytest.raises(HTTPException) as exc:
        svc.update_current_user(make_cu(u1.id), UserUpdate(phone="+994502222222"))
    assert exc.value.status_code == 400


def test_update_user_duplicate_email_raises_400():
    svc, repo, _ = make_service()
    u1 = FakeUser(
        id=uuid4(),
        phone="+994501111111",
        email="a@x.com",
        first_name="A",
        last_name="B",
        role="passenger",
        hashed_password="x",
    )
    u2 = FakeUser(
        id=uuid4(),
        phone="+994502222222",
        email="b@x.com",
        first_name="C",
        last_name="D",
        role="passenger",
        hashed_password="x",
    )
    repo._add(u1)
    repo._add(u2)
    with pytest.raises(HTTPException) as exc:
        svc.update_current_user(make_cu(u1.id), UserUpdate(email="b@x.com"))
    assert exc.value.status_code == 400


# register_device_token
def test_register_device_token():
    svc, repo, _ = make_service()
    uid = uuid4()
    svc.register_device_token(make_cu(uid), "push-token-abc")
    assert (uid, "push-token-abc") in repo.device_tokens


# request_password_reset
def test_request_password_reset_invalid_email_format():
    svc, _, redis = make_service()
    with pytest.raises(HTTPException) as exc:
        svc.request_password_reset("not-an-email", redis, BackgroundTasks())
    assert exc.value.status_code == 422


def test_request_password_reset_unknown_email():
    svc, _, redis = make_service()
    with pytest.raises(HTTPException) as exc:
        svc.request_password_reset("nobody@example.com", redis, BackgroundTasks())
    assert exc.value.status_code == 404


def test_request_password_reset_success():
    svc, repo, redis = make_service()
    u = FakeUser(
        id=uuid4(),
        phone="+994501234567",
        email="user@example.com",
        first_name="A",
        last_name="B",
        role="passenger",
        hashed_password="x",
    )
    repo._add(u)
    result = svc.request_password_reset("user@example.com", redis, BackgroundTasks())
    assert "message" in result


# reset_password
def test_reset_password_missing_code_raises_400():
    svc, _, redis = make_service()
    with pytest.raises(HTTPException) as exc:
        svc.reset_password("user@example.com", "code", "newpass123", redis)
    assert exc.value.status_code == 400


def test_reset_password_wrong_code_raises_400():
    svc, _, redis = make_service()
    redis.store["pwd_reset:user@example.com"] = "correct"
    with pytest.raises(HTTPException) as exc:
        svc.reset_password("user@example.com", "wrong", "newpass123", redis)
    assert exc.value.status_code == 400


def test_reset_password_user_not_found_raises_404():
    svc, _, redis = make_service()
    redis.store["pwd_reset:user@example.com"] = "correct"
    with pytest.raises(HTTPException) as exc:
        svc.reset_password("user@example.com", "correct", "newpass123", redis)
    assert exc.value.status_code == 404


def test_reset_password_success():
    svc, repo, redis = make_service()
    u = FakeUser(
        id=uuid4(),
        phone="+994501234567",
        email="user@example.com",
        first_name="A",
        last_name="B",
        role="passenger",
        hashed_password=get_password_hash("old"),
    )
    repo._add(u)
    redis.store["pwd_reset:user@example.com"] = "correct"
    result = svc.reset_password("user@example.com", "correct", "newpass123", redis)
    assert result["message"] == "Password reset successfully"


# request_email_verification
def test_request_email_verification_no_email_raises_400():
    svc, repo, redis = make_service()
    u = FakeUser(
        id=uuid4(),
        phone="+994501234567",
        email=None,
        first_name="A",
        last_name="B",
        role="passenger",
        hashed_password="x",
    )
    repo._add(u)
    with pytest.raises(HTTPException) as exc:
        svc.request_email_verification(make_cu(u.id), redis, BackgroundTasks())
    assert exc.value.status_code == 400


def test_request_email_verification_already_verified_raises_400():
    svc, repo, redis = make_service()
    u = FakeUser(
        id=uuid4(),
        phone="+994501234567",
        email="a@x.com",
        first_name="A",
        last_name="B",
        role="passenger",
        hashed_password="x",
        is_email_verified=True,
    )
    repo._add(u)
    with pytest.raises(HTTPException) as exc:
        svc.request_email_verification(make_cu(u.id), redis, BackgroundTasks())
    assert exc.value.status_code == 400


# verify_email
def test_verify_email_no_email_raises_400():
    svc, repo, redis = make_service()
    u = FakeUser(
        id=uuid4(),
        phone="+994501234567",
        email=None,
        first_name="A",
        last_name="B",
        role="passenger",
        hashed_password="x",
    )
    repo._add(u)
    with pytest.raises(HTTPException) as exc:
        svc.verify_email(make_cu(u.id), "111111", redis)
    assert exc.value.status_code == 400


def test_verify_email_wrong_code_raises_400():
    svc, repo, redis = make_service()
    u = FakeUser(
        id=uuid4(),
        phone="+994501234567",
        email="a@x.com",
        first_name="A",
        last_name="B",
        role="passenger",
        hashed_password="x",
    )
    repo._add(u)
    redis.store["email_verify:a@x.com"] = "correct"
    with pytest.raises(HTTPException) as exc:
        svc.verify_email(make_cu(u.id), "wrong", redis)
    assert exc.value.status_code == 400
