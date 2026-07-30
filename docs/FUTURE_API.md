# 未来真实音乐 API 接入边界

## 当前状态

真实平台登录、在线曲库、数据库和外部 API 不在当前 MVP 范围内。现阶段只使用
`src/adapters/local_data/` 的本地虚构数据与 `public/assets/` 的本地媒体。

## 保持不变的契约

- UI 继续消费完整的 `Track`、`Recommendation` 和 `DiscoveryResult`；
- 推荐核心继续接收整理后的歌曲和关系，不直接访问网络；
- 播放器继续接收可由浏览器播放的 `previewAudioUrl`；
- Later 继续只保存曲目 ID，不保存外部响应对象。

## 未来接入位置

1. 在 `src/adapters/` 增加外部音乐服务 adapter，把平台响应转换为项目的 `Track`
   与 `Recommendation` 契约。
2. 在 `src/services/` 增加用例协调，负责调用 adapter、处理加载或业务错误，再把
   整理后的结果交给 UI。
3. 保持 `src/core/` 为纯逻辑层，不直接 import SDK、HTTP 客户端或平台类型。
4. 密钥和登录信息只能由服务端环境变量管理，不写入浏览器代码、本地曲库或日志。

当前文件只标记依赖边界，不包含真实端点、认证流程或第三方 SDK 方案。
