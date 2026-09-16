import type { Track } from "../../types/track.ts";
export type RoomType = "cabin" | "rooftop" | "cloud";
export const ROOM_NAMES: Record<RoomType, string> = { cabin: "温暖客厅", rooftop: "城市天台", cloud: "云端小屋" };
export function suggestedRoom(track: Track): RoomType {
  if (track.preferredRoom) return track.preferredRoom;
  const tags = [...track.tags.moods, ...track.tags.genres].join(" ");
  if (/梦幻|空灵|Dream|Ambient|Ethereal/i.test(tags)) return "cloud";
  if (/活力|律动|Energetic|Dance|Funk|Electronic/i.test(tags)) return "rooftop";
  return "cabin";
}
