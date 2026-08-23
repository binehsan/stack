#!/bin/sh
set -e

# Runs on every container start (not just first deploy), so a fresh image
# with a pending migration applies it automatically on the next `docker
# compose up -d` — no separate manual migrate step per deploy.
python manage.py migrate --noinput

# Must run here, not at Docker build time: docker-compose.yml bind-mounts
# the host's ./staticfiles over /app/staticfiles at container start, which
# shadows whatever collectstatic wrote into the image during build. Running
# it here (after the mount is live) makes it actually land in the host dir
# that nginx serves /static/ from.
python manage.py collectstatic --noinput

exec gunicorn config.wsgi:application --bind 0.0.0.0:8000 --workers 3
