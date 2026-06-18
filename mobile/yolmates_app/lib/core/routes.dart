import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../features/auth/presentation/splash_screen.dart';
import '../features/auth/presentation/login_screen.dart';
import '../features/auth/presentation/register_screen.dart';
import '../features/auth/presentation/otp_verify_screen.dart';
import '../features/auth/presentation/profile_setup_screen.dart';
import '../features/auth/presentation/onboarding_screen.dart';
import '../features/auth/presentation/auth_intro_screen.dart';
import '../features/auth/presentation/mode_transition_screen.dart';
import '../features/auth/state/auth_controller.dart';
import '../features/bookings/bookings_screen.dart';
import '../features/bookings/booking_confirm_screen.dart';
import '../features/bookings/booking_detail_screen.dart';
import '../features/chat/chat_list_screen.dart';
import '../features/chat/chat_detail_screen.dart';
import '../features/driver/driver_onboarding_screen.dart';
import '../features/driver/add_vehicle_screen.dart';
import '../features/driver/driver_verification_screen.dart';
import '../features/driver/create_ride_screen.dart';
import '../features/driver/my_rides_screen.dart';
import '../features/driver/passenger_requests_screen.dart';
import '../features/driver/active_ride_screen.dart';
import '../features/driver/driver_panel_screen.dart';
import '../features/home/home_screen.dart';
import '../features/notifications/notifications_screen.dart';
import '../features/notifications/presentation/notification_detail_screen.dart';
import '../features/profile/profile_screen.dart';
import '../features/profile/presentation/profile_edit_screen.dart';
import '../features/reviews/reviews_screen.dart';
import '../features/search/search_screen.dart';
import '../features/settings/settings_screen.dart';
import '../features/support/support_screen.dart';
import '../features/support/support_chat_screen.dart';
import '../features/trips/trip_list_screen.dart';
import '../features/trips/trip_detail_screen.dart';
import '../features/wallet/wallet_screen.dart';
import '../shared/widgets/main_shell.dart';

/// Shared axis transition for secondary routes.
Page<T> _buildPageWithTransition<T>(
  BuildContext context,
  GoRouterState state,
  Widget child,
) {
  return CustomTransitionPage<T>(
    key: state.pageKey,
    child: child,
    transitionsBuilder: (context, animation, secondaryAnimation, child) {
      const begin = Offset(0.03, 0);
      const end = Offset.zero;
      const curve = Curves.easeInOut;
      final tween =
          Tween(begin: begin, end: end).chain(CurveTween(curve: curve));
      final offsetAnimation = animation.drive(tween);
      final fadeAnimation = CurvedAnimation(parent: animation, curve: curve);

      return SlideTransition(
        position: offsetAnimation,
        child: FadeTransition(
          opacity: fadeAnimation,
          child: child,
        ),
      );
    },
    transitionDuration: const Duration(milliseconds: 250),
  );
}

/// Centralized route paths. Use these constants instead of raw strings.

/// Centralized route paths. Use these constants instead of raw strings.
class AppRoutes {
  AppRoutes._();

  // Auth (outside bottom navigation)
  static const splash = '/splash';
  static const onboarding = '/onboarding';
  static const authIntro = '/auth-intro';
  static const login = '/login';
  static const register = '/register';
  static const otp = '/otp';
  static const profileSetup = '/profile-setup';
  static const modeTransition = '/mode-transition';

  // Main app (bottom-nav branches)
  static const home = '/';
  static const search = '/search';
  static const bookings = '/bookings';
  static const messages = '/messages';
  static const profile = '/profile';

  // Secondary / detail routes
  static const rideResults = '/trips-list';
  static const rideDetails = '/trips'; // + /:id
  static const bookingConfirm = '/booking/confirm'; // + /:rideId
  static const bookingDetails = '/bookings'; // + /:id
  static const chatDetails = '/messages'; // + /:id

  // Profile sub-pages
  static const settings = '/settings';
  static const support = '/support';
  static const profileEdit = '/profile/edit';
  static const notifications = '/notifications';
  static const reviews = '/reviews';
  static const wallet = '/wallet';

  // Driver
  static const driverPanel = '/driver/panel';
  static const driverOnboarding = '/driver';
  static const addVehicle = '/driver/vehicle';
  static const driverVerification = '/driver/verification';
  static const createRide = '/driver/create-ride';
  static const myRides = '/driver/rides';
  static const passengerRequests = '/driver/requests';
}

/// Bridges Riverpod auth state into GoRouter's [Listenable] refresh.
class _AuthRefresh extends ChangeNotifier {
  _AuthRefresh(this._ref) {
    _ref.listen(authControllerProvider, (_, __) => notifyListeners());
  }
  final Ref _ref;
}

final _shellKey = GlobalKey<NavigatorState>();

final routerProvider = Provider<GoRouter>((ref) {
  final refresh = _AuthRefresh(ref);

  return GoRouter(
    initialLocation: AppRoutes.splash,
    refreshListenable: refresh,
    redirect: (context, state) {
      final status = ref.read(authControllerProvider).status;
      final loc = state.matchedLocation;

      const authRoutes = {
        AppRoutes.login,
        AppRoutes.register,
        AppRoutes.otp,
        AppRoutes.authIntro
      };
      final onSplash = loc == AppRoutes.splash;
      final onAuth = authRoutes.contains(loc);
      final onProfileSetup = loc == AppRoutes.profileSetup;
      final onOnboarding = loc == AppRoutes.onboarding;

      switch (status) {
        case AuthStatus.unknown:
        case AuthStatus.error:
          // Stay on splash while bootstrapping / on load error.
          return onSplash ? null : AppRoutes.splash;

        case AuthStatus.onboarding:
          return onOnboarding ? null : AppRoutes.onboarding;

        case AuthStatus.unauthenticated:
          // Only login/otp/register/intro allowed.
          return onAuth ? null : AppRoutes.login;

        case AuthStatus.incompleteProfile:
          // Force profile setup.
          return onProfileSetup ? null : AppRoutes.profileSetup;

        case AuthStatus.authenticated:
          // Bounce away from auth/splash into the app.
          if (onSplash || onAuth || onProfileSetup || onOnboarding) {
            return AppRoutes.home;
          }

          // Driver routes access control: only approved drivers can access panel routes
          final user = ref.read(authControllerProvider).user;
          final isDriverRoute = loc.startsWith('/driver');
          if (isDriverRoute) {
            if (user?.verificationStatus != 'approved') {
              // Allow access to onboarding and verification flow only
              if (loc == AppRoutes.driverOnboarding ||
                  loc == AppRoutes.driverVerification) {
                return null;
              }
              return AppRoutes.driverOnboarding;
            }
          }
          return null;
      }
    },
    routes: [
      GoRoute(
        path: AppRoutes.splash,
        builder: (_, __) => const SplashScreen(),
      ),
      GoRoute(
        path: AppRoutes.onboarding,
        builder: (_, __) => const OnboardingScreen(),
      ),
      GoRoute(
        path: AppRoutes.authIntro,
        builder: (_, __) => const AuthIntroScreen(),
      ),
      GoRoute(
        path: AppRoutes.login,
        builder: (_, __) => const LoginScreen(),
      ),
      GoRoute(
        path: AppRoutes.register,
        builder: (_, __) => const RegisterScreen(),
      ),
      GoRoute(
        path: AppRoutes.otp,
        builder: (context, state) {
          final phone = state.uri.queryParameters['phone'] ?? '';
          final avatar = state.uri.queryParameters['avatar'];
          return OtpVerifyScreen(phone: phone, avatar: avatar);
        },
      ),
      GoRoute(
        path: AppRoutes.profileSetup,
        builder: (_, __) => const ProfileSetupScreen(),
      ),
      GoRoute(
        path: AppRoutes.modeTransition,
        builder: (context, state) {
          final isDriver = state.uri.queryParameters['driver'] == 'true';
          return ModeTransitionScreen(isDriver: isDriver);
        },
      ),

      // --- Main app shell (bottom navigation) ---
      StatefulShellRoute.indexedStack(
        builder: (context, state, navShell) =>
            MainShell(navigationShell: navShell),
        branches: [
          StatefulShellBranch(
            navigatorKey: _shellKey,
            routes: [
              GoRoute(
                path: AppRoutes.home,
                builder: (_, __) => const HomeScreen(),
              ),
            ],
          ),
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: AppRoutes.search,
                builder: (_, __) => const SearchScreen(),
              ),
            ],
          ),
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: AppRoutes.bookings,
                builder: (_, __) => const BookingsScreen(),
              ),
            ],
          ),
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: AppRoutes.messages,
                builder: (_, __) => const ChatListScreen(),
              ),
            ],
          ),
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: AppRoutes.profile,
                builder: (_, __) => const ProfileScreen(),
              ),
            ],
          ),
        ],
      ),

      // --- Secondary routes (above the shell, full screen, normal back) ---
      GoRoute(
        path: '/notifications/:id',
        pageBuilder: (context, state) => _buildPageWithTransition(
          context,
          state,
          NotificationDetailScreen(notificationId: state.pathParameters['id']!),
        ),
      ),

      GoRoute(
        path: '/trips/:id',
        pageBuilder: (context, state) => _buildPageWithTransition(
          context,
          state,
          TripDetailScreen(tripId: state.pathParameters['id']!),
        ),
      ),
      GoRoute(
        path: '/trips-list',
        pageBuilder: (context, state) {
          final q = state.uri.queryParameters;
          DateTime? date;
          DateTime? dateTo;
          if (q['date_from'] != null) {
            try {
              date = DateTime.parse(q['date_from']!);
              if (q['date_to'] != null) {
                dateTo = DateTime.parse(q['date_to']!);
              }
            } catch (_) {}
          } else if (q['date'] != null) {
            try {
              date = DateTime.parse(q['date']!);
            } catch (_) {}
          }
          return _buildPageWithTransition(
            context,
            state,
            TripListScreen(
              fromCity: q['from'] ?? 'Bakı',
              toCity: q['to'] ?? 'Gəncə',
              passengers: int.tryParse(q['passengers'] ?? '1') ?? 1,
              date: date,
              dateTo: dateTo,
            ),
          );
        },
      ),
      GoRoute(
        path: '/booking/confirm/:rideId',
        pageBuilder: (context, state) => _buildPageWithTransition(
          context,
          state,
          BookingConfirmScreen(
            rideId: state.pathParameters['rideId']!,
            initialSeats:
                int.tryParse(state.uri.queryParameters['seats'] ?? '1') ?? 1,
          ),
        ),
      ),
      GoRoute(
        path: '/bookings/:id',
        pageBuilder: (context, state) => _buildPageWithTransition(
          context,
          state,
          BookingDetailScreen(bookingId: state.pathParameters['id']!),
        ),
      ),
      GoRoute(
        path: '/messages/:id',
        pageBuilder: (context, state) => _buildPageWithTransition(
          context,
          state,
          ChatDetailScreen(conversationId: state.pathParameters['id']!),
        ),
      ),

      // Profile sub-pages
      GoRoute(
        path: AppRoutes.settings,
        pageBuilder: (context, state) => _buildPageWithTransition(
          context,
          state,
          const SettingsScreen(),
        ),
      ),
      GoRoute(
        path: AppRoutes.profileEdit,
        pageBuilder: (context, state) => _buildPageWithTransition(
          context,
          state,
          const ProfileEditScreen(),
        ),
      ),
      GoRoute(
        path: AppRoutes.support,
        pageBuilder: (context, state) => _buildPageWithTransition(
          context,
          state,
          const SupportScreen(),
        ),
      ),
      GoRoute(
        path: '${AppRoutes.support}/chat',
        pageBuilder: (context, state) => _buildPageWithTransition(
          context,
          state,
          const SupportChatScreen(),
        ),
      ),
      GoRoute(
        path: AppRoutes.notifications,
        pageBuilder: (context, state) => _buildPageWithTransition(
          context,
          state,
          const NotificationsScreen(),
        ),
      ),
      GoRoute(
        path: AppRoutes.reviews,
        pageBuilder: (context, state) => _buildPageWithTransition(
          context,
          state,
          const ReviewsScreen(),
        ),
      ),
      GoRoute(
        path: AppRoutes.wallet,
        pageBuilder: (context, state) => _buildPageWithTransition(
          context,
          state,
          const WalletScreen(),
        ),
      ),

      // Driver
      GoRoute(
        path: AppRoutes.driverPanel,
        pageBuilder: (context, state) => _buildPageWithTransition(
          context,
          state,
          const DriverPanelScreen(),
        ),
      ),
      GoRoute(
        path: AppRoutes.driverOnboarding,
        pageBuilder: (context, state) => _buildPageWithTransition(
          context,
          state,
          const DriverOnboardingScreen(),
        ),
      ),
      GoRoute(
        path: AppRoutes.addVehicle,
        pageBuilder: (context, state) => _buildPageWithTransition(
          context,
          state,
          const AddVehicleScreen(),
        ),
      ),
      GoRoute(
        path: AppRoutes.driverVerification,
        pageBuilder: (context, state) => _buildPageWithTransition(
          context,
          state,
          const DriverVerificationScreen(),
        ),
      ),
      GoRoute(
        path: AppRoutes.createRide,
        pageBuilder: (context, state) => _buildPageWithTransition(
          context,
          state,
          const CreateRideScreen(),
        ),
      ),
      GoRoute(
        path: AppRoutes.myRides,
        pageBuilder: (context, state) => _buildPageWithTransition(
          context,
          state,
          const MyRidesScreen(),
        ),
      ),
      GoRoute(
        path: '${AppRoutes.myRides}/:id',
        pageBuilder: (context, state) => _buildPageWithTransition(
          context,
          state,
          ActiveRideScreen(
            rideId: state.pathParameters['id']!,
          ),
        ),
      ),
      GoRoute(
        path: AppRoutes.passengerRequests,
        pageBuilder: (context, state) => _buildPageWithTransition(
          context,
          state,
          const PassengerRequestsScreen(),
        ),
      ),
    ],
  );
});
