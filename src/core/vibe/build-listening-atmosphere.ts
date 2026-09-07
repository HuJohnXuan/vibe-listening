import type { Track } from "../../types/track.ts";

export interface ListeningAtmosphere {
  readonly title: string;
  readonly background: string;
  readonly detail: string;
  readonly memoryEffect: string;
  readonly room: RoomMood;
}

export type RoomWeather = "clear" | "rain" | "snow";
export interface RoomMood {
  readonly name: string;
  readonly sky: string;
  readonly light: string;
  readonly intensity: number;
  readonly weather: RoomWeather;
}

const ROOMS: Record<string, RoomMood> = {
  amber: { name: "壁炉余温", sky: "#453345", light: "#ffc27a", intensity: 1.2, weather: "clear" },
  sunset: { name: "落日客厅", sky: "#bc7058", light: "#ffd7a3", intensity: 1.8, weather: "clear" },
  night: { name: "深夜唱片室", sky: "#222b3e", light: "#e6ba8c", intensity: 0.85, weather: "clear" },
  rain: { name: "雨夜窗边", sky: "#414957", light: "#e9ba85", intensity: 0.95, weather: "rain" },
  snow: { name: "冬日炉边", sky: "#a8a8a2", light: "#ffbf78", intensity: 1.3, weather: "snow" },
};

function getRoom(track: Track, memory: string): RoomMood {
  // Local scene cues only: arbitrary text is never sent to a service.
  if (/雪|冬|snow|winter/i.test(memory)) return ROOMS.snow;
  if (/雨|rain/i.test(memory)) return ROOMS.rain;
  if (/夕阳|黄昏|落日|傍晚|sunset|dusk/i.test(memory)) return ROOMS.sunset;
  if (/深夜|凌晨|末班|midnight|night/i.test(memory)) return ROOMS.night;
  const moods = track.tags.moods.join(" ");
  if (/Warm|Golden|Patient|Tender/i.test(moods)) return ROOMS.sunset;
  if (/Reflective|Nocturnal|After Hours|Melanchol/i.test(moods)) return ROOMS.night;
  return ROOMS.amber;
}

interface BuildListeningAtmosphereOptions {
  readonly track: Track;
  readonly memory: string;
}

function getBackground(track: Track): string {
  const mood = track.tags.moods[0] ?? "当下";
  const production = track.tags.production[0] ?? "旋律";
  return `${mood}的${production}听感`;
}

export function buildListeningAtmosphere({
  track,
  memory,
}: BuildListeningAtmosphereOptions): ListeningAtmosphere {
  const trimmedMemory = memory.trim();
  const room = getRoom(track, trimmedMemory);

  return {
    title: trimmedMemory ? "记忆加成后的氛围" : "这首歌的听歌氛围",
    background: getBackground(track),
    detail: `${room.name} · ${room.weather === "rain" ? "窗外落雨，房间留一盏暖灯。" : room.weather === "snow" ? "窗外飘雪，炉火照亮木地板。" : "把灯光放低，让音乐填满房间。"}`,
    memoryEffect: trimmedMemory
      ? `你的记忆「${trimmedMemory}」让这首歌多了一层只属于你的回声。`
      : "写下一段和它有关的记忆，让这首歌的氛围更贴近你。",
    room,
  };
}
