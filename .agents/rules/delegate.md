

# 上下文感知提示規則

當收到任務時，根據關鍵字提供相關上下文和注意事項。
**不強制執行完整 workflow**，只在相關時提醒參考。

## 上下文提示表

| 話題 | 提供的上下文 | 參考 |
|------|-------------|------|
| 效能/FPS/記憶體/WebGPU | 檢查 perf.md 硬約束 | `perf.md` (always_on) |
| 寵物/合成/圖鑑/8系列/蛋 | PetData 40種定義 + 8系列相剋 + PEF 合成 | `GAME_STEPS.md` 寵物系統 |
| 地圖/區域/傳送/地形 | 17 區域 + Monster_Spawns 數據 | `tables/Monster_Spawns.md` |
| 戰鬥/技能/元素/Boss/怪物 | 相剋 1.5x/0.7x + 近攻/遠攻 + CHM 數據 | `tables/Monster_Spawns.md` |
| 裝備/強化/共鳴/套裝 | Boss/PVP 雙軌套裝 + 強化率 | `GAME_STEPS.md` 裝備系統 |
| 多人/Firebase/同步/PVP | Mock 模式優先 + max 20 同屏 | `GAME_STEPS.md` 多人 |
| UI/面板/HUD | sa-panel 模板 + DOM overlay | `/mixed` 已內建 CSS 規範 |
| 資源/圖標/紋理/音效 | 獨立 generate_image | `/asset-gen` workflow |
| Bug/修復/重構 | 最小化修改 + typecheck | `/update` workflow |

## 工作流程選擇指南

- **新增功能 / 修改功能** → 參考 `/dev` workflow
- **修 bug / 重構** → 參考 `/update` workflow
- **生成資源** → 參考 `/asset-gen` workflow
- **驗證品質** → 參考 `/verify` workflow
- **最終收尾** → 參考 `/complete` workflow

## 注意

- 不需要宣布「I'm using /xxx」，除非用戶明確使用 slash command
- 用戶提問時直接回答，不必走完整 workflow
- 只在修改代碼時才需要遵循 perf.md 硬約束