# Phase 7: Economy, Inventory & Shop (70-80%)

- [x] Create `ItemDatabase.ts` — item definitions, rarity, prices
- [x] Create `Inventory.ts` — 30-slot grid, stacking, observables
- [x] Create `InventoryPanel.ts` — 5×6 grid UI, item details, use/equip
- [x] Create `ShopPanel.ts` — buy/sell tabs, confirm dialog
- [x] Create `Merchant.ts` — NPC with proximity interaction
- [x] Modify `Player.ts` — add inventory field
- [x] Modify `CombatSystem.ts` — drops add items to inventory
- [x] Wire HUD 🎒 → InventoryPanel, MainScene integration
- [x] Browser test: inventory + shop interaction

# Phase 8: Vertical HUD & UI Polish (80-85%)

- [x] Search for & generate full HUD placeholder icons (Avatar, Menu, Events, Rankings, Faction, Location, Auto, Skills, Backpack) using generate_image if needed, or point to local placeholders.
- [x] Implement robust `AssetManager.loadTexture()` usage to load these PNGs.
- [x] Rename/Refactor `HUD.ts` into `PortraitHUD.ts` (or upgrade it heavily) making sure all buttons are thumb-friendly.
- [x] Create/Update Location Bar and top navbar for standard mobile RPG feel.
- [x] Wire up all UI elements into `MainScene.ts`.
- [x] Output complete HUD testing steps via browser testing.
