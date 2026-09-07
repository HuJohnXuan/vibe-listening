import type { RoomWeather } from "./build-listening-atmosphere.ts";

export type RoomAction = "record" | "lamp" | "fire" | "window";
export const ROOM_ACTION_LABELS: Record<RoomAction, string> = {
  record: "唱机 · 播放 / 暂停",
  lamp: "落地灯 · 开 / 关",
  fire: "壁炉 · 点燃 / 熄灭",
  window: "窗户 · 切换晴 / 雨 / 雪",
};

export function nextRoomWeather(weather: RoomWeather): RoomWeather {
  return weather === "clear" ? "rain" : weather === "rain" ? "snow" : "clear";
}

export function isRoomClick(start: { x: number; y: number }, end: { x: number; y: number }): boolean {
  return Math.hypot(end.x - start.x, end.y - start.y) <= 6;
}
