# Phase 8: Complete Vertical HUD & UI System (80-85%)

The objective is to replace the current emoji-based text UI with a fully textured, thumb-friendly vertical HUD specifically optimized for portrait mode. It will follow standard mobile RPG conventions (similar to Genshin Impact layout adapted for vertical or Wuthering Waves).

## Proposed Changes

### 1. `src/ui/PortraitHUD.ts`
[NEW] We will create/replace `HUD.ts` with `PortraitHUD.ts`.
*   **Top Bar**:
    *   **Avatar / Character**: Top-left, round profile placeholder.
    *   **Location Bar**: Dynamic region text in the top-center.
    *   **Settings / Menu**: Top-right corner hamburger or gear icon.
*   **Right Edge System Actions**:
    *   **Events (🎁)**
    *   **Rankings (🏆)**
    *   **Faction (🛡️)**
    *   **Backpack (🎒)** -> This will slide out the `InventoryPanel`.
*   **Combat Dock (Bottom Right Curve)**:
    *   **Auto-Battle**: Toggle button just above the skill cluster.
    *   **Skill Quickbar**: Large thumb-friendly main attack button alongside smaller skill cooldown buttons (`atk`, `dodge`, `skill1`, `skill2`, `ult`).
*   **Texture Setup**:
    *   Rather than pure text blocks, we use `Image` controls from `@babylonjs/gui`.

### 2. `src/core/AssetManager.ts`
[MODIFY] Add a `loadUITexture()` method that acts as a safe wrapper for loading HUD `.png` placeholders. If the file is missing, it creates a colored procedural fallback texture with an icon name.

### 3. `src/scenes/MainScene.ts`
[MODIFY] 
*   Replace the `HUD` import with `PortraitHUD`.
*   Connect the location text to the Procedural World generator output.
*   Wire the `Events`, `Rankings`, `Faction`, and `Menu` commands to placeholder console logs or empty panels.
*   Wire the `Backpack` to `inventoryPanel.toggle()`.

## Verification Plan

### Automated/Renderer Tests
1. Compilation check (`npx tsc --noEmit`).
2. Run a browser subagent test:
   - Check if the layout renders correctly in portrait mode constraints.
   - Verify thumb-friendliness (buttons at least 48px/64px wide in the bottom right corner).
   - Test interaction with the new image-backed buttons.
