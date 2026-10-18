# 配置说明

| 配置项 | 使用方 | 默认值/生产值 | 说明 |
|---|---|---|---|
| `NEXT_PUBLIC_API_BASE_URL` | 本地前端 | `https://8.217.117.12.sslip.io` | 公开 API 地址 |
| `RNB_DATA_DIRECTORY` | FastAPI | `data/users` / `/var/lib/rnb-fireplace-radar/users` | 每设备 JSON 目录 |
| `RNB_ALLOWED_ORIGINS` | FastAPI | localhost 3000、3001 | 逗号分隔的精确 CORS 白名单 |
| `RNB_MAX_USER_FILES` | FastAPI | `10000` | 可创建的设备 JSON 文件总数上限 |
| `RNB_MAX_REQUEST_BODY_BYTES` | FastAPI | `65536` | 应用层请求体字节上限 |
| `RNB_MAX_REQUESTS_PER_MINUTE` | FastAPI | `120` | 每客户端 IP 的用户 API 每分钟请求上限 |

前端实际值放在未提交的 `.env.local`。服务器实际值放在
`/etc/rnb-fireplace-radar-api.env`。systemd 单元固定让 Uvicorn 监听 `127.0.0.1:8000`，公网
HTTPS 由 Caddy 提供；Caddy 同时限制请求体为 64 KB。

原公开 Web 版本的 OpenAI Sites 绑定仍保存在 `.openai/hosting.json`，其中不包含密钥；
本 change 不修改该站点，也不把本地验收前端发布到服务器。
