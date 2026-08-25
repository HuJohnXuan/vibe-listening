import type { Track } from "../../types/track.ts";

export interface ListeningAtmosphere {
  readonly title: string;
  readonly background: string;
  readonly detail: string;
  readonly memoryEffect: string;
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
  const baseDetail = `${track.listeningNote} 适合把注意力留给${track.tags.moods[0] ?? "此刻"}。`;

  return {
    title: trimmedMemory ? "记忆加成后的氛围" : "这首歌的听歌氛围",
    background: getBackground(track),
    detail: baseDetail,
    memoryEffect: trimmedMemory
      ? `你的记忆「${trimmedMemory}」让这首歌多了一层只属于你的回声。`
      : "写下一段和它有关的记忆，让这首歌的氛围更贴近你。",
  };
}
