# Specification: Replace frontend mock stores with real API calls

## Overview
Currently, the Yolmates frontend uses Zustand stores with hardcoded mock data for all features (Auth, Trips, Bookings, etc.). This track aims to replace these mock implementations with real API calls to the FastAPI backend, ensuring the application is fully data-driven.

## Goals
- Connect the Next.js frontend to the local FastAPI backend.
- Replace all mock services in `frontend/src/services/` with real API implementations.
- Ensure all core user flows (Login, Search, Book, Review) work with real database data.
- Maintain high code coverage (>80%) and follow TDD.

## Technical Requirements
- Use `fetch` or `axios` for API requests.
- Implement a centralized API client with error handling and authentication token injection.
- Match frontend TypeScript interfaces with backend Pydantic schemas.
- Ensure the backend is running and migrations are applied before testing integration.

## Scope
- API Client Infrastructure
- Authentication (Login, Register, User Profile)
- Trips (Listing, Search, Detail, Creation)
- Bookings (Request, Approve, List)
- Reviews (Create, View)
- Messages (Fetch, Send)

## Out of Scope
- Implementing new backend features.
- Major UI/UX redesigns.