import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/constants.dart';
import '../../../core/localization/app_localizations.dart';
import '../../../core/theme.dart';
import '../state/auth_controller.dart';

class OnboardingScreen extends ConsumerStatefulWidget {
  const OnboardingScreen({super.key});

  @override
  ConsumerState<OnboardingScreen> createState() => _OnboardingScreenState();
}

class _OnboardingScreenState extends ConsumerState<OnboardingScreen> {
  final PageController _pageController = PageController();
  int _currentPage = 0;

  @override
  void dispose() {
    _pageController.dispose();
    super.dispose();
  }

  void _finishOnboarding() {
    ref.read(authControllerProvider.notifier).markOnboardingSeen();
  }

  void _next(List<_OnboardingSlide> slides) {
    if (_currentPage == slides.length - 1) {
      _finishOnboarding();
      return;
    }
    _pageController.nextPage(
      duration: const Duration(milliseconds: 250),
      curve: Curves.easeInOut,
    );
  }

  @override
  Widget build(BuildContext context) {
    final l10n = ref.watch(l10nProvider);
    final slides = [
      _OnboardingSlide(
        title: l10n.onboardingSaveMoneyTitle,
        description: l10n.onboardingSaveMoneyMessage,
        illustration: const _MoneyIllustration(),
      ),
      _OnboardingSlide(
        title: l10n.onboardingSafeTitle,
        description: l10n.onboardingSafeMessage,
        illustration: const _SafeIllustration(),
      ),
      _OnboardingSlide(
        title: l10n.onboardingEasyTitle,
        description: l10n.onboardingEasyMessage,
        illustration: const _EasyIllustration(),
      ),
    ];
    final isLastPage = _currentPage == slides.length - 1;

    return Scaffold(
      body: DecoratedBox(
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
            colors: [Color(0xFFF4FFFD), Colors.white],
          ),
        ),
        child: SafeArea(
          child: Column(
            children: [
              Align(
                alignment: Alignment.topRight,
                child: Padding(
                  padding: const EdgeInsets.fromLTRB(16, 12, 16, 0),
                  child: TextButton(
                    onPressed: _finishOnboarding,
                    child: Text(
                      l10n.onboardingSkip,
                      style: const TextStyle(
                        color: AppTheme.slate500,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
                ),
              ),
              Expanded(
                child: PageView.builder(
                  controller: _pageController,
                  itemCount: slides.length,
                  onPageChanged: (index) =>
                      setState(() => _currentPage = index),
                  itemBuilder: (context, index) {
                    final slide = slides[index];
                    return Padding(
                      padding: const EdgeInsets.symmetric(
                        horizontal: AppConstants.spacing24,
                      ),
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          slide.illustration,
                          const SizedBox(height: 40),
                          Text(
                            slide.title,
                            textAlign: TextAlign.center,
                            style: Theme.of(context)
                                .textTheme
                                .headlineMedium
                                ?.copyWith(height: 1.15),
                          ),
                          const SizedBox(height: 14),
                          Text(
                            slide.description,
                            textAlign: TextAlign.center,
                            style:
                                Theme.of(context).textTheme.bodyLarge?.copyWith(
                                      color: AppTheme.slate500,
                                      height: 1.5,
                                    ),
                          ),
                        ],
                      ),
                    );
                  },
                ),
              ),
              Padding(
                padding: const EdgeInsets.all(AppConstants.spacing24),
                child: Column(
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: List.generate(
                        slides.length,
                        (index) => AnimatedContainer(
                          duration: const Duration(milliseconds: 200),
                          margin: const EdgeInsets.symmetric(horizontal: 4),
                          width: _currentPage == index ? 26 : 8,
                          height: 8,
                          decoration: BoxDecoration(
                            color: _currentPage == index
                                ? AppTheme.teal
                                : AppTheme.slate200,
                            borderRadius: BorderRadius.circular(999),
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(height: 24),
                    Row(
                      children: [
                        if (!isLastPage)
                          Expanded(
                            child: OutlinedButton(
                              onPressed: _finishOnboarding,
                              child: Text(l10n.onboardingSkip),
                            ),
                          ),
                        if (!isLastPage) const SizedBox(width: 12),
                        Expanded(
                          child: ElevatedButton(
                            onPressed: () => _next(slides),
                            child: Text(
                              isLastPage
                                  ? l10n.onboardingStart
                                  : l10n.onboardingNext,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _OnboardingSlide {
  final String title;
  final String description;
  final Widget illustration;

  const _OnboardingSlide({
    required this.title,
    required this.description,
    required this.illustration,
  });
}

class _MoneyIllustration extends StatelessWidget {
  const _MoneyIllustration();

  @override
  Widget build(BuildContext context) {
    return _ArtFrame(
      child: Stack(
        alignment: Alignment.center,
        children: [
          Positioned(
            left: 24,
            bottom: 28,
            child: _Bubble(
              icon: Icons.person_pin_circle_outlined,
              color: AppTheme.navy,
            ),
          ),
          Positioned(
            right: 26,
            bottom: 36,
            child: _Bubble(
              icon: Icons.directions_car_filled_rounded,
              color: AppTheme.tealDark,
              size: 72,
            ),
          ),
          Positioned(
            top: 18,
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(999),
                boxShadow: [
                  BoxShadow(
                    color: AppTheme.navy.withValues(alpha: 0.06),
                    blurRadius: 16,
                    offset: const Offset(0, 8),
                  ),
                ],
              ),
              child: const Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(
                    Icons.savings_outlined,
                    size: 18,
                    color: AppTheme.tealDark,
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _SafeIllustration extends StatelessWidget {
  const _SafeIllustration();

  @override
  Widget build(BuildContext context) {
    return _ArtFrame(
      child: Stack(
        alignment: Alignment.center,
        children: [
          const _Bubble(
            icon: Icons.verified_user_outlined,
            color: AppTheme.tealDark,
            size: 88,
          ),
          const Positioned(
            left: 26,
            bottom: 34,
            child: _MiniCard(
              icon: Icons.star_rounded,
              text: '4.9',
            ),
          ),
          const Positioned(
            right: 24,
            top: 30,
            child: _MiniCard(
              icon: Icons.support_agent_outlined,
              text: '24/7',
            ),
          ),
        ],
      ),
    );
  }
}

class _EasyIllustration extends StatelessWidget {
  const _EasyIllustration();

  @override
  Widget build(BuildContext context) {
    return _ArtFrame(
      child: Stack(
        alignment: Alignment.center,
        children: [
          Container(
            width: 128,
            height: 170,
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(28),
              boxShadow: [
                BoxShadow(
                  color: AppTheme.navy.withValues(alpha: 0.08),
                  blurRadius: 24,
                  offset: const Offset(0, 10),
                ),
              ],
            ),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: const [
                Icon(Icons.search_rounded, color: AppTheme.tealDark, size: 34),
                SizedBox(height: 12),
                Icon(Icons.event_seat_outlined, color: AppTheme.navy, size: 28),
                SizedBox(height: 12),
                Icon(
                  Icons.chat_bubble_outline_rounded,
                  color: AppTheme.tealDark,
                  size: 30,
                ),
              ],
            ),
          ),
          const Positioned(
            left: 16,
            top: 34,
            child: _MiniCard(
              icon: Icons.touch_app_outlined,
              text: '3',
            ),
          ),
          const Positioned(
            right: 12,
            bottom: 30,
            child: _MiniCard(icon: Icons.flash_on_outlined, text: ''),
          ),
        ],
      ),
    );
  }
}

class _ArtFrame extends StatelessWidget {
  final Widget child;

  const _ArtFrame({required this.child});

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 280,
      height: 260,
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [
            AppTheme.teal.withValues(alpha: 0.18),
            AppTheme.tealDark.withValues(alpha: 0.08),
          ],
        ),
        borderRadius: BorderRadius.circular(32),
      ),
      child: child,
    );
  }
}

class _Bubble extends StatelessWidget {
  final IconData icon;
  final Color color;
  final double size;

  const _Bubble({
    required this.icon,
    required this.color,
    this.size = 64,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      width: size,
      height: size,
      decoration: BoxDecoration(
        color: Colors.white,
        shape: BoxShape.circle,
        boxShadow: [
          BoxShadow(
            color: AppTheme.navy.withValues(alpha: 0.08),
            blurRadius: 16,
            offset: const Offset(0, 8),
          ),
        ],
      ),
      child: Icon(icon, color: color, size: size * 0.45),
    );
  }
}

class _MiniCard extends StatelessWidget {
  final IconData icon;
  final String text;

  const _MiniCard({
    required this.icon,
    required this.text,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(18),
        boxShadow: [
          BoxShadow(
            color: AppTheme.navy.withValues(alpha: 0.08),
            blurRadius: 16,
            offset: const Offset(0, 8),
          ),
        ],
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 16, color: AppTheme.tealDark),
          const SizedBox(width: 6),
          Text(
            text,
            style: const TextStyle(
              fontWeight: FontWeight.w600,
              color: AppTheme.navy,
            ),
          ),
        ],
      ),
    );
  }
}
