import 'package:cached_network_image/cached_network_image.dart';
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
  static const _slideImages = [
    'https://images.pexels.com/photos/4553618/pexels-photo-4553618.jpeg?auto=compress&cs=tinysrgb&w=1200',
    'https://images.pexels.com/photos/4553033/pexels-photo-4553033.jpeg?auto=compress&cs=tinysrgb&w=1200',
    'https://images.pexels.com/photos/5065204/pexels-photo-5065204.jpeg?auto=compress&cs=tinysrgb&w=1200',
  ];

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
        illustration: _OnboardingImage(url: _slideImages[0]),
      ),
      _OnboardingSlide(
        title: l10n.onboardingSafeTitle,
        description: l10n.onboardingSafeMessage,
        illustration: _OnboardingImage(url: _slideImages[1]),
      ),
      _OnboardingSlide(
        title: l10n.onboardingEasyTitle,
        description: l10n.onboardingEasyMessage,
        illustration: _OnboardingImage(url: _slideImages[2]),
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
                          const SizedBox(height: 32),
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

class _OnboardingImage extends StatelessWidget {
  final String url;

  const _OnboardingImage({required this.url});

  @override
  Widget build(BuildContext context) {
    return ClipRRect(
      borderRadius: BorderRadius.circular(28),
      child: SizedBox(
        width: 300,
        height: 320,
        child: Stack(
          fit: StackFit.expand,
          children: [
            CachedNetworkImage(
              imageUrl: url,
              fit: BoxFit.cover,
              placeholder: (_, __) => Container(
                color: AppTheme.slate100,
                alignment: Alignment.center,
                child: const CircularProgressIndicator(strokeWidth: 2),
              ),
              errorWidget: (_, __, ___) => Container(
                color: AppTheme.slate100,
                alignment: Alignment.center,
                child: const Icon(
                  Icons.image_not_supported_outlined,
                  color: AppTheme.slate500,
                  size: 32,
                ),
              ),
            ),
            DecoratedBox(
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.topCenter,
                  end: Alignment.bottomCenter,
                  colors: [
                    Colors.black.withValues(alpha: 0.06),
                    Colors.black.withValues(alpha: 0.26),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
