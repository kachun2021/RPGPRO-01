# Fantasy Pet Online — 15步開發指令集（原神風格·Production v4）
# 每個 Step 包含：精確 Babylon.js 配置 / CSS 規範 / 動畫參數 / 資源整合

---

## 全局品質基準

### 渲染管線（每 Step 維持）
```typescript
// DefaultRenderingPipeline — 必須在 P1 建立，後續不得移除
pipeline.bloomEnabled = true;
pipeline.bloomThreshold = 0.7;
pipeline.bloomWeight = 0.3;
pipeline.bloomKernel = 64;
pipeline.fxaaEnabled = true;
pipeline.imageProcessingEnabled = true;
pipeline.imageProcessing.toneMappingEnabled = true;
pipeline.imageProcessing.toneMappingType = ImageProcessingConfiguration.TONEMAPPING_ACES;
pipeline.imageProcessing.exposure = 1.1;
pipeline.imageProcessing.contrast = 1.15;
// SSAO
const ssao = new SSAO2RenderingPipeline("ssao", scene, { ssaoRatio: 0.5, blurRatio: 1 });
ssao.radius = 2.0; ssao.totalStrength = 0.8; ssao.base = 0.1;
```

### 光照基準
```typescript
const sun = new DirectionalLight("sun", new Vector3(-0.5, -1, -0.3), scene);
sun.intensity = 1.8;
sun.diffuse = new Color3(1.0, 0.95, 0.85);  // 暖陽
const shadowGen = new ShadowGenerator(2048, sun);
shadowGen.usePercentageCloserFiltering = true;
shadowGen.filteringQuality = ShadowGenerator.QUALITY_MEDIUM;
// 環境光
const hemi = new HemisphericLight("hemi", new Vector3(0,1,0), scene);
hemi.intensity = 0.4;
hemi.diffuse = new Color3(0.7, 0.8, 1.0);     // 天空藍
hemi.groundColor = new Color3(0.3, 0.25, 0.2); // 大地棕
```

### CSS 面板模板（所有面板共用）
```css
.panel {
  position: absolute; top: 50%; left: 50%;
  transform: translate(-50%,-50%) scale(0.92);
  width: 70vw; max-width: 680px; max-height: 80vh;
  background: linear-gradient(135deg, rgba(10,14,30,0.94), rgba(20,28,55,0.90));
  border: 1px solid rgba(180,200,255,0.1);
  border-radius: 16px;
  box-shadow: 0 24px 80px rgba(0,0,0,0.7),
    inset 0 1px 0 rgba(255,255,255,0.04),
    0 0 1px rgba(180,200,255,0.15);
  backdrop-filter: blur(24px);
  opacity: 0; visibility: hidden; pointer-events: none;
  transition: transform 0.28s cubic-bezier(0.34,1.56,0.64,1),
    opacity 0.22s ease-out, visibility 0s 0.22s;
  overflow: hidden;
}
.panel.open {
  transform: translate(-50%,-50%) scale(1);
  opacity: 1; visibility: visible; pointer-events: auto;
  transition: transform 0.28s cubic-bezier(0.34,1.56,0.64,1),
    opacity 0.22s ease-out, visibility 0s 0s;
}
.panel-backdrop {
  position: absolute; inset: 0; z-index: 290;
  background: radial-gradient(ellipse at center, rgba(0,0,0,0.3), rgba(0,0,0,0.6));
  opacity: 0; visibility: hidden; pointer-events: none;
  transition: opacity 0.22s; }
.panel-backdrop.show { opacity:1; visibility:visible; pointer-events:auto; }

/* 標題欄 — 金線裝飾 */
.panel-header {
  padding: 18px 20px 14px; text-align: center;
  border-bottom: 1px solid rgba(232,201,106,0.12);
  font-family: 'Cinzel', serif; font-size: 17px;
  color: #E8C96A; letter-spacing: 1px;
  position: relative;
}
.panel-header::before, .panel-header::after {
  content: '◆'; position: absolute; top: 50%; transform: translateY(-50%);
  color: rgba(232,201,106,0.25); font-size: 8px;
}
.panel-header::before { left: 20%; }
.panel-header::after { right: 20%; }

/* 關閉按鈕 */
.panel-close {
  position: absolute; top: 12px; right: 14px;
  width: 28px; height: 28px; border-radius: 50%;
  background: rgba(255,255,255,0.06); border: 1px solid rgba(180,200,255,0.1);
  color: rgba(200,195,185,0.6); font-size: 14px; cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  transition: all 0.15s;
}
.panel-close:hover { background: rgba(255,80,80,0.15); color: #ff6b6b; }

/* Tab 系統 */
.tab-row { display: flex; border-bottom: 1px solid rgba(180,200,255,0.08); padding: 0 16px; }
.tab-btn {
  flex: 1; padding: 10px 4px; text-align: center;
  font-family: 'Inter', sans-serif; font-size: 12px;
  color: rgba(200,195,185,0.45); cursor: pointer;
  border-bottom: 2px solid transparent;
  transition: all 0.2s;
}
.tab-btn:hover { color: rgba(200,195,185,0.7); }
.tab-btn.active {
  color: #E8C96A; border-bottom-color: #E8C96A;
  text-shadow: 0 0 10px rgba(232,201,106,0.3);
}

/* 金色操作按鈕 */
.btn-gold {
  background: linear-gradient(180deg, #E8C96A 0%, #C4993D 100%);
  color: #0A0E1A; border: none; border-radius: 8px;
  padding: 10px 24px; font-family: 'Inter', sans-serif;
  font-size: 13px; font-weight: 700; cursor: pointer;
  box-shadow: 0 3px 12px rgba(232,201,106,0.25);
  transition: all 0.12s;
}
.btn-gold:hover { box-shadow: 0 4px 16px rgba(232,201,106,0.4); }
.btn-gold:active { transform: scale(0.95); filter: brightness(0.88); }

/* 列表卡片 */
.list-card {
  display: flex; align-items: center; gap: 10px;
  padding: 10px 14px; margin: 4px 12px;
  background: rgba(255,255,255,0.02);
  border: 1px solid rgba(180,200,255,0.05);
  border-radius: 10px; cursor: pointer;
  transition: all 0.15s;
}
.list-card:hover { background: rgba(232,201,106,0.04); border-color: rgba(232,201,106,0.12); }

/* 自定義滾動條 */
.panel-body { overflow-y: auto; max-height: calc(80vh - 120px); padding: 12px 0; }
.panel-body::-webkit-scrollbar { width: 3px; }
.panel-body::-webkit-scrollbar-track { background: transparent; }
.panel-body::-webkit-scrollbar-thumb { background: rgba(180,200,255,0.12); border-radius: 2px; }

/* Tooltip 浮動卡 */
.tooltip {
  position: absolute; z-index: 500; padding: 12px 14px;
  background: rgba(8,10,22,0.95); border: 1px solid rgba(232,201,106,0.2);
  border-radius: 10px; max-width: 220px;
  box-shadow: 0 8px 32px rgba(0,0,0,0.5);
  font-size: 11px; color: #ECE8E0;
}
```

### HUD CSS 基準（P2 建立）
```css
/* 頂部條 */
.hud-top {
  position: absolute; top: 0; left: 0; right: 0; height: 44px;
  background: linear-gradient(180deg, rgba(0,0,0,0.5) 0%, transparent 100%);
  display: flex; align-items: center; padding: 0 12px; gap: 8px; z-index: 100;
}
.hud-hp { width: 120px; height: 8px; border-radius: 4px;
  background: rgba(0,0,0,0.3); overflow: hidden; position: relative; }
.hud-hp-fill { height: 100%; border-radius: 4px;
  background: linear-gradient(90deg, #C0392B, #E74C3C);
  box-shadow: 0 0 6px rgba(231,76,60,0.4); transition: width 0.3s; }
.hud-mp { width: 100px; height: 6px; border-radius: 3px;
  background: rgba(0,0,0,0.3); overflow: hidden; }
.hud-mp-fill { height: 100%;
  background: linear-gradient(90deg, #2471A3, #3498DB);
  box-shadow: 0 0 4px rgba(52,152,219,0.3); transition: width 0.3s; }
.hud-stat { font-family: 'Inter', sans-serif; font-size: 11px;
  color: #ECE8E0; text-shadow: 0 1px 3px rgba(0,0,0,0.5); }
.hud-gold { color: #E8C96A; font-weight: 600; }
.hud-zone { font-family: 'Cinzel', serif; font-size: 11px;
  color: rgba(232,201,106,0.7); margin-left: auto; }

/* 底部導航 */
.hud-nav {
  position: absolute; bottom: 0; left: 0; right: 0; height: 52px;
  background: linear-gradient(0deg, rgba(0,0,0,0.5) 0%, transparent 100%);
  display: flex; justify-content: center; align-items: center; gap: 4px;
  padding: 0 8px; z-index: 100;
}
.nav-btn {
  width: 42px; height: 42px; border-radius: 12px;
  background: rgba(255,255,255,0.04);
  border: 1px solid rgba(180,200,255,0.06);
  display: flex; align-items: center; justify-content: center;
  cursor: pointer; transition: all 0.15s;
}
.nav-btn:hover { background: rgba(232,201,106,0.08); border-color: rgba(232,201,106,0.15); }
.nav-btn:active { transform: scale(0.9); }
.nav-btn.active { background: rgba(232,201,106,0.12); border-color: rgba(232,201,106,0.25); }
.nav-btn img { width: 22px; height: 22px; opacity: 0.7; filter: brightness(1.2); }
```

---

## ✅ Prompt 1/15：引擎 + PBR 場景 + 後處理（0–7%）— DONE

清空 `src/` 重建。

**新建（6 檔案）：**

### 1. `src/core/EngineManager.ts`（≤120行）
- WebGPUEngine → WebGL2 fallback（見全局規範）
- `canvas.style.width = '100%'` 全屏
- `engine.setHardwareScalingLevel(1 / window.devicePixelRatio)`
- 監聽 resize → `engine.resize()`
- `screen.orientation.lock('landscape')` 嘗試鎖定

### 2. `src/core/Registry.ts`（≤100行）
- 全局靜態 class，後續 Step 逐步填入

### 3. `src/core/AssetLoader.ts`（≤120行）
- `static async loadTexture(path, scene)` — 帶 fallback placeholder 色
- `static async loadGLB(path, scene)` — 找不到時返回 null
- `static loadGeneratedImage(filename)` — 返回 `assets/icons/${filename}` 或 `assets/textures/${filename}`

### 4. `src/core/OrientationManager.ts`（≤100行）
- 監聽 `orientationchange` + `resize`
- 橫向 = 完整模式，直向 = AFK 模式
- `Registry.orientation` 更新 + 通知回調

### 5. `src/scenes/MainScene.ts`（≤200行）
**精確配置（必須完全匹配）：**
```typescript
// 背景
scene.clearColor = new Color4(0.04, 0.055, 0.1, 1); // #0A0E1A

// 太陽光 + 陰影
const sun = new DirectionalLight("sun", new Vector3(-0.5, -1, -0.3), scene);
sun.intensity = 1.8;
sun.diffuse = new Color3(1.0, 0.95, 0.85);
sun.position = new Vector3(30, 50, 30);
const shadowGen = new ShadowGenerator(2048, sun);
shadowGen.usePercentageCloserFiltering = true;

// 環境光
const hemi = new HemisphericLight("hemi", Vector3.Up(), scene);
hemi.intensity = 0.4;
hemi.diffuse = new Color3(0.7, 0.8, 1.0);
hemi.groundColor = new Color3(0.3, 0.25, 0.2);

// 地面 PBR
const ground = MeshBuilder.CreateGround("ground", { width: 200, height: 200, subdivisions: 32 }, scene);
const groundMat = new PBRMaterial("groundMat", scene);
groundMat.albedoTexture = new Texture("assets/textures/grass_diffuse.png", scene);
groundMat.bumpTexture = new Texture("assets/textures/grass_normal.png", scene);
groundMat.roughness = 0.9;
groundMat.metallic = 0.0;
groundMat.albedoTexture.uScale = groundMat.albedoTexture.vScale = 16;
groundMat.bumpTexture.uScale = groundMat.bumpTexture.vScale = 16;
ground.material = groundMat;
ground.receiveShadows = true;
shadowGen.addShadowCaster(ground);

// 後處理
const pipeline = new DefaultRenderingPipeline("pipeline", true, scene);
pipeline.bloomEnabled = true;
pipeline.bloomThreshold = 0.7;
pipeline.bloomWeight = 0.3;
pipeline.bloomKernel = 64;
pipeline.fxaaEnabled = true;
pipeline.imageProcessingEnabled = true;
pipeline.imageProcessing.toneMappingEnabled = true;
pipeline.imageProcessing.toneMappingType = ImageProcessingConfiguration.TONEMAPPING_ACES;
pipeline.imageProcessing.exposure = 1.1;
pipeline.imageProcessing.contrast = 1.15;

// 天空 — 漸層 ShaderMaterial 或 skybox
const skyMat = new BackgroundMaterial("skyMat", scene);
// ...使用 sky_gradient.png 作為反射貼圖
```

### 6. `src/main.ts`（≤60行）

**generate_image（3 張，用 ASSET_PROMPTS.md #1-#3 原文）**
→ `src/assets/textures/grass_diffuse.png`
→ `src/assets/textures/grass_normal.png`
→ `src/assets/textures/sky_gradient.png`

**驗收要求（截圖比對）：**
- [x] PBR 草地：紋理清晰、uv 不拉伸（uScale=vScale=16）
- [x] 陰影：DirectionalLight 投射到地面
- [x] Bloom：高亮區域有柔和光暈
- [x] 天空：漸層色（深藍→白），非純黑
- [x] ACES tone mapping：色彩飽和但不過曝
- [x] Console 零錯誤

---

## ✅ Prompt 2/15：角色 + 原神 HUD + 搖桿 + 相機（7–13%）— DONE

**新建（5 檔案）：**

### 1. `src/entities/Player.ts`（≤250行）
- **正常人體比例** capsule（身高 1.8 單位，肩寬 0.5）
- PBR 材質：`albedoColor = new Color3(0.3, 0.35, 0.5)` 深藍盔甲色
- `shadowGen.addShadowCaster(playerMesh)` 投射陰影
- PlayerStats：`{ hp:100, maxHp:100, mp:50, maxMp:50, atk:10, def:5, level:1, exp:0, gold:500, diamond:10 }`
- `setMoveDirection(dir)` 用 `copyFrom()` + `normalizeToNew()` 避免突變
- 移動速度 6.0

### 2. `src/ui/HUD.ts`（≤250行）
**必須使用全局 HUD CSS（見上方基準），精確佈局：**
- 頂部欄：HP 漸層紅條(寬120px) + MP 藍條(100px) + `Lv.1` 金字 + 金幣💰+數值 + 鑽石💎+數值 + 區域名右端
- 底部導航：7 個圓角按鈕（每個 42×42px），**用 `<img src="assets/icons/nav_X.png">` 替換 emoji**
- `setZone(name)` / `updateStats(stats)` / `getNavButton(id)` API
- 導航按鈕 id：`nav-char, nav-bag, nav-quest, nav-pet, nav-shop, nav-chat, nav-settings`

### 3. `src/ui/PanelManager.ts`（≤120行）
**必須使用全局面板 CSS（見上方基準）：**
- `register({ id, element })` + `open(id)` + `close()` + `toggle(id)`
- open: 加 `.open` class + `.panel-backdrop.show`
- close: 移除 class
- 互斥：同時只能開一個面板
- backdrop 點擊 → close

### 4. `src/input/TouchJoystick.ts`（≤120行）
- 左側 120px 虛擬圓搖桿
- CSS：半透明圓 + 內圓 drag
- WASD fallback：keydown/keyup → direction Vector3
- `get direction(): Vector3` 返回歸一化方向

### 5. `src/input/LandscapeCamera.ts`（≤100行）
```typescript
camera = new ArcRotateCamera("cam", -Math.PI/2, 1.1, 14, Vector3.Zero(), scene);
camera.lowerBetaLimit = 0.5;
camera.upperBetaLimit = 1.4;
camera.lowerRadiusLimit = 8;
camera.upperRadiusLimit = 25;
camera.panningSensibility = 0;     // 禁止平移
camera.inputs.attached.pointers.buttons = [1]; // 只右鍵旋轉
// lerp 跟隨
update(dt) { camera.target = Vector3.Lerp(camera.target, player.position, 5*dt); }
```

**generate_image（10 張，用 ASSET_PROMPTS.md #4-#13 原文）**
→ 7 個 `nav_*.png` + `coin_gold.png` + `gem_diamond.png` + `hud_frame.png`
→ 生成後立即在 HUD.ts 中用 `<img>` 替換

**驗收：**
- [x] 搖桿移動流暢 60fps
- [x] 角色投射陰影到 PBR 地面
- [x] HUD 頂部條：漸層背景 + HP/MP 條 + 金色文字
- [x] 底部 7 個按鈕用 generate_image 圖標（非 emoji）
- [x] 點擊按鈕有 scale(0.9) 反饋

---

## Prompt 3/15：🐾 八大系列 + PetManager + 3出戰（13–20%）

**新建（5 檔案）：**

### 1. `src/pets/PetData.ts`（≤200行）
- 八大系列 enum + COUNTER_MAP（Plant→Dragon→Beast→Insect→Metal→Mystery→Demon→Bird→Plant）
- 每系列 5 種寵物 JSON：`{ id, name, series, baseStats, skills[], gender, baseLevel }`
- 共 40 種初始定義

### 2. `src/pets/PetManager.ts`（≤200行）
- `owned: Pet[]` 最多 20 隻
- `active: Pet[]` 最多 3 隻出戰
- `giveStarterPets()` — 給 3 隻初始寵物（Plant/Beast/Bird 各一）
- `deploy(index)` / `recall(index)` 出戰管理
- `update(dt)` — 更新所有出戰寵物 AI + 位置

### 3. `src/pets/Pet.ts`（≤150行）
- **正常比例** placeholder（球體 body + 小球 head，非 Q 版 cone）
- `PBRMaterial` + 系列色 `emissiveColor`（發光邊緣效果）
- `emissiveIntensity = 0.3` 柔和發光
- 跟隨玩家：`Vector3.Lerp(pos, target + offset, 4*dt)`
- 三寵物環繞偏移：`offset[0]=(-1.5,0,-1)` / `[1]=(1.5,0,-1)` / `[2]=(0,0,-2)`

### 4. `src/pets/PetAI.ts`（≤100行）
- 攻擊最近目標 / 克制系列優先
- 1.2s 攻擊間隔

### 5. `src/ui/PetControlBar.ts`（≤100行）
- 右側 3 個格：`position:absolute; right:8px; top:50%; transform:translateY(-50%)`
- 每格 42×42px，`border: 2px solid [series_color]`，半透明 PBR 風格背景
- 圓弧形 HP 條（conic-gradient 或 SVG arc）
- **系列圖標用 `<img src="assets/icons/series_X.png">`**

**generate_image（9 張，用 ASSET_PROMPTS.md #14-#22）**

**驗收：**
- [x] 3 寵物環繞跟隨，有 emissive 發光邊緣
- [x] 右側控制列用 generate_image 系列圖標（非 emoji）
- [x] 系列色邊框正確（Plant 綠/Dragon 橙/…）

---

## Prompt 4/15：🐾 PEF 合成 + 圖鑑 + 寵物裝備（20–27%）

**新建（5 檔案）：**

### 1. `src/pets/PetFusion.ts`（≤180行）
- 30+ 配方 JSON：`{ parent1Series, parent2Series, resultId, minLevel }`
- 成功率公式：`base 60% + (parentLevel-minLevel)*2%`，cap 95%
- 失敗：副寵消失 + 主寵降 3-6 級
- 保護道具 ID check

### 2. `src/pets/PetEncyclopedia.ts`（≤100行）
- 全 40 種 Map<id, { discovered, count }>
- `register(id)` / `isDiscovered(id)` / `discoveredCount` / `totalCount`

### 3. `src/pets/PetEquipment.ts`（≤80行）
- 3 欄位 enum：Head/Body/Claw
- `equip(petId, slot, itemId)` / `unequip(petId, slot)`
- 裝備效果：`{atk:+5, def:+3}` 加到寵物 stats

### 4. `src/ui/PetPanel.ts`（≤300行）
**使用全局面板 CSS + 以下特定 CSS：**
```css
.pet-card { display:flex; align-items:center; gap:10px; padding:10px 14px;
  background:rgba(255,255,255,0.02); border:1px solid rgba(180,200,255,0.05);
  border-radius:10px; cursor:pointer; transition:all 0.15s; }
.pet-card:hover { background:rgba(232,201,106,0.04); border-color:rgba(232,201,106,0.12); }
.pet-card-icon { width:40px; height:40px; border-radius:8px; object-fit:contain; }
.pet-card-name { font-weight:600; color:#ECE8E0; font-size:13px; }
.pet-card-level { font-size:11px; color:rgba(200,195,185,0.5); }
.pet-card-series { width:16px; height:16px; opacity:0.8; }
```
- 4 Tab：出戰/倉庫/合成/圖鑑（每 Tab 有圖標 + 文字）
- 寵物列表用 .pet-card 卡片
- 圖鑑頁：8系列 sub-tab，每種寵物：已收集=金框+彩色/未收集=灰色+鎖

### 5. `src/ui/FusionPanel.ts`（≤120行）
- 兩個寵物選擇格 + 箭頭(fusion_arrow.png) + 結果格
- 成功率百分比 + 金色進度條
- 合成按鈕 `.btn-gold`
- 成功：fusion_success.png 爆發特效 + 金色粒子
- 失敗：紅色震動 + 裂紋效果

**generate_image（5 張，ASSET_PROMPTS #23-#27）**

**驗收：** 4Tab 面板 + 合成成功/失敗 + 圖鑑 + 裝備穿戴 + 寵物變身機械形態

---

## Prompt 5/15：⚔️ 戰鬥+元素+技能+怪物+Boss（27–35%）

### 1. `src/combat/CombatSystem.ts`（≤200行）
```typescript
// 傷害公式
damage = (atk * skillMultiplier - def * 0.5) * elementModifier * (0.9 + Math.random() * 0.2);
// 暴擊：10% 機率 × 1.5
if (Math.random() < 0.1) { damage *= 1.5; isCrit = true; }
```

### 2. `src/combat/SkillManager.ts`（≤250行）
- 12 技能定義 JSON：`{ id, name, type:'attack'|'defense'|'magic', mpCost, cooldown, multiplier, icon }`
- 右側弧形 4 技能按鈕 CSS：
```css
.skill-bar { position:absolute; right:8px; bottom:80px; display:flex; flex-direction:column; gap:8px; }
.skill-btn { width:48px; height:48px; border-radius:50%; position:relative;
  background:rgba(10,14,30,0.8); border:2px solid rgba(180,200,255,0.15);
  cursor:pointer; overflow:hidden; }
.skill-btn img { width:32px; height:32px; position:absolute; top:50%; left:50%;
  transform:translate(-50%,-50%); }
.skill-btn .cd-overlay { position:absolute; inset:0; border-radius:50%;
  background:conic-gradient(rgba(0,0,0,0.7) var(--cd-pct), transparent 0); }
.skill-btn .mp-cost { position:absolute; bottom:-2px; right:-2px;
  font-size:9px; color:#3498DB; background:rgba(0,0,0,0.6); padding:1px 4px;
  border-radius:4px; }
```
- **技能圖標用 `<img src="assets/icons/skill_X.png">`**

### 3. `src/combat/FloatingDamage.ts`（≤80行）
- Billboard 浮動文字 + 上飄 + 縮放動畫
- 顏色分類：暴擊=#E8C96A 大字 / 普攻=#ECE8E0 / 克制=#27AE60 / 被克=#E74C3C

### 4. `src/combat/ElementSystem.ts`（≤60行）
- `getModifier(atk, def)` → 1.5/0.7/1.0

### 5. `src/entities/Monster.ts`（≤250行）
- **普通怪物**：球體 body + 小角/觸角 placeholder
- **Boss 怪物**：2x 大小 + 金色名字 + 特殊 AI（衝鋒/旋轉攻擊/召喚小怪）
- PBR 材質 + 系列色 `emissiveColor`（Boss emissive 更強 0.5）
- Billboard HP 條：普怪=紅條 / Boss=金框紅條+名字+等級
- 死亡動畫：普怪 0.5s 縮小 / Boss 1s 爆炸 + GPUParticle 金色碎片
- Boss 掉落：Boss套裝裝備書 + 稀有核心蛋（5% 機率）

### 6. `src/entities/MonsterManager.ts`（≤150行）
- 根據當前區域 `monsterConfig` 生成普通怪 + Boss
- 普通怪最多 10 隻，15s respawn
- **區域 Boss**：每區域 1 隻，5min respawn，全屏提示「Boss 出現！」
- Boss 配置 JSON：`{ id, name, series, level, hp, skills[], drops[], respawnSec }`

### 7. `src/ui/SkillBar.ts`（≤80行）
- 右側 4 格弧形排列
- CD 旋轉遮罩 `conic-gradient`
- 點擊觸發技能 + 0.1s scale 回彈

**generate_image（16 張，ASSET_PROMPTS #28-#43）**

**驗收：** 技能施放 + 元素相剋 + 浮動傷害 + Boss 出現+擊殺+掉落

---

## Prompt 6/15：🗺️ 區域世界 + 傳送（35–42%）

### 區域系統核心邏輯
```typescript
async travelTo(zoneId: string) {
  zoneTransition.show(zoneDef.name);
  currentZone.dispose();
  const zone = new ZoneRenderer(scene, zoneDef);
  await zone.build();
  player.position = zoneDef.spawnPoint;
  monsterManager.spawnForZone(zoneDef);
  zoneTransition.hide();
}
```

### ZoneRenderer 精確配置
```typescript
sun.diffuse = Color3.FromHexString(zoneDef.sunColor);
sun.intensity = zoneDef.sunIntensity;
hemi.diffuse = Color3.FromHexString(zoneDef.ambientColor);
groundMat.albedoTexture = new Texture(`assets/textures/terrain_${zoneDef.biome}_diffuse.png`);
groundMat.bumpTexture = new Texture(`assets/textures/terrain_${zoneDef.biome}_normal.png`);
```

### ZoneTransition CSS
```css
.zone-transition { position:absolute; inset:0; z-index:1000;
  background:#0A0E1A; display:flex; flex-direction:column;
  align-items:center; justify-content:center;
  opacity:0; visibility:hidden; transition:opacity 0.4s; }
.zone-transition.show { opacity:1; visibility:visible; }
.zone-transition-name { font-family:'Cinzel',serif; font-size:28px;
  color:#E8C96A; letter-spacing:3px; margin-bottom:20px; }
.zone-transition-bar { width:200px; height:3px; background:rgba(255,255,255,0.1);
  border-radius:2px; overflow:hidden; }
.zone-transition-fill { height:100%; width:0%;
  background:linear-gradient(90deg,#E8C96A,#7BA4DB);
  transition:width 0.3s; }
```

**generate_image（14 張，ASSET_PROMPTS #44-#57）**

**驗收：** 傳送門切換 + 不同區域光照 + Boss spawn + 世界地圖面板

---

## Prompt 7/15：📦 AUTO+掉落+背包（42–49%）

**新建（6 檔案）：**

### 1. `src/combat/AutoGrind.ts`（≤150行）
- 自動找最近怪 → 移動到 3m 內 → 攻擊 → 拾取 → 循環
- AUTO 按鈕（`auto_icon.png`）+ toggle on/off
- 指定目標功能：點擊怪物鎖定
- 變身中迴避主動怪邏輯

### 2. `src/entities/DropItem.ts`（≤100行）
- Y 軸旋轉 0.5 rad/s + 金色 GPUParticle 光效
- 2m 磁吸拾取 + 0.3s Lerp 飛入
- 分類：核心蛋/裝備書/金幣/材料/稀有道具

### 3. `src/systems/DropTable.ts`（≤100行）⭐新增
- **掉落表 JSON**：每區域+每怪物獨立掉落配置
```typescript
interface DropEntry {
  itemId: string; type: 'egg'|'equipment'|'gold'|'material'|'recipe';
  chance: number;  // 0.001 ~ 1.0
  minQty: number; maxQty: number;
  zoneRestrict?: string[];  // 地圖限定掉落
}
```
- 核心蛋掉落率 0.1%（Boss 5%）
- 裝備書：特定地圖限定（如 141 級裝在 潔西帕遺跡）
- Boss 專屬掉落：套裝裝備書

### 4. `src/systems/Inventory.ts`（≤150行）
- 背包 Grid：6 列 × N 行
- 堆疊（材料/消耗品 max 99）+ 自動整理
- 分類 Tab：裝備/消耗/材料/任務道具

### 5. `src/ui/InventoryPanel.ts`（≤200行）
- 居中面板 4Tab + 6 列 Grid
- 稀有度色框（`rarity_*.png`）：灰/藍/紫/金
- 長按 0.5s → Tooltip 浮動卡（道具名+描述+數值）
- 操作選單：使用/穿戴/分解/上架

### 6. `src/ui/AFKPanel.ts`（≤100行）
- 直向 AFK 統計：擊殺數/經驗/金幣/DPS/效率 + 數字跳動動畫
- `afk_bg.png` 背景

**generate_image（7 張，ASSET_PROMPTS #58-#64）**

**驗收：** AUTO 刷怪循環 + Boss掉落套裝 + 磁吸拾取 + 背包 Grid + 稀有度框 + AFK

---

## Prompt 8/15：⚔️ 裝備+強化+共鳴（49–56%）

**新建（5 檔案）：**

### 1. `src/systems/EquipmentSystem.ts`（≤200行）
- 8 部位：頭/鎧/手/鞋/手鐲/戒/項/武器
- Boss 套裝（寵物加傷 +15%/+25%/+35% 按 2/4/6 件）
- PVP 套裝（減傷 +10%/+20%/+30%）
- 裝備等級分段：Lv.141/150/160/170/180

### 2. `src/systems/ResonanceSystem.ts`（≤100行）
- 共鳴藥水 + 裝備 → 對應系寵物攻防提升
- 多階段效果 JSON：`{ series, level, atkBonus, defBonus }`

### 3. `src/systems/EnhanceSystem.ts`（≤80行）
- 強化 +1~+10 成功率：`[90,80,70,60,50,40,30,20,15,10]`
- 失敗降 1 級（+0 不降）
- 保護道具防降級

### 4. `src/ui/EquipmentPanel.ts`（≤180行）
- 人形佈局 8 格 + 角色中央預覽
- 裝備卡片 Tooltip：名字+等級+套裝+數值
- 操作：穿戴/分解/強化

### 5. `src/ui/ResonancePanel.ts`（≤80行）
- 選裝備 + 選藥水 → 效果預覽 → 確認

**generate_image（3 張，ASSET_PROMPTS #65-#67）**

**驗收：** 裝備穿戴 + 套裝2/4/6件效果 + 強化成功/失敗 + 共鳴加成

---

## Prompt 9/15：📜 任務 25 章 + NPC + 換寵（56–63%）

**新建（5 檔案）：**

### 1. `src/systems/QuestManager.ts`（≤250行）
- 主線 25 章 JSON（每 5 章解鎖新地圖）
- 支線任務（殺怪/收集/護送）
- 每日任務（3 個/天，重置 00:00）
- **換寵任務**：特定 NPC 用指定寵物交換稀有寵物 ⭐新增
- 進度 localStorage 持久化

### 2. `src/entities/NPC.ts`（≤120行）
- NPC 分類：合成師/商人/技能師/任務NPC/**換寵NPC** ⭐
- Billboard ！/？ 標記（`quest_exclamation.png`/`quest_question.png`）
- 碰撞觸發對話

### 3. `src/ui/QuestPanel.ts`（≤150行）
- 居中面板 3Tab：主線/支線/每日
- 進度條 + 獎勵預覽卡
- 導航按鈕：點擊自動尋路到目標

### 4. `src/ui/DialoguePanel.ts`（≤100行）
- NPC 名字 + 肖像框（generate_image 或 placeholder 色塊）
- 打字機效果 30ms/字
- 按鈕：接受/拒絕/下一頁
- 換寵介面：顯示「交出 [寵物A] → 獲得 [寵物B]」

### 5. _(修改)_ `MapUnlockSystem.ts` — 完成主線 5/10/15/20/25 章解鎖新區域

**generate_image（4 張，ASSET_PROMPTS #68-#71）**

**驗收：** 任務推進 + NPC 對話 + 地圖解鎖 + 換寵任務完成

---

## Prompt 10/15：📊 五維配點 + 技能樹 + 覺醒 + 轉生（63–70%）

**新建（6 檔案）：**

### 1. `src/systems/StatAllocation.ts`（≤100行）
- 五維：力(str)/敏(agi)/準(acc)/智(int)/屬(attr)
- 升級每獲 5 點，轉生額外 3 點
- 衍生公式：`atk=str*2.5` / `def=acc*1.5` / `hp=str*10+acc*5` / `mp=int*8` / `dodge=agi*0.3%`

### 2. `src/systems/SkillTree.ts`（≤120行）
- 3 列（攻擊/防禦/魔法）+ 一階→二階前置鎖定
- SP 分配：每級 +1 SP
- 二階技能：一階需練滿 + 到特定地圖 NPC 學習

### 3. `src/systems/AwakeningSystem.ts`（≤80行）
- 條件：Lv>=50 + 主線 15 章完成 + 布魯邁 NPC 對話
- 獎勵：+10 屬性點 + +5 SP + 解鎖沉默廢墟 + 角色光環
- 光環效果：ShaderMaterial 圓環 + `awakening_aura.png` 紋理

### 4. `src/systems/RebirthSystem.ts`（≤80行）
- 條件：覺醒後 + Lv>=80
- 重置 Lv.1，獲得永久 +3 全屬性點/次
- 可重複轉生，累積優勢

### 5. `src/ui/CharacterPanel.ts`（≤250行）
- 居中面板 4Tab：屬性/技能/裝備/共鳴
- 五維雷達圖（SVG pentagon）+ +/- 按鈕
- 技能樹（3 列橫向排列 + 前置連線）
- 裝備 Tab → 開啟 EquipmentPanel

### 6. `src/ui/AwakeningPanel.ts`（≤60行）
- 覺醒條件清單（已達成=綠✓/未達=灰✗）
- 獎勵預覽 + 確認按鈕

**generate_image（2 張，ASSET_PROMPTS #72-#73）**

**驗收：** 配點 + 技能樹學習 + 覺醒光環 + 轉生+永久屬性

---

## Prompt 11/15：🔗 Firebase + 多人同屏 + 社交（70–77%）

**新建（5 檔案）：**

### 1. `src/network/NetworkManager.ts`（≤200行）
- Firebase RTDB 直連 + Mock 模式（localStorage 模擬）
- Delta sync 100ms（自己） / 200ms（遠端）
- 斷線重連 + `onDisconnect()` 清理

### 2. `src/network/RemotePlayerManager.ts`（≤150行）
- 監聽 `zones/$zoneId/players` → 渲染遠端玩家
- 最多同時 20 個（超過取最近距離）
- 遠端玩家 Billboard：名字 + 等級 + 公會名
- 遠端寵物簡化渲染（系列色球體）

### 3. `src/network/PlayerInterpolation.ts`（≤80行）
- 100ms delta → 線性插值平滑移動
- 距離 > 50m → 低精度 placeholder

### 4. `src/network/FriendManager.ts`（≤80行）
- 好友列表 + Firebase Presence（在線/離線/擺攤/練功）
- 私聊 `chat/$pair`

### 5. `src/network/SecurityRules.ts`（≤100行）
- 生成 `database.rules.json`
- 寫入檢查：等級 ≤ 180 / 金幣上限 / 屬性點 ≤ 等級×5

**驗收：** Mock 模式同步 + 遠端玩家渲染 + 好友列表 + 在線狀態

---

## Prompt 12/15：⚔️ PVP + 公會 + 組隊（77–84%）

**新建（5 檔案）：**

### 1. `src/combat/PvPSystem.ts`（≤120行）
- 3 模式：和平(不可攻擊) / PK(野外自由PK) / 競技(1v1匹配)
- PVP 套裝減傷生效
- 擊殺獎勵 + 死亡懲罰（掉金幣 10%）

### 2. `src/network/GuildManager.ts`（≤150行）
- 創建：Lv30 + 100 萬 GP
- 成員管理：會長/副會長/成員
- 公會倉庫：Firebase `guilds/$id/storage`
- 留言板：`guilds/$id/board`

### 3. `src/network/PartyManager.ts`（≤100行）
- 8 人隊 + 經驗加成（2 人+25% ~ 8 人+100%）
- 成員 HP 頂部小格顯示

### 4. `src/ui/SocialPanel.ts`（≤150行）
- 居中面板 3Tab：好友/公會/組隊
- 好友：在線狀態圖標 + 私聊按鈕
- 公會：成員列表 + 留言板 + 倉庫入口

### 5. `src/ui/GuildPanel.ts`（≤100行）
- 公會詳情 + 成員排列 + 申請管理

**驗收：** PVP 切換 + 公會創建 + 組隊邀請 + 經驗加成

---

## Prompt 13/15：🛒 商城 + 科技樹 + 變身 + 時裝（84–90%）

**新建（7 檔案）：**

### 1. `src/systems/PaymentManager.ts`（≤100行）
- Capacitor IAP（Android）+ Web Mock

### 2. `src/systems/ShopManager.ts`（≤200行）
- 金幣商店 7 分類：武器/防具/飾品/藥水/寵糧/卷軸/時裝 ⭐含時裝
- 鑽石商店：皮膚/背包擴充/經驗卡
- 泡點商城：在線積分累積兌換
- 充值 5 檔（$0.99~$49.99）

### 3. `src/systems/TechTree.ts`（≤100行）
- 10 層公會科技 + 殺怪/捐獻解鎖
- 公會全員加成

### 4. `src/systems/TransformSystem.ts`（≤100行）
- 變身鎧甲：角色 Mesh 替換 + 能力提升
- **變身後迴避主動怪**：Monster AI 排除變身玩家 ⭐
- 限時 + 商城購買

### 5. `src/systems/CostumeSystem.ts`（≤80行）⭐新增
- 時裝/服飾系統：純外觀不影響數值
- 商城購買 + 穿戴管理
- 開發期 placeholder 色彩替換

### 6. `src/ui/ShopPanel.ts`（≤200行）
- 居中面板 + 左分類 Tab 右商品 Grid
- 價格（金幣/鑽石圖標 + 數值）
- 購買確認彈窗

### 7. `src/ui/TechTreePanel.ts`（≤120行）
- 10 層橫向滾動（scroll-snap）
- 節點圓 40px + 金色連接線

**generate_image（7 張，ASSET_PROMPTS #74-#80）**

**驗收：** 商城購買 + Mock 充值 + 時裝穿戴 + 科技樹 + 變身迴避怪物

---

## Prompt 14/15：💬 聊天 + 設定 + AFK + 活動系統（90–95%）

**新建（5 檔案）：**

### 1. `src/ui/ChatSystem.ts`（≤150行）
- 底部展開 40% 高 + 4Tab：世界/公會/組隊/私聊
- Firebase `chat/$channel/$msgId`
- 頭頂氣泡 Billboard 3s fade

### 2. `src/ui/SettingsPanel.ts`（≤100行）
- 居中面板：畫質(高/中/低) + BGM/SFX 音量滑桿 + 存檔/讀檔 + 登出

### 3. `src/ui/OrientationUI.ts`（≤80行）
- 橫→直 AFK 過渡動畫 0.4s
- 直向 AFK：迷你狀態 + 掛機統計 + 有限操作

### 4. `src/systems/EventManager.ts`（≤120行）⭐新增
- **活動系統**：Live Ops JSON 驅動
- 世界 Boss 活動（定時刷新全服 Boss）
- 限時探險地圖（咆哮牧場/彩虹島 開放時間控制）
- 賽季活動 + 節日活動
- 活動 Banner 通知 UI

### 5. `src/ui/TransformPanel.ts`（≤60行）
- 變身選擇 + 效果預覽 + 確認

**驗收：** 聊天 4 頻道 + 設定生效 + AFK 切換 + 活動系統 Banner

---

## Prompt 15/15：🎓 引導 + 存檔 + 音效 + 效能收尾（95–100%）

**新建（7 檔案）：**

### 1. `capacitor.config.ts`（≤20行）

### 2. `src/core/SaveSystem.ts`（≤120行）
- localStorage：playerStats/inventory/pets/quests/settings/position
- 30s 自動存 + Firebase 同步（有網路時）

### 3. `src/core/PerformanceOptimizer.ts`（≤80行）
- FPS<55 → 降解析度 `engine.setHardwareScalingLevel(2)`
- GPUParticle 限制 + 畫質自動調整

### 4. `src/core/AudioManager.ts`（≤120行）⭐新增
- **BGM 系統**：每區域獨立背景音樂 URL + crossfade 切換
- **SFX 系統**：攻擊/技能/暴擊/撿取/UI點擊/合成/升級/Boss出現
- 音量控制（0~1 滑桿）+ 靜音 toggle
- Web Audio API + Babylon.js Sound
- 開發期用免費音效佔位

### 5. `src/core/NotificationManager.ts`（≤60行）⭐新增
- **離線獎勵**：記錄離線時間 → 回來後發放掛機獎勵
- **推播預留**：Service Worker 接口（寵物蛋孵化/活動開始/Boss刷新）

### 6. `src/ui/TutorialOverlay.ts`（≤100行）
- 4 步新手引導：搖桿→攻擊→寵物→合成
- 聚焦遮罩 + 箭頭指向
- 新手禮包：Lv.0/10/20/30/60 自動彈出

### 7. `src/ui/LevelUpEffect.ts`（≤60行）
- 升級金色 GPUParticle 爆發 + 「LEVEL UP!」大字
- 振動反饋 `navigator.vibrate(200)`

**最終 25 項驗收：**
| # | 項目 | 預期 |
|---|------|------|
| 1 | 冷啟動 | ≤1.2s |
| 2 | FPS | ≥60 |
| 3 | 3 寵跟隨 | 系列色 |
| 4 | PEF 合成 | 成功/失敗 |
| 5 | 寵物圖鑑 | 40 種 |
| 6 | 元素相剋 | 1.5x/0.7x |
| 7 | 技能 | CD+SP |
| 8 | 17 區域傳送 | 不同光照 |
| 9 | 世界地圖 | 傳送 |
| 10 | 普怪+Boss | HP+傷害+掉落 |
| 11 | AUTO | 循環 |
| 12 | AFK | 統計 |
| 13 | 裝備 8 部位 | Boss/PVP 套裝 |
| 14 | 強化+共鳴 | 成功率 |
| 15 | 任務 25 章 | 解鎖 |
| 16 | NPC+換寵 | 對話+交換 |
| 17 | 背包 Grid | 稀有度框 |
| 18 | 交易所 | 上架 |
| 19 | 配點 | 五維 |
| 20 | 覺醒+轉生 | 光環+永久屬性 |
| 21 | 多人同屏 | ≤20人 |
| 22 | PVP+公會 | 3模式 |
| 23 | 商城+時裝 | 購買+穿戴 |
| 24 | 音效 BGM/SFX | 每區域不同 |
| 25 | 存檔+離線獎勵 | 關閉恢復 |
| 26 | 活動系統 | 世界Boss+限時 |
| 27 | 記憶體 | ≤110MB |

---

## 完成後品質等級

P1-P15 全部完成後，遊戲應達到：
- ✅ PBR 地形紋理 5 biome × diffuse+normal
- ✅ DirectionalLight 陰影 + SSAO + Bloom + ACES tone mapping
- ✅ 所有 UI 圖標 = generate_image 精緻圖（非 emoji）
- ✅ 所有面板 = 多層玻璃 + 金線裝飾 + scale 動畫
- ✅ 17 區域各有獨特光照/天空/PBR/BGM
- ✅ 同區域可見其他玩家（≤20人 Firebase）
- ✅ Boss 怪物 + 套裝掉落 + 世界 Boss 活動
- ✅ 音效系統 BGM + SFX
- ✅ 活動系統 + 離線獎勵
- ✅ 時裝/服飾 + 換寵任務
- ✅ 60fps / ≤110MB / 區域切換<500ms
