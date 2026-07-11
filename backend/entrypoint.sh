#!/bin/bash
set -e

# Apply migrations
python manage.py migrate

# Collect static files
python manage.py collectstatic --noinput

# Start the server
exec python manage.py runserver 0.0.0.0:8000
