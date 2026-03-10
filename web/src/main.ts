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
import { HUD } from './ui/HUD';
import { ScenarioManager } from './core/ScenarioManager';
import { TimeManager } from './core/TimeManager';
import { FinancePanel } from './ui/FinancePanel';
import { SaveLoadMenu } from './ui/SaveLoadMenu';
import { VisualEffectManager } from './core/VisualEffectManager';
import { GameState, StateManager } from './core/GameState';
import { StatusWindow } from './ui/StatusWindow';
import { EditorManager } from './core/EditorManager';
import { Pathfinder } from './core/Pathfinder';

const WHITELIST = [
    'afrbuf', 'gorilla', 'lion', 'tiger', 'chimpanz', 'eleph', 'giraffe', 'hippo', 'ostrich', 'zebra',
    'gallim', 'plateo', 'asieleph', 'bongo', 'yeti', 'baracuda', 'reindeer', 'mtnlion', 'llama', 'blckbuck',
    'bigfoot', 'mexwolf', 'lochness', 'wilddog', 'asblckbr', 'komodo', 'megath'
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
const scenarioManager = new ScenarioManager();
const timeManager = new TimeManager();
const visualEffectManager = new VisualEffectManager(scene);
const stateManager = new StateManager();
const mainMenu = new MainMenu();
const uiManager = new UIManager();
const hud = new HUD();

// Hide game UI initially
uiManager.hide();
hud.hide();
status.style.display = 'none';

mainMenu.onPlay(async (mode, scenarioId) => {
    console.log(`Starting game in ${mode} mode (${scenarioId || 'none'})...`);
    
    if (mode === 'scenario' && scenarioId) {
        status.innerHTML = `Loading scenario ${scenarioId}...`;
        try {
            const response = await fetch(`./assets/maps/${scenarioId}.zoo`);
            const arrayBuffer = await response.arrayBuffer();
            const map = ZooMapParser.parse(Buffer.from(arrayBuffer));
            await editorManager.loadMap(map, 25000);
            
            scenarioManager.loadScenario(scenarioId);
            const firstGoal = scenarioManager.getGoals()[0];
            status.innerHTML = `Scenario: ${scenarioId}. Goal: ${firstGoal?.description || 'Grow your zoo!'}`;
        } catch (e) {
            console.error("Failed to load scenario map:", e);
            editorManager.resetZoo(25000);
            status.innerHTML = `Scenario ${scenarioId} (Map failed to load). Goal: Grow your zoo!`;
        }
    } else {
        editorManager.resetZoo(50000);
        status.innerHTML = 'Freeform mode. Build your dream zoo!';
    }

    mainMenu.hide();
    hud.show();
    stateManager.setState(GameState.Playing);
    
    // Play background music (loop)
    audioManager.playMusic('mainmenu');
});

scenarioManager.onUpdate(() => {
    const goals = scenarioManager.getGoals();
    const nextGoal = goals.find(g => !g.completed);
    if (nextGoal) {
        status.innerHTML = `Next Goal: ${nextGoal.description}`;
    } else if (scenarioManager.isWin()) {
        status.innerHTML = 'YOU WIN! Zoo Tycoon Master.';
        audioManager.playPlacementSound();
    }
});

hud.onButtonClick((id) => {
    audioManager.playClickSound();
    switch (id) {
        case 'BuyAnimal':
            uiManager.showCategory('animal');
            status.innerHTML = 'Select an animal to place.';
            break;
        case 'BuyHabitat':
            uiManager.showCategory('terrain'); // Or fence
            status.innerHTML = 'Select terrain or fence to build.';
            break;
        case 'BuyObject':
            uiManager.showCategory('scenery');
            status.innerHTML = 'Select scenery to place.';
            break;
        case 'BuyStaff':
            uiManager.showCategory('staff');
            status.innerHTML = 'Hire staff members.';
            break;
        case 'Bulldoze':
            editorManager.setMode('bulldoze');
            uiManager.setMode('bulldoze');
            status.innerHTML = 'Bulldozer active.';
            break;
        case 'ZoomIn':
            cameraControls.zoomIn();
            break;
        case 'ZoomOut':
            cameraControls.zoomOut();
            break;
        case 'ZooStatus':
            financePanel.show();
            break;
        case 'Options':
            saveLoadMenu.show();
            break;
    }
});

const audioManager = new AudioManager(camera);
const statusWindow = new StatusWindow();
const persistenceManager = new PersistenceManager();
const saveLoadMenu = new SaveLoadMenu(persistenceManager, audioManager);
const financePanel = new FinancePanel(economyManager);

saveLoadMenu.onSave((name) => {
    editorManager.saveZooNamed(name);
    status.innerHTML = `Zoo '${name}' saved successfully.`;
});

saveLoadMenu.onLoad(async (data) => {
    await editorManager.loadZooData(data);
    status.innerHTML = `Zoo '${data.name}' loaded.`;
});
const gridRenderer = new GridRenderer(scene, terrainManager, pathManager);
const cameraControls = new CameraControls(camera, renderer.domElement);
const animalManager = new AnimalManager(scene, audioManager);
const guestManager = new GuestManager(scene, pathfinder);
const staffManager = new StaffManager(scene, pathfinder);
const sceneryManager = new SceneryManager(scene);
const fenceManager = new FenceManager(scene);
const editorManager = new EditorManager(
    animalManager, gridRenderer, terrainManager, pathManager, 
    sceneryManager, fenceManager, staffManager, economyManager, uiManager
);

editorManager.onModeChange((mode) => {
    uiManager.setMode(mode);
});

economyManager.onUpdate((cash) => {
    uiManager.setCash(cash);
    hud.setMoney(cash);
});

uiManager.updateAnimalList(WHITELIST);
uiManager.onSelect((type, id) => {
    statusWindow.hide();
    audioManager.playClickSound();
    if (type === 'animal') {
        editorManager.selectAnimalForPlacement(id);
        uiManager.setMode('animal');
        status.innerHTML = `Placing Animal: ${id}. Cost: $500.`;
    } else if (type === 'scenery') {
        editorManager.selectSceneryForPlacement(id);
        uiManager.setMode('scenery');
        status.innerHTML = `Placing Scenery: ${id}. Cost: $100.`;
    } else if (type === 'fence') {
        editorManager.selectFenceForPlacement(id);
        uiManager.setMode('fence');
        status.innerHTML = `Placing Fence: ${id}. Cost: $50.`;
    } else if (type === 'path') {
        editorManager.selectPathForPainting(id);
        uiManager.setMode('terrain');
        status.innerHTML = `Painting Path: ${id}. Cost: $20.`;
    } else if (type === 'terrain') {
        editorManager.selectTerrainForPainting(id);
        uiManager.setMode('terrain');
        status.innerHTML = `Painting Terrain: ${id}. Cost: $10.`;
    } else if (type === 'staff') {
        editorManager.selectStaffForHiring(id);
        uiManager.setMode('staff');
        status.innerHTML = `Hiring: ${id}. Cost: $1000.`;
    }
});


async function initGame() {
    status.style.display = 'block';
    await editorManager.loadZoo();
    await guestManager.init();
    await staffManager.init();
    await audioManager.init();
    audioManager.playAmbient();
    
    timeManager.setOnDayEnd((day, month, year) => {
        hud.setDate(timeManager.getDateString());
        
        // Random weather change
        if (day === 1 && Math.random() < 0.3) {
            const types: ('rain' | 'snow' | 'storm')[] = ['rain', 'snow', 'storm'];
            const selected = types[Math.floor(Math.random() * types.length)];
            visualEffectManager.setWeather(selected);
            status.innerHTML = `It started to ${selected === 'storm' ? 'storm' : selected}!`;
        } else if (day === 5) {
            visualEffectManager.setWeather('none');
        }

        // Daily income from guests
        const guestCount = guestManager.guests.length;
        if (guestCount > 0) {
            const incomePerGuest = economyManager.getAdmissionFee();
            economyManager.addCash(guestCount * incomePerGuest, 'admission');
        }
    });

    timeManager.setOnMonthEnd((month, year) => {
        // Subtract salaries
        const salaries = staffManager.getSalaries();
        economyManager.subtractCash(salaries, 'salaries');
        console.log(`[Finance] Month End. Salaries paid: $${salaries}`);
        
        // Reset stats for new month
        economyManager.resetMonthlyStats();
    });

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

    timeManager.update(time);
    visualEffectManager.update(time, camera);
    cameraControls.update();
    raycaster.setFromCamera(mouse, camera);
    const hovered = gridRenderer.updateHover(raycaster);
    if (isMouseDown && editorManager.getMode() !== 'select') {
        editorManager.handleGridClick(hovered, raycaster);
    }
    const blockedCheck = (x: number, y: number, side: 'n' | 'e' | 's' | 'w') => 
        fenceManager.isEdgeBlocked(x, y, side);
    editorManager.update(time, audioManager);
    guestManager.update(time, blockedCheck, pathManager, editorManager.getAnimalData(), editorManager.getBuildings(), () => {
        const price = economyManager.getConcessionPrice();
        economyManager.addCash(price, 'concessions');
    });
    
    // Update Scenario
    scenarioManager.update({
        animals: editorManager.getAnimalData(),
        staff: editorManager.getStaffData(),
        cash: economyManager.getCash()
    });

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
