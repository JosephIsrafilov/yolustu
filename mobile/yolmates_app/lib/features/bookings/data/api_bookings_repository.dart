import 'package:dio/dio.dart';

import '../../../core/network/api_client.dart';
import '../../../core/network/api_exception.dart';
import 'booking.dart';
import 'booking_dto.dart';
import 'booking_mapper.dart';
import 'bookings_controller.dart';

/// Real backend bookings implementation.
///
/// Endpoints:
/// - POST /bookings - create booking
/// - GET /bookings/my - passenger's bookings
/// - POST /bookings/{id}/cancel - cancel booking
/// - POST /bookings/{id}/complete-demo - passenger demo completion
class ApiBookingsRepository implements BookingsRepository {
  final ApiClient _client;

  ApiBookingsRepository(this._client);

  @override
  Future<List<Booking>> all() async {
    try {
      final response = await _client.get('/bookings/my');

      final data = response.data;
      final List<dynamic> bookings;

      if (data is List) {
        bookings = data;
      } else if (data is Map<String, dynamic> && data['data'] is List) {
        bookings = data['data'] as List<dynamic>;
      } else {
        bookings = [];
      }

      return bookings
          .map((json) => BookingMapper.toBooking(
              BookingDto.fromJson(json as Map<String, dynamic>)))
          .toList();
    } on DioException catch (e) {
      final apiError = e.error as ApiException;
      throw apiError;
    }
  }

  @override
  Future<Booking> create(Booking booking) async {
    try {
      final response = await _client.post('/bookings', data: {
        'ride_id': booking.rideId,
        'seats_booked': booking.seats,
        'selected_spots': booking.selectedSpots,
      });

      return _bookingFromResponse(response.data);
    } on DioException catch (e) {
      final apiError = e.error as ApiException;
      throw apiError;
    }
  }

  @override
  Future<Booking> updateStatus(String id, BookingStatus status) async {
    final endpoint = switch (status) {
      BookingStatus.cancelled => '/bookings/$id/cancel',
      BookingStatus.completed => '/bookings/$id/complete-demo',
      _ => null,
    };

    if (endpoint == null) {
      throw Exception('Bu emeliyyat desteklenmir');
    }

    try {
      final response = await _client.post(endpoint);
      return _bookingFromResponse(response.data);
    } on DioException catch (e) {
      final apiError = e.error as ApiException;
      throw apiError;
    }
  }

  Booking _bookingFromResponse(dynamic data) {
    final Map<String, dynamic> bookingJson;

    if (data is Map<String, dynamic>) {
      if (data['data'] != null) {
        bookingJson = data['data'] as Map<String, dynamic>;
      } else {
        bookingJson = data;
      }
    } else {
      throw Exception('Unexpected response format');
    }

    return BookingMapper.toBooking(BookingDto.fromJson(bookingJson));
  }
}
