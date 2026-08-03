FROM ghcr.io/astral-sh/uv:python3.12-bookworm-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    UV_LINK_MODE=copy

WORKDIR /workspace
COPY . .
RUN uv sync --package citynario-api --no-dev --frozen

ENV PATH="/workspace/.venv/bin:$PATH"
EXPOSE 8000
CMD ["uvicorn", "citynario_api.main:app", "--host", "0.0.0.0", "--port", "8000"]
