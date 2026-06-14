"""
File storage abstraction.

Development:  LocalStorage  — writes files to the local filesystem under
              UPLOADS_DIR / VERIFICATION_UPLOADS_DIR (existing behaviour).
Production:   SupabaseStorage — uploads files to Supabase Storage via the
              REST API (no extra SDK required, just httpx which is already
              in requirements).

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
from pathlib import Path

import httpx

from app.core.config import UPLOADS_DIR, VERIFICATION_UPLOADS_DIR, settings


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


# ─────────────────────────────────────────────────────────────────────────────
# Local (development)
# ─────────────────────────────────────────────────────────────────────────────


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

    def upload(
        self, file_data: bytes, filename: str, content_type: str, bucket: str
    ) -> str:
        dest_dir = self._bucket_dir(bucket)
        dest_dir.mkdir(parents=True, exist_ok=True)
        (dest_dir / filename).write_bytes(file_data)
        base_url = str(settings.BACKEND_URL).rstrip("/")
        return f"{base_url}/uploads/{filename}"

    def get_url(self, filename: str, bucket: str) -> str:
        base_url = str(settings.BACKEND_URL).rstrip("/")
        return f"{base_url}/uploads/{filename}"

    def delete(self, filename: str, bucket: str) -> None:
        path = self._bucket_dir(bucket) / filename
        path.unlink(missing_ok=True)

    def get_local_path(self, filename: str, bucket: str) -> Path | None:
        """Return the local filesystem path (used by admin document endpoint)."""
        primary = self._bucket_dir(bucket) / filename
        if primary.is_file():
            return primary
        # Legacy fallback — files uploaded before bucket separation
        legacy = UPLOADS_DIR / filename
        return legacy if legacy.is_file() else None


# ─────────────────────────────────────────────────────────────────────────────
# Supabase Storage (production)
# ─────────────────────────────────────────────────────────────────────────────


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
        return f"{self._base}{signed_path}"

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
        except Exception:
            pass  # Best-effort — don't crash on delete failures


# ─────────────────────────────────────────────────────────────────────────────
# Factory
# ─────────────────────────────────────────────────────────────────────────────


def get_storage() -> StorageBackend:
    """
    Return the appropriate storage backend based on ENVIRONMENT.

    Development → LocalStorage (no credentials needed)
    Production  → SupabaseStorage
    """
    if settings.ENVIRONMENT == "production":
        return SupabaseStorage()
    return LocalStorage()
