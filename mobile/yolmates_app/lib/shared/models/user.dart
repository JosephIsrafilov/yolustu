enum UserRole { passenger, driver, admin }

enum VerificationStatus { none, pending, verified, rejected }

class User {
  const User({
    required this.id,
    required this.fullName,
    required this.phoneNumber,
    required this.city,
    required this.rating,
    required this.completedTrips,
    required this.verificationStatus,
    required this.role,
    this.avatarUrl,
    this.bio,
  });

  factory User.fromJson(Map<String, dynamic> json) {
    return User(
      id: (json['id'] as String?) ?? '',
      fullName: (json['full_name'] ?? json['fullName'] ?? '') as String,
      phoneNumber: (json['phone'] ?? json['phoneNumber'] ?? '') as String,
      city: (json['city'] as String?) ?? '',
      rating: (json['rating'] as num?)?.toDouble() ?? 0,
      completedTrips:
          (json['completed_trips'] ?? json['completedTrips'] ?? 0) as int? ?? 0,
      verificationStatus: _verificationStatusFromJson(
        (json['verification_status'] ?? json['verificationStatus']) as String?,
      ),
      role: _userRoleFromJson((json['role'] as String?) ?? 'passenger'),
      avatarUrl: json['avatar_url'] as String? ?? json['avatarUrl'] as String?,
      bio: json['bio'] as String?,
    );
  }

  final String id;
  final String fullName;
  final String phoneNumber;
  final String city;
  final double rating;
  final int completedTrips;
  final VerificationStatus verificationStatus;
  final UserRole role;
  final String? avatarUrl;
  final String? bio;

  String get firstName => fullName.split(' ').first;

  User copyWith({
    String? id,
    String? fullName,
    String? phoneNumber,
    String? city,
    double? rating,
    int? completedTrips,
    VerificationStatus? verificationStatus,
    UserRole? role,
    String? avatarUrl,
    String? bio,
  }) {
    return User(
      id: id ?? this.id,
      fullName: fullName ?? this.fullName,
      phoneNumber: phoneNumber ?? this.phoneNumber,
      city: city ?? this.city,
      rating: rating ?? this.rating,
      completedTrips: completedTrips ?? this.completedTrips,
      verificationStatus: verificationStatus ?? this.verificationStatus,
      role: role ?? this.role,
      avatarUrl: avatarUrl ?? this.avatarUrl,
      bio: bio ?? this.bio,
    );
  }

  Map<String, dynamic> toJson() {
    return <String, dynamic>{
      'id': id,
      'full_name': fullName,
      'phone': phoneNumber,
      'city': city,
      'rating': rating,
      'completed_trips': completedTrips,
      'verification_status': verificationStatus.name,
      'role': role.name,
      'avatar_url': avatarUrl,
      'bio': bio,
    };
  }

  static UserRole _userRoleFromJson(String value) {
    return UserRole.values.firstWhere(
      (UserRole item) => item.name == value,
      orElse: () => UserRole.passenger,
    );
  }

  static VerificationStatus _verificationStatusFromJson(String? value) {
    return VerificationStatus.values.firstWhere(
      (VerificationStatus item) => item.name == value,
      orElse: () => VerificationStatus.none,
    );
  }
}
