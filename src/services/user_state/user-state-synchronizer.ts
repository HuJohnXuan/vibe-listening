import type { UserStateClient } from "../../adapters/user_state_api/user-state-client.ts";
import type { UserPreferences, UserState } from "../../types/user-state.ts";

const SYNC_ERROR = "Personal data could not be synchronized. Local playback is still available.";
const EMPTY_STATE: UserState = {
  favorites: [],
  later: [],
  playbackHistory: [],
  preferences: { theme: "default", displayOptions: {}, musicTags: [] },
};

type StateTransition = (state: UserState) => UserState;
type SnapshotListener = (snapshot: UserStateSyncSnapshot) => void;

export interface UserStateSyncSnapshot {
  readonly state: UserState;
  readonly syncError: string;
}

export class UserStateSynchronizer {
  private readonly client: UserStateClient;
  private snapshot: UserStateSyncSnapshot = { state: EMPTY_STATE, syncError: "" };
  private readonly listeners = new Set<SnapshotListener>();
  private pendingTransitions: StateTransition[] = [];
  private hydrationPromise: Promise<void> | null = null;
  private writeQueue: Promise<void> = Promise.resolve();
  private readonly dirtyResources = new Set<string>();
  private readonly resourceRevisions = new Map<string, number>();
  private revision = 0;
  private hydrated = false;

  constructor(client: UserStateClient) {
    this.client = client;
  }

  getSnapshot(): UserStateSyncSnapshot {
    return this.snapshot;
  }

  subscribe(listener: SnapshotListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  hydrate(): Promise<void> {
    this.hydrationPromise ??= this.loadRemoteState();
    return this.hydrationPromise;
  }

  toggleFavorite(trackId: string): void {
    const adding = !this.snapshot.state.favorites.includes(trackId);
    const transition = adding
      ? (state: UserState) => addFavorite(state, trackId)
      : (state: UserState) => removeFavorite(state, trackId);
    const revision = this.applyTransition(transition);
    this.enqueueWrite(`favorite:${trackId}`, revision, () => adding
      ? this.client.addFavorite(trackId)
      : this.client.removeFavorite(trackId));
  }

  addLaterTrack(trackId: string): void {
    const revision = this.applyTransition((state) => addLaterTrack(state, trackId));
    this.enqueueWrite("later", revision, () => this.client.replaceLater(this.snapshot.state.later));
  }

  removeLaterTrack(trackId: string): void {
    const revision = this.applyTransition((state) => removeLaterTrack(state, trackId));
    this.enqueueWrite("later", revision, () => this.client.replaceLater(this.snapshot.state.later));
  }

  recordPlaybackStart(trackId: string): void {
    const revision = this.applyTransition((state) => ({
      ...state,
      playbackHistory: [
        { trackId, startedAt: new Date().toISOString() },
        ...state.playbackHistory,
      ].slice(0, 500),
    }));
    this.enqueueWrite(`history:${revision}`, revision, () => this.client.recordPlaybackStart(trackId));
  }

  replacePreferences(preferences: UserPreferences): void {
    const revision = this.applyTransition((state) => ({ ...state, preferences }));
    this.enqueueWrite("preferences", revision, () => this.client.replacePreferences(preferences));
  }

  async whenIdle(): Promise<void> {
    await this.hydrate();
    await this.writeQueue;
  }

  private async loadRemoteState(): Promise<void> {
    try {
      const remoteState = await this.client.getState();
      const state = this.pendingTransitions.reduce(
        (currentState, transition) => transition(currentState),
        remoteState,
      );
      this.setSnapshot(state, "");
    } catch {
      this.setSnapshot(this.snapshot.state, SYNC_ERROR);
    } finally {
      this.hydrated = true;
      this.pendingTransitions = [];
    }
  }

  private applyTransition(transition: StateTransition): number {
    if (!this.hydrated) this.pendingTransitions.push(transition);
    this.revision += 1;
    this.setSnapshot(transition(this.snapshot.state), this.snapshot.syncError);
    return this.revision;
  }

  private enqueueWrite(
    resource: string,
    revision: number,
    write: () => Promise<UserState>,
  ): void {
    this.dirtyResources.add(resource);
    this.resourceRevisions.set(resource, revision);
    this.writeQueue = this.writeQueue.then(async () => {
      await this.hydrate();
      const canonicalState = await write();
      this.handleWriteSuccess(resource, revision, canonicalState);
    }).catch(() => {
      this.setSnapshot(this.snapshot.state, SYNC_ERROR);
    });
  }

  private handleWriteSuccess(
    resource: string,
    revision: number,
    canonicalState: UserState,
  ): void {
    if (this.resourceRevisions.get(resource) === revision) {
      this.dirtyResources.delete(resource);
    }
    const fullySynchronized = this.dirtyResources.size === 0;
    const state = fullySynchronized && this.revision === revision
      ? canonicalState
      : this.snapshot.state;
    this.setSnapshot(state, fullySynchronized ? "" : this.snapshot.syncError);
  }

  private setSnapshot(state: UserState, syncError: string): void {
    this.snapshot = { state, syncError };
    this.listeners.forEach((listener) => listener(this.snapshot));
  }
}

function addFavorite(state: UserState, trackId: string): UserState {
  if (state.favorites.includes(trackId)) return state;
  return { ...state, favorites: [...state.favorites, trackId] };
}

function removeFavorite(state: UserState, trackId: string): UserState {
  return { ...state, favorites: state.favorites.filter((item) => item !== trackId) };
}

function addLaterTrack(state: UserState, trackId: string): UserState {
  if (state.later.includes(trackId)) return state;
  return { ...state, later: [...state.later, trackId] };
}

function removeLaterTrack(state: UserState, trackId: string): UserState {
  return { ...state, later: state.later.filter((item) => item !== trackId) };
}
