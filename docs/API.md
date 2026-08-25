# 内部 API

## buildListeningAtmosphere

位置：`src/core/vibe/build-listening-atmosphere.ts`

用途：根据当前歌曲的情绪、制作标签生成听歌背景；当用户提供一句记忆时，
将它以本地、即时的方式加入氛围文案。输入为 `Track` 与 `memory`，输出标题、
背景、歌曲细节和记忆加成说明。该函数是纯函数，不读取浏览器存储、不上传记忆。

## buildDiscovery

位置：`src/services/discovery/build-discovery.ts`

用途：为指定当前歌曲生成整理后的 Tonight’s Picks 和 Radar 数据。

```ts
buildDiscovery({
  currentTrackId,
  tracks,
  recommendations,
}): DiscoveryResult
```

输入：

- `currentTrackId`：当前歌曲 ID；
- `tracks`：完整本地曲目列表；
- `recommendations`：人工推荐关系列表。

输出：

- `tonightsPicks`：按人工关系优先、标签重合度回退排序后的前 3 首；
- `radar`：按 `same_artist`、`same_room`、`similar_voice` 和
  `production_texture` 分组的完整候选。

行为约束：

- 排除当前歌曲；
- 忽略不存在的推荐目标；
- 同一目标只保留第一次有效出现；
- 人工关系不足时使用标签重合度补充；
- 不依赖页面、数据库、网络或第三方 API。

错误：

当 `currentTrackId` 不存在时抛出 `RecommendationError`：

- `code`：`TRACK_NOT_FOUND`；
- `message`：用户可读的中文说明；
- `context.currentTrackId`：未找到的歌曲 ID。

## 播放器状态工具

位置：`src/core/player/player-state.ts`

- `getNextTrackIndex(currentIndex, trackCount)`：返回下一首索引，并在末尾回到首项；
- `getPreviousTrackIndex(currentIndex, trackCount)`：返回上一首索引，并在首项回到末尾；
- `getTrackIndexById(tracks, trackId)`：返回指定曲目的索引，不存在时返回 `-1`；
- `formatPlaybackTime(seconds)`：把秒数格式化为 `m:ss`，无效值返回 `0:00`。

这些函数不访问音频元素或页面状态，可独立测试。

## usePlayerView

位置：`src/ui/player/use-player-view.ts`

用途：把本地音频控制器的当前歌曲作为唯一状态源，并调用 `buildDiscovery`
生成与该歌曲一致的 Tonight’s Picks 和 Radar 数据。

输出包含音频元素引用、播放控制器、Later 状态、`displayTrack` 和
`discovery`。页面各区域只消费这份同步后的视图状态，不分别保存当前歌曲。

## Later 状态工具

位置：`src/core/later/later-queue.ts`

- `addTrackToLater(trackIds, trackId)`：按加入顺序保存曲目 ID，并忽略重复加入；
- `hasTrackInLater(trackIds, trackId)`：判断曲目是否已经加入；
- `removeTrackFromLater(trackIds, trackId)`：仅移除指定曲目 ID，并保留其余顺序；
- `resolveLaterTracks(trackIds, tracks)`：按队列顺序解析完整曲目，忽略已失效的 ID。

`useLaterQueue` 独立保存曲目 ID，并向页面提供解析后的 `tracks`、加入、移除和查询接口。
队列播放复用音频控制器，不在 Later 中建立第二份当前播放状态。
