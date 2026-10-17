import type { LocalAppState } from "../src/types/local-state.ts";
import type { LocalAppStateRepository, MusicLibraryRepository } from "../src/adapters/local_data/music-library.ts";

export const fakeMusicLibraryRepository: MusicLibraryRepository = {
  async readSongs() { return []; },
  async addSong() {},
  async saveSong() {},
  async removeSong() {},
};

export const fakeLocalAppStateRepository: LocalAppStateRepository = {
  async readAppState(): Promise<LocalAppState> { throw new Error("Test double supplies state when rendered."); },
  async saveAppState() {},
};
