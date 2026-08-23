FROM python:3.14-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# collectstatic runs in entrypoint.sh instead, at container start — doing
# it here at build time is pointless, since docker-compose.yml's bind mount
# of ./staticfiles over /app/staticfiles shadows it as soon as the
# container starts.
RUN chmod +x entrypoint.sh

EXPOSE 8000
ENTRYPOINT ["./entrypoint.sh"]
