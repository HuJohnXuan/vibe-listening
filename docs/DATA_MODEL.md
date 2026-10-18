# 数据模型

## Track

`Track` 是 UI 后续消费的完整歌曲契约，定义于 `src/types/track.ts`。

| 字段 | 含义 |
| --- | --- |
| `id` | 曲目唯一标识 |
| `title` | 歌名 |
| `artist` | 歌手 |
| `album` | 专辑 |
| `coverUrl` | `public/assets/covers/` 下的本地封面 |
| `previewAudioUrl` | `public/assets/audio/` 下的本地试听 |
| `previewDurationSeconds` | 试听时长 |
| `lyricsExcerpt` | 原创歌词片段 |
| `tags` | 风格、情绪、声线和制作四类标签 |
| `listeningNote` | 一句自然语言听感说明 |

当前曲库包含 10 首虚构曲目。所有文字和媒体资源均随项目保存在本地，
不依赖数据库、真实音乐平台或外部 API。

## TrackTags

标签分为四个独立列表：

- `genres`：R&B 子风格；
- `moods`：情绪与空间氛围；
- `voices`：音域、音色和演唱触感；
- `production`：器乐、录音与制作纹理。

## Recommendation

`Recommendation` 定义于 `src/types/recommendation.ts`，保存人工配置关系：

| 字段 | 含义 |
| --- | --- |
| `sourceTrackId` | 当前曲目 ID |
| `targetTrackId` | 被推荐曲目 ID |
| `route` | 发现路线 |
| `reason` | 自然语言推荐理由 |

`route` 只能是 `same_artist`、`same_room`、`similar_voice` 或
`production_texture`。每首示例曲目都准备了四条关系，每条路线一条，
且目标曲目不重复、不指向自身。

第 2 步只建立数据和契约，不实现排序、回退或页面展示逻辑。

## DiscoveryResult

推荐服务返回 `DiscoveryResult`：

- `tonightsPicks`：排序后的前 3 首推荐；
- `radar.same_artist`：同歌手深入曲目；
- `radar.same_room`：氛围相近曲目；
- `radar.similar_voice`：声线相近曲目；
- `radar.production_texture`：制作质感相近曲目。

每个 `RecommendedTrack` 都包含完整 `Track`、发现路线、自然语言理由和
来源标记。来源标记区分人工配置 `manual` 与标签回退 `tag_overlap`。

## 统一播放队列（V0.2）

`PlaybackQueue` 保存 `trackIds`、`currentTrackId`、`mode` 和持久的 `shuffleOrder`。模式为 `sequence`、`shuffle`、`repeat-all` 或 `repeat-one`。关系始终使用稳定歌曲 ID；曲库恢复后过滤缺失 ID，不按数组位置替换成另一首歌。

`PlayerSnapshot` 另存队列、播放位置和音量。恢复时只定位有效进度并保持暂停。

## 本地应用状态（V0.2）

`LocalAppState` 使用 `schemaVersion: 1`，保存在 IndexedDB v2 的 `app-state` store：

- `player`：队列、当前曲目、播放模式、随机顺序、进度和音量；
- `favoriteTrackIds`：有序去重的稳定歌曲 ID；
- `playlists`：名称、有序歌曲 ID、创建/更新时间；
- `scenes`：名称、房间偏好、环境声、可选歌单 ID 和时间戳；
- `room`：房型、光线、天气、住客显示和自动活动偏好；
- `ambient`：用户启用偏好、独立音量和随房间变化开关。

歌曲音频 Blob 仍只位于 `songs`。场景不包含音频、原始路径、相机位置、住客坐标、瞬时姿势或私人记忆。

## 喜欢状态

喜欢状态保存为 `favoriteTrackIds`，刷新后恢复。收藏和取消收藏只改变 ID 列表，不删除歌曲音频或资料。

## P1 同步状态

profile_states 保存收藏、歌单、场景、房间和环境声；device_playback_states 按 user_id 和 device_id 保存续播。两表均保存 revision 与 JSONB payload，并受 RLS 保护。
