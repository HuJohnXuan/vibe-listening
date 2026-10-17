"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import type { createRoomScene, RoomState } from "./create-room-scene.ts";
import { nextRoomWeather, ROOM_ACTION_LABELS, type RoomAction } from "../../core/vibe/room-interactions.ts";

import { ROOM_NAMES, type RoomType } from "../../core/vibe/room-presets.ts";
import type { RoomPreferences } from "../../types/local-state.ts";

export function ListeningRoom({ state, children, onTogglePlayback, preferences, onPreferencesChange }: { state: RoomState; children: ReactNode; onTogglePlayback: () => void; preferences: RoomPreferences; onPreferencesChange: (value: RoomPreferences) => void }) {
  const host = useRef<HTMLDivElement>(null);
  const scene = useRef<ReturnType<typeof createRoomScene> | null>(null);
  const latest = useRef(state);
  const [status, setStatus] = useState<"loading" | "ready" | "fallback">("loading");
  const [closeUp, setCloseUp] = useState(false);
  const [lampOn, setLampOn] = useState(true);
  const [fireOn, setFireOn] = useState(true);
  const [hovered, setHovered] = useState<RoomAction | null>(null);
  const [residentStatus, setResidentStatus] = useState("住客正在安静听歌");
  const action = useRef<(value: RoomAction) => void>(() => {});
  const activeState = useMemo(() => {
    const room = {...state.room, weather: preferences.weather ?? state.room.weather};
    if (preferences.daylight === "morning") Object.assign(room, {sky:"#a8c8d1", light:"#fff0d1", intensity:1.8});
    if (preferences.daylight === "dusk") Object.assign(room, {sky:"#bc7058", light:"#ffd7a3", intensity:1.4});
    if (preferences.daylight === "night") Object.assign(room, {sky:"#222b3e", light:"#e6ba8c", intensity:0.85});
    return {...state, lampOn, fireOn, room, roomType:preferences.roomType === "auto" ? state.roomType ?? "cabin" : preferences.roomType};
  }, [state, lampOn, fireOn, preferences]);

  useEffect(() => {
    action.current = value => {
      if (value === "record") onTogglePlayback();
      if (value === "lamp") setLampOn(on => !on);
      if (value === "fire") setFireOn(on => !on);
      if (value === "window") onPreferencesChange({ ...preferences, weather: nextRoomWeather(preferences.weather ?? state.room.weather) });
    };
  }, [onTogglePlayback, onPreferencesChange, preferences, state.room.weather]);

  useEffect(() => {
    latest.current = activeState;
    scene.current?.update(activeState);
  }, [activeState]);

  useEffect(() => { scene.current?.setVisible(!closeUp); }, [closeUp, status]);
  useEffect(() => { scene.current?.showResident(preferences.residentVisible); }, [preferences.residentVisible, status]);
  useEffect(() => { if (preferences.residentAuto) scene.current?.residentCommand("auto"); }, [preferences.residentAuto, status]);

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
        <label>空间<select aria-label="选择房间" value={preferences.roomType} onChange={e => onPreferencesChange({ ...preferences, roomType: e.target.value as RoomType | "auto" })}><option value="auto">跟随歌曲</option>{Object.entries(ROOM_NAMES).map(([id,name]) => <option value={id} key={id}>{name}</option>)}</select></label>
        <label>光线<select aria-label="选择光线" value={preferences.daylight} onChange={e => onPreferencesChange({ ...preferences, daylight: e.target.value as RoomPreferences["daylight"] })}><option value="auto">跟随歌曲</option><option value="morning">清晨</option><option value="dusk">黄昏</option><option value="night">深夜</option></select></label>
      </div>}
      {showRoom && <div className="room-interactions" aria-label="房间物件互动">
        <button type="button" aria-label="唱机播放或暂停" aria-pressed={state.isPlaying} onClick={() => action.current("record")}>{state.isPlaying ? "Ⅱ 唱机" : "▷ 唱机"}</button>
        <button type="button" aria-label="落地灯开关" aria-pressed={lampOn} onClick={() => action.current("lamp")}>{lampOn ? "◉ 灯亮" : "○ 灯灭"}</button>
        {activeState.roomType === "cabin" && <button type="button" aria-label="壁炉开关" aria-pressed={fireOn} onClick={() => action.current("fire")}>{fireOn ? "♨ 炉火" : "♨ 已熄"}</button>}
        <button type="button" aria-label="切换窗外天气" onClick={() => action.current("window")}>{activeState.room.weather === "rain" ? "☂ 雨" : activeState.room.weather === "snow" ? "❄ 雪" : "☀ 晴"}</button>
        {preferences.weather !== null && <button type="button" className="room-follow-song" onClick={() => onPreferencesChange({ ...preferences, weather: null })}>跟随歌曲</button>}
      </div>}
      {showRoom && <div className="resident-panel" aria-label="听歌住客">
        <div className="resident-heading"><span>听歌住客</span><button type="button" aria-pressed={preferences.residentVisible} onClick={() => { scene.current?.showResident(!preferences.residentVisible); onPreferencesChange({ ...preferences, residentVisible: !preferences.residentVisible }); }}>{preferences.residentVisible ? "隐藏住客" : "显示住客"}</button></div>
        {preferences.residentVisible && <>
          <p role="status">{residentStatus}</p>
          <div className="resident-actions">
            <button type="button" onClick={() => { scene.current?.residentCommand("sofa"); onPreferencesChange({ ...preferences, residentAuto: false }); }}>坐下听歌</button>
            <button type="button" onClick={() => { scene.current?.residentCommand("window"); onPreferencesChange({ ...preferences, residentAuto: false }); }}>去窗边</button>
            <button type="button" onClick={() => { scene.current?.residentCommand("records"); onPreferencesChange({ ...preferences, residentAuto: false }); }}>挑唱片</button>
            <button type="button" onClick={() => scene.current?.residentCommand("wave")}>打个招呼</button>
            <button type="button" onClick={() => { scene.current?.residentCommand("sway"); onPreferencesChange({ ...preferences, residentAuto: false }); }}>到地毯前</button>
            <button type="button" onClick={() => { scene.current?.residentCommand("auto"); onPreferencesChange({ ...preferences, residentAuto: true }); }}>自由活动</button>
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
