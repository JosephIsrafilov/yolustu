# Backend Spatial Data Mapping Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Update backend schemas and frontend mappers to handle spatial data coordinates for rides.

**Architecture:** Bridge the gap between GeoAlchemy2 WKB elements in the backend and JSON coordinates in the frontend using Pydantic validators and TypeScript mappers.

**Tech Stack:** Python (FastAPI, Pydantic, GeoAlchemy2), TypeScript (Next.js).

---

### Task 1: Update Backend Schemas

**Files:**
- Modify: `backend/schemas/schemas.py`

- [ ] **Step 1: Add field_validator and to_shape imports**

```python
from geoalchemy2.shape import to_shape
from pydantic import field_validator
```

- [ ] **Step 2: Update RideResponse with origin_location and destination_location and validators**

```python
class RideResponse(RideBase):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    driver_id: UUID
    vehicle_id: UUID
    created_at: datetime
    origin_location: Location
    destination_location: Location

    @field_validator("origin_location", "destination_location", mode="before")
    @classmethod
    def convert_geometry(cls, v):
        if v is None:
            return None
        # If it's already a dict or Location object, return as is
        if isinstance(v, (dict, Location)):
            return v
        # Otherwise assume it's a GeoAlchemy2 element
        try:
            shape = to_shape(v)
            return {"lat": shape.y, "lon": shape.x}
        except Exception:
            return v
```

- [ ] **Step 3: Verify backend schemas (manual check or run a script if available)**

### Task 2: Update Frontend Types

**Files:**
- Modify: `frontend/src/types/index.ts`

- [ ] **Step 1: Update Trip interface**

```typescript
export interface Trip {
  // ... existing fields
  origin?: { lat: number; lng: number };
  destination?: { lat: number; lng: number };
}
```

- [ ] **Step 2: Update CreateTripData interface**

```typescript
export interface CreateTripData {
  // ... existing fields
  origin?: { lat: number; lng: number };
  destination?: { lat: number; lng: number };
}
```

### Task 3: Update Frontend Mappers

**Files:**
- Modify: `frontend/src/services/api/mappers.ts`

- [ ] **Step 1: Update ApiTrip interface**

```typescript
export interface ApiTrip {
  // ... existing fields
  origin_location?: { lat: number; lon: number };
  destination_location?: { lat: number; lon: number };
}
```

- [ ] **Step 2: Update mapApiTripToTrip function**

```typescript
export function mapApiTripToTrip(apiTrip: ApiTrip): Trip {
  const departureDate = new Date(apiTrip.departure_time);
  return {
    // ... existing fields
    origin: apiTrip.origin_location ? { lat: apiTrip.origin_location.lat, lng: apiTrip.origin_location.lon } : undefined,
    destination: apiTrip.destination_location ? { lat: apiTrip.destination_location.lat, lng: apiTrip.destination_location.lon } : undefined,
  };
}
```

- [ ] **Step 3: Run frontend typecheck**

Run: `npm run typecheck` (in frontend directory)
Expected: PASS

### Task 4: Commit Changes

- [ ] **Step 1: Commit all changes**

```bash
git add backend/schemas/schemas.py frontend/src/types/index.ts frontend/src/services/api/mappers.ts
git commit -m "feat: add spatial data mapping for rides"
```
