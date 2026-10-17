"use client";

import { useEffect, useRef, useState } from "react";
import type { AmbientMix } from "../../types/local-state.ts";
import type { RoomType } from "../../core/vibe/room-presets.ts";

export function useAmbientAudio(mix: AmbientMix, room: RoomType, onChange: (value: AmbientMix) => void) {
  const context = useRef<AudioContext | null>(null); const source = useRef<AudioBufferSourceNode | null>(null); const gain = useRef<GainNode | null>(null); const filter = useRef<BiquadFilterNode | null>(null);
  const [playing,setPlaying] = useState(false);
  const [status,setStatus] = useState("");
  function ensure() {
    if (context.current) return context.current;
    const audio = new AudioContext(); const buffer = audio.createBuffer(1,audio.sampleRate*12,audio.sampleRate); const data=buffer.getChannelData(0);
    let smooth=0; for(let i=0;i<data.length;i++){smooth=smooth*.985+(Math.random()*2-1)*.015;data[i]=smooth*.7;}
    const blend=Math.floor(audio.sampleRate*.25); for(let i=0;i<blend;i++){const at=data.length-blend+i;const ratio=i/blend;data[at]=data[at]*(1-ratio)+data[i]*ratio;}
    const nextSource=audio.createBufferSource(); nextSource.buffer=buffer; nextSource.loop=true;
    const nextFilter=audio.createBiquadFilter(); nextFilter.type="lowpass"; nextFilter.frequency.value=mix.followRoom?(room==="rooftop"?1150:room==="cloud"?780:560):700;
    const nextGain=audio.createGain(); nextGain.gain.value=0;
    nextSource.connect(nextFilter).connect(nextGain).connect(audio.destination); nextSource.start();
    context.current=audio; source.current=nextSource; filter.current=nextFilter; gain.current=nextGain; return audio;
  }
  function fade(target:number) { const audio=context.current,node=gain.current;if(!audio||!node)return;node.gain.cancelScheduledValues(audio.currentTime);node.gain.setValueAtTime(node.gain.value,audio.currentTime);node.gain.linearRampToValueAtTime(target,audio.currentTime+.45); }
  async function toggle() {
    if (playing && mix.enabled) {
      fade(0); setPlaying(false); onChange({ ...mix, enabled: false }); setStatus("环境声已关闭"); return;
    }
    try { const audio=ensure(); await audio.resume(); setPlaying(true); onChange({ ...mix, enabled: true }); fade(mix.volume*.22); setStatus("环境声已开启"); }
    catch { setStatus("当前浏览器无法播放环境声，音乐不受影响。"); }
  }
  useEffect(()=>{if(filter.current)filter.current.frequency.setTargetAtTime(mix.followRoom?(room==="rooftop"?1150:room==="cloud"?780:560):700,context.current?.currentTime??0,.2);},[room,mix.followRoom]);
  useEffect(()=>{fade(mix.enabled&&playing?mix.volume*.22:0);},[mix.enabled,mix.volume,playing]);
  useEffect(()=>()=>{source.current?.stop();void context.current?.close();},[]);
  return {
    active: playing && mix.enabled,
    status: status || (mix.enabled&&!playing ? "点击恢复环境声" : ""),
    toggle,
    pauseAll:()=>{fade(0);setPlaying(false);setStatus("已暂停音乐与环境声");onChange({ ...mix,enabled:false });},
  };
}
