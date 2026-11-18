
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const startScreen = document.getElementById("startScreen");
const gameScreen = document.getElementById("gameScreen");
const gameOverScreen = document.getElementById("gameOverScreen");

const scoreText = document.getElementById("score");
const coinsText = document.getElementById("coins");
const livesText = document.getElementById("lives");
const timerText = document.getElementById("timer");
const finalScoreText = document.getElementById("finalScore");
const modeText = document.getElementById("modeText");

let player, objects, bullets, particles;
let score = 0;
let coins = 0;
let lives = 3;
let timeLeft = 60;
let running = false;
let magnetMode = "attract";
let keys = {};

let lastTime = 0;
let spawnTimer = 0;
let difficultyTimer = 0;
let lastShot = 0;
let animationId;
let countdownId;
let audioContext;

// Reset game
function resetGame() {
    player = {
        x: 420,
        y: 465,
        width: 60,
        speed: 7
    };

    objects = [];
    bullets = [];
    particles = [];

    score = 0;
    coins = 0;
    lives = 3;
    timeLeft = 60;

    magnetMode = "attract";
    spawnTimer = 0;
    difficultyTimer = 0;
    lastShot = 0;

    updateHUD();
}

// Update score and status
function updateHUD() {
    scoreText.textContent = score;
    coinsText.textContent = coins;
    livesText.textContent = lives;
    timerText.textContent = timeLeft;

    modeText.textContent =
        magnetMode === "attract"
        ? "BLUE - ATTRACT"
        : "RED - REPEL";

    modeText.style.color =
        magnetMode === "attract" ? "#00eaff" : "#ff4055";
}

// Sound effects
function playSound(frequency, duration) {
    try {
        if (!audioContext) {
            audioContext = new (
                window.AudioContext || window.webkitAudioContext
            )();
        }

        if (audioContext.state === "suspended") {
            audioContext.resume();
        }

        const oscillator = audioContext.createOscillator();
        const gain = audioContext.createGain();

        oscillator.connect(gain);
        gain.connect(audioContext.destination);

        oscillator.frequency.value = frequency;

        gain.gain.setValueAtTime(0.12, audioContext.currentTime);
        gain.gain.exponentialRampToValueAtTime(
            0.001,
            audioContext.currentTime + duration
        );

        oscillator.start();
        oscillator.stop(audioContext.currentTime + duration);
    } catch (error) {
        console.log("Audio unavailable");
    }
}

// Start game
function startGame() {
    cancelAnimationFrame(animationId);
    clearInterval(countdownId);

    resetGame();

    startScreen.classList.add("hidden");
    gameOverScreen.classList.add("hidden");
    gameScreen.classList.remove("hidden");

    running = true;
    lastTime = 0;

    countdownId = setInterval(() => {
        if (!running) return;

        timeLeft--;
        updateHUD();

        if (timeLeft <= 0) {
            endGame();
        }
    }, 1000);

    animationId = requestAnimationFrame(gameLoop);
}

// End game
function endGame() {
    if (!running) return;

    running = false;

    clearInterval(countdownId);
    cancelAnimationFrame(animationId);

    finalScoreText.textContent = score;

    gameScreen.classList.add("hidden");
    gameOverScreen.classList.remove("hidden");
}

// Create coins and mines
function spawnObject() {
    const isMine = Math.random() < 0.30;

    objects.push({
        x: 30 + Math.random() * (canvas.width - 60),
        y: -25,
        radius: isMine ? 17 : 13,
        type: isMine ? "mine" : "coin",
        speed: 2.5 + score / 200,
        vx: 0
    });
}

// Background
function drawBackground() {
    const gradient = ctx.createLinearGradient(0, 0, 0, 550);
    gradient.addColorStop(0, "#101a45");
    gradient.addColorStop(1, "#030713");

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Stars
    for (let i = 0; i < 90; i++) {
        const x = (i * 137) % canvas.width;
        const y = (i * 79) % canvas.height;

        ctx.fillStyle = i % 2 ? "#526a9c" : "#ffffff";
        ctx.fillRect(x, y, 2, 2);
    }

    // Neon city buildings
    for (let i = 0; i < 12; i++) {
        const x = i * 80;
        const height = 60 + (i * 37) % 100;

        ctx.fillStyle = "#101d43";
        ctx.fillRect(x, 390 - height, 55, height);

        ctx.fillStyle = "#00d9ff";

        for (let j = 0; j < 3; j++) {
            ctx.fillRect(x + 10 + j * 14, 405 - height, 5, 8);
        }
    }

    // Ground grid
    ctx.strokeStyle = "#15396b";
    ctx.lineWidth = 1;

    for (let y = 420; y < 550; y += 25) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(900, y);
        ctx.stroke();
    }

    // Magnetic field rings
    ctx.strokeStyle = magnetMode === "attract"
        ? "rgba(0,234,255,0.3)"
        : "rgba(255,64,85,0.3)";

    ctx.lineWidth = 2;

    ctx.beginPath();
    ctx.arc(player.x + 30, player.y + 20, 90, 0, Math.PI * 2);
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(player.x + 30, player.y + 20, 125, 0, Math.PI * 2);
    ctx.stroke();
}

// Draw spaceship and gun
function drawPlayer() {
    ctx.save();

    ctx.shadowColor = magnetMode === "attract"
        ? "#00eaff"
        : "#ff4055";

    ctx.shadowBlur = 25;

    // Ship body
    ctx.fillStyle = "#00bfff";
    ctx.beginPath();
    ctx.moveTo(player.x + 30, player.y - 10);
    ctx.lineTo(player.x + 58, player.y + 40);
    ctx.lineTo(player.x + 30, player.y + 32);
    ctx.lineTo(player.x + 2, player.y + 40);
    ctx.closePath();
    ctx.fill();

    // Wings
    ctx.fillStyle = "#7b5cff";
    ctx.fillRect(player.x - 2, player.y + 25, 16, 12);
    ctx.fillRect(player.x + 46, player.y + 25, 16, 12);

    // Cockpit
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.ellipse(
        player.x + 30,
        player.y + 14,
        8,
        12,
        0,
        0,
        Math.PI * 2
    );
    ctx.fill();

    // Gun barrel
    ctx.fillStyle = "#ffcc33";
    ctx.fillRect(player.x + 25, player.y - 25, 10, 24);

    ctx.fillStyle = "#ff4055";
    ctx.fillRect(player.x + 27, player.y - 29, 6, 7);

    // Engine flame
    ctx.fillStyle = "#ff9d00";
    ctx.beginPath();
    ctx.moveTo(player.x + 20, player.y + 38);
    ctx.lineTo(player.x + 30, player.y + 58);
    ctx.lineTo(player.x + 40, player.y + 38);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
}

// Draw coins and mines
function drawObjects() {
    objects.forEach(obj => {
        ctx.save();

        if (obj.type === "coin") {
            ctx.shadowColor = "#ffd700";
            ctx.shadowBlur = 20;

            ctx.fillStyle = "#ffcc00";
            ctx.beginPath();
            ctx.arc(obj.x, obj.y, obj.radius, 0, Math.PI * 2);
            ctx.fill();

            ctx.strokeStyle = "#fff2a8";
            ctx.lineWidth = 3;
            ctx.stroke();

            ctx.fillStyle = "#8b5a00";
            ctx.font = "bold 15px Arial";
            ctx.textAlign = "center";
            ctx.fillText("$", obj.x, obj.y + 5);
        } else {
            ctx.shadowColor = "#ff1744";
            ctx.shadowBlur = 20;

            ctx.fillStyle = "#ff1744";
            ctx.beginPath();
            ctx.arc(obj.x, obj.y, obj.radius, 0, Math.PI * 2);
            ctx.fill();

            ctx.strokeStyle = "#ffb3c1";
            ctx.lineWidth = 3;
            ctx.stroke();

            ctx.fillStyle = "white";
            ctx.font = "bold 17px Arial";
            ctx.textAlign = "center";
            ctx.fillText("!", obj.x, obj.y + 6);
        }

        ctx.restore();
    });
}

// Fire bullets
function fireBullet(timestamp) {
    if (!keys["f"] && !keys["F"]) return;

    if (timestamp - lastShot < 250) return;

    bullets.push({
        x: player.x + 30,
        y: player.y - 28,
        speed: 10
    });

    lastShot = timestamp;
    playSound(600, 0.08);
}

// Draw bullets
function drawBullets() {
    bullets.forEach(bullet => {
        ctx.save();

        ctx.shadowColor = "#00ffff";
        ctx.shadowBlur = 18;

        ctx.fillStyle = "#ffffff";
        ctx.fillRect(bullet.x - 3, bullet.y, 6, 17);

        ctx.fillStyle = "#00eaff";
        ctx.fillRect(bullet.x - 2, bullet.y + 5, 4, 12);

        ctx.restore();
    });
}

// Move bullets and destroy mines
function updateBullets(delta) {
    const factor = delta / 16.67;

    for (let i = bullets.length - 1; i >= 0; i--) {
        const bullet = bullets[i];

        bullet.y -= bullet.speed * factor;

        if (bullet.y < -20) {
            bullets.splice(i, 1);
            continue;
        }

        for (let j = objects.length - 1; j >= 0; j--) {
            const obj = objects[j];

            const dx = bullet.x - obj.x;
            const dy = bullet.y - obj.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < obj.radius + 8) {
                if (obj.type === "mine") {
                    score += 25;
                    createParticles(obj.x, obj.y, "#ff4055");
                    playSound(220, 0.2);
                    objects.splice(j, 1);
                    bullets.splice(i, 1);
                    updateHUD();
                    break;
                }
            }
        }
    }
}

// Move player
function movePlayer() {
    if (keys["ArrowLeft"] || keys["a"] || keys["A"]) {
        player.x -= player.speed;
    }

    if (keys["ArrowRight"] || keys["d"] || keys["D"]) {
        player.x += player.speed;
    }

    player.x = Math.max(
        0,
        Math.min(canvas.width - player.width, player.x)
    );
}

// Switch magnet
function switchMagnet() {
    if (!running) return;

    magnetMode =
        magnetMode === "attract" ? "repel" : "attract";

    updateHUD();
    playSound(750, 0.12);
}

// Particles
function createParticles(x, y, color) {
    for (let i = 0; i < 15; i++) {
        particles.push({
            x: x,
            y: y,
            vx: (Math.random() - 0.5) * 7,
            vy: (Math.random() - 0.5) * 7,
            life: 1,
            color: color
        });
    }
}

function updateParticles(delta) {
    const factor = delta / 16.67;

    particles.forEach(p => {
        p.x += p.vx * factor;
        p.y += p.vy * factor;
        p.life -= 0.025 * factor;
    });

    particles = particles.filter(p => p.life > 0);
}

function drawParticles() {
    particles.forEach(p => {
        ctx.globalAlpha = p.life;
        ctx.fillStyle = p.color;
        ctx.fillRect(p.x, p.y, 5, 5);
    });

    ctx.globalAlpha = 1;
}

// Move coins and mines
function updateObjects(delta) {
    const factor = delta / 16.67;
    const playerCenter = player.x + 30;
    const playerY = player.y + 20;

    for (let i = objects.length - 1; i >= 0; i--) {
        const obj = objects[i];

        const dx = playerCenter - obj.x;
        const dy = playerY - obj.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        // Magnetic field
        if (distance < 180 && distance > 1) {
            const strength = (180 - distance) / 180;

            if (magnetMode === "attract") {
                obj.vx += (dx / distance) * strength * 0.7;
            } else {
                obj.vx -= (dx / distance) * strength * 0.7;
            }
        }

        obj.vx *= 0.98;
        obj.x += obj.vx * factor;
        obj.y += obj.speed * factor;

        obj.x = Math.max(
            obj.radius,
            Math.min(canvas.width - obj.radius, obj.x)
        );

        // Player collision
        const hit =
            Math.abs(playerCenter - obj.x) < 35 &&
            Math.abs(playerY - obj.y) < 32;

        if (hit) {
            if (obj.type === "coin") {
                coins++;
                score += 10;

                createParticles(obj.x, obj.y, "#ffd700");
                playSound(850, 0.12);
            } else {
                lives--;

                createParticles(obj.x, obj.y, "#ff1744");
                playSound(180, 0.3);
            }

            objects.splice(i, 1);
            updateHUD();

            if (lives <= 0) {
                endGame();
                return;
            }

            continue;
        }

        if (obj.y > canvas.height + 30) {
            objects.splice(i, 1);
        }
    }
}

// Main game loop
function gameLoop(timestamp) {
    if (!running) return;

    const delta = lastTime
        ? Math.min(timestamp - lastTime, 50)
        : 16.67;

    lastTime = timestamp;

    movePlayer();

    fireBullet(timestamp);

    spawnTimer += delta;
    difficultyTimer += delta;

    if (spawnTimer >= Math.max(350, 850 - score * 2)) {
        spawnObject();
        spawnTimer = 0;
    }

    // Increase difficulty every 12 seconds
    if (difficultyTimer >= 12000) {
        objects.forEach(obj => {
            obj.speed += 0.6;
        });

        difficultyTimer = 0;
    }

    updateObjects(delta);

    if (!running) return;

    updateBullets(delta);
    updateParticles(delta);

    drawBackground();
    drawObjects();
    drawBullets();
    drawParticles();
    drawPlayer();

    animationId = requestAnimationFrame(gameLoop);
}

// Keyboard controls
document.addEventListener("keydown", event => {
    keys[event.key] = true;

    if (event.code === "Space") {
        event.preventDefault();

        if (!event.repeat) {
            switchMagnet();
        }
    }

    if (event.key.startsWith("Arrow")) {
        event.preventDefault();
    }
});

document.addEventListener("keyup", event => {
    keys[event.key] = false;
});

// Buttons
document.getElementById("startBtn")
    .addEventListener("click", startGame);

document.getElementById("restartBtn")
    .addEventListener("click", startGame);
