# R&B Fireplace Radar

## 项目简介（一句话）

一个在本地浏览器运行、可接入 FastAPI 持久化匿名用户状态的沉浸式 R&B 播放器。
原前端开发计划第 1–12 步已完成，本 change 在其上增加用户数据后端。

原在线前端预览：[R&B Fireplace Radar Web MVP](https://rnb-fireplace-radar.huyixuan.chatgpt.site)。
本 change 的验收入口为本地 `http://localhost:3000`。

## 快速开始

要求 Node.js `>=22.13.0`；后端开发要求 Python `>=3.10`。复制 `.env.example` 为
`.env.local`，然后运行：

```bash
npm install
npm run dev -- --host 127.0.0.1 --port 3000
```

打开 `http://localhost:3000`。后端开发和服务器部署见 [docs/SETUP.md](docs/SETUP.md)。

## 功能列表（与当前代码保持同步）

- 本地 JSON 曲库、本地试听音频、Tonight's Picks、Radar 与 Later 播放流程；
- 左侧黑胶、当前歌曲、歌词片段、Listening Notes、四类标签与底部播放控制；
- 10 首虚构 R&B 曲目、标题匹配的本地封面与试听资源；
- 人工推荐优先、标签重合回退的 3 首 Picks 与四路线 Radar；
- 播放/暂停、上一首/下一首、进度拖动、推荐切歌及唱片/唱臂动效；
- 首次访问生成匿名设备 UUID，不需要注册或登录；
- 收藏、Later、每次开始播放的历史及最小偏好集由 FastAPI 保存；
- 每个匿名设备对应服务器上的一个 JSON 文件，写入采用原子替换；
- 配置 API 后，刷新页面会恢复收藏、Later 与偏好；同步失败时本地播放仍可使用；
- CORS 仅允许 `http://localhost:3000` 和 `http://localhost:3001`；
- AI 能力不在本次 V1 change 范围内。

## 配置说明

前端读取 `NEXT_PUBLIC_API_BASE_URL`。后端读取数据目录、CORS 和资源上限配置。
完整说明见 [docs/CONFIGURATION.md](docs/CONFIGURATION.md)。

## 项目结构

- `app/`：页面入口和全局样式；
- `src/`：前端 core、services、adapters、UI 与类型；
- `backend/app/`：FastAPI 路由、服务、模型和 JSON 仓库；
- `backend/tests/`、`tests/`：后端与前端测试；
- `deploy/`：Caddy、systemd 和服务器环境模板；
- `openspec/changes/add-anonymous-user-data-backend/`：本次 change 契约。

## 测试

```bash
npm test
npm run lint
cd backend
python -m pip install --no-deps -r requirements-dev.lock
python -m pytest -q
```

测试范围见 [docs/TESTING.md](docs/TESTING.md)，接口见 [docs/API.md](docs/API.md)，
数据结构见 [docs/DATA_MODEL.md](docs/DATA_MODEL.md)，后续 AI 边界见
[docs/FUTURE_API.md](docs/FUTURE_API.md)。

## 变更日志

见 [CHANGELOG.md](CHANGELOG.md)。
