import logging
from datetime import datetime, timezone

from apscheduler.schedulers.asyncio import AsyncIOScheduler  # type: ignore[import-not-found]
from apscheduler.triggers.interval import IntervalTrigger  # type: ignore[import-not-found]

from app.core.database import SessionLocal
from app.domains.bookings.services import BookingsService
from app.domains.bookings.repositories import BookingRepository

logger = logging.getLogger(__name__)

scheduler = AsyncIOScheduler()


def expire_bookings_job():
    """
    Background job to expire bookings that have passed their payment deadline.
    Runs independently of user requests to ensure accurate seat availability.
    """
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
