import type { UserPreferences, UserState } from "../../types/user-state.ts";

type Fetcher = (input: string, init?: RequestInit) => Promise<Response>;

interface UserStateClientOptions {
  readonly apiBaseUrl: string;
  readonly deviceId: string;
  readonly fetcher: Fetcher;
}

export interface UserStateClient {
  readonly getState: () => Promise<UserState>;
  readonly addFavorite: (trackId: string) => Promise<UserState>;
  readonly removeFavorite: (trackId: string) => Promise<UserState>;
  readonly replaceLater: (trackIds: readonly string[]) => Promise<UserState>;
  readonly recordPlaybackStart: (trackId: string) => Promise<UserState>;
  readonly replacePreferences: (preferences: UserPreferences) => Promise<UserState>;
}

export function createUserStateClient(options: UserStateClientOptions): UserStateClient {
  const request = createRequest(options);
  return {
    getState: () => request("/api/v1/user-state"),
    addFavorite: (trackId) => request(`/api/v1/favorites/${encodeURIComponent(trackId)}`, "PUT"),
    removeFavorite: (trackId) => request(`/api/v1/favorites/${encodeURIComponent(trackId)}`, "DELETE"),
    replaceLater: (trackIds) => request("/api/v1/later", "PUT", { trackIds }),
    recordPlaybackStart: (trackId) => request("/api/v1/playback-history", "POST", { trackId }),
    replacePreferences: (preferences) => request("/api/v1/preferences", "PUT", preferences),
  };
}

export function createUnavailableUserStateClient(): UserStateClient {
  const reject = (): Promise<UserState> => Promise.reject(
    new Error("User state API base URL is not configured"),
  );
  return {
    getState: reject,
    addFavorite: reject,
    removeFavorite: reject,
    replaceLater: reject,
    recordPlaybackStart: reject,
    replacePreferences: reject,
  };
}

function createRequest(options: UserStateClientOptions) {
  return async (path: string, method = "GET", body?: unknown): Promise<UserState> => {
    const response = await options.fetcher(`${options.apiBaseUrl}${path}`, {
      method,
      headers: { "Content-Type": "application/json", "X-Device-Id": options.deviceId },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    if (!response.ok) throw new Error(`User state request failed: ${response.status}`);
    return response.json() as Promise<UserState>;
  };
}
