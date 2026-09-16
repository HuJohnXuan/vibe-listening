export const RESIDENT_SPOTS = {
  sofa: [-1.5, 0.6],
  frontLeft: [-1.5, 2.3],
  front: [0, 2.3],
  frontRight: [1.6, 2.3],
  right: [1.6, 0.1],
  records: [2.5, -0.65],
  backRight: [1.1, -0.65],
  backLeft: [-1.5, -0.65],
  window: [0, -2.05],
} as const;
export type ResidentSpot = keyof typeof RESIDENT_SPOTS;
export type ResidentCommand = "sofa" | "window" | "records" | "wave" | "sway" | "auto";
const edges: [ResidentSpot, ResidentSpot][] = [
  ["sofa", "frontLeft"], ["sofa", "backLeft"],
  ["frontLeft", "front"], ["front", "frontRight"],
  ["frontRight", "right"], ["right", "records"],
  ["right", "backRight"], ["records", "backRight"],
  ["backRight", "backLeft"], ["backRight", "window"], ["backLeft", "window"],
];

/** Fixed clear corridors around this room's furniture; not free-form navigation. */
export function residentPath(from: ResidentSpot, to: ResidentSpot): ResidentSpot[] {
  const queue: ResidentSpot[][] = [[from]];
  const visited = new Set<ResidentSpot>([from]);
  for (const path of queue) {
    const last = path[path.length - 1];
    if (last === to) return path.slice(1);
    for (const [a, b] of edges) {
      const next = a === last ? b : b === last ? a : null;
      if (next && !visited.has(next)) { visited.add(next); queue.push([...path, next]); }
    }
  }
  return [];
}

export function nearestResidentSpot(x: number, z: number): ResidentSpot | null {
  let nearest: ResidentSpot | null = null;
  let distance = 0.65;
  for (const [name, point] of Object.entries(RESIDENT_SPOTS)) {
    const d = Math.hypot(x - point[0], z - point[1]);
    if (d < distance) { distance = d; nearest = name as ResidentSpot; }
  }
  return nearest;
}
