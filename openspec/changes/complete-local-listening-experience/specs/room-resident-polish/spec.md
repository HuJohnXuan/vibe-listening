## Purpose

让三种房间和同一位住客在视觉、动作和控制上保持成熟、安静、连贯，并在不同性能与无障碍偏好下可靠工作。

## ADDED Requirements

### Requirement: Resident commands take priority
用户指令 SHALL 优先于自动活动；移动中接受新目标时，住客 MUST 通过安全路径改道而不穿过家具。

#### Scenario: Change target while walking
- **WHEN** 住客移动中收到新的用户目标
- **THEN** 住客完成安全路段并改道，新指令不会被自动活动覆盖

### Requirement: Resident actions transition naturally
住客 SHALL 在转身、行走、坐下、起身、挥手和回到合理状态之间平滑衔接，并限制相同自动动作的重复频率。

#### Scenario: Wave while seated
- **WHEN** 用户让坐着的住客打招呼
- **THEN** 住客在安全姿势完成挥手并回到此前合理状态，不出现穿模或突然位移

### Requirement: Room-specific visual identity
三种房间 SHALL 保持各自材质、光线和穿搭；天台远景 MUST 具有高低、疏密、轮廓和远近层次，光线选项须与天空和楼体明暗一致。

#### Scenario: Switch rooftop daylight
- **WHEN** 用户在天台选择清晨、黄昏或深夜
- **THEN** 天空、远景楼体、局部灯光和人物可读性形成一致的时间表现

### Requirement: Mature resident appearance
住客 MUST 保留短棕发、棕色耳机、仅眼睛的面部以及三房间对应穿搭，不能添加鼻子、嘴巴或明显幼态比例。

#### Scenario: Inspect resident close-up
- **WHEN** 用户近看任一房间住客
- **THEN** 头部、耳机与身体不被错误裁切且造型符合已确认外形

### Requirement: Accessibility and performance protections
系统 SHALL 保留关键控件键盘操作、焦点和开关状态，尊重减少动态效果，页面隐藏时跳过绘制，并在 WebGL 不可用时提供不影响音乐的回退。

#### Scenario: Reduced motion enabled
- **WHEN** 操作系统偏好减少动态效果
- **THEN** 住客移动和场景动效显著减少且所有功能仍可操作

#### Scenario: WebGL initialization fails
- **WHEN** 三维场景无法创建
- **THEN** 用户可使用唱机视图、曲库和播放控制继续听歌
