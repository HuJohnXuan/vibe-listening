## Purpose

让用户把房间、声音和住客偏好保存成可再次进入的本地听歌场景，同时把空间恢复与音乐切换保持为清楚的两个动作。

## ADDED Requirements

### Requirement: Manage local scenes
系统 SHALL 支持命名、保存、恢复、更新和删除场景；场景包含房间、光线、天气、可选歌单关联、环境声组合、住客可见性与活动偏好及 schema 版本。

#### Scenario: Restore scene after reload
- **WHEN** 用户重开页面并恢复一个已保存场景
- **THEN** 房间、光线、天气、环境声设置和住客偏好恢复为保存值

### Requirement: Scene restore does not interrupt music
系统 MUST 在恢复场景时保留当前歌曲和播放状态；关联歌单只能通过单独明确动作开始播放。

#### Scenario: Restore scene while music is playing
- **WHEN** 用户在歌曲播放中恢复另一个场景
- **THEN** 空间配置变化而当前歌曲继续播放

### Requirement: Scene data is bounded and private
场景 MUST NOT 包含私人记忆、原始文件路径、音频 Blob、角色瞬时坐标或进行中的姿势。

#### Scenario: Inspect saved scene
- **WHEN** 系统持久化一个场景
- **THEN** 保存内容只包含声明的稳定设置和稳定 ID 关系

### Requirement: Missing playlist is isolated
系统 SHALL 在场景关联歌单已删除时仍恢复其余场景设置并提示关联不可用。

#### Scenario: Restore scene with deleted playlist
- **WHEN** 场景引用的歌单不再存在
- **THEN** 房间和偏好成功恢复且用户看到歌单缺失提示
