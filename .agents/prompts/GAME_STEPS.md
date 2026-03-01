# Fantasy Pet Online �?15步開發指令集（Stone Age Premium Dark · Production v5�?
# 每�?Step 包含：精�?Babylon.js 配置 / CSS 規範 / 動畫參數 / 資源整合

---

## 全局品質基準

### 渲染管線（每 Step 維持�?
```typescript
// DefaultRenderingPipeline �?必須�?P1 建立，後續不得移�?
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
// 環境�?
const hemi = new HemisphericLight("hemi", new Vector3(0,1,0), scene);
hemi.intensity = 0.4;
hemi.diffuse = new Color3(0.7, 0.8, 1.0);     // 天空�?
hemi.groundColor = new Color3(0.3, 0.25, 0.2); // 大地�?
```

### CSS 面板模板（所有面板共�?�?Stone Age Premium Dark�?
```css
/* 面板主體 */
.sa-panel {
  background: linear-gradient(180deg, rgba(25,20,38,0.94), rgba(15,12,25,0.96));
  border: 1px solid rgba(160,130,80,0.3);
  border-radius: 6px;
  box-shadow: 2px 2px 16px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.04);
  pointer-events: auto; overflow: hidden; max-height: 85vh;
}

/* 面板標題�?*/
.sa-panel-title {
  display: flex; align-items: center; gap: 8px;
  padding: 6px 12px;
  background: linear-gradient(180deg, rgba(40,30,55,0.9), rgba(25,20,38,0.95));
  color: rgba(232,201,106,0.9); font-weight: 700; font-size: 13px;
  border-bottom: 1px solid rgba(160,130,80,0.2);
  border-radius: 5px 5px 0 0;
}

/* 面板段落 */
.sa-sec { padding: 3px 8px; border-bottom: 1px solid rgba(160,130,80,0.15); }

/* 標籤 */
.sa-tag {
  display: inline-block; padding: 2px 8px;
  font-size: 10px; font-weight: 600;
  background: rgba(160,130,80,0.12); border: 1px solid rgba(160,130,80,0.25);
  border-radius: 3px; color: rgba(200,195,185,0.6); cursor: pointer;
}
.sa-tag-active {
  background: rgba(160,130,80,0.25);
  color: rgba(232,201,106,0.9);
  border-color: rgba(160,130,80,0.4);
}

/* 關閉按鈕 */
.panel-close {
  position: absolute; top: 8px; right: 10px;
  width: 24px; height: 24px; border-radius: 50%;
  background: rgba(255,255,255,0.06); border: 1px solid rgba(160,130,80,0.15);
  color: rgba(200,195,185,0.6); font-size: 13px; cursor: pointer;
  display: flex; align-items: center; justify-content: center;
}
.panel-close:hover { background: rgba(255,80,80,0.15); color: #ff6b6b; }

/* 金色操作按鈕 */
.btn-gold {
  background: linear-gradient(180deg, #E8C96A 0%, #C4993D 100%);
  color: #0A0E1A; border: none; border-radius: 6px;
  padding: 8px 20px; font-family: 'Inter', sans-serif;
  font-size: 13px; font-weight: 700; cursor: pointer;
  box-shadow: 0 3px 12px rgba(232,201,106,0.25);
}
.btn-gold:hover { box-shadow: 0 4px 16px rgba(232,201,106,0.4); }
.btn-gold:active { transform: scale(0.95); filter: brightness(0.88); }

/* 列表卡片 */
.list-card {
  display: flex; align-items: center; gap: 10px;
  padding: 8px 12px; margin: 3px 8px;
  background: rgba(255,255,255,0.02);
  border: 1px solid rgba(160,130,80,0.08);
  border-radius: 6px; cursor: pointer;
}
.list-card:hover { background: rgba(232,201,106,0.04); border-color: rgba(232,201,106,0.12); }

/* 格子/槽位 */
.dark-slot {
  background: rgba(20,16,30,0.6);
  border: 1px solid rgba(160,130,80,0.2); border-radius: 4px;
  display: flex; align-items: center; justify-content: center;
  cursor: pointer; transition: all 0.12s;
}
.dark-slot:hover { border-color: rgba(232,201,106,0.4); background: rgba(232,201,106,0.06); }

/* 自定義滾動條 */
.panel-body { overflow-y: auto; max-height: calc(85vh - 80px); padding: 8px 0; }
.panel-body::-webkit-scrollbar { width: 3px; }
.panel-body::-webkit-scrollbar-track { background: transparent; }
.panel-body::-webkit-scrollbar-thumb { background: rgba(160,130,80,0.15); border-radius: 2px; }

/* Tooltip 浮動�?*/
.tooltip {
  position: absolute; z-index: 500; padding: 10px 12px;
  background: rgba(15,12,25,0.95); border: 1px solid rgba(232,201,106,0.2);
  border-radius: 6px; max-width: 220px;
  box-shadow: 0 8px 32px rgba(0,0,0,0.5);
  font-size: 11px; color: rgba(220,215,200,0.8);
}
```

### HUD CSS 基準（P2 建立 �?SVG Arc 肖像�?+ 暗色導航�?
```css
/* 肖像�?�?浮動，無背景 */
.hud-portrait { position: relative; width: 50px; height: 50px; }
.hud-portrait-inner {
  position: absolute; top: 50%; left: 50%; transform: translate(-50%,-50%);
  width: 36px; height: 36px; border-radius: 50%; border: none;
  background: radial-gradient(circle, rgba(30,25,40,0.9), rgba(15,12,25,0.95));
  display: flex; align-items: center; justify-content: center;
}
/* SVG arc: r=22, sw=4, HP=#E74C3C left(180-360), MP=#3498DB right(0-180) */

/* 導航�?�?暗色玻璃 */
.sa-nav-btn {
  padding: 5px 10px; font-family: 'Inter', sans-serif;
  font-size: 12px; font-weight: 600;
  color: rgba(232,201,106,0.85); background: transparent;
  border: none; border-right: 1px solid rgba(196,153,61,0.2);
  display: flex; flex-direction: column; align-items: center; gap: 1px;
  cursor: pointer; transition: all 0.12s;
}
.sa-nav-btn:hover { background: rgba(196,153,61,0.15); color: #FFD700; }

/* 小地�?�?暗色容器 + canvas */
#minimap {
  background: linear-gradient(180deg, rgba(20,16,30,0.88), rgba(12,10,20,0.92));
  border: 1px solid rgba(160,130,80,0.3); border-radius: 6px;
}

/* 技能欄 �?暗色 F1-F8 */
.dark-skill-slot {
  width: 44px; height: 44px;
  background: rgba(20,16,30,0.6);
  border: 1px solid rgba(160,130,80,0.2); border-radius: 4px;
}

/* 聊天 �?暗色輸入 */
.dark-chat-input {
  background: rgba(15,12,25,0.5); color: rgba(220,215,200,0.8);
  border: 1px solid rgba(160,130,80,0.2); border-radius: 4px;
}
```

---

## �?Prompt 1/15：引�?+ PBR 場景 + 後處理（0�?%）�?DONE

清空 `src/` 重建�?

**新建�? 檔案）：**

### 1. `src/core/EngineManager.ts`（≤120行）
- WebGPUEngine �?WebGL2 fallback（見全局規範�?
- `canvas.style.width = '100%'` 全屏
- `engine.setHardwareScalingLevel(1 / window.devicePixelRatio)`
- 監聽 resize �?`engine.resize()`
- `screen.orientation.lock('landscape')` 嘗試鎖定

### 2. `src/core/Registry.ts`（≤100行）
- 全局靜態 class，後�?Step 逐步填入

### 3. `src/core/AssetLoader.ts`（≤120行）
- `static async loadTexture(path, scene)` �?�?fallback placeholder �?
- `static async loadGLB(path, scene)` �?找不到時返回 null
- `static loadGeneratedImage(filename)` �?返回 `assets/icons/${filename}` �?`assets/textures/${filename}`

### 4. `src/core/OrientationManager.ts`（≤100行）
- 監聽 `orientationchange` + `resize`
- 橫向 = 完整模式，直�?= AFK 模式
- `Registry.orientation` 更新 + 通知回調

### 5. `src/scenes/MainScene.ts`（≤200行）
**精確配置（必須完全匹配）�?*
```typescript
// 背景
scene.clearColor = new Color4(0.04, 0.055, 0.1, 1); // #0A0E1A

// 太陽�?+ 陰影
const sun = new DirectionalLight("sun", new Vector3(-0.5, -1, -0.3), scene);
sun.intensity = 1.8;
sun.diffuse = new Color3(1.0, 0.95, 0.85);
sun.position = new Vector3(30, 50, 30);
const shadowGen = new ShadowGenerator(2048, sun);
shadowGen.usePercentageCloserFiltering = true;

// 環境�?
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

// 後處�?
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

// 天空 �?漸層 ShaderMaterial �?skybox
const skyMat = new BackgroundMaterial("skyMat", scene);
// ...使用 sky_gradient.png 作為反射貼圖
```

### 6. `src/main.ts`（≤60行）

**generate_image�? 張，�?ASSET_PROMPTS.md #1-#3 原文�?*
�?`src/assets/textures/grass_diffuse.png`
�?`src/assets/textures/grass_normal.png`
�?`src/assets/textures/sky_gradient.png`

**驗收要求（截圖比對）�?*
- [x] PBR 草地：紋理清晰、uv 不拉伸（uScale=vScale=16�?
- [x] 陰影：DirectionalLight 投射到地�?
- [x] Bloom：高亮區域有柔和光暈
- [x] 天空：漸層色（深藍→白），非純黑
- [x] ACES tone mapping：色彩飽和但不過�?
- [x] Console 零錯�?

---

## �?Prompt 2/15：角�?+ Premium Dark HUD + 搖桿 + 相機�?�?3%）�?DONE

**新建�? 檔案）：**

### 1. `src/entities/Player.ts`（≤250行）
- **正常人體比例** capsule（身�?1.8 單位，肩�?0.5�?
- PBR 材質：`albedoColor = new Color3(0.3, 0.35, 0.5)` 深藍盔甲�?
- `shadowGen.addShadowCaster(playerMesh)` 投射陰影
- PlayerStats：`{ hp:100, maxHp:100, mp:50, maxMp:50, atk:10, def:5, level:1, exp:0, gold:500, diamond:10 }`
- `setMoveDirection(dir)` �?`copyFrom()` + `normalizeToNew()` 避免突變
- 移動速度 6.0

### 2. `src/ui/HUD.ts`（≤200行）
**使用全局 HUD CSS（見上方基準），精確佈局�?*
- 右上�? 個浮�?SVG arc 肖像圈（Player + 3 Pet），HP 紅弧左半(180-360°) + MP 藍弧右半(0-180°)
  - 容器 50×50px，內�?36×36px，SVG arc r=22 sw=4
  - `stroke-dasharray` 控制 HP/MP 填充百分�?
- 左上：Minimap 暗色容器（zone �?+ 座標 + canvas 網格 + 玩家光點�?
- 底部�?0 個導航按鈕（暗色玻璃條，emoji icon + 文字標籤�?
  - 按鈕 id：`nav-book, nav-shop, nav-char, nav-pet, nav-bag, nav-skill, nav-community, nav-quest, nav-map, nav-settings`
- `updateStats(stats)` 更新 SVG arc / `updatePets(petManager)` 更新寵物肖像
- `getNavButton(id)` API

### 2b. `src/ui/Minimap.ts`（≤100行）
- 暗色容器 150px 寬，zone �?Cinzel金字) + 座標(Inter灰字) + canvas 網格
- `updatePosition(x,z)` 更新坐標 + 玩家光點

### 2c. `src/ui/SkillBar.ts`（≤80行）
- 右側暗色容器�? �?F1-F8 槽位（`dark-skill-slot` 44×44px�?
- 鍵盤 F1-F8 快捷�?+ 可折�?

### 2d. `src/ui/ChatBox.ts`（≤120行）
- 左下暗色容器 280px 寬，3 頻道（System/World/Guild�?
- 暗色輸入框（`dark-chat-input`�? Send 按鈕

### 3. `src/ui/PanelManager.ts`（≤120行）
**必須使用全局面板 CSS（見上方基準）：**
- `register({ id, element })` + `open(id)` + `close()` + `toggle(id)`
- open: �?`.open` class + `.panel-backdrop.show`
- close: 移除 class
- 互斥：同時只能開一個面�?
- backdrop 點擊 �?close

### 4. `src/input/TouchJoystick.ts`（≤120行）
- 左側 120px 虛擬圓搖�?
- CSS：半透明�?+ 內圓 drag
- WASD fallback：keydown/keyup �?direction Vector3
- `get direction(): Vector3` 返回歸一化方�?

### 5. `src/input/LandscapeCamera.ts`（≤100行）
```typescript
camera = new ArcRotateCamera("cam", -Math.PI/2, 1.1, 14, Vector3.Zero(), scene);
camera.lowerBetaLimit = 0.5;
camera.upperBetaLimit = 1.4;
camera.lowerRadiusLimit = 8;
camera.upperRadiusLimit = 25;
camera.panningSensibility = 0;     // 禁止平移
camera.inputs.attached.pointers.buttons = [1]; // 只右鍵旋�?
// lerp 跟隨
update(dt) { camera.target = Vector3.Lerp(camera.target, player.position, 5*dt); }
```

**generate_image�?0 張，�?ASSET_PROMPTS.md #4-#13 原文�?*
�?7 �?`nav_*.png` + `coin_gold.png` + `gem_diamond.png` + `hud_frame.png`
�?生成後立即在 HUD.ts 中用 `<img>` 替換

**驗收�?*
- [x] 搖桿移動流暢 60fps
- [x] 角色投射陰影�?PBR 地面
- [x] HUD 頂部條：漸層背景 + HP/MP �?+ 金色文字
- [x] 底部 7 個按鈕用 generate_image 圖標（非 emoji�?
- [x] 點擊按鈕�?scale(0.9) 反饋

---

## �?Prompt 3/15：�?八大系列 + PetManager + 3出戰�?3�?0%）�?DONE

**新建�? 檔案）：**

### 1. `src/pets/PetData.ts`（≤200行）
- 八大系列 enum + COUNTER_MAP（Plant→Dragon→Beast→Insect→Metal→Mystery→Demon→Bird→Plant�?
- 每系�?5 種寵�?JSON：`{ id, name, series, baseStats, skills[], gender, baseLevel }`
- �?40 種初始定�?

### 2. `src/pets/PetManager.ts`（≤200行）
- `owned: Pet[]` 最�?20 �?
- `active: Pet[]` 最�?3 隻出�?
- `giveStarterPets()` �?�?3 隻初始寵物（Plant/Beast/Bird 各一�?
- `deploy(index)` / `recall(index)` 出戰管理
- `update(dt)` �?更新所有出戰寵�?AI + 位置

### 3. `src/pets/Pet.ts`（≤150行）
- **正常比例** placeholder（球�?body + 小球 head，非 Q �?cone�?
- `PBRMaterial` + 系列�?`emissiveColor`（發光邊緣效果）
- `emissiveIntensity = 0.3` 柔和發光
- 跟隨玩家：`Vector3.Lerp(pos, target + offset, 4*dt)`
- 三寵物環繞偏移：`offset[0]=(-1.5,0,-1)` / `[1]=(1.5,0,-1)` / `[2]=(0,0,-2)`

### 4. `src/pets/PetAI.ts`（≤100行）
- 攻擊最近目�?/ 克制系列優先
- 1.2s 攻擊間隔

### 5. `src/ui/PetControlBar.ts`（≤100行）
- 右側 3 個格：`position:absolute; right:8px; top:50%; transform:translateY(-50%)`
- 每格 42×42px，`border: 2px solid [series_color]`，半透明 PBR 風格背景
- 圓弧�?HP 條（conic-gradient �?SVG arc�?
- **系列圖標�?`<img src="assets/icons/series_X.png">`**

**generate_image�? 張，�?ASSET_PROMPTS.md #14-#22�?*

**驗收�?*
- [x] 3 寵物環繞跟隨，有 emissive 發光邊緣
- [x] 右側控制列用 generate_image 系列圖標（非 emoji�?
- [x] 系列色邊框正確（Plant �?Dragon �?…）

---

## �?Prompt 4/15：�?PEF 合成 + 圖鑑 + 寵物裝備�?0�?7%）�?DONE

**新建�? 檔案）：**

### 1. `src/pets/PetFusion.ts`（≤180行）
- 30+ 配方 JSON：`{ parent1Series, parent2Series, resultId, minLevel }`
- 成功率公式：`base 60% + (parentLevel-minLevel)*2%`，cap 95%
- 失敗：副寵消�?+ 主寵�?3-6 �?
- 保護道具 ID check

### 2. `src/pets/PetEncyclopedia.ts`（≤100行）
- �?40 �?Map<id, { discovered, count }>
- `register(id)` / `isDiscovered(id)` / `discoveredCount` / `totalCount`

### 3. `src/pets/PetEquipment.ts`（≤80行）
- 3 欄位 enum：Head/Body/Claw
- `equip(petId, slot, itemId)` / `unequip(petId, slot)`
- 裝備效果：`{atk:+5, def:+3}` 加到寵物 stats

### 4. `src/ui/PetPanel.ts`（≤280行）
**右側滑入面板（`sa-panel` 暗色主題），拖放操作�?*
- HTML5 drag-and-drop：倉庫格→出戰�?部署，出戰格→倉庫區=召回
- 左側�? 個垂直出戰格（deploy slots），金色邊框
- 右側�? 列倉庫網格（`sa-pet-slot` 暗色格子�?
- 上方：寵物資訊（名字+系列+等級+LV/HP/MP/力量/敏捷 stats，`sa-sl`/`sa-sv` 金色標籤�?
- 裝備區�? 個裝備格 + Buff �?
- 點擊倉庫寵物 �?顯示詳細資訊

### 5. `src/ui/FusionPanel.ts`（≤120行）
- 兩個寵物選擇格 + 箭頭(fusion_arrow.png) + 結果�?
- 成功率百分比 + 金色進度�?
- 合成按鈕 `.btn-gold`
- 成功：fusion_success.png 爆發特效 + 金色粒子
- 失敗：紅色震�?+ 裂紋效果

**generate_image�? 張，ASSET_PROMPTS #23-#27�?*

**驗收�?* 4Tab 面板 + 合成成功/失敗 + 圖鑑 + 裝備穿戴 + 寵物變身機械形態

---

## Prompt 5/15：⚔�?戰鬥+元素+技�?怪物+Boss�?7�?5%�?

### 1. `src/combat/CombatSystem.ts`（≤200行）
```typescript
// 傷害公式
damage = (atk * skillMultiplier - def * 0.5) * elementModifier * (0.9 + Math.random() * 0.2);
// 暴擊�?0% 機率 × 1.5
if (Math.random() < 0.1) { damage *= 1.5; isCrit = true; }
```

### 2. `src/combat/SkillManager.ts`（≤250行）
- 12 技能定�?JSON：`{ id, name, type:'attack'|'defense'|'magic', mpCost, cooldown, multiplier, icon }`
- 右側弧形 4 技能按�?CSS�?
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
- 顏色分類：暴�?#E8C96A 大字 / 普攻=#ECE8E0 / 克制=#27AE60 / 被克=#E74C3C

### 4. `src/combat/ElementSystem.ts`（≤60行）
- `getModifier(atk, def)` �?1.5/0.7/1.0

### 5. `src/entities/Monster.ts`（≤250行）
- **普通怪物**：球�?body + 小角/觸角 placeholder
- **Boss 怪物**�?x 大小 + 金色名字 + 特殊 AI（衝�?旋轉攻擊/召喚小怪）
- PBR 材質 + 系列�?`emissiveColor`（Boss emissive 更強 0.5�?
- Billboard HP 條：普�?紅條 / Boss=金框紅條+名字+等級
- 死亡動畫：普�?0.5s 縮小 / Boss 1s 爆炸 + GPUParticle 金色碎片
- Boss 掉落：Boss套裝裝備�?+ 稀有核心蛋�?% 機率�?

### 6. `src/entities/MonsterManager.ts`（≤150行）
- 根據當前區�?`monsterConfig` 生成普通�?+ Boss
- 普通怪最�?10 隻，15s respawn
- **區�?Boss**：每區�?1 隻，5min respawn，全屏提示「Boss 出現！�?
- Boss 配置 JSON：`{ id, name, series, level, hp, skills[], drops[], respawnSec }`

### 7. `src/ui/SkillBar.ts`（≤80行）
- 右側 4 格弧形排�?
- CD 旋轉遮罩 `conic-gradient`
- 點擊觸發技�?+ 0.1s scale 回彈

**generate_image�?6 張，ASSET_PROMPTS #28-#43�?*

**驗收�?* 技能施�?+ 元素相剋 + 浮動傷害 + Boss 出現+擊殺+掉落

---

## Prompt 6/15：🗺️ 區域世�?+ 傳送（35�?2%�?

### 區域系統核心邏�?
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

**generate_image�?4 張，ASSET_PROMPTS #44-#57�?*

**驗收�?* 傳送門切換 + 不同區域光�?+ Boss spawn + 世界地圖面板

---

## Prompt 7/15：�?AUTO+掉落+背包�?2�?9%�?

**新建�? 檔案）：**

### 1. `src/combat/AutoGrind.ts`（≤150行）
- 自動找最近�?�?移動�?3m �?�?攻擊 �?拾取 �?循環
- AUTO 按鈕（`auto_icon.png`�? toggle on/off
- 指定目標功能：點擊怪物鎖定
- 變身中迴避主動怪邏�?

### 2. `src/entities/DropItem.ts`（≤100行）
- Y 軸旋�?0.5 rad/s + 金色 GPUParticle 光效
- 2m 磁吸拾取 + 0.3s Lerp 飛入
- 分類：核心蛋/裝備�?金幣/材料/稀有道�?

### 3. `src/systems/DropTable.ts`（≤100行）⭐新�?
- **掉落�?JSON**：每區�?每怪物獨立掉落配置
```typescript
interface DropEntry {
  itemId: string; type: 'egg'|'equipment'|'gold'|'material'|'recipe';
  chance: number;  // 0.001 ~ 1.0
  minQty: number; maxQty: number;
  zoneRestrict?: string[];  // 地圖限定掉落
}
```
- 核心蛋掉落率 0.1%（Boss 5%�?
- 裝備書：特定地圖限定（如 141 級裝�?潔西帕遺跡）
- Boss 專屬掉落：套裝裝備書

### 4. `src/systems/Inventory.ts`（≤150行）
- 背包 Grid�? �?× N �?
- 堆疊（材�?消耗品 max 99�? 自動整理
- 分類 Tab：裝�?消�?材料/任務道具

### 5. `src/ui/InventoryPanel.ts`（≤200行）
- 居中面板 4Tab + 6 �?Grid
- 稀有度色框（`rarity_*.png`）：�?�?�?�?
- 長按 0.5s �?Tooltip 浮動卡（道具�?描述+數值）
- 操作選單：使�?穿戴/分解/上架

### 6. `src/ui/AFKPanel.ts`（≤100行）
- 直向 AFK 統計：擊殺數/經驗/金幣/DPS/效率 + 數字跳動動畫
- `afk_bg.png` 背景

**generate_image�? 張，ASSET_PROMPTS #58-#64�?*

**驗收�?* AUTO 刷怪循�?+ Boss掉落套裝 + 磁吸拾取 + 背包 Grid + 稀有度�?+ AFK

---

## Prompt 8/15：⚔�?裝備+強化+共鳴�?9�?6%�?

**新建�? 檔案）：**

### 1. `src/systems/EquipmentSystem.ts`（≤200行）
- 8 部位：頭/�?�?�?手鐲/�?�?武器
- Boss 套裝（寵物加�?+15%/+25%/+35% �?2/4/6 件）
- PVP 套裝（減�?+10%/+20%/+30%�?
- 裝備等級分段：Lv.141/150/160/170/180

### 2. `src/systems/ResonanceSystem.ts`（≤100行）
- 共鳴藥水 + 裝備 �?對應系寵物攻防提�?
- 多階段效�?JSON：`{ series, level, atkBonus, defBonus }`

### 3. `src/systems/EnhanceSystem.ts`（≤80行）
- 強化 +1~+10 成功率：`[90,80,70,60,50,40,30,20,15,10]`
- 失敗�?1 級（+0 不降�?
- 保護道具防降�?

### 4. `src/ui/EquipmentPanel.ts`（≤180行）
- 人形佈局 8 �?+ 角色中央預覽
- 裝備卡片 Tooltip：名�?等級+套裝+數�?
- 操作：穿�?分解/強化

### 5. `src/ui/ResonancePanel.ts`（≤80行）
- 選裝�?+ 選藥�?�?效果預覽 �?確認

**generate_image�? 張，ASSET_PROMPTS #65-#67�?*

**驗收�?* 裝備穿戴 + 套裝2/4/6件效�?+ 強化成功/失敗 + 共鳴加成

---

## Prompt 9/15：�?任務 25 �?+ NPC + 換寵�?6�?3%�?

**新建�? 檔案）：**

### 1. `src/systems/QuestManager.ts`（≤250行）
- 主線 25 �?JSON（每 5 章解鎖新地圖�?
- 支線任務（殺�?收集/護送）
- 每日任務�? �?天，重置 00:00�?
- **換寵任務**：特�?NPC 用指定寵物交換稀有寵�?⭐新�?
- 進度 localStorage 持久�?

### 2. `src/entities/NPC.ts`（≤120行）
- NPC 分類：合成師/商人/技能師/任務NPC/**換寵NPC** �?
- Billboard �?�?標記（`quest_exclamation.png`/`quest_question.png`�?
- 碰撞觸發對話

### 3. `src/ui/QuestPanel.ts`（≤150行）
- 居中面板 3Tab：主�?支線/每日
- 進度�?+ 獎勵預覽�?
- 導航按鈕：點擊自動尋路到目標

### 4. `src/ui/DialoguePanel.ts`（≤100行）
- NPC 名字 + 肖像框（generate_image �?placeholder 色塊�?
- 打字機效�?30ms/�?
- 按鈕：接�?拒絕/下一�?
- 換寵介面：顯示「交�?[寵物A] �?獲得 [寵物B]�?

### 5. _(修改)_ `MapUnlockSystem.ts` �?完成主線 5/10/15/20/25 章解鎖新區�?

**generate_image�? 張，ASSET_PROMPTS #68-#71�?*

**驗收�?* 任務推�?+ NPC 對話 + 地圖解鎖 + 換寵任務完成

---

## Prompt 10/15：�?五維配點 + 技能樹 + 覺醒 + 轉生�?3�?0%�?

**新建�? 檔案）：**

### 1. `src/systems/StatAllocation.ts`（≤100行）
- 五維：力(str)/�?agi)/�?acc)/�?int)/�?attr)
- 升級每獲 5 點，轉生額外 3 �?
- 衍生公式：`atk=str*2.5` / `def=acc*1.5` / `hp=str*10+acc*5` / `mp=int*8` / `dodge=agi*0.3%`

### 2. `src/systems/SkillTree.ts`（≤120行）
- 3 列（攻擊/防禦/魔法�? 一階→二階前置鎖定
- SP 分配：每�?+1 SP
- 二階技能：一階需練滿 + 到特定地�?NPC 學習

### 3. `src/systems/AwakeningSystem.ts`（≤80行）
- 條件：Lv>=50 + 主線 15 章完�?+ 布魯�?NPC 對話
- 獎勵�?10 屬性點 + +5 SP + 解鎖沉默廢墟 + 角色光環
- 光環效果：ShaderMaterial 圓環 + `awakening_aura.png` 紋理

### 4. `src/systems/RebirthSystem.ts`（≤80行）
- 條件：覺醒後 + Lv>=80
- 重置 Lv.1，獲得永�?+3 全屬性點/�?
- 可重複轉生，累積優勢

### 5. `src/ui/CharacterPanel.ts`（≤250行）
- 居中面板 4Tab：屬�?技�?裝備/共鳴
- 五維雷達圖（SVG pentagon�? +/- 按鈕
- 技能樹�? 列橫向排�?+ 前置連線�?
- 裝備 Tab �?開啟 EquipmentPanel

### 6. `src/ui/AwakeningPanel.ts`（≤60行）
- 覺醒條件清單（已達成=綠✓/未達=灰✗�?
- 獎勵預覽 + 確認按鈕

**generate_image�? 張，ASSET_PROMPTS #72-#73�?*

**驗收�?* 配點 + 技能樹學習 + 覺醒光環 + 轉生+永久屬�?

---

## Prompt 11/15：�?Firebase + 多人同屏 + 社交�?0�?7%�?

**新建�? 檔案）：**

### 1. `src/network/NetworkManager.ts`（≤200行）
- Firebase RTDB 直�?+ Mock 模式（localStorage 模擬�?
- Delta sync 100ms（自己） / 200ms（遠端）
- 斷線重�?+ `onDisconnect()` 清理

### 2. `src/network/RemotePlayerManager.ts`（≤150行）
- 監聽 `zones/$zoneId/players` �?渲染遠端玩家
- 最多同�?20 個（超過取最近距離）
- 遠端玩家 Billboard：名�?+ 等級 + 公會�?
- 遠端寵物簡化渲染（系列色球體�?

### 3. `src/network/PlayerInterpolation.ts`（≤80行）
- 100ms delta �?線性插值平滑移�?
- 距離 > 50m �?低精�?placeholder

### 4. `src/network/FriendManager.ts`（≤80行）
- 好友列表 + Firebase Presence（在�?離線/擺攤/練功�?
- 私聊 `chat/$pair`

### 5. `src/network/SecurityRules.ts`（≤100行）
- 生成 `database.rules.json`
- 寫入檢查：等�?�?180 / 金幣上限 / 屬性點 �?等級×5

**驗收�?* Mock 模式同步 + 遠端玩家渲染 + 好友列表 + 在線狀�?

---

## Prompt 12/15：⚔�?PVP + 公會 + 組隊�?7�?4%�?

**新建�? 檔案）：**

### 1. `src/combat/PvPSystem.ts`（≤120行）
- 3 模式：和�?不可攻擊) / PK(野外自由PK) / 競技(1v1匹配)
- PVP 套裝減傷生效
- 擊殺獎勵 + 死亡懲罰（掉金幣 10%�?

### 2. `src/network/GuildManager.ts`（≤150行）
- 創建：Lv30 + 100 �?GP
- 成員管理：會�?副會�?成員
- 公會倉庫：Firebase `guilds/$id/storage`
- 留言板：`guilds/$id/board`

### 3. `src/network/PartyManager.ts`（≤100行）
- 8 人隊 + 經驗加成�? �?25% ~ 8 �?100%�?
- 成員 HP 頂部小格顯示

### 4. `src/ui/SocialPanel.ts`（≤150行）
- 居中面板 3Tab：好�?公會/組隊
- 好友：在線狀態圖�?+ 私聊按鈕
- 公會：成員列�?+ 留言�?+ 倉庫入口

### 5. `src/ui/GuildPanel.ts`（≤100行）
- 公會詳情 + 成員排列 + 申請管理

**驗收�?* PVP 切換 + 公會創建 + 組隊邀�?+ 經驗加成

---

## Prompt 13/15：�?商城 + 科技�?+ 變身 + 時裝�?4�?0%�?

**新建�? 檔案）：**

### 1. `src/systems/PaymentManager.ts`（≤100行）
- Capacitor IAP（Android�? Web Mock

### 2. `src/systems/ShopManager.ts`（≤200行）
- 金幣商店 7 分類：武�?防具/飾品/藥水/寵糧/卷軸/時裝 ⭐含時裝
- 鑽石商店：皮�?背包擴充/經驗�?
- 泡點商城：在線積分累積兌�?
- 充�?5 檔（$0.99~$49.99�?

### 3. `src/systems/TechTree.ts`（≤100行）
- 10 層公會科技 + 殺�?捐獻解鎖
- 公會全員加成

### 4. `src/systems/TransformSystem.ts`（≤100行）
- 變身鎧甲：角�?Mesh 替換 + 能力提升
- **變身後迴避主動�?*：Monster AI 排除變身玩家 �?
- 限時 + 商城購買

### 5. `src/systems/CostumeSystem.ts`（≤80行）⭐新�?
- 時裝/服飾系統：純外觀不影響數�?
- 商城購買 + 穿戴管理
- 開發�?placeholder 色彩替換

### 6. `src/ui/ShopPanel.ts`（≤200行）
- 居中面板 + 左分�?Tab 右商�?Grid
- 價格（金�?鑽石圖標 + 數值）
- 購買確認彈窗

### 7. `src/ui/TechTreePanel.ts`（≤120行）
- 10 層橫向滾動（scroll-snap�?
- 節點圓 40px + 金色連接�?

**generate_image�? 張，ASSET_PROMPTS #74-#80�?*

**驗收�?* 商城購買 + Mock 充�?+ 時裝穿戴 + 科技�?+ 變身迴避怪物

---

## Prompt 14/15：�?聊天 + 設定 + AFK + 活動系統�?0�?5%�?

**新建�? 檔案）：**

### 1. `src/ui/ChatSystem.ts`（≤150行）
- 底部展開 40% �?+ 4Tab：世�?公會/組隊/私聊
- Firebase `chat/$channel/$msgId`
- 頭頂氣泡 Billboard 3s fade

### 2. `src/ui/SettingsPanel.ts`（≤100行）
- 居中面板：畫�?�?�?�? + BGM/SFX 音量滑桿 + 存檔/讀�?+ 登出

### 3. `src/ui/OrientationUI.ts`（≤80行）
- 橫→�?AFK 過渡動畫 0.4s
- 直向 AFK：迷你狀�?+ 掛機統計 + 有限操作

### 4. `src/systems/EventManager.ts`（≤120行）⭐新�?
- **活動系統**：Live Ops JSON 驅動
- 世界 Boss 活動（定時刷新全�?Boss�?
- 限時探險地圖（咆哮牧�?彩虹�?開放時間控制�?
- 賽季活動 + 節日活�?
- 活動 Banner 通知 UI

### 5. `src/ui/TransformPanel.ts`（≤60行）
- 變身選擇 + 效果預覽 + 確認

**驗收�?* 聊天 4 頻道 + 設定生效 + AFK 切換 + 活動系統 Banner

---

## Prompt 15/15：�?引導 + 存檔 + 音效 + 效能收尾�?5�?00%�?

**新建�? 檔案）：**

### 1. `capacitor.config.ts`（≤20行）

### 2. `src/core/SaveSystem.ts`（≤120行）
- localStorage：playerStats/inventory/pets/quests/settings/position
- 30s 自動�?+ Firebase 同步（有網路時）

### 3. `src/core/PerformanceOptimizer.ts`（≤80行）
- FPS<55 �?降解析度 `engine.setHardwareScalingLevel(2)`
- GPUParticle 限制 + 畫質自動調整

### 4. `src/core/AudioManager.ts`（≤120行）⭐新�?
- **BGM 系統**：每區域獨立背景音�?URL + crossfade 切換
- **SFX 系統**：攻�?技�?暴擊/撿取/UI點擊/合成/升級/Boss出現
- 音量控制�?~1 滑桿�? 靜音 toggle
- Web Audio API + Babylon.js Sound
- 開發期用免費音效佔位

### 5. `src/core/NotificationManager.ts`（≤60行）⭐新�?
- **離線獎勵**：記錄離線時�?�?回來後發放掛機獎�?
- **推播預留**：Service Worker 接口（寵物蛋孵化/活動開始/Boss刷新�?

### 6. `src/ui/TutorialOverlay.ts`（≤100行）
- 4 步新手引導：搖桿→攻擊→寵物→合�?
- 聚焦遮罩 + 箭頭指向
- 新手禮包：Lv.0/10/20/30/60 自動彈出

### 7. `src/ui/LevelUpEffect.ts`（≤60行）
- 升級金色 GPUParticle 爆發 + 「LEVEL UP!」大�?
- 振動反饋 `navigator.vibrate(200)`

**最�?25 項驗收：**
| # | 項目 | 預期 |
|---|------|------|
| 1 | 冷啟�?| �?.2s |
| 2 | FPS | �?0 |
| 3 | 3 寵跟�?| 系列�?|
| 4 | PEF 合成 | 成功/失敗 |
| 5 | 寵物圖鑑 | 40 �?|
| 6 | 元素相剋 | 1.5x/0.7x |
| 7 | 技�?| CD+SP |
| 8 | 17 區域傳�?| 不同光照 |
| 9 | 世界地圖 | 傳�?|
| 10 | 普�?Boss | HP+傷害+掉落 |
| 11 | AUTO | 循環 |
| 12 | AFK | 統計 |
| 13 | 裝備 8 部位 | Boss/PVP 套裝 |
| 14 | 強化+共鳴 | 成功�?|
| 15 | 任務 25 �?| 解鎖 |
| 16 | NPC+換寵 | 對話+交換 |
| 17 | 背包 Grid | 稀有度�?|
| 18 | 交易所 | 上架 |
| 19 | 配點 | 五維 |
| 20 | 覺醒+轉生 | 光環+永久屬�?|
| 21 | 多人同屏 | �?0�?|
| 22 | PVP+公會 | 3模式 |
| 23 | 商城+時裝 | 購買+穿戴 |
| 24 | 音效 BGM/SFX | 每區域不�?|
| 25 | 存檔+離線獎勵 | 關閉恢復 |
| 26 | 活動系統 | 世界Boss+限時 |
| 27 | 記憶�?| �?10MB |

---

## 完成後品質等�?

P1-P15 全部完成後，遊戲應達到：
- �?PBR 地形紋理 5 biome × diffuse+normal
- �?DirectionalLight 陰影 + SSAO + Bloom + ACES tone mapping
- �?所�?UI 圖標 = generate_image 精緻圖（�?emoji�?
- �?所有面�?= 多層玻璃 + 金線裝飾 + scale 動畫
- �?17 區域各有獨特光�?天空/PBR/BGM
- �?同區域可見其他玩家（�?0�?Firebase�?
- �?Boss 怪物 + 套裝掉落 + 世界 Boss 活動
- �?音效系統 BGM + SFX
- �?活動系統 + 離線獎勵
- �?時裝/服飾 + 換寵任務
- �?60fps / �?10MB / 區域切�?500ms
