import { EngineManager } from './core/EngineManager';
import { Registry } from './core/Registry';
import { OrientationManager } from './core/OrientationManager';
import { MainScene } from './scenes/MainScene';
import { Player } from './entities/Player';
import { LandscapeCamera } from './input/LandscapeCamera';
import { TouchJoystick } from './input/TouchJoystick';
import { HUD } from './ui/HUD';
import { PanelManager } from './ui/PanelManager';
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

async function bootstrap(): Promise<void> {
      console.log('[Fantasy Pet Online] Starting...');

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

      // Wire monster damage to player
      monsterManager.onDamagePlayer = (dmg: number, monName: string) => {
            const actualDmg = Math.max(1, dmg - player.stats.def * 0.5);
            player.stats.hp = Math.max(0, player.stats.hp - actualDmg);
            console.log('[Combat] ' + monName + ' hit player for ' + Math.round(actualDmg));
      };

      // Auto-grind toggle button
      const autoGrindBtn = document.createElement('button');
      autoGrindBtn.id = 'auto-grind-btn';
      autoGrindBtn.className = 'interactive auto-grind-btn';
      autoGrindBtn.textContent = 'AUTO';
      autoGrindBtn.addEventListener('click', () => {
            combatLoop.toggleAutoGrind();
            autoGrindBtn.classList.toggle('active', combatLoop.isAutoGrind);
            autoGrindBtn.textContent = combatLoop.isAutoGrind ? 'AUTO ON' : 'AUTO';
      });
      document.getElementById('ui-layer')?.appendChild(autoGrindBtn);

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

      // 14. PanelManager
      const panelManager = new PanelManager();
      Registry.panelManager = panelManager;

      // 14. Pet Panel
      const petPanel = new PetPanel(petManager, encyclopedia, petEquipment, petBuff);

      // 15. Sub-Panels (Fusion / Encyclopedia / Rename / Revival)
      const fusionPanel = new FusionPanel(petManager);
      const encyclopediaPanel = new EncyclopediaPanel(encyclopedia);
      const renamePanel = new RenamePanel();
      const revivalPanel = new RevivalPanel(petManager);

      // FusionPanel manages itself (own backdrop + open/close), NOT via PanelManager
      panelManager.register('encyclopedia', encyclopediaPanel.element);
      panelManager.register('rename', renamePanel.element);
      panelManager.register('revival', revivalPanel.element);

      // Wire PetPanel action buttons → sub-panels
      petPanel.onOpenFusion = () => {
            fusionPanel.refresh();
            fusionPanel.open();
      };
      petPanel.onOpenEncyclopedia = () => {
            encyclopediaPanel.open();
      };
      petPanel.onOpenRename = (pet) => {
            renamePanel.openFor(pet, () => petPanel.refresh());
      };
      petPanel.onOpenRevival = () => {
            revivalPanel.open(() => petPanel.refresh());
      };

      // Wire nav buttons
      hud.getNavButton('nav-pet')?.addEventListener('click', () => {
            petPanel.toggle();
            petPanel.refresh();
      });
      hud.getNavButton('nav-settings')?.addEventListener('click', () => console.log('[Nav] settings'));
      for (const id of ['nav-book', 'nav-shop', 'nav-char', 'nav-bag', 'nav-community', 'nav-quest']) {
            hud.getNavButton(id)?.addEventListener('click', () => console.log(`[Nav] ${id}`));
      }
      hud.getNavButton('nav-map')?.addEventListener('click', () => {
            worldMapPanel.toggle();
      });
      hud.getNavButton('nav-skill')?.addEventListener('click', () => {
            skillPanel.toggle();
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

            // Update minimap coordinates
            minimap.updatePosition(player.position.x, player.position.z);

            // P6: Teleport gate proximity check
            teleportSystem.update(dt);
      });

      // Start render loop
      engineManager.startRenderLoop();

      console.log('[Fantasy Pet Online] P6 Zone World Ready — 17 Zones + Teleport + WorldMap');
}

bootstrap().catch(err => {
      console.error('[Fantasy Pet Online] Fatal error:', err);
});
