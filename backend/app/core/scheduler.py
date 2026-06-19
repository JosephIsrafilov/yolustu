import logging
from datetime import datetime, timezone

from apscheduler.schedulers.asyncio import AsyncIOScheduler  # type: ignore[import-not-found]
from apscheduler.triggers.interval import IntervalTrigger  # type: ignore[import-not-found]

from app.core.database import SessionLocal
from app.core.redis import get_redis
from app.domains.bookings.services import BookingsService
from app.domains.bookings.repositories import BookingRepository

logger = logging.getLogger(__name__)

scheduler = AsyncIOScheduler()

# The expiry job runs in-process on every gunicorn worker. To keep N workers
# from doing N concurrent expiry passes over the same rows, each tick first
# tries to win a short-lived Redis lock; only the winner runs the pass. TTL is
# just under the 5-minute interval so a crashed holder can't wedge the job.
EXPIRY_LOCK_KEY = "lock:expire_bookings"
EXPIRY_LOCK_TTL_SECONDS = 290


def _acquire_expiry_lock() -> bool:
    """Return True if this process won the expiry lock for this tick."""
    try:
        redis = get_redis()
        acquired = redis.set(
            EXPIRY_LOCK_KEY,
            datetime.now(timezone.utc).isoformat(),
            nx=True,
            ex=EXPIRY_LOCK_TTL_SECONDS,
        )
        return bool(acquired)
    except Exception as e:  # pragma: no cover - Redis must not break the job
        # If Redis is unreachable, fail open: better to risk a double pass
        # (the work is idempotent) than to never expire bookings.
        logger.warning(f"Expiry lock unavailable, running unguarded: {e}")
        return True


def expire_bookings_job():
    """
    Background job to expire bookings that have passed their payment deadline.
    Runs independently of user requests to ensure accurate seat availability.
    """
    if not _acquire_expiry_lock():
        logger.debug("Another worker holds the expiry lock; skipping this tick")
        return

    logger.info("Running scheduled booking expiry check")
    db = SessionLocal()
    try:
        booking_repo = BookingRepository(db)
        bookings_service = BookingsService(db)

        # Get all accepted bookings that might need expiration
        now = datetime.now(timezone.utc)
        bookings = booking_repo.get_accepted_with_deadline_before(now)

        if bookings:
            logger.info(f"Found {len(bookings)} bookings to check for expiration")
            # Use the existing lazy expire logic
            bookings_service._lazy_expire_bookings(bookings)
            db.commit()
            logger.info(f"Processed {len(bookings)} bookings for expiration")
        else:
            logger.debug("No bookings to expire")

    except Exception as e:
        logger.error(f"Error in booking expiry job: {e}", exc_info=True)
        db.rollback()
    finally:
        db.close()


def start_scheduler():
    """Initialize and start the APScheduler for background tasks."""
    if not scheduler.running:
        # Add the booking expiry job to run every 5 minutes
        scheduler.add_job(
            expire_bookings_job,
            trigger=IntervalTrigger(minutes=5),
            id="expire_bookings",
            name="Expire bookings past payment deadline",
            replace_existing=True,
        )

        scheduler.start()
        logger.info("APScheduler started successfully")
    else:
        logger.warning("APScheduler is already running")


def shutdown_scheduler():
    """Gracefully shutdown the scheduler."""
    if scheduler.running:
        scheduler.shutdown()
        logger.info("APScheduler shut down successfully")
