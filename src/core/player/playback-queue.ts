import { LOCAL_STATE_VERSION, type PlaybackMode, type QueueState } from "../../types/local-state.ts";

function unique(ids: readonly string[]): string[] {
  return [...new Set(ids.filter(Boolean))];
}

export function shuffleTracks(ids: readonly string[], random: () => number = Math.random): string[] {
  const result = [...ids];
  for (let index = result.length - 1; index > 0; index--) {
    const target = Math.floor(random() * (index + 1));
    [result[index], result[target]] = [result[target], result[index]];
  }
  return result;
}

export function createQueue(ids: readonly string[], currentId?: string): QueueState {
  const trackIds = unique(ids);
  const currentIndex = currentId ? trackIds.indexOf(currentId) : trackIds.length ? 0 : -1;
  return { schemaVersion: LOCAL_STATE_VERSION, trackIds, currentIndex: Math.max(currentIndex, trackIds.length ? 0 : -1), mode: "sequence", shuffleOrder: [] };
}

export function queueOrder(queue: QueueState): readonly string[] {
  return queue.mode === "shuffle" ? queue.shuffleOrder : queue.trackIds;
}

export function currentQueueId(queue: QueueState): string | null {
  return queueOrder(queue)[queue.currentIndex] ?? null;
}

export function sanitizeQueue(queue: QueueState, availableIds: readonly string[]): QueueState {
  const available = new Set(availableIds);
  const currentId = currentQueueId(queue);
  const trackIds = unique(queue.trackIds).filter(id => available.has(id));
  const shuffleOrder = unique(queue.shuffleOrder).filter(id => available.has(id) && trackIds.includes(id));
  const order = queue.mode === "shuffle" ? [...shuffleOrder, ...trackIds.filter(id => !shuffleOrder.includes(id))] : trackIds;
  return { ...queue, trackIds, shuffleOrder: queue.mode === "shuffle" ? order : [], currentIndex: currentId && order.includes(currentId) ? order.indexOf(currentId) : order.length ? 0 : -1 };
}

export function playNow(queue: QueueState, trackId: string): QueueState {
  const trackIds = queue.trackIds.includes(trackId) ? [...queue.trackIds] : [...queue.trackIds, trackId];
  const shuffleOrder = queue.mode === "shuffle"
    ? queue.shuffleOrder.includes(trackId) ? [...queue.shuffleOrder] : [...queue.shuffleOrder, trackId]
    : [];
  const order = queue.mode === "shuffle" ? shuffleOrder : trackIds;
  return { ...queue, trackIds, shuffleOrder, currentIndex: order.indexOf(trackId) };
}

export function appendTrack(queue: QueueState, trackId: string): QueueState {
  if (queue.trackIds.includes(trackId)) return queue;
  return { ...queue, trackIds: [...queue.trackIds, trackId], shuffleOrder: queue.mode === "shuffle" ? [...queue.shuffleOrder, trackId] : [] };
}

export function playNext(queue: QueueState, trackId: string): QueueState {
  const currentId = currentQueueId(queue);
  const trackIds = queue.trackIds.filter(id => id !== trackId);
  const baseIndex = Math.max(0, trackIds.indexOf(currentId ?? ""));
  trackIds.splice(baseIndex + 1, 0, trackId);
  if (queue.mode !== "shuffle") return { ...queue, trackIds, currentIndex: trackIds.indexOf(currentId ?? trackId) };
  const order = queue.shuffleOrder.filter(id => id !== trackId);
  order.splice(Math.max(0, order.indexOf(currentId ?? "")) + 1, 0, trackId);
  return { ...queue, trackIds, shuffleOrder: order, currentIndex: order.indexOf(currentId ?? trackId) };
}

export function removeTrack(queue: QueueState, trackId: string): QueueState {
  const currentId = currentQueueId(queue);
  const oldOrder = [...queueOrder(queue)];
  const removedIndex = oldOrder.indexOf(trackId);
  const trackIds = queue.trackIds.filter(id => id !== trackId);
  const shuffleOrder = queue.shuffleOrder.filter(id => id !== trackId);
  const order = queue.mode === "shuffle" ? shuffleOrder : trackIds;
  if (currentId !== trackId) return { ...queue, trackIds, shuffleOrder, currentIndex: currentId ? order.indexOf(currentId) : order.length ? 0 : -1 };
  return { ...queue, trackIds, shuffleOrder, currentIndex: order.length ? Math.min(Math.max(removedIndex, 0), order.length - 1) : -1 };
}

export function moveTrack(queue: QueueState, from: number, to: number): QueueState {
  const order = [...queueOrder(queue)];
  if (from < 0 || from >= order.length || to < 0 || to >= order.length || from === to) return queue;
  const currentId = currentQueueId(queue);
  const [id] = order.splice(from, 1); order.splice(to, 0, id);
  return queue.mode === "shuffle"
    ? { ...queue, shuffleOrder: order, currentIndex: currentId ? order.indexOf(currentId) : -1 }
    : { ...queue, trackIds: order, currentIndex: currentId ? order.indexOf(currentId) : -1 };
}

export function setPlaybackMode(queue: QueueState, mode: PlaybackMode, random: () => number = Math.random): QueueState {
  const currentId = currentQueueId(queue);
  if (mode === "shuffle") {
    const rest = shuffleTracks(queue.trackIds.filter(id => id !== currentId), random);
    const shuffleOrder = currentId ? [currentId, ...rest] : rest;
    return { ...queue, mode, shuffleOrder, currentIndex: shuffleOrder.length ? 0 : -1 };
  }
  return { ...queue, mode, shuffleOrder: [], currentIndex: currentId ? queue.trackIds.indexOf(currentId) : queue.trackIds.length ? 0 : -1 };
}

export function stepQueue(queue: QueueState, direction: 1 | -1, ended = false): { queue: QueueState; replay: boolean; stopped: boolean } {
  const order = queueOrder(queue);
  if (!order.length) return { queue, replay: false, stopped: true };
  if (ended && queue.mode === "repeat-one") return { queue, replay: true, stopped: false };
  const target = queue.currentIndex + direction;
  if (target >= 0 && target < order.length) return { queue: { ...queue, currentIndex: target }, replay: false, stopped: false };
  if (queue.mode === "repeat-all") return { queue: { ...queue, currentIndex: direction > 0 ? 0 : order.length - 1 }, replay: false, stopped: false };
  return { queue, replay: false, stopped: true };
}
