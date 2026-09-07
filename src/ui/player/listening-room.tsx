"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import type { createRoomScene, RoomState } from "./create-room-scene.ts";
import type { RoomWeather } from "../../core/vibe/build-listening-atmosphere.ts";
import { nextRoomWeather, ROOM_ACTION_LABELS, type RoomAction } from "../../core/vibe/room-interactions.ts";

export function ListeningRoom({ state, children, onTogglePlayback }: { state: RoomState; children: ReactNode; onTogglePlayback: () => void }) {
  const host = useRef<HTMLDivElement>(null);
  const scene = useRef<ReturnType<typeof createRoomScene> | null>(null);
  const latest = useRef(state);
  const [status, setStatus] = useState<"loading" | "ready" | "fallback">("loading");
  const [closeUp, setCloseUp] = useState(false);
  const [lampOn, setLampOn] = useState(true);
  const [fireOn, setFireOn] = useState(true);
  const [weather, setWeather] = useState<RoomWeather | null>(null);
  const [hovered, setHovered] = useState<RoomAction | null>(null);
  const action = useRef<(value: RoomAction) => void>(() => {});
  const activeState = useMemo(() => ({ ...state, lampOn, fireOn, room: weather === null ? state.room : {
    ...state.room, weather,
    name: weather === "rain" ? "雨夜窗边" : weather === "snow" ? "冬日炉边" : "晴窗暖灯",
    sky: weather === "rain" ? "#414957" : weather === "snow" ? "#a8a8a2" : "#bc7058",
  } }), [state, lampOn, fireOn, weather]);

  useEffect(() => {
    action.current = value => {
      if (value === "record") onTogglePlayback();
      if (value === "lamp") setLampOn(on => !on);
      if (value === "fire") setFireOn(on => !on);
      if (value === "window") setWeather(current => nextRoomWeather(current ?? state.room.weather));
    };
  }, [onTogglePlayback, state.room.weather]);

  useEffect(() => {
    latest.current = activeState;
    scene.current?.update(activeState);
  }, [activeState]);

  useEffect(() => { scene.current?.setVisible(!closeUp); }, [closeUp, status]);

  useEffect(() => {
    let active = true;
    import("./create-room-scene.ts").then(({ createRoomScene }) => {
      if (!active || !host.current) return;
      try {
        scene.current = createRoomScene(host.current, latest.current, () => {
          scene.current?.dispose();
          scene.current = null;
          if (active) setStatus("fallback");
        }, value => action.current(value), value => { if (active) setHovered(value); });
        setStatus("ready");
      } catch {
        setStatus("fallback");
      }
    }).catch(() => { if (active) setStatus("fallback"); });
    return () => { active = false; scene.current?.dispose(); scene.current = null; };
  }, []);

  const showRoom = status === "ready" && !closeUp;
  return (
    <div className="listening-room" data-room-status={status} data-room-scene={activeState.room.name}
      data-room-lamp={lampOn ? "on" : "off"} data-room-fire={fireOn ? "on" : "off"}
      data-room-weather={activeState.room.weather} data-room-view={showRoom ? "room" : "record"}>
      <div className="room-view-tools" aria-label="房间视图">
        <button type="button" aria-pressed={!closeUp} disabled={status !== "ready"} onClick={() => setCloseUp(false)}>房间全景</button>
        <button type="button" aria-pressed={closeUp} onClick={() => setCloseUp(true)}>唱机特写</button>
      </div>
      {showRoom && <div className="room-interactions" aria-label="房间物件互动">
        <button type="button" aria-label="唱机播放或暂停" aria-pressed={state.isPlaying} onClick={() => action.current("record")}>{state.isPlaying ? "Ⅱ 唱机" : "▷ 唱机"}</button>
        <button type="button" aria-label="落地灯开关" aria-pressed={lampOn} onClick={() => action.current("lamp")}>{lampOn ? "◉ 灯亮" : "○ 灯灭"}</button>
        <button type="button" aria-label="壁炉开关" aria-pressed={fireOn} onClick={() => action.current("fire")}>{fireOn ? "♨ 炉火" : "♨ 已熄"}</button>
        <button type="button" aria-label="切换窗外天气" onClick={() => action.current("window")}>{activeState.room.weather === "rain" ? "☂ 雨" : activeState.room.weather === "snow" ? "❄ 雪" : "☀ 晴"}</button>
        {weather !== null && <button type="button" className="room-follow-song" onClick={() => setWeather(null)}>跟随歌曲</button>}
      </div>}
      <div className="room-canvas" ref={host} role="img"
        aria-label={`${activeState.room.name}：可点击唱机、落地灯、壁炉和窗户；也可使用上方按钮操作`}
        style={{ visibility: showRoom ? "visible" : "hidden" }} />
      {!showRoom && <div className="record-closeup">{children}</div>}
      <div className="room-caption">
        <span className="room-caption-kicker">A ROOM OF YOUR OWN</span>
        <strong>{activeState.room.name}</strong>
        <p role="status">{status === "fallback" ? "当前设备使用唱机视图，音乐照常播放。" : status === "loading" ? "正在布置你的房间…" : showRoom ? hovered ? ROOM_ACTION_LABELS[hovered] : "点点唱机、灯、壁炉或窗户 · 拖动环顾房间" : "让唱针落下，把时间放慢。"}</p>
      </div>
      {showRoom && <div className="room-camera-controls" aria-label="房间视角">
        <button type="button" aria-label="从左侧看房间" onClick={() => scene.current?.view(-1)}>↶</button>
        <button type="button" aria-label="重置房间视角" onClick={() => scene.current?.view(0)}>复位</button>
        <button type="button" aria-label="从右侧看房间" onClick={() => scene.current?.view(1)}>↷</button>
      </div>}
    </div>
  );
}
