# Vibe Listening

## 项目简介（一句话）

一个让歌曲与用户记忆共同生成专属听歌氛围的 PC 浏览器播放器 MVP。

在线预览：现有部署仍使用旧域名；重新部署后请将链接更新为 Vibe Listening 的正式地址。

## 快速开始

要求 Node.js `>=22.13.0`。

```bash
npm install
npm run dev
```

开发服务器启动后，打开终端显示的本地地址。

## 功能列表（与当前代码保持同步）

当前完成开发计划第 1–12 步：

- 全屏桌面播放器画布；
- 品牌更新为 Vibe Listening，以“歌曲 × 记忆”作为核心体验；
- 每首歌可生成基于歌曲标签的听歌背景，并允许用户写下一句记忆；
- 用户记忆会即时加成到当前歌曲的氛围说明，不上传、不持久化；
- 左侧黑胶播放区、右侧歌曲与发现区、底部控制区的布局边界；
- 已确认的颜色、字体、间距、圆角、边框和阴影设计令牌；
- 暖棕木纹、黑胶、奶油色与金属材质基线；
- 10 首虚构 R&B 演示曲目的本地数据契约；
- 10 首曲目均使用与歌名意象对应的纯图案封面，并包含 6 秒本地合成试听、
  原创歌词片段和 Listening Notes；
- 每首曲目的四类标签及四条人工推荐关系；
- 人工关系优先、标签重合度回退的纯推荐核心；
- 固定 3 首 Tonight’s Picks 和四路线 Radar 的整理后服务输出；
- 默认曲目的封面、歌曲信息、歌词片段和 Listening Notes 静态展示；
- 带封面、歌名、歌手和推荐理由的 3 条 Tonight’s Picks；
- 点击推荐歌曲会切换并开始播放，Picks 与 Radar 中的歌曲均可加入独立的前端 Later 队列；
- Radar 可展开和收起，并以唱片内页式面板展示四条发现路线、对应歌曲及理由；
- Later 可展开查看有序队列，并支持从队列播放或移除歌曲；
- 底部喜欢按钮提供玫红选中反馈，播放、队列和展开控件具备统一的悬停、按下与聚焦状态；
- 进度条拖动点默认隐藏，在悬停或键盘聚焦时显示；
- 本地试听音频的播放、暂停、上一首、下一首和进度拖动；
- 播放时间与进度同步，以及播放状态驱动的轻量唱片和唱臂动效；
- 切歌时同步更新封面、歌曲信息、歌词、Listening Notes 和发现结果；
- Listening Notes 使用低权重正文和紧凑的奶油色、香槟金标签展示四类听感；
- 已完成 `1440 × 900`、`1366 × 768` 和 `1024 × 768` 桌面/笔记本窗口验收；

## 配置说明

当前没有运行时环境变量或外部服务配置。站点的设计令牌集中定义在
`app/globals.css` 的 `:root` 中。

公开 Web 版本通过 OpenAI Sites 部署；站点绑定信息保存在
`.openai/hosting.json`，其中不包含密钥。详细说明见
[docs/CONFIGURATION.md](docs/CONFIGURATION.md)。

## 项目结构

- `app/`：页面入口、布局和全局视觉样式；
- `src/core/`：推荐与播放器状态的纯业务逻辑；
- `src/services/`：推荐用例协调及整理后输出；
- `src/adapters/`：本地数据与媒体资源适配边界；
- `src/ui/`：播放器页面和本地音频控制界面；
- `src/types/`：后续共享类型契约边界；
- `tests/`：页面结构和渲染验收测试；
- `docs/`：架构与测试说明。

当前曲库位于 `src/adapters/local_data/`，生成后的本地媒体资源位于
`public/assets/`。演示曲目、歌手、专辑和歌词均为本项目虚构内容。

## 测试

```bash
npm test
```

详细覆盖范围见 [docs/TESTING.md](docs/TESTING.md)。
数据字段与关系见 [docs/DATA_MODEL.md](docs/DATA_MODEL.md)。
内部调用方式见 [docs/API.md](docs/API.md)。
未来外部服务接入边界见 [docs/FUTURE_API.md](docs/FUTURE_API.md)。
最终任务与设计核对记录见 [docs/ACCEPTANCE.md](docs/ACCEPTANCE.md)。

## 变更日志

见 [CHANGELOG.md](CHANGELOG.md)。

## Vercel deployment

Use Node.js `22.x` in Vercel. Keep the Build Command set to `npm run build` and leave Output Directory empty. The project uses the native Next.js build command for Vercel compatibility.
