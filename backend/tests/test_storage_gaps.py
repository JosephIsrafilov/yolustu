import pytest
from unittest.mock import patch, MagicMock
import httpx


from app.core.config import UPLOADS_DIR, VERIFICATION_UPLOADS_DIR, settings
from app.core.storage import get_storage, LocalStorage, SupabaseStorage


def test_local_storage_bucket_dir():
    storage = LocalStorage()
    assert (
        storage._bucket_dir(settings.STORAGE_BUCKET_VERIFICATIONS)
        == VERIFICATION_UPLOADS_DIR
    )
    assert storage._bucket_dir("avatars") == UPLOADS_DIR
    assert storage._bucket_dir("random_bucket") == UPLOADS_DIR


def test_local_storage_upload_and_delete(tmp_path):
    with (
        patch("app.core.storage.UPLOADS_DIR", tmp_path / "uploads"),
        patch(
            "app.core.storage.VERIFICATION_UPLOADS_DIR",
            tmp_path / "verification_uploads",
        ),
        patch("app.core.storage.settings.BACKEND_URL", "http://testbackend"),
    ):
        storage = LocalStorage()
        file_data = b"hello world"
        filename = "test.txt"

        # Test upload to avatars
        url = storage.upload(file_data, filename, "text/plain", "avatars")
        assert url == "http://testbackend/uploads/test.txt"
        dest_file = tmp_path / "uploads" / filename
        assert dest_file.is_file()
        assert dest_file.read_bytes() == file_data

        # Test get_url
        assert (
            storage.get_url(filename, "avatars")
            == "http://testbackend/uploads/test.txt"
        )

        # Test get_local_path
        path = storage.get_local_path(filename, "avatars")
        assert path == dest_file

        # Test delete
        storage.delete(filename, "avatars")
        assert not dest_file.is_file()


def test_local_storage_get_local_path_fallback(tmp_path):
    with (
        patch("app.core.storage.UPLOADS_DIR", tmp_path / "uploads"),
        patch(
            "app.core.storage.VERIFICATION_UPLOADS_DIR",
            tmp_path / "verification_uploads",
        ),
    ):
        storage = LocalStorage()
        filename = "legacy.txt"

        # If no file exists, returns None
        assert storage.get_local_path(filename, "verifications") is None

        # If file exists in legacy uploads dir but not in primary verifications dir
        (tmp_path / "uploads").mkdir(parents=True, exist_ok=True)
        legacy_file = tmp_path / "uploads" / filename
        legacy_file.write_bytes(b"legacy")

        # Should fall back and find the legacy file
        assert storage.get_local_path(filename, "verifications") == legacy_file


def test_supabase_storage_missing_config():
    with (
        patch("app.core.storage.settings.SUPABASE_URL", ""),
        patch("app.core.storage.settings.SUPABASE_SERVICE_ROLE_KEY", ""),
    ):
        with pytest.raises(RuntimeError) as exc:
            SupabaseStorage()
        assert "SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set" in str(
            exc.value
        )


def test_supabase_storage_urls():
    with (
        patch("app.core.storage.settings.SUPABASE_URL", "https://xyz.supabase.co"),
        patch("app.core.storage.settings.SUPABASE_SERVICE_ROLE_KEY", "secret-key"),
    ):
        storage = SupabaseStorage()
        assert storage._headers() == {
            "Authorization": "Bearer secret-key",
            "apikey": "secret-key",
        }
        assert (
            storage._storage_url("mybucket", "file.jpg")
            == "https://xyz.supabase.co/storage/v1/object/mybucket/file.jpg"
        )
        assert (
            storage.get_url("file.jpg", "mybucket")
            == "https://xyz.supabase.co/storage/v1/object/public/mybucket/file.jpg"
        )


def test_supabase_storage_upload_success():
    with (
        patch("app.core.storage.settings.SUPABASE_URL", "https://xyz.supabase.co"),
        patch("app.core.storage.settings.SUPABASE_SERVICE_ROLE_KEY", "secret-key"),
    ):
        storage = SupabaseStorage()

        mock_response = MagicMock(spec=httpx.Response)
        mock_response.status_code = 200
        mock_response.raise_for_status.return_value = None

        with patch("httpx.post", return_value=mock_response) as mock_post:
            url = storage.upload(b"data", "file.jpg", "image/jpeg", "avatars")
            assert (
                url
                == "https://xyz.supabase.co/storage/v1/object/public/avatars/file.jpg"
            )
            mock_post.assert_called_once()


def test_supabase_storage_upload_conflict_upsert():
    with (
        patch("app.core.storage.settings.SUPABASE_URL", "https://xyz.supabase.co"),
        patch("app.core.storage.settings.SUPABASE_SERVICE_ROLE_KEY", "secret-key"),
    ):
        storage = SupabaseStorage()

        mock_response_conflict = MagicMock(spec=httpx.Response)
        mock_response_conflict.status_code = 409

        mock_response_success = MagicMock(spec=httpx.Response)
        mock_response_success.status_code = 200
        mock_response_success.raise_for_status.return_value = None

        with patch(
            "httpx.post", side_effect=[mock_response_conflict, mock_response_success]
        ) as mock_post:
            url = storage.upload(b"data", "file.jpg", "image/jpeg", "avatars")
            assert (
                url
                == "https://xyz.supabase.co/storage/v1/object/public/avatars/file.jpg"
            )
            assert mock_post.call_count == 2
            headers_sent = mock_post.call_args_list[1].kwargs["headers"]
            assert headers_sent.get("x-upsert") == "true"


def test_supabase_storage_get_signed_url():
    with (
        patch("app.core.storage.settings.SUPABASE_URL", "https://xyz.supabase.co"),
        patch("app.core.storage.settings.SUPABASE_SERVICE_ROLE_KEY", "secret-key"),
    ):
        storage = SupabaseStorage()

        mock_response = MagicMock(spec=httpx.Response)
        mock_response.status_code = 200
        mock_response.json.return_value = {"signedURL": "/temp/signed/url"}

        with patch("httpx.post", return_value=mock_response) as mock_post:
            url = storage.get_signed_url("file.jpg", "verifications", 1800)
            assert url == "https://xyz.supabase.co/temp/signed/url"
            mock_post.assert_called_once_with(
                "https://xyz.supabase.co/storage/v1/object/sign/verifications/file.jpg",
                json={"expiresIn": 1800},
                headers=storage._headers(),
                timeout=10,
            )


def test_supabase_storage_delete():
    with (
        patch("app.core.storage.settings.SUPABASE_URL", "https://xyz.supabase.co"),
        patch("app.core.storage.settings.SUPABASE_SERVICE_ROLE_KEY", "secret-key"),
    ):
        storage = SupabaseStorage()

        mock_response = MagicMock(spec=httpx.Response)
        mock_response.status_code = 200

        with patch("httpx.request", return_value=mock_response) as mock_request:
            storage.delete("file.jpg", "avatars")
            mock_request.assert_called_once_with(
                "DELETE",
                "https://xyz.supabase.co/storage/v1/object/avatars",
                json={"prefixes": ["file.jpg"]},
                headers=storage._headers(),
                timeout=10,
            )


def test_supabase_storage_delete_exception_handled():
    with (
        patch("app.core.storage.settings.SUPABASE_URL", "https://xyz.supabase.co"),
        patch("app.core.storage.settings.SUPABASE_SERVICE_ROLE_KEY", "secret-key"),
    ):
        storage = SupabaseStorage()

        with patch("httpx.request", side_effect=Exception("network error")):
            storage.delete("file.jpg", "avatars")  # should not raise


def test_get_storage_backends():
    with patch("app.core.storage.settings.ENVIRONMENT", "development"):
        assert isinstance(get_storage(), LocalStorage)

    with (
        patch("app.core.storage.settings.ENVIRONMENT", "production"),
        patch("app.core.storage.settings.SUPABASE_URL", "https://xyz.supabase.co"),
        patch("app.core.storage.settings.SUPABASE_SERVICE_ROLE_KEY", "secret-key"),
    ):
        assert isinstance(get_storage(), SupabaseStorage)
