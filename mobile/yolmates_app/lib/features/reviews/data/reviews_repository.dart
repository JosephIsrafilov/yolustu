import 'package:dio/dio.dart';
import '../../../core/network/api_client.dart';
import '../../../core/network/api_exception.dart';
import '../../../core/network/providers.dart';
import '../../auth/data/auth_mode.dart';
import '../../auth/state/auth_controller.dart';
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

  Future<List<Review>> getReviews(String userId);
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

  @override
  Future<List<Review>> getReviews(String userId) async {
    await Future.delayed(const Duration(seconds: 1));
    return [
      Review(
        id: '1',
        authorName: 'Aysel',
        rating: 5,
        comment: 'Çox yaxşı sürücü, maşın təmiz idi.',
        createdAt: DateTime.now().subtract(const Duration(days: 1)),
      ),
      Review(
        id: '2',
        authorName: 'Kamil',
        rating: 4,
        comment: 'Yaxşı idi, amma bir az gecikdi.',
        createdAt: DateTime.now().subtract(const Duration(days: 5)),
      ),
      Review(
        id: '3',
        authorName: 'Rauf',
        rating: 5,
        comment: 'Təhlükəsiz və rahat səyahət.',
        createdAt: DateTime.now().subtract(const Duration(days: 12)),
      ),
    ];
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
      await _client.post('/reviews', data: {
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

  @override
  Future<List<Review>> getReviews(String userId) async {
    try {
      final response = await _client.get('/reviews/user/$userId');
      final data = response.data as List;
      return data
          .map((e) => Review(
                id: e['id'] as String,
                authorName: e['author_name'] as String? ?? 'Sərnişin',
                rating: e['rating'] as int,
                comment: e['comment'] as String? ?? '',
                createdAt: DateTime.parse(e['created_at'] as String),
              ))
          .toList();
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

final userReviewsProvider =
    FutureProvider.autoDispose<List<Review>>((ref) async {
  final authState = ref.watch(authControllerProvider);
  if (authState.user == null) return [];
  return ref.read(reviewsRepositoryProvider).getReviews(authState.user!.id);
});
