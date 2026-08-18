FROM python:3.14-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Safe to run without a real .env present — every setting it touches
# (SECRET_KEY, DEBUG, etc.) has a dev-safe fallback, and collectstatic
# doesn't need the database. Real secrets are injected at *run* time via
# docker-compose's env_file, never baked into the image.
RUN python manage.py collectstatic --noinput

RUN chmod +x entrypoint.sh

EXPOSE 8000
ENTRYPOINT ["./entrypoint.sh"]
