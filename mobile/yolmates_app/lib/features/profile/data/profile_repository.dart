import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/config/app_config.dart';
import '../../../core/network/api_client.dart';
import '../../../core/network/api_endpoints.dart';
import '../../../core/network/api_result.dart';
import '../../../shared/mock/mock_data.dart';
import '../../../shared/models/user.dart';
import '../domain/profile_repository.dart';

class MockProfileRepository implements ProfileRepository {
  const MockProfileRepository();

  @override
  Future<User> getProfile() async {
    await Future<void>.delayed(const Duration(milliseconds: 120));
    return mockCurrentUser;
  }

  @override
  Future<ApiResult<User>> updateProfile(Map<String, dynamic> payload) async {
    await Future<void>.delayed(const Duration(milliseconds: 120));
    return ApiSuccess<User>(
      mockCurrentUser.copyWith(
        fullName: payload['full_name'] as String? ?? mockCurrentUser.fullName,
        city: payload['city'] as String? ?? mockCurrentUser.city,
        bio: payload['bio'] as String? ?? mockCurrentUser.bio,
      ),
    );
  }
}

class RealProfileRepository implements ProfileRepository {
  const RealProfileRepository(this._apiClient);

  final ApiClient _apiClient;

  @override
  Future<User> getProfile() async {
    final response = await _apiClient.dio.get<Map<String, dynamic>>(
      ApiEndpoints.me,
    );
    return User.fromJson(response.data ?? <String, dynamic>{});
  }

  @override
  Future<ApiResult<User>> updateProfile(Map<String, dynamic> payload) async {
    try {
      final response = await _apiClient.dio.put<Map<String, dynamic>>(
        ApiEndpoints.me,
        data: payload,
      );
      return ApiSuccess<User>(User.fromJson(response.data ?? <String, dynamic>{}));
    } catch (error) {
      return ApiFailure<User>('Failed to update profile: $error');
    }
  }
}

final profileRepositoryProvider = Provider<ProfileRepository>((ref) {
  if (AppConfig.isMockMode) {
    return const MockProfileRepository();
  }

  return RealProfileRepository(ref.watch(apiClientProvider));
});
