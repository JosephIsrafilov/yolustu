import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/config/app_config.dart';
import '../../../core/network/api_client.dart';
import '../../../core/network/api_endpoints.dart';
import '../../../core/network/api_result.dart';
import '../../../shared/mock/mock_data.dart';
import '../../../shared/models/review.dart';
import '../domain/review_repository.dart';

class MockReviewRepository implements ReviewRepository {
  const MockReviewRepository();

  @override
  Future<ApiResult<Review>> createReview(Map<String, dynamic> payload) async {
    await Future<void>.delayed(const Duration(milliseconds: 120));
    return ApiSuccess<Review>(
      Review(
        id: 'review-created',
        author: mockCurrentUser,
        rating: (payload['rating'] as num? ?? 5).toDouble(),
        comment: payload['comment'] as String? ?? '',
        createdAt: DateTime.now(),
      ),
    );
  }

  @override
  Future<List<Review>> getReviews() async {
    await Future<void>.delayed(const Duration(milliseconds: 120));
    return mockReviews;
  }
}

class RealReviewRepository implements ReviewRepository {
  const RealReviewRepository(this._apiClient);

  final ApiClient _apiClient;

  @override
  Future<ApiResult<Review>> createReview(Map<String, dynamic> payload) async {
    try {
      final response = await _apiClient.dio.post<Map<String, dynamic>>(
        ApiEndpoints.reviews,
        data: payload,
      );
      return ApiSuccess<Review>(
        Review.fromJson(response.data ?? <String, dynamic>{}),
      );
    } catch (error) {
      return ApiFailure<Review>('Failed to create review: $error');
    }
  }

  @override
  Future<List<Review>> getReviews() async {
    try {
      final response = await _apiClient.dio.get<List<dynamic>>(
        ApiEndpoints.reviews,
      );
      return response.data
              ?.whereType<Map<String, dynamic>>()
              .map(Review.fromJson)
              .toList() ??
          <Review>[];
    } catch (error) {
      throw Exception('Unable to load reviews: $error');
    }
  }
}

final reviewRepositoryProvider = Provider<ReviewRepository>((ref) {
  if (AppConfig.isMockMode) {
    return const MockReviewRepository();
  }

  return RealReviewRepository(ref.watch(apiClientProvider));
});

final reviewsRepositoryProvider = reviewRepositoryProvider;
