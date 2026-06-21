import os
import re
import sys
import logging
from logging.handlers import RotatingFileHandler

class RedactingFormatter(logging.Formatter):
    def __init__(self, fmt: str):
        super().__init__(fmt)
        # Redact API keys matching AIzaSy...
        self.api_key_regex = re.compile(r"AIzaSy[A-Za-z0-9_-]{33}")

    def format(self, record: logging.LogRecord) -> str:
        msg = super().format(record)
        # Redact potential API keys
        msg = self.api_key_regex.sub("[REDACTED_API_KEY]", msg)
        return msg

def setup_logging():
    # Ensure logs directory exists
    os.makedirs("logs", exist_ok=True)
    
    root_logger = logging.getLogger()
    # Clear existing handlers
    for handler in root_logger.handlers[:]:
        root_logger.removeHandler(handler)
        
    root_logger.setLevel(logging.INFO)
    
    # Format log message to exactly: LEVELNAME Message
    log_format = "%(levelname)s %(message)s"
    formatter = RedactingFormatter(log_format)
    
    # Console Handler (Stdout)
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setLevel(logging.INFO)
    console_handler.setFormatter(formatter)
    root_logger.addHandler(console_handler)
    
    # File Handler with rotation (5MB, 5 backups)
    file_handler = RotatingFileHandler(
        "logs/backend.log", 
        maxBytes=5 * 1024 * 1024, 
        backupCount=5, 
        encoding="utf-8"
    )
    file_handler.setLevel(logging.INFO)
    file_handler.setFormatter(formatter)
    root_logger.addHandler(file_handler)
    
    # Set levels for noisy libraries — but keep uvicorn.error at INFO
    # so that the critical "Uvicorn running on http://..." startup message
    # is emitted (Hugging Face monitors stdout for this)
    for logger_name in ["fastapi"]:
        l = logging.getLogger(logger_name)
        l.setLevel(logging.WARNING)
        l.propagate = True

    # uvicorn core logger MUST stay at INFO for startup confirmation
    logging.getLogger("uvicorn").setLevel(logging.INFO)
    logging.getLogger("uvicorn.error").setLevel(logging.INFO)

    # Access logs are noisy — keep at WARNING
    logging.getLogger("uvicorn.access").setLevel(logging.WARNING)

