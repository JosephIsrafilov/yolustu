import 'user.dart';

class Review {
  const Review({
    required this.id,
    required this.author,
    required this.rating,
    required this.comment,
    required this.createdAt,
  });

  factory Review.fromJson(Map<String, dynamic> json) {
    return Review(
      id: (json['id'] as String?) ?? '',
      author: User.fromJson(
        (json['author'] as Map<String, dynamic>?) ??
            <String, dynamic>{
              'id': '',
              'full_name': 'Anonymous',
              'phone': '',
              'city': '',
              'rating': 0,
              'completed_trips': 0,
              'verification_status': 'none',
              'role': 'passenger',
            },
      ),
      rating: (json['rating'] as num?)?.toDouble() ?? 0,
      comment: (json['comment'] as String?) ?? '',
      createdAt: DateTime.parse(
        (json['created_at'] ??
                json['createdAt'] ??
                DateTime.now().toIso8601String())
            as String,
      ),
    );
  }

  final String id;
  final User author;
  final double rating;
  final String comment;
  final DateTime createdAt;
  Map<String, dynamic> toJson() {
    return <String, dynamic>{
      'id': id,
      'author': author.toJson(),
      'rating': rating,
      'comment': comment,
      'created_at': createdAt.toIso8601String(),
    };
  }
}
