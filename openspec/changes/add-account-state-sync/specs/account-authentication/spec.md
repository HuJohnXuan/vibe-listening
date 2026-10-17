## Purpose

让用户以可恢复的账号会话访问自己的同步状态，同时不影响未登录时的本地听歌体验。

## ADDED Requirements

### Requirement: Account session controls
系统 SHALL 在播放器中提供登录、已登录身份和退出登录操作，并仅在会话有效时读取或写入账号数据。

#### Scenario: User signs in
- **WHEN** 用户完成受支持的登录流程
- **THEN** 系统显示已登录状态并开始恢复该账号允许同步的数据

#### Scenario: User signs out
- **WHEN** 已登录用户选择退出
- **THEN** 系统结束远端会话并继续保留当前设备的本地曲库与本地状态

### Requirement: Local-first unauthenticated fallback
系统 MUST 允许未登录、会话过期或认证服务不可用的用户继续导入、播放和保存本地数据。

#### Scenario: User is offline without a session
- **WHEN** 用户未登录且无法访问认证服务
- **THEN** 播放器保持可用，并明确说明账号同步当前不可用
