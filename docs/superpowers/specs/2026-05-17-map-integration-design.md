# Design Spec: Map & Location Integration

**Date:** 2026-05-17
**Topic:** Interactive Maps for Yolüstü Carpooling

## 1. Overview
The goal is to replace text-based location selection with an interactive map interface using Leaflet and OpenStreetMap. This integration will span the Search, Create Ride, and Ride Details pages, providing a superior UX for Azerbaijani users.

## 2. Architecture
To ensure scalability, we will follow a **Provider-based Architecture**.

### Frontend Components
- **`MapProvider` (Context):** A React Context provider to manage map state (current view, zoom level, selected markers).
- **`LazyMap`:** A wrapper using `next/dynamic` to ensure Leaflet is only loaded in the client-side environment (avoiding SSR errors).
- **`MapView`:** The base map component displaying pins/routes.
- **`LocationPicker`:** A specialized component for the "Create Ride" flow, allowing users to drag a marker or click to set a location.
- **`RideMarker`:** A custom marker component that displays ride summaries in a Leaflet Popup.

### Tech Stack
- **Library:** `react-leaflet`, `leaflet`.
- **Provider:** OpenStreetMap (Default).
- **Data Format:** Coordinates as `[latitude, longitude]`.

## 3. Data Flow
- **Backend:** The existing `rides` table uses `Geometry(POINT, 4326)` for `origin_location` and `destination_location`.
- **API Integration:** The FastAPI backend will return coordinates in the response. We will ensure the Pydantic schemas and frontend mappers correctly handle these spatial points.
- **Frontend State:** Selected locations will be synced to existing Zustand stores (e.g., `useTripsStore`).

## 4. Features
- **Search Page:** Results displayed as markers on the map. Clicking a marker reveals the trip details.
- **Create Ride:** Drivers pinpoint exact start/end spots. The map will reverse-geocode (optional future enhancement) or rely on city names paired with coordinates.
- **Ride Details:** Visualizes the route (straight line or simple polyline) between origin and destination.

## 5. Scalability
By abstracting the map into a core `MapView` component, we can easily swap Leaflet for Google Maps or Mapbox in the future by updating only the implementation files, without changing the business logic in the feature pages.

## 6. Testing Strategy
- **Unit Tests:** Mock the `apiClient` to test map data mapping.
- **Integration Tests:** Verify that clicking a location on the map updates the state in the Zustand store.
- **Manual Verification:** Test touch interactions on mobile browsers.
