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
/// - POST /bookings/ - create booking
/// - GET /bookings/my - passenger's bookings
/// - POST /bookings/{id}/cancel - cancel booking
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
      throw Exception(apiError.message);
    }
  }

  @override
  Future<Booking> create(Booking booking) async {
    try {
      final response = await _client.post('/bookings', data: {
        'ride_id': booking.rideId,
        'seats_booked': booking.seats,
      });

      final data = response.data;
      final Map<String, dynamic> bookingJson;

      if (data is Map<String, dynamic>) {
        if (data['data'] != null) {
          bookingJson = data['data'] as Map<String, dynamic>;
        } else {
          bookingJson = data;
        }
      } else {
        throw Exception('Gözlənilməz cavab formatı');
      }

      return BookingMapper.toBooking(BookingDto.fromJson(bookingJson));
    } on DioException catch (e) {
      final apiError = e.error as ApiException;
      throw Exception(apiError.message);
    }
  }

  @override
  Future<Booking> updateStatus(String id, BookingStatus status) async {
    // Only cancel supported for passenger
    if (status != BookingStatus.cancelled) {
      throw Exception('Bu əməliyyat dəstəklənmir');
    }

    try {
      final response = await _client.post('/bookings/$id/cancel');

      final data = response.data;
      final Map<String, dynamic> bookingJson;

      if (data is Map<String, dynamic>) {
        if (data['data'] != null) {
          bookingJson = data['data'] as Map<String, dynamic>;
        } else {
          bookingJson = data;
        }
      } else {
        throw Exception('Gözlənilməz cavab formatı');
      }

      return BookingMapper.toBooking(BookingDto.fromJson(bookingJson));
    } on DioException catch (e) {
      final apiError = e.error as ApiException;
      throw Exception(apiError.message);
    }
  }
}
