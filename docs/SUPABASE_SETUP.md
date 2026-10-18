# Supabase 配置

P1 用 Supabase Auth、Postgres 和 Next.js API 同步轻量账号状态。下面的链接已绑定当前项目 `udseozzxukjgolbvczrz`。

## 一次性云端设置

1. 打开 [SQL Editor](https://supabase.com/dashboard/project/udseozzxukjgolbvczrz/sql/new)，把 [`202610170001_account_state_sync.sql`](../supabase/migrations/202610170001_account_state_sync.sql) 全部粘贴并点击 **Run**。成功后会出现 `profile_states` 与 `device_playback_states` 两张表。
2. 打开 [Authentication Providers](https://supabase.com/dashboard/project/udseozzxukjgolbvczrz/auth/providers)，启用 **Email**。保留 Magic Link/OTP 登录方式即可，无需设置密码登录。
3. 打开 [URL Configuration](https://supabase.com/dashboard/project/udseozzxukjgolbvczrz/auth/url-configuration)：
   - Site URL：`https://vibe-listening-preview.vercel.app`
   - Redirect URLs：`http://localhost:3000`、`https://vibe-listening-preview.vercel.app`
4. 打开 [API Keys](https://supabase.com/dashboard/project/udseozzxukjgolbvczrz/settings/api-keys)，获取 Project URL、**Publishable key** 与 **Secret key**。新版 Supabase 用这两个名称；项目中的变量名为兼容现有代码仍保留 `ANON_KEY` 与 `SERVICE_ROLE_KEY`。
5. 到 Vercel 项目的 **Settings → Environment Variables**，为 Production、Preview 和 Development 设置以下变量后重新部署：

   ```text
   NEXT_PUBLIC_SUPABASE_URL=<Project URL>
   NEXT_PUBLIC_SUPABASE_ANON_KEY=<Publishable key>
   SUPABASE_SERVICE_ROLE_KEY=<Secret key>
   ```

`SUPABASE_SERVICE_ROLE_KEY` 只允许保存为 Vercel 服务端环境变量，不能放进前端代码、Git 或聊天记录。本地调试只需要前两项；账号删除功能在本地需要额外配置 Secret key。

## 数据边界

同步收藏、歌单、场景、房间/环境声偏好及每设备续播。音频 Blob、封面 Blob、文件路径和私人记忆不上传。本地曲目用 SHA-256 指纹引用；另一设备未导入时会被跳过。
