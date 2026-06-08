import '../../../core/network/api_result.dart';
import '../../../shared/models/user.dart';

abstract class AuthRepository {
  Future<ApiResult<User>> login({
    required String phoneNumber,
    required String password,
  });

  Future<ApiResult<void>> sendOtp(String phoneNumber);

  Future<ApiResult<User>> verifyOtp({
    required String phoneNumber,
    required String code,
  });

  Future<User?> getCurrentUser();

  Future<void> logout();
}
