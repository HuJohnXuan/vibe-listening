## Context

见 `proposal.md` 与三份 P1 capability spec。P0 已将 IndexedDB 读写抽为可替换 repository，但当前生产页面仍全部使用本地实现。现有 `LocalAppState` 把收藏、歌单、场景、房间、环境声和播放快照放在一个版本化对象中；本地音乐的 SHA-256 ID 只对当前设备有效。

## Goals / Non-Goals

**Goals:**

- 用账号会话与行级访问控制建立可验证的数据归属。
- 将本地状态投影为不含文件内容与私人记忆的同步载荷，并在各设备安全恢复。
- 以版本号显式处理冲突，保留本地可用性作为故障降级。

**Non-Goals:**

- 不让浏览器直连 service-role 权限，不保存音频/封面 Blob，也不让远端状态自动删除本地曲库。
- 不做实时协同编辑、社交分享、管理后台或 P2 的上传/对象存储链路。
- 不将整个 IndexedDB 数据库或 React UI 瞬时状态序列化到服务端。

## Decisions

### 使用 Supabase Auth、Postgres 与 Next.js 同源 BFF

Supabase 承担认证、Postgres 和 RLS；Next.js Route Handlers 作为浏览器的 `/api/v1/me/*` 边界。浏览器只携带账号会话，BFF 由服务端验证用户后执行受限操作；仅账号删除等管理操作在服务器读取 service-role key。这样不会暴露高权限密钥，也避免客户端围绕 Supabase 表结构耦合。

直接由浏览器访问 Supabase 被拒绝，因为导出、删除和版本冲突协议仍需要一层产品 API。自建 Auth + PostgreSQL 被拒绝，因为首期会重复实现密码、会话撤销和邮件验证。

### 同步投影分为账号状态与设备续播状态

Postgres 使用 `profile_state(user_id, revision, payload, updated_at)` 保存收藏、歌单、场景、房间与环境声投影；`device_playback_state(user_id, device_id, revision, payload, updated_at)` 以用户与浏览器安装的随机 device ID 为联合唯一键保存播放续播状态。两个表均启用 RLS，策略只允许 `auth.uid() = user_id` 的行。

聚合 JSONB payload 保留现有结构、便于一次恢复；每设备播放单独保存避免一台设备的进度静默覆盖另一台。过早拆为完整关系模型会重复 P2/P3 所需的曲库与审计设计。

### 只同步显式白名单字段和曲目引用

客户端由 `LocalAppState` 构建 `SyncedProfileState`：收藏、歌单、场景、房间、环境声以及引用条目。内置演示曲目使用 `catalogTrackId`；本地音乐使用 `{ kind: "local", fingerprint }`。同步载荷不含 Blob、文件名/路径、封面、私人记忆或住客坐标。恢复时将引用与本地可用曲目匹配，缺失的本地引用以未导入状态呈现且不参与自动播放。

把整份 `LocalAppState` 原样上送会意外固定内部字段并增加隐私风险；以标题和艺人匹配会产生错误播放。

### 乐观本地更新与条件写入

Hook 继续即时更新本地状态。登录后异步拉取远端状态并记录 revision；写入携带该 revision，服务端仅在版本匹配时落库并递增 revision。冲突返回当前远端版本和可解释的同步状态，由用户选择刷新或重试，绝不静默覆盖。失败保持本地改动并允许手动重试。

最后写入获胜被拒绝，因为它会丢失跨设备歌单、场景和偏好修改；实时 CRDT 被拒绝，因为 P1 不需要协作。

### 数据导出与删除由受认证的服务端路由处理

导出端点生成当前账号的同步 JSON；删除端点要求明确确认字段，删除业务行并调用 Auth 管理 API 删除账号，随后清理浏览器会话。所有响应排除本地音乐和私人记忆。初期导出可同步返回；体积增长或合规要求变化后再改异步任务。

## Risks / Trade-offs

- [Supabase 项目、邮件供应商或 Vercel 环境变量未配置] → 功能保持本地模式，启动时提示同步未配置；上线前以实际域名完成回调与邮件测试。
- [两个设备并发改动] → revision 条件写入返回冲突，不自动丢弃任一侧状态。
- [用户误以为本地音乐已云端同步] → 本机缺文件时明确提示，并在登录/同步 UI 中说明只同步资料和偏好。
- [账号删除需要不可逆的 Auth 管理权限] → 服务端端点要求明确确认、记录最少审计事件，service-role key 仅存在部署环境。
- [JSONB 状态结构演进] → 同步 payload 自带 schemaVersion，并在 BFF 验证和迁移，不直接接受任意 JSON。

## Migration Plan

1. 创建 Supabase 项目、配置受支持的登录方式、回调域名和 Vercel 环境变量；执行 SQL migration 与 RLS 策略。
2. 加入会话客户端、BFF 路由、同步载荷校验与 remote repository，实现本地优先回退。
3. 将播放器的 P0 repository 组合为未登录本地模式与已登录同步模式，增加同步状态与账号控制 UI。
4. 用两个不同浏览器验证账号隔离、跨设备恢复、本地文件缺失、冲突、导出和删除；验证失败时关闭同步功能开关，浏览器本地状态保持可用。
5. 部署前运行迁移、测试、构建和生产域名的认证回调验证；回滚时停用功能开关或恢复前端，数据库保留以便数据恢复。
