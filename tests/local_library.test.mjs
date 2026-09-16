import assert from 'node:assert/strict';
import test from 'node:test';
import 'fake-indexeddb/auto';
import { addSong, readSongs, saveSong, removeSong, asTrack, libraryError } from '../src/adapters/local_data/music-library.ts';
import { estimateAudioFeatures } from '../src/core/vibe/audio-features.ts';
import { suggestedRoom } from '../src/core/vibe/room-presets.ts';
import { rankRecommendations } from '../src/core/recommendations/rank-recommendations.ts';
import { createRoomVariants } from '../src/ui/player/create-room-variants.ts';
import { Scene } from 'three';
import { parseBlob } from 'music-metadata';

function fixture() {
  const rate=16000, seconds=12;
  const pcm=Buffer.alloc(rate*seconds*2);
  for(let i=0;i<rate*seconds;i++) pcm.writeInt16LE(Math.round(4000*Math.sin(i/rate*2*Math.PI*220)*Math.exp(-((i%(rate/2))/rate)*60)),i*2);
  const chunk=(name,data)=>{ const head=Buffer.alloc(8);head.write(name);head.writeUInt32LE(data.length,4);return Buffer.concat([head,data,...(data.length%2?[Buffer.alloc(1)]:[])]); };
  const fmt=Buffer.alloc(16);fmt.writeUInt16LE(1,0);fmt.writeUInt16LE(1,2);fmt.writeUInt32LE(rate,4);fmt.writeUInt32LE(rate*2,8);fmt.writeUInt16LE(2,12);fmt.writeUInt16LE(16,14);
  const info=Buffer.concat([Buffer.from('INFO'),chunk('INAM',Buffer.from('Local QA Pulse\0')),chunk('IART',Buffer.from('Vibe Test\0'))]);
  const body=Buffer.concat([Buffer.from('WAVE'),chunk('fmt ',fmt),chunk('LIST',info),chunk('data',pcm)]);
  const head=Buffer.alloc(8);head.write('RIFF');head.writeUInt32LE(body.length,4);
  return new Blob([head,body],{type:'audio/wav'});
}

test('local library persists actual audio across connections, rejects duplicates, edits and removes only its copy', async()=>{
  const file=fixture();
  const song={id:'qa-song',title:'Before',artist:'',album:'',duration:12,file,fileName:'qa.wav',genre:'',mood:'',addedAt:1};
  await addSong(song);
  await assert.rejects(addSong(song),{name:'ConstraintError'});
  assert.equal((await readSongs()).length,1);
  assert.deepEqual(await (await readSongs())[0].file.arrayBuffer(),await file.arrayBuffer());
  await saveSong({...song,title:'After',preferredRoom:'cloud'});
  assert.equal((await readSongs())[0].title,'After');
  await removeSong(song.id);
  assert.deepEqual(await readSongs(),[]);
  assert.ok(file.size>0);
  assert.match(libraryError(new DOMException('full','QuotaExceededError')),/空间不足/);
});
test('embedded WAV metadata and full duration parse without external services',async()=>{
  const metadata=await parseBlob(fixture(),{duration:true});
  assert.equal(metadata.common.title,'Local QA Pulse');assert.equal(metadata.common.artist,'Vibe Test');assert.equal(metadata.format.duration,12);
});
test('tempo estimate detects pulse train but reports silence as unknown',()=>{
  const samples=new Float32Array(16000*12);
  for(let i=0;i<samples.length;i++) samples[i]=(i%8000)<320?Math.sin(i/16000*2*Math.PI*200)*.5:0;
  assert.equal(estimateAudioFeatures(samples,16000).bpm,120);
  assert.equal(estimateAudioFeatures(new Float32Array(samples.length),16000).bpm,null);
});
test('manual room wins over tags and unknown artists do not create false recommendations',()=>{
  const song={id:'a',title:'a',artist:'',album:'',duration:12,file:fixture(),fileName:'a.wav',genre:'',mood:'梦幻',addedAt:1};
  const track=asTrack(song,'blob:a','cover');assert.equal(suggestedRoom(track),'cloud');
  assert.equal(suggestedRoom({...track,preferredRoom:'rooftop'}),'rooftop');
  const a={...track,tags:{genres:[],moods:[],voices:[],production:[]}};
  assert.deepEqual(rankRecommendations({currentTrack:a,tracks:[a,{...a,id:'b'}],recommendations:[]}),[]);
});
test('room shells are mutually exclusive and release their scene objects',()=>{
  const scene=new Scene(),rooms=createRoomVariants(scene);
  rooms.setRoom('rooftop');assert.deepEqual(scene.children.map(g=>g.visible),[true,false]);
  rooms.setRoom('cloud');assert.deepEqual(scene.children.map(g=>g.visible),[false,true]);
  rooms.setRoom('cabin');assert.deepEqual(scene.children.map(g=>g.visible),[false,false]);
  rooms.dispose();assert.equal(scene.children.length,0);
});
