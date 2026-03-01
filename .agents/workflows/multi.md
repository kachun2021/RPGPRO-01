---
trigger: model_decision
description: 多人同步與 Firebase 整合（Prompt 11-12 / 70–84%）
---

// turbo-all
# 多人同步（/multi）

對應 **Prompt 11**（Firebase底層 + 同屏）和 **Prompt 12**（PVP + 公會 + 組隊）

---

## 核心特性：同區域玩家可見

- 同區域最多渲染 **20 個遠端玩家**（超過取最近）
- 遠端玩家 + 寵物 + 頭頂名字/等級/公會 Billboard
- 100ms delta → PlayerInterpolation 線性插值平滑移動
- 區域切換時清理非同區玩家

## Firebase Schema

```
zones/$zoneId/players/$uid: {
  x, y, z, rotation, animation,
  name, level, guild,
  pets: [{ series, level }]
}
players/$uid: { stats, inventory, quests, settings }
guilds/$id: { name, leader, members[], storage[], board[] }
parties/$id: { leader, members[], expBonus }
chat/$channel/$msgId: { uid, text, ts }
trade/listings/$id: { seller, item, price, ts }
friends/$uid: [{ friendUid, status }]
```

## 模塊架構

```
src/network/
├── NetworkManager.ts        ← Firebase RTDB + Mock 模式
├── RemotePlayerManager.ts   ← 同區域遠端玩家渲染 ≤20
├── PlayerInterpolation.ts   ← 100ms 線性插值
├── SecurityRules.ts         ← 防作弊規則 JSON
├── GuildManager.ts          ← 公會 CRUD
├── PartyManager.ts          ← 8人隊 + 經驗加成
└── FriendManager.ts         ← 好友 + Presence
```

## 效能限制

| 指標 | 目標 |
|------|------|
| 同屏玩家 | ≤20 |
| 同步頻率（自己） | 100ms |
| 同步頻率（遠端） | 200ms |
| Firebase 連接開銷 | +5MB |
| LOD > 50m | 低精度 placeholder |