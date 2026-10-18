import assert from "node:assert/strict";
import test from "node:test";
import { DEFAULT_LOCAL_APP_STATE } from "../src/types/local-state.ts";
import { restoreSyncedState, toSyncedDevicePlayback, toSyncedProfileState } from "../src/services/account-sync/sync-state.ts";
const local={...DEFAULT_LOCAL_APP_STATE,favoriteTrackIds:["catalog-1","local-abc"],playlists:[{id:"one",name:"mix",trackIds:["catalog-1","local-abc"],createdAt:1,updatedAt:1}]};
test("sync projection excludes local files and restores only matching fingerprints",()=>{const profile=toSyncedProfileState(local);const playback=toSyncedDevicePlayback(local);assert.equal(JSON.stringify(profile).includes("fileName"),false);assert.equal(JSON.stringify(profile).includes("Blob"),false);assert.deepEqual(profile.favoriteTrackIds,[{kind:"catalog",id:"catalog-1"},{kind:"local",fingerprint:"abc"}]);const result=restoreSyncedState(DEFAULT_LOCAL_APP_STATE,profile,playback,["catalog-1"]);assert.deepEqual(result.state.favoriteTrackIds,["catalog-1"]);assert.equal(result.missing,2);});
