import { EngineManager } from './core/EngineManager';
import { Registry } from './core/Registry';
import { OrientationManager } from './core/OrientationManager';
import { MainScene } from './scenes/MainScene';
import { Player } from './entities/Player';
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

async function bootstrap(): Promise<void> {
      console.log('[Fantasy Pet Online] Starting...');
      initUiFeedbackSfx();

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

      // 4. Player
      const player = new Player(Registry.scene, mainScene.shadowGenerator);
      Registry.player = player;

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

      // Build initial zone (Starter Meadow)
      await zoneManager.buildInitialZone('starter_meadow');

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
            onSaveProgress: () => {
                  console.log('[System] Save progress requested');
            },
            onLoadProgress: () => {
                  console.log('[System] Load progress requested');
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
      };

      const openPetPanel = (): void => {
            closeSubPanels('pet');
            petPanel.open();
            petPanel.refresh();
      };

      const openFusionPanel = (): void => {
            closeSubPanels('fusion');
            fusionPanel.refresh();
            fusionPanel.open();
      };

      const openEncyclopediaPanel = (): void => {
            closeSubPanels('book');
            encyclopediaPanel.open();
      };

      openShopPanelByDialogue = (mode) => {
            closeSubPanels('shop');
            shopPanel.show(mode);
      };
      openSkillPanelByDialogue = () => {
            closeSubPanels('skill');
            skillPanel.show();
      };
      openQuestPanelByDialogue = () => {
            closeSubPanels('quest');
            questPanel.show();
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
      };

      // Re-wire callbacks with exclusive-open behavior.
      petPanel.onOpenFusion = () => openFusionPanel();
      petPanel.onOpenEncyclopedia = () => openEncyclopediaPanel();
      petPanel.onOpenRename = (pet) => {
            closeSubPanels('rename');
            renamePanel.openFor(pet, () => petPanel.refresh());
      };
      petPanel.onOpenRevival = () => {
            closeSubPanels('revival');
            revivalPanel.open(() => petPanel.refresh());
      };

      fusionPanel.setMapNavigator((mapName, petName) => {
            closeSubPanels('map');
            worldMapPanel.openAtMap(mapName, petName);
      });

      worldMapPanel.setNavigationHandlers({
            onOpenEncyclopedia: (petName, mapName) => {
                  closeSubPanels('book');
                  encyclopediaPanel.openPetByName(petName, mapName);
            },
            onOpenFusionByIngredient: (petName, mapName) => {
                  closeSubPanels('fusion');
                  fusionPanel.openToRecipesByIngredientName(petName, mapName);
            },
            onOpenFusionByTarget: (targetName, mapName) => {
                  closeSubPanels('fusion');
                  fusionPanel.openToRecipesByTargetName(targetName, mapName);
            },
      });

      encyclopediaPanel.setNavigationHandlers({
            onOpenRecipe: (petName, sourceMap) => {
                  closeSubPanels('fusion');
                  fusionPanel.openToRecipesByTargetName(petName, sourceMap);
            },
            onOpenMap: (mapName, petName) => {
                  closeSubPanels('map');
                  worldMapPanel.openAtMap(mapName, petName);
            },
      });

      // Wire portraits
      hud.getPortrait(0)?.addEventListener('click', () => {
            closeSubPanels('char');
            characterPanel.show();
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
      });
      hud.getNavButton('nav-shop')?.addEventListener('click', () => {
            closeSubPanels('shop');
            shopPanel.show('buy');
      });
      hud.getNavButton('nav-community')?.addEventListener('click', () => {
            closeSubPanels('community');
            communityPanel.show();
      });
      hud.getNavButton('nav-quest')?.addEventListener('click', () => {
            closeSubPanels('quest');
            questPanel.show();
      });
      hud.getNavButton('nav-char')?.addEventListener('click', () => {
            closeSubPanels('char');
            characterPanel.show();
      });
      hud.getNavButton('nav-bag')?.addEventListener('click', () => {
            closeSubPanels('bag');
            inventoryPanel.show();
      });
      hud.getNavButton('nav-map')?.addEventListener('click', () => {
            closeSubPanels('map');
            worldMapPanel.show();
      });
      hud.getNavButton('nav-skill')?.addEventListener('click', () => {
            closeSubPanels('skill');
            skillPanel.show();
      });

      // 16. Fade out loading screen
      const loadingScreen = document.getElementById('loading-screen');
      if (loadingScreen) {
            loadingScreen.classList.add('fade-out');
            setTimeout(() => loadingScreen.remove(), 1000);
      }

      // Game loop
      let lastTime = performance.now();
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
      });

      // Start render loop
      engineManager.startRenderLoop();

      console.log('[Fantasy Pet Online] P9 Ready — Quests + NPCs + Dialogue');
}

bootstrap().catch(err => {
      console.error('[Fantasy Pet Online] Fatal error:', err);
});
