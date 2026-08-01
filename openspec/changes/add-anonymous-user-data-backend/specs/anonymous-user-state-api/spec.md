## Purpose

Provide durable, isolated user state for an anonymous browser device without requiring registration, passwords, or a database.

## ADDED Requirements

### Requirement: Anonymous device state is addressable
The API SHALL identify each user state request with a valid opaque device identifier supplied in the `X-Device-Id` request header. It SHALL reject a missing, blank, or malformed identifier without creating state for it.

#### Scenario: A new device reads its state
- **WHEN** a request with a valid previously unseen device identifier reads its user state
- **THEN** the API returns an empty valid state and persists an isolated state record for that identifier

#### Scenario: An invalid device identifier is supplied
- **WHEN** a request omits `X-Device-Id` or supplies an identifier that fails the API format rules
- **THEN** the API returns a client error and does not create or modify any user record

### Requirement: User state has a stable public contract
The API SHALL return one user-state document containing an ordered, de-duplicated favorites collection, an ordered Later queue, newest-first playback-history entries, and the preference fields `theme`, `displayOptions`, and `musicTags`.

#### Scenario: State is read after multiple updates
- **WHEN** a device reads its state after saving favorites, Later items, history, and preferences
- **THEN** the response contains all persisted fields with their defined ordering and JSON-compatible values

### Requirement: Favorites and Later can be updated independently
The API SHALL allow a device to add or remove a non-empty track identifier from favorites and SHALL allow it to replace its Later queue with an ordered, de-duplicated list of valid track identifiers. Updating either collection SHALL not alter the other user-state fields.

#### Scenario: A favorite is added
- **WHEN** a device adds a valid track identifier to favorites
- **THEN** a later state read includes that identifier exactly once in favorites

#### Scenario: Later is replaced
- **WHEN** a device saves a Later list containing duplicate valid track identifiers
- **THEN** a later state read returns the identifiers once each in their first-occurrence order

### Requirement: Playback starts are recorded
The API SHALL append one playback-history entry for every accepted playback-start request. Each entry SHALL contain the submitted track identifier and a server-generated UTC start timestamp.

#### Scenario: Playback starts twice for the same track
- **WHEN** a device reports two separate starts for the same valid track identifier
- **THEN** playback history contains two entries ordered with the newer start before the older start

### Requirement: Preferences can be replaced without changing collections
The API SHALL allow a device to save the minimal preference document containing `theme`, `displayOptions`, and `musicTags`. Updating preferences SHALL preserve favorites, Later, and playback history.

#### Scenario: Preferences are updated
- **WHEN** a device saves a valid preference document after it already has favorite tracks
- **THEN** the next state read contains the saved preferences and the unchanged favorites

### Requirement: Invalid state writes do not corrupt persisted data
The API SHALL validate request bodies before accepting a state mutation and SHALL return a client error for invalid field types, oversized collections, or invalid track identifiers. A rejected request SHALL leave the last valid user state readable.

#### Scenario: An invalid Later update is rejected
- **WHEN** a device submits a Later update with an invalid field type
- **THEN** the API returns a client error and the preceding Later queue remains unchanged
