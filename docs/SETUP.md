# 安装与部署

## 本地前端

要求 Node.js 22.13 或更高版本。在项目根目录创建未提交的 `.env.local`：

```dotenv
NEXT_PUBLIC_API_BASE_URL=https://8.217.117.12.sslip.io
```

```powershell
npm ci
npm run dev -- --host 127.0.0.1 --port 3000
```

浏览器打开 `http://localhost:3000`。曲库与试听文件仍从本地
`src/adapters/local_data/` 和 `public/assets/` 读取。

## 后端开发

要求 Python 3.10 或更高版本。Windows PowerShell：

```powershell
Set-Location backend
py -m venv .venv
.\.venv\Scripts\python.exe -m pip install --no-deps -r requirements-dev.lock
.\.venv\Scripts\python.exe -m pip install --no-deps --no-build-isolation -e .
.\.venv\Scripts\python.exe -m pytest -q
```

## 服务器发布

只上传 `backend/` 与 `deploy/`，不上传前端。以下命令在服务器执行；把
`RELEASE_ID` 替换为本次版本号。

```bash
export RELEASE_ID=20260802-anonymous-user-data
id -u rnb-api >/dev/null 2>&1 || \
  sudo useradd --system --home /nonexistent --shell /usr/sbin/nologin rnb-api
sudo install -d -o root -g root /opt/rnb-fireplace-radar/releases/$RELEASE_ID
sudo cp -R backend deploy /opt/rnb-fireplace-radar/releases/$RELEASE_ID/
sudo python3 -m venv /opt/rnb-fireplace-radar/releases/$RELEASE_ID/venv
sudo /opt/rnb-fireplace-radar/releases/$RELEASE_ID/venv/bin/pip install --no-deps \
  -r /opt/rnb-fireplace-radar/releases/$RELEASE_ID/backend/requirements.lock
sudo /opt/rnb-fireplace-radar/releases/$RELEASE_ID/venv/bin/pip install \
  --no-deps --no-build-isolation /opt/rnb-fireplace-radar/releases/$RELEASE_ID/backend
sudo ln -sfn /opt/rnb-fireplace-radar/releases/$RELEASE_ID \
  /opt/rnb-fireplace-radar/current
```

首次部署时安装运行配置：

```bash
sudo install -d -o rnb-api -g rnb-api -m 0700 /var/lib/rnb-fireplace-radar/users
sudo install -o root -g root -m 0644 deploy/rnb-fireplace-radar-api.service \
  /etc/systemd/system/rnb-fireplace-radar-api.service
sudo install -o root -g root -m 0644 deploy/Caddyfile /etc/caddy/Caddyfile
sudo install -o root -g rnb-api -m 0640 deploy/rnb-fireplace-radar-api.env.example \
  /etc/rnb-fireplace-radar-api.env
sudo systemctl daemon-reload
sudo caddy validate --config /etc/caddy/Caddyfile
sudo systemctl enable --now rnb-fireplace-radar-api caddy
sudo systemctl restart rnb-fireplace-radar-api caddy
```

## 上线检查

```bash
ss -lntp | grep -E ':80|:443|:8000'
systemctl is-active rnb-fireplace-radar-api caddy
curl --fail https://8.217.117.12.sslip.io/healthz
curl -i -X OPTIONS https://8.217.117.12.sslip.io/api/v1/user-state \
  -H 'Origin: http://localhost:3000' \
  -H 'Access-Control-Request-Method: GET' \
  -H 'Access-Control-Request-Headers: X-Device-Id'
journalctl -u rnb-fireplace-radar-api -n 100 --no-pager
```

确认端口 8000 只监听 `127.0.0.1`，80/443 由 Caddy 监听；用户 JSON 文件权限为 0600。

## 回滚

保留上一版 release 与用户数据备份。将 `/opt/rnb-fireplace-radar/current` 符号链接指回上一版，
执行 `systemctl restart rnb-fireplace-radar-api`，再运行健康检查。
不要删除仍可能用于恢复的 release 或 JSON 备份。
