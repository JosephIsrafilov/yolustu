"""
File storage abstraction.

Development:  LocalStorage  — writes files to the local filesystem under
              UPLOADS_DIR / VERIFICATION_UPLOADS_DIR (existing behaviour).
Production:   S3Storage — stores private objects in Amazon S3 using the EC2
              instance role. SupabaseStorage remains as a legacy option.

Usage
-----
    from app.core.storage import get_storage

    storage = get_storage()
    public_url = storage.upload(file_bytes, filename, content_type, bucket)
    storage.delete(filename, bucket)

Bucket constants come from settings:
    settings.STORAGE_BUCKET_AVATARS        → "avatars"
    settings.STORAGE_BUCKET_VERIFICATIONS  → "verifications"
"""

from abc import ABC, abstractmethod
import logging
from pathlib import Path

import httpx
import boto3

from app.core.config import UPLOADS_DIR, VERIFICATION_UPLOADS_DIR, settings

logger = logging.getLogger(__name__)


def _safe_path(directory: Path, filename: str) -> Path:
    if (
        not filename
        or filename in {".", ".."}
        or "/" in filename
        or "\\" in filename
        or Path(filename).is_absolute()
    ):
        raise ValueError("Unsafe storage filename")
    root = directory.resolve()
    candidate = (root / filename).resolve()
    if candidate.parent != root:
        raise ValueError("Unsafe storage filename")
    return candidate


class StorageBackend(ABC):
    """Abstract interface all storage backends must implement."""

    @abstractmethod
    def upload(
        self,
        file_data: bytes,
        filename: str,
        content_type: str,
        bucket: str,
    ) -> str:
        """Upload a file and return its public URL."""

    @abstractmethod
    def get_url(self, filename: str, bucket: str) -> str:
        """Return the public/signed URL for an already-uploaded file."""

    @abstractmethod
    def delete(self, filename: str, bucket: str) -> None:
        """Delete a file (best-effort, does not raise on missing)."""


class LocalStorage(StorageBackend):
    """
    Stores files on the local filesystem.

    Bucket routing:
      avatars       → UPLOADS_DIR
      verifications → VERIFICATION_UPLOADS_DIR
      *             → UPLOADS_DIR
    """

    def _bucket_dir(self, bucket: str) -> Path:
        if bucket == settings.STORAGE_BUCKET_VERIFICATIONS:
            return VERIFICATION_UPLOADS_DIR
        return UPLOADS_DIR

    def _bucket_url_path(self, bucket: str) -> str:
        """URL subpath for files in a given bucket."""
        if bucket == settings.STORAGE_BUCKET_VERIFICATIONS:
            return "uploads/verifications"
        return "uploads"

    def upload(
        self, file_data: bytes, filename: str, content_type: str, bucket: str
    ) -> str:
        dest_dir = self._bucket_dir(bucket)
        dest_dir.mkdir(parents=True, exist_ok=True)
        _safe_path(dest_dir, filename).write_bytes(file_data)
        base_url = str(settings.BACKEND_URL).rstrip("/")
        url_path = self._bucket_url_path(bucket)
        return f"{base_url}/{url_path}/{filename}"

    def get_url(self, filename: str, bucket: str) -> str:
        base_url = str(settings.BACKEND_URL).rstrip("/")
        url_path = self._bucket_url_path(bucket)
        return f"{base_url}/{url_path}/{filename}"

    def delete(self, filename: str, bucket: str) -> None:
        path = _safe_path(self._bucket_dir(bucket), filename)
        path.unlink(missing_ok=True)

    def get_local_path(self, filename: str, bucket: str) -> Path | None:
        """Return the local filesystem path (used by admin document endpoint)."""
        try:
            primary = _safe_path(self._bucket_dir(bucket), filename)
        except ValueError:
            return None
        if primary.is_file():
            return primary
        # Legacy fallback 1 — files uploaded before bucket/subdirectory separation
        legacy_verification = _safe_path(VERIFICATION_UPLOADS_DIR, filename)
        if legacy_verification.is_file():
            return legacy_verification
        # Legacy fallback 2 — files uploaded to old flat uploads/ dir
        legacy = _safe_path(UPLOADS_DIR, filename)
        return legacy if legacy.is_file() else None


class S3Storage(StorageBackend):
    """Private S3 object storage using logical bucket names as key prefixes."""

    def __init__(self) -> None:
        if not settings.AWS_S3_BUCKET:
            raise RuntimeError("AWS_S3_BUCKET must be set when STORAGE_BACKEND=s3.")
        self.bucket = settings.AWS_S3_BUCKET
        self.client = boto3.client("s3", region_name=settings.AWS_REGION)

    @staticmethod
    def _key(filename: str, bucket: str) -> str:
        _safe_path(Path("/storage"), filename)
        return f"{bucket.strip('/')}/{filename}"

    def upload(
        self, file_data: bytes, filename: str, content_type: str, bucket: str
    ) -> str:
        key = self._key(filename, bucket)
        self.client.put_object(
            Bucket=self.bucket,
            Key=key,
            Body=file_data,
            ContentType=content_type,
            ServerSideEncryption="AES256",
        )
        return self.get_url(filename, bucket)

    def get_url(self, filename: str, bucket: str) -> str:
        if bucket == settings.STORAGE_BUCKET_AVATARS:
            base_url = str(settings.BACKEND_URL).rstrip("/")
            return f"{base_url}/api/v1/users/avatar/{filename}"
        return filename

    def get_signed_url(self, filename: str, bucket: str, expires_in: int = 300) -> str:
        return self.client.generate_presigned_url(
            "get_object",
            Params={"Bucket": self.bucket, "Key": self._key(filename, bucket)},
            ExpiresIn=expires_in,
        )

    def delete(self, filename: str, bucket: str) -> None:
        try:
            self.client.delete_object(
                Bucket=self.bucket, Key=self._key(filename, bucket)
            )
        except Exception as exc:
            logger.warning(
                "S3 delete failed for bucket=%s object=%s: %s",
                bucket,
                filename,
                exc,
            )


class SupabaseStorage(StorageBackend):
    """
    Uploads files to Supabase Storage using the REST API.

    Requires SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in settings.
    Uses httpx (already a project dependency) — no extra SDK required.
    """

    def __init__(self) -> None:
        if not settings.SUPABASE_URL or not settings.SUPABASE_SERVICE_ROLE_KEY:
            raise RuntimeError(
                "SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in production."
            )
        self._base = settings.SUPABASE_URL.rstrip("/")
        self._key = settings.SUPABASE_SERVICE_ROLE_KEY

    def _headers(self) -> dict:
        return {
            "Authorization": f"Bearer {self._key}",
            "apikey": self._key,
        }

    def _storage_url(self, bucket: str, filename: str) -> str:
        return f"{self._base}/storage/v1/object/{bucket}/{filename}"

    def upload(
        self, file_data: bytes, filename: str, content_type: str, bucket: str
    ) -> str:
        url = self._storage_url(bucket, filename)
        headers = {**self._headers(), "Content-Type": content_type}
        response = httpx.post(url, content=file_data, headers=headers, timeout=30)
        # 200 = new upload, 409 = conflict (overwrite via upsert header)
        if response.status_code == 409:
            headers["x-upsert"] = "true"
            response = httpx.post(url, content=file_data, headers=headers, timeout=30)
        response.raise_for_status()
        return self.get_url(filename, bucket)

    def get_url(self, filename: str, bucket: str) -> str:
        if bucket == settings.STORAGE_BUCKET_VERIFICATIONS:
            return filename
        return f"{self._base}/storage/v1/object/public/{bucket}/{filename}"

    def get_signed_url(self, filename: str, bucket: str, expires_in: int = 3600) -> str:
        """Generate a time-limited signed URL (for private buckets like verifications)."""
        url = f"{self._base}/storage/v1/object/sign/{bucket}/{filename}"
        response = httpx.post(
            url,
            json={"expiresIn": expires_in},
            headers=self._headers(),
            timeout=10,
        )
        response.raise_for_status()
        signed_path = response.json()["signedURL"]
        if signed_path.startswith("/storage/v1/"):
            return f"{self._base}{signed_path}"
        return f"{self._base}/storage/v1{signed_path}"

    def delete(self, filename: str, bucket: str) -> None:
        url = f"{self._base}/storage/v1/object/{bucket}"
        try:
            httpx.request(
                "DELETE",
                url,
                json={"prefixes": [filename]},
                headers=self._headers(),
                timeout=10,
            ).raise_for_status()
        except Exception as exc:
            logger.warning(
                "Storage delete failed for bucket=%s object=%s: %s",
                bucket,
                filename,
                exc,
            )


def get_storage() -> StorageBackend:
    """
    Return the appropriate storage backend based on ENVIRONMENT and available
    credentials.

    Production + Supabase creds → SupabaseStorage
    Production without creds    → LocalStorage (files stored in Docker volume)
    Development                 → LocalStorage (no credentials needed)
    """
    backend = settings.STORAGE_BACKEND.lower()
    if backend == "s3":
        return S3Storage()
    if backend == "supabase":
        return SupabaseStorage()
    if backend != "local":
        raise RuntimeError(f"Unsupported STORAGE_BACKEND: {settings.STORAGE_BACKEND}")
    return LocalStorage()
