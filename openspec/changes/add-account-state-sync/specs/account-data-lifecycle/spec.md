## Purpose

让用户能够查看、导出和删除账号级同步状态，并使删除范围不误及设备上的私人音乐文件。

## ADDED Requirements

### Requirement: State export request
系统 SHALL 允许已登录用户请求导出其账号级同步状态，导出内容 MUST 排除本地音频 Blob、原始文件路径和私人记忆。

#### Scenario: User requests an export
- **WHEN** 已登录用户发起数据导出
- **THEN** 系统确认导出请求并仅提供该账号允许同步的数据

### Requirement: Account data deletion
系统 SHALL 允许已登录用户确认删除账号级同步数据，并在完成后终止会话；该操作 MUST NOT 删除当前设备上的本地音乐文件。

#### Scenario: User confirms account deletion
- **WHEN** 用户完成删除确认
- **THEN** 系统删除该账号的远端同步状态、退出账号，并保留当前浏览器中的本地曲库
