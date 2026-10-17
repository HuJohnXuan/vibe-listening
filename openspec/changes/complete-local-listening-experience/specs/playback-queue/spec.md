## Purpose

让用户以可预测的顺序连续播放自己的本地音乐，并在顺序、随机和循环模式下始终看到与实际播放一致的队列状态。

## ADDED Requirements

### Requirement: Unified playback queue
系统 SHALL 使用一份统一队列驱动当前曲、下一首、上一首、自动续播和队列展示，并支持加入下一首、加入队尾、重排和移除。

#### Scenario: Track ends in sequence mode
- **WHEN** 当前曲自然播放结束且队列中存在下一首可用曲目
- **THEN** 系统播放下一首并同步当前曲、进度和队列游标

#### Scenario: Queue edited during playback
- **WHEN** 用户重排或移除尚未播放的曲目
- **THEN** 实际续播顺序 SHALL 与界面显示顺序一致且当前声音不中断

### Requirement: Playback modes
系统 SHALL 提供顺序、随机、列表循环和单曲循环，并保存随机顺序而不是每次操作重新抽取。

#### Scenario: Restore shuffle order
- **WHEN** 用户在随机模式刷新页面并恢复会话
- **THEN** 系统恢复同一随机顺序和当前位置且保持暂停

#### Scenario: Queue reaches its end
- **WHEN** 当前曲是队列末尾
- **THEN** 系统按照所选模式停止、回到首曲或重复当前曲，不进入无限跳歌

### Requirement: Queue failures are bounded
系统 MUST 跳过已缺失或无法读取的曲目并给出可理解状态，但 MUST 防止无限重试和快速跳歌循环。

#### Scenario: Unavailable next track
- **WHEN** 下一首曲目已被移除或播放失败
- **THEN** 系统最多尝试队列中其余可用曲目一轮并报告失败结果
