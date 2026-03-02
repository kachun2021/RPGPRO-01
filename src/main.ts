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

      // 11. Skill Bar (F1-F8)
      const skillBar = new SkillBar();

      // 12. Chat Box
      const chatBox = new ChatBox();

      // 13. PanelManager
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
      for (const id of ['nav-book', 'nav-shop', 'nav-char', 'nav-bag', 'nav-skill', 'nav-community', 'nav-quest', 'nav-map']) {
            hud.getNavButton(id)?.addEventListener('click', () => console.log(`[Nav] ${id}`));
      }

      // 16. Fade out loading screen
      const loadingScreen = document.getElementById('loading-screen');
      if (loadingScreen) {
            loadingScreen.classList.add('fade-out');
            setTimeout(() => loadingScreen.remove(), 1000);
      }

      // 17. Game loop
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

            // Update HUD portraits
            hud.updateStats(player.stats);
            hud.updatePets(petManager);

            // Update minimap coordinates
            minimap.updatePosition(player.position.x, player.position.z);
      });

      // 18. Start render loop
      engineManager.startRenderLoop();

      console.log('[Fantasy Pet Online] Stone Age UI Ready — Portraits + Minimap + SkillBar + Chat + Monster Info');
}

bootstrap().catch(err => {
      console.error('[Fantasy Pet Online] Fatal error:', err);
});
