//sonido
function cargar(){
    const sonidos= document.getElementById('sonido');
    document.addEventListener('keydown', function(evento){
    if (evento.keyCode == 32){
        sonidos.innerHTML += '<audio src="sonidos/src_Sounds_melodias_Menu1.mp3" autoplay></audio>';
}
})
//movimientos
const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');
const returnButton = document.getElementById('return-button');

returnButton.addEventListener('click', () => {
    window.location.href = 'menu.html';
});

const el = document.getElementById('return-button');
const height = el.clientHeight;
const width = el.clientWidth;

el.addEventListener('mousemove', (evt) => {
    const { layerX, layerY } = evt;

    const yRotation = ((layerX - width / 2) / width) * 20;
    const xRotation = ((layerY - height / 2) / height) * 20;

    const string = `
    perspective(500px)
    scale(1.1)
    rotateX(${xRotation}deg)
    rotateY(${yRotation}deg)`;
    el.style.transform = string;
});

el.addEventListener('mouseout', () => {
    el.style.transform = `
    perspective(500px)
    scale(1)
    rotateX(0)
    rotateY(0)`;
});

const character = {
    x: 0,
    y: canvas.height + 420,
    width: 30,
    height: 30,
    speed: 5,
    jumpHeight: 150,
    isJumping: false,
    isAttacking: false,
};

const initialCharacter = { ...character };

const floors = [];
const enemies = [];
const balls = [];
const floorCount = 4;

let enemySpeed = 2; // Velocidad inicial de los enemigos

for (let i = 0; i < floorCount; i++) {
    floors.push({
        x: 0,
        y: canvas.height - i * 100 + 350,
        width: canvas.width,
        height: 20,
        structureCount: 46,
        structureWidth: canvas.width / 8,
        isBroken: Array(46).fill(false),
    });

    enemies.push({
        x: Math.random() * (canvas.width - 30),
        y: canvas.height - i * 100 + 350 - 30,
        width: 30,
        height: 30,
        direction: Math.random() < 0.5 ? -1 : 1,
        speed: enemySpeed + Math.random() * 2,
        isDead: false,
    });

    // Crear pelotitas en línea recta en cada piso
    const ballSpacing = floors[i].structureWidth / 2; // Espacio entre las pelotitas
    for (let k = 0; k < floors[i].structureCount; k++) {
        balls.push({
            x: k * floors[i].structureWidth + ballSpacing,
            y: floors[i].y - Math.random() * 1,
            radius: 4,
            color: 'orange',
            isEaten: false,
        });
    }
}

const keysPressed = {};

let score = 0;

document.addEventListener('keydown', (event) => {
    keysPressed[event.key] = true;
    if (event.key === 's' && !character.isAttacking) {
        character.isAttacking = true;
        attack();
    }
});

document.addEventListener('keyup', (event) => {
    keysPressed[event.key] = false;
});

function drawCharacter() {
    ctx.fillStyle = 'blue';
    ctx.fillRect(character.x, character.y, character.width, character.height);
}

function drawFloors() {
    for (let i = 0; i < floorCount; i++) {
        for (let j = 0; j < floors[i].structureCount; j++) {
            if (!floors[i].isBroken[j]) {
                ctx.fillStyle = 'green';
                ctx.fillRect(
                    j * floors[i].structureWidth,
                    floors[i].y,
                    floors[i].structureWidth,
                    floors[i].height
                );
            }
        }

        // Dibujar pelotitas en cada piso
        for (let k = 0; k < balls.length; k++) {
            if (!balls[k].isEaten) {
                ctx.fillStyle = balls[k].color;
                ctx.beginPath();
                ctx.arc(balls[k].x, balls[k].y, balls[k].radius, 0, Math.PI * 2);
                ctx.fill();
                ctx.closePath();
            }
        }
    }
}

function drawEnemies() {
    ctx.fillStyle = 'red';
    for (let i = 0; i < enemies.length; i++) {
        if (!enemies[i].isDead) {
            ctx.fillRect(enemies[i].x, enemies[i].y, enemies[i].width, enemies[i].height);
        }
    }
}

function clearCanvas() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
}

function update() {
    clearCanvas();
    drawFloors();
    drawCharacter();
    drawEnemies();

    ctx.fillStyle = 'black';
    ctx.font = '20px Arial';
    document.getElementById('score').textContent = score;

    if (keysPressed['d'] && character.x + character.width + character.speed <= canvas.width) {
        character.x += character.speed;
    }
    if (keysPressed['a'] && character.x - character.speed >= 0) {
        character.x -= character.speed;
    }
    if (keysPressed['w'] && !character.isJumping) {
        character.isJumping = true;
        jump();
    }

    // Colisión entre el personaje y las pelotitas
    for (let i = 0; i < balls.length; i++) {
        if (!balls[i].isEaten) {
            if (
                character.x < balls[i].x + balls[i].radius &&
                character.x + character.width > balls[i].x - balls[i].radius &&
                character.y < balls[i].y + balls[i].radius &&
                character.y + character.height > balls[i].y - balls[i].radius
            ) {
                // Aumentar el puntaje cuando el personaje come una pelotita
                score += 1;
                balls[i].isEaten = true;

                // Aumentar la velocidad de los enemigos cada vez que se come una pelotita
                enemySpeed += 0.2;
                for (let j = 0; j < enemies.length; j++) {
                    if (!enemies[j].isDead) {
                        enemies[j].speed = enemySpeed + Math.random() * 2;
                    }
                }
            }
        }
    }

    for (let i = 0; i < enemies.length; i++) {
        if (!enemies[i].isDead) {
            enemies[i].x += enemies[i].speed * enemies[i].direction;

            if (enemies[i].x <= 0 || (enemies[i].x + enemies[i].width >= canvas.width) || !isOnFloor(enemies[i])) {
                enemies[i].direction *= -1;
            }

            if (
                character.x < enemies[i].x + enemies[i].width &&
                character.x + character.width > enemies[i].x &&
                character.y < enemies[i].y + enemies[i].height &&
                character.y + character.height > enemies[i].y
            ) {
                if (character.isAttacking) {
                    score += 3;
                    enemies[i].isDead = true;
                } else {
                    resetGame();
                    return;
                }
            }
        }
    }
}

function isOnFloor(enemy) {
    for (let i = 0; i < floorCount; i++) {
        for (let j = 0; j < floors[i].structureCount; j++) {
            if (!floors[i].isBroken[j] && enemy.x + enemy.width > j * floors[i].structureWidth && enemy.x < (j + 1) * floors[i].structureWidth) {
                if (enemy.y + enemy.height === floors[i].y) {
                    return true;
                }
            }
        }
    }
    return false;
}

canvas.width = 770;
canvas.height = 600;

function jump() {
    let jumpHeight = 0;

    const jumpInterval = setInterval(() => {
        if (jumpHeight >= character.jumpHeight) {
            clearInterval(jumpInterval);
            fall();
        } else {
            character.y -= 5;
            jumpHeight += 5;
            checkCollision();
        }
    }, 20);

    function checkCollision() {
        if (character.isJumping) {
            for (let i = 0; i < floorCount; i++) {
                for (let j = 0; j < floors[i].structureCount; j++) {
                    if (!floors[i].isBroken[j] && character.x + character.width > j * floors[i].structureWidth && character.x < (j + 1) * floors[i].structureWidth) {
                        if (character.y + character.height === floors[i].y) {
                            floors[i].isBroken[j] = true;
                            character.jumpHeight = 150;
                            score += 1;
                        }
                    }
                }
            }
        }
    }
}

function fall() {
    const fallInterval = setInterval(() => {
        let isFalling = true;

        for (let i = 0; i < floorCount; i++) {
            if (!isFalling) break;

            for (let j = 0; j < floors[i].structureCount; j++) {
                if (!floors[i].isBroken[j] && character.x + character.width > j * floors[i].structureWidth && character.x < (j + 1) * floors[i].structureWidth) {
                    if (character.y + character.height === floors[i].y) {
                        isFalling = false;
                        character.isJumping = false;
                    }
                }
            }
        }

        if (isFalling) {
            if (character.y + character.height < canvas.height) {
                character.y += 5;
            } else {
                clearInterval(fallInterval);
                character.isJumping = false;
                character.jumpHeight = 100;
            }
        }
    }, 20);
}

function resetGame() {
    character.x = initialCharacter.x;
    character.y = initialCharacter.y;
    character.isJumping = initialCharacter.isJumping;
    character.isAttacking = false;
    character.jumpHeight = initialCharacter.jumpHeight;
    for (let i = 0; i < floors.length; i++) {
        floors[i].isBroken.fill(false);
    }
    for (let i = 0; i < enemies.length; i++) {
        enemies[i].x = Math.random() * (canvas.width - 30);
        enemies[i].direction = Math.random() < 0.5 ? -1 : 1

        enemies[i].speed = 2 + Math.random() * 2;
        enemies[i].isDead = false;
    }

  // Reiniciar el contador de puntos
  score = 0;
}

function attack() {
    character.isAttacking = true;
    for (let i = 0; i < enemies.length; i++) {
        if (!enemies[i].isDead) {
            if (Math.abs(character.x - enemies[i].x) <= 50 && character.y + character.height === enemies[i].y) {
                // Sumar 3 puntos cuando mate a un enemigo
                score += 3;
                enemies[i].isDead = true;
            }
        }
    }
}

function gameLoop() {
    update();
    requestAnimationFrame(gameLoop);
}

gameLoop();
}