import 'package:go_router/go_router.dart';
import '../features/home/home_screen.dart';
import '../features/search/search_screen.dart';
import '../features/trips/trip_list_screen.dart';
import '../features/trips/trip_detail_screen.dart';
import '../features/bookings/bookings_screen.dart';
import '../features/chat/chat_list_screen.dart';
import '../features/chat/chat_detail_screen.dart';
import '../features/profile/profile_screen.dart';

final router = GoRouter(
  initialLocation: '/',
  routes: [
    GoRoute(
      path: '/',
      builder: (context, state) => const HomeScreen(),
    ),
    GoRoute(
      path: '/search',
      builder: (context, state) => const SearchScreen(),
    ),
    GoRoute(
      path: '/trips',
      builder: (context, state) {
        final from = state.uri.queryParameters['from'] ?? 'Bakı';
        final to = state.uri.queryParameters['to'] ?? 'Gəncə';
        return TripListScreen(fromCity: from, toCity: to);
      },
    ),
    GoRoute(
      path: '/trips/:id',
      builder: (context, state) {
        final id = state.pathParameters['id']!;
        return TripDetailScreen(tripId: id);
      },
    ),
    GoRoute(
      path: '/bookings',
      builder: (context, state) => const BookingsScreen(),
    ),
    GoRoute(
      path: '/chat',
      builder: (context, state) => const ChatListScreen(),
    ),
    GoRoute(
      path: '/chat/:id',
      builder: (context, state) {
        final id = state.pathParameters['id']!;
        return ChatDetailScreen(conversationId: id);
      },
    ),
    GoRoute(
      path: '/profile',
      builder: (context, state) => const ProfileScreen(),
    ),
  ],
);
