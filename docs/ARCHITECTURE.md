# 架构说明

## 当前边界

当前已完成本地曲库、推荐核心、歌曲氛围生成、主页数据接入、本地试听播放，
以及 Radar 和 Later 两个展开面板。产品名称为 Vibe Listening，核心体验为
“歌曲 × 记忆”。

```text
app 页面入口
  └─ src/ui 界面模块
       └─ src/services 用例协调
            ├─ src/core 纯业务逻辑
            └─ src/adapters 本地数据与浏览器能力适配

src/types 为各层提供共享契约
tests 验证页面与各层行为
```

依赖方向固定为 `UI → services → core`。本地曲库由 `adapters` 提供，
服务层将适配器数据传给核心，并向 UI 返回整理后的发现结果。核心业务逻辑
只依赖类型契约，不依赖页面、适配器或第三方库。

## 推荐数据流

```text
local_data 曲库与人工关系
  → buildDiscovery 服务
    → rankRecommendations 核心
      → 人工关系去重与排除当前歌曲
      → 标签重合度回退排序
    → 3 首 Tonight’s Picks
    → 四路线 Radar 分组
```

未知当前歌曲由服务层转换为带有 `code`、`message` 和 `context` 的
`RecommendationError`。核心排序保持纯函数，不记录日志或产生副作用。

## 历史页面与播放结构（V0.1）

页面入口直接显示播放器画布，由左侧黑胶播放区、右侧歌曲与发现承载区和
底部播放控制区组成。页面以曲库第一首歌曲作为默认展示内容，通过
`buildDiscovery` 取得 3 条 Tonight’s Picks。

```text
PlayerPage
  → usePlayerView：统一当前歌曲与发现结果
      → useLocalAudio：浏览器 Audio 元素、时间与播放状态
      → useLaterQueue：独立保存曲目 ID，并按队列顺序解析完整歌曲
      → buildDiscovery：当前歌曲对应的 Picks 与 Radar
      → buildListeningAtmosphere：歌曲标签与当前输入记忆生成专属氛围
  → player-state：索引循环与时间格式纯函数
  → record / tonearm：只消费 isPlaying 动效状态
```

音频控制器的 `audioTrack` 是唯一当前歌曲状态。黑胶封面、歌曲信息、歌词、
Listening Notes、Tonight’s Picks 和 Radar 数据均从该状态派生，不再分别
保存歌曲索引。

Tonight’s Picks 的播放操作调用音频控制器按曲目 ID 选择并开始播放；Later
操作只调用独立队列状态，不直接修改当前歌曲或推荐结果。

Radar 使用原生展开控件管理 UI 开合，不建立第二份推荐状态。面板直接消费
`discovery.radar` 的四个稳定分组，因此切歌后展开内容与当前歌曲同步更新。
Later 与 Radar 共用发现工具行和唱片内页式展开方式。Picks 与 Radar 只提交曲目
ID；Later 面板消费解析后的歌曲列表，播放继续调用统一音频控制器，移除只更新队列。
喜欢状态由底部独立控件按曲目 ID 保存在页面内存中，不反向影响播放器、推荐或 Later。
所有控件共用暖白默认态、克制位移反馈、香槟金聚焦环；玫红只用于进度和喜欢选中态。
常见笔记本宽度只收紧画布边距、双栏间距和面板内边距，不改变桌面双栏结构。
未来真实数据必须经 `adapters → services → UI` 边界接入，具体约束见 `FUTURE_API.md`。

## V0.2 本地状态与统一播放结构

V0.2 将 Later、当前歌曲和播放模式合并到一个版本化队列。`useLocalAudio` 是所有播放入口的控制器：直接播放、上一首/下一首、音频结束和音频错误都调用 `playback-queue.ts` 的纯状态转换。随机模式保存实际随机顺序，刷新后不会重新抽签。

```text
PlayerPage
  ├─ useMusicLibrary
  │    └─ IndexedDB songs（音频 Blob 与歌曲资料）
  ├─ useLocalAppState
  │    └─ IndexedDB app-state（队列、收藏、歌单、场景和偏好）
  ├─ usePlayerView
  │    └─ useLocalAudio → playback-queue（统一播放状态机）
  ├─ ListeningScenes（保存/恢复空间，播放关联歌单需单独操作）
  └─ useAmbientAudio（一个 Web Audio 程序化循环源）
```

IndexedDB schema 从 v1 升到 v2 时只新增 `app-state` store，不遍历或重写 `songs`，因此已有音频 Blob 保持原样。恢复顺序是：曲库和 app-state 都 ready → 过滤已不存在的稳定 ID → 设置音量和有效进度 → 保持暂停。

环境声把“保存的启用偏好”和“本页实际发声”分开。刷新后即使偏好为开启，也显示“恢复环境声”，只有用户手势才恢复 `AudioContext`。房间变化只调整同一个声源的低通滤波器，避免多轨叠加；音乐暂停不会关闭环境声，“全部暂停”同时关闭两者。

私人记忆继续由 `PlayerPage` 的 React state 保存，不进入 `LocalAppState`、场景、歌单或 IndexedDB。

## 3D 房间（2026-09-07）

`PlayerPage` 按 track ID 持有本次会话的记忆，并调用纯函数 `buildListeningAtmosphere` 生成文字和 `RoomMood`。`ListeningRoom` 动态加载 `create-room-scene.ts`，把场景状态传给 Three.js；几何体和灯光只初始化一次，切歌仅更新封面、天气与光线。渲染器不访问网络服务或用户存储。

右侧区域独立滚动，Radar/Later 在文档流内展开。播放、暂停和重播统一使用 Audio 元素；场景不会自行发声或改变播放顺序。细节与限制见 [3D_ROOM.md](3D_ROOM.md)。

## P1 账号同步

浏览器通过 Supabase 会话访问 Next.js BFF；BFF 使用用户 JWT 受 RLS 约束读写 profile 与 device playback JSONB。仅删除账号时服务器读取 service-role key。
