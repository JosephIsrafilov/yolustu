import 'app_user.dart';

/// Domain error surfaced to the UI for auth failures.
class AuthException implements Exception {
  final String message;
  const AuthException(this.message);

  @override
  String toString() => message;
}

/// Stable auth contract the UI/state layer depends on.
///
/// Swap [MockAuthRepository] for a real backend-backed implementation later
/// without touching screens or controllers.
abstract class AuthRepository {
  /// Returns the persisted user if a session exists, else null.
  Future<AppUser?> currentUser();

  /// Requests an OTP for [phone] (E.164, e.g. +994501234567).
  Future<void> sendOtp(String phone);

  /// Verifies [code] for [phone]. Throws [AuthException] on failure.
  /// On success persists and returns the user (possibly profile-incomplete).
  Future<AppUser> verifyOtp(String phone, String code);

  /// Persists profile fields and returns the updated user.
  Future<AppUser> updateProfile({
    required String firstName,
    required String lastName,
    String? avatarUrl,
    UserRole? role,
    AppLanguage? language,
  });

  /// Submits document verification for the user.
  Future<AppUser> submitVerification(String documentPath);

  /// Debug helper to approve the driver (mock repository only).
  Future<AppUser> mockApproveDriver();

  /// Clears the persisted session.
  Future<void> logout();
}
