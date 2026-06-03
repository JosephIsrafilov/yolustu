import '../../../shared/models/user.dart';

enum AuthStatus { unknown, unauthenticated, authenticated }

class AuthState {
  const AuthState({
    required this.status,
    this.user,
    this.isBusy = false,
    this.errorMessage,
  });

  const AuthState.unknown()
    : this(status: AuthStatus.unknown, isBusy: true);

  const AuthState.unauthenticated({
    bool isBusy = false,
    String? errorMessage,
  }) : this(
         status: AuthStatus.unauthenticated,
         isBusy: isBusy,
         errorMessage: errorMessage,
       );

  const AuthState.authenticated(
    User user, {
    bool isBusy = false,
  }) : this(
         status: AuthStatus.authenticated,
         user: user,
         isBusy: isBusy,
       );

  final AuthStatus status;
  final User? user;
  final bool isBusy;
  final String? errorMessage;

  bool get isAuthenticated => status == AuthStatus.authenticated && user != null;

  AuthState copyWith({
    AuthStatus? status,
    User? user,
    bool clearUser = false,
    bool? isBusy,
    String? errorMessage,
    bool clearError = false,
  }) {
    return AuthState(
      status: status ?? this.status,
      user: clearUser ? null : user ?? this.user,
      isBusy: isBusy ?? this.isBusy,
      errorMessage: clearError ? null : errorMessage ?? this.errorMessage,
    );
  }
}
