import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../shared/mock/mock_data.dart';
import '../../../shared/models/booking.dart';
import '../domain/driver_dashboard.dart';

class DriverRepository {
  const DriverRepository();

  Future<DriverDashboard> getDashboard() async {
    await Future<void>.delayed(const Duration(milliseconds: 120));
    return DriverDashboard(
      activeRides: mockRides.length,
      pendingRequests: mockBookings
          .where((Booking booking) => booking.status == BookingStatus.pending)
          .length,
    );
  }
}

final driverRepositoryProvider = Provider<DriverRepository>(
  (ref) => const DriverRepository(),
);
