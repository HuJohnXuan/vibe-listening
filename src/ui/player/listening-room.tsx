"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import type { createRoomScene, RoomState } from "./create-room-scene.ts";
import type { RoomWeather } from "../../core/vibe/build-listening-atmosphere.ts";
import { nextRoomWeather, ROOM_ACTION_LABELS, type RoomAction } from "../../core/vibe/room-interactions.ts";

import { ROOM_NAMES, type RoomType } from "../../core/vibe/room-presets.ts";

export function ListeningRoom({ state, children, onTogglePlayback }: { state: RoomState; children: ReactNode; onTogglePlayback: () => void }) {
  const host = useRef<HTMLDivElement>(null);
  const scene = useRef<ReturnType<typeof createRoomScene> | null>(null);
  const latest = useRef(state);
  const [status, setStatus] = useState<"loading" | "ready" | "fallback">("loading");
  const [closeUp, setCloseUp] = useState(false);
  const [lampOn, setLampOn] = useState(true);
  const [fireOn, setFireOn] = useState(true);
  const [weather, setWeather] = useState<RoomWeather | null>(null);
  const [roomChoice, setRoomChoice] = useState<RoomType | "auto">("auto");
  const [daylight, setDaylight] = useState("auto");
  const [hovered, setHovered] = useState<RoomAction | null>(null);
  const [residentStatus, setResidentStatus] = useState("住客正在安静听歌");
  const [residentVisible, setResidentVisible] = useState(true);
  const action = useRef<(value: RoomAction) => void>(() => {});
  const activeState = useMemo(() => {
    const room = {...state.room, weather: weather ?? state.room.weather};
    if (daylight === "morning") Object.assign(room, {sky:"#a8c8d1", light:"#fff0d1", intensity:1.8});
    if (daylight === "dusk") Object.assign(room, {sky:"#bc7058", light:"#ffd7a3", intensity:1.4});
    if (daylight === "night") Object.assign(room, {sky:"#222b3e", light:"#e6ba8c", intensity:0.85});
    return {...state, lampOn, fireOn, room, roomType:roomChoice === "auto" ? state.roomType ?? "cabin" : roomChoice};
  }, [state, lampOn, fireOn, weather, roomChoice, daylight]);

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
        }, value => action.current(value), value => { if (active) setHovered(value); }, value => { if (active) setResidentStatus(value); });
        setStatus("ready");
      } catch {
        setStatus("fallback");
      }
    }).catch(() => { if (active) setStatus("fallback"); });
    return () => { active = false; scene.current?.dispose(); scene.current = null; };
  }, []);

  const showRoom = status === "ready" && !closeUp;
  return (
    <div className="listening-room" data-room-type={activeState.roomType} data-room-status={status} data-room-scene={activeState.room.name}
      data-room-lamp={lampOn ? "on" : "off"} data-room-fire={fireOn ? "on" : "off"}
      data-room-weather={activeState.room.weather} data-room-view={showRoom ? "room" : "record"}>
      <div className="room-view-tools" aria-label="房间视图">
        <button type="button" aria-pressed={!closeUp} disabled={status !== "ready"} onClick={() => setCloseUp(false)}>房间全景</button>
        <button type="button" aria-pressed={closeUp} onClick={() => setCloseUp(true)}>唱机特写</button>
      </div>
      {showRoom && <div className="room-selectors">
        <label>空间<select aria-label="选择房间" value={roomChoice} onChange={e => setRoomChoice(e.target.value as RoomType | "auto")}><option value="auto">跟随歌曲</option>{Object.entries(ROOM_NAMES).map(([id,name]) => <option value={id} key={id}>{name}</option>)}</select></label>
        <label>光线<select aria-label="选择光线" value={daylight} onChange={e => setDaylight(e.target.value)}><option value="auto">跟随歌曲</option><option value="morning">清晨</option><option value="dusk">黄昏</option><option value="night">深夜</option></select></label>
      </div>}
      {showRoom && <div className="room-interactions" aria-label="房间物件互动">
        <button type="button" aria-label="唱机播放或暂停" aria-pressed={state.isPlaying} onClick={() => action.current("record")}>{state.isPlaying ? "Ⅱ 唱机" : "▷ 唱机"}</button>
        <button type="button" aria-label="落地灯开关" aria-pressed={lampOn} onClick={() => action.current("lamp")}>{lampOn ? "◉ 灯亮" : "○ 灯灭"}</button>
        {activeState.roomType === "cabin" && <button type="button" aria-label="壁炉开关" aria-pressed={fireOn} onClick={() => action.current("fire")}>{fireOn ? "♨ 炉火" : "♨ 已熄"}</button>}
        <button type="button" aria-label="切换窗外天气" onClick={() => action.current("window")}>{activeState.room.weather === "rain" ? "☂ 雨" : activeState.room.weather === "snow" ? "❄ 雪" : "☀ 晴"}</button>
        {weather !== null && <button type="button" className="room-follow-song" onClick={() => setWeather(null)}>跟随歌曲</button>}
      </div>}
      {showRoom && <div className="resident-panel" aria-label="听歌住客">
        <div className="resident-heading"><span>听歌住客</span><button type="button" aria-pressed={residentVisible} onClick={() => { scene.current?.showResident(!residentVisible); setResidentVisible(!residentVisible); }}>{residentVisible ? "隐藏住客" : "显示住客"}</button></div>
        {residentVisible && <>
          <p role="status">{residentStatus}</p>
          <div className="resident-actions">
            <button type="button" onClick={() => scene.current?.residentCommand("sofa")}>坐下听歌</button>
            <button type="button" onClick={() => scene.current?.residentCommand("window")}>去窗边</button>
            <button type="button" onClick={() => scene.current?.residentCommand("records")}>挑唱片</button>
            <button type="button" onClick={() => scene.current?.residentCommand("wave")}>打个招呼</button>
            <button type="button" onClick={() => scene.current?.residentCommand("sway")}>到地毯前</button>
            <button type="button" onClick={() => scene.current?.residentCommand("auto")}>自由活动</button>
            <button type="button" onClick={() => scene.current?.focusResident()}>近看住客</button>
          </div>
        </>}
      </div>}
      <div className="room-canvas" ref={host} role="img"
        aria-label={`${ROOM_NAMES[activeState.roomType]}：可点击唱机、落地灯、窗边、沙发、小人及空地；也可使用按钮操作`}
        style={{ visibility: showRoom ? "visible" : "hidden" }} />
      {!showRoom && <div className="record-closeup">{children}</div>}
      <div className="room-caption">
        <span className="room-caption-kicker">A ROOM OF YOUR OWN</span>
        <strong>{ROOM_NAMES[activeState.roomType]}</strong>
        <p role="status">{status === "fallback" ? "当前设备使用唱机视图，音乐照常播放。" : status === "loading" ? "正在布置你的房间…" : showRoom ? hovered ? ROOM_ACTION_LABELS[hovered] : "点击物件或住客互动 · 拖动环顾房间" : "让唱针落下，把时间放慢。"}</p>
      </div>
      {showRoom && <div className="room-camera-controls" aria-label="房间视角">
        <button type="button" aria-label="从左侧看房间" onClick={() => scene.current?.view(-1)}>↶</button>
        <button type="button" aria-label="重置房间视角" onClick={() => scene.current?.view(0)}>复位</button>
        <button type="button" aria-label="从右侧看房间" onClick={() => scene.current?.view(1)}>↷</button>
      </div>}
    </div>
  );
}
