## Context

See `proposal.md` for motivation. The web application is a TypeScript React/Vinext player whose `app/page.tsx` imports a local ten-track catalog and recommendation catalog. Its current favorites and Later state are React-only, and no API client, environment configuration, Python service, database, or deployment files exist. `docs/FUTURE_API.md` requires real data to enter through adapters and services rather than the recommendation core.

The target server is the existing public Ubuntu host. The approved temporary API origin is `https://8.217.117.12.sslip.io`; the frontend is already deployed at `https://rnb-fireplace-radar.huyixuan.chatgpt.site`.

## Goals / Non-Goals

**Goals:**
- Make the approved anonymous-device state durable and restore it into the existing player.
- Keep the local catalog, local preview files, and pure recommendation core unchanged.
- Make API operation, test execution, TLS verification, and rollback repeatable on the target host.
- Keep each persistence update isolated to one user JSON document and reject invalid input before a write.

**Non-Goals:**
- User registration, passwords, sessions, cross-device identity, or recovery.
- A database, cloud storage, provider integration, catalog administration, or server-side recommendation ranking.
- LangChain, Anthropic access, API keys, AI-generated recommendations, or new preference-setting UI.
- Guaranteed synchronization across two browser tabs that make conflicting edits simultaneously.

## Decisions

### Use a separate FastAPI application with explicit layers

Create `backend/` as a self-contained Python application with `api`, `services`, `repositories`, `models`, and `tests` modules. Routes own HTTP translation and CORS; services enforce state transitions; the JSON repository owns validation-safe loading and writing; Pydantic models define the request and response contract. This isolates FastAPI and filesystem concerns from user-state rules.

The alternative of adding Python behavior to the existing frontend worker would mix runtimes and make the required Ubuntu deployment and JSON filesystem storage unavailable. A database-backed service is deferred because the approved V1 storage constraint is local JSON.

### Define a small resource-oriented API

All endpoints require `X-Device-Id` and are versioned under `/api/v1`:

- `GET /api/v1/user-state` creates or returns the complete state document.
- `PUT /api/v1/favorites/{track_id}` and `DELETE /api/v1/favorites/{track_id}` mutate one favorite.
- `PUT /api/v1/later` accepts the complete ordered track-ID list.
- `POST /api/v1/playback-history` accepts `{ "trackId": string }` and records the server timestamp.
- `PUT /api/v1/preferences` accepts `{ "theme": string, "displayOptions": object, "musicTags": string[] }`.
- `GET /healthz` reports service health without requiring a device ID.

Every success response returns the current canonical state except `/healthz`. Input uses bounded non-empty strings and bounded collections; track IDs remain opaque because the backend deliberately has no catalog. The alternative of one generic `PUT /user-state` would make concurrent independent actions overwrite each other more easily and offers poorer error reporting.

### Store one canonical document per device with atomic replacement

The repository stores `data/users/<device-id>.json` outside any static/public path. A first `GET` creates a default document:

```json
{
  "favorites": [],
  "later": [],
  "playbackHistory": [],
  "preferences": {
    "theme": "default",
    "displayOptions": {},
    "musicTags": []
  }
}
```

For every mutation, the repository validates the full next document, writes it to a sibling temporary file, flushes it, then atomically replaces the canonical file. An in-process async lock keyed by device ID serializes same-process writes. The deployment uses a single Uvicorn worker because separate workers would require an inter-process locking primitive that is disproportionate for V1.

One aggregate JSON file was rejected because unrelated users would contend for the same write. Separate files per domain collection were rejected because they weaken atomicity for a user-level read and add unnecessary filesystem coordination.

### Treat the device ID as an opaque client-held capability

The frontend generates a UUID through browser cryptography, stores it under a namespaced local-storage key, and provides it through `X-Device-Id`. The backend accepts a strict UUID format and never logs its full value. This is anonymous partitioning, not authentication: someone who acquires the ID can access that data. It is acceptable only because V1 deliberately stores non-sensitive anonymous player preferences.

### Add a frontend user-state adapter and retain optimistic interactions

Add a typed `src/adapters/user_state_api/` client plus a `src/services/user_state/` coordination layer. `PlayerPage`/hooks consume the resulting controller rather than calling `fetch` directly. On initial load, the controller restores remote state; favorite and Later actions update the UI immediately and synchronize the relevant API resource; a preview start appends history once. The controller uses a public API base URL configuration value and displays a concise synchronization error while retaining current local interaction behavior.

This preserves the existing UI → services → adapters boundary. The alternative of placing API calls in the large `player-page.tsx` would create direct infrastructure coupling in the UI and make request failures harder to test.

### Serve HTTPS through Caddy and use explicit origins

Uvicorn binds only to loopback on a non-public port. Caddy listens on 80/443 for `8.217.117.12.sslip.io`, obtains and renews TLS, and reverse-proxies to Uvicorn. FastAPI CORS allows exactly the approved public frontend and the two local development origins, including `X-Device-Id` and required HTTP methods. User JSON stays in the application's data directory and is not configured as a Caddy file root.

Direct HTTP on the server IP was rejected because the HTTPS frontend would be blocked by browser mixed-content protections. A self-signed certificate was rejected because browsers would not trust it. `sslip.io` is accepted as a V1 temporary domain with its availability risk documented.

## Risks / Trade-offs

- [Anonymous IDs are not authenticated] → Store only the approved low-sensitivity state, validate UUIDs, and document that clearing browser storage creates a new user.
- [JSON is not a multi-process data store] → Use per-user documents, atomic replacement, same-process locking, and a single application worker; migrate to a database before scaling workers or hosts.
- [Temporary `sslip.io` dependency] → Keep the API base URL configurable so a future owned domain changes configuration and Caddy only.
- [Optimistic UI can temporarily diverge after a failed write] → Show sync failure, retain local usability, and reload canonical state on the next page load.
- [TLS issuance needs public inbound ports] → Verify DNS resolution and ports 80/443 before deployment; roll back to the prior frontend build if the API origin cannot be verified.

## Migration Plan

1. Add backend code, tests, package lock, frontend adapter, configuration documentation, and deployment assets locally.
2. Run backend tests, frontend tests, lint, and production build; verify CORS behavior against the allowed and disallowed origins.
3. On the server, install the pinned Python environment and Caddy, copy release files outside the web root, configure a systemd service, and start Uvicorn on loopback.
4. Configure Caddy for `8.217.117.12.sslip.io`, verify certificate issuance and `/healthz`, then deploy the frontend with its public API base URL.
5. Verify a browser can persist a favorite and Later item across refresh. If verification fails, roll back the frontend to the prior build and stop the service; JSON files remain available for inspection and recovery.
