## Purpose

用少量低存在感的环境声增强三种房间的沉浸感，并让用户独立、可控地决定是否播放及使用多大音量。

## ADDED Requirements

### Requirement: Ambient audio is opt-in
环境声 SHALL 首次默认关闭，只有用户主动开启后才播放；视觉天气变化不能自动授权声音播放。

#### Scenario: First visit with rainy room
- **WHEN** 用户首次进入显示雨天的房间
- **THEN** 环境声保持关闭直到用户主动开启

### Requirement: Independent ambient controls
系统 SHALL 提供环境声开关、独立音量和全部暂停；暂停音乐不能强制关闭已主动开启的环境声。

#### Scenario: Pause music only
- **WHEN** 音乐和环境声都在播放且用户暂停音乐
- **THEN** 音乐停止而环境声按照用户设置继续

#### Scenario: Pause all audio
- **WHEN** 用户触发全部暂停
- **THEN** 音乐和所有环境声停止且状态清楚显示

### Requirement: Smooth and isolated transitions
切换场景时环境声 SHALL 淡出和淡入，MUST NOT 意外叠加；环境声加载或播放失败 MUST NOT 中断歌曲。

#### Scenario: Switch ambient scene
- **WHEN** 用户从已开启雨声的客厅切到天台
- **THEN** 客厅声音淡出并在用户设置允许时由天台声音淡入，任一时刻没有意外多轨叠加

### Requirement: Licensed local assets
每个随应用分发的环境声素材 MUST 记录来源、许可和归属，并经过循环接缝与相对响度检查。

#### Scenario: Add an ambient asset
- **WHEN** 新环境声进入产品包
- **THEN** 仓库中存在可追溯许可记录和循环验收结果
