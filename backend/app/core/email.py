import logging
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from typing import Optional

from app.core.config import settings

logger = logging.getLogger(__name__)


def send_email(
    to_email: str,
    subject: str,
    html_content: str,
    text_content: Optional[str] = None,
):
    """Send an email using configured SMTP settings.

    Logs and skips sending if SMTP is not configured.
    """
    if (
        not settings.SMTP_SERVER
        or not settings.SMTP_USERNAME
        or not settings.SMTP_PASSWORD
    ):
        logger.warning(
            f"SMTP not configured. Skipping email to {to_email}. Subject: {subject}"
        )
        return

    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = settings.SMTP_FROM_EMAIL
    msg["To"] = to_email

    if text_content:
        part1 = MIMEText(text_content, "plain")
        msg.attach(part1)

    part2 = MIMEText(html_content, "html")
    msg.attach(part2)

    try:
        server = smtplib.SMTP(settings.SMTP_SERVER, settings.SMTP_PORT)
        if settings.SMTP_PORT == 587:
            server.starttls()
        server.login(settings.SMTP_USERNAME, settings.SMTP_PASSWORD)
        server.sendmail(settings.SMTP_FROM_EMAIL, to_email, msg.as_string())
        server.quit()
        logger.info(f"Successfully sent email to {to_email}")
    except Exception as e:
        logger.error(f"Failed to send email to {to_email}: {str(e)}")
        raise
