// Объявление переменных
let playerMaterialColor = 0x0000ff; // Цвет по умолчанию
let totalCoins = 0;

// Загрузка монет из локального хранилища
if (localStorage.getItem('totalCoins')) {
    totalCoins = parseInt(localStorage.getItem('totalCoins'));
}

// Функция для обновления общего количества монет
function updateTotalCoins() {
    document.getElementById('total-coins').innerText = `Всего монет: ${totalCoins}`;
}
updateTotalCoins();

// Получение элементов
const mainMenu = document.getElementById('main-menu');
const startGameButton = document.getElementById('start-game-button');
const coinCounter = document.getElementById('coin-counter');
const gameOverModal = document.getElementById('game-over-modal');
const gameOverText = document.getElementById('game-over-text');

// Начало игры
startGameButton.addEventListener('click', () => {
    mainMenu.style.display = 'none';
    coinCounter.style.display = 'block';
    animate();
    startGeneratingObjects();
    generateInteriorObjects(); // Вызов функции генерации объектов интерьера
});

// Выбор скинов
document.querySelectorAll('.skin-button').forEach(button => {
    button.addEventListener('click', (event) => {
        playerMaterialColor = parseInt(event.target.getAttribute('data-color'));
        player.material.color.setHex(playerMaterialColor);
        cubePreview.material.color.setHex(playerMaterialColor);
    });
});

// Setting up the scene, camera, and renderer for main menu cube preview
const previewScene = new THREE.Scene();
const previewCamera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);
previewCamera.position.z = 2;

const previewRenderer = new THREE.WebGLRenderer();
previewRenderer.setSize(200, 200);
document.getElementById('cube-preview').appendChild(previewRenderer.domElement);

const cubeGeometry = new THREE.BoxGeometry();
const cubeMaterial = new THREE.MeshBasicMaterial({ color: playerMaterialColor });
const cubePreview = new THREE.Mesh(cubeGeometry, cubeMaterial);
previewScene.add(cubePreview);

function previewAnimate() {
    requestAnimationFrame(previewAnimate);
    cubePreview.rotation.x += 0.01;
    cubePreview.rotation.y += 0.01;
    previewRenderer.render(previewScene, previewCamera);
}
previewAnimate();

// Setting up the scene, camera, and renderer for the game
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87ceeb);  // Blue sky

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 10, 10);  // Camera higher and looking down
camera.lookAt(0, 0, 0);  // Camera direction

const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Getting coin counter element
const coinCounterElement = document.getElementById('coin-counter');

// Getting modal elements
const gameOverModalElement = document.getElementById('game-over-modal');
const gameOverTextElement = document.getElementById('game-over-text');

// Creating the ground segments
const segmentLength = 150;
const segmentWidth = 20;  // Увеличенная ширина сегментов поля
let segments = [];

function createGroundSegment(zPosition) {
    const floorGeometry = new THREE.PlaneGeometry(10, segmentLength);
    const floorMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    floor.position.z = zPosition;
    scene.add(floor);
    segments.push(floor);
}

// Initial ground segments
for (let i = 0; i < 20; i++) {
    createGroundSegment(-i * segmentLength);
}

// Creating the player
const playerGeometry = new THREE.BoxGeometry(1.5, 1.5, 1.5);  // Увеличенные размеры
let playerMaterial = new THREE.MeshBasicMaterial({ color: playerMaterialColor });
const player = new THREE.Mesh(playerGeometry, playerMaterial);
player.position.y = 1;  // Увеличенная высота
scene.add(player);

// Initializing obstacles and coins array and speed
let obstacles = [];
let coins = [];
let speed = 0.05;  // Initial speed
const lanes = [-2, 0, 2];  // Three lanes: left, center, right
let currentLane = 1;  // Starting lane (center)
let score = 0;
let coinCount = 0;
let isGameOver = false;

// Jump variables
let isJumping = false;
let jumpSpeed = 0;
const gravity = -0.015;
const jumpHeight = 0.5;

// Паттерны генерации
const patterns = [
    ['O', 'C', 'O'],
    ['O', 'M', 'O'],
    ['O', 'O', 'O'],
    ['M', 'O', 'O'],
    ['O', 'M', 'O'],
    ['M', 'O', 'N'],
    ['N', 'M', 'O'],
    ['M', 'O', 'N'],
];

function createObstacleOrCoin(type, lane, zPosition) {
    if (type === 'O') {
        const obstacleGeometry = new THREE.BoxGeometry(1.7, 1.7, 1.7);  // Увеличенные размеры
        const obstacleMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });
        const obstacle = new THREE.Mesh(obstacleGeometry, obstacleMaterial);
        obstacle.position.set(lane, 1, zPosition);  // Увеличенная высота
        obstacles.push(obstacle);
        scene.add(obstacle);
    } else if (type === 'M') {
        const coinGeometry = new THREE.CircleGeometry(0.6, 32);  // Увеличенный радиус
        const coinMaterial = new THREE.MeshBasicMaterial({ color: 0xffff00 });
        const coin = new THREE.Mesh(coinGeometry, coinMaterial);
        coin.position.set(lane, 1, zPosition);  // Увеличенная высота
        coins.push(coin);
        scene.add(coin);
    }
}
function createTree(x, z) {
    const trunkGeometry = new THREE.CylinderGeometry(0.2, 0.2, 2);
    const trunkMaterial = new THREE.MeshBasicMaterial({ color: 0x8B4513 }); // Коричневый цвет ствола
    const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
    trunk.position.set(x, 1, z);

    const leavesGeometry = new THREE.SphereGeometry(1);
    const leavesMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00 }); // Зеленый цвет листвы
    const leaves = new THREE.Mesh(leavesGeometry, leavesMaterial);
    leaves.position.set(x, 3, z);

    scene.add(trunk);
    scene.add(leaves);
}

// Функция для создания здания
function createBuilding(x, z) {
    const buildingGeometry = new THREE.BoxGeometry(2, 6, 2);
    const buildingMaterial = new THREE.MeshBasicMaterial({ color: 0x808080 }); // Серый цвет здания
    const building = new THREE.Mesh(buildingGeometry, buildingMaterial);
    building.position.set(x, 3, z);

    scene.add(building);
}

// Добавление деревьев и зданий вдоль дороги
for (let i = -200; i < 200; i += 10) {
    createTree(-5, i);
    createTree(5, i);
    if (i % 20 === 0) { // Размещаем здания реже
        createBuilding(-8, i);
        createBuilding(8, i);
    }
}



// Генерация объектов заранее и увеличение частоты генерации
function generateObjects() {
    const pattern = patterns[Math.floor(Math.random() * patterns.length)];
    const zPosition = player.position.z - 35;  // Увеличенная дистанция до игрока

    pattern.forEach((type, index) => {
        const lane = lanes[index];
        createObstacleOrCoin(type, lane, zPosition);
    });
}

// Запуск генерации объектов с динамическими интервалами
function startGeneratingObjects() {
    function generate() {
        if (!isGameOver) {
            generateObjects();
            setTimeout(generate, 750);   // Генерация объектов каждые 450 мс
        }
    }
    generate();
    

    setInterval(() => {
        if (!isGameOver) {
            speed += 0.008; 
// Увеличение скорости каждые 10 секунд
        }
    }, 10000);
}

// Функция для создания анимации при сборе монеты
function animateCoinCollection(coin) {
    const jumpHeight = 2;
    const animationDuration = 500;
    const scaleFactor = 1.5;

    const initialPosition = coin.position.clone();
    const targetPosition = player.position.clone();
    targetPosition.y += 1; // Target position above the player

    const initialScale = coin.scale.clone();
    const targetScale = initialScale.clone().multiplyScalar(scaleFactor);

    const startTime = Date.now();

    function animate() {
        const elapsed = Date.now() - startTime;
        const t = Math.min(elapsed / animationDuration, 1);

        // Interpolating position and scale
        coin.position.lerpVectors(initialPosition, targetPosition, t);
        coin.scale.lerpVectors(initialScale, targetScale, t);

        // Apply an upward and then downward movement to simulate a jump
        const jumpProgress = t < 0.5 ? t * 2 : (1 - t) * 2;
        coin.position.y = initialPosition.y + jumpHeight * jumpProgress;

        // Check if the animation is done
        if (t < 1) {
            requestAnimationFrame(animate);
        } else {
            // Remove the coin after animation
            scene.remove(coin);
        }
    }

    animate();
}

// Обработка событий нажатий клавиш для управления игроком
document.addEventListener('keydown', (event) => {
    if (event.code === 'ArrowLeft' && currentLane > 0) {
        currentLane--;
        player.position.x = lanes[currentLane];
    } else if (event.code === 'ArrowRight' && currentLane < lanes.length - 1) {
        currentLane++;
        player.position.x = lanes[currentLane];
    } else if (event.code === 'Space' && !isJumping) {
        isJumping = true;
        jumpSpeed = jumpHeight;
    }
});

// Главная функция анимации
function animate() {
    if (isGameOver) return;

    requestAnimationFrame(animate);

    // Движение игрока вперед
    player.position.z -= speed;
    score += 1;

    // Обработка прыжка
    if (isJumping) {
        player.position.y += jumpSpeed;
        jumpSpeed += gravity;
        if (player.position.y <= 0.7) {
            player.position.y = 0.7;
            isJumping = false;
        }
    }

    // Генерация новых сегментов поля
    if (segments[segments.length - 1].position.z > player.position.z + 10 * segmentLength) {
        const lastSegment = segments[segments.length - 1];
        createGroundSegment(lastSegment.position.z - segmentLength);
        const firstSegment = segments.shift();
        scene.remove(firstSegment);
    }

    // Движение препятствий к игроку
    obstacles.forEach((obstacle, index) => {
        obstacle.position.z += speed;
        if (obstacle.position.z > player.position.z + 10) {
            scene.remove(obstacle);
            obstacles.splice(index, 1);
        }

        // Проверка на столкновения
        const playerBox = new THREE.Box3().setFromObject(player);
        const obstacleBox = new THREE.Box3().setFromObject(obstacle);
        if (playerBox.intersectsBox(obstacleBox)) {
            gameOverTextElement.innerHTML = `Игра окончена!<br>Ваш счет: ${score}<br>Собрано монет: ${coinCount}`;
            gameOverModalElement.style.display = 'block';
            isGameOver = true;
            totalCoins += coinCount;
            localStorage.setItem('totalCoins', totalCoins);
            updateTotalCoins();
        }
    });

    // Движение монет к игроку
    coins.forEach((coin, index) => {
        coin.position.z += speed;
        if (coin.position.z > player.position.z + 10) {
            scene.remove(coin);
            coins.splice(index, 1);
        }

        // Проверка на сбор монет
        const playerBox = new THREE.Box3().setFromObject(player);
        const coinBox = new THREE.Box3().setFromObject(coin);
        if (playerBox.intersectsBox(coinBox)) {
            coinCount++;
            animateCoinCollection(coin);
            coins.splice(index, 1);

            // Обновление счетчика монет
            coinCounterElement.innerText = 'Монеты: ' + coinCount;
        }
    });

    // Обновление позиции и направления камеры
    camera.position.set(player.position.x, player.position.y + 10, player.position.z + 15);
    camera.lookAt(player.position);

    renderer.render(scene, camera);
}

// Обработка изменения размера окна
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});



// Touch controls for mobile devices
let touchStartX = 0;
let touchStartY = 0;
let touchEndX = 0;
let touchEndY = 0;

document.addEventListener('touchstart', (event) => {
    touchStartX = event.touches[0].clientX;
    touchStartY = event.touches[0].clientY;
});

document.addEventListener('touchmove', (event) => {
    touchEndX = event.touches[0].clientX;
    touchEndY = event.touches[0].clientY;
});

document.addEventListener('touchend', () => {
    const deltaX = touchEndX - touchStartX;
    const deltaY = touchEndY - touchStartY;

    // Добавляем пороговое значение для определения прыжка
    const jumpThreshold = 50;

    // Если вертикальное смещение больше порогового значения и нет активного прыжка, выполняем прыжок
    if (deltaY < -jumpThreshold && !isJumping) {
        // Устанавливаем флаг прыжка
        isJumping = true;
        // Задаем начальную скорость прыжка
        jumpSpeed = jumpHeight;
    }

    // Если горизонтальное смещение больше, чем вертикальное, и нет прыжка, обрабатываем горизонтальный свайп
    if (Math.abs(deltaX) > Math.abs(deltaY) && !isJumping) {
        if (deltaX > 0 && currentLane < lanes.length - 1) {
            // Свайп вправо
            currentLane++;
            player.position.x = lanes[currentLane];
        } else if (deltaX < 0 && currentLane > 0) {
            // Свайп влево
            currentLane--;
            player.position.x = lanes[currentLane];
        }
    }
});
