# Scalability Notes

## Current Architecture

The project is built with scalability as a first-class concern from day one — not bolted on after.

---

## 1. Async I/O — Handles Concurrency Without Extra Servers

FastAPI runs on **Uvicorn (ASGI)**, which is non-blocking by design. Combined with **SQLAlchemy async + asyncpg**, every database query is non-blocking. A single Uvicorn worker can handle hundreds of concurrent requests without spawning threads.

**Compare:**
- Flask (WSGI, sync): 1 request blocks 1 thread → need many workers
- FastAPI (ASGI, async): 1 worker handles many concurrent requests

---

## 2. Stateless JWT Auth — Horizontal Scaling Ready

Access tokens are verified using a shared `SECRET_KEY` — no session state lives on the server. This means:

- Run **N replicas** of the backend behind a load balancer
- Any replica can verify any token
- No sticky sessions required

```
                    ┌─────────────┐
                    │ Load Balancer│
                    └──────┬──────┘
              ┌────────────┼────────────┐
        ┌─────▼─────┐ ┌───▼─────┐ ┌───▼─────┐
        │ Backend 1 │ │Backend 2│ │Backend 3│
        └─────┬─────┘ └───┬─────┘ └───┬─────┘
              └────────────┼────────────┘
                    ┌──────▼──────┐
                    │  PostgreSQL │
                    └─────────────┘
```

---

## 3. Modular Structure — Zero-Cost New Features

Each feature is a self-contained module (`auth`, `tasks`, `admin`). Adding a new entity (e.g., `products`) requires only:

```
models/product.py
schemas/product.py
services/product_service.py
api/v1/products.py
```

Register the router in `api/v1/__init__.py` — **nothing else changes**. This is the foundation for extracting microservices later.

---

## 4. Database Connection Pooling

SQLAlchemy is configured with:
```python
pool_size=10, max_overflow=20
```
Supports 30 concurrent DB connections per backend instance. For higher load, add **PgBouncer** in front of PostgreSQL to multiplex thousands of app connections into a smaller pool.

---

## 5. Docker — Kubernetes Ready

The `docker-compose.yml` can be translated to Kubernetes manifests with minimal changes:

| docker-compose | Kubernetes |
|---|---|
| `services.backend` | `Deployment` + `Service` |
| `services.db` | `StatefulSet` + `PersistentVolumeClaim` |
| `environment` | `ConfigMap` + `Secret` |
| `healthcheck` | `livenessProbe` + `readinessProbe` |

---

## 6. Caching Layer (Next Step — Redis)

Currently every request hits the database. Add Redis to cache:

- **Frequently read data** — user profiles, task lists
- **Rate limit counters** — replace in-memory slowapi storage with Redis for distributed rate limiting
- **Refresh token revocation** — fast lookup without DB query

```python
# Example: cache user profile for 5 minutes
@cache(expire=300)
async def get_user_profile(user_id: int): ...
```

**Library:** `fastapi-cache2` with Redis backend.

---

## 7. Background Tasks (Next Step — Celery)

For long-running operations (email notifications, report generation, bulk imports), offload to **Celery + Redis/RabbitMQ**:

```
Request → FastAPI → enqueue task → return 202 Accepted
                        ↓
                   Celery Worker → process → notify
```

---

## 8. Microservices Path

The current module structure maps cleanly to microservices when the time comes:

| Module | Microservice | DB |
|---|---|---|
| `auth/` | Auth Service | users, refresh_tokens |
| `tasks/` | Task Service | tasks |
| `admin/` | Admin Service | reads from both |

Services communicate via **REST** (simple) or **message queue** (Kafka/RabbitMQ for async events like "user deleted → delete their tasks").

---

## 9. Observability

Production readiness checklist:

- ✅ **Structured logging** — loguru with JSON output
- ⬜ **Distributed tracing** — OpenTelemetry + Jaeger
- ⬜ **Metrics** — Prometheus + Grafana
- ⬜ **Error tracking** — Sentry (`pip install sentry-sdk`)

Adding Sentry takes 2 lines:
```python
import sentry_sdk
sentry_sdk.init(dsn="your-dsn", traces_sample_rate=0.2)
```

---

## 10. Load Testing Baseline

Use **Locust** to benchmark before scaling:

```bash
pip install locust
locust -f locustfile.py --host=http://localhost:8000
```

Identify bottlenecks → add caching / replicas / pooling where metrics show saturation.