# 架构说明

## 当前边界与依赖方向

前端仍包含本地曲库、推荐核心、主页、试听播放、Radar 和 Later。依赖方向固定为
`UI → services/core → adapters`；共享契约位于 `src/types`。推荐核心保持纯函数，曲库、封面、
试听音频及人工推荐关系不上传服务器。

```text
本地浏览器 http://localhost:3000
  ├─ 本地曲库与试听资源
  └─ user_state_api adapter
       │ HTTPS + X-Device-Id
       ▼
Caddy https://8.217.117.12.sslip.io
       │ 127.0.0.1:8000
       ▼
FastAPI routes → UserStateService → JsonUserStateRepository
                                      │
                                      ▼
                         /var/lib/rnb-fireplace-radar/users/*.json
```

前端依赖方向是 `UI → services/core → adapters`。后端依赖方向是
`API routes → service → repository`。Caddy 只负责 TLS 和反向代理；Uvicorn 不直接暴露公网。
AI/LangChain-Anthropic 不在 V1 中，后续通过独立 OpenSpec change 接入。

## 推荐与播放器数据流

```text
local_data → buildDiscovery → rankRecommendations → Tonight's Picks / Radar

PlayerPage → usePlayerView
             ├─ useLocalAudio（唯一当前歌曲、播放状态与历史事件）
             ├─ UserStateSynchronizer（恢复、乐观状态、串行写入）
             └─ buildDiscovery（当前歌曲对应的 Picks 与 Radar）
```

推荐排序先使用人工关系，再用标签重合度回退。播放器封面、歌曲信息、歌词、Listening Notes、
Picks 和 Radar 全部从同一 `audioTrack` 派生。Later 只保存曲目 ID，并按本地曲库解析；无效 ID
会被忽略。Radar 与 Later 的展开状态不建立第二份当前歌曲状态。

## 后端分层与可靠性

后端依赖方向固定为 `API routes → UserStateService → JsonUserStateRepository`。模型在进入
服务层前验证；服务层实现去重与历史保留规则；仓库按设备加锁、临时文件 `fsync`、原子替换，
并对新设备创建使用全局容量锁。固定数量的锁分片避免设备 ID 造成内存增长；请求频率、
请求体、偏好结构和用户文件总数都有明确上限。
