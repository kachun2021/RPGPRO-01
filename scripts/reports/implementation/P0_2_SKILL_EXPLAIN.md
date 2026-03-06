# P0-2 技能說明強化報告

## 目標
- 技能面板直接展示「效果說明 / 目標 / 距離 / 範圍 / 持續時間」。
- 把 runtime 技能欄位轉為玩家看得懂的語言。

## 變更內容
- Runtime 資料層：`src/data/runtime/RuntimeProgression.ts`
  - 新增 `RuntimeSkillDetail`。
  - 新增 `getRuntimeSkillDetail(skillId, level)`，回傳：
    - `targetClass`、`maxTargetDistance`、`targetRange`、`continuityTime`
    - `requireSp`、`learningGold`、`effectIndex`、`effectingStat` 等。
  - 擴充型別宣告，避免 runtime 欄位被 TS 遺漏。
- UI 層：`src/ui/SkillPanel.ts`
  - 卡片新增兩行：
    - `skill-card-effect`：效果摘要（傷害/治療/增益/減益）。
    - `skill-card-runtime`：目標類型、距離、範圍、持續時間。
  - 新增 `targetClass` 玩家文案轉譯（例如敵方單體/敵方範圍/我方範圍）。
- 樣式層：`index.html`
  - 新增 `.skill-card-effect`、`.skill-card-runtime` 與 focus mode 對應字級。

## 驗證
- `npm run -s typecheck`：通過
- `npm run -s build`：通過

## 成果
- 玩家不需查外部資料即可在技能卡直接理解「做什麼、打多遠、持續多久」。

## 已知限制
- 目前只對既有可裝備技能（現有映射）顯示完整 runtime 說明。
- 全 31 技能映射與戰鬥一致化將於 P1-5 完成。
