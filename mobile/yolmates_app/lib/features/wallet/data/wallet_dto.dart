import 'wallet.dart';

/// DTO for wallet balance from backend.
class WalletBalanceDTO {
  final String userId;
  final String availableBalance;
  final String pendingBalance;
  final String currency;
  final String totalEarned;
  final String totalSpent;

  WalletBalanceDTO({
    required this.userId,
    required this.availableBalance,
    required this.pendingBalance,
    required this.currency,
    required this.totalEarned,
    required this.totalSpent,
  });

  factory WalletBalanceDTO.fromJson(Map<String, dynamic> json) {
    return WalletBalanceDTO(
      userId: json['user_id']?.toString() ?? '',
      availableBalance: json['available_balance']?.toString() ?? '0',
      pendingBalance: json['pending_balance']?.toString() ?? '0',
      currency: json['currency']?.toString() ?? 'AZN',
      totalEarned: json['total_earned']?.toString() ?? '0',
      totalSpent: json['total_spent']?.toString() ?? '0',
    );
  }

  WalletBalance toDomain() {
    final available = double.tryParse(availableBalance) ?? 0.0;
    return WalletBalance(
      userId: userId,
      // ponytail: backend returns single balance; treat it as passenger balance
      passengerBalance: available,
      driverBalance: double.tryParse(totalEarned) ?? 0.0,
      pendingBalance: double.tryParse(pendingBalance) ?? 0.0,
      currency: currency,
      totalEarned: double.tryParse(totalEarned) ?? 0.0,
      totalSpent: double.tryParse(totalSpent) ?? 0.0,
    );
  }
}

/// DTO for wallet transaction from backend.
class WalletTransactionDTO {
  final String id;
  final String userId;
  final String type;
  final String amount;
  final String currency;
  final String balanceAfter;
  final String? relatedBookingId;
  final String? relatedPaymentId;
  final String? description;
  final String createdAt;

  WalletTransactionDTO({
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

  factory WalletTransactionDTO.fromJson(Map<String, dynamic> json) {
    return WalletTransactionDTO(
      id: json['id']?.toString() ?? '',
      userId: json['user_id']?.toString() ?? '',
      type: json['type']?.toString() ?? 'adjustment',
      amount: json['amount']?.toString() ?? '0',
      currency: json['currency']?.toString() ?? 'AZN',
      balanceAfter: json['balance_after']?.toString() ?? '0',
      relatedBookingId: json['related_booking_id'] as String?,
      relatedPaymentId: json['related_payment_id'] as String?,
      description: json['description'] as String?,
      createdAt:
          json['created_at']?.toString() ?? DateTime.now().toIso8601String(),
    );
  }

  WalletTransaction toDomain() {
    return WalletTransaction(
      id: id,
      userId: userId,
      type: _parseType(type),
      amount: double.tryParse(amount) ?? 0.0,
      currency: currency,
      balanceAfter: double.tryParse(balanceAfter) ?? 0.0,
      relatedBookingId: relatedBookingId,
      relatedPaymentId: relatedPaymentId,
      description: description,
      createdAt: DateTime.tryParse(createdAt) ?? DateTime.now(),
    );
  }

  WalletTransactionType _parseType(String type) {
    switch (type) {
      case 'passenger_payment':
        return WalletTransactionType.passengerPayment;
      case 'platform_fee':
        return WalletTransactionType.platformFee;
      case 'driver_pending_earning':
        return WalletTransactionType.driverPendingEarning;
      case 'driver_available_earning':
        return WalletTransactionType.driverAvailableEarning;
      case 'refund':
        return WalletTransactionType.refund;
      case 'payout':
        return WalletTransactionType.payout;
      case 'topup':
      case 'top_up':
        return WalletTransactionType.topUp;
      case 'adjustment':
        return WalletTransactionType.adjustment;
      default:
        return WalletTransactionType.adjustment;
    }
  }
}
