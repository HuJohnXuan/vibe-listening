## Purpose

让用户在完全本地的曲库中快速找到、收藏和编排自己的音乐，同时保证整理操作不会意外删除已导入的音频。

## ADDED Requirements

### Requirement: Search and filter local library
系统 SHALL 支持按歌名或歌手搜索，按最近加入排序，并按已有情绪或房间标签筛选；搜索忽略首尾空格和英文大小写。

#### Scenario: No search results
- **WHEN** 当前搜索和筛选没有匹配曲目
- **THEN** 系统保留条件、显示空结果并提供清除条件入口

### Requirement: Persistent favorites
系统 SHALL 允许用户收藏或取消收藏曲目，并在浏览器重开后恢复收藏关系。

#### Scenario: Favorite survives reload
- **WHEN** 用户收藏本地曲目后重新打开页面
- **THEN** 该曲目仍显示为已收藏且音频只保留一份

### Requirement: Local playlists
系统 SHALL 支持新建、改名、删除歌单，以及增删和排序歌单曲目；关系 MUST 使用稳定歌曲 ID。

#### Scenario: Delete playlist
- **WHEN** 用户删除歌单
- **THEN** 系统仅删除歌单和关系，不删除任何音频或曲库条目

#### Scenario: Playlist track is missing
- **WHEN** 歌单引用的歌曲已从曲库移除
- **THEN** 系统安全过滤或标记缺失关系，不播放错误歌曲

### Requirement: Honest metadata
系统 MUST 只使用文件解析、用户编辑或既有可信数据中的标签，不能虚构情绪、曲风或相似歌曲。

#### Scenario: Track has no tags
- **WHEN** 导入歌曲没有可用标签
- **THEN** 系统允许手动整理并显示诚实的未分类状态
