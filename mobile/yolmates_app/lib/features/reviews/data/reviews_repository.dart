import 'package:dio/dio.dart';
import '../../../core/network/api_client.dart';
import '../../../core/network/api_exception.dart';
import '../../../core/network/providers.dart';
import '../../auth/data/auth_mode.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

class Review {
  final String id;
  final String authorName;
  final int rating;
  final String comment;
  final DateTime createdAt;

  const Review({
    required this.id,
    required this.authorName,
    required this.rating,
    required this.comment,
    required this.createdAt,
  });
}

/// Abstract contract for submitted reviews.
abstract class ReviewsRepository {
  Future<void> submitReview({
    required String targetId,
    required String rideId,
    required int rating,
    String? comment,
  });
}

class MockReviewsRepository implements ReviewsRepository {
  // Keep track of reviewed rideIds to prevent duplicate reviews in mock state
  final Set<String> _reviewedRides = {};

  @override
  Future<void> submitReview({
    required String targetId,
    required String rideId,
    required int rating,
    String? comment,
  }) async {
    await Future.delayed(const Duration(milliseconds: 500));
    if (_reviewedRides.contains(rideId)) {
      throw Exception('Bu səfər üçün artıq rəy bildirmisiniz.');
    }
    _reviewedRides.add(rideId);
  }
}

class ApiReviewsRepository implements ReviewsRepository {
  final ApiClient _client;

  ApiReviewsRepository(this._client);

  @override
  Future<void> submitReview({
    required String targetId,
    required String rideId,
    required int rating,
    String? comment,
  }) async {
    try {
      await _client.post('/reviews/', data: {
        'target_id': targetId,
        'ride_id': rideId,
        'rating': rating,
        if (comment != null) 'comment': comment,
      });
    } on DioException catch (e) {
      final apiError = e.error as ApiException;
      throw Exception(apiError.message);
    }
  }
}

// --- Providers ---------------------------------------------------------------

final reviewsRepositoryProvider = Provider<ReviewsRepository>((ref) {
  if (AuthMode.isApi) {
    return ApiReviewsRepository(ref.read(apiClientProvider));
  } else {
    return MockReviewsRepository();
  }
});
