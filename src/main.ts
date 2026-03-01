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
import { PetControlBar } from './ui/PetControlBar';

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

      // 5. Camera (replace MainScene's default camera)
      const landscapeCamera = new LandscapeCamera(Registry.scene, engineManager.canvas);
      Registry.scene.activeCamera = landscapeCamera.camera;
      mainScene.camera.dispose();

      // 6. Pets
      const petManager = new PetManager(Registry.scene, mainScene.shadowGenerator);
      petManager.giveStarterPets();
      Registry.petManager = petManager;

      // 7. Pet Control Bar
      const petControlBar = new PetControlBar();
      petControlBar.updateSlots(petManager);

      // 8. Input
      const joystick = new TouchJoystick();

      // 7. HUD
      const hud = new HUD();
      hud.updateStats(player.stats);
      Registry.hud = hud;

      // 8. PanelManager
      const panelManager = new PanelManager();
      Registry.panelManager = panelManager;

      // 9. Wire nav buttons to PanelManager (toggle placeholders for now)
      const navIds = ['nav-char', 'nav-bag', 'nav-quest', 'nav-pet', 'nav-shop', 'nav-chat', 'nav-settings'];
      for (const id of navIds) {
            hud.getNavButton(id)?.addEventListener('click', () => {
                  console.log(`[Nav] ${id} clicked`);
                  // Panels implemented in later prompts
            });
      }

      // 10. Fade out loading screen
      const loadingScreen = document.getElementById('loading-screen');
      if (loadingScreen) {
            loadingScreen.classList.add('fade-out');
            setTimeout(() => loadingScreen.remove(), 1000);
      }

      // 11. Game loop
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

            // Update HUD
            hud.updateStats(player.stats);
            petControlBar.updateSlots(petManager);
      });

      // 14. Start render loop
      engineManager.startRenderLoop();

      console.log('[Fantasy Pet Online] P3 Ready — Pets + 8 Series + 3 Active');
}

bootstrap().catch(err => {
      console.error('[Fantasy Pet Online] Fatal error:', err);
});
