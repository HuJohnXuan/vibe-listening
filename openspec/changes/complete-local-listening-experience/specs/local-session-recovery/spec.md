## Purpose

在不依赖账号或服务器的情况下可靠恢复用户的播放器组织与播放位置，同时避免刷新后突然发声或泄露临时私人文字。

## ADDED Requirements

### Requirement: Versioned local state
系统 SHALL 以版本化本地结构保存收藏、歌单、队列、随机顺序、播放模式、当前歌曲、进度、音量和明确列出的界面偏好。

#### Scenario: Existing library database upgrades
- **WHEN** 已有用户首次打开升级后的应用
- **THEN** 数据库升级保留全部已导入歌曲和音频 Blob，并补充新状态结构

### Requirement: Safe paused restore
系统 SHALL 在曲库加载完成后恢复关系和播放位置，并 MUST 保持暂停直至用户主动播放。

#### Scenario: Restore current track and progress
- **WHEN** 保存的歌曲仍存在且进度有效
- **THEN** 系统选中该曲、恢复进度和音量但不自动发声

#### Scenario: Saved track is missing
- **WHEN** 保存的当前歌曲或队列项已不存在
- **THEN** 系统过滤缺失关系并选择安全状态，不映射到其他歌曲

### Requirement: Write failure is visible
系统 MUST 在本地存储不可用、超额或写入失败时保留当前可用内存状态并提示失败，不能误报保存成功。

#### Scenario: IndexedDB write fails
- **WHEN** 持久化操作被浏览器拒绝
- **THEN** 用户看到可理解提示且当前播放不会被中断

### Requirement: Private memory remains ephemeral
系统 MUST NOT 将歌曲私人记忆写入 IndexedDB、localStorage、歌单或场景数据。

#### Scenario: Reload private memory
- **WHEN** 用户填写私人记忆后刷新页面
- **THEN** 该文字被清空且其他允许恢复的状态仍可恢复
