---
trigger: model_decision
description: Babylon + DOM UI (Prompt 2, 7, 9, 13, 14 / HUD + panels)
---

// turbo-all
# Babylon + DOM UI (/mixed)

Covers **P2**(HUD+joystick), **P7**(AUTO+inventory), **P9**(quest+NPC), **P13**(shop+costume+transform), **P14**(chat+settings+events+AFK)

Genshin style: deep blue glass + warm gold + smooth animations

---

## Rules

- All UI = DOM overlay (no Babylon.GUI)
- Panels = **center popup** (not slide-in) + dark backdrop
- PanelManager exclusive management
- Buttons must have hover/active feedback

## Color System (Genshin Style)

```css
--bg-deep:     #0A0E1A;
--bg-panel:    rgba(15,20,40,0.85);
--border-glow: rgba(180,200,255,0.15);
--accent-gold: #E8C96A;
--accent-blue: #7BA4DB;
--text-primary: #ECE8E0;
--text-dim:    rgba(200,195,185,0.5);
--hp-bar:      #C0392B;
--mp-bar:      #2E86C1;
```

## Fonts

```css
font-family: 'Cinzel', serif;     /* titles */
font-family: 'Inter', sans-serif; /* body/numbers */
```

## Animation Specs

```
Panel open: scale(0.9)->scale(1) + opacity 0->1, 0.25s cubic-bezier
Panel close: reverse 0.2s
Button press: scale(0.92), 0.1s
Orientation switch: all 0.4s cubic-bezier(0.25,0.46,0.45,0.94)
```

## generate_image Rules

- Each icon/asset = one independent generate_image call
- Copy to src/assets/ and replace emoji immediately
- Prompt format includes bg #0A0E1A + "Genshin Impact style"
- Use exact prompts from ASSET_PROMPTS.md