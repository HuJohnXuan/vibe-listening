# API

## 匿名用户状态 HTTP API

基础地址由前端 `NEXT_PUBLIC_API_BASE_URL` 配置。除健康检查外，所有接口都要求合法的
UUID 请求头 `X-Device-Id`，响应字段使用 camelCase。无注册、登录或 Cookie 会话。

| 方法 | 路径 | 请求体 | 行为 |
|---|---|---|---|
| GET | `/healthz` | 无 | 返回 `{"status":"ok"}` |
| GET | `/api/v1/user-state` | 无 | 获取或创建当前设备状态 |
| PUT | `/api/v1/favorites/{trackId}` | 无 | 添加收藏，重复添加不产生副本 |
| DELETE | `/api/v1/favorites/{trackId}` | 无 | 删除收藏 |
| PUT | `/api/v1/later` | `{"trackIds": [...]}` | 整体替换有序、去重后的 Later |
| POST | `/api/v1/playback-history` | `{"trackId":"..."}` | 以服务器 UTC 时间记录一次开始播放 |
| PUT | `/api/v1/preferences` | 偏好对象 | 整体替换最小偏好集 |

偏好对象：

```json
{"theme":"default","displayOptions":{},"musicTags":["neo-soul"]}
```

限制：请求体最多 65,536 字节；收藏、Later 和历史各最多 500 项；历史超过上限时仅保留
最新 500 条。偏好仅接受扁平的标量 `displayOptions`，并限制键、字符串和标签数量及长度。
每客户端 IP 默认每分钟最多 120 次用户 API 请求，超出返回 `429`。用户文件达到配置容量时
返回 `503`。无效请求返回 `422`；未预期错误返回 `500`，均不暴露
文件路径或内部异常。

## 前端内部 API

### buildDiscovery

位置：`src/services/discovery/build-discovery.ts`。输入当前歌曲 ID、本地曲库和人工推荐关系，
输出固定 3 首 `tonightsPicks` 与按 `same_artist`、`same_room`、`similar_voice`、
`production_texture` 分组的 `radar`。它排除当前歌曲与无效目标、去重人工关系，并用标签
重合度补足。未知当前歌曲会抛出带 `code`、`message`、`context` 的
`RecommendationError`。

### 播放器与 Later 纯函数

`src/core/player/player-state.ts` 提供上一首、下一首、按 ID 查找及 `m:ss` 时间格式化。
`src/core/later/later-queue.ts` 提供按序加入、查询、移除和从本地曲库解析 Later 曲目。
这些函数不访问页面、音频元素或网络，可独立测试。

### usePlayerView 与用户状态同步

`usePlayerView` 以音频控制器的 `audioTrack` 作为唯一当前歌曲源，并组合发现结果、Later、
收藏、历史和偏好。`UserStateSynchronizer` 先恢复远端状态，同时保留水合期间的本地操作；
所有写请求按顺序执行，防止快速点击产生旧响应覆盖新状态。同步器按资源跟踪未成功的操作；
其他资源写入成功不会隐藏仍未落盘的变更。没有 API 地址时仍保留会话内交互并显示同步错误。
服务端返回的规范状态只在没有更新版本或失败资源时接管本地状态。`useUserState` 只负责把该
服务适配到 React。
