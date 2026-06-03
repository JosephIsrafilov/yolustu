import '../../../core/network/api_result.dart';
import '../../../shared/models/user.dart';

abstract class ProfileRepository {
  Future<User> getProfile();

  Future<ApiResult<User>> updateProfile(Map<String, dynamic> payload);
}
