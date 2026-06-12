/// Authenticated user profile (distinct from the trip-domain [User] model).
///
/// Kept intentionally small; backend integration can map its DTO onto this.
enum UserRole { passenger, driver }

enum AppLanguage { az, ru, en }

class AppUser {
  final String id;
  final String phone;
  final String? firstName;
  final String? lastName;
  final String? avatarUrl;
  final UserRole role;
  final AppLanguage language;

  const AppUser({
    required this.id,
    required this.phone,
    this.firstName,
    this.lastName,
    this.avatarUrl,
    this.role = UserRole.passenger,
    this.language = AppLanguage.az,
  });

  /// Profile is complete once both name fields are filled.
  bool get isProfileComplete =>
      (firstName?.trim().isNotEmpty ?? false) &&
      (lastName?.trim().isNotEmpty ?? false);

  String get fullName =>
      [firstName, lastName].where((p) => p != null && p.isNotEmpty).join(' ');

  String get initials {
    final f = (firstName ?? '').trim();
    final l = (lastName ?? '').trim();
    final a = f.isNotEmpty ? f[0] : '';
    final b = l.isNotEmpty ? l[0] : '';
    final out = (a + b).toUpperCase();
    return out.isEmpty ? '?' : out;
  }

  AppUser copyWith({
    String? firstName,
    String? lastName,
    String? avatarUrl,
    UserRole? role,
    AppLanguage? language,
  }) {
    return AppUser(
      id: id,
      phone: phone,
      firstName: firstName ?? this.firstName,
      lastName: lastName ?? this.lastName,
      avatarUrl: avatarUrl ?? this.avatarUrl,
      role: role ?? this.role,
      language: language ?? this.language,
    );
  }

  factory AppUser.fromJson(Map<String, dynamic> json) {
    return AppUser(
      id: json['id'] as String,
      phone: json['phone'] as String,
      firstName: json['first_name'] as String?,
      lastName: json['last_name'] as String?,
      avatarUrl: json['avatar_url'] as String?,
      role: UserRole.values.firstWhere(
        (r) => r.name == json['role'],
        orElse: () => UserRole.passenger,
      ),
      language: AppLanguage.values.firstWhere(
        (l) => l.name == json['language'],
        orElse: () => AppLanguage.az,
      ),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'phone': phone,
      'first_name': firstName,
      'last_name': lastName,
      'avatar_url': avatarUrl,
      'role': role.name,
      'language': language.name,
    };
  }
}
