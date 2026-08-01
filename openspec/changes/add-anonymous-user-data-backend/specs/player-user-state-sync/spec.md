## Purpose

Connect the existing local-catalog player to the anonymous user-state API so its personal state survives page refreshes without changing catalog or recommendation behavior.

## ADDED Requirements

### Requirement: The player establishes a stable anonymous device identity
The web player SHALL create an opaque device identifier on its first browser visit and SHALL reuse the same identifier for subsequent visits in that browser profile.

#### Scenario: First visit establishes identity
- **WHEN** the player loads in a browser profile with no stored device identifier
- **THEN** it creates one identifier, stores it locally, and uses it for user-state API requests

#### Scenario: Returning visit reuses identity
- **WHEN** the player reloads in a browser profile with an existing device identifier
- **THEN** it uses that same identifier to retrieve the prior user state

### Requirement: Persisted state is restored on player load
The player SHALL load the anonymous device's user state and use it to initialize favorites, the Later queue, playback history, and the preconfigured preference values. It SHALL continue to use the existing local track catalog and preview assets.

#### Scenario: Later survives refresh
- **WHEN** a device adds tracks to Later and then refreshes the player
- **THEN** the restored Later panel displays the persisted tracks in their saved order when those track identifiers exist in the local catalog

### Requirement: Player actions synchronize personal state
The player SHALL synchronize favorite changes, Later changes, playback starts, and preference updates with the API for its device identifier. It SHALL not send the full local catalog, recommendation catalog, audio files, or credentials to the API.

#### Scenario: Starting a preview creates history
- **WHEN** a user starts a local preview through the player
- **THEN** the player reports that track start once to the user-state API

#### Scenario: Favorite change persists
- **WHEN** a user toggles a track to favorite
- **THEN** the player updates its UI and the favorite is present after a successful page refresh

### Requirement: Temporary API failures preserve player usability
The player SHALL retain the current local interaction behavior when a user-state request fails and SHALL show a user-readable synchronization error. It SHALL not prevent local preview playback, navigation, recommendations, or Later interactions solely because the API is unavailable.

#### Scenario: API is temporarily unavailable
- **WHEN** a user-state request fails because the API cannot be reached
- **THEN** the player remains interactive and presents a synchronization error without exposing transport details
