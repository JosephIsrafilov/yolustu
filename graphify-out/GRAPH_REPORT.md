# Graph Report - yolustu  (2026-11-01)

## Corpus Check
- Large corpus: 640 files · ~625,474 words. Semantic extraction will be expensive (many Claude tokens). Consider running on a subfolder.

## Summary
- 5161 nodes · 12588 edges · 206 communities (157 shown, 49 thin omitted)
- Extraction: 95% EXTRACTED · 5% INFERRED · 0% AMBIGUOUS · INFERRED: 605 edges (avg confidence: 0.91)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- Community 0
- Community 1
- Community 2
- Community 3
- Community 4
- Community 5
- Community 6
- Community 7
- Community 8
- Community 9
- Community 10
- Community 11
- Community 12
- Community 13
- Community 14
- Community 15
- Community 16
- Community 17
- Community 18
- Community 19
- Community 20
- Community 21
- Community 22
- Community 23
- Community 24
- Community 25
- Community 26
- Community 27
- Community 28
- Community 29
- Community 30
- Community 31
- Community 32
- Community 33
- Community 34
- Community 35
- Community 36
- Community 37
- Community 38
- Community 39
- Community 40
- Community 41
- Community 42
- Community 43
- Community 44
- Community 45
- Community 46
- Community 47
- Community 48
- Community 49
- Community 50
- Community 51
- Community 52
- Community 53
- Community 54
- Community 55
- Community 56
- Community 57
- Community 58
- Community 59
- Community 60
- Community 61
- Community 62
- Community 63
- Community 64
- Community 65
- Community 66
- Community 67
- Community 68
- Community 69
- Community 70
- Community 71
- Community 72
- Community 73
- Community 74
- Community 75
- Community 76
- Community 77
- Community 78
- Community 79
- Community 80
- Community 81
- Community 82
- Community 83
- Community 84
- Community 85
- Community 86
- Community 87
- Community 88
- Community 89
- Community 90
- Community 91
- Community 92
- Community 93
- Community 94
- Community 95
- Community 96
- Community 97
- Community 98
- Community 99
- Community 100
- Community 101
- Community 102
- Community 103
- Community 104
- Community 105
- Community 106
- Community 107
- Community 108
- Community 109
- Community 110
- Community 112
- Community 113
- Community 114
- Community 115
- Community 116
- Community 117
- Community 118
- Community 119
- Community 120
- Community 121
- Community 122
- Community 123
- Community 124
- Community 125
- Community 126
- Community 127
- Community 128
- Community 129
- Community 130
- Community 131
- Community 132
- Community 133
- Community 134
- Community 135
- Community 136
- Community 137
- Community 138
- Community 139
- Community 140
- Community 141
- Community 142
- Community 143
- Community 145
- Community 146
- Community 147
- Community 148
- Community 149
- Community 150
- Community 151
- Community 152
- Community 153
- Community 154
- Community 155
- Community 156
- Community 157
- Community 158
- Community 159
- Community 160
- Community 161
- Community 162
- Community 163
- Community 164
- Community 165
- Community 166
- Community 167
- Community 168
- Community 169
- Community 170
- Community 171
- Community 172
- Community 173
- Community 174
- Community 175
- Community 176
- Community 177
- Community 181
- Community 183
- Community 184
- Community 185
- Community 186
- Community 188
- Community 189

## God Nodes (most connected - your core abstractions)
1. `CurrentUser` - 199 edges
2. `useAppStore` - 158 edges
3. `Icon()` - 126 edges
4. `react` - 99 edges
5. `l10nProvider` - 87 edges
6. `Button()` - 85 edges
7. `AdminService` - 74 edges
8. `Card()` - 65 edges
9. `PaymentService` - 60 edges
10. `TripsService` - 60 edges

## Surprising Connections (you probably didn't know these)
- `test_request_password_reset_success()` --uses--> `User`  [INFERRED]
  backend/tests/test_auth.py → backend/app/domains/identity/models.py
- `test_user_response_handles_null_values()` --uses--> `UserResponse`  [INFERRED]
  backend/tests/test_trip_schemas.py → backend/app/domains/identity/schemas.py
- `NotificationService` --uses--> `DeviceToken`  [INFERRED]
  backend/app/core/notifications.py → backend/app/domains/identity/models.py
- `EngagementService` --uses--> `NotificationService`  [INFERRED]
  backend/app/domains/engagement/services.py → backend/app/core/notifications.py
- `PaymentService` --uses--> `NotificationService`  [INFERRED]
  backend/app/domains/payments/services.py → backend/app/core/notifications.py

## Import Cycles
- None detected.

## Communities (206 total, 49 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.01
Nodes (391): activeRideCompleteButton, activeRideCompleted, activeRideError, activeRideGoBack, activeRideStartButton, activeRideTitle, addVehicleBrand, addVehicleBrandHint (+383 more)

### Community 1 - "Community 1"
Cohesion: 0.05
Nodes (59): Location, RideCreate, test_approved_driver_vs_unapproved_driver_create_ride(), FakeRide, FakeRideRepository, FakeUserRepo, FakeVehicle, FakeVehicleRepository (+51 more)

### Community 2 - "Community 2"
Cohesion: 0.04
Nodes (24): upgrade(), upgrade(), upgrade(), upgrade(), upgrade(), upgrade(), upgrade(), upgrade() (+16 more)

### Community 3 - "Community 3"
Cohesion: 0.06
Nodes (17): Settings, get_db(), send_email(), create_paginated_response(), PaginatedResponse, get_redis(), shutdown_scheduler(), MessageResponse (+9 more)

### Community 4 - "Community 4"
Cohesion: 0.09
Nodes (36): COPY, APPLY_I18N, DOCS_I18N, DASHBOARD_I18N, COPY, SETUP_I18N, CHAT_PAGE_I18N, GuardMode (+28 more)

### Community 5 - "Community 5"
Cohesion: 0.07
Nodes (52): AboutPage(), COPY, LegacyBookingRequestsPage(), HelpPage(), COPY, PrivacyPage(), PROFILE_DETAILS_I18N, PublicProfilePage() (+44 more)

### Community 6 - "Community 6"
Cohesion: 0.05
Nodes (52): l10nProvider, languageProvider, AuthIntroScreen, _resend, _verify, _submit, build, initState (+44 more)

### Community 7 - "Community 7"
Cohesion: 0.09
Nodes (53): AdminBookingsPage(), BOOKINGS_I18N, STATUSES, AdminDashboardPage(), DASHBOARD_I18N, AdminPaymentsPage(), COPY, STATUSES (+45 more)

### Community 8 - "Community 8"
Cohesion: 0.04
Nodes (58): _AvatarPlaceholder, _ChoiceChipBox, _BottomBar, build, child, _city, _confirm, _Content (+50 more)

### Community 9 - "Community 9"
Cohesion: 0.04
Nodes (50): apiClientProvider, authTokenStorageProvider, _bootstrap, markOnboardingSeen, _startChat, build, _channel, ChatMessagesNotifier (+42 more)

### Community 10 - "Community 10"
Cohesion: 0.07
Nodes (15): can_transition_ride(), Ride, Vehicle, RideLookupPort, RideRepository, VehicleRepository, TripsService, test_booking_boarding_transitions() (+7 more)

### Community 11 - "Community 11"
Cohesion: 0.03
Nodes (32): addVehicle, AppRoutes, authIntro, bookingConfirm, bookingDetails, bookings, chatDetails, createRide (+24 more)

### Community 12 - "Community 12"
Cohesion: 0.05
Nodes (49): CREATE_TRIP_PAGE_I18N, CreateTripPage(), FormValues, getValidationSchema(), TestMapPage(), TripFilters(), TripFiltersProps, CitySelect() (+41 more)

### Community 13 - "Community 13"
Cohesion: 0.07
Nodes (45): configure_payment_settings(), FakeNotificationService, test_cannot_get_payment_of_other_user(), test_cannot_refund_non_succeeded_payment(), test_cannot_request_payout_insufficient_balance(), test_create_payment_already_succeeded(), test_create_payment_booking_not_found(), test_create_payment_no_reserved_seats() (+37 more)

### Community 14 - "Community 14"
Cohesion: 0.07
Nodes (31): BookingParticipantPort, ReviewCreate, FakeBookingParticipantPort, FakeChatMessageRepository, FakeConversationRepository, FakeDb, FakeMessageRepository, FakeNotificationService (+23 more)

### Community 15 - "Community 15"
Cohesion: 0.05
Nodes (32): build, _SplashBranding, SplashScreen, booking, _BookingCard, DriverRide, PassengerRequest, _action (+24 more)

### Community 16 - "Community 16"
Cohesion: 0.04
Nodes (43): build, comingSoon, _ContactCard, reportSubtitle, reportTitle, _row, supportTitle, AppCard (+35 more)

### Community 17 - "Community 17"
Cohesion: 0.11
Nodes (46): ChatMessageCreate, MessageCreate, FakeBookingParticipantPort, FakeConversation, FakeParticipant, FakeRide, FakeRideLookup, FakeTargetUser (+38 more)

### Community 18 - "Community 18"
Cohesion: 0.04
Nodes (45): build, _controller, createState, _dialCode, dispose, enabled, _error, _formKey (+37 more)

### Community 19 - "Community 19"
Cohesion: 0.07
Nodes (34): formatDayLabel(), groupTransactionsByDay(), Lang, LOCALE_BY_LANG, RELATIVE_COPY, TransactionGroup, amount(), ApiPaginated (+26 more)

### Community 20 - "Community 20"
Cohesion: 0.09
Nodes (26): geometry_to_location(), PublicTrackResponse, ride_to_public_track(), ride_to_response(), RideBase, RideResponse, RideSearch, VehicleBase (+18 more)

### Community 21 - "Community 21"
Cohesion: 0.07
Nodes (43): AnimatedAlertModal(), AZ_LETTERS, AZ_REGIONS, AzerbaijanPlateBadge(), CustomPlateDropdown(), CustomPlateDropdownProps, DriverVehiclePage(), FocusableRef (+35 more)

### Community 22 - "Community 22"
Cohesion: 0.06
Nodes (17): ProfileHeaderProps, apiAuthService, AuthSessionResponse, ApiUser, AdminCreateUserInput, AdminService, AdminStats, GetUsersOptions (+9 more)

### Community 23 - "Community 23"
Cohesion: 0.11
Nodes (37): ForgotPasswordPage(), LoginPage(), RegisterPage(), VerifyContent(), VerifyPage(), ChatDetailsPage(), COPY, ChatsPage() (+29 more)

### Community 24 - "Community 24"
Cohesion: 0.05
Nodes (40): ApiAuthRepository, _clearSession, _client, currentUser, logout, mapUserResponse, mockApproveDriver, _parseLanguage (+32 more)

### Community 25 - "Community 25"
Cohesion: 0.08
Nodes (7): get_password_hash(), User, UserLookupPort, UserRepository, seed_user(), test_cannot_self_promote_role(), get_by_id()

### Community 26 - "Community 26"
Cohesion: 0.05
Nodes (21): Cocoa, file_selector_macos, firebase_core, firebase_messaging, Flutter, flutter_secure_storage_macos, FlutterMacOS, Foundation (+13 more)

### Community 27 - "Community 27"
Cohesion: 0.12
Nodes (38): DemoNotifications(), filterTrips(), validateEmail(), validatePassword(), validatePhone(), bookingFor(), delay(), demoAuthService (+30 more)

### Community 28 - "Community 28"
Cohesion: 0.05
Nodes (33): AppUser, build, _Bullet, _h, icon, subtitle, title, _ActionCard (+25 more)

### Community 29 - "Community 29"
Cohesion: 0.08
Nodes (27): BookingCardProps, WalletPaymentModalProps, ReviewCardProps, apiBookingsService, apiTripsService, ApiAiDocumentReview, ApiBooking, ApiReview (+19 more)

### Community 30 - "Community 30"
Cohesion: 0.10
Nodes (24): AdminUserCreate, FakeAdminRepository, FakeBookingRepository, FakeRideRepository, FakeUser, FakeUserRepository, make_cu(), make_service() (+16 more)

### Community 31 - "Community 31"
Cohesion: 0.05
Nodes (37): PhoneLoginScreen, _PhoneLoginScreenState, BookingConfirmScreen, _BookingConfirmScreenState, build, createState, DriverVerificationScreen, _DriverVerificationScreenState (+29 more)

### Community 32 - "Community 32"
Cohesion: 0.12
Nodes (17): AuditLogRepository, _admin_current_user(), _create_user_payload(), _make_admin_in_db(), test_approve_verification_logs_action(), test_audit_log_count(), test_audit_log_filtering_by_admin(), test_audit_log_filtering_by_date_range() (+9 more)

### Community 33 - "Community 33"
Cohesion: 0.21
Nodes (39): FakeBooking, FakeRide, make_current_user(), make_service(), test_boarding_status_admin_can_update(), test_boarding_status_already_target(), test_boarding_status_invalid_transition(), test_boarding_status_unauthorized() (+31 more)

### Community 34 - "Community 34"
Cohesion: 0.11
Nodes (20): Badge, UserBadge, get_all_badges(), get_my_badges(), BadgeBase, BadgeCreate, BadgeResponse, UserBadgeResponse (+12 more)

### Community 35 - "Community 35"
Cohesion: 0.13
Nodes (23): BookingSeed, city_point(), created_datetime(), departure_datetime(), find_by_unique(), mask_database_url(), MessageSeed, PaymentSeed (+15 more)

### Community 36 - "Community 36"
Cohesion: 0.13
Nodes (5): Conversation, ConversationParticipant, Message, ConversationRepository, MessageRepository

### Community 37 - "Community 37"
Cohesion: 0.14
Nodes (36): LoginInput, UserCreate, UserUpdate, FakeUser, make_cu(), make_service(), test_get_user_not_found_raises_404(), test_login_success() (+28 more)

### Community 38 - "Community 38"
Cohesion: 0.09
Nodes (27): PublicTrackPage(), STATUS_LABEL, DemoRouteMap(), GoogleMapRenderer, LiveMap(), SmartMap(), CONTAINER_STYLE, DEFAULT_CENTER (+19 more)

### Community 39 - "Community 39"
Cohesion: 0.12
Nodes (27): ChatPanelProps, COPY, AssistantMessage, COPY, ActiveMode, SupportAssistantResponse, ApiErrorParams, toApiError() (+19 more)

### Community 40 - "Community 40"
Cohesion: 0.16
Nodes (23): approve_payout(), approve_verification(), block_user(), change_user_role(), create_user(), delete_ride(), get_admin_stats(), get_audit_logs() (+15 more)

### Community 41 - "Community 41"
Cohesion: 0.12
Nodes (10): Payment, BasePaymentProvider, get_payment_provider(), KapitalPaymentProvider, MockPaymentProvider, PaymentSession, PaymentWebhookEvent, PayriffPaymentProvider (+2 more)

### Community 42 - "Community 42"
Cohesion: 0.06
Nodes (33): _aiError, _aiSuggestion, _allowLuggage, _allowMusic, _allowSmoking, build, CreateRideScreen, _CreateRideScreenState (+25 more)

### Community 43 - "Community 43"
Cohesion: 0.16
Nodes (5): WalletTransaction, WalletRepository, money(), PaymentService, test_decimal_precision_rounds_money_values()

### Community 44 - "Community 44"
Cohesion: 0.14
Nodes (19): BookingBase, BookingCreate, FakeBooking, FakeBookingRepository, FakeNotificationService, FakeRide, FakeRideLookupPort, make_current_user() (+11 more)

### Community 45 - "Community 45"
Cohesion: 0.11
Nodes (18): apiAdminService, ApiPaginated, apiClient, extractErrorMessage(), getCookie(), hasSessionHint(), mapStatusToCode(), normalizeApiBaseUrl() (+10 more)

### Community 46 - "Community 46"
Cohesion: 0.10
Nodes (4): expire_bookings_job(), start_scheduler(), Booking, BookingRepository

### Community 47 - "Community 47"
Cohesion: 0.11
Nodes (8): FakeBooking, FakeBookingRepository, FakePayment, FakePaymentRepository, FakeWallet, FakeWalletRepository, FakeWalletTransaction, _seed_filter_transactions()

### Community 48 - "Community 48"
Cohesion: 0.06
Nodes (29): build, _codeLength, _controller, createState, dispose, enabled, _error, _focusNode (+21 more)

### Community 49 - "Community 49"
Cohesion: 0.07
Nodes (14): fl_register_plugins(), main(), first_frame_cb(), my_application_activate(), my_application_class_init(), my_application_dispose(), my_application_init(), my_application_local_command_line() (+6 more)

### Community 50 - "Community 50"
Cohesion: 0.06
Nodes (33): availableSeats, avatarUrl, brand, color, createdAt, departureTime, description, destinationCity (+25 more)

### Community 51 - "Community 51"
Cohesion: 0.07
Nodes (14): _client, _formatDate, rideById, search, all, _client, create, updateStatus (+6 more)

### Community 52 - "Community 52"
Cohesion: 0.07
Nodes (18): ApiClient, _AuthInterceptor, _dio, _ErrorInterceptor, _isRefreshing, onError, onRequest, onResponse (+10 more)

### Community 53 - "Community 53"
Cohesion: 0.18
Nodes (5): NotificationService, booking_to_response(), BookingResponse, BookingsService, can_transition_booking()

### Community 54 - "Community 54"
Cohesion: 0.12
Nodes (4): ConnectionManager, _conv_channel(), _ride_channel(), _user_channel()

### Community 55 - "Community 55"
Cohesion: 0.16
Nodes (25): react, BookingsPage(), DriverApplyPage(), DriverDocumentsPage(), MyTripsPage(), ACTIVE_BOOKING_STATUSES, DriverTripManagePage(), DriverDashboardPage() (+17 more)

### Community 56 - "Community 56"
Cohesion: 0.07
Nodes (25): _, AuthController, authenticated, authRepositoryProvider, AuthState, AuthStatus, build, completeProfile (+17 more)

### Community 57 - "Community 57"
Cohesion: 0.13
Nodes (16): create_ride_chat(), create_support_chat(), get_chat(), get_chat_messages(), list_chats(), mark_chat_read(), send_chat_message(), upload_attachment() (+8 more)

### Community 58 - "Community 58"
Cohesion: 0.11
Nodes (23): ConnectingRoutesMap, HeroMap, HeroSelect(), HomePage(), parseStatValue(), TOP_ROUTES, ConnectingRoutesMap(), ConnectingRoutesMapProps (+15 more)

### Community 59 - "Community 59"
Cohesion: 0.11
Nodes (26): formatAbsoluteTime(), formatRelativeTime(), FALLBACK_META, getTransactionMeta(), TRANSACTION_META, transactionLabel(), WalletLang, METRIC_META (+18 more)

### Community 60 - "Community 60"
Cohesion: 0.07
Nodes (24): _apiKey, _appIdAndroid, _appIdIos, DefaultFirebaseOptions, _iosBundleId, _messagingSenderId, _projectId, _storageBucket (+16 more)

### Community 61 - "Community 61"
Cohesion: 0.14
Nodes (12): FakeAdminRepository, FakeBookingRepository, FakeRide, FakeRideRepository, FakeUser, FakeUserRepository, make_current_user(), make_service() (+4 more)

### Community 62 - "Community 62"
Cohesion: 0.07
Nodes (23): ApiException, code, conflict, details, forbidden, message, networkError, notFound (+15 more)

### Community 63 - "Community 63"
Cohesion: 0.07
Nodes (28): attachments, bookingId, ChatMessage, content, Conversation, conversationId, ConversationParticipant, createdAt (+20 more)

### Community 64 - "Community 64"
Cohesion: 0.22
Nodes (14): _cookie_samesite(), login(), logout(), refresh_token(), register(), request_email_verification(), request_otp(), request_password_reset() (+6 more)

### Community 65 - "Community 65"
Cohesion: 0.14
Nodes (7): bearing(), _demo(), fetch_road_route(), haversine_m(), interpolate_route(), resample_path(), TrackingManager

### Community 66 - "Community 66"
Cohesion: 0.09
Nodes (8): main, main, main, main, main, main, _pumpApp, pumpWidget

### Community 67 - "Community 67"
Cohesion: 0.10
Nodes (10): get_ride_messages(), send_message(), websocket_endpoint(), notifications_websocket(), get_current_user_from_token(), get_current_user_from_websocket(), track_ride(), FakeUser (+2 more)

### Community 68 - "Community 68"
Cohesion: 0.17
Nodes (18): create_payment(), get_payment(), legacy_payment_webhook(), list_payments_admin(), mock_payment_fail(), mock_payment_succeed(), pay_from_wallet(), payment_webhook() (+10 more)

### Community 69 - "Community 69"
Cohesion: 0.13
Nodes (17): AdminRouteLayout(), metadata, RootLayout(), AuthProvider(), AUTH_REQUIRED_PREFIXES, DRIVER_PROTECTED_PREFIXES, RouteAccessGuard(), startsWithAny() (+9 more)

### Community 70 - "Community 70"
Cohesion: 0.11
Nodes (12): BookingRequestCardProps, TripCardProps, ApiPaginatedResponse, ApiPublicTrack, resolveCoordinates(), resolveVehicleId(), mapCreateTripToApiRideCreate(), CreateTripInput (+4 more)

### Community 71 - "Community 71"
Cohesion: 0.11
Nodes (18): build, DriverRepository, driverRepositoryProvider, DriverRidesController, _latency, MockDriverRepository, PassengerRequestsController, publish (+10 more)

### Community 72 - "Community 72"
Cohesion: 0.28
Nodes (21): AdminService, _admin_current_user(), _create_user_with_name(), _make_admin_in_db(), _non_admin_current_user(), _payload(), test_admin_can_change_user_role(), test_admin_can_create_user_of_each_role() (+13 more)

### Community 73 - "Community 73"
Cohesion: 0.13
Nodes (12): _coerce_scalar(), _has_azerbaijani_marker(), _image_dimensions(), _name_matches(), _needs_review(), _normalize(), _normalize_name(), _parse_markdown_block() (+4 more)

### Community 74 - "Community 74"
Cohesion: 0.09
Nodes (10): nextConfig, baseDir, baseUser, getFirstVisible(), mockApi(), runLanguage(), seedStore(), shot() (+2 more)

### Community 75 - "Community 75"
Cohesion: 0.09
Nodes (24): AddVehicleScreen, _AddVehicleScreenState, _brand, build, _color, createState, dispose, enabled (+16 more)

### Community 76 - "Community 76"
Cohesion: 0.13
Nodes (5): LocalStorage, StorageBackend, test_local_storage_bucket_dir(), test_local_storage_get_local_path_fallback(), test_local_storage_upload_and_delete()

### Community 77 - "Community 77"
Cohesion: 0.16
Nodes (11): get_storage(), run_document_review_task(), _detect_content_type(), read_user(), read_user_me(), register_device_token(), _store_uploaded_file(), submit_verification() (+3 more)

### Community 78 - "Community 78"
Cohesion: 0.08
Nodes (21): availableSeats, departureTime, driver, fromCity, fromJson, id, price, status (+13 more)

### Community 79 - "Community 79"
Cohesion: 0.09
Nodes (14): addSearch, clearAll, getRecentSearches, _key, _maxRecent, RecentSearchesRepository, repo, _storage (+6 more)

### Community 80 - "Community 80"
Cohesion: 0.11
Nodes (13): build, ChatDetailScreen, _ChatDetailScreenState, _controller, conversationId, createState, _isUploading, _pickAndUploadImage (+5 more)

### Community 81 - "Community 81"
Cohesion: 0.14
Nodes (3): PayoutRequest, PayoutRepository, FakePayoutRepository

### Community 82 - "Community 82"
Cohesion: 0.09
Nodes (20): adjustment, amount, availableBalance, balanceAfter, copyWith, createdAt, currency, description (+12 more)

### Community 83 - "Community 83"
Cohesion: 0.09
Nodes (21): @playwright/test, name, private, version, clsx, cross-env, gsap, @hookform/resolvers (+13 more)

### Community 84 - "Community 84"
Cohesion: 0.10
Nodes (18): ActiveRideScreen, _ActiveRideScreenState, build, _completeRide, createState, dispose, _etaMinutes, _mapStatusLabel (+10 more)

### Community 85 - "Community 85"
Cohesion: 0.25
Nodes (18): _build_prompt(), review_verification_document(), _mock_completion(), _png_image(), test_api_failure_falls_back(), test_claimed_name_is_not_sent_to_model(), test_garbage_response_falls_back(), test_invalid_recommendation_coerced() (+10 more)

### Community 86 - "Community 86"
Cohesion: 0.14
Nodes (10): cancel_ride(), complete_ride(), create_ride(), end_trip(), get_my_rides(), get_public_track(), get_ride(), search_rides() (+2 more)

### Community 87 - "Community 87"
Cohesion: 0.10
Nodes (19): booking, bookingId, _busy, _cancel, createState, _Detail, _DetailState, icon (+11 more)

### Community 88 - "Community 88"
Cohesion: 0.10
Nodes (20): rideSearchProvider, build, _buildResults, _chip, createState, date, fromCity, isSelected (+12 more)

### Community 89 - "Community 89"
Cohesion: 0.10
Nodes (17): clearTokens, getAccessToken, getCsrfToken, getRefreshToken, _keyAccessToken, _keyCsrfToken, _keyRefreshToken, saveTokens (+9 more)

### Community 90 - "Community 90"
Cohesion: 0.10
Nodes (18): Booking, BookingStatus, BookingStatusX, copyWith, createdAt, departureTime, driverId, driverName (+10 more)

### Community 91 - "Community 91"
Cohesion: 0.10
Nodes (16): _animation, baseColor, borderRadius, build, child, _controller, createState, dispose (+8 more)

### Community 92 - "Community 92"
Cohesion: 0.11
Nodes (17): ApiBookingsRepository, all, BookingsController, BookingsRepository, bookingsRepositoryProvider, build, byId, create (+9 more)

### Community 93 - "Community 93"
Cohesion: 0.11
Nodes (16): ApiRidesRepository, date, fromCity, hashCode, _latency, MockRidesRepository, operator, passengers (+8 more)

### Community 94 - "Community 94"
Cohesion: 0.13
Nodes (8): generate_csrf_token(), validate_csrf_request(), About, create_access_token(), create_refresh_token(), decode_token(), _prepare_password(), verify_password()

### Community 95 - "Community 95"
Cohesion: 0.18
Nodes (11): AdminRoleUpdate, AuthSessionResponse, DeviceTokenInput, PasswordResetConfirmInput, PasswordResetRequestInput, RefreshTokenInput, Token, TokenData (+3 more)

### Community 96 - "Community 96"
Cohesion: 0.11
Nodes (17): ApiChatRepository, ChatRepository, connectWebSocket, _conversations, _dio, getConversations, getMessages, getOrCreateRideConversation (+9 more)

### Community 97 - "Community 97"
Cohesion: 0.10
Nodes (15): apiBaseUrl, AppConstants, borderRadius12, borderRadius16, borderRadius24, borderRadius8, cities, spacing12 (+7 more)

### Community 98 - "Community 98"
Cohesion: 0.10
Nodes (19): amount, availableBalance, balanceAfter, createdAt, currency, description, fromJson, id (+11 more)

### Community 99 - "Community 99"
Cohesion: 0.16
Nodes (6): CacheManager, invalidate_cache(), test_cache_manager_invalidations(), test_invalidate_cache_empty(), test_invalidate_cache_error(), test_invalidate_cache_success()

### Community 100 - "Community 100"
Cohesion: 0.24
Nodes (9): SupabaseStorage, test_get_storage_backends(), test_supabase_storage_delete(), test_supabase_storage_delete_exception_handled(), test_supabase_storage_get_signed_url(), test_supabase_storage_missing_config(), test_supabase_storage_upload_conflict_upsert(), test_supabase_storage_upload_success() (+1 more)

### Community 102 - "Community 102"
Cohesion: 0.11
Nodes (16): avatarUrl, copyWith, documentUrl, firstName, fromJson, fullName, id, isProfileComplete (+8 more)

### Community 103 - "Community 103"
Cohesion: 0.13
Nodes (14): routerProvider, themeModeProvider, pushNotificationsServiceProvider, _authSubscription, build, createState, dispose, initializePushNotifications (+6 more)

### Community 104 - "Community 104"
Cohesion: 0.11
Nodes (14): build, _buildMarkers, _buildPolylines, createState, destination, didUpdateWidget, _fitBounds, initState (+6 more)

### Community 105 - "Community 105"
Cohesion: 0.11
Nodes (18): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+10 more)

### Community 106 - "Community 106"
Cohesion: 0.11
Nodes (17): build, createState, destination, didUpdateWidget, forceCanvas, height, initState, _loadRoute (+9 more)

### Community 107 - "Community 107"
Cohesion: 0.12
Nodes (18): allowLuggage, allowMusic, allowSmoking, copyWith, departureTime, description, DriverRideStatus, DriverRideStatusX (+10 more)

### Community 108 - "Community 108"
Cohesion: 0.23
Nodes (13): DescriptionGenerationRequest, DescriptionGenerationResponse, _fallback_support_reply(), generate_trip_description(), get_driving_route(), get_smart_pricing_suggestion(), LocationCoords, PricingSuggestionRequest (+5 more)

### Community 109 - "Community 109"
Cohesion: 0.12
Nodes (4): FlutterWindow, flutter_controller_, FlutterWindow::FlutterWindow(), project_

### Community 110 - "Community 110"
Cohesion: 0.20
Nodes (6): apiMessagesService, ChatMessagesParams, MessagesService, SendMessageInput, Conversation, Message

### Community 112 - "Community 112"
Cohesion: 0.18
Nodes (8): main(), parse_text_with_ai(), assert_non_production(), access_token(), test_generate_description_fallback(), test_generate_description_success(), test_pricing_suggestion_fallback_on_ai_failure(), test_pricing_suggestion_with_coords_and_ai()

### Community 113 - "Community 113"
Cohesion: 0.19
Nodes (5): Scale(), Win32Window::Win32Window(), WindowClassRegistrar, class_registered_, instance_

### Community 114 - "Community 114"
Cohesion: 0.12
Nodes (17): devDependencies, cross-env, eslint, eslint-config-next, jest, jest-environment-jsdom, @playwright/test, tailwindcss (+9 more)

### Community 115 - "Community 115"
Cohesion: 0.12
Nodes (8): cache_response(), decorator(), wrapper(), test_cache_response_decorator_custom_key_builder(), test_cache_response_decorator_exception_fallback(), test_cache_response_decorator_hit(), test_cache_response_decorator_ignores_request_and_none(), test_cache_response_decorator_miss()

### Community 116 - "Community 116"
Cohesion: 0.12
Nodes (14): _apiClient, departureDate, departureTime, destination, fromJson, getSuggestion, language, origin (+6 more)

### Community 117 - "Community 117"
Cohesion: 0.22
Nodes (11): ChatSocketMode, useChat(), buildApiAssetUrl(), buildApiWebSocketUrl(), env, normalizeLoopbackHost(), normalizeWebSocketBaseUrl(), trimTrailingSlashes() (+3 more)

### Community 118 - "Community 118"
Cohesion: 0.12
Nodes (10): ApiConfig, baseUrl, connectTimeout, enableLogging, receiveTimeout, sendTimeout, AuthMode, isApi (+2 more)

### Community 119 - "Community 119"
Cohesion: 0.12
Nodes (15): BookingDto, createdAt, fromJson, id, _parseDecimal, passenger, passengerId, paymentDeadline (+7 more)

### Community 120 - "Community 120"
Cohesion: 0.13
Nodes (11): _MapPainter, bounce, build, _controller, createState, dispose, paint, rotation (+3 more)

### Community 124 - "Community 124"
Cohesion: 0.20
Nodes (10): make_user(), test_conversation_websocket_accepts_participant(), test_conversation_websocket_rejects_non_participant(), test_websocket_rejects_blocked_user(), test_websocket_with_cookie_auth_connects(), fake_current_user_from_websocket(), test_websocket_with_invalid_token_is_rejected(), fake_current_user_from_websocket() (+2 more)

### Community 125 - "Community 125"
Cohesion: 0.13
Nodes (15): scripts, build, build:demo, copy-badges, copy-image, dev, dev:lowmem, dev:turbo (+7 more)

### Community 126 - "Community 126"
Cohesion: 0.23
Nodes (6): generate_cache_key(), invalidate_cache_keys(), test_generate_cache_key(), test_invalidate_cache_keys_empty(), test_invalidate_cache_keys_error(), test_invalidate_cache_keys_success()

### Community 127 - "Community 127"
Cohesion: 0.21
Nodes (6): FailingRedis, FakeDbConnection, FakeEngine, FakeRedis, test_health_reports_degraded_redis(), test_health_reports_dependency_checks()

### Community 128 - "Community 128"
Cohesion: 0.18
Nodes (11): recentSearchesProvider, recentSearchesRepositoryProvider, build, createState, _date, _from, _passengers, _search (+3 more)

### Community 129 - "Community 129"
Cohesion: 0.14
Nodes (12): addNotification, AppNotification, body, build, copyWith, id, markAllRead, markRead (+4 more)

### Community 130 - "Community 130"
Cohesion: 0.15
Nodes (12): brand, color, copyWith, displayName, id, model, plate, seats (+4 more)

### Community 131 - "Community 131"
Cohesion: 0.16
Nodes (12): ApiReviewsRepository, authorName, _client, comment, createdAt, id, MockReviewsRepository, rating (+4 more)

### Community 132 - "Community 132"
Cohesion: 0.38
Nodes (8): cancel_booking(), confirm_booking(), create_booking(), get_booking_requests(), get_my_bookings(), mark_boarded(), mark_no_show(), reject_booking()

### Community 133 - "Community 133"
Cohesion: 0.21
Nodes (5): ride_search_window_start(), test_window_start_excludes_earlier_days(), test_window_start_is_inclusive_lower_bound_not_exact_day(), test_window_start_is_midnight_utc_of_given_day(), test_window_start_is_none_without_date()

### Community 135 - "Community 135"
Cohesion: 0.15
Nodes (9): CityCoordinates, _coords, lat, LatLon, lon, CityRoutes, _fallbackRoutes, _generateBezierCurve (+1 more)

### Community 136 - "Community 136"
Cohesion: 0.19
Nodes (4): wWinMain(), CreateAndAttachConsole(), GetCommandLineArguments(), Utf8FromUtf16()

### Community 137 - "Community 137"
Cohesion: 0.15
Nodes (10): AppTheme, navy, slate100, slate200, slate50, slate500, slate700, teal (+2 more)

### Community 138 - "Community 138"
Cohesion: 0.17
Nodes (11): balance, build, copyWith, loadMoreTransactions, refresh, _repo, transactions, WalletController (+3 more)

### Community 139 - "Community 139"
Cohesion: 0.17
Nodes (7): drivers, MockData, rideById, ridesFor, RideMapper, toTrip, _toUser

### Community 140 - "Community 140"
Cohesion: 0.21
Nodes (4): Win32Window, child_content_, quit_on_close_, window_handle_

### Community 141 - "Community 141"
Cohesion: 0.29
Nodes (7): get_alembic_database_url(), include_object(), run_migrations_offline(), run_migrations_online(), normalize_database_url(), CustomFormatter, setup_logging()

### Community 143 - "Community 143"
Cohesion: 0.25
Nodes (7): get_my_payouts(), get_my_wallet(), get_my_wallet_transactions(), PayoutCreateRequest, request_payout(), topup_wallet(), TopupRequest

### Community 145 - "Community 145"
Cohesion: 0.18
Nodes (11): dependencies, clsx, gsap, @hookform/resolvers, next, react-dom, @react-google-maps/api, react-hook-form (+3 more)

### Community 146 - "Community 146"
Cohesion: 0.27
Nodes (8): GoogleRouteMapView, _GoogleRouteMapViewState, CanvasRouteMapView, _CanvasRouteMapViewState, Shimmer, _ShimmerState, TireLoader, _TireLoaderState

### Community 147 - "Community 147"
Cohesion: 0.18
Nodes (10): background_color, description, display, icons, name, orientation, prefer_related_applications, short_name (+2 more)

### Community 148 - "Community 148"
Cohesion: 0.20
Nodes (5): _key, _loadThemeMode, setThemeMode, _storage, ThemeModeNotifier

### Community 150 - "Community 150"
Cohesion: 0.20
Nodes (7): AuthException, container, main, _makeContainer, read, _settled, storage

### Community 151 - "Community 151"
Cohesion: 0.24
Nodes (6): getPopularRoutes, popularRoutesRepositoryProvider, repository, getPopularRoutes, MockPopularRoutesRepository, PopularRoutesRepository

### Community 152 - "Community 152"
Cohesion: 0.20
Nodes (7): all, _booking, create, main, status, _store, updateStatus

### Community 155 - "Community 155"
Cohesion: 0.20
Nodes (9): devDependencies, @playwright/test, @playwright/test, private, scripts, audit, format-backend, lint (+1 more)

### Community 157 - "Community 157"
Cohesion: 0.28
Nodes (4): create_vehicle(), delete_vehicle(), get_my_vehicles(), get_vehicle()

### Community 158 - "Community 158"
Cohesion: 0.44
Nodes (4): FakeUser, FakeUserRepository, make_current_user(), test_submit_verification_sets_pending_status_and_document_url()

### Community 162 - "Community 162"
Cohesion: 0.36
Nodes (4): apiGamificationService, Badge, GamificationService, UserBadge

### Community 163 - "Community 163"
Cohesion: 0.25
Nodes (5): AiPricingRepository, failNext, getSuggestion, main, MockAiPricingRepository

### Community 165 - "Community 165"
Cohesion: 0.29
Nodes (4): env, nextBin, require, result

### Community 166 - "Community 166"
Cohesion: 0.29
Nodes (6): fromCity, fromJson, RecentSearch, searchedAt, toCity, toJson

### Community 167 - "Community 167"
Cohesion: 0.38
Nodes (3): Ensure-FrontendEnv(), Write-Step(), Write-Warn()

### Community 168 - "Community 168"
Cohesion: 0.73
Nodes (5): get_access_token(), sample_booking_response(), test_bookings_confirm_reject_cancel_endpoints(), test_bookings_create_endpoint(), test_bookings_my_and_requests_endpoints()

### Community 169 - "Community 169"
Cohesion: 0.33
Nodes (5): averagePrice, dailyTrips, fromCity, PopularRoute, toCity

### Community 175 - "Community 175"
Cohesion: 0.50
Nodes (3): eslintConfig, eslint, eslint-config-next

### Community 176 - "Community 176"
Cohesion: 0.50
Nodes (3): Point, x, y

### Community 177 - "Community 177"
Cohesion: 0.50
Nodes (3): Size, height, width

## Knowledge Gaps
- **1360 isolated node(s):** `@playwright/test`, `@tailwindcss/postcss`, `@testing-library/dom`, `@types/jest`, `@types/node` (+1355 more)
  These have ≤1 connection - possible missing edges. (Counts symbols only; 2344 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **49 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `CurrentUser` connect `Community 40` to `Community 1`, `Community 3`, `Community 132`, `Community 10`, `Community 13`, `Community 142`, `Community 143`, `Community 14`, `Community 17`, `Community 20`, `Community 25`, `Community 157`, `Community 30`, `Community 158`, `Community 32`, `Community 33`, `Community 36`, `Community 37`, `Community 41`, `Community 43`, `Community 44`, `Community 46`, `Community 53`, `Community 57`, `Community 61`, `Community 64`, `Community 67`, `Community 68`, `Community 72`, `Community 77`, `Community 81`, `Community 86`, `Community 108`, `Community 111`, `Community 121`, `Community 124`?**
  _High betweenness centrality (0.055) - this node is a cross-community bridge._
- **Are the 79 inferred relationships involving `CurrentUser` (e.g. with `approve_payout()` and `approve_verification()`) actually correct?**
  _`CurrentUser` has 79 INFERRED edges - model-reasoned connections that need verification._
- **What connects `@playwright/test`, `@tailwindcss/postcss`, `@testing-library/dom` to the rest of the system?**
  _1360 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.005076142131979695 - nodes in this community are weakly interconnected._
- **Why does `_` connect `Community 56` to `Community 6`, `Community 9`, `Community 79`, `Community 15`, `Community 18`, `Community 24`, `Community 89`, `Community 28`?**
  _High betweenness centrality (0.021) - this node is a cross-community bridge._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.05238796549547654 - nodes in this community are weakly interconnected._
- **Why does `ConnectionManager` connect `Community 54` to `Community 3`?**
  _High betweenness centrality (0.013) - this node is a cross-community bridge._