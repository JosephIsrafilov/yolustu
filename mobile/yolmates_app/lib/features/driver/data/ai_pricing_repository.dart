import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/network/api_client.dart';
import '../../../core/network/api_error_mapper.dart';
import '../../../core/network/api_exception.dart';
import '../../../core/network/providers.dart';
import 'package:dio/dio.dart';

class PricingSuggestionRequest {
  final String origin;
  final String destination;
  final String departureTime;
  final String? departureDate;
  final String language;
  final int? seatsTotal;

  PricingSuggestionRequest({
    required this.origin,
    required this.destination,
    required this.departureTime,
    this.departureDate,
    this.language = 'az',
    this.seatsTotal,
  });

  Map<String, dynamic> toJson() => {
        'origin': origin,
        'destination': destination,
        'departure_time': departureTime,
        if (departureDate != null) 'departure_date': departureDate,
        'language': language,
        if (seatsTotal != null) 'seats_total': seatsTotal,
      };
}

class PricingSuggestionResponse {
  final int suggestedPrice;
  final String reasoning;

  PricingSuggestionResponse({
    required this.suggestedPrice,
    required this.reasoning,
  });

  factory PricingSuggestionResponse.fromJson(Map<String, dynamic> json) {
    return PricingSuggestionResponse(
      suggestedPrice: (json['suggested_price'] as num?)?.toInt() ?? 0,
      reasoning: json['reasoning'] as String? ?? '',
    );
  }
}

final aiPricingRepositoryProvider = Provider<AiPricingRepository>((ref) {
  return AiPricingRepository(ref.watch(apiClientProvider));
});

class AiPricingRepository {
  final ApiClient _apiClient;

  AiPricingRepository(this._apiClient);

  Future<PricingSuggestionResponse> getSuggestion(
      PricingSuggestionRequest request) async {
    try {
      final response = await _apiClient.post(
        '/ai/pricing-suggestion',
        data: request.toJson(),
      );
      return PricingSuggestionResponse.fromJson(
          response.data as Map<String, dynamic>);
    } on DioException catch (e) {
      throw ApiErrorMapper.fromDioException(e);
    } catch (e) {
      throw ApiException(
        code: 'unknown_error',
        message: 'Qiymət təklifi alınmadı: $e',
      );
    }
  }
}
