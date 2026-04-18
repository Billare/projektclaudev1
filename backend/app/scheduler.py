import logging
from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.interval import IntervalTrigger

from .config import settings
from .database import SessionLocal
from .fetcher import sync_all

logger = logging.getLogger(__name__)
_scheduler = BackgroundScheduler()


def _run_sync():
    db = SessionLocal()
    try:
        logger.info("Scheduled sync starting...")
        result = sync_all(db)
        logger.info("Scheduled sync complete: %s", result)
    except Exception as exc:
        logger.error("Scheduled sync failed: %s", exc)
    finally:
        db.close()


def start_scheduler():
    _scheduler.add_job(
        _run_sync,
        IntervalTrigger(hours=settings.sync_interval_hours),
        id="spotify_sync",
        replace_existing=True,
    )
    _scheduler.start()
    logger.info("Scheduler started — syncing every %d hours", settings.sync_interval_hours)


def stop_scheduler():
    if _scheduler.running:
        _scheduler.shutdown()
