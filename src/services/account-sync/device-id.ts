const key = "vibe-listening.device-id";
export function getDeviceId(storage: Storage): string { const current=storage.getItem(key); if (current && /^[0-9a-f-]{36}$/i.test(current)) return current; const next=crypto.randomUUID(); storage.setItem(key,next); return next; }
