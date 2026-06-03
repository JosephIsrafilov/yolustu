import '../../../core/network/api_result.dart';
import '../../../shared/models/booking.dart';

abstract class BookingRepository {
  Future<List<Booking>> getMyBookings();

  Future<ApiResult<Booking>> createBooking({
    required String rideId,
    required int seats,
  });

  Future<ApiResult<void>> cancelBooking(String bookingId);
}
