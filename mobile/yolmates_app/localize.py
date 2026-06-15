import os
import re

l10n_file = r"E:\yolustu\mobile\yolmates_app\lib\core\localization\app_localizations.dart"

new_localizations = """
  // Driver Verification
  String get verificationTitle => _get({'az': 'Təsdiqləmə', 'en': 'Verification', 'ru': 'Верификация'});
  String get verificationSent => _get({'az': 'təsdiq üçün göndərildi', 'en': 'sent for verification', 'ru': 'отправлено на проверку'});
  String get verificationMockApproved => _get({'az': 'Sürücü statusu təsdiqləndi (MOCK)', 'en': 'Driver status approved (MOCK)', 'ru': 'Статус водителя подтвержден (MOCK)'});
  String get verificationMockBtn => _get({'az': 'Mock Təsdiqlə (Geliştirici)', 'en': 'Mock Approve (Dev)', 'ru': 'Mock Подтвердить (Дев)'});
  String get verificationApproveBtn => _get({'az': 'Təsdiq', 'en': 'Approved', 'ru': 'Подтверждено'});
  String get verificationUploadBtn => _get({'az': 'Yüklə', 'en': 'Upload', 'ru': 'Загрузить'});
  
  String get verificationIdCard => _get({'az': 'Şəxsiyyət vəsiqəsi', 'en': 'ID Card', 'ru': 'Удостоверение личности'});
  String get verificationIdCardDesc => _get({'az': 'Ön və arxa tərəf', 'en': 'Front and back side', 'ru': 'Лицевая и обратная сторона'});
  String get verificationSelfie => _get({'az': 'Selfi təsdiqi', 'en': 'Selfie verification', 'ru': 'Селфи верификация'});
  String get verificationSelfieDesc => _get({'az': 'Üz tanıma üçün', 'en': 'For facial recognition', 'ru': 'Для распознавания лиц'});
  String get verificationLicense => _get({'az': 'Sürücülük vəsiqəsi', 'en': 'Driver license', 'ru': 'Водительские права'});
  String get verificationLicenseDesc => _get({'az': 'Etibarlı sürücülük vəsiqəsi', 'en': 'Valid driver license', 'ru': 'Действительные водительские права'});
  String get verificationNote => _get({'az': 'Təsdiq prosesi bir neçə dəqiqə çəkə bilər. Status yeniləndikdə Sürücü Paneli aktivləşəcək.', 'en': 'The verification process may take a few minutes. Driver Panel will be activated when the status is updated.', 'ru': 'Процесс верификации может занять несколько минут. Панель водителя будет активирована при обновлении статуса.'});

  // Common Extras
  String get commonDismiss => _get({'az': 'İmtina', 'en': 'Dismiss', 'ru': 'Отклонить'});
  String get commonReviews => _get({'az': 'Rəylər', 'en': 'Reviews', 'ru': 'Отзывы'});
  String get commonAvailableSeats => _get({'az': 'boş yer', 'en': 'available seats', 'ru': 'свободных мест'});
"""

with open(l10n_file, "r", encoding="utf-8") as f:
    content = f.read()

if "verificationTitle" not in content:
    # Insert before the last brace
    idx = content.rfind("}")
    content = content[:idx] + new_localizations + content[idx:]
    with open(l10n_file, "w", encoding="utf-8") as f:
        f.write(content)


def replace_in_file(path, replacements):
    with open(path, "r", encoding="utf-8") as f:
        text = f.read()
    
    for old, new in replacements:
        text = text.replace(old, new)
        
    with open(path, "w", encoding="utf-8") as f:
        f.write(text)

# Fix driver verification screen
driver_ver_path = r"E:\yolustu\mobile\yolmates_app\lib\features\driver\driver_verification_screen.dart"
with open(driver_ver_path, "r", encoding="utf-8") as f:
    dv_text = f.read()

# Add l10n variable
if "final l10n =" not in dv_text and "Widget build(BuildContext context) {" in dv_text:
    dv_text = dv_text.replace("Widget build(BuildContext context) {", "Widget build(BuildContext context) {\n    final l10n = ref.watch(l10nProvider);")

dv_replacements = [
    # Remove mojibake with l10n keys
    ("Text('$docType tTsdiq ? ?n g ndTrildi')", "Text('$docType ${ref.read(l10nProvider).verificationSent}')"),
    ("Text('XTta ba? verdi: $e')", "Text('${ref.read(l10nProvider).commonError}: $e')"),
    ("Text('S?r?c? statusu tTsdiqlTndi (MOCK)')", "Text(ref.read(l10nProvider).verificationMockApproved)"),
    ("Text('TTsdiqlTmT')", "Text(l10n.verificationTitle)"),
    ("Text('?TxsiyyTt vTsiqTsi')", "Text(l10n.verificationIdCard)"),
    ("Text('-n vT arxa tTrTf')", "Text(l10n.verificationIdCardDesc)"),
    ("Text('Selfi tTsdiqi')", "Text(l10n.verificationSelfie)"),
    ("Text('?z tan+ma ? ?n')", "Text(l10n.verificationSelfieDesc)"),
    ("Text('S?r?c?l?k vTsiqTsi')", "Text(l10n.verificationLicense)"),
    ("Text('Etibarl+ s?r?c?l?k vTsiqTsi')", "Text(l10n.verificationLicenseDesc)"),
    ("Text('Mock TTsdiqlT (Geli?tirici)')", "Text(l10n.verificationMockBtn)"),
    ("Text(isApproved ? 'TTsdiq' : 'Y?klT')", "Text(isApproved ? l10n.verificationApproveBtn : l10n.verificationUploadBtn)"),
    ("'?TxsiyyTt vTsiqTsi'", "ref.read(l10nProvider).verificationIdCard"),
    ("'Selfi tTsdiqi'", "ref.read(l10nProvider).verificationSelfie"),
    ("'S?r?c?l?k vTsiqTsi'", "ref.read(l10nProvider).verificationLicense"),
    ("'-n vT arxa tTrTf'", "ref.read(l10nProvider).verificationIdCardDesc"),
    ("'?z tan+ma ? ?n'", "ref.read(l10nProvider).verificationSelfieDesc"),
    ("'Etibarl+ s?r?c?l?k vTsiqTsi'", "ref.read(l10nProvider).verificationLicenseDesc"),
    ("'TTsdiq prosesi bir ne T dTqiqT  TkT bilTr. Status yenilTndikdT S?r?c? Paneli aktivlT?TcTk.'", "l10n.verificationNote"),
]
for old, new in dv_replacements:
    dv_text = dv_text.replace(old, new)
    
# We must ensure _VerifyTile takes l10n or we just use title as string. Oh wait, title is a string!
# So passing ref.read(l10nProvider).verificationIdCard to title is correct because it's evaluated at build time. Wait, _VerifyTile is stateless, we passed string literals.
# Let's see the _VerifyTile usage:
# _VerifyTile(
#   icon: Icons.badge_outlined,
#   title: ref.watch(l10nProvider).verificationIdCard, # wait, we can't use ref in the state class build method? We can, it's ConsumerState. But we have `l10n` variable.
dv_text = dv_text.replace("ref.read(l10nProvider).verificationIdCard", "l10n.verificationIdCard")
dv_text = dv_text.replace("ref.read(l10nProvider).verificationSelfie", "l10n.verificationSelfie")
dv_text = dv_text.replace("ref.read(l10nProvider).verificationLicense", "l10n.verificationLicense")
dv_text = dv_text.replace("ref.read(l10nProvider).verificationIdCardDesc", "l10n.verificationIdCardDesc")
dv_text = dv_text.replace("ref.read(l10nProvider).verificationSelfieDesc", "l10n.verificationSelfieDesc")
dv_text = dv_text.replace("ref.read(l10nProvider).verificationLicenseDesc", "l10n.verificationLicenseDesc")

# However for `_submit` method, it takes a string docType.
# The method: onUpload: () => _submit(l10n.verificationIdCard),
# and inside _submit: Text('$docType ${ref.read(l10nProvider).verificationSent}') is correct.

# Note widget:
# class _Note extends ConsumerWidget {
# Let's change _Note to ConsumerWidget if it uses l10n.
if "class _Note extends StatelessWidget" in dv_text:
    dv_text = dv_text.replace("class _Note extends StatelessWidget", "class _Note extends ConsumerWidget")
    dv_text = dv_text.replace("Widget build(BuildContext context) {", "Widget build(BuildContext context, WidgetRef ref) {", 1) # wait, replace only inside _Note!
    dv_text = re.sub(r"class _Note extends ConsumerWidget \{[\s\S]*?Widget build\(BuildContext context\) \{", "class _Note extends ConsumerWidget {\n  const _Note();\n\n  @override\n  Widget build(BuildContext context, WidgetRef ref) {\n    final l10n = ref.watch(l10nProvider);", dv_text)
    
with open(driver_ver_path, "w", encoding="utf-8") as f:
    f.write(dv_text)

# profile screen
profile_path = r"E:\yolustu\mobile\yolmates_app\lib\features\profile\profile_screen.dart"
replace_in_file(profile_path, [("const Text('İmtina')", "Text(l10n.commonDismiss)"), ("const Text('Imtina')", "Text(l10n.commonDismiss)")])

# reviews screen
reviews_path = r"E:\yolustu\mobile\yolmates_app\lib\features\reviews\reviews_screen.dart"
with open(reviews_path, "r", encoding="utf-8") as f:
    rv_text = f.read()
if "final l10n =" not in rv_text and "Widget build(BuildContext context) {" in rv_text:
    # it's a ConsumerWidget
    rv_text = re.sub(r"Widget build\(BuildContext context, WidgetRef ref\) \{", "Widget build(BuildContext context, WidgetRef ref) {\n    final l10n = ref.watch(l10nProvider);", rv_text)
rv_text = rv_text.replace("const Text('Rəylər')", "Text(l10n.commonReviews)")
rv_text = rv_text.replace("const Text('R?yl?r')", "Text(l10n.commonReviews)")
with open(reviews_path, "w", encoding="utf-8") as f:
    f.write(rv_text)

# trip_list_screen
trip_list_path = r"E:\yolustu\mobile\yolmates_app\lib\features\trips\trip_list_screen.dart"
with open(trip_list_path, "r", encoding="utf-8") as f:
    tl_text = f.read()
tl_text = tl_text.replace("Text('${trip.availableSeats} boş yer'", "Text('${trip.availableSeats} ${l10n.commonAvailableSeats}'")
tl_text = tl_text.replace("Text('${trip.availableSeats} bos yer'", "Text('${trip.availableSeats} ${l10n.commonAvailableSeats}'")
with open(trip_list_path, "w", encoding="utf-8") as f:
    f.write(tl_text)

print("Replacement script created successfully")
