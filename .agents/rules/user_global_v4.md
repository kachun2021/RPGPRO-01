# Fantasy Pet Online — AI 助手規則 (v4 Flexible + GameDB)

## 1. 遊戲資料源 Priority (GameDB)
不再依賴臆測或 Markdown 表格，所有遊戲功能與數值 **必須** 以 `d:\AI-RPGGAME\scripts\gamedb\` 下的 JSON 為準：
- 怪物資料: `s_monster.json` (類型/掉率), `s_mob.json` (地圖分佈)
- 寵物合成: `s_mix.json` (MixMon 配方)
- 道具/裝備: `s_item.json` (基礎定義), `s_ItemEffectiveData.json` (屬性加成)
- 地圖區域: `s_zone.json` (1-201 區)
- 技能資料: `s_SkillData.json`, `s_SkillProperty.json`

## 2. 技術棧
1. **Babylon.js 8.x+ ONLY (no Three.js / R3F)**
2. WebGPU Engine → WebGL2 fallback
3. Snapshot Rendering + Thin Instances
4. DOM overlay UI (no Babylon.GUI)
5. Firebase Realtime DB (multiplayer)

## 3. 效能基準
- 中階手機 (Snapdragon 778G / iPhone 13)
- Landscape ≥ 60 fps, Memory ≤ 110 MB, First paint ≤ 1.2s
- `screen.orientation.lock('landscape')` 主模式

## 4. 模組架構
```
src/
├── core/       ← Engine, Registry, AssetLoader, Orientation
├── pets/       ← Pet, PetManager, PetData, PetAI, PetFusion, PetEncyclopedia...
├── entities/   ← Player, Monster, MonsterManager, DropItem, NPC
├── combat/     ← CombatSystem, CombatLoop, ElementSystem, FloatingDamage...
├── world/      ← ZoneManager, ZoneDefinitions, ZoneRenderer, TeleportSystem...
├── systems/    ← Inventory, QuestManager, ShopManager, EquipmentSystem, SkillTree...
├── input/      ← TouchJoystick, LandscapeCamera
├── ui/         ← 24 panel files (DOM overlay, sa-panel theme)
└── main.ts
```

## 5. 視覺設計系統 — Stone Age Premium Dark

### 配色表
- 背景: `--bg-deep: rgba(20,16,30,0.95)`, `--bg-panel: rgba(25,20,38,0.94)`
- 邊框/文字: `--border-gold: rgba(160,130,80,0.3)`, `--accent-gold: rgba(232,201,106,0.9)`
- 狀態: `--hp-bar: #E74C3C`, `--mp-bar: #3498DB`

### 面板 CSS (`sa-panel` 模板)
- 所有面板使用 `sa-panel` class
- 按鈕: `.btn-gold` 金色漸層, 格位: `.dark-slot`

## 6. 核心遊戲規則
- **相剋**: Plant → Dragon → Beast → Insect → Metal → Mystery → Demon → Bird → Plant (1.5x / 0.7x)
- **戰鬥**: 玩家 + 3 寵物 RTS 即時戰鬥 (melee/ranged 依賴 `attack_range`)
- **掉落**: `s_mobitem.json` 及 蛋掉落率設定

## 7. generate_image 規則
1. 每次獨立生成（禁止堆疊圖集）
2. Prompt 必含: `"Stone Age fantasy MMO RPG style, dark bg rgba(20,16,30)"`
3. 把生成結果即時複製到 `src/assets/` 替換 placeholder 代码

## 8. 嚴禁行為
- `new ParticleSystem()` → 換 `GPUParticleSystem`
- `BABYLON.GUI.*` → 換 DOM overlay
- 在 update 迴圈操作 DOM → 換 state flag
- 不呼叫 `.dispose()` → 拒絕 memory leak
- 單一 `main.ts` 無限膨脹 → 拆分模組

## 9. 開發流程
- 功能清單：`.agents/prompts/GAME_STEPS.md`
- 驗明方向：`/dev`, `/update`, `/verify` (參考 `.agents/workflows/`)
- 每當你不知道如何實作這功能時，去讀對應的 `scripts/gamedb/*.json`！

## 10. 回應 Footer
```
📊 Performance: [FPS] fps / [Memory] MB
🐾 Data Source: [Parsed any JSON from gamedb?]
🔋 Live Ops: [reload needed?]
📦 Assets: [placeholder/final]
```
