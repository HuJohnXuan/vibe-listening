## Purpose

让同一账号在不同浏览器恢复允许同步的播放器状态，同时避免把本地音频或私人记忆误当作云端内容。

## ADDED Requirements

### Requirement: Account-scoped state synchronization
系统 SHALL 以当前认证账号为唯一归属同步收藏、歌单、场景、房间偏好、环境声偏好和每设备续播状态；客户端 MUST NOT 通过传入任意用户 ID 选择数据归属。

#### Scenario: A signed-in user opens another browser
- **WHEN** 同一账号在另一浏览器完成登录
- **THEN** 系统恢复该账号已同步的收藏、歌单、场景和偏好

#### Scenario: A different user signs in on the same browser
- **WHEN** 另一账号完成登录
- **THEN** 系统不得读取或修改前一账号的远端状态

### Requirement: Device-local music references
系统 MUST 将本地音乐作为本机文件引用处理，且 MUST NOT 上传音频 Blob、原始路径、封面 Blob 或通过歌曲标题、歌手名猜测替代另一设备的文件。

#### Scenario: A synced playlist refers to a missing local song
- **WHEN** 歌单或续播状态包含当前设备不存在的本地曲目引用
- **THEN** 系统显示“此设备尚未导入”，且不得播放名称相似的其他曲目

### Requirement: Conflict and failure visibility
系统 SHALL 显示最近同步结果；网络失败或版本冲突 MUST 保留本机可用状态并以可理解方式提示用户，而不是静默覆盖数据。

#### Scenario: A sync write fails
- **WHEN** 用户修改同步状态后远端写入失败
- **THEN** 本机变更仍可在当前设备使用，且界面显示可重试的同步失败状态
