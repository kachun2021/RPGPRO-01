---
trigger: model_decision
description: 資源生成與替換（GLB/KTX2/紋理/音效）
---

# 資源生成與替換（/asset-gen）

嚴格遵守 GEMINI.md 全局規則。
觸發條件：完成任何 Prompt 功能塊後，或任務涉及 GLB / KTX2 / 紋理 / 音效 / 替換 placeholder。

---

## ⚠️ AI 工具能力矩陣（每次執行必讀）

| 資源類型 | 可用工具 | AI自動完成？ | 行動方 |
|---------|---------|------------|-------|
| 2D 紋理 / 地形材質 | `generate_image` | ✅ AI 自動 | 🤖 |
| UI 圖標 / Sprite | `generate_image` | ✅ AI 自動 | 🤖 |
| 粒子貼圖（spark/phantom） | `generate_image` | ✅ AI 自動 | 🤖 |
| GLSL Shader 代碼 | 代碼生成 | ✅ AI 自動 | 🤖 |
| 程序化臨時音效 | Web Audio API 代碼 | ✅ AI 自動 | 🤖 |
| **GLB 角色/怪物/寵物** | ❌ 無3D生成工具 | ❌ 需要你操作 | 👤 |
| **正式 BGM / 音效文件** | ❌ 無音頻生成工具 | ❌ 需要你操作 | 👤 |

---

## 📋 第0步：強制讀取資源清單（每次執行必做）

```
1. 讀取 assets/resource-manifest.md
2. 找出本次 Prompt 對應的「必須替換」項目
3. 分類：🤖 AI自動完成 vs 👤 需要用戶操作
4. 執行完畢後更新 manifest 狀態（🟡 → ✅）
```

---

## 🤖 AI 自動完成的資源

### 藝術風格守則（generate_image 必須遵守）
```
遊戲：Abyssal Wardens: Phantom Dominion
風格：黑暗奇幻 RPG，暗紫色系為主
色調：深紫 #1A0030、暗靛 #2D1B5E、幽靈藍 #4A3F7A、血紅 #8B0000
光源：魔法冷光（藍紫），無太陽直射
禁止：卡通風格、明亮飽和色、現代元素
```

### generate_image Prompt 模板

**地形紋理：**
```
Dark fantasy RPG seamless tileable game texture, top-down view,
[具體描述: dark mossy forest ground / cracked lava rock / frozen ice surface],
deep purple and dark color palette, magical cold lighting, 1024x1024, PBR diffuse map
```

**粒子 Sprite：**
```
Single glowing particle effect on pure black background,
[顏色: golden-purple / ice-blue / blood-red], soft edges, magic RPG style,
64x64 pixels, transparent PNG style
```

**UI 圖標：**
```
Dark fantasy RPG mobile game UI icon, [圖標描述],
minimalist, purple and gold runic style, dark glassmorphic background, 256x256
```

### 程序化臨時音效（Web Audio API）

AI 直接在 `AudioManager.ts` 中生成代碼：
- 擊中音效：高頻衰減 oscillator
- 拾取音效：升頻 sine wave
- 技能音效：多層 oscillator 疊加
- 環境音：低頻 noise + LFO 調變

---

## 👤 需要用戶操作的資源

### GLB 模型流程

**AI 的責任：**
1. 生成「進階 Placeholder」（有識別度的幾何組合，非純 Box）
2. 在代碼中標記 `mesh.metadata = { isPlaceholder: true, specId: "player_model" }`
3. 預留 GLB 載入接口
4. **到替換時機時，主動輸出以下提醒：**

```markdown
🔄 資源替換提醒（Prompt X 完成後）

🤖 AI 已自動完成：
  ✅ forest_d.png — 已用 generate_image 生成並存入 assets/textures/terrain/
  ✅ spark.png — 粒子貼圖已生成
  ✅ 程序化音效代碼 — AudioManager.ts 已包含臨時音效

👤 需要你操作（請完成後告訴我）：

  📦 主角 GLB（★★★★★ 必須）
     規格：身高 1.8m，< 15k tris，含骨骼綁定
     動畫：Idle(2s循環) / Run(1s循環) / Attack(0.8s)
     推薦來源：Mixamo → 搜索 "warrior" → 下載 FBX → Blender 轉 GLB
     上傳路徑：assets/models/entities/player.glb
  
  🎵 BGM 森林循環（★★★☆☆ 可稍後）
     規格：OGG 格式，< 2MB，無縫循環
     推薦：Suno.ai → 輸入 "dark fantasy ambient forest loop"
     上傳路徑：assets/sounds/bgm/dark_forest.ogg

收到文件後回覆我，我會自動：
  1. 更新 AssetLoader.ts 載入路徑
  2. 調整 scale / rotation
  3. 綁定動畫到狀態機
  4. dispose() 清理舊 placeholder
  5. 更新 resource-manifest.md（🟡 → ✅）
```

### 正式音效文件流程

**推薦來源（按優先順序）：**
1. **MusicFX**（Google AI）：https://aitestkitchen.withgoogle.com/tools/music-fx
2. **Suno.ai**：文字描述生成 BGM
3. **Freesound.org**：CC0 免費短音效
4. **Pixabay**：免費音效庫

**規格要求：**
| 類型 | 格式 | 大小上限 | 備註 |
|------|------|---------|------|
| BGM | .ogg | < 2MB | 必須無縫循環 |
| 短音效 | .ogg | < 200KB | 單次觸發 |
| 環境音 | .ogg | < 500KB | 循環 |

---

## 正式資源目錄結構

```
assets/
├── models/
│   ├── entities/       ← player.glb, pet_*.glb
│   ├── monsters/       ← shadow_wolf.glb（含 LOD 0-3）
│   └── environment/    ← tree_*.glb, rock_*.glb
├── textures/
│   ├── terrain/        ← forest_d.png, lava_d.png（AI 生成）
│   ├── particles/      ← spark.png, phantom.png（AI 生成）
│   └── ui/             ← icons（AI 生成）
├── sounds/
│   ├── sfx/            ← hit.ogg, pickup.ogg（用戶提供）
│   └── bgm/            ← dark_forest.ogg（用戶提供）
└── resource-manifest.md ← 狀態追蹤（AI 自動更新）
```

---

## 效能守衛（替換後必須檢查）

| 資源類型 | 單檔上限 | 總量上限 |
|---------|---------|---------|
| GLB 模型 | 2MB | 20MB |
| PNG 紋理 | 512KB | 15MB |
| 音效 | 200KB/個 | 5MB |
| UI 圖標 | 10KB | 1MB |

替換後立即驗證：`npm run dev → 垂直模式 → 確認記憶體 ≤ 110MB`
