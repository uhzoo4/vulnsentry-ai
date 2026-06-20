import os
import logging
from dotenv import load_dotenv

logger = logging.getLogger("vulnsentry.config")

# Verify .env file location and load environment variables
env_file = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), ".env")
dotenv_loaded = False
if os.path.exists(env_file):
    load_dotenv(dotenv_path=env_file)
    dotenv_loaded = True
else:
    load_dotenv()  # Fallback search

class Settings:
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    GEMINI_MODEL: str = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")
    API_SECRET: str = os.getenv("API_SECRET", "")
    
    # Rate limit check (enabled by default unless explicitly disabled)
    RATE_LIMIT: bool = os.getenv("RATE_LIMIT", "true").lower() != "false"
    
    # CORS Origins
    ALLOWED_ORIGINS: str = os.getenv("ALLOWED_ORIGINS", "")
    
    # AI state
    AI_ENABLED: bool = True

settings = Settings()

def validate_config():
    if dotenv_loaded:
        logger.info("Loaded environment configuration from .env file.")
    else:
        logger.info("Loaded environment configuration.")
        
    if not settings.GEMINI_API_KEY:
        logger.warning("WARNING: GEMINI_API_KEY is not configured. AI features will run in offline fallback mode.")
        settings.AI_ENABLED = False
    else:
        logger.info("AI analysis engine initialized.")
        settings.AI_ENABLED = True

REQUEST_TIMEOUT = 20
