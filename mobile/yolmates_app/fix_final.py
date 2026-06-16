import os
import re

# 1. driver_verification_screen.dart
path = r"E:\yolustu\mobile\yolmates_app\lib\features\driver\driver_verification_screen.dart"
with open(path, "r", encoding="utf-8") as f:
    text = f.read()

# remove unused l10n from _DriverVerificationScreenState.build (around line 77)
text = re.sub(
    r"Widget build\(BuildContext context\) \{\s*final l10n = ref\.watch\(l10nProvider\);",
    "Widget build(BuildContext context) {",
    text,
)
# remove unused l10n from _Note.build (around line 207)
text = re.sub(
    r"Widget build\(BuildContext context, WidgetRef ref\) \{\s*final l10n = ref\.watch\(l10nProvider\);",
    "Widget build(BuildContext context, WidgetRef ref) {",
    text,
)

with open(path, "w", encoding="utf-8") as f:
    f.write(text)


# 2. reviews_screen.dart
path = r"E:\yolustu\mobile\yolmates_app\lib\features\reviews\reviews_screen.dart"
with open(path, "r", encoding="utf-8") as f:
    text = f.read()

# Fix ReviewsScreen.build signature and add l10n
text = re.sub(
    r"class ReviewsScreen extends ConsumerWidget \{([\s\S]*?)Widget build\(BuildContext context\) \{",
    r"class ReviewsScreen extends ConsumerWidget {\1Widget build(BuildContext context, WidgetRef ref) {\n    final l10n = ref.watch(l10nProvider);",
    text,
)

with open(path, "w", encoding="utf-8") as f:
    f.write(text)


# 3. trip_list_screen.dart
path = r"E:\yolustu\mobile\yolmates_app\lib\features\trips\trip_list_screen.dart"
with open(path, "r", encoding="utf-8") as f:
    text = f.read()

# Fix _FilterBar and _TripCard signatures
text = re.sub(
    r"class _FilterBar extends ConsumerWidget \{([\s\S]*?)Widget build\(BuildContext context\) \{",
    r"class _FilterBar extends ConsumerWidget {\1Widget build(BuildContext context, WidgetRef ref) {",
    text,
)
text = re.sub(
    r"class _TripCard extends ConsumerWidget \{([\s\S]*?)Widget build\(BuildContext context\) \{",
    r"class _TripCard extends ConsumerWidget {\1Widget build(BuildContext context, WidgetRef ref) {",
    text,
)

with open(path, "w", encoding="utf-8") as f:
    f.write(text)


# 4. notifications_controller.dart
path = r"E:\yolustu\mobile\yolmates_app\lib\features\notifications\data\notifications_controller.dart"
if os.path.exists(path):
    with open(path, "r", encoding="utf-8") as f:
        text = f.read()
    text = re.sub(r"final l10n = ref\.watch\(l10nProvider\);\s*", "", text)
    with open(path, "w", encoding="utf-8") as f:
        f.write(text)

# 5. review_dialog.dart
path = r"E:\yolustu\mobile\yolmates_app\lib\features\reviews\presentation\review_dialog.dart"
if os.path.exists(path):
    with open(path, "r", encoding="utf-8") as f:
        text = f.read()
    text = re.sub(r"final l10n = ref\.watch\(l10nProvider\);\s*", "", text)
    with open(path, "w", encoding="utf-8") as f:
        f.write(text)

print("Fixes applied")
