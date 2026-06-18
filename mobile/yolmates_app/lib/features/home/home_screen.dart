import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../core/localization/app_localizations.dart';
import '../../core/routes.dart';
import '../../core/theme.dart';
import '../../shared/widgets/city_dropdown.dart';
import '../../shared/widgets/date_selector.dart';
import '../auth/state/auth_controller.dart';
import '../driver/driver_panel_screen.dart';
import '../notifications/data/notifications_controller.dart';
import 'data/popular_routes_provider.dart';

class HomeScreen extends ConsumerStatefulWidget {
  const HomeScreen({super.key});

  @override
  ConsumerState<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends ConsumerState<HomeScreen> {
  String? _from;
  String? _to;
  DateSelection? _dateSelection;

  @override
  Widget build(BuildContext context) {
    final isDriverMode = ref.watch(driverModeProvider);
    if (isDriverMode) {
      return const DriverPanelScreen();
    }

    final l10n = ref.watch(l10nProvider);
    final user = ref.watch(authControllerProvider).user;
    final userStatus = user?.verificationStatus ?? 'none';

    final String btnLabel;
    final VoidCallback? btnAction;
    final IconData btnIcon;

    if (userStatus == 'approved') {
      btnLabel = l10n.homeDriverPanelBtn;
      btnAction = () => context.push(AppRoutes.driverPanel);
      btnIcon = Icons.dashboard_outlined;
    } else if (userStatus == 'pending') {
      btnLabel = l10n.homeDocumentsPendingBtn;
      btnAction = () => context.push(AppRoutes.driverVerification);
      btnIcon = Icons.hourglass_empty;
    } else {
      btnLabel = l10n.homeBecomeDriverBtn;
      btnAction = () => context.push(AppRoutes.driverOnboarding);
      btnIcon = Icons.directions_car;
    }

    return Scaffold(
      body: CustomScrollView(
        slivers: [
          // Hero Section
          SliverToBoxAdapter(
            child: Container(
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                  colors: [
                    AppTheme.navy,
                    AppTheme.navy.withValues(alpha: 0.9),
                  ],
                ),
              ),
              child: SafeArea(
                child: Padding(
                  padding: const EdgeInsets.all(24.0),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // App Bar
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Row(
                            children: [
                              Image.asset(
                                'assets/logo.png',
                                width: 80,
                                height: 80,
                              ),
                            ],
                          ),
                          Stack(
                            clipBehavior: Clip.none,
                            children: [
                              IconButton(
                                icon: const Icon(Icons.notifications_outlined,
                                    color: Colors.white, size: 28),
                                onPressed: () =>
                                    context.push(AppRoutes.notifications),
                              ),
                              Consumer(
                                builder: (context, ref, child) {
                                  final count = ref
                                      .watch(unreadNotificationCountProvider);
                                  if (count == 0) {
                                    return const SizedBox.shrink();
                                  }
                                  return Positioned(
                                    top: 8,
                                    right: 8,
                                    child: Container(
                                      padding: const EdgeInsets.all(4),
                                      decoration: const BoxDecoration(
                                        color: Colors.red,
                                        shape: BoxShape.circle,
                                      ),
                                      child: Text(
                                        count > 9 ? '9+' : count.toString(),
                                        style: const TextStyle(
                                          color: Colors.white,
                                          fontSize: 10,
                                          fontWeight: FontWeight.bold,
                                        ),
                                      ),
                                    ),
                                  );
                                },
                              ),
                            ],
                          ),
                        ],
                      ),
                      const SizedBox(height: 40),

                      // Hero Text
                      Text(
                        l10n.homeHeroTitle,
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 32,
                          fontWeight: FontWeight.bold,
                          height: 1.2,
                        ),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        l10n.homeHeroSubtitle,
                        style: TextStyle(
                          color: AppTheme.tealLight,
                          fontSize: 32,
                          fontWeight: FontWeight.bold,
                          height: 1.2,
                        ),
                      ),
                      const SizedBox(height: 16),
                      Text(
                        l10n.homeHeroDescription,
                        style: TextStyle(
                          color: Colors.white.withValues(alpha: 0.7),
                          fontSize: 16,
                        ),
                      ),
                      const SizedBox(height: 32),

                      // Search Card
                      Container(
                        padding: const EdgeInsets.all(16),
                        decoration: BoxDecoration(
                          color: Colors.white.withValues(alpha: 0.1),
                          borderRadius: BorderRadius.circular(16),
                          border: Border.all(
                            color: Colors.white.withValues(alpha: 0.1),
                          ),
                        ),
                        child: Column(
                          children: [
                            CityDropdown(
                              label: l10n.searchFromLabel,
                              value: _from,
                              icon: Icons.location_on_outlined,
                              isDark: true,
                              allowAll: true,
                              onChanged: (val) => setState(() => _from = val),
                            ),
                            const SizedBox(height: 12),
                            CityDropdown(
                              label: l10n.searchToLabel,
                              value: _to,
                              icon: Icons.location_on,
                              isDark: true,
                              allowAll: true,
                              onChanged: (val) => setState(() => _to = val),
                            ),
                            const SizedBox(height: 12),
                            DateSelector(
                              selectedDate: _dateSelection,
                              onChanged: (val) =>
                                  setState(() => _dateSelection = val),
                              isDark: true,
                            ),
                            const SizedBox(height: 16),
                            SizedBox(
                              width: double.infinity,
                              child: ElevatedButton(
                                onPressed: (_from == null || _to == null)
                                    ? null
                                    : () {
                                        String route =
                                            '${AppRoutes.rideResults}?from=$_from&to=$_to';
                                        final sel = _dateSelection;
                                        if (sel != null && sel.date != null) {
                                          if (sel.isWeekRange &&
                                              sel.dateTo != null) {
                                            route +=
                                                '&date_from=${sel.date!.toIso8601String()}'
                                                '&date_to=${sel.dateTo!.toIso8601String()}';
                                          } else {
                                            route +=
                                                '&date=${sel.date!.toIso8601String()}';
                                          }
                                        }
                                        context.push(route);
                                      },
                                style: ElevatedButton.styleFrom(
                                  backgroundColor: AppTheme.teal,
                                  disabledBackgroundColor:
                                      Colors.white.withValues(alpha: 0.2),
                                  padding:
                                      const EdgeInsets.symmetric(vertical: 16),
                                  shape: RoundedRectangleBorder(
                                    borderRadius: BorderRadius.circular(12),
                                  ),
                                ),
                                child: Row(
                                  mainAxisAlignment: MainAxisAlignment.center,
                                  children: [
                                    Icon(
                                      Icons.search,
                                      size: 20,
                                      color: (_from == null || _to == null)
                                          ? Colors.white54
                                          : Colors.white,
                                    ),
                                    const SizedBox(width: 8),
                                    Text(
                                      l10n.commonSearch,
                                      style: TextStyle(
                                        fontSize: 16,
                                        fontWeight: FontWeight.w600,
                                        color: (_from == null || _to == null)
                                            ? Colors.white54
                                            : Colors.white,
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 24),

                      // Driver Mode Switch — only show for approved drivers
                      if (userStatus == 'approved') ...[
                        Container(
                          padding: const EdgeInsets.symmetric(
                              horizontal: 16, vertical: 8),
                          decoration: BoxDecoration(
                            color: Colors.white.withValues(alpha: 0.1),
                            borderRadius: BorderRadius.circular(12),
                            border: Border.all(
                              color: Colors.white.withValues(alpha: 0.3),
                            ),
                          ),
                          child: Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Row(
                                children: [
                                  const Icon(Icons.dashboard_outlined,
                                      color: Colors.white, size: 24),
                                  const SizedBox(width: 12),
                                  Text(
                                    l10n.homeDriverPanelBtn,
                                    style: const TextStyle(
                                      color: Colors.white,
                                      fontSize: 16,
                                      fontWeight: FontWeight.w500,
                                    ),
                                  ),
                                ],
                              ),
                              Switch(
                                value: ref.watch(driverModeProvider),
                                activeThumbColor: AppTheme.teal,
                                onChanged: (val) {
                                  context.push(
                                      '${AppRoutes.modeTransition}?driver=$val');
                                },
                              ),
                            ],
                          ),
                        ),
                      ] else ...[
                        GestureDetector(
                          onTap: btnAction,
                          child: Container(
                            padding: const EdgeInsets.symmetric(
                                horizontal: 16, vertical: 12),
                            decoration: BoxDecoration(
                              color: Colors.white.withValues(alpha: 0.1),
                              borderRadius: BorderRadius.circular(12),
                              border: Border.all(
                                color: Colors.white.withValues(alpha: 0.3),
                              ),
                            ),
                            child: Row(
                              children: [
                                Icon(btnIcon, color: Colors.white, size: 24),
                                const SizedBox(width: 12),
                                Expanded(
                                  child: Text(
                                    btnLabel,
                                    style: const TextStyle(
                                      color: Colors.white,
                                      fontSize: 16,
                                      fontWeight: FontWeight.w500,
                                    ),
                                  ),
                                ),
                                Icon(
                                  Icons.arrow_forward_ios,
                                  color: Colors.white.withValues(alpha: 0.6),
                                  size: 16,
                                ),
                              ],
                            ),
                          ),
                        ),
                      ],
                      const SizedBox(height: 24),
                    ],
                  ),
                ),
              ),
            ),
          ),

          // Popular Routes
          SliverPadding(
            padding: const EdgeInsets.all(24),
            sliver: SliverToBoxAdapter(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    l10n.homePopularRoutes,
                    style: const TextStyle(
                      fontSize: 24,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: 16),
                  Consumer(
                    builder: (context, ref, _) {
                      final routesAsync = ref.watch(popularRoutesProvider);
                      return routesAsync.when(
                        loading: () => const Center(
                          child: Padding(
                            padding: EdgeInsets.all(24.0),
                            child: CircularProgressIndicator(),
                          ),
                        ),
                        error: (e, _) => Center(
                          child: Text(
                            'Failed to load routes',
                            style: TextStyle(color: Colors.red.shade600),
                          ),
                        ),
                        data: (routes) => Column(
                          children: [
                            for (var i = 0;
                                i < routes.length && i < 5;
                                i++) ...[
                              if (i > 0) const SizedBox(height: 12),
                              _buildRouteCard(
                                context,
                                routes[i].fromCity,
                                routes[i].toCity,
                                '15 AZN',
                              ),
                            ],
                          ],
                        ),
                      );
                    },
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildRouteCard(
      BuildContext context, String from, String to, String price) {
    return Card(
      clipBehavior: Clip.antiAlias,
      child: InkWell(
        onTap: () {
          context.push('${AppRoutes.rideResults}?from=$from&to=$to');
        },
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Row(
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Text(
                          from,
                          style: const TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                        const SizedBox(width: 8),
                        const Icon(Icons.arrow_forward, size: 16),
                        const SizedBox(width: 8),
                        Text(
                          to,
                          style: const TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
              Container(
                padding:
                    const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                decoration: BoxDecoration(
                  color: AppTheme.teal.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Text(
                  price,
                  style: const TextStyle(
                    color: AppTheme.tealDark,
                    fontSize: 14,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
