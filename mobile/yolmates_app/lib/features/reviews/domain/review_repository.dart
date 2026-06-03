import '../../../core/network/api_result.dart';
import '../../../shared/models/review.dart';

abstract class ReviewRepository {
  Future<List<Review>> getReviews();

  Future<ApiResult<Review>> createReview(Map<String, dynamic> payload);
}
