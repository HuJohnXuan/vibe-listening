## 1. Backend foundation and contract

- [ ] 1.1 Create the isolated `backend/` Python package structure for API routes, Pydantic models, services, JSON repositories, configuration, and tests.
- [ ] 1.2 Add pinned FastAPI, Uvicorn, and test dependencies with a reproducible Python environment definition.
- [ ] 1.3 Define validated device-ID, track-ID, preferences, playback-history, and complete user-state request/response models.
- [ ] 1.4 Add failing model and validation tests for missing or invalid device IDs, invalid bodies, and bounded user-state collections.

## 2. JSON user-state persistence

- [ ] 2.1 Implement default per-device state creation and JSON repository reads outside public/static directories.
- [ ] 2.2 Implement atomic per-device JSON replacement with same-process device locks and validated state transitions.
- [ ] 2.3 Implement independent favorite, ordered de-duplicated Later, playback-start history, and preference service operations.
- [ ] 2.4 Add repository and service tests for isolation, persistence across reloads, de-duplication, newest-first history, invalid writes, and unchanged valid state after rejected writes.

## 3. FastAPI user-state API

- [ ] 3.1 Implement the `/healthz` endpoint and versioned anonymous user-state routes using `X-Device-Id`.
- [ ] 3.2 Configure the exact production and local-development CORS origins, methods, and `X-Device-Id` header.
- [ ] 3.3 Add API integration tests for first read, every supported mutation, validation failures, approved CORS preflight, and rejected foreign origins.
- [ ] 3.4 Add structured non-sensitive API error logging and user-safe error responses.

## 4. Player synchronization

- [ ] 4.1 Add typed frontend user-state contracts, a configurable public API base URL, and an adapter that sends the stable anonymous device ID.
- [ ] 4.2 Add a user-state service/controller that generates or reuses a cryptographic browser UUID and restores remote state during player initialization.
- [ ] 4.3 Update the existing Later and favorite state flows to initialize from and synchronize with the API while preserving local interaction during request failure.
- [ ] 4.4 Record one remote playback-history event when a local preview starts without changing catalog, preview, or recommendation inputs.
- [ ] 4.5 Add frontend tests for device-ID reuse, restored favorites/Later, playback-start reporting, and API-failure usability.

## 5. Configuration, deployment, and documentation

- [ ] 5.1 Add `.env.example` and frontend/backend configuration documentation for the API origin, data directory, allowed origins, and runtime ports.
- [ ] 5.2 Add Caddy and systemd deployment assets for loopback Uvicorn and `https://8.217.117.12.sslip.io` TLS termination.
- [ ] 5.3 Update README, API, data-model, architecture, testing, configuration, and changelog documentation for the new backend behavior and operational limits.
- [ ] 5.4 Add server deployment and rollback instructions, including port checks, certificate verification, health checks, logs, and JSON backup guidance.

## 6. Verification and release

- [ ] 6.1 Run backend unit and API integration tests, frontend tests, lint, and production build; fix only failures caused by this change.
- [ ] 6.2 Deploy the backend to the target server, verify trusted HTTPS and strict CORS, then deploy the frontend with the production API origin.
- [ ] 6.3 Perform browser acceptance checks that a favorite and Later item persist across refresh and that API outage leaves local playback usable.
- [ ] 6.4 Validate the OpenSpec change, record final verification evidence, and prepare the change for archive after acceptance.
