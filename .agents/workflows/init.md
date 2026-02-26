---
trigger: model_decision
description: 場景與功能階段化初始化（Prompt 1, 2 / 0–16%）
---

// turbo-all
# 場景與功能階段化初始化（/init）

對應 **Prompt 1（0–15%）**：EngineManager + Player + ChunkLoader + HUD
嚴格遵守 GEMINI.md 全局規則：Babylon.js 8.x+ 唯一框架，禁止 Three.js/R3F。

---

## 強制技術規範

```typescript
// EngineManager.ts 必須實作 WebGPU fallback
const engine = await (async () => {
  try {
    const gpu = new WebGPUEngine(canvas);
    await gpu.initAsync();
    return gpu;
  } catch {
    return new Engine(canvas, true); // WebGL2 fallback
  }
})();
```

## 模塊架構（禁止單一巨型 App.tsx）

```
src/
├── core/EngineManager.ts   ← WebGPU + WebGL2 fallback
├── core/Registry.ts        ← 全局狀態中心
├── core/AssetLoader.ts     ← 漸進載入 + AssetContainer
├── entities/Player.ts      ← 角色移動 + 狀態機
├── world/ChunkLoader.ts    ← Chunk 管理 + dispose
├── ui/HUD.ts               ← DOM overlay（非 Babylon.GUI）
├── ui/InputManager.ts      ← 虛擬搖桿 + 觸控
└── main.ts                 ← 入口，系統註冊
```

---

## 執行步驟

### 1. 0–20% 分析對標
掃描現有 EngineManager.ts、MainScene.ts、AssetLoader.ts，確認：
- 目前 WebGPU / WebGL2 fallback 實作狀態
- ChunkLoader dispose() 是否完整
- 首畫面時間基準

### 2. 20–40% 設計

- WebGPU Engine 初始化鏈
- Babylon.js Scene → AssetContainer 漸進載入
- Player 狀態機：Idle / AutoGrind / ManualOverride（State Pattern）
- ChunkManager：移出視錐時 dispose geometry / material / texture
- 虛擬搖桿（DOM overlay，底部左側）
- Omni-Orb（DOM overlay，底部中央）

### 3. 40–60% 程式碼
直接修改對應模塊：
- `EngineManager.ts`：WebGPU + fallback + Snapshot Rendering 開關
- `Player.ts`：Thin Instance placeholder（SphereGeometry → 正式GLB路徑預留）
- `ChunkLoader.ts`：Chunk 串流 + dispose
- `HUD.ts`：Omni-Orb + 虛擬搖桿 DOM 元素

### 4. 60–80% 集成測試
- 白畫面時間（目標 ≤ 1.2s）
- ChunkLoader dispose 記憶體回收確認
- 垂直模式鎖定（portrait）
- 虛擬搖桿觸控響應

### 5. 80–100% 立即可玩步驟 + 報告
現在 `npm run dev` → 垂直模式 → 操作步驟：F5 後 0.9 秒內看到幽暗森林地形 + 角色 placeholder + HUD。

效能預估：首畫面 0.85s，中階手機記憶體 87MB。

**資源狀態（Prompt 1 完成後立即觸發 /asset-gen）：**
- 主角：⏳ SphereGeometry placeholder → 必須在 15% 前觸發 /asset-gen 替換
- 地形：⏳ 純色 Material → Prompt 2 前替換