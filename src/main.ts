import './styles/index.css';
import { EngineManager } from './core/EngineManager';
import { Registry } from './core/Registry';
import { OrientationManager } from './core/OrientationManager';
import { MainScene } from './scenes/MainScene';
import { Player } from './entities/Player';
import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { getRuntimeHeroTemplate, listRuntimeHeroTemplates, resolveRuntimeExpToNext } from './data/runtime/RuntimeProgression';
import { getHeroArchetypeProfile } from './data/runtime/HeroArchetypes';
import { resolveSceneZoneForRuntimeZoneId } from './data/runtime/RuntimeSceneRouteApi';
import type { PlayerIdentitySnapshot } from './core/PlayerIdentity';
import { LandscapeCamera } from './input/LandscapeCamera';
import { TouchJoystick } from './input/TouchJoystick';
import { HUD } from './ui/HUD';
import { PetManager } from './pets/PetManager';
import { PetEncyclopedia } from './pets/PetEncyclopedia';
import { PetEquipment } from './pets/PetEquipment';
import { PetBuff } from './pets/PetBuff';
import { PetPanel } from './ui/PetPanel';
import { RenamePanel } from './ui/RenamePanel';
import { RevivalPanel } from './ui/RevivalPanel';
import { PlayerDeathOverlay } from './ui/PlayerDeathOverlay';
import { ChatBox } from './ui/ChatBox';
import { Minimap } from './ui/Minimap';
import { SkillBar } from './ui/SkillBar';
import { SkillPanel } from './ui/SkillPanel';
import { HeroCreationPanel } from './ui/HeroCreationPanel';
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
// P7 Drops + Inventory
import { DropTable } from './systems/DropTable';
import { DropItemManager } from './entities/DropItem';
import { Inventory } from './systems/Inventory';
import { PlayerLifeStateMachine } from './systems/PlayerLifeStateMachine';
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
import type { HeroProfileRecord } from './services/AuthService';
import { LocalAuthService } from './services/adapters/local/LocalAuthService';
import { LocalSaveService } from './services/adapters/local/LocalSaveService';
import { LocalSocialService } from './services/adapters/local/LocalSocialService';
import { LocalRoomService } from './services/adapters/local/LocalRoomService';
import { localKeyValueStore } from './services/adapters/local/LocalStorageKV';
import { GameSettingsRuntime } from './core/GameSettingsRuntime';
import { isAutomatedRuntime, shouldForceHeroCreationFromQuery } from './core/RuntimeLaunchFlags';
import { PanelRegistry } from './ui/PanelRegistry';
// P9 Quest + NPC
import { QuestManager, type QuestDef } from './systems/QuestManager';
import { NPCManager, type NPC } from './entities/NPC';
import { QuestPanel } from './ui/QuestPanel';
import { DialoguePanel, type DialogueActionSpec, type DialoguePanelOpenOptions } from './ui/DialoguePanel';
import { OnboardingManager } from './systems/OnboardingManager';
import { GuidanceWidget } from './ui/GuidanceWidget';
import { resolveGuidanceState, type GuidanceState } from './ui/GuidanceState';
import { UiChromeController } from './ui/UiChromeController';
import { installAdaptivePanelViewportFit } from './ui/layout/AdaptivePanelLayout';
import { initUiFeedbackSfx } from './ui/layout/UiFeedbackSfx';
import { renderUiIcon } from './ui/UiIconCatalog';
// P5 Shop
import { ShopManager } from './systems/ShopManager';
// P9 System Settings
import { SystemPanel, type SystemSettings } from './ui/SystemPanel';

type StoredHeroProfile = HeroProfileRecord;

const authService = new LocalAuthService();
const saveService = new LocalSaveService();
const socialService = new LocalSocialService();
const roomService = new LocalRoomService();

type FusionPanelType = import('./ui/FusionPanel').FusionPanel;
type EncyclopediaPanelType = import('./ui/EncyclopediaPanel').EncyclopediaPanel;
type WorldMapPanelType = import('./ui/WorldMapPanel').WorldMapPanel;
type ShopPanelType = import('./ui/ShopPanel').ShopPanel;
type CommunityPanelType = import('./ui/CommunityPanel').CommunityPanel;

function resolveSelectedHeroType(): number {
      const heroes = listRuntimeHeroTemplates();
      if (heroes.length <= 0) return 0;

      const validTypes = new Set(heroes.map((hero) => hero.type));
      const storedType = authService.loadPreferredHeroType();
      if (storedType !== null && validTypes.has(storedType)) {
            return storedType;
      }

      const fallback = heroes[0].type;
      authService.savePreferredHeroType(fallback);
      return fallback;
}

function sanitizePlayerName(raw: string, fallback: string): string {
      const cleaned = String(raw ?? '')
            .replace(/\s+/g, ' ')
            .trim()
            .slice(0, 12);
      return cleaned || fallback;
}

function loadStoredHeroProfile(): StoredHeroProfile | null {
      const heroes = listRuntimeHeroTemplates();
      if (heroes.length <= 0) return null;
      const validTypes = new Set(heroes.map((hero) => hero.type));
      const fallbackType = resolveSelectedHeroType();
      const fallbackHero = getRuntimeHeroTemplate(fallbackType);
      const fallbackName = sanitizePlayerName(fallbackHero?.name ?? '玩家', '玩家');

      const stored = authService.loadHeroProfile();
      if (stored) {
            const type = Number(stored.heroType ?? NaN);
            const heroType = Number.isFinite(type) && validTypes.has(Math.floor(type))
                  ? Math.floor(type)
                  : fallbackType;
            const playerName = sanitizePlayerName(String(stored.playerName ?? ''), fallbackName);
            return {
                  version: 1,
                  heroType,
                  playerName,
                  createdAt: String(stored.createdAt ?? new Date().toISOString()),
            };
      }

      const legacyType = authService.loadPreferredHeroType();
      if (legacyType !== null && validTypes.has(legacyType)) {
            return {
                  version: 1,
                  heroType: legacyType,
                  playerName: fallbackName,
                  createdAt: new Date().toISOString(),
            };
      }

      return null;
}

function persistHeroProfile(profile: StoredHeroProfile): void {
      const payload: StoredHeroProfile = {
            version: 1,
            heroType: Math.floor(profile.heroType),
            playerName: sanitizePlayerName(profile.playerName, '玩家'),
            createdAt: profile.createdAt || new Date().toISOString(),
      };
      authService.saveHeroProfile(payload);
}

async function ensureHeroProfile(
      schedulePanelViewportFit: () => void,
): Promise<StoredHeroProfile> {
      const heroes = listRuntimeHeroTemplates();
      if (heroes.length <= 0) {
            return {
                  version: 1,
                  heroType: 0,
                  playerName: '玩家',
                  createdAt: new Date().toISOString(),
            };
      }

      const stored = loadStoredHeroProfile();
      if (stored && !shouldForceHeroCreationFromQuery()) {
            persistHeroProfile(stored);
            return stored;
      }

      if (isAutomatedRuntime() && !shouldForceHeroCreationFromQuery()) {
            const fallback = heroes[0];
            const automatedProfile: StoredHeroProfile = {
                  version: 1,
                  heroType: Math.floor(fallback.type),
                  playerName: sanitizePlayerName(fallback.name || '玩家', '玩家'),
                  createdAt: new Date().toISOString(),
            };
            persistHeroProfile(automatedProfile);
            return automatedProfile;
      }

      const panel = new HeroCreationPanel(heroes);
      const result = await panel.show();
      const profile: StoredHeroProfile = {
            version: 1,
            heroType: Math.floor(result.heroType),
            playerName: sanitizePlayerName(result.playerName, '玩家'),
            createdAt: new Date().toISOString(),
      };
      persistHeroProfile(profile);
      schedulePanelViewportFit();
      return profile;
}

function resolveHeroStartZoneId(runtimeBirthZoneId: number): string {
      return resolveSceneZoneForRuntimeZoneId(runtimeBirthZoneId).sceneZoneId ?? 'starter_meadow';
}

function normalizeGuideName(value: string): string {
      return String(value ?? '')
            .replace(/\s+/g, '')
            .trim()
            .toLowerCase();
}

async function resolveStarterFusionGoal(starterPetNames: string[]): Promise<string | null> {
      const starterSet = new Set(
            starterPetNames
                  .map((name) => normalizeGuideName(name))
                  .filter(Boolean),
      );
      if (starterSet.size <= 0) return null;

      const { getRuntimeFusionGuideEntries } = await import('./data/runtime/RuntimeFusionGuide');
      const entries = getRuntimeFusionGuideEntries()
            .filter((entry) => {
                  const main = normalizeGuideName(entry.mainName);
                  const sub = normalizeGuideName(entry.subName);
                  return starterSet.has(main) || starterSet.has(sub);
            })
            .sort((a, b) => {
                  const aDirect = Number(starterSet.has(normalizeGuideName(a.mainName)) && starterSet.has(normalizeGuideName(a.subName)));
                  const bDirect = Number(starterSet.has(normalizeGuideName(b.mainName)) && starterSet.has(normalizeGuideName(b.subName)));
                  if (aDirect !== bDirect) return bDirect - aDirect;
                  if (a.resultLevel !== b.resultLevel) return a.resultLevel - b.resultLevel;
                  return a.resultName.localeCompare(b.resultName, 'zh-Hant');
            });

      const picked = entries[0];
      if (!picked) return null;
      return `${picked.mainName} + ${picked.subName} -> ${picked.resultName}`;
}

async function bootstrap(): Promise<void> {
      console.log('[Fantasy Pet Online] Starting...');
      initUiFeedbackSfx();
      const schedulePanelViewportFit = installAdaptivePanelViewportFit();

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
      const heroProfile = await ensureHeroProfile(schedulePanelViewportFit);
      const selectedHeroType = heroProfile.heroType;
      const selectedPlayerName = heroProfile.playerName;
      const runtimeHero = getRuntimeHeroTemplate(selectedHeroType);
      const heroArchetype = getHeroArchetypeProfile(selectedHeroType);
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
      const playerLife = new PlayerLifeStateMachine(player);
      Registry.playerLife = playerLife;
      if (runtimeHero) {
            console.log(`[Hero] Runtime template selected: type=${runtimeHero.type}, name=${runtimeHero.name}, birthZoneId=${runtimeHero.birthZoneId}, player=${selectedPlayerName}`);
      }

      // 5. Camera
      const landscapeCamera = new LandscapeCamera(Registry.scene, engineManager.canvas);
      Registry.scene.activeCamera = landscapeCamera.camera;
      mainScene.camera.dispose();

      // 6. Pets
      const petManager = new PetManager(Registry.scene, mainScene.shadowGenerator);
      petManager.giveStarterPets({
            starterPetIds: heroArchetype.starterPetIds,
      });
      Registry.petManager = petManager;
      const starterPetNames = petManager.owned.slice(0, 3).map((pet) => pet.displayName || pet.def.name);
      const playerIdentity: PlayerIdentitySnapshot = {
            playerName: selectedPlayerName,
            heroType: selectedHeroType,
            heroName: runtimeHero?.name || `Type ${selectedHeroType}`,
            roleLabel: heroArchetype.roleLabel,
            starterPetNames,
            growthGoal: '完成第一章主線，確認主寵編隊後再開始第一條融合線。',
            starterFusionGoal: await resolveStarterFusionGoal(starterPetNames),
      };
      Registry.playerIdentity = playerIdentity;
      const onboardingManager = new OnboardingManager(playerIdentity);
      Registry.onboarding = onboardingManager;

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
      hud.setPlayerIdentity(playerIdentity);
      hud.updateStats(player.stats);
      hud.updatePets(petManager);
      Registry.hud = hud;

      // 10. Minimap
      const minimap = new Minimap();

      // 11. Skill Bar (F1-F5 player + P1-P3 pets)
      const skillBar = new SkillBar();
      skillBar.setPetManager(petManager);
      skillBar.setPlayerLoadout(heroArchetype.starterSkillIds);

      // 11b. Skill Panel (config sub-panel)
      const skillPanel = new SkillPanel(skillBar, petManager);

      // 12. Chat Box
      const chatBox = new ChatBox();
      const uiChrome = new UiChromeController();

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
            selectedPlayerName,
      );
      combatLoop.setSkillBar(skillBar);

      // P7: Drop + Inventory system
      const inventory = new Inventory();
      inventory.addGold(240); // Starter gold is enough for first supply run without trivializing shop decisions.
      // Starter consumables
      inventory.addItem({ itemId: 'hp_potion_s', name: 'HP藥水(小)', type: 'consumable', rarity: 'common', qty: 2, icon: '🧪', description: 'HP +50' });
      inventory.addItem({ itemId: 'mp_potion_s', name: 'MP藥水(小)', type: 'consumable', rarity: 'common', qty: 1, icon: '💧', description: 'MP +30' });
      const onboardingStarterItemBaseline = inventory.totalItemsFound;
      const dropTable = new DropTable();
      const dropItemManager = new DropItemManager(Registry.scene, inventory);
      combatLoop.setDropSystem(dropTable, dropItemManager, inventory);
      Registry.inventory = inventory;

      // P9: Quest + NPC system
      const questManager = new QuestManager();
      Registry.questManager = questManager;
      combatLoop.setQuestManager(questManager);
      const npcManager = new NPCManager(Registry.scene);
      // NPCs are spawned by ZoneManager.buildInitialZone()
      const questPanel = new QuestPanel(questManager);
      const dialoguePanel = new DialoguePanel();
      const guidanceWidget = new GuidanceWidget();

      // P5: Shop system
      const shopManager = new ShopManager();

      const describeQuestObjective = (quest: QuestDef): string => {
            const objective = quest.objectives[0];
            if (!objective) return '先查看任務面板確認目前目標。';
            return `${objective.label}: ${objective.current}/${objective.required}`;
      };

      const buildQuestDialogueOptions = (npc: NPC): DialoguePanelOpenOptions => {
            const reportableQuest = questManager.getFirstReportableByNpc(npc.def.id);
            if (reportableQuest) {
                  const lines = [
                        `${reportableQuest.name} 已完成。`,
                        describeQuestObjective(reportableQuest),
                        reportableQuest.rewards.unlockZone
                              ? '回報後我會替你開放下一段區域，記得先補給再出發。'
                              : '回報後就能領取獎勵，準備推進下一步。',
                  ];
                  const actions: DialogueActionSpec[] = [
                        { action: 'report', label: '回報任務' },
                        { action: 'view_quest', label: '查看任務' },
                        { action: 'close', label: '結束對話', tone: 'close' },
                  ];
                  return { lines, actions };
            }

            const availableQuest = questManager.getFirstQuestByNpc(npc.def.id, ['available']);
            if (availableQuest) {
                  const lines = [
                        ...npc.def.dialogue,
                        `委託內容：${describeQuestObjective(availableQuest)}`,
                  ];
                  const actions: DialogueActionSpec[] = [
                        { action: 'accept', label: '接受任務' },
                        { action: 'view_quest', label: '查看任務' },
                        { action: 'close', label: '結束對話', tone: 'close' },
                  ];
                  return { lines, actions };
            }

            const activeQuest = questManager.getFirstQuestByNpc(npc.def.id, ['active']);
            if (activeQuest) {
                  return {
                        lines: [
                              `${activeQuest.name} 進行中。`,
                              describeQuestObjective(activeQuest),
                              activeQuest.rewards.unlockZone
                                    ? '做完記得回來找我，世界進度會在這裡正式推進。'
                                    : '先把目前目標完成，再回來回報。',
                        ],
                        actions: [
                              { action: 'view_quest', label: '查看任務' },
                              { action: 'close', label: '結束對話', tone: 'close' },
                        ],
                  };
            }

            return {
                  lines: [
                        '目前沒有新的委託。',
                        '先把手邊目標清乾淨，再回來找我。',
                  ],
                  actions: [
                        { action: 'view_quest', label: '查看任務' },
                        { action: 'close', label: '結束對話', tone: 'close' },
                  ],
            };
      };

      const buildDialogueOptions = (npc: NPC): DialoguePanelOpenOptions | undefined => {
            if (npc.def.type === 'quest') return buildQuestDialogueOptions(npc);
            return undefined;
      };

      let openShopPanelByDialogue = (mode: 'buy' | 'sell'): void => {
            console.warn('[UI] ShopPanel is not ready yet:', mode);
      };
      let openSkillPanelByDialogue = (): void => {
            skillPanel.show();
      };
      let openQuestPanelByDialogue = (questId?: string): void => {
            questPanel.show(questId);
      };
      let openPetPanelByDialogue = (): void => { };

      // Wire dialogue actions → panels
      dialoguePanel.onAction = (_npc, action) => {
            switch (action) {
                  case 'buy': openShopPanelByDialogue('buy'); break;
                  case 'sell': openShopPanelByDialogue('sell'); break;
                  case 'learn': openSkillPanelByDialogue(); break;
                  case 'accept': {
                        const acceptedQuest = questManager.acceptFirstByNpc(_npc.def.id) ?? questManager.acceptQuest('main_1');
                        openQuestPanelByDialogue(acceptedQuest?.id);
                        break;
                  }
                  case 'report': {
                        const reportableQuest = questManager.getFirstReportableByNpc(_npc.def.id);
                        if (!reportableQuest) break;
                        questPanel.claimQuest(reportableQuest.id);
                        openQuestPanelByDialogue(reportableQuest.id);
                        break;
                  }
                  case 'view_quest':
                        openQuestPanelByDialogue(
                              questManager.getFirstQuestByNpc(_npc.def.id, ['available', 'active', 'turn_in', 'complete'])?.id,
                        );
                        break;
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
            const actualDmg = playerLife.applyDamage(Math.max(1, dmg - player.stats.def * 0.5), monName);
            if (actualDmg <= 0) return;
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
      autoSettingsBtn.setAttribute('aria-label', '打開自動掛機設定');
      autoSettingsBtn.innerHTML = renderUiIcon('settings', 'auto-settings-icon');

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
      Registry.zoneManager = zoneManager;
      const teleportSystem = new TeleportSystem(zoneManager, () => player.position);

      // Wire zone manager dependencies
      zoneManager.wire({
            monsterManager,
            transition: zoneTransition,
            minimap,
            npcManager,
            dropItemManager,
            onZoneChanged: (zone) => {
                  hud.setZoneName(zone.nameCN);
            },
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
      const renamePanel = new RenamePanel();
      const revivalPanel = new RevivalPanel(petManager, inventory);
      const playerDeathOverlay = new PlayerDeathOverlay();

      // P8: Equipment + Enhance + Resonance
      const equipmentSystem = new EquipmentSystem();
      const enhanceSystem = new EnhanceSystem();
      const resonanceSystem = new ResonanceSystem();
      const statAlloc = new StatAllocation();
      const skillTree = new SkillTree();
      const awakeningSystem = new AwakeningSystem();
      const rebirthSystem = new RebirthSystem();
      const characterPanel = new CharacterPanel(player, playerIdentity, statAlloc, skillTree, awakeningSystem, rebirthSystem, {
            getPrimaryPetName: () => petManager.active[0]?.displayName ?? petManager.owned[0]?.displayName ?? null,
            getObjectiveHint: () => currentGuidanceState?.text ?? onboardingManager.currentStep?.title ?? null,
            onOpenResonance: () => {
                  closeSubPanels('resonance');
                  resonancePanel.show();
                  schedulePanelViewportFit();
            },
      });
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

      let currentGuidanceState: GuidanceState = resolveGuidanceState({
            onboarding: onboardingManager,
            questManager,
            identity: playerIdentity,
      });
      const syncGuidanceState = (): void => {
            currentGuidanceState = resolveGuidanceState({
                  onboarding: onboardingManager,
                  questManager,
                  identity: Registry.playerIdentity,
            });
            hud.setObjectiveHint(currentGuidanceState.title);
            guidanceWidget.setState(currentGuidanceState);
            characterPanel.updateIdentity(Registry.playerIdentity);
      };
      questManager.subscribe(() => {
            const starterQuest = questManager.getQuest('main_1');
            if (starterQuest?.accepted) onboardingManager.mark('meet_elder');
            syncGuidanceState();
      });
      onboardingManager.subscribe(() => {
            syncGuidanceState();
      });
      if (questManager.getQuest('main_1')?.accepted) {
            onboardingManager.mark('meet_elder');
      }
      syncGuidanceState();

      const settingsRuntime = new GameSettingsRuntime({
            joystick,
            camera: landscapeCamera,
            combat: combatLoop,
      });

      const panelRegistry = new PanelRegistry();
      Registry.panelManager = panelRegistry;
      panelRegistry.register(petPanel, { kind: 'primary', layoutKind: 'split', chromeMode: 'panel_focus', blocksGameplayInput: true });
      panelRegistry.register(dialoguePanel, { kind: 'modal', layoutKind: 'modal', chromeMode: 'dialogue_focus', blocksGameplayInput: true });
      panelRegistry.register(renamePanel, { kind: 'modal', layoutKind: 'modal', chromeMode: 'dialogue_focus', blocksGameplayInput: true });
      panelRegistry.register(revivalPanel, { kind: 'modal', layoutKind: 'modal', chromeMode: 'dialogue_focus', blocksGameplayInput: true });
      panelRegistry.register(questPanel, { kind: 'primary', layoutKind: 'detail_list', chromeMode: 'panel_focus', blocksGameplayInput: true });
      panelRegistry.register(characterPanel, { kind: 'primary', layoutKind: 'dashboard', chromeMode: 'panel_focus', blocksGameplayInput: true });
      panelRegistry.register(inventoryPanel, { kind: 'primary', layoutKind: 'split', chromeMode: 'panel_focus', blocksGameplayInput: true });
      panelRegistry.register(skillPanel, { kind: 'primary', layoutKind: 'split', chromeMode: 'panel_focus', blocksGameplayInput: true });
      panelRegistry.register(resonancePanel, { kind: 'primary', layoutKind: 'dashboard', chromeMode: 'panel_focus', blocksGameplayInput: true });
      panelRegistry.register(afkPanel, { kind: 'primary', layoutKind: 'dashboard', chromeMode: 'panel_focus', blocksGameplayInput: true });

      const syncUiChromeState = (): void => {
            if (playerLife.isDeadLike) {
                  uiChrome.setState('death');
                  return;
            }
            const panelChrome = panelRegistry.getActiveChromeMode();
            if (panelChrome === 'panel_focus' || panelChrome === 'dialogue_focus') {
                  uiChrome.setState(panelChrome);
                  return;
            }
            uiChrome.setState(combatLoop.isAutoGrind || !!player.combatTarget ? 'combat' : 'explore');
      };
      syncUiChromeState();

      let reviveSequence = 0;
      let shouldResumeAutoAfterFieldRevive = false;

      const lockCombatForDeath = (): void => {
            shouldResumeAutoAfterFieldRevive = combatLoop.isAutoGrind;
            combatLoop.setAutoGrind(false);
            combatLoop.clearTarget();
            player.combatTarget = null;
            player.setMoveDirection(Vector3.Zero());
            syncAutoUi();
      };

      const restorePlayerPosition = (x: number, z: number): void => {
            player.position.x = x;
            player.position.z = z;
            player.position.y = 0;
            player.combatTarget = null;
            combatLoop.clearTarget();
      };

      const finishRevive = (message: string, hpRatio: number, mpRatio: number, autoResume = false): void => {
            playerLife.completeRevive({
                  hpRatio,
                  mpRatio,
                  invulnerabilitySec: 6,
            });
            hud.updateStats(player.stats);
            playerDeathOverlay.hide();
            playerDeathOverlay.showReviveBanner(message);
            if (autoResume) {
                  combatLoop.setAutoGrind(true);
                  syncAutoUi();
            } else {
                  syncAutoUi();
            }
      };

      const reviveInPlace = async (autoResume = false): Promise<void> => {
            if (!playerLife.queueRevive('field')) return;
            const seq = ++reviveSequence;
            playerDeathOverlay.showPending('原地復活中...');
            try {
                  await new Promise((resolve) => window.setTimeout(resolve, autoResume ? 900 : 500));
                  if (seq !== reviveSequence) return;
                  const point = zoneManager.getSafeRespawnPoint();
                  restorePlayerPosition(point.x, point.z);
                  finishRevive('原地復活完成，6 秒內不受傷害。', autoResume ? 0.55 : 0.7, 0.45, autoResume);
            } catch (error) {
                  console.error('[Life] Field revive failed:', error);
                  playerLife.cancelPendingRevive();
                  showDeathChoices();
            }
      };

      const reviveInTown = async (): Promise<void> => {
            if (!playerLife.queueRevive('town')) return;
            const seq = ++reviveSequence;
            playerDeathOverlay.showPending('回城復活中...');
            try {
                  const townZoneId = zoneManager.findNearestTownZoneId();
                  if (zoneManager.currentZone.id === townZoneId) {
                        const point = zoneManager.getSpawnPoint(townZoneId);
                        restorePlayerPosition(point.x, point.z);
                  } else {
                        await zoneManager.travelTo(townZoneId, { ignoreLock: true });
                  }
                  if (seq !== reviveSequence) return;
                  finishRevive(`已回到 ${zoneManager.currentZone.nameCN}，獲得 6 秒保護。`, 1, 1, false);
            } catch (error) {
                  console.error('[Life] Town revive failed:', error);
                  playerLife.cancelPendingRevive();
                  showDeathChoices();
            }
      };

      const showDeathChoices = (): void => {
            playerDeathOverlay.showDown(playerLife.sourceName, {
                  onReviveHere: () => { void reviveInPlace(false); },
                  onReturnTown: () => { void reviveInTown(); },
                  onStop: () => {
                        shouldResumeAutoAfterFieldRevive = false;
                        syncAutoUi();
                        playerDeathOverlay.showReviveBanner('已停止掛機，請手動選擇復活方式。');
                  },
            });
      };

      playerLife.onStateChange(({ state }) => {
            if (state === 'down') {
                  lockCombatForDeath();
                  const deathAction = shouldResumeAutoAfterFieldRevive ? afkPanel.settings.deathAction : 'stop';
                  if (deathAction === 'revive') {
                        void reviveInPlace(true);
                        return;
                  }
                  if (deathAction === 'town') {
                        shouldResumeAutoAfterFieldRevive = false;
                        void reviveInTown();
                        return;
                  }
                  showDeathChoices();
                  return;
            }

            if (state === 'alive') {
                  playerDeathOverlay.hide();
            }
      });

      // System Settings Panel
      const systemPanel = new SystemPanel({
            onSettingsChange: (settings) => {
                  settingsRuntime.apply(settings);
                  console.log('[System] Settings applied:', settings);
            },
            getAccountView: () => {
                  const profile = loadStoredHeroProfile();
                  return {
                        ...authService.getAccountSummary(),
                        currentHeroType: profile?.heroType ?? resolveSelectedHeroType() ?? selectedHeroType,
                        socialNote: socialService.getAvailability().reason,
                        roomNote: roomService.getAvailability().reason,
                  };
            },
            onHeroTypeChange: async (heroType) => {
                  const currentProfile = loadStoredHeroProfile();
                  persistHeroProfile({
                        version: 1,
                        heroType: Math.floor(heroType),
                        playerName: currentProfile?.playerName ?? selectedPlayerName,
                        createdAt: currentProfile?.createdAt ?? new Date().toISOString(),
                  });
                  console.log(`[System] Hero template changed to type=${heroType}. Restart required to apply.`);
                  return {
                        ok: true,
                        message: '已更新職業模板，重開後生效',
                  };
            },
            onSaveProgress: async () => {
                  const result = saveService.save({
                        player,
                        inventory,
                        petManager,
                        statAlloc,
                        skillTree,
                        awakening: awakeningSystem,
                        rebirth: rebirthSystem,
                        getSystemSettings: () => systemPanel.settings,
                        getAfkState: () => afkPanel.exportState(),
                        getOnboardingState: () => onboardingManager.exportState(),
                        getQuestState: () => questManager.exportState(),
                        getHeroProfile: () => loadStoredHeroProfile(),
                        getWorldState: () => ({
                              ...zoneManager.exportState(),
                              questChapter: player.stats.questChapter,
                        }),
                  });
                  if (result.ok) console.log(`[System] Save completed at ${result.savedAt}`);
                  else console.warn(`[System] Save failed: ${result.message}`);
                  return result;
            },
            onLoadProgress: async () => {
                  const result = await saveService.load({
                        player,
                        inventory,
                        petManager,
                        statAlloc,
                        skillTree,
                        awakening: awakeningSystem,
                        rebirth: rebirthSystem,
                        applySystemSettings: (settings) => systemPanel.applySettings(settings),
                        applyAfkState: (state) => afkPanel.importState(state),
                        applyOnboardingState: (state) => onboardingManager.importState(state),
                        applyQuestState: (state) => questManager.importState(state),
                        applyHeroProfile: (profile) => {
                              if (profile) persistHeroProfile(profile);
                        },
                        applyWorldState: async (state) => {
                              if (!state) return;
                              await zoneManager.importState(state);
                              hud.setZoneName(zoneManager.currentZone.nameCN);
                        },
                  });
                  if (result.ok) {
                        console.log(`[System] Load completed from ${result.savedAt}`);
                        playerLife.syncFromStats();
                        if (!playerLife.isDeadLike) playerDeathOverlay.hide();
                        petPanel.refresh();
                        hud.updateStats(player.stats);
                        hud.updatePets(petManager);
                        schedulePanelViewportFit();
                  } else {
                        console.warn(`[System] Load failed: ${result.message}`);
                  }
                  return result;
            },
            onResetAll: async () => {
                  console.log('[System] Reset all data requested');
                  const gameKeys = localKeyValueStore.keys().filter((key) => /^fpo([._]|$)/.test(key));
                  saveService.clear();
                  gameKeys.forEach((key) => localKeyValueStore.remove(key));
                  console.log(`[System] Cleared ${gameKeys.length} game storage keys`);
                  window.setTimeout(() => location.reload(), 80);
                  return {
                        ok: true,
                        message: '已清除本機資料，正在重新載入',
                  };
            },
            onOpenSocialPreview: () => {
                  void openCommunityPanel();
            },
      });
      panelRegistry.register(systemPanel, { kind: 'primary', layoutKind: 'dashboard', chromeMode: 'panel_focus', blocksGameplayInput: true });
      settingsRuntime.apply(systemPanel.settings);

      // Heavy data panels are lazy-loaded on first use to reduce initial startup cost.
      let fusionPanel: FusionPanelType | null = null;
      let fusionPanelLoading: Promise<FusionPanelType> | null = null;
      let encyclopediaPanel: EncyclopediaPanelType | null = null;
      let encyclopediaPanelLoading: Promise<EncyclopediaPanelType> | null = null;
      let worldMapPanel: WorldMapPanelType | null = null;
      let worldMapPanelLoading: Promise<WorldMapPanelType> | null = null;
      let shopPanel: ShopPanelType | null = null;
      let shopPanelLoading: Promise<ShopPanelType> | null = null;
      let communityPanel: CommunityPanelType | null = null;
      let communityPanelLoading: Promise<CommunityPanelType> | null = null;

      async function ensureShopPanel(): Promise<ShopPanelType> {
            if (shopPanel) return shopPanel;
            if (shopPanelLoading) return shopPanelLoading;
            shopPanelLoading = import('./ui/ShopPanel')
                  .then(({ ShopPanel }) => {
                        const panel = new ShopPanel(shopManager, inventory);
                        panelRegistry.register(panel, { kind: 'primary', layoutKind: 'split', chromeMode: 'panel_focus', blocksGameplayInput: true });
                        shopPanel = panel;
                        return panel;
                  })
                  .finally(() => {
                        shopPanelLoading = null;
                  });
            return shopPanelLoading;
      }

      async function ensureCommunityPanel(): Promise<CommunityPanelType> {
            if (communityPanel) return communityPanel;
            if (communityPanelLoading) return communityPanelLoading;
            communityPanelLoading = import('./ui/CommunityPanel')
                  .then(({ CommunityPanel }) => {
                        const panel = new CommunityPanel();
                        panelRegistry.register(panel, { kind: 'primary', layoutKind: 'dashboard', chromeMode: 'panel_focus', blocksGameplayInput: true });
                        communityPanel = panel;
                        return panel;
                  })
                  .finally(() => {
                        communityPanelLoading = null;
                  });
            return communityPanelLoading;
      }

      async function ensureFusionPanel(): Promise<FusionPanelType> {
            if (fusionPanel) return fusionPanel;
            if (fusionPanelLoading) return fusionPanelLoading;
            fusionPanelLoading = import('./ui/FusionPanel')
                  .then(({ FusionPanel }) => {
                        const panel = new FusionPanel(petManager);
                        panel.setMapNavigator((mapName, petName) => {
                              void openWorldMapAt(mapName, petName);
                        });
                        panelRegistry.register(panel, { kind: 'primary', layoutKind: 'split', chromeMode: 'panel_focus', blocksGameplayInput: true });
                        fusionPanel = panel;
                        return panel;
                  })
                  .finally(() => {
                        fusionPanelLoading = null;
                  });
            return fusionPanelLoading;
      }

      async function ensureEncyclopediaPanel(): Promise<EncyclopediaPanelType> {
            if (encyclopediaPanel) return encyclopediaPanel;
            if (encyclopediaPanelLoading) return encyclopediaPanelLoading;
            encyclopediaPanelLoading = import('./ui/EncyclopediaPanel')
                  .then(({ EncyclopediaPanel }) => {
                        const panel = new EncyclopediaPanel(encyclopedia);
                        panel.setNavigationHandlers({
                              onOpenRecipe: (petName, sourceMap) => {
                                    void openFusionByTarget(petName, sourceMap);
                              },
                              onOpenMap: (mapName, petName) => {
                                    void openWorldMapAt(mapName, petName);
                              },
                        });
                        panelRegistry.register(panel, { kind: 'primary', layoutKind: 'split', chromeMode: 'panel_focus', blocksGameplayInput: true });
                        encyclopediaPanel = panel;
                        return panel;
                  })
                  .finally(() => {
                        encyclopediaPanelLoading = null;
                  });
            return encyclopediaPanelLoading;
      }

      async function ensureWorldMapPanel(): Promise<WorldMapPanelType> {
            if (worldMapPanel) return worldMapPanel;
            if (worldMapPanelLoading) return worldMapPanelLoading;
            worldMapPanelLoading = import('./ui/WorldMapPanel')
                  .then(({ WorldMapPanel }) => {
                        const panel = new WorldMapPanel(zoneManager);
                        panel.setNavigationHandlers({
                              onOpenEncyclopedia: (petName, mapName) => {
                                    void openEncyclopediaPetByName(petName, mapName);
                              },
                              onOpenFusionByIngredient: (petName, mapName) => {
                                    void openFusionByIngredient(petName, mapName);
                              },
                              onOpenFusionByTarget: (targetName, mapName) => {
                                    void openFusionByTarget(targetName, mapName);
                              },
                        });
                        panelRegistry.register(panel, { kind: 'primary', layoutKind: 'split', chromeMode: 'panel_focus', blocksGameplayInput: true });
                        worldMapPanel = panel;
                        return panel;
                  })
                  .finally(() => {
                        worldMapPanelLoading = null;
                  });
            return worldMapPanelLoading;
      }

      // Global panel rule: opening one sub-panel closes others to avoid overlap.
      function closeSubPanels(except?: string): void {
            panelRegistry.hideAllExcept(except);
            syncUiChromeState();
            syncAutoUi();
            schedulePanelViewportFit();
      }

      npcManager.onInteract = (npc) => {
            closeSubPanels('dialogue');
            hud.flashFocusBanner(npc.def.name, '互動中');
            dialoguePanel.openForNpc(npc, buildDialogueOptions(npc));
            schedulePanelViewportFit();
      };

      function openPetPanel(): void {
            closeSubPanels('pet');
            petPanel.open();
            petPanel.refresh();
            onboardingManager.mark('open_pet_panel');
            schedulePanelViewportFit();
      }

      async function openCommunityPanel(): Promise<void> {
            closeSubPanels('community');
            const panel = await ensureCommunityPanel();
            panel.show();
            schedulePanelViewportFit();
      }

      async function openShopPanel(mode: 'buy' | 'sell' | 'craft' = 'buy'): Promise<void> {
            closeSubPanels('shop');
            try {
                  const panel = await ensureShopPanel();
                  await panel.show(mode);
                  onboardingManager.mark('visit_shop');
                  schedulePanelViewportFit();
            } catch (err) {
                  console.error('[UI] Failed to open ShopPanel:', err);
            }
      }

      async function openFusionPanel(): Promise<void> {
            closeSubPanels('fusion');
            try {
                  const panel = await ensureFusionPanel();
                  panel.refresh();
                  panel.open();
                  onboardingManager.mark('view_fusion_goal');
                  schedulePanelViewportFit();
            } catch (err) {
                  console.error('[UI] Failed to open FusionPanel:', err);
            }
      }

      async function openFusionByTarget(targetName: string, sourceMap?: string): Promise<void> {
            closeSubPanels('fusion');
            try {
                  const panel = await ensureFusionPanel();
                  panel.openToRecipesByTargetName(targetName, sourceMap);
                  onboardingManager.mark('view_fusion_goal');
                  schedulePanelViewportFit();
            } catch (err) {
                  console.error('[UI] Failed to open Fusion by target:', err);
            }
      }

      async function openFusionByIngredient(ingredientName: string, sourceMap?: string): Promise<void> {
            closeSubPanels('fusion');
            try {
                  const panel = await ensureFusionPanel();
                  panel.openToRecipesByIngredientName(ingredientName, sourceMap);
                  onboardingManager.mark('view_fusion_goal');
                  schedulePanelViewportFit();
            } catch (err) {
                  console.error('[UI] Failed to open Fusion by ingredient:', err);
            }
      }

      async function openEncyclopediaPanel(): Promise<void> {
            closeSubPanels('book');
            try {
                  const panel = await ensureEncyclopediaPanel();
                  panel.open();
                  schedulePanelViewportFit();
            } catch (err) {
                  console.error('[UI] Failed to open EncyclopediaPanel:', err);
            }
      }

      async function openEncyclopediaPetByName(petName: string, mapName?: string): Promise<void> {
            closeSubPanels('book');
            try {
                  const panel = await ensureEncyclopediaPanel();
                  panel.openPetByName(petName, mapName);
                  schedulePanelViewportFit();
            } catch (err) {
                  console.error('[UI] Failed to open Encyclopedia pet detail:', err);
            }
      }

      async function openWorldMapPanel(): Promise<void> {
            closeSubPanels('map');
            try {
                  const panel = await ensureWorldMapPanel();
                  panel.show();
                  schedulePanelViewportFit();
            } catch (err) {
                  console.error('[UI] Failed to open WorldMapPanel:', err);
            }
      }

      async function openWorldMapAt(mapName: string, petName?: string): Promise<void> {
            closeSubPanels('map');
            try {
                  const panel = await ensureWorldMapPanel();
                  panel.openAtMap(mapName, petName);
                  schedulePanelViewportFit();
            } catch (err) {
                  console.error('[UI] Failed to open WorldMap target:', err);
            }
      }

      openShopPanelByDialogue = (mode) => {
            void openShopPanel(mode);
      };
      openSkillPanelByDialogue = () => {
            closeSubPanels('skill');
            skillPanel.show();
            schedulePanelViewportFit();
      };
      openQuestPanelByDialogue = (questId?: string) => {
            closeSubPanels('quest');
            questPanel.show(questId);
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
            syncUiChromeState();
            syncAutoUi();
            schedulePanelViewportFit();
      };

      // Re-wire callbacks with exclusive-open behavior.
      petPanel.onOpenFusion = () => { void openFusionPanel(); };
      petPanel.onOpenEncyclopedia = () => { void openEncyclopediaPanel(); };
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
      hud.getNavButton('nav-book')?.addEventListener('click', () => { void openEncyclopediaPanel(); });
      hud.getNavButton('nav-settings')?.addEventListener('click', () => {
            closeSubPanels('settings');
            systemPanel.show();
            schedulePanelViewportFit();
      });
      hud.getNavButton('nav-shop')?.addEventListener('click', () => {
            void openShopPanel('buy');
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
            void openWorldMapPanel();
      });
      hud.getNavButton('nav-skill')?.addEventListener('click', () => {
            closeSubPanels('skill');
            skillPanel.show();
            schedulePanelViewportFit();
      });
      guidanceWidget.setActionHandler((state) => {
            switch (state.action) {
                  case 'shop':
                        void openShopPanel('buy');
                        break;
                  case 'pet':
                        openPetPanel();
                        break;
                  case 'fusion':
                        void openFusionPanel();
                        break;
                  case 'character':
                        closeSubPanels('char');
                        characterPanel.show();
                        schedulePanelViewportFit();
                        break;
                  case 'quest':
                  default:
                        closeSubPanels('quest');
                        questPanel.show(state.relatedQuestId ?? undefined);
                        schedulePanelViewportFit();
                        break;
            }
      });

      // Expose concise state for automated game checks.
      (window as any).render_game_to_text = (): string => {
            const visiblePanels = panelRegistry.getVisibilitySnapshot();
            const starterMainQuest = questManager.getQuest('main_1');
            const payload = {
                  mode: document.getElementById('loading-screen') ? 'loading' : 'play',
                  viewport: {
                        width: window.innerWidth || 0,
                        height: window.innerHeight || 0,
                        orientation: (window.innerWidth || 0) >= (window.innerHeight || 0) ? 'landscape' : 'portrait',
                  },
                  zone: {
                        id: zoneManager.currentZone.id,
                        name: zoneManager.currentZone.name,
                        sceneZoneId: zoneManager.currentZone.id,
                        runtimeZoneIds: zoneManager.currentZone.runtimeZoneIds,
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
                        lifeState: playerLife.state,
                        playerDead: playerLife.isDeadLike,
                        invulnerabilitySec: Number(playerLife.remainingInvulnerabilitySec.toFixed(1)),
                  },
                  world: {
                        aliveMonsters: monsterManager.alive.length,
                        inventoryCount: inventory.count,
                        autoGrind: combatLoop.isAutoGrind,
                  },
                  pets: {
                        owned: petManager.owned.length,
                        deadCount: petManager.owned.filter((pet) => pet.isDead).length,
                  },
                  currentPanel: panelRegistry.getCurrentPanel(),
                  modalStack: panelRegistry.getModalStack(),
                  uiChromeState: uiChrome.state,
                  primaryNavMode: uiChrome.snapshot.primaryNavMode,
                  guidanceSource: currentGuidanceState.source,
                  guidanceText: currentGuidanceState.text,
                  identity: {
                        playerName: playerIdentity.playerName,
                        roleLabel: playerIdentity.roleLabel,
                  },
                  onboarding: {
                        completed: onboardingManager.progress.completed,
                        total: onboardingManager.progress.total,
                        currentStep: onboardingManager.currentStep?.id ?? null,
                  },
                  quests: {
                        starterMainStatus: starterMainQuest ? questManager.getStatus(starterMainQuest) : null,
                        reportableCount: questManager.allQuests.filter((quest) => questManager.getStatus(quest) === 'turn_in').length,
                  },
                  settingsApplied: settingsRuntime.snapshot,
                  autoConfig: combatLoop.getAutoConfig(),
                  openPanels: {
                        quest: visiblePanels.quest ?? false,
                        inventory: visiblePanels.bag ?? false,
                        bag: visiblePanels.bag ?? false,
                        skill: visiblePanels.skill ?? false,
                        system: visiblePanels.settings ?? false,
                        settings: visiblePanels.settings ?? false,
                        pet: visiblePanels.pet ?? false,
                        map: visiblePanels.map ?? false,
                        shop: visiblePanels.shop ?? false,
                        community: visiblePanels.community ?? false,
                        character: visiblePanels.char ?? false,
                        char: visiblePanels.char ?? false,
                        afk: visiblePanels.afk ?? false,
                        fusion: visiblePanels.fusion ?? false,
                        book: visiblePanels.book ?? false,
                        resonance: visiblePanels.resonance ?? false,
                        dialogue: visiblePanels.dialogue ?? false,
                        rename: visiblePanels.rename ?? false,
                        revival: visiblePanels.revival ?? false,
                  },
            };
            return JSON.stringify(payload);
      };
      (window as any).__fpoDebug = {
            damagePlayer: (amount = 999, sourceName = 'debug') => playerLife.applyDamage(amount, sourceName),
            reviveHere: () => { void reviveInPlace(false); },
            reviveTown: () => { void reviveInTown(); },
            killPet: (index = 0) => {
                  const pet = petManager.owned[index];
                  if (!pet) return false;
                  pet.kill();
                  petPanel.refresh();
                  revivalPanel.refresh();
                  hud.updatePets(petManager);
                  return true;
            },
            openRevivalPanel: () => {
                  closeSubPanels('revival');
                  revivalPanel.open(() => petPanel.refresh());
                  return true;
            },
            openNpcDialogue: (npcId = 'npc_quest_01') => {
                  const npc = npcManager.getNpcById(npcId);
                  if (!npc) return false;
                  closeSubPanels('dialogue');
                  dialoguePanel.openForNpc(npc, buildDialogueOptions(npc));
                  return true;
            },
            prepareQuestTurnIn: (npcId = 'npc_quest_01') => {
                  const quest = questManager.acceptFirstByNpc(npcId);
                  if (!quest) return null;
                  for (const objective of quest.objectives) {
                        const missing = Math.max(0, objective.required - objective.current);
                        for (let i = 0; i < missing; i += 1) {
                              if (objective.type === 'kill') {
                                    questManager.trackKill(objective.target === 'any' || objective.target === 'boss' ? 'smoke_target' : objective.target, objective.target === 'boss');
                              } else if (objective.type === 'collect') {
                                    questManager.trackCollect(objective.target === 'any_material' ? 'herb' : objective.target);
                              }
                        }
                  }
                  return questManager.getFirstReportableByNpc(npcId)?.id ?? null;
            },
            openResonancePanel: () => {
                  closeSubPanels('resonance');
                  resonancePanel.show();
                  return true;
            },
            openFusionPanel: () => {
                  void openFusionPanel();
                  return true;
            },
            openBookPanel: () => {
                  void openEncyclopediaPanel();
                  return true;
            },
            openCommunityPanel: () => {
                  void openCommunityPanel();
                  return true;
            },
            travelToZone: async (zoneId: string, ignoreLock = true) => {
                  if (!zoneId) return false;
                  await zoneManager.travelTo(zoneId, { ignoreLock });
                  return zoneManager.currentZone.id === zoneId;
            },
            openCharacterPanel: () => {
                  closeSubPanels('char');
                  characterPanel.show();
                  return true;
            },
            getPlayerLife: () => ({
                  state: playerLife.state,
                  sourceName: playerLife.sourceName,
                  invulnerabilitySec: Number(playerLife.remainingInvulnerabilitySec.toFixed(1)),
                  hp: player.stats.hp,
                  maxHp: player.stats.maxHp,
                  zoneId: zoneManager.currentZone.id,
            }),
            getEconomy: () => ({
                  gold: inventory.gold,
                  deadPets: petManager.owned
                        .filter((pet) => pet.isDead)
                        .map((pet) => ({ name: pet.displayName, cost: pet.revivalCost })),
            }),
            applySettings: (partial: Partial<SystemSettings>) => {
                  const next = { ...systemPanel.settings, ...partial };
                  systemPanel.applySettings(next);
                  return systemPanel.settings;
            },
            getCameraState: () => ({
                  alpha: Number(landscapeCamera.camera.alpha.toFixed(4)),
                  beta: Number(landscapeCamera.camera.beta.toFixed(4)),
            }),
      };

      // 16. Fade out loading screen
      const loadingScreen = document.getElementById('loading-screen');
      if (loadingScreen) {
            loadingScreen.classList.add('fade-out');
            setTimeout(() => loadingScreen.remove(), 1000);
      }

      // Game loop
      let lastTime = performance.now();
      let hudUpdateTimer = 0;
      let minimapUpdateTimer = 0;
      let onboardingSyncTimer = 0;
      const HUD_UPDATE_INTERVAL = 1 / 15;
      const MINIMAP_UPDATE_INTERVAL = 1 / 10;
      const ONBOARDING_SYNC_INTERVAL = 0.2;
      Registry.scene.onBeforeRenderObservable.add(() => {
            const now = performance.now();
            const dt = (now - lastTime) / 1000;
            lastTime = now;
            syncUiChromeState();

            // Joystick → Player movement
            playerLife.update(dt);
            player.setMoveDirection(playerLife.isDeadLike ? Vector3.Zero() : joystick.direction);
            player.update(dt);

            // Camera follow
            landscapeCamera.update(dt, player.position);

            // Update pets
            petManager.update(dt, player.position);

            // P5: Update combat systems
            projectileSystem.update(dt);
            monsterManager.update(dt, player.position);
            if (!playerLife.isDeadLike) {
                  combatLoop.update(dt);
            }

            // Update skill bar CD overlays
            skillBar.update(dt);

            // UI updates are throttled to reduce mobile frame drops.
            hudUpdateTimer += dt;
            if (hudUpdateTimer >= HUD_UPDATE_INTERVAL) {
                  hudUpdateTimer = 0;
                  hud.updateStats(player.stats);
                  hud.updatePets(petManager);
            }

            onboardingSyncTimer += dt;
            if (onboardingSyncTimer >= ONBOARDING_SYNC_INTERVAL) {
                  onboardingSyncTimer = 0;
                  if (inventory.totalKills > 0) onboardingManager.mark('win_first_battle');
                  if (inventory.totalItemsFound > onboardingStarterItemBaseline) onboardingManager.mark('pickup_first_drop');
            }

            minimapUpdateTimer += dt;
            if (minimapUpdateTimer >= MINIMAP_UPDATE_INTERVAL) {
                  minimapUpdateTimer = 0;
                  const radarMonsters: Array<{ x: number; z: number; isBoss: boolean }> = [];
                  for (const monster of monsterManager.all) {
                        if (monster.isDead) continue;
                        radarMonsters.push({
                              x: monster.root.position.x,
                              z: monster.root.position.z,
                              isBoss: monster.def.isBoss,
                        });
                  }
                  minimap.updatePosition(
                        player.position.x,
                        player.position.z,
                        radarMonsters,
                        npcManager.getPositions(),
                  );
            }

            // P6: Teleport gate proximity check
            if (!playerLife.isDeadLike) {
                  teleportSystem.update(dt);
            }

            // P7: Drop item pickup
            if (!playerLife.isDeadLike) {
                  dropItemManager.update(dt, player.position);
            }

            // P9: NPC billboard + proximity
            npcManager.update(dt, player.position);

      });

      // Start render loop
      engineManager.startRenderLoop();
      schedulePanelViewportFit();

      console.log('[Fantasy Pet Online] P9 Ready — Quests + NPCs + Dialogue');
}

bootstrap().catch(err => {
      console.error('[Fantasy Pet Online] Fatal error:', err);
});
