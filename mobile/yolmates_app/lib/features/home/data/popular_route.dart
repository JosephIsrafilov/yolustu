/// Popular route data model for HomeScreen.
class PopularRoute {
  final String fromCity;
  final String toCity;
  final double averagePrice;
  final int dailyTrips;

  const PopularRoute({
    required this.fromCity,
    required this.toCity,
    required this.averagePrice,
    required this.dailyTrips,
  });
}
