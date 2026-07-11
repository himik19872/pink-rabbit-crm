from .base import *

# Production settings
DEBUG = False
ALLOWED_HOSTS = env.list("ALLOWED_HOSTS", default=[])

# CORS
CORS_ALLOWED_ORIGINS = env.list("CORS_ALLOWED_ORIGINS", default=[])

# Security
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
SECURE_SSL_REDIRECT = True
SECURE_HSTS_SECONDS = 31536000

# Logging
LOGGING = {
    "version": 1,
    "disable_existing_loggers": False,
    "handlers": {
        "console": {"class": "logging.StreamHandler"},
        "file": {
            "class": "logging.FileHandler",
            "filename": str(BASE_DIR / "logs" / "django.log"),
        },
    },
    "root": {"handlers": ["console", "file"], "level": "INFO"},
}
