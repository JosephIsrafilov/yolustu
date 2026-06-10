class User {
  final String id;
  final String name;
  final String phone;
  final String? avatarUrl;
  final double rating;
  final int tripCount;

  const User({
    required this.id,
    required this.name,
    required this.phone,
    this.avatarUrl,
    required this.rating,
    required this.tripCount,
  });

  factory User.fromJson(Map<String, dynamic> json) {
    return User(
      id: json['id'] as String,
      name: json['name'] as String,
      phone: json['phone'] as String,
      avatarUrl: json['avatar_url'] as String?,
      rating: (json['rating'] as num).toDouble(),
      tripCount: json['trip_count'] as int,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'phone': phone,
      'avatar_url': avatarUrl,
      'rating': rating,
      'trip_count': tripCount,
    };
  }
}
