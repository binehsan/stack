#!/bin/sh
set -e

# Runs on every container start (not just first deploy), so a fresh image
# with a pending migration applies it automatically on the next `docker
# compose up -d` — no separate manual migrate step per deploy.
python manage.py migrate --noinput

exec gunicorn config.wsgi:application --bind 0.0.0.0:8000 --workers 3
