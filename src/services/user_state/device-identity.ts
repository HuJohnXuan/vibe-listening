const DEVICE_ID_STORAGE_KEY = "rnb-fireplace-radar.device-id";
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export interface DeviceIdStorage {
  readonly getItem: (key: string) => string | null;
  readonly setItem: (key: string, value: string) => void;
}

export function getOrCreateDeviceId(
  storage: DeviceIdStorage,
  createUuid: () => string,
): string {
  const existingDeviceId = storage.getItem(DEVICE_ID_STORAGE_KEY);
  if (existingDeviceId && UUID_PATTERN.test(existingDeviceId)) return existingDeviceId;
  const deviceId = createUuid();
  storage.setItem(DEVICE_ID_STORAGE_KEY, deviceId);
  return deviceId;
}
