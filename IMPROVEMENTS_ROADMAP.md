# Yolustu Project Improvements Roadmap

**Analysis Date:** June 11, 2026  
**Current State:** Post-security audit, 17 backend tests, 8 frontend tests, ~2000 LOC in services

---

## 🎯 Quick Wins (High Impact, Low Effort)

### 1. Pin Dependencies (Security + Stability)
**Current:** `fastapi`, `uvicorn[standard]`, `sqlalchemy` - all unpinned  
**Risk:** Breaking changes, security vulnerabilities  
**Fix:**
```bash
cd backend
pip freeze > requirements.txt.lock
# Review and copy stable versions to requirements.txt
```

**Impact:** ⭐⭐⭐⭐⭐ Prevents unexpected breaks in production

---

### 2. Add Rate Limiting to Auth Endpoints (Security)
**Current:** Global rate limiter configured but not applied to auth routes  
**Risk:** Brute force attacks, SMS flooding, $$ cost on OTP service

**Fix:** Add decorators to auth endpoints
```python
# backend/app/domains/identity/auth_router.py
from app.core.limiter import limiter

@router.post("/login")
@limiter.limit("5/15 minutes")  # 5 attempts per 15 min
def login(...):

@router.post("/request-otp")
@limiter.limit("3/1 hour")  # 3 OTPs per hour per phone
def request_otp(...):
```

**Impact:** ⭐⭐⭐⭐⭐ Prevents account takeover and SMS cost abuse

---

### 3. Add Background Task for Booking Expiry (Product Quality)
**Current:** `_lazy_expire_bookings()` only runs when user views their bookings  
**Impact:** Inaccurate seat availability, poor UX

**Fix:** Add scheduled task
```python
# backend/app/core/scheduler.py
from apscheduler.schedulers.asyncio import AsyncIOScheduler

scheduler = AsyncIOScheduler()

@scheduler.scheduled_job('interval', minutes=5)
def expire_pending_bookings():
    # Run expiry logic independently
```

**Impact:** ⭐⭐⭐⭐ Better reliability and user experience

---

### 4. Remove Console Logs from Frontend (Production Hygiene)
**Current:** 46 console.log/console.error statements  
**Risk:** Information leakage, performance impact

**Fix:**
```bash
cd frontend
# Find and remove or replace with proper logging
grep -r "console\." src/
```

**Impact:** ⭐⭐⭐ Cleaner production code

---

### 5. Add Environment-Specific CORS (Security)
**Current:** `allow_origin_regex=r"^http://(localhost|127\.0\.0\.1):\d+$"` always active  
**Risk:** In production, any localhost service can make requests

**Fix:**
```python
# backend/app/main.py
if settings.ENVIRONMENT == "production":
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[settings.FRONTEND_URL],  # Only production URL
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
else:
    # Development: allow localhost variations
    app.add_middleware(CORSMiddleware, ...)
```

**Impact:** ⭐⭐⭐⭐ Prevents production CORS misconfiguration

---

## 🏗️ Architecture & Design (Medium Effort, High Impact)

### 6. Implement Row Level Security (RLS) Policies
**Current:** Application-layer only authorization  
**Risk:** SQL injection or direct DB access bypasses all security

**Priority:** HIGH - Defense in depth  
**Effort:** 2-3 days

**Implementation Plan:**
```sql
-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE rides ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Example policy: users can only read their own data
CREATE POLICY users_select_own ON users
  FOR SELECT
  USING (id = current_setting('app.current_user_id')::uuid);

-- Rides: public can view active, only driver can update
CREATE POLICY rides_select_active ON rides
  FOR SELECT
  USING (status = 'active' OR driver_id = current_setting('app.current_user_id')::uuid);
```

**Set user context in every request:**
```python
# backend/app/core/database.py
def set_db_user_context(db: Session, user_id: UUID):
    db.execute(text(f"SET LOCAL app.current_user_id = '{user_id}'"))
```

**Impact:** ⭐⭐⭐⭐⭐ Critical defense-in-depth layer

---

### 7. Add Database Indexes for Search Performance
**Current:** Only 4 indexes defined (departure_time, status, driver_id, vehicle_id)  
**Missing:** Indexes on frequently searched columns

**Add these indexes:**
```python
# backend/app/domains/trips/models.py
Index("ix_rides_origin_city", Ride.origin_city)
Index("ix_rides_destination_city", Ride.destination_city)
Index("ix_rides_departure_time_status", Ride.departure_time, Ride.status)  # Composite

# For bookings
Index("ix_bookings_passenger_status", Booking.passenger_id, Booking.status)
Index("ix_bookings_ride_status", Booking.ride_id, Booking.status)

# For messages
Index("ix_messages_conversation_created", Message.conversation_id, Message.created_at)
```

**Impact:** ⭐⭐⭐⭐ 10-50x faster queries on large datasets

---

### 8. Optimize N+1 Queries with Eager Loading
**Current:** Multiple service methods likely trigger N+1 queries

**Example Problem:**
```python
# This triggers N+1 if loading user data for each booking
bookings = session.query(Booking).all()
for booking in bookings:
    print(booking.passenger.first_name)  # N+1!
```

**Fix with joinedload:**
```python
from sqlalchemy.orm import joinedload

bookings = session.query(Booking)\
    .options(joinedload(Booking.passenger))\
    .options(joinedload(Booking.ride).joinedload(Ride.driver))\
    .all()
```

**Files to audit:** All `repositories.py` and `services.py` methods that return lists

**Impact:** ⭐⭐⭐⭐ 5-10x faster API responses

---

### 9. Implement API Response Caching
**Current:** Every request hits database  
**Opportunity:** Cache read-heavy, infrequently changing data

**Add Redis caching for:**
- User profiles (5 min TTL)
- Ride search results (1 min TTL)
- Driver verification status (10 min TTL)

**Implementation:**
```python
# backend/app/core/cache.py
from redis import Redis
from app.core.redis import redis_pool
import json

def cache_get(key: str):
    r = Redis(connection_pool=redis_pool)
    data = r.get(key)
    return json.loads(data) if data else None

def cache_set(key: str, value: dict, ttl: int = 300):
    r = Redis(connection_pool=redis_pool)
    r.setex(key, ttl, json.dumps(value))

# Usage in service
def get_user_profile(user_id: UUID):
    cache_key = f"user:{user_id}:profile"
    cached = cache_get(cache_key)
    if cached:
        return cached
    
    user = db.query(User).filter(User.id == user_id).first()
    result = user_to_dict(user)
    cache_set(cache_key, result, ttl=300)
    return result
```

**Impact:** ⭐⭐⭐⭐ Reduced database load, faster responses

---

### 10. Add API Client with Retry Logic (Frontend)
**Current:** No centralized API client in frontend  
**Issue:** Network errors not handled consistently

**Create:**
```typescript
// frontend/src/lib/api-client.ts
import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 3,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
    },
    mutations: {
      retry: 1,
    },
  },
});

export async function apiRequest<T>(
  url: string, 
  options?: RequestInit
): Promise<T> {
  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}${url}`, {
    credentials: 'include',
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'Request failed');
  }

  return response.json();
}
```

**Impact:** ⭐⭐⭐⭐ Better reliability and user experience

---

## 🧪 Testing & Quality (Medium Effort)

### 11. Increase Test Coverage
**Current:**
- Backend: 17 test files, focused on permissions/auth
- Frontend: 8 test files
- **Missing:** Integration tests, E2E tests for critical flows

**Priority Areas to Test:**
1. **Booking Flow E2E** (search → book → pay → complete)
2. **Payment Integration Tests** (Stripe webhooks)
3. **WebSocket Message Delivery** (chat functionality)
4. **Geospatial Search** (ride proximity queries)
5. **State Machine Transitions** (ride/booking lifecycle)

**Add backend integration tests:**
```python
# backend/tests/integration/test_booking_flow.py
def test_complete_booking_flow(client, test_user, test_driver):
    # Create ride
    ride_response = client.post("/api/v1/rides", json={...})
    ride_id = ride_response.json()["id"]
    
    # Book ride
    booking_response = client.post("/api/v1/bookings", json={
        "ride_id": ride_id,
        "seats_booked": 2
    })
    assert booking_response.status_code == 200
    
    # Confirm booking
    # Payment flow
    # Complete ride
    # Verify state transitions
```

**Add E2E tests with Playwright:**
```typescript
// frontend/e2e/booking-flow.spec.ts
test('user can search and book a ride', async ({ page }) => {
  await page.goto('/search');
  await page.fill('[name="origin"]', 'Baku');
  await page.fill('[name="destination"]', 'Ganja');
  await page.click('button:text("Search")');
  
  await expect(page.locator('.ride-card')).toBeVisible();
  await page.click('.ride-card:first-child button:text("Book")');
  
  // Verify booking confirmation
  await expect(page.locator('text=Booking confirmed')).toBeVisible();
});
```

**Impact:** ⭐⭐⭐⭐⭐ Catches bugs before production

---

### 12. Add Logging and Observability
**Current:** 16 logging statements across all domain services  
**Missing:** Structured logging, request tracing, error tracking

**Implement:**
```python
# backend/app/core/logging_config.py
import logging
import json
from datetime import datetime

class JSONFormatter(logging.Formatter):
    def format(self, record):
        return json.dumps({
            'timestamp': datetime.utcnow().isoformat(),
            'level': record.levelname,
            'message': record.getMessage(),
            'module': record.module,
            'function': record.funcName,
            'line': record.lineno,
        })

# Add to critical operations
logger = logging.getLogger(__name__)

def create_booking(...):
    logger.info(f"Creating booking: ride_id={ride_id}, user_id={user_id}, seats={seats}")
    try:
        booking = ...
        logger.info(f"Booking created successfully: booking_id={booking.id}")
        return booking
    except Exception as e:
        logger.error(f"Booking creation failed: {str(e)}", exc_info=True)
        raise
```

**Add Sentry for error tracking:**
```python
# backend/app/main.py
import sentry_sdk
from sentry_sdk.integrations.fastapi import FastApiIntegration

if settings.ENVIRONMENT == "production":
    sentry_sdk.init(
        dsn=settings.SENTRY_DSN,
        integrations=[FastApiIntegration()],
        traces_sample_rate=0.1,
    )
```

**Impact:** ⭐⭐⭐⭐⭐ Essential for debugging production issues

---

## 🎨 Frontend Improvements

### 13. Add Loading States and Error Boundaries
**Current:** 289 useEffect/useState calls, likely missing proper loading/error handling

**Create reusable components:**
```typescript
// frontend/src/components/ui/LoadingSpinner.tsx
export function LoadingSpinner({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  return <div className="spinner" aria-label="Loading..." />;
}

// frontend/src/components/ui/ErrorBoundary.tsx
export function ErrorBoundary({ children }: { children: React.ReactNode }) {
  const [hasError, setHasError] = React.useState(false);
  
  if (hasError) {
    return <ErrorFallback onReset={() => setHasError(false)} />;
  }
  
  return children;
}

// Use with React Query
function RidesList() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['rides'],
    queryFn: fetchRides
  });
  
  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorMessage error={error} />;
  
  return <div>{/* render rides */}</div>;
}
```

**Impact:** ⭐⭐⭐⭐ Professional UX, better error handling

---

### 14. Optimize Bundle Size
**Current:** Next.js with multiple mapping libraries (Leaflet + Google Maps)

**Audit:**
```bash
cd frontend
npm run build
# Check bundle size in output

# Use dynamic imports for heavy components
const MapView = dynamic(() => import('./MapView'), { 
  ssr: false,
  loading: () => <LoadingSpinner />
});
```

**Remove unused dependencies:**
- Keep either Leaflet OR Google Maps (currently both installed)
- Review if all `@tanstack/react-query` features are used

**Impact:** ⭐⭐⭐ Faster page loads

---

### 15. Add Mobile Responsiveness Audit
**Current:** Desktop-first UI components

**Test on:**
- iPhone SE (375px width)
- iPad (768px width)
- Android (360px width)

**Common issues to fix:**
- Fixed-width components
- Text overflow
- Touch target sizes < 44px
- Horizontal scrolling

**Impact:** ⭐⭐⭐⭐ Mobile users = 70%+ of rideshare users

---

## 🚀 DevOps & Infrastructure

### 16. Expand CI/CD Pipeline
**Current:** Basic CI with linting/tests  
**Missing:** Automated deployment, staging environment

**Add to `.github/workflows/ci.yml`:**
```yaml
jobs:
  test:
    # existing tests
  
  build-and-deploy:
    needs: test
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - name: Build Docker image
        run: docker build -t yolustu-backend:${{ github.sha }} ./backend
      
      - name: Push to registry
        run: docker push yolustu-backend:${{ github.sha }}
      
      - name: Deploy to staging
        run: |
          # Deploy to staging environment
          # Run smoke tests
      
      - name: Deploy to production (manual approval)
        if: github.event_name == 'workflow_dispatch'
        run: # production deployment
```

**Impact:** ⭐⭐⭐⭐ Faster, safer deployments

---

### 17. Add Database Backup Strategy
**Current:** No automated backups visible

**Implement:**
```bash
# scripts/backup-db.sh
#!/bin/bash
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
pg_dump $DATABASE_URL | gzip > backups/yolustu_$TIMESTAMP.sql.gz

# Retain last 30 days
find backups/ -name "*.sql.gz" -mtime +30 -delete
```

**Add to cron:**
```
0 2 * * * /path/to/backup-db.sh  # Daily at 2 AM
```

**Impact:** ⭐⭐⭐⭐⭐ Critical for disaster recovery

---

### 18. Add Health Check Monitoring
**Current:** `/health` endpoint exists but not monitored

**Options:**
1. **UptimeRobot** (free, simple)
2. **Better Uptime** (more features)
3. **Custom solution with cron + webhooks**

**Monitor:**
- Backend API `/health` every 5 minutes
- Frontend homepage every 5 minutes
- Alert on 3 consecutive failures

**Impact:** ⭐⭐⭐⭐ Know about outages before users complain

---

## 📊 Product & Analytics

### 19. Add Analytics Tracking
**Current:** No analytics visible

**Implement:**
```typescript
// frontend/src/lib/analytics.ts
export function trackEvent(event: string, properties?: Record<string, any>) {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', event, properties);
  }
}

// Track key events
trackEvent('ride_searched', { origin, destination });
trackEvent('booking_created', { ride_id, seats });
trackEvent('payment_completed', { amount, booking_id });
```

**Track:**
- Search queries (origin/destination pairs)
- Booking conversion rate
- Payment success/failure
- User registration funnel

**Impact:** ⭐⭐⭐⭐ Data-driven product decisions

---

### 20. Add Admin Dashboard Improvements
**Current:** Basic CRUD operations

**Add:**
- Charts: Daily active users, bookings over time
- Real-time monitoring: Active rides, pending bookings
- User behavior: Most popular routes
- Financial: Revenue tracking, pending payouts

**Use:**
- Recharts or Chart.js for visualizations
- Server-sent events for real-time updates

**Impact:** ⭐⭐⭐ Better operational visibility

---

## 🔐 Additional Security Hardening

### 21. Add Input Validation Library
**Current:** Manual validation in services (134 `raise HTTPException` calls)

**Improvement:** Use Pydantic validators consistently
```python
from pydantic import BaseModel, field_validator

class BookingCreate(BaseModel):
    ride_id: UUID
    seats_booked: int
    
    @field_validator('seats_booked')
    def validate_seats(cls, v):
        if v < 1 or v > 4:
            raise ValueError('seats_booked must be between 1 and 4')
        return v
```

**Impact:** ⭐⭐⭐ Consistent validation, less code duplication

---

### 22. Implement Token Blacklist (Session Revocation)
**Current:** JWT tokens valid for 15 minutes even after password change/block

**Solution:** Redis-based token blacklist
```python
# backend/app/core/security.py
def revoke_token(token: str):
    redis_client.setex(f"blacklist:{token}", 900, "1")  # 15 min TTL

def is_token_revoked(token: str) -> bool:
    return redis_client.exists(f"blacklist:{token}")

# In get_current_user dependency
if is_token_revoked(token):
    raise HTTPException(401, "Token has been revoked")
```

**Impact:** ⭐⭐⭐⭐ Immediate account protection

---

### 23. Add File Upload Security
**Current:** `/uploads` mounted but no validation code visible

**Add validation:**
```python
# backend/app/domains/uploads/service.py
ALLOWED_EXTENSIONS = {'.jpg', '.jpeg', '.png', '.pdf'}
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10 MB

def validate_upload(file: UploadFile):
    # Check extension
    ext = Path(file.filename).suffix.lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(400, f"File type {ext} not allowed")
    
    # Check size
    file.file.seek(0, 2)  # Seek to end
    size = file.file.tell()
    file.file.seek(0)  # Reset
    if size > MAX_FILE_SIZE:
        raise HTTPException(400, "File too large")
    
    # Check MIME type
    if file.content_type not in ['image/jpeg', 'image/png', 'application/pdf']:
        raise HTTPException(400, "Invalid file type")
```

**Impact:** ⭐⭐⭐⭐ Prevents malware uploads

---

## 📅 Implementation Priority Matrix

### 🔥 Do This Week (Critical)
1. Pin dependencies (30 min)
2. Add rate limiting to auth (1 hour)
3. Environment-specific CORS (30 min)
4. Remove console logs (1 hour)

### ⚡ Do This Month (High Impact)
5. Row Level Security policies (2-3 days)
6. Database indexes for search (1 day)
7. Token blacklist for session revocation (1 day)
8. Background task for booking expiry (1 day)
9. File upload validation (1 day)
10. Logging and error tracking (1 day)

### 📈 Do This Quarter (Scaling)
11. N+1 query optimization (1 week)
12. API response caching (2 days)
13. Test coverage expansion (ongoing)
14. Frontend loading states (3 days)
15. CI/CD deployment automation (1 week)
16. Database backup strategy (1 day)
17. Health check monitoring (2 hours)

### 🎯 Nice to Have (Long-term)
18. Analytics tracking
19. Admin dashboard improvements
20. Bundle size optimization
21. Mobile responsiveness audit
22. Input validation library migration

---

## 📊 Estimated Impact Summary

| Category | Items | Total Effort | Impact Score |
|----------|-------|--------------|--------------|
| Security | 8 improvements | 8-10 days | ⭐⭐⭐⭐⭐ |
| Performance | 4 improvements | 8-10 days | ⭐⭐⭐⭐ |
| Testing | 2 improvements | Ongoing | ⭐⭐⭐⭐⭐ |
| DevOps | 4 improvements | 7-10 days | ⭐⭐⭐⭐ |
| Frontend | 3 improvements | 5-7 days | ⭐⭐⭐⭐ |
| Product | 2 improvements | 3-5 days | ⭐⭐⭐ |

**Total estimated effort for high-priority items:** 4-6 weeks of focused development

---

## 🎯 Success Metrics

Track these KPIs after implementing improvements:

1. **Security:** Zero critical vulnerabilities in security scans
2. **Performance:** API response time < 200ms (p95), < 500ms (p99)
3. **Reliability:** 99.9% uptime, < 1% error rate
4. **Test Coverage:** > 80% backend, > 70% frontend
5. **User Experience:** < 3s page load, < 100ms UI interactions

---

**Next Steps:**
1. Review this roadmap with the team
2. Prioritize based on business goals
3. Create GitHub issues for each improvement
4. Implement critical security fixes this week
5. Schedule monthly reviews to track progress
