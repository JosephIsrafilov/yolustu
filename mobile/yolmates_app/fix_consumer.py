import os

# 1. driver_verification_screen.dart
path = r"E:\yolustu\mobile\yolmates_app\lib\features\driver\driver_verification_screen.dart"
with open(path, "r", encoding="utf-8") as f:
    text = f.read()

text = text.replace(
    "class _Note extends ConsumerWidget {\n  const _Note();\n\n  @override\n  Widget build(BuildContext context) {\n    final l10n = ref.watch(l10nProvider);",
    "class _Note extends ConsumerWidget {\n  const _Note();\n\n  @override\n  Widget build(BuildContext context, WidgetRef ref) {\n    final l10n = ref.watch(l10nProvider);",
)

with open(path, "w", encoding="utf-8") as f:
    f.write(text)


# 2. reviews_screen.dart
path = r"E:\yolustu\mobile\yolmates_app\lib\features\reviews\reviews_screen.dart"
with open(path, "r", encoding="utf-8") as f:
    text = f.read()

text = text.replace(
    "class ReviewsScreen extends ConsumerWidget {\n  const ReviewsScreen({super.key});\n\n  static const _reviews = [\n    ('Aysel M.', 5, 'Çox rahat səyahət idi, vaxtında gəldi. Təşəkkürlər!'),\n    ('Elçin H.', 4, 'Yaxşı sürücü, maşın təmiz. Tövsiyə edirəm.'),\n    ('Nigar Ə.', 5, 'Hər şey əla idi, mütləq yenidən səyahət edəcəyəm.'),\n  ];\n\n  @override\n  Widget build(BuildContext context) {\n    final l10n = ref.watch(l10nProvider);",
    "class ReviewsScreen extends ConsumerWidget {\n  const ReviewsScreen({super.key});\n\n  static const _reviews = [\n    ('Aysel M.', 5, 'Çox rahat səyahət idi, vaxtında gəldi. Təşəkkürlər!'),\n    ('Elçin H.', 4, 'Yaxşı sürücü, maşın təmiz. Tövsiyə edirəm.'),\n    ('Nigar Ə.', 5, 'Hər şey əla idi, mütləq yenidən səyahət edəcəyəm.'),\n  ];\n\n  @override\n  Widget build(BuildContext context, WidgetRef ref) {\n    final l10n = ref.watch(l10nProvider);",
)

with open(path, "w", encoding="utf-8") as f:
    f.write(text)


# 3. trip_list_screen.dart
path = r"E:\yolustu\mobile\yolmates_app\lib\features\trips\trip_list_screen.dart"
with open(path, "r", encoding="utf-8") as f:
    text = f.read()

# _TripCard and _FilterBar
text = text.replace(
    "class _FilterBar extends ConsumerWidget {\n  const _FilterBar();\n\n  @override\n  Widget build(BuildContext context) {",
    "class _FilterBar extends ConsumerWidget {\n  const _FilterBar();\n\n  @override\n  Widget build(BuildContext context, WidgetRef ref) {",
)

text = text.replace(
    "class _TripCard extends ConsumerWidget {\n  final Trip trip;\n\n  const _TripCard({required this.trip});\n\n  @override\n  Widget build(BuildContext context) {\n    final l10n = ref.watch(l10nProvider);",
    "class _TripCard extends ConsumerWidget {\n  final Trip trip;\n\n  const _TripCard({required this.trip});\n\n  @override\n  Widget build(BuildContext context, WidgetRef ref) {\n    final l10n = ref.watch(l10nProvider);",
)

with open(path, "w", encoding="utf-8") as f:
    f.write(text)
