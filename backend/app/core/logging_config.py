import logging
import sys
from typing import Any


class CustomFormatter(logging.Formatter):
    def format(self, record: logging.LogRecord) -> str:
        # Simplistic structured logging simulation
        log_data = {
            "timestamp": self.formatTime(record),
            "level": record.levelname,
            "message": record.getMessage(),
            "module": record.module,
            "function": record.funcName,
        }
        if record.exc_info:
            log_data["exception"] = self.formatException(record.exc_info)
        return str(log_data)


def setup_logging():
    logger = logging.getLogger()
    logger.setLevel(logging.INFO)

    handler = logging.StreamHandler(sys.stdout)
    handler.setFormatter(CustomFormatter())

    logger.addHandler(handler)

    # Specific loggers
    logging.getLogger("uvicorn.access").handlers = [handler]
    logging.getLogger("uvicorn.error").handlers = [handler]
