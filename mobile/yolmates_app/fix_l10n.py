import os
import re

# Fix driver_verification_screen.dart
path = r"E:\yolustu\mobile\yolmates_app\lib\features\driver\driver_verification_screen.dart"
with open(path, "r", encoding="utf-8") as f:
    text = f.read()

# Remove the incorrectly placed l10n from _VerifyTile which is StatelessWidget
text = text.replace(
    "    final l10n = ref.watch(l10nProvider);\n    final isPending = status == VerificationStatus.pending;",
    "    final isPending = status == VerificationStatus.pending;",
)

with open(path, "w", encoding="utf-8") as f:
    f.write(text)

# Fix reviews_screen.dart
path = r"E:\yolustu\mobile\yolmates_app\lib\features\reviews\reviews_screen.dart"
with open(path, "r", encoding="utf-8") as f:
    text = f.read()

if "import 'package:flutter_riverpod/flutter_riverpod.dart';" not in text:
    text = (
        "import 'package:flutter_riverpod/flutter_riverpod.dart';\nimport '../../core/localization/app_localizations.dart';\n"
        + text
    )

text = text.replace(
    "class ReviewsScreen extends StatelessWidget {",
    "class ReviewsScreen extends ConsumerWidget {",
)
text = text.replace(
    "Widget build(BuildContext context) {",
    "Widget build(BuildContext context, WidgetRef ref) {\n    final l10n = ref.watch(l10nProvider);",
)

with open(path, "w", encoding="utf-8") as f:
    f.write(text)

# Fix trip_list_screen.dart
path = r"E:\yolustu\mobile\yolmates_app\lib\features\trips\trip_list_screen.dart"
with open(path, "r", encoding="utf-8") as f:
    text = f.read()

# The error was at line 358. Text('${trip.availableSeats} ${l10n.commonAvailableSeats}'
# l10n is already available in the build method of _TripListScreenState? Wait, _TripCard is a StatelessWidget.
text = text.replace(
    "class _TripCard extends StatelessWidget {",
    "class _TripCard extends ConsumerWidget {",
)
text = re.sub(
    r"Widget build\(BuildContext context\) \{",
    "Widget build(BuildContext context, WidgetRef ref) {\n    final l10n = ref.watch(l10nProvider);",
    text,
)

with open(path, "w", encoding="utf-8") as f:
    f.write(text)

print("Fix applied")
