import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/config/app_config.dart';
import '../../../core/network/api_client.dart';
import '../../../core/network/api_endpoints.dart';
import '../../../core/network/api_result.dart';
import '../../../shared/mock/mock_data.dart';
import '../../../shared/models/booking.dart';
import '../domain/booking_repository.dart';
import '../domain/booking_summary.dart';

class MockBookingRepository implements BookingRepository {
  const MockBookingRepository();

  @override
  Future<ApiResult<void>> cancelBooking(String bookingId) async {
    await Future<void>.delayed(const Duration(milliseconds: 120));
    return const ApiSuccess<void>(null);
  }

  @override
  Future<ApiResult<Booking>> createBooking({
    required String rideId,
    required int seats,
  }) async {
    await Future<void>.delayed(const Duration(milliseconds: 150));
    return ApiSuccess<Booking>(
      Booking(
        id: 'booking-created',
        ride: mockRides.first,
        status: BookingStatus.pending,
        seats: seats,
        createdAt: DateTime.now(),
      ),
    );
  }

  @override
  Future<List<Booking>> getMyBookings() async {
    await Future<void>.delayed(const Duration(milliseconds: 150));
    return mockBookings;
  }
}

class RealBookingRepository implements BookingRepository {
  const RealBookingRepository(this._apiClient);

  final ApiClient _apiClient;

  @override
  Future<ApiResult<void>> cancelBooking(String bookingId) async {
    try {
      await _apiClient.dio.post<void>('${ApiEndpoints.bookings}/$bookingId/cancel');
      return const ApiSuccess<void>(null);
    } catch (error) {
      return ApiFailure<void>('Failed to cancel booking: $error');
    }
  }

  @override
  Future<ApiResult<Booking>> createBooking({
    required String rideId,
    required int seats,
  }) async {
    try {
      final response = await _apiClient.dio.post<Map<String, dynamic>>(
        ApiEndpoints.bookings,
        data: <String, dynamic>{'ride_id': rideId, 'seats_booked': seats},
      );
      final bookingJson =
          (response.data?['booking'] as Map<String, dynamic>?) ??
          (response.data ?? <String, dynamic>{});
      return ApiSuccess<Booking>(Booking.fromJson(bookingJson));
    } catch (error) {
      return ApiFailure<Booking>('Failed to create booking: $error');
    }
  }

  @override
  Future<List<Booking>> getMyBookings() async {
    try {
      final response = await _apiClient.dio.get<List<dynamic>>(
        '${ApiEndpoints.bookings}/my',
      );
      return response.data
              ?.whereType<Map<String, dynamic>>()
              .map(Booking.fromJson)
              .toList() ??
          <Booking>[];
    } catch (error) {
      throw Exception('Unable to load bookings: $error');
    }
  }
}

final bookingRepositoryProvider = Provider<BookingRepository>((ref) {
  if (AppConfig.isMockMode) {
    return const MockBookingRepository();
  }

  return RealBookingRepository(ref.watch(apiClientProvider));
});

final bookingsRepositoryProvider = bookingRepositoryProvider;

final bookingSummaryProvider = FutureProvider<BookingSummary>((ref) async {
  final repository = ref.watch(bookingRepositoryProvider);
  final bookings = await repository.getMyBookings();
  final pending = bookings
      .where((Booking booking) => booking.status == BookingStatus.pending)
      .length;
  return BookingSummary(total: bookings.length, pending: pending);
});
