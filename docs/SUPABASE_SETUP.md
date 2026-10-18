# Supabase 配置

P1 通过 Supabase Auth、Postgres 和 Next.js API 路由同步轻量账号状态。创建项目后，把 URL、anon key 与仅服务端的 service-role key 配到 Vercel；浏览器只读取前两项。执行 migration SQL，在 Auth 中启用 Email OTP，并把本地地址与生产域名加入 Redirect URLs。

同步内容：收藏、歌单、场景、房间/环境声偏好及每设备续播。音频 Blob、封面 Blob、文件路径和私人记忆不上传。本地曲目用 SHA-256 指纹引用；另一设备未导入时会被跳过。
