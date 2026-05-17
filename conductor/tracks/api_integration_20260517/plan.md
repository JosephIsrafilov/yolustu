# Implementation Plan: Replace frontend mock stores with real API calls

This plan outlines the steps to replace mock data with real API calls, ensuring the Yolüstü frontend is fully integrated with the backend.

## Phase 1: API Client Infrastructure

- [ ] Task: Setup API Client and Error Handling
    - [ ] Write tests for API client utility (error normalization, base URL config)
    - [ ] Implement API client using `fetch` or `axios` in `src/services/api-client.ts`
- [ ] Task: Define TypeScript API Contracts
    - [ ] Define core entity interfaces in `src/types/index.ts` (User, Trip, Booking, etc.)
    - [ ] Define API request/response contracts in `src/services/contracts/`
- [ ] Task: Conductor - User Manual Verification 'API Client Infrastructure' (Protocol in workflow.md)

## Phase 2: Authentication Integration

- [ ] Task: Implement real Auth Service
    - [ ] Write tests for `api-auth-service.ts` (login, register, logout)
    - [ ] Implement `api-auth-service.ts` using the API client
- [ ] Task: Update AuthProvider and Protected Routes
    - [ ] Update `AuthProvider.tsx` to use the real auth service and manage JWT tokens
    - [ ] Verify `ProtectedRoute.tsx` works with real authentication state
- [ ] Task: Conductor - User Manual Verification 'Authentication Integration' (Protocol in workflow.md)

## Phase 3: Trips and Search Integration

- [ ] Task: Implement real Trips Service
    - [ ] Write tests for `api-trips-service.ts` (search, list, detail, create)
    - [ ] Implement `api-trips-service.ts` using the API client
- [ ] Task: Connect Trip Components to API
    - [ ] Update `SearchPage` to fetch results from the backend
    - [ ] Update `TripDetailsPage` to fetch trip info by ID
    - [ ] Update `CreateTripPage` to send data to the backend
- [ ] Task: Conductor - User Manual Verification 'Trips and Search Integration' (Protocol in workflow.md)

## Phase 4: Bookings and Reviews Integration

- [ ] Task: Implement real Bookings Service
    - [ ] Write tests for `api-bookings-service.ts` (request, approve, list)
    - [ ] Implement `api-bookings-service.ts`
- [ ] Task: Implement real Reviews Service
    - [ ] Write tests for `api-reviews-service.ts` (create, list)
    - [ ] Implement `api-reviews-service.ts`
- [ ] Task: Connect Booking and Review Components
    - [ ] Update `BookingsPage` and `BookingCard` to use real data
    - [ ] Update `ReviewForm` and `ReviewCard` to use real data
- [ ] Task: Conductor - User Manual Verification 'Bookings and Reviews Integration' (Protocol in workflow.md)

## Phase 5: Messaging and Final Cleanup

- [ ] Task: Implement real Messages Service
    - [ ] Write tests for `api-messages-service.ts`
    - [ ] Implement `api-messages-service.ts`
- [ ] Task: Final Integration Audit and Cleanup
    - [ ] Remove all unused mock data files in `src/data/mock-data.ts`
    - [ ] Ensure all remaining components are using real services
- [ ] Task: Conductor - User Manual Verification 'Messaging and Final Cleanup' (Protocol in workflow.md)