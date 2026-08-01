## Purpose

Expose the anonymous user-state API securely to the deployed web player and make its server operation repeatable on the existing public host.

## ADDED Requirements

### Requirement: The API is available through the approved HTTPS origin
The user-state API SHALL be reachable at `https://8.217.117.12.sslip.io` and SHALL expose a health response suitable for deployment verification.

#### Scenario: Browser-compatible health check
- **WHEN** a client requests the API health endpoint through the approved HTTPS origin
- **THEN** it receives a successful response without a browser certificate warning

### Requirement: Browser cross-origin access is restricted
The API SHALL allow browser requests only from `https://rnb-fireplace-radar.huyixuan.chatgpt.site`, `http://localhost:3000`, and `http://localhost:3001`. It SHALL not use a wildcard allowed origin.

#### Scenario: Approved production origin calls the API
- **WHEN** a browser request originates from `https://rnb-fireplace-radar.huyixuan.chatgpt.site`
- **THEN** the API supplies CORS response headers that allow the request

#### Scenario: Unapproved browser origin calls the API
- **WHEN** a browser request originates from an origin outside the allowlist
- **THEN** the API does not supply an allow-origin response header for that origin

### Requirement: User-state files remain private to the API process
The deployed service SHALL store user JSON files outside the web-served static content and SHALL not expose those files through the public reverse proxy.

#### Scenario: A caller requests a data file path
- **WHEN** an external caller requests a path resembling the user-data storage location
- **THEN** the public endpoint does not return a user JSON document

### Requirement: Deployment is repeatable and observable
The repository SHALL document how to install dependencies, configure the API origin, start the service, renew or verify HTTPS, and inspect service health and logs on the target server.

#### Scenario: Server process restarts
- **WHEN** the API process is restarted using the documented service operation
- **THEN** the health endpoint becomes available again and previously saved user state remains readable
