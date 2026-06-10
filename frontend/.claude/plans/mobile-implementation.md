# Mobile App Implementation Plan

## Overview
Implement missing features in the Flutter mobile app (yolmates_app) to achieve feature parity with the backend API and web frontend. The mobile app already has a solid foundation with 73 Dart files covering authentication, rides, bookings, driver features, and profiles.

## Current State Analysis

### ✓ Implemented Features (16 screens)
- **Auth**: Login, OTP verification
- **Onboarding**: Onboarding screen
- **Rides**: Home, search, results, details
- **Bookings**: List, details
- **Driver**: Dashboard, create ride, my rides
- **Profile**: Profile view, setup
- **Reviews**: Create review
- **Settings**: Settings screen

### ✗ Missing Features (Backend API exists but mobile missing)
1. **Chat/Messaging** - Backend has full WebSocket support
2. **Wallet** - Balance, transactions, top-up
3. **Notifications** - WebSocket-based real-time notifications
4. **Vehicle Management** - Driver vehicle registration
5. **Admin Features** - Admin dashboard for admin users
6. **Payment Integration** - Stripe payment flow

## Implementation Strategy

### Phase 1: Core Data Models & API Endpoints (Foundation)
**Priority: High | Effort: 2-3 hours**

Create missing data models and API endpoint definitions to support new features.

#### New Models (`lib/shared/models/`)
1. **`message.dart`** - Chat message model
   - Maps to `MessageResponse` from backend
   - Fields: id, conversationId, rideId, senderId, senderName, content, createdAt, readAt
   
2. **`conversation.dart`** - Chat conversation model
   - Maps to `ConversationResponse` from backend
   - Fields: id, type (support/ride), rideId, bookingId, status, participants, createdAt, updatedAt
   
3. **`wallet.dart`** - Wallet and transaction models
   - `Wallet`: userId, availableBalance, pendingBalance, currency, totalEarned, totalSpent, totalRefunded
   - `WalletTransaction`: id, userId, paymentId, bookingId, type, direction, amount, currency, status, description, createdAt
   
4. **`vehicle.dart`** - Vehicle model
   - Fields: id, driverId, make, model, year, color, licensePlate, capacity, verificationStatus
   
5. **`notification.dart`** - Notification model
   - Fields: id, userId, type, title, body, data, read, createdAt

#### API Endpoints Update (`lib/core/network/api_endpoints.dart`)
```dart
// Chat endpoints
static const String conversations = '/chats';
static const String conversationMessages = '/chats/{id}/messages';
static const String sendMessage = '/chats/{id}/messages';
static const String createSupportChat = '/chats/support';
static const String createRideChat = '/chats/ride';
static const String markChatRead = '/chats/{id}/read';

// Wallet endpoints
static const String wallet = '/wallet/me';
static const String walletTransactions = '/wallet/me/transactions';
static const String walletTopup = '/wallet/me/topup';

// Vehicle endpoints
static const String vehicles = '/vehicles';
static const String myVehicle = '/vehicles/me';

// Notification WebSocket
static const String notificationWs = '/notifications/ws';
```

### Phase 2: Chat & Messaging Feature
**Priority: High | Effort: 4-5 hours**

Implement real-time chat with WebSocket support, following the web frontend pattern.

#### Directory Structure
```
lib/features/chat/
├── data/
│   ├── chat_repository.dart           # Mock + Real implementations
│   └── websocket_service.dart         # WebSocket connection manager
├── domain/
│   ├── chat_repository.dart           # Repository contract
│   └── chat_state.dart                # Chat state models
├── presentation/
│   ├── controllers/
│   │   └── chat_controller.dart       # Riverpod controller
│   ├── screens/
│   │   ├── conversations_screen.dart  # List of all chats
│   │   └── chat_screen.dart           # Individual chat view
│   └── widgets/
│       ├── message_bubble.dart        # Chat bubble widget
│       ├── message_input.dart         # Message input field
│       └── conversation_list_item.dart
```

#### Implementation Details

**WebSocket Service** (`websocket_service.dart`)
- Use `web_socket_channel` package (add to pubspec.yaml)
- Connect to `ws://API_BASE_URL/chats/ws/{conversationId}?token={accessToken}`
- Auto-reconnect on disconnect
- Broadcast incoming messages via Stream

**Chat Repository**
- Mock: Return fake conversations and messages
- Real: REST API for history, WebSocket for real-time updates
- Methods:
  - `getConversations()` - List user's chats
  - `getConversation(id)` - Get single conversation
  - `getMessages(conversationId, {limit, before})` - Get message history
  - `sendMessage(conversationId, content)` - Send message via REST
  - `createSupportChat()` - Create support conversation
  - `createRideChat(bookingId)` - Create ride-based conversation
  - `markAsRead(conversationId)` - Mark conversation as read
  - `connectToConversation(conversationId)` - WebSocket stream

**UI Screens**
- **ConversationsScreen**: List view with unread badges, last message preview
- **ChatScreen**: Full-screen chat with message bubbles, input field, auto-scroll
- Match the web frontend design from `ChatPanel.tsx`

**Router Integration**
Add routes to `lib/app/router.dart`:
```dart
GoRoute(path: '/chats', builder: ...) // List of conversations
GoRoute(path: '/chats/:id', builder: ...) // Individual chat
```

Add chat icon to bottom navigation in `app_scaffold.dart` (optional, or add to bookings/driver screens)

### Phase 3: Wallet Feature
**Priority: Medium | Effort: 3-4 hours**

Implement wallet balance display, transaction history, and top-up flow.

#### Directory Structure
```
lib/features/wallet/
├── data/
│   └── wallet_repository.dart
├── domain/
│   └── wallet_repository.dart
├── presentation/
│   ├── controllers/
│   │   └── wallet_controller.dart
│   ├── screens/
│   │   ├── wallet_screen.dart          # Balance + quick actions
│   │   ├── transactions_screen.dart    # Transaction history
│   │   └── topup_screen.dart           # Top-up form
│   └── widgets/
│       ├── wallet_card.dart            # Balance display card
│       └── transaction_list_item.dart
```

#### Implementation Details

**Wallet Repository**
- Mock: Return fake balance and transactions
- Real: Call REST API endpoints
- Methods:
  - `getWallet()` - Get wallet details
  - `getTransactions({page, limit})` - Paginated transaction history
  - `topup(amount)` - Initiate top-up (returns payment URL or confirmation)

**UI Screens**
- **WalletScreen**: Display balance, quick stats, recent transactions preview, top-up button
- **TransactionsScreen**: Paginated list of all transactions with filters
- **TopupScreen**: Simple form with amount input, submission triggers payment flow

**Router Integration**
```dart
GoRoute(path: '/wallet', builder: ...)
GoRoute(path: '/wallet/transactions', builder: ...)
GoRoute(path: '/wallet/topup', builder: ...)
```

Add wallet link to profile screen or settings screen.

### Phase 4: Vehicle Management
**Priority: Medium | Effort: 2-3 hours**

Allow drivers to register and manage their vehicles.

#### Directory Structure
```
lib/features/vehicles/
├── data/
│   └── vehicle_repository.dart
├── domain/
│   └── vehicle_repository.dart
├── presentation/
│   ├── controllers/
│   │   └── vehicle_controller.dart
│   └── screens/
│       ├── vehicle_registration_screen.dart
│       └── vehicle_details_screen.dart
```

#### Implementation Details

**Vehicle Repository**
- Methods:
  - `getMyVehicle()` - Get driver's registered vehicle
  - `registerVehicle(vehicleData)` - Register new vehicle
  - `updateVehicle(id, vehicleData)` - Update vehicle details
  - `deleteVehicle(id)` - Remove vehicle

**UI Screens**
- **VehicleRegistrationScreen**: Form with make, model, year, color, license plate, capacity
- **VehicleDetailsScreen**: Display vehicle info with edit/delete options

**Integration**
- Add vehicle setup step to driver onboarding flow
- Link from driver dashboard

### Phase 5: Notifications
**Priority: Medium | Effort: 2-3 hours**

Real-time notifications via WebSocket.

#### Directory Structure
```
lib/features/notifications/
├── data/
│   └── notification_service.dart
├── domain/
│   └── notification_state.dart
└── presentation/
    ├── controllers/
    │   └── notification_controller.dart
    └── widgets/
        └── notification_badge.dart
```

#### Implementation Details

**Notification Service**
- WebSocket connection to `/notifications/ws?token={accessToken}`
- Global singleton service managed by Riverpod
- Stream of incoming notifications
- Store unread count in state

**Integration**
- Display badge on bottom nav icons when new notifications arrive
- Show in-app toast/snackbar for incoming notifications
- Optional: Notifications list screen

### Phase 6: Admin Features (Optional)
**Priority: Low | Effort: 4-5 hours**

Admin dashboard for users with admin role.

Only implement if admin users will use mobile app. Otherwise, keep admin features web-only.

## Dependencies to Add

Update `pubspec.yaml`:
```yaml
dependencies:
  web_socket_channel: ^3.0.0    # WebSocket support for chat
  intl: ^0.20.2                  # Already present, for currency formatting
  flutter_localizations:          # Already present
    sdk: flutter
```

## Architectural Patterns to Follow

### Repository Pattern
- Abstract repository interface in `domain/`
- Mock implementation for development/testing
- Real implementation calling API via Dio
- Provider registration checks `AppConfig.isMockMode`

### State Management
- Use Riverpod StateNotifier for complex state
- Simple Provider for repositories
- AsyncValue for loading/error states

### Error Handling
- Wrap API calls in try-catch
- Return `ApiResult<T>` (Success/Failure) from repositories
- Display error messages in UI with `ErrorView` widget

### Code Style
- Match existing patterns from auth/rides/bookings features
- Use `fromJson`/`toJson` for model serialization
- Consistent naming: `{feature}_repository.dart`, `{feature}_controller.dart`, `{screen_name}_screen.dart`
- Follow Flutter/Dart style guide

## Testing Strategy

After implementation:
1. Run `flutter analyze` - Fix all warnings
2. Run `flutter test` - Ensure existing tests pass
3. Manual testing:
   - Test in mock mode first (no backend required)
   - Test in real mode with backend running
   - Verify error states when backend is unavailable

## Migration Path

### Step 1: Foundation (Phase 1)
Create all models and API endpoints. This enables other phases to proceed in parallel.

### Step 2: High Priority (Phase 2-3)
Implement Chat and Wallet features. These add significant user value.

### Step 3: Medium Priority (Phase 4-5)
Vehicle management and notifications. These complete the driver experience.

### Step 4: Optional (Phase 6)
Admin features if needed.

## Implementation Order (Recommended)

1. **Phase 1** - Models & API endpoints (prerequisite for all)
2. **Phase 2** - Chat feature (high user value, complex)
3. **Phase 3** - Wallet feature (high user value, simpler)
4. **Phase 4** - Vehicle management (driver completion)
5. **Phase 5** - Notifications (polish)
6. **Phase 6** - Admin features (optional)

## Risks & Considerations

1. **WebSocket Connection Management**
   - Need proper reconnection logic
   - Handle token refresh for WebSocket connections
   - Test on poor network conditions

2. **State Synchronization**
   - Chat messages: WebSocket vs REST API consistency
   - Notification badge counts
   - Wallet balance after transactions

3. **Testing Coverage**
   - Mock mode must work without backend
   - Real mode graceful degradation when backend unavailable

4. **Performance**
   - Long chat histories: Implement pagination
   - Transaction history: Virtual scrolling for large lists
   - WebSocket memory leaks: Proper disposal

## Success Criteria

- [ ] All new features work in both mock and real API modes
- [ ] `flutter analyze` passes with no errors
- [ ] All existing tests pass
- [ ] Manual testing confirms:
  - Chat messages send and receive in real-time
  - Wallet displays correct balance
  - Vehicle registration flow completes
  - Notifications appear when triggered
- [ ] Error states display properly when backend is unavailable
- [ ] Code follows existing architectural patterns

## Estimated Total Effort

- Phase 1: 2-3 hours
- Phase 2: 4-5 hours
- Phase 3: 3-4 hours
- Phase 4: 2-3 hours
- Phase 5: 2-3 hours
- Phase 6: 4-5 hours (optional)

**Total: 17-23 hours** (13-18 hours without admin features)

## Next Steps After Approval

1. Add `web_socket_channel` to pubspec.yaml
2. Create model files for Message, Conversation, Wallet, Vehicle, Notification
3. Update ApiEndpoints class
4. Implement Chat feature (highest priority)
5. Continue with remaining phases
