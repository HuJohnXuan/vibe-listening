## Why

The player currently keeps favorites, the Later queue, playback state, and preferences only in browser memory, so all user state is lost on refresh. A small deployed backend is needed now to make the existing anonymous-device experience durable without changing the local music-catalog MVP or introducing account registration.

## What Changes

- Add a Python FastAPI service that persists one anonymous device user's state per JSON file.
- Add a versioned HTTPS API for reading and updating favorites, the ordered Later queue, playback history, and the minimal preference set.
- Update the web player to create and retain an anonymous device ID, restore its state on load, and synchronize user actions through the API.
- Deploy the API on the existing server behind Caddy at `https://8.217.117.12.sslip.io`, with a strict production and local-development CORS allowlist.
- Add backend tests, frontend synchronization tests, and operational documentation for local development and server deployment.

## Capabilities

### New Capabilities

- `anonymous-user-state-api`: Provide validated, JSON-backed anonymous-device state for favorites, Later, history, and preferences.
- `player-user-state-sync`: Restore and persist the existing player user state through the anonymous-user-state API.
- `secure-user-data-api-deployment`: Serve the API over HTTPS with the approved CORS policy and repeatable server operations.

### Modified Capabilities

- None.

## Impact

- Adds a Python/FastAPI backend and locked Python dependencies alongside the existing TypeScript frontend.
- Replaces frontend-only user-state handling in the player UI while retaining the local track catalog, recommendation engine, and preview assets.
- Adds JSON data files on the server, a public HTTPS API origin, Caddy configuration, and a system service.
- Does not add authentication, a database, real music-provider integration, or LangChain-Anthropic functionality.
