import * as THREE from 'three';
import { TerrainManager } from './core/TerrainManager';
import { PathManager } from './core/PathManager';
import { GridRenderer } from './core/GridRenderer';
import { CameraControls } from './core/CameraControls';
import { AnimalManager } from './zoo/AnimalManager';
import { GuestManager } from './zoo/GuestManager';
import { StaffManager } from './core/StaffManager';
import { SceneryManager } from './core/SceneryManager';
import { FenceManager } from './core/FenceManager';
import { EconomyManager } from './core/EconomyManager';
import { AudioManager } from './core/AudioManager';
import { UIManager } from './ui/UIManager';
import { MainMenu } from './ui/MainMenu';
import { GameState, StateManager } from './core/GameState';
import { StatusWindow } from './ui/StatusWindow';
import { EditorManager } from './core/EditorManager';
import { Pathfinder } from './core/Pathfinder';

const WHITELIST = [
    'afrbuf', 'gorilla', 'lion', 'tiger', 'chimpanz', 'eleph', 'giraffe', 'hippo', 'ostrich', 'zebra',
    'gallim', 'plateo', 'asieleph', 'bongo', 'yeti', 'baracuda', 'reindeer', 'mtnlion', 'llama', 'blckbuck'
];

const status = document.createElement('div');
status.style.position = 'absolute';
status.style.top = '10px';
status.style.left = '10px';
status.style.color = 'white';
status.style.fontSize = '18px';
status.style.fontFamily = 'monospace';
status.style.background = 'rgba(0,0,0,0.7)';
status.style.padding = '10px';
status.style.zIndex = '100';
status.innerHTML = 'Zoo Tycoon: Loading...';
document.body.appendChild(status);

const scene = new THREE.Scene();
const aspect = window.innerWidth / window.innerHeight;
const frustumSize = 100;
const camera = new THREE.OrthographicCamera(
    frustumSize * aspect / -2, frustumSize * aspect / 2,
    frustumSize / 2, frustumSize / -2,
    0.1, 1000
);

camera.position.set(100, 100, 100);
camera.lookAt(0, 0, 0);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(0x000000);
document.body.appendChild(renderer.domElement);

const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
scene.add(ambientLight);
const dirLight = new THREE.DirectionalLight(0xffffff, 0.4);
dirLight.position.set(50, 100, 50);
scene.add(dirLight);

// Managers
const pathfinder = new Pathfinder(75, 75);
const terrainManager = new TerrainManager(75, 75);
const pathManager = new PathManager(75, 75);
const economyManager = new EconomyManager();
const stateManager = new StateManager();
const mainMenu = new MainMenu();
const uiManager = new UIManager();

// Hide game UI initially
uiManager.hide();
status.style.display = 'none';

mainMenu.onPlay((mode) => {
    console.log(`Starting game in ${mode} mode...`);
    mainMenu.hide();
    uiManager.show();
    status.style.display = 'block';
    stateManager.setState(GameState.Playing);
    
    // Play background music (loop)
    const audio = new Audio('./assets/sounds/mainmenu.wav');
    audio.loop = true;
    audio.volume = 0.5;
    audio.play();
});

const audioManager = new AudioManager(camera);
const statusWindow = new StatusWindow();
const gridRenderer = new GridRenderer(scene, terrainManager, pathManager);
const cameraControls = new CameraControls(camera, renderer.domElement);
const animalManager = new AnimalManager(scene);
const guestManager = new GuestManager(scene, pathfinder);
const staffManager = new StaffManager(scene, pathfinder);
const sceneryManager = new SceneryManager(scene);
const fenceManager = new FenceManager(scene);
const editorManager = new EditorManager(
    animalManager, gridRenderer, terrainManager, pathManager, 
    sceneryManager, fenceManager, staffManager, economyManager, uiManager
);

economyManager.onUpdate((cash) => uiManager.setCash(cash));

uiManager.updateAnimalList(WHITELIST);
uiManager.onSelect((type, id) => {
    statusWindow.hide();
    audioManager.playClickSound();
    if (type === 'animal') {
        editorManager.selectAnimalForPlacement(id);
        status.innerHTML = `Placing Animal: ${id}. Cost: $500.`;
    } else if (type === 'scenery') {
        editorManager.selectSceneryForPlacement(id);
        status.innerHTML = `Placing Scenery: ${id}. Cost: $100.`;
    } else if (type === 'fence') {
        editorManager.selectFenceForPlacement(id);
        status.innerHTML = `Placing Fence: ${id}. Cost: $50.`;
    } else if (type === 'path') {
        editorManager.selectPathForPainting(id);
        status.innerHTML = `Painting Path: ${id}. Cost: $20.`;
    } else if (type === 'staff') {
        editorManager.selectStaffForHiring(id);
        status.innerHTML = `Hiring Staff: ${id}. Cost: $1000.`;
    } else {
        editorManager.selectTerrainForPainting(id);
        status.innerHTML = `Painting Terrain: ${id}. Cost: $10.`;
    }
});

async function initGame() {
    status.style.display = 'block';
    await editorManager.loadZoo();
    await guestManager.init();
    await staffManager.init();
    await audioManager.init();
    audioManager.playAmbient();
    
    setInterval(() => {
        const guestCount = guestManager.guests.length;
        if (guestCount > 0) {
            economyManager.addCash(guestCount * 10);
        }
    }, 10000);

    status.innerHTML = 'Zoo Tycoon: Ready! Select a tool to start building.';
}

initGame();

const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
let isMouseDown = false;

window.addEventListener('mousedown', () => isMouseDown = true);
window.addEventListener('mouseup', () => isMouseDown = false);

window.addEventListener('mousemove', (event) => {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
});

window.addEventListener('click', () => {
    const hovered = gridRenderer.updateHover(raycaster);
    if (hovered) {
        if (editorManager.getMode() === 'select') {
            const entity = editorManager.getEntityAt(hovered, guestManager);
            if (entity) {
                audioManager.playClickSound();
                statusWindow.show(entity.name, entity.stats, entity.thoughts);
            } else {
                statusWindow.hide();
            }
        } else {
            audioManager.playPlacementSound();
            editorManager.handleGridClick(hovered, raycaster);
        }
    }
});

function animate(time: number) {
    requestAnimationFrame(animate);
    if (stateManager.getState() !== GameState.Playing) return;

    cameraControls.update();
    raycaster.setFromCamera(mouse, camera);
    const hovered = gridRenderer.updateHover(raycaster);
    if (isMouseDown && editorManager.getMode() !== 'select') {
        editorManager.handleGridClick(hovered, raycaster);
    }
    const blockedCheck = (x: number, y: number, side: 'n' | 'e' | 's' | 'w') => 
        fenceManager.isEdgeBlocked(x, y, side);
    editorManager.update(time);
    guestManager.update(time, blockedCheck, pathManager, editorManager.getAnimalData());
    renderer.render(scene, camera);
}

animate(0);

window.addEventListener('resize', () => {
    const aspect = window.innerWidth / window.innerHeight;
    camera.left = -frustumSize * aspect / 2;
    camera.right = frustumSize * aspect / 2;
    camera.top = frustumSize / 2;
    camera.bottom = -frustumSize / 2;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});
