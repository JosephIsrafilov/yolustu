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

  /// Requests an OTP to the authenticated user's email.
  Future<void> requestEmailVerification();

  /// Verifies [code] for [phone]. Throws [AuthException] on failure.
  /// On success persists and returns the user (possibly profile-incomplete).
  Future<AppUser> verifyOtp(String phone, String code);

  /// Verifies [code] for the authenticated user's email.
  Future<AppUser> verifyEmailOtp(String code);

  /// Authenticate with phone and password. Returns user on success.
  Future<AppUser> loginWithPassword(String phone, String password);

  /// Register new user with password. Returns user on success.
  Future<AppUser> registerWithPassword({
    required String phone,
    String? email,
    required String password,
    required String firstName,
    required String lastName,
  });

  /// Persists profile fields and returns the updated user.
  Future<AppUser> updateProfile({
    String? firstName,
    String? lastName,
    String? email,
    String? phone,
    String? avatarUrl,
    UserRole? role,
    AppLanguage? language,
    DateTime? birthDate,
  });

  /// Submits document verification for the user.
  Future<AppUser> submitVerification(String documentPath);

  /// Requests a phone-based password reset OTP (mock `123456`).
  Future<void> requestPhonePasswordReset(String phone);

  /// Resets password using the phone-based OTP.
  Future<void> resetPasswordWithPhone({
    required String phone,
    required String code,
    required String newPassword,
  });

  /// Debug helper to approve the driver (mock repository only).
  Future<AppUser> mockApproveDriver();

  /// Clears the persisted session.
  Future<void> logout();
}
