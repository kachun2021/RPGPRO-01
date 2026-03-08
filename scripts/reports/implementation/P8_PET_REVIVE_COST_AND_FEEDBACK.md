# P8 Pet Revive Cost And Feedback

## Scope
- Step: `P8`
- Goal: make pet revival actually spend GP and keep UI cost display, spend result, and dead-pet state consistent.

## Implemented
- Reworked [RevivalPanel.ts](/D:/AI-RPGGAME/src/ui/RevivalPanel.ts):
  - now receives `Inventory`
  - displays `total cost / current gold`
  - disables revive actions when GP is insufficient
  - spends GP through `inventory.spendGold(...)`
  - preserves result text after successful revive
- Updated [main.ts](/D:/AI-RPGGAME/src/main.ts) to pass `inventory` into `RevivalPanel`.
- Added small debug hooks so the flow can be validated end-to-end:
  - kill a pet
  - open revival panel
  - inspect economy before and after revive

## Validation
- `npm run -s typecheck`
- `npm run -s build`
- `npm run -s test:smoke`
- `npm run -s ci:guardrails`
- Manual browser verification:
  - [pet revival before](/D:/AI-RPGGAME/output/web-game/manual-life-revival/pet-revival-before.png)
  - [pet revival after](/D:/AI-RPGGAME/output/web-game/manual-life-revival/pet-revival-after.png)
  - [state.json](/D:/AI-RPGGAME/output/web-game/manual-life-revival/state.json)

## Verified Behavior
- Before revive:
  - gold = `240`
  - dead pets = `Draco`
  - revive cost = `10 GP`
- After revive:
  - gold = `230`
  - dead pets = `[]`

## Notes
- The panel still inherits an older pet-icon rendering issue (`series_dragon.png` raw text) from pre-existing UI markup.
- GP spend, dead-pet removal, and panel result state are now aligned.
