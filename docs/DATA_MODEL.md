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

## Later 状态

Later 以有序、去重的曲目 ID 列表保存歌曲，状态独立于当前歌曲和推荐结果。
第 10 步按 ID 从本地曲库解析队列显示数据；无效 ID 会被忽略，播放复用统一播放器，
移除只改变 Later 队列，不改变当前歌曲或推荐结果。

## 喜欢状态

第 11 步使用页面内存中的曲目 ID 集合记录喜欢状态。它只服务于前端演示，刷新后重置，
不写入 Later、曲库或外部服务；选中状态使用玫红反馈。
