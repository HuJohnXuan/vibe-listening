## Context

见 `proposal.md`。目前同一 `music-library.ts` 同时承载 IndexedDB 事务细节、`SavedSong` 曲库读写和 `LocalAppState` 读写；两个 UI Hook 直接导入其中的函数。项目架构规定真实数据经 adapters 与 services 进入 UI，但本地状态尚未形成可替换的访问边界。

## Goals / Non-Goals

**Goals:**

- 让两个 Hook 只依赖曲库或应用状态的最小读写契约。
- 保持当前 IndexedDB 实现为默认行为，沿用已有错误转换和数据迁移逻辑。
- 允许测试向 Hook 传入内存或 fake repository，而不访问浏览器存储。

**Non-Goals:**

- 不建立通用 repository 框架、依赖注入容器或服务端客户端。
- 不迁移 IndexedDB 数据、拆分数据库、改变 schema 版本或改变 `SavedSong`/`LocalAppState` 模型。
- 不将音频 Blob、私人记忆或用户状态发送到网络。

## Decisions

### 在现有本地适配器旁导出两个最小仓库对象

从现有函数导出 `localLibraryRepository` 与 `localProfileRepository`，并导出它们的契约类型。曲库契约仅包含列出、新增、更新和删除歌曲；状态契约仅包含读取和保存完整 `LocalAppState`。原有 IndexedDB 操作与 `libraryError` 保持原处，避免因文件迁移产生无意义的风险。

替代方案是新建 services 层和多个 interface 文件。当前仅有一种运行时实现，额外文件和适配器没有用户价值；等 P1 出现远端实现时再按实际 API 扩展。

### Hook 以默认参数接收仓库

`useMusicLibrary(demos, repository = localLibraryRepository)` 与 `useLocalAppState(repository = localProfileRepository)` 使用传入对象完成所有持久化操作。生产页面不传参数，行为不变；测试可传入 fake repository 验证 Hook 不再硬编码 IndexedDB。

替代方案是 React Context 或全局服务定位器。两者都会扩大页面装配范围，且目前没有运行时切换数据源的需求。

### 保持错误文案与对象 URL 生命周期在 Hook 中

仓库只报告存储结果；本地错误归一化仍复用 `libraryError`，对象 URL、导入解析、UI busy/message 状态仍属于曲库 Hook。这样不把浏览器 UI 资源或音乐元数据解析误放进未来的远端仓库。

替代方案是把导入和 URL 管理移入 repository。它会让后续远端同步实现继承不适用的浏览器细节。

## Risks / Trade-offs

- [默认参数在未来可能掩盖错误的数据源选择] → 仅用于当前本地实现；加入远端模式时在页面组合层明确选择仓库。
- [仓库契约仍使用完整状态写入] → 保留既有行为；P1 需根据 API 的资源粒度重新设计同步与冲突处理。
- [Hook 测试工具链可能未配置 React Hook 渲染器] → 至少为仓库对象增加契约级测试，只有现有工具支持时才补 Hook 替换测试。

## Migration Plan

1. 导出仓库契约和默认 IndexedDB 对象，保留现有函数作为兼容入口直到所有调用切换完成。
2. 让两个 Hook 通过默认仓库调用，并以现有本地库测试覆盖默认行为。
3. 运行 Node 测试、TypeScript、ESLint 与生产构建；失败时回退本次代码改动即可，IndexedDB 中的数据不受影响。
