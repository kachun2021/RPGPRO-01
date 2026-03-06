import { EngineManager } from './core/EngineManager';
import { Registry } from './core/Registry';
import { OrientationManager } from './core/OrientationManager';
import { MainScene } from './scenes/MainScene';
import { Player } from './entities/Player';
import worldTopologyRaw from './data/runtime/world.topology.json';
import { getRuntimeHeroTemplate, listRuntimeHeroTemplates, resolveRuntimeExpToNext } from './data/runtime/RuntimeProgression';
import { matchRuntimeZoneToSceneZone } from './data/runtime/RuntimeZoneBridge';
import { LandscapeCamera } from './input/LandscapeCamera';
import { TouchJoystick } from './input/TouchJoystick';
import { HUD } from './ui/HUD';
import { PetManager } from './pets/PetManager';
import { PetEncyclopedia } from './pets/PetEncyclopedia';
import { PetEquipment } from './pets/PetEquipment';
import { PetBuff } from './pets/PetBuff';
import { PetPanel } from './ui/PetPanel';
import { FusionPanel } from './ui/FusionPanel';
import { EncyclopediaPanel } from './ui/EncyclopediaPanel';
import { RenamePanel } from './ui/RenamePanel';
import { RevivalPanel } from './ui/RevivalPanel';
import { ChatBox } from './ui/ChatBox';
import { Minimap } from './ui/Minimap';
import { SkillBar } from './ui/SkillBar';
import { SkillPanel } from './ui/SkillPanel';
// P5 Combat
import { CombatSystem } from './combat/CombatSystem';
import { ProjectileSystem } from './combat/ProjectileSystem';
import { FloatingDamage } from './combat/FloatingDamage';
import { MonsterManager } from './entities/MonsterManager';
import { EggDropSystem } from './systems/EggDropSystem';
import { CombatLoop } from './combat/CombatLoop';
// P6 Zone World
import { ZoneManager } from './world/ZoneManager';
import { TeleportSystem } from './world/TeleportSystem';
import { ZoneTransition } from './ui/ZoneTransition';
import { WorldMapPanel } from './ui/WorldMapPanel';
// P7 Drops + Inventory
import { DropTable } from './systems/DropTable';
import { DropItemManager } from './entities/DropItem';
import { Inventory } from './systems/Inventory';
import { InventoryPanel } from './ui/InventoryPanel';
import { AFKPanel } from './ui/AFKPanel';
// P8 Equipment + Enhance + Resonance
import { EquipmentSystem } from './systems/EquipmentSystem';
import { EnhanceSystem } from './systems/EnhanceSystem';
import { ResonanceSystem } from './systems/ResonanceSystem';
import { CharacterPanel } from './ui/CharacterPanel';
import { ResonancePanel } from './ui/ResonancePanel';
// P10 Character Growth
import { StatAllocation } from './systems/StatAllocation';
import { SkillTree } from './systems/SkillTree';
import { AwakeningSystem } from './systems/AwakeningSystem';
import { RebirthSystem } from './systems/RebirthSystem';
import { loadRuntimeGame, saveRuntimeGame } from './systems/RuntimeSaveManager';
// P9 Quest + NPC
import { QuestManager } from './systems/QuestManager';
import { NPCManager } from './entities/NPC';
import { QuestPanel } from './ui/QuestPanel';
import { DialoguePanel } from './ui/DialoguePanel';
import { CommunityPanel } from './ui/CommunityPanel';
import { QuestTracker } from './ui/QuestTracker';
// P5 Shop
import { ShopManager } from './systems/ShopManager';
import { ShopPanel } from './ui/ShopPanel';
// P9 System Settings
import { SystemPanel } from './ui/SystemPanel';

function installGlobalPanelViewportFit(): () => void {
      let fitRaf = 0;

      const parseScale = (el: HTMLElement): number => {
            const raw = el.style.transform || '';
            const m = raw.match(/scale\(([\d.]+)\)/);
            if (!m) return 1;
            const n = Number(m[1]);
            return Number.isFinite(n) && n > 0 ? n : 1;
      };

      const fitPanels = (): void => {
            const uiLayer = document.getElementById('ui-layer');
            if (!uiLayer) return;

            const vw = window.innerWidth || 0;
            const vh = window.innerHeight || 0;
            if (vw <= 0 || vh <= 0) return;

            const safeTop = 10;
            const safeBottom = Math.max(86, Math.floor(vh * 0.12));
            const safeSide = 10;
            const maxW = Math.max(260, vw - safeSide * 2);
            const maxH = Math.max(220, vh - safeTop - safeBottom);

            const panels = uiLayer.querySelectorAll<HTMLElement>('.sa-panel');
            panels.forEach((el) => {
                  const cs = window.getComputedStyle(el);
                  if (cs.display === 'none' || cs.visibility === 'hidden' || cs.opacity === '0') return;

                  const isPetPanel = el.id === 'petPanel';
                  const baseTransform = isPetPanel ? 'translateY(-50%)' : 'translate(-50%, -50%)';
                  const origin = isPetPanel ? 'right center' : 'center center';

                  const rect = el.getBoundingClientRect();
                  if (rect.width <= 0 || rect.height <= 0) return;

                  const currentScale = parseScale(el);
                  const naturalW = Math.max(el.scrollWidth, rect.width / currentScale);
                  const naturalH = Math.max(el.scrollHeight, rect.height / currentScale);
                  const nextScale = Math.max(0.5, Math.min(1, maxW / naturalW, maxH / naturalH));

                  const prevApplied = Number(el.dataset.fitScale || '1');
                  if (Math.abs(prevApplied - nextScale) < 0.01 && el.dataset.fitBase === baseTransform) return;

                  el.style.transformOrigin = origin;
                  el.style.setProperty('transform', `${baseTransform} scale(${nextScale.toFixed(3)})`, 'important');
                  el.dataset.fitBase = baseTransform;
                  el.dataset.fitScale = String(nextScale);
            });
      };

      const scheduleFit = (): void => {
            if (fitRaf) cancelAnimationFrame(fitRaf);
            fitRaf = requestAnimationFrame(() => {
                  fitRaf = 0;
                  fitPanels();
            });
      };

      window.addEventListener('resize', scheduleFit);
      window.addEventListener('orientationchange', scheduleFit);
      document.addEventListener('click', (evt) => {
            const target = evt.target as HTMLElement | null;
            if (!target) return;
            if (!target.closest('.sa-panel, .sa-nav-btn, .panel-close, .game-btn, .skill-tab-btn, .afk-menu-btn, .sa-tag')) return;
            scheduleFit();
      }, true);

      scheduleFit();
      return scheduleFit;
}

function initUiFeedbackSfx(): void {
      let audioCtx: AudioContext | null = null;
      let lastPlayed = 0;

      const resolveContext = (): AudioContext | null => {
            if (audioCtx) return audioCtx;
            const Ctor = (window.AudioContext || (window as any).webkitAudioContext) as (new () => AudioContext) | undefined;
            if (!Ctor) return null;
            audioCtx = new Ctor();
            return audioCtx;
      };

      const playClick = (): void => {
            const ctx = resolveContext();
            if (!ctx) return;
            const now = performance.now();
            if (now - lastPlayed < 40) return;
            lastPlayed = now;

            if (ctx.state === 'suspended') {
                  void ctx.resume();
            }

            const t = ctx.currentTime;
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(820, t);
            osc.frequency.exponentialRampToValueAtTime(560, t + 0.04);
            gain.gain.setValueAtTime(0.0001, t);
            gain.gain.exponentialRampToValueAtTime(0.018, t + 0.005);
            gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.06);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(t);
            osc.stop(t + 0.065);
      };

      document.addEventListener('pointerdown', (evt) => {
            const target = evt.target as HTMLElement | null;
            if (!target) return;
            if (!target.closest('.game-btn, .skill-tab-btn, .afk-menu-btn, .panel-close, .sa-nav-btn')) return;
            try {
                  playClick();
            } catch {
                  // Ignore audio failures to keep UI responsive.
            }
      }, true);
}

const HERO_TYPE_STORAGE_KEY = 'fpo.hero.type.v1';

interface RuntimeZoneForSpawn {
      zoneId?: number;
      name?: string;
      mobAble?: boolean;
      level?: { min?: number; max?: number };
      rules?: { restriction?: number; pkZoneFlag?: number };
}

function resolveSelectedHeroType(): number {
      const heroes = listRuntimeHeroTemplates();
      if (heroes.length <= 0) return 0;

      const validTypes = new Set(heroes.map((hero) => hero.type));
      const storedRaw = localStorage.getItem(HERO_TYPE_STORAGE_KEY);
      const storedType = Number(storedRaw ?? NaN);
      if (Number.isFinite(storedType) && validTypes.has(Math.floor(storedType))) {
            return Math.floor(storedType);
      }

      const fallback = heroes[0].type;
      localStorage.setItem(HERO_TYPE_STORAGE_KEY, String(fallback));
      return fallback;
}

function resolveHeroStartZoneId(runtimeBirthZoneId: number): string {
      const payload = worldTopologyRaw as { zones?: RuntimeZoneForSpawn[] };
      const zones = Array.isArray(payload.zones) ? payload.zones : [];
      const zone = zones.find((entry) => Number(entry?.zoneId ?? 0) === runtimeBirthZoneId);
      const minLevel = Number(zone?.level?.min ?? 1);
      const maxLevel = Number(zone?.level?.max ?? minLevel);
      const route = matchRuntimeZoneToSceneZone({
            runtimeZoneId: Number(zone?.zoneId ?? runtimeBirthZoneId),
            zoneName: String(zone?.name ?? ''),
            minLevel,
            maxLevel,
            mobAble: zone?.mobAble !== false,
            restriction: Number(zone?.rules?.restriction ?? 0),
            pkZoneFlag: Number(zone?.rules?.pkZoneFlag ?? 0),
      });
      return route.zoneId ?? 'starter_meadow';
}

async function bootstrap(): Promise<void> {
      console.log('[Fantasy Pet Online] Starting...');
      initUiFeedbackSfx();
      const schedulePanelViewportFit = installGlobalPanelViewportFit();

      // 1. Engine
      const engineManager = new EngineManager();
      await engineManager.init();
      Registry.engineManager = engineManager;

      // 2. Orientation
      const orientationManager = new OrientationManager();
      orientationManager.init();

      // 3. Scene
      const mainScene = new MainScene(engineManager);
      await mainScene.build();

      // 4. Player (P12: fully runtime-driven hero template)
      const selectedHeroType = resolveSelectedHeroType();
      const runtimeHero = getRuntimeHeroTemplate(selectedHeroType);
      const player = new Player(Registry.scene, mainScene.shadowGenerator, {
            expToNextResolver: resolveRuntimeExpToNext,
            initialStats: runtimeHero
                  ? {
                        atk: runtimeHero.baseAtk,
                        def: runtimeHero.baseDef,
                        hp: runtimeHero.baseHp,
                        maxHp: runtimeHero.baseHp,
                        mp: runtimeHero.baseMp,
                        maxMp: runtimeHero.baseMp,
                  }
                  : undefined,
      });
      Registry.player = player;
      if (runtimeHero) {
            console.log(`[Hero] Runtime template selected: type=${runtimeHero.type}, name=${runtimeHero.name}, birthZoneId=${runtimeHero.birthZoneId}`);
      }

      // 5. Camera
      const landscapeCamera = new LandscapeCamera(Registry.scene, engineManager.canvas);
      Registry.scene.activeCamera = landscapeCamera.camera;
      mainScene.camera.dispose();

      // 6. Pets
      const petManager = new PetManager(Registry.scene, mainScene.shadowGenerator);
      petManager.giveStarterPets();
      Registry.petManager = petManager;

      // 7. Pet Encyclopedia + Equipment + Buff
      const encyclopedia = new PetEncyclopedia();
      for (const pet of petManager.owned) {
            encyclopedia.register(pet.def.id);
      }
      const petEquipment = new PetEquipment();
      const petBuff = new PetBuff();
      Registry.petEncyclopedia = encyclopedia;
      Registry.petEquipment = petEquipment;

      // 8. Input
      const joystick = new TouchJoystick();

      // 9. HUD (Stone Age: 4 portraits + 10 nav buttons)
      const hud = new HUD();
      hud.updateStats(player.stats);
      hud.updatePets(petManager);
      Registry.hud = hud;

      // 10. Minimap
      const minimap = new Minimap();

      // 11. Skill Bar (F1-F5 player + P1-P3 pets)
      const skillBar = new SkillBar();
      skillBar.setPetManager(petManager);

      // 11b. Skill Panel (config sub-panel)
      const skillPanel = new SkillPanel(skillBar, petManager);

      // 12. Chat Box
      const chatBox = new ChatBox();

      // ── P5 Combat Systems ──

      // 13a. Combat System
      const combatSystem = new CombatSystem();
      Registry.combatSystem = combatSystem;

      // 13b. Projectile System (ranged pet attacks)
      const projectileSystem = new ProjectileSystem(Registry.scene);

      // 13c. Floating Damage Numbers
      const floatingDamage = new FloatingDamage();

      // 13d. Monster Manager
      const monsterManager = new MonsterManager(Registry.scene, mainScene.shadowGenerator);
      // NOTE: Don't spawn here — ZoneManager.buildInitialZone() handles it
      Registry.monsterManager = monsterManager;

      // 13e. Egg Drop System
      const eggDropSystem = new EggDropSystem();

      // 13f. Combat Loop (orchestrates attack flow + auto-grind)
      const combatLoop = new CombatLoop(
            Registry.scene,
            combatSystem,
            projectileSystem,
            floatingDamage,
            monsterManager,
            eggDropSystem,
            petManager,
            () => player.position,
            (pos) => { player.combatTarget = pos; },
            () => player.stats.atk,
            'Player',
      );
      combatLoop.setSkillBar(skillBar);

      // P7: Drop + Inventory system
      const inventory = new Inventory();
      inventory.addGold(500); // Starter gold for new players
      // Starter consumables
      inventory.addItem({ itemId: 'hp_potion_s', name: 'HP藥水(小)', type: 'consumable', rarity: 'common', qty: 5, icon: '🧪', description: 'HP +50' });
      inventory.addItem({ itemId: 'mp_potion_s', name: 'MP藥水(小)', type: 'consumable', rarity: 'common', qty: 3, icon: '💧', description: 'MP +30' });
      const dropTable = new DropTable();
      const dropItemManager = new DropItemManager(Registry.scene, inventory);
      combatLoop.setDropSystem(dropTable, dropItemManager, inventory);
      Registry.inventory = inventory;

      // P9: Quest + NPC system
      const questManager = new QuestManager();
      combatLoop.setQuestManager(questManager);
      const npcManager = new NPCManager(Registry.scene);
      // NPCs are spawned by ZoneManager.buildInitialZone()
      const questPanel = new QuestPanel(questManager);
      const questTracker = new QuestTracker(questManager);
      const dialoguePanel = new DialoguePanel();

      // P5: Shop system
      const shopManager = new ShopManager();
      const shopPanel = new ShopPanel(shopManager, inventory);

      // Wire NPC interaction → dialogue
      npcManager.onInteract = (npc) => {
            dialoguePanel.openForNpc(npc);
      };

      let openShopPanelByDialogue = (mode: 'buy' | 'sell'): void => {
            shopPanel.show(mode);
      };
      let openSkillPanelByDialogue = (): void => {
            skillPanel.show();
      };
      let openQuestPanelByDialogue = (): void => {
            questPanel.show();
      };
      let openPetPanelByDialogue = (): void => { };

      // Wire dialogue actions → panels
      dialoguePanel.onAction = (_npc, action) => {
            switch (action) {
                  case 'buy': openShopPanelByDialogue('buy'); break;
                  case 'sell': openShopPanelByDialogue('sell'); break;
                  case 'learn': openSkillPanelByDialogue(); break;
                  case 'accept': openQuestPanelByDialogue(); break;
                  case 'trade': {
                        const exchangeQuests = questManager.allQuests.filter(
                              q => q.type === 'side' && q.objectives.some(o => o.type === 'exchange_pet') && !q.claimed
                        );
                        if (exchangeQuests.length === 0) { console.log('[NPC] No pet trade quests'); break; }
                        const eq = exchangeQuests[0];
                        const obj = eq.objectives[0];
                        const hasPet = petManager.owned.some((p: any) => p.def.id === obj.target);
                        if (!hasPet) { console.log(`[NPC] Need pet '${obj.target}'`); break; }
                        if (confirm(`交換: 用 ${obj.target} 換取 ${eq.rewards.petId ?? '???'}?`)) {
                              // Remove traded pet
                              const idx = petManager.owned.findIndex((p: any) => p.def.id === obj.target);
                              if (idx >= 0) {
                                    petManager.owned[idx].dispose();
                                    petManager.owned.splice(idx, 1);
                              }
                              obj.current = obj.required;
                              const reward = questManager.claimReward(eq.id);
                              if (reward?.petId) {
                                    petManager.addPet(reward.petId, Math.random() > 0.5 ? 'male' : 'female');
                                    console.log(`[NPC] Pet traded! Got ${reward.petId}`);
                              }
                        }
                        break;
                  }
                  case 'view': openPetPanelByDialogue(); break;
            }
      };

      // Wire monster damage to player
      monsterManager.onDamagePlayer = (dmg: number, monName: string) => {
            const actualDmg = Math.max(1, dmg - player.stats.def * 0.5);
            player.stats.hp = Math.max(0, player.stats.hp - actualDmg);
            console.log('[Combat] ' + monName + ' hit player for ' + Math.round(actualDmg));
      };

      // P7: AFK Panel (low-cost control center + settings)
      let syncAutoUi = (): void => { };
      const afkPanel = new AFKPanel(inventory, {
            onToggleAuto: () => {
                  combatLoop.toggleAutoGrind();
                  return combatLoop.isAutoGrind;
            },
            onApplyConfig: (settings) => {
                  combatLoop.setAutoConfig({
                        detectRange: settings.detectRadius,
                        skipBossTargets: settings.stopOnBoss,
                  });
            },
            onVisibilityChange: () => syncAutoUi(),
      });
      combatLoop.setAutoConfig({
            detectRange: afkPanel.settings.detectRadius,
            skipBossTargets: afkPanel.settings.stopOnBoss,
      });
      let toggleAfkPanelExclusive = (): void => {
            afkPanel.toggle();
            syncAutoUi();
      };

      // Auto-grind controls: AUTO button + settings icon
      const autoControls = document.createElement('div');
      autoControls.className = 'auto-grind-controls';

      const autoGrindBtn = document.createElement('button');
      autoGrindBtn.id = 'auto-grind-btn';
      autoGrindBtn.className = 'interactive auto-grind-btn';
      autoGrindBtn.textContent = 'AUTO';
      const autoSettingsBtn = document.createElement('button');
      autoSettingsBtn.id = 'auto-settings-btn';
      autoSettingsBtn.className = 'interactive auto-settings-btn';
      autoSettingsBtn.textContent = '⚙';

      syncAutoUi = (): void => {
            const on = combatLoop.isAutoGrind;
            autoGrindBtn.classList.toggle('active', on);
            autoGrindBtn.textContent = on ? 'AUTO ON' : 'AUTO';
            afkPanel.notifyAutoStateChanged(on);
            autoSettingsBtn.classList.toggle('active', afkPanel.isVisible);
            schedulePanelViewportFit();
      };

      autoGrindBtn.addEventListener('click', () => {
            combatLoop.toggleAutoGrind();
            syncAutoUi();
      });
      autoSettingsBtn.addEventListener('click', () => {
            toggleAfkPanelExclusive();
      });
      autoControls.appendChild(autoGrindBtn);
      autoControls.appendChild(autoSettingsBtn);
      document.getElementById('ui-layer')?.appendChild(autoControls);
      syncAutoUi();

      // ── P6 Zone System ──
      const zoneTransition = new ZoneTransition();
      const zoneManager = new ZoneManager(Registry.scene, mainScene.shadowGenerator);
      const worldMapPanel = new WorldMapPanel(zoneManager);
      const teleportSystem = new TeleportSystem(zoneManager, () => player.position);

      // Wire zone manager dependencies
      zoneManager.wire({
            monsterManager,
            transition: zoneTransition,
            minimap,
            npcManager,
            dropItemManager,
            onPlayerReset: (x, z) => {
                  player.position.x = x;
                  player.position.z = z;
                  player.position.y = 0;
                  player.combatTarget = null;
                  combatLoop.clearTarget();
            },
      });

      // Build initial zone from selected hero birth zone (runtime topology routed)
      const heroStartZoneId = runtimeHero
            ? resolveHeroStartZoneId(runtimeHero.birthZoneId)
            : 'starter_meadow';
      await zoneManager.buildInitialZone(heroStartZoneId);

      // 14. Pet Panel
      const petPanel = new PetPanel(petManager, encyclopedia, petEquipment, petBuff);

      // 15. Sub-Panels (Fusion / Encyclopedia / Rename / Revival)
      const fusionPanel = new FusionPanel(petManager);
      const encyclopediaPanel = new EncyclopediaPanel(encyclopedia);
      const renamePanel = new RenamePanel();
      const revivalPanel = new RevivalPanel(petManager);

      // P8: Equipment + Enhance + Resonance
      const equipmentSystem = new EquipmentSystem();
      const enhanceSystem = new EnhanceSystem();
      const resonanceSystem = new ResonanceSystem();
      const statAlloc = new StatAllocation();
      const skillTree = new SkillTree();
      const awakeningSystem = new AwakeningSystem();
      const rebirthSystem = new RebirthSystem();
      const characterPanel = new CharacterPanel(player, statAlloc, skillTree, awakeningSystem, rebirthSystem);
      player.onLevelUp(() => {
            characterPanel.onLevelUp();
      });
      // Apply initial stat allocation
      statAlloc.applyTo(player.stats);
      player.stats.hp = player.stats.maxHp;
      player.stats.mp = player.stats.maxMp;
      const resonancePanel = new ResonancePanel(resonanceSystem, inventory);
      equipmentSystem.giveStarterGear();
      Registry.equipmentSystem = equipmentSystem;

      // Combined Inventory + Equipment panel (needs equipSystem + enhanceSystem)
      const inventoryPanel = new InventoryPanel(inventory, equipmentSystem, enhanceSystem, player.stats);

      const communityPanel = new CommunityPanel();

      // System Settings Panel
      const systemPanel = new SystemPanel({
            onSettingsChange: (settings) => {
                  console.log('[System] Settings updated:', settings);
            },
            getCurrentHeroType: () => {
                  const current = Number(localStorage.getItem(HERO_TYPE_STORAGE_KEY) ?? NaN);
                  return Number.isFinite(current) ? Math.floor(current) : selectedHeroType;
            },
            onHeroTypeChange: (heroType) => {
                  localStorage.setItem(HERO_TYPE_STORAGE_KEY, String(Math.floor(heroType)));
                  console.log(`[System] Hero template changed to type=${heroType}. Restart required to apply.`);
            },
            onSaveProgress: () => {
                  const result = saveRuntimeGame({
                        player,
                        inventory,
                        petManager,
                        statAlloc,
                        skillTree,
                        awakening: awakeningSystem,
                        rebirth: rebirthSystem,
                  });
                  if (result.ok) {
                        console.log(`[System] Save completed at ${result.savedAt}`);
                  } else {
                        console.warn(`[System] Save failed: ${result.message}`);
                  }
            },
            onLoadProgress: () => {
                  const result = loadRuntimeGame({
                        player,
                        inventory,
                        petManager,
                        statAlloc,
                        skillTree,
                        awakening: awakeningSystem,
                        rebirth: rebirthSystem,
                  });
                  if (result.ok) {
                        console.log(`[System] Load completed from ${result.savedAt}`);
                        petPanel.refresh();
                        hud.updateStats(player.stats);
                        hud.updatePets(petManager);
                        schedulePanelViewportFit();
                  } else {
                        console.warn(`[System] Load failed: ${result.message}`);
                  }
            },
            onResetAll: () => {
                  console.log('[System] Reset all data requested');
                  localStorage.clear();
                  location.reload();
            },
      });

      // Global panel rule: opening one sub-panel closes others to avoid overlap.
      const closeSubPanels = (except?: string): void => {
            if (except !== 'pet') petPanel.close();
            if (except !== 'fusion') fusionPanel.close();
            if (except !== 'book') encyclopediaPanel.close();
            if (except !== 'rename') renamePanel.close();
            if (except !== 'revival') revivalPanel.close();
            if (except !== 'shop') shopPanel.hide();
            if (except !== 'quest') questPanel.hide();
            if (except !== 'community') communityPanel.hide();
            if (except !== 'char') characterPanel.hide();
            if (except !== 'bag') inventoryPanel.hide();
            if (except !== 'map') worldMapPanel.hide();
            if (except !== 'skill') skillPanel.hide();
            if (except !== 'settings') systemPanel.hide();
            if (except !== 'afk') afkPanel.hide();
            syncAutoUi();
            schedulePanelViewportFit();
      };

      const openPetPanel = (): void => {
            closeSubPanels('pet');
            petPanel.open();
            petPanel.refresh();
            schedulePanelViewportFit();
      };

      const openFusionPanel = (): void => {
            closeSubPanels('fusion');
            fusionPanel.refresh();
            fusionPanel.open();
            schedulePanelViewportFit();
      };

      const openEncyclopediaPanel = (): void => {
            closeSubPanels('book');
            encyclopediaPanel.open();
            schedulePanelViewportFit();
      };

      openShopPanelByDialogue = (mode) => {
            closeSubPanels('shop');
            shopPanel.show(mode);
            schedulePanelViewportFit();
      };
      openSkillPanelByDialogue = () => {
            closeSubPanels('skill');
            skillPanel.show();
            schedulePanelViewportFit();
      };
      openQuestPanelByDialogue = () => {
            closeSubPanels('quest');
            questPanel.show();
            schedulePanelViewportFit();
      };
      openPetPanelByDialogue = () => openPetPanel();
      toggleAfkPanelExclusive = () => {
            if (afkPanel.isVisible) {
                  afkPanel.hide();
            } else {
                  closeSubPanels('afk');
                  afkPanel.show();
            }
            syncAutoUi();
            schedulePanelViewportFit();
      };

      // Re-wire callbacks with exclusive-open behavior.
      petPanel.onOpenFusion = () => openFusionPanel();
      petPanel.onOpenEncyclopedia = () => openEncyclopediaPanel();
      petPanel.onOpenRename = (pet) => {
            closeSubPanels('rename');
            renamePanel.openFor(pet, () => petPanel.refresh());
            schedulePanelViewportFit();
      };
      petPanel.onOpenRevival = () => {
            closeSubPanels('revival');
            revivalPanel.open(() => petPanel.refresh());
            schedulePanelViewportFit();
      };

      fusionPanel.setMapNavigator((mapName, petName) => {
            closeSubPanels('map');
            worldMapPanel.openAtMap(mapName, petName);
            schedulePanelViewportFit();
      });

      worldMapPanel.setNavigationHandlers({
            onOpenEncyclopedia: (petName, mapName) => {
                  closeSubPanels('book');
                  encyclopediaPanel.openPetByName(petName, mapName);
                  schedulePanelViewportFit();
            },
            onOpenFusionByIngredient: (petName, mapName) => {
                  closeSubPanels('fusion');
                  fusionPanel.openToRecipesByIngredientName(petName, mapName);
                  schedulePanelViewportFit();
            },
            onOpenFusionByTarget: (targetName, mapName) => {
                  closeSubPanels('fusion');
                  fusionPanel.openToRecipesByTargetName(targetName, mapName);
                  schedulePanelViewportFit();
            },
      });

      encyclopediaPanel.setNavigationHandlers({
            onOpenRecipe: (petName, sourceMap) => {
                  closeSubPanels('fusion');
                  fusionPanel.openToRecipesByTargetName(petName, sourceMap);
                  schedulePanelViewportFit();
            },
            onOpenMap: (mapName, petName) => {
                  closeSubPanels('map');
                  worldMapPanel.openAtMap(mapName, petName);
                  schedulePanelViewportFit();
            },
      });

      // Wire portraits
      hud.getPortrait(0)?.addEventListener('click', () => {
            closeSubPanels('char');
            characterPanel.show();
            schedulePanelViewportFit();
      });
      for (let i = 1; i <= 3; i++) {
            hud.getPortrait(i)?.addEventListener('click', () => {
                  openPetPanel();
            });
      }

      // Wire nav buttons
      hud.getNavButton('nav-pet')?.addEventListener('click', () => openPetPanel());
      hud.getNavButton('nav-book')?.addEventListener('click', () => openEncyclopediaPanel());
      hud.getNavButton('nav-settings')?.addEventListener('click', () => {
            closeSubPanels('settings');
            systemPanel.show();
            schedulePanelViewportFit();
      });
      hud.getNavButton('nav-shop')?.addEventListener('click', () => {
            closeSubPanels('shop');
            shopPanel.show('buy');
            schedulePanelViewportFit();
      });
      hud.getNavButton('nav-community')?.addEventListener('click', () => {
            closeSubPanels('community');
            communityPanel.show();
            schedulePanelViewportFit();
      });
      hud.getNavButton('nav-quest')?.addEventListener('click', () => {
            closeSubPanels('quest');
            questPanel.show();
            schedulePanelViewportFit();
      });
      hud.getNavButton('nav-char')?.addEventListener('click', () => {
            closeSubPanels('char');
            characterPanel.show();
            schedulePanelViewportFit();
      });
      hud.getNavButton('nav-bag')?.addEventListener('click', () => {
            closeSubPanels('bag');
            inventoryPanel.show();
            schedulePanelViewportFit();
      });
      hud.getNavButton('nav-map')?.addEventListener('click', () => {
            closeSubPanels('map');
            worldMapPanel.show();
            schedulePanelViewportFit();
      });
      hud.getNavButton('nav-skill')?.addEventListener('click', () => {
            closeSubPanels('skill');
            skillPanel.show();
            schedulePanelViewportFit();
      });

      // Expose concise state for automated game checks.
      const isUiVisible = (id: string): boolean => {
            const el = document.getElementById(id);
            if (!el) return false;
            const cs = window.getComputedStyle(el);
            return cs.display !== 'none' && cs.visibility !== 'hidden' && cs.opacity !== '0';
      };
      (window as any).render_game_to_text = (): string => {
            const payload = {
                  mode: document.getElementById('loading-screen') ? 'loading' : 'play',
                  zone: {
                        id: zoneManager.currentZone.id,
                        name: zoneManager.currentZone.name,
                  },
                  player: {
                        x: Number(player.position.x.toFixed(2)),
                        y: Number(player.position.y.toFixed(2)),
                        z: Number(player.position.z.toFixed(2)),
                        hp: Math.round(player.stats.hp),
                        maxHp: Math.round(player.stats.maxHp),
                        mp: Math.round(player.stats.mp),
                        maxMp: Math.round(player.stats.maxMp),
                        level: player.stats.level,
                        exp: Math.round(player.stats.exp),
                        gold: inventory.gold,
                  },
                  world: {
                        aliveMonsters: monsterManager.alive.length,
                        inventoryCount: inventory.count,
                        autoGrind: combatLoop.isAutoGrind,
                  },
                  openPanels: {
                        quest: isUiVisible('quest-panel'),
                        inventory: isUiVisible('inventory-panel'),
                        skill: isUiVisible('skill-panel'),
                        system: isUiVisible('sys-panel'),
                        pet: isUiVisible('petPanel'),
                        map: isUiVisible('world-map-panel'),
                        shop: isUiVisible('shop-panel'),
                        community: isUiVisible('community-panel'),
                        character: isUiVisible('char-panel'),
                        afk: isUiVisible('afk-panel'),
                  },
            };
            return JSON.stringify(payload);
      };

      // 16. Fade out loading screen
      const loadingScreen = document.getElementById('loading-screen');
      if (loadingScreen) {
            loadingScreen.classList.add('fade-out');
            setTimeout(() => loadingScreen.remove(), 1000);
      }

      // Game loop
      let lastTime = performance.now();
      let panelFitTick = 0;
      Registry.scene.onBeforeRenderObservable.add(() => {
            const now = performance.now();
            const dt = (now - lastTime) / 1000;
            lastTime = now;

            // Joystick → Player movement
            player.setMoveDirection(joystick.direction);
            player.update(dt);

            // Camera follow
            landscapeCamera.update(dt, player.position);

            // Update pets
            petManager.update(dt, player.position);

            // P5: Update combat systems
            projectileSystem.update(dt);
            monsterManager.update(dt, player.position);
            combatLoop.update(dt);

            // Update skill bar CD overlays
            skillBar.update(dt);

            // Update HUD portraits
            hud.updateStats(player.stats);
            hud.updatePets(petManager);

            // Update minimap radar (player + monsters + NPCs)
            minimap.updatePosition(
                  player.position.x,
                  player.position.z,
                  monsterManager.alive.map(m => ({
                        x: m.root.position.x,
                        z: m.root.position.z,
                        isBoss: m.def.isBoss,
                  })),
                  npcManager.getPositions(),
            );

            // P6: Teleport gate proximity check
            teleportSystem.update(dt);

            // P7: Drop item pickup
            dropItemManager.update(dt, player.position);

            // P9: NPC billboard + proximity
            npcManager.update(dt, player.position);

            panelFitTick++;
            if (panelFitTick % 24 === 0) {
                  schedulePanelViewportFit();
            }
      });

      // Start render loop
      engineManager.startRenderLoop();
      schedulePanelViewportFit();

      console.log('[Fantasy Pet Online] P9 Ready — Quests + NPCs + Dialogue');
}

bootstrap().catch(err => {
      console.error('[Fantasy Pet Online] Fatal error:', err);
});
