/// Domain model for wallet balance and transactions.
class WalletBalance {
  final String userId;
  final double availableBalance;
  final double pendingBalance;
  final String currency;
  final double totalEarned;
  final double totalSpent;

  const WalletBalance({
    required this.userId,
    required this.availableBalance,
    required this.pendingBalance,
    required this.currency,
    required this.totalEarned,
    required this.totalSpent,
  });

  WalletBalance copyWith({
    String? userId,
    double? availableBalance,
    double? pendingBalance,
    String? currency,
    double? totalEarned,
    double? totalSpent,
  }) {
    return WalletBalance(
      userId: userId ?? this.userId,
      availableBalance: availableBalance ?? this.availableBalance,
      pendingBalance: pendingBalance ?? this.pendingBalance,
      currency: currency ?? this.currency,
      totalEarned: totalEarned ?? this.totalEarned,
      totalSpent: totalSpent ?? this.totalSpent,
    );
  }
}

enum WalletTransactionType {
  passengerPayment,
  platformFee,
  driverPendingEarning,
  driverAvailableEarning,
  refund,
  payout,
  adjustment;

  String get label {
    switch (this) {
      case WalletTransactionType.passengerPayment:
        return 'Səyahət ödənişi';
      case WalletTransactionType.platformFee:
        return 'Platforma haqqı';
      case WalletTransactionType.driverPendingEarning:
        return 'Gözləyən gəlir';
      case WalletTransactionType.driverAvailableEarning:
        return 'Qazanc';
      case WalletTransactionType.refund:
        return 'Geri qaytarma';
      case WalletTransactionType.payout:
        return 'Ödəniş';
      case WalletTransactionType.adjustment:
        return 'Düzəliş';
    }
  }
}

class WalletTransaction {
  final String id;
  final String userId;
  final WalletTransactionType type;
  final double amount;
  final String currency;
  final double balanceAfter;
  final String? relatedBookingId;
  final String? relatedPaymentId;
  final String? description;
  final DateTime createdAt;

  const WalletTransaction({
    required this.id,
    required this.userId,
    required this.type,
    required this.amount,
    required this.currency,
    required this.balanceAfter,
    this.relatedBookingId,
    this.relatedPaymentId,
    this.description,
    required this.createdAt,
  });

  bool get isCredit => amount > 0;
  bool get isDebit => amount < 0;
}
