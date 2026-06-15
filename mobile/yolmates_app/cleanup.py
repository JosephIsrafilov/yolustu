import os
import re

# 1. driver_verification_screen.dart
path = r"E:\yolustu\mobile\yolmates_app\lib\features\driver\driver_verification_screen.dart"
with open(path, "r", encoding="utf-8") as f:
    text = f.read()
text = text.replace("import '../../core/localization/app_localizations.dart';\n", "")
with open(path, "w", encoding="utf-8") as f:
    f.write(text)

# 2. notifications_controller.dart
path = r"E:\yolustu\mobile\yolmates_app\lib\features\notifications\data\notifications_controller.dart"
with open(path, "r", encoding="utf-8") as f:
    text = f.read()
text = text.replace("import '../../../core/localization/app_localizations.dart';\n", "")
with open(path, "w", encoding="utf-8") as f:
    f.write(text)

# 3. review_dialog.dart
path = r"E:\yolustu\mobile\yolmates_app\lib\features\reviews\presentation\review_dialog.dart"
with open(path, "r", encoding="utf-8") as f:
    text = f.read()
text = re.sub(r"final l10n = ref\.watch\(l10nProvider\);\s*", "", text)
with open(path, "w", encoding="utf-8") as f:
    f.write(text)

print("Cleanup applied")
