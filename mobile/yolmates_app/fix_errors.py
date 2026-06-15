import os
import re

# 1. driver_verification_screen.dart
path = r"E:\yolustu\mobile\yolmates_app\lib\features\driver\driver_verification_screen.dart"
with open(path, "r", encoding="utf-8") as f:
    text = f.read()

# Add import if missing
if "import '../../core/localization/app_localizations.dart';" not in text:
    text = text.replace("import '../../core/constants.dart';", "import '../../core/localization/app_localizations.dart';\nimport '../../core/constants.dart';")

# Fix _DriverVerificationScreenState.build which incorrectly got ref
# Wait, it's a ConsumerState so build takes only context.
text = text.replace("Widget build(BuildContext context, WidgetRef ref) {\n    final l10n = ref.watch(l10nProvider);", "Widget build(BuildContext context) {\n    final l10n = ref.watch(l10nProvider);")

# Fix _Note multiple l10n
text = text.replace("    final l10n = ref.watch(l10nProvider);\n    final l10n = ref.watch(l10nProvider);", "    final l10n = ref.watch(l10nProvider);")

with open(path, "w", encoding="utf-8") as f:
    f.write(text)


# 2. reviews_screen.dart
path = r"E:\yolustu\mobile\yolmates_app\lib\features\reviews\reviews_screen.dart"
with open(path, "r", encoding="utf-8") as f:
    text = f.read()

# _SummaryCard and _ReviewCard were modified with `WidgetRef ref` but they are StatelessWidget
text = text.replace("Widget build(BuildContext context, WidgetRef ref) {\n    final l10n = ref.watch(l10nProvider);", "Widget build(BuildContext context) {")
# But wait! Did I change their class declarations? No, they are still StatelessWidget.
# Wait, I only want to remove WidgetRef ref from _SummaryCard and _ReviewCard, but KEEP it in ReviewsScreen which is ConsumerWidget!
# Let's do it carefully:
text = re.sub(r"class _SummaryCard extends StatelessWidget \{[\s\S]*?Widget build\(BuildContext context, WidgetRef ref\) \{[\s\S]*?final l10n = ref.watch\(l10nProvider\);", "class _SummaryCard extends StatelessWidget {\n  final double average;\n  final int count;\n\n  const _SummaryCard({required this.average, required this.count});\n\n  @override\n  Widget build(BuildContext context) {", text)

text = re.sub(r"class _ReviewCard extends StatelessWidget \{[\s\S]*?Widget build\(BuildContext context, WidgetRef ref\) \{[\s\S]*?final l10n = ref.watch\(l10nProvider\);", "class _ReviewCard extends StatelessWidget {\n  final String name;\n  final int stars;\n  final String text;\n\n  const _ReviewCard({\n    required this.name,\n    required this.stars,\n    required this.text,\n  });\n\n  @override\n  Widget build(BuildContext context) {", text)

with open(path, "w", encoding="utf-8") as f:
    f.write(text)


# 3. trip_list_screen.dart
path = r"E:\yolustu\mobile\yolmates_app\lib\features\trips\trip_list_screen.dart"
with open(path, "r", encoding="utf-8") as f:
    text = f.read()

# _TripListScreenState is ConsumerState, so build takes only context.
# We had: Widget build(BuildContext context, WidgetRef ref) {
text = text.replace("Widget build(BuildContext context, WidgetRef ref) {\n    final l10n = ref.watch(l10nProvider);", "Widget build(BuildContext context) {\n    final l10n = ref.watch(l10nProvider);")

# Remove duplicate l10n
text = text.replace("    final l10n = ref.watch(l10nProvider);\n    final l10n = ref.watch(l10nProvider);", "    final l10n = ref.watch(l10nProvider);")

with open(path, "w", encoding="utf-8") as f:
    f.write(text)
