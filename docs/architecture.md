# QuickNotes System Architecture

## Functional requirements

- Create, read, update, and delete a user's notes.
- List and search notes with pagination; attach tags.
- Authenticate users, authorize note access, and validate inputs.
- Show loading, success, error, and empty UI states.

## Non-functional requirements

- Support 1 million registered users and traffic spikes.
- Keep reads responsive and isolate slow background work.
- Use HTTPS, access control, backups, monitoring, and tested recovery.
- Recover from app-instance failures without losing committed data.

## Load estimates

Assumptions: 1,000,000 registered users; 20% daily active = 200,000 DAU; each active user reads notes 20 times and creates 5 notes per day; 100,000 seconds/day approximation; peak = 5× average; each note averages 1 KB including rough index overhead.

- Reads/day = 200,000 × 20 = 4,000,000; average = 4,000,000 / 100,000 = **40 reads/s**; peak = **200 reads/s**.
- Writes/day = 200,000 × 5 = 1,000,000; average = 1,000,000 / 100,000 = **10 writes/s**; peak = **50 writes/s**.
- Storage/year = 1,000,000 notes/day × 1 KB × 365 = approximately **365 GB/year**, before backups, replicas, indexes, and other tables.

This workload is read-heavy (about four reads per write), so caching and read replicas are useful while the primary database accepts writes.

## Architecture diagram

```text
Client / Browser
      |  DNS lookup
      v
     DNS
      v
     CDN (static assets)
      v
 Load Balancer
   /        \
  v          v
App Server A  App Server B (stateless)
  |    \       |    \
  v     v      v     v
Cache  Primary DB  Queue
Redis      |         |
           v         v
       Read Replica  Worker
```

## Component responsibilities

- **Client:** Renders the interface and sends HTTPS API requests.
- **DNS:** Resolves the API hostname to its network destination.
- **CDN:** Serves cacheable static assets close to users, reducing latency and origin load.
- **Load balancer:** Distributes traffic across healthy app instances and removes unhealthy instances from rotation.
- **App servers:** Stateless instances handle validation, authentication, authorization, and business logic.
- **Redis cache:** Stores frequently requested note lists to reduce database reads; TTL and invalidation limit stale results.
- **Primary database:** Durably stores notes and related records and accepts writes.
- **Read replica:** Handles suitable reads to reduce primary load, with possible replication lag.
- **Queue:** Buffers background jobs and separates slow work from the request path.
- **Worker:** Processes queued jobs such as notifications or exports, with retries and idempotency.

## GET /notes flow

1. Client resolves DNS and sends `GET /v1/notes` over HTTPS.
2. Load balancer routes the request to a healthy app server.
3. App server authenticates the user and validates pagination.
4. Server checks Redis; on a cache hit it returns the result.
5. On a miss, it queries the read replica if its freshness is acceptable, then caches the result with a TTL.
6. Server returns `200 OK` with a paginated JSON response. Read-after-write requests can go to the primary to avoid replica lag.

## POST /notes flow

1. Client sends JSON with title and optional body over HTTPS.
2. Load balancer routes it to a healthy app server.
3. Server authenticates, validates the required title (maximum 100 characters), and derives the owner from the authenticated identity.
4. Server inserts the note into the primary database in a transaction.
5. Server invalidates affected Redis entries and enqueues any asynchronous jobs.
6. API returns `201 Created`; primary data replicates to the read replica.

## Trade-offs

- **Caching vs freshness:** Cache reduces latency and database load, but invalidation/TTL is needed to prevent stale lists.
- **Read replicas vs consistency:** Replicas add read capacity but can lag; route freshness-sensitive reads to the primary.
- **Queue vs immediate completion:** Async jobs keep requests fast and absorb spikes, but completion is delayed; use monitoring, retries, and idempotent workers.
- **Resilience vs cost:** Redundancy improves uptime but costs more and adds operational complexity; scale based on measured needs.

## Avoiding single points of failure

Run at least two app servers across separate failure zones behind health checks. Use a highly available managed database, backups, and tested failover; a read replica alone is not a backup. Configure cache redundancy or allow database fallback, and use a durable queue with retry/dead-letter handling plus multiple workers. Monitor health and test recovery procedures.
