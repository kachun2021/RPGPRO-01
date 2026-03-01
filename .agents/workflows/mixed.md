---
trigger: model_decision
description: Babylon + DOM UI (Prompt 2, 7, 9, 13, 14 / HUD + panels)
---

// turbo-all
# Babylon + DOM UI (/mixed)

Covers **P2**(HUD+joystick), **P7**(AUTO+inventory), **P9**(quest+NPC), **P13**(shop+costume+transform), **P14**(chat+settings+events+AFK)

---

## Rules

- All UI = DOM overlay (no Babylon.GUI)
- **PetPanel** = right-side slide-in (`sa-panel`)
- **Other panels** = center popup with dark backdrop (`sa-panel`)
- PanelManager exclusive management
- Buttons must have hover/active feedback
- All UI uses Stone Age Premium Dark theme

## Color System (Stone Age Premium Dark)

```css
--bg-deep:      rgba(20,16,30,0.95);
--bg-panel:     rgba(25,20,38,0.94);
--bg-section:   rgba(20,16,30,0.6);
--border-gold:  rgba(160,130,80,0.3);
--border-hover: rgba(232,201,106,0.4);
--accent-gold:  rgba(232,201,106,0.9);
--accent-dim:   rgba(200,195,185,0.5);
--text-primary: rgba(220,215,200,0.8);
--text-label:   rgba(232,201,106,0.8);
--hp-bar:       #E74C3C;
--mp-bar:       #3498DB;
```

## Fonts

```css
font-family: 'Cinzel', serif;     /* titles */
font-family: 'Inter', sans-serif; /* body/numbers */
```

## HUD Components

- **Portraits**: 4 SVG arc rings (Player + 3 Pets), HP red left / MP blue right
  - Container 50px, inner 36px, arc r=22 sw=4
- **Minimap**: dark glass container, canvas grid, zone name + coordinates
- **SkillBar**: 8 vertical F1-F8 dark slots, right side below portraits
- **ChatBox**: dark glass, bottom-left, 3 channels
- **NavBar**: 10 buttons, dark glass bar, emoji icons + gold text labels

## Animation Specs

```
Panel open:  translateX(100%)→0 0.3s (slide-in) OR scale(0.92)→1 0.25s (center)
Panel close: reverse 0.2s
Button press: scale(0.92), 0.1s
Orientation switch: all 0.4s cubic-bezier(0.25,0.46,0.45,0.94)
```

## generate_image Rules

- Each icon/asset = one independent generate_image call
- Copy to src/assets/ and replace placeholder immediately
- Prompt includes dark bg `rgba(20,16,30)` + "Stone Age fantasy RPG style"
- Use exact prompts from ASSET_PROMPTS.md