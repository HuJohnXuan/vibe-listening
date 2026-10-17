## Why

`useMusicLibrary` 和 `useLocalAppState` 目前直接调用 IndexedDB 适配器。当前本地体验可用，但后续接入账号与轻数据同步时会迫使 UI 与本地存储实现一起重写；现在先建立可替换的访问边界，可以保持本地优先体验并降低后续迁移风险。

## What Changes

- 为本地曲库和本地应用状态定义由 Hook 消费的数据仓库契约，并提供现有 IndexedDB 的默认实现。
- 让曲库与应用状态 Hook 通过仓库契约读取、保存和删除数据，支持在测试中传入替代实现。
- 保持现有 IndexedDB schema、离线可用性、音频 Blob 存储方式、界面和用户可见文案不变。
- 不新增 API、账号、远端请求、云服务或管理后台。

## Capabilities

### New Capabilities

无。此变更只重组既有本地数据访问实现，不改变产品可观察行为。

### Modified Capabilities

无。

## Impact

- 影响 `src/adapters/local_data/music-library.ts`、`src/ui/player/use-music-library.ts`、`src/ui/player/use-local-app-state.ts` 及相关测试。
- 不新增运行时依赖，不改变 IndexedDB 数据，不涉及网络接口或部署配置。
