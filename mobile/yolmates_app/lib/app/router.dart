import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../core/widgets/app_scaffold.dart';
import '../core/widgets/loading_view.dart';
import '../features/auth/domain/auth_state.dart';
import '../features/auth/presentation/auth_controller.dart';
import '../features/auth/presentation/screens/login_screen.dart';
import '../features/auth/presentation/screens/otp_screen.dart';
import '../features/bookings/presentation/screens/booking_details_screen.dart';
import '../features/bookings/presentation/screens/bookings_screen.dart';
import '../features/driver/presentation/screens/create_ride_screen.dart';
import '../features/driver/presentation/screens/driver_dashboard_screen.dart';
import '../features/driver/presentation/screens/my_rides_screen.dart';
import '../features/onboarding/presentation/screens/onboarding_screen.dart';
import '../features/profile/presentation/screens/profile_screen.dart';
import '../features/profile/presentation/screens/profile_setup_screen.dart';
import '../features/reviews/presentation/screens/create_review_screen.dart';
import '../features/rides/presentation/screens/home_screen.dart';
import '../features/rides/presentation/screens/ride_details_screen.dart';
import '../features/rides/presentation/screens/ride_results_screen.dart';
import '../features/rides/presentation/screens/ride_search_screen.dart';
import '../features/settings/presentation/screens/settings_screen.dart';
import '../shared/models/booking.dart';

final routerInitialLocationProvider = Provider<String>((ref) => '/');

final goRouterProvider = Provider<GoRouter>((ref) {
  final authState = ref.watch(authControllerProvider);
  final initialLocation = ref.watch(routerInitialLocationProvider);

  return GoRouter(
    initialLocation: initialLocation,
    redirect: (BuildContext context, GoRouterState state) {
      final path = state.uri.path;
      final protectedPaths = <String>{
        '/bookings',
        '/driver',
        '/driver/create-ride',
        '/driver/my-rides',
        '/profile',
        '/profile/setup',
        '/reviews/create',
      };

      final isProtected =
          protectedPaths.contains(path) ||
          protectedPaths.any(
            (String item) => item != '/driver' && path.startsWith('$item/'),
          ) ||
          (path.startsWith('/driver/') && path != '/driver');

      if (authState.status == AuthStatus.unknown) {
        return path == '/splash' ? null : '/splash';
      }

      if (path == '/' || path == '/splash') {
        return authState.isAuthenticated ? '/home' : '/onboarding';
      }

      if (isProtected && !authState.isAuthenticated) {
        return '/auth/login';
      }

      if (authState.isAuthenticated &&
          (path == '/onboarding' || path == '/auth/login' || path == '/auth/otp')) {
        return '/home';
      }

      return null;
    },
    routes: <RouteBase>[
      GoRoute(
        path: '/',
        builder: (BuildContext context, GoRouterState state) =>
            const _SplashScreen(),
      ),
      GoRoute(
        path: '/splash',
        builder: (BuildContext context, GoRouterState state) =>
            const _SplashScreen(),
      ),
      GoRoute(
        path: '/onboarding',
        builder: (BuildContext context, GoRouterState state) =>
            const OnboardingScreen(),
      ),
      GoRoute(
        path: '/auth/login',
        builder: (BuildContext context, GoRouterState state) =>
            const LoginScreen(),
      ),
      GoRoute(
        path: '/auth/otp',
        builder: (BuildContext context, GoRouterState state) =>
            OtpScreen(phoneNumber: state.uri.queryParameters['phone']),
      ),
      GoRoute(
        path: '/profile/setup',
        builder: (BuildContext context, GoRouterState state) =>
            const ProfileSetupScreen(),
      ),
      GoRoute(
        path: '/profile',
        builder: (BuildContext context, GoRouterState state) =>
            const ProfileScreen(),
      ),
      GoRoute(
        path: '/home',
        builder: (BuildContext context, GoRouterState state) =>
            const AppScaffold(
              currentIndex: 0,
              title: 'Yolmates',
              child: HomeScreen(),
            ),
      ),
      GoRoute(
        path: '/rides/search',
        builder: (BuildContext context, GoRouterState state) =>
            const AppScaffold(
              currentIndex: 1,
              title: 'Search rides',
              child: RideSearchScreen(),
            ),
      ),
      GoRoute(
        path: '/rides/results',
        builder: (BuildContext context, GoRouterState state) => RideResultsScreen(
          fromCity: state.uri.queryParameters['from'],
          toCity: state.uri.queryParameters['to'],
          seats: int.tryParse(state.uri.queryParameters['seats'] ?? ''),
          date: DateTime.tryParse(state.uri.queryParameters['date'] ?? ''),
        ),
      ),
      GoRoute(
        path: '/rides/:id',
        builder: (BuildContext context, GoRouterState state) =>
            RideDetailsScreen(rideId: state.pathParameters['id']!),
      ),
      GoRoute(
        path: '/bookings',
        builder: (BuildContext context, GoRouterState state) =>
            const AppScaffold(
              currentIndex: 2,
              title: 'My bookings',
              child: BookingsScreen(),
            ),
      ),
      GoRoute(
        path: '/bookings/:id',
        builder: (BuildContext context, GoRouterState state) =>
            BookingDetailsScreen(
              bookingId: state.pathParameters['id']!,
              initialBooking: state.extra is Booking ? state.extra as Booking : null,
            ),
      ),
      GoRoute(
        path: '/driver',
        builder: (BuildContext context, GoRouterState state) =>
            const AppScaffold(
              currentIndex: 3,
              title: 'Driver',
              child: DriverDashboardScreen(),
            ),
      ),
      GoRoute(
        path: '/driver/create-ride',
        builder: (BuildContext context, GoRouterState state) =>
            const CreateRideScreen(),
      ),
      GoRoute(
        path: '/driver/my-rides',
        builder: (BuildContext context, GoRouterState state) =>
            const MyRidesScreen(),
      ),
      GoRoute(
        path: '/reviews/create',
        builder: (BuildContext context, GoRouterState state) =>
            const CreateReviewScreen(),
      ),
      GoRoute(
        path: '/settings',
        builder: (BuildContext context, GoRouterState state) =>
            const AppScaffold(
              currentIndex: 4,
              title: 'Settings',
              child: SettingsScreen(),
            ),
      ),
    ],
  );
});

class _SplashScreen extends StatelessWidget {
  const _SplashScreen();

  @override
  Widget build(BuildContext context) {
    return const Scaffold(body: SafeArea(child: LoadingView()));
  }
}
