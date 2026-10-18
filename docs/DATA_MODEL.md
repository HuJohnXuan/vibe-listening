# 数据模型

## 本地 Track

`Track` 定义于 `src/types/track.ts`，包含 `id`、`title`、`artist`、`album`、
`coverUrl`、`previewAudioUrl`、`previewDurationSeconds`、`lyricsExcerpt`、`tags` 和
`listeningNote`。`tags` 分为 `genres`、`moods`、`voices`、`production` 四组。
当前 10 首虚构曲目的文字、封面和试听资源都保存在本地，不进入后端用户文件。

## 本地 Recommendation 与 DiscoveryResult

`Recommendation` 保存 `sourceTrackId`、`targetTrackId`、`route` 和自然语言 `reason`。
`route` 为 `same_artist`、`same_room`、`similar_voice` 或 `production_texture`。
`DiscoveryResult` 包含排序后的 3 首 `tonightsPicks` 和按四条路线分组的 `radar`；每个结果
带完整 Track、理由及 `manual` 或 `tag_overlap` 来源。它们继续从本地 JSON 构建。

## 匿名用户状态

服务器只保存用户状态；曲库、推荐关系、封面和试听音频继续位于本地前端。

每个匿名设备对应 `RNB_DATA_DIRECTORY/<device-id>.json`。设备 ID 必须是 UUID，因此不能
构造目录穿越路径。文件包含 `favorites`、有序去重的 `later`、最新在前的
`playback_history`，以及由 `theme`、`display_options`、`music_tags` 构成的偏好。

收藏、Later 和历史最大 500 项，历史溢出时删除最旧项；曲目 ID 最大 128 字符。主题与偏好
标签最大 64 字符，最多 32 个标签；`display_options` 最多 32 个键，只允许布尔、数字、字符串
或 null，键最大 64 字符、字符串值最大 256 字符。写入先落临时文件、`fsync`，再原子替换
目标文件并同步父目录；失败时清理临时文件。同进程内按设备加锁，新设备创建另有全局容量锁。
