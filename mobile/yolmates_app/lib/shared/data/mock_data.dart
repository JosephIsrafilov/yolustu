import '../models/trip.dart';
import '../models/user.dart';

/// Centralized mock dataset.
///
/// Keeps fake rides/drivers in one place instead of scattered across widgets.
/// When the backend lands, the mock repositories that read this file get
/// replaced by API implementations and this file can be deleted.
class MockData {
  MockData._();

  static final List<User> drivers = [
    const User(
      id: 'drv-1',
      name: 'Rəşad Süleymanov',
      phone: '+994501112233',
      rating: 4.9,
      tripCount: 156,
    ),
    const User(
      id: 'drv-2',
      name: 'Aysel Məmmədova',
      phone: '+994552223344',
      rating: 4.7,
      tripCount: 89,
    ),
    const User(
      id: 'drv-3',
      name: 'Elçin Hüseynov',
      phone: '+994703334455',
      rating: 4.5,
      tripCount: 42,
    ),
    const User(
      id: 'drv-4',
      name: 'Nigar Əliyeva',
      phone: '+994774445566',
      rating: 4.8,
      tripCount: 203,
    ),
  ];

  /// Generates a deterministic set of rides for a route + date.
  ///
  /// Deterministic (seeded by route) so repeated searches feel stable.
  static List<Trip> ridesFor({
    required String fromCity,
    required String toCity,
    required DateTime date,
    int minSeats = 1,
  }) {
    final seed = (fromCity.hashCode ^ toCity.hashCode).abs();
    final count = 3 + (seed % 4); // 3..6 rides

    final rides = List.generate(count, (i) {
      final driver = drivers[(seed + i) % drivers.length];
      final hour = 7 + ((seed + i * 3) % 12); // 7..18
      final price = 8.0 + ((seed + i * 5) % 18); // 8..25
      final seats = 1 + ((seed + i) % 4); // 1..4
      return Trip(
        id: 'ride-$fromCity-$toCity-$i',
        driver: driver,
        fromCity: fromCity,
        toCity: toCity,
        departureTime: DateTime(date.year, date.month, date.day, hour, 0),
        price: price,
        availableSeats: seats,
        totalSeats: 4,
        status: 'active',
      );
    });

    return rides.where((r) => r.availableSeats >= minSeats).toList();
  }

  /// Lookup a single ride by id (mock detail fetch).
  static Trip? rideById(String id) {
    // Decode in case GoRouter passed an encoded path segment
    try {
      id = Uri.decodeComponent(id);
    } catch (_) {}

    // Mock ids encode the route; rebuild a plausible ride from the id.
    final parts = id.split('-');
    if (parts.length >= 4 && parts.first == 'ride') {
      final from = parts[1];
      final to = parts[2];
      final idx = int.tryParse(parts[3]) ?? 0;
      final list = ridesFor(
        fromCity: from,
        toCity: to,
        date: DateTime.now(),
      );
      if (idx < list.length) return list[idx];
      if (list.isNotEmpty) return list.first;
    }
    return null;
  }
}
