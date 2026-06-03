from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger
from apscheduler.triggers.interval import IntervalTrigger

scheduler = AsyncIOScheduler(timezone="Africa/Lagos")


def setup_scheduler():
    from app.tasks.reminder_tasks import check_upcoming_classes
    from app.tasks.survey_tasks import send_weekly_survey_invite
    from app.tasks.analytics_tasks import generate_weekly_analytics

    scheduler.add_job(
        check_upcoming_classes,
        IntervalTrigger(minutes=5),
        id="check_reminders",
        replace_existing=True,
        misfire_grace_time=60,
    )
    scheduler.add_job(
        send_weekly_survey_invite,
        CronTrigger(day_of_week="mon", hour=8, minute=0),
        id="weekly_survey",
        replace_existing=True,
    )
    scheduler.add_job(
        generate_weekly_analytics,
        CronTrigger(day_of_week="sun", hour=23, minute=0),
        id="weekly_analytics",
        replace_existing=True,
    )
