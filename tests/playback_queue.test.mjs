import assert from 'node:assert/strict';
import test from 'node:test';
import { appendTrack, createQueue, currentQueueId, moveTrack, playNext, playNow, queueOrder, removeTrack, sanitizeQueue, setPlaybackMode, stepQueue } from '../src/core/player/playback-queue.ts';

test('queue edits preserve current track and expose the actual order',()=>{
  let queue=createQueue(['a','b','c'],'a');
  queue=playNext(queue,'c');
  assert.deepEqual(queue.trackIds,['a','c','b']);
  queue=appendTrack(queue,'d');
  queue=moveTrack(queue,3,1);
  assert.deepEqual(queueOrder(queue),['a','d','c','b']);
  assert.equal(currentQueueId(queue),'a');
  queue=removeTrack(queue,'a');
  assert.equal(currentQueueId(queue),'d');
  queue=playNow(queue,'c');
  assert.equal(currentQueueId(queue),'c');
});

test('queue modes have bounded, predictable end behavior and persistent shuffle order',()=>{
  const base=createQueue(['a','b','c'],'a');
  const shuffled=setPlaybackMode(base,'shuffle',()=>.99);
  assert.deepEqual(shuffled.shuffleOrder,['a','b','c']);
  assert.deepEqual(queueOrder(sanitizeQueue(shuffled,['a','b','c'])),['a','b','c']);
  let cursor={...shuffled,currentIndex:2};
  assert.equal(stepQueue(cursor,1,true).stopped,true);
  cursor=setPlaybackMode(base,'repeat-all');
  cursor={...cursor,currentIndex:2};
  assert.equal(currentQueueId(stepQueue(cursor,1,true).queue),'a');
  cursor=setPlaybackMode(base,'repeat-one');
  assert.equal(stepQueue(cursor,1,true).replay,true);
  assert.equal(stepQueue(base,-1).stopped,true);
});

test('sanitizing missing tracks never maps to an unrelated id by index',()=>{
  const queue={...createQueue(['a','b','c'],'b'),mode:'shuffle',shuffleOrder:['c','b','a'],currentIndex:1};
  const cleaned=sanitizeQueue(queue,['a','c']);
  assert.deepEqual(cleaned.trackIds,['a','c']);
  assert.equal(currentQueueId(cleaned),'c');
});
