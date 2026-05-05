"use strict";

var muteButton = document.getElementById("mute");
var muteButton2 = document.getElementById("mute2");
var audio = document.getElementById("music");

function startGame() {
  gameLoop();
  document.getElementById("HomePage").style.display = "none";
  document.getElementById("game-container").style.display = "block";
  audio.play().catch((err) => {
    console.log("Audio blocked:", err);
  });
}

const gameStarter = document.getElementById("GameStarter");
gameStarter.addEventListener("click", startGame);
gameStarter.addEventListener(
  "touchstart",
  (e) => {
    e.preventDefault();
    startGame();
  },
  { passive: false },
);
let muteCount = 0;
let sizeMultiplier;
let PositionDecider;

muteButton.addEventListener("mousedown", function () {
  muteCount++;
  if (muteCount % 2 === 0) {
    audio.muted = false;
    muteButton.innerText = "🔊";
  } else {
    audio.muted = true;
    muteButton.innerText = "🔇";
  }
});

muteButton2.addEventListener("mousedown", function () {
  muteCount++;
  if (muteCount % 2 === 0) {
    audio.muted = false;
    muteButton.innerText = "🔊";
  } else {
    audio.muted = true;
    muteButton.innerText = "🔇";
  }
});

function isMobile() {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent,
  );
}

if (!isMobile()) {
  left.style.display = "none";
  up.style.display = "none";
  right.style.display = "none";
}

let running = true;
let hitstop = false;
let hitstopTimeoutAllreadyBegun = false;
let lastTime = 0;
let deltaTime = 0;

function sanitizeDeltaTime(dt) {
  if (Number.isNaN(dt) || !Number.isFinite(dt)) return 0;
  return dt;
}

document.addEventListener("keypress", (e) => {
  if (e.key === "p") {
    running = !running;
    if (running) {
      lastTime = performance.now();
      requestAnimationFrame(gameLoop);
    }
  }
});

const canvas = document.getElementById("game-canvas");
const ctx = canvas.getContext("2d");
let score = 0;
let gameOver = false;
const healthDisplay = document.getElementById("health");

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}

window.addEventListener("resize", resizeCanvas);
resizeCanvas();

ctx.imageSmoothingEnabled = false;

let speed = 0;
let healthIncrease = 0;
let acceleration = 9000;
let gravity = 4500;
let jumpStrength = -1500;
let ySpeed = 0;
let attackDash = 1650;
let enemyMoveSpeed = 240;
let staphSpeed = 487.5;
const frictionBase = 0.00001;
let waveNum = 0;

if (isMobile()) {
  sizeMultiplier = 0.5;
  PositionDecider = 150;
  acceleration *= 0.5;
  gravity *= 0.5;
  jumpStrength *= 0.5;
  attackDash *= 0.5;
  enemyMoveSpeed *= 0.5;
  staphSpeed *= 0.5;
} else {
  sizeMultiplier = 1;
  PositionDecider = -200;
}

const playerHitKnockbackX = 300;
const playerHitKnockbackXAlt = 350;
const playerHitKnockbackY = 240;
const enemyHitKnockback = 250;

const imgIdleLeft = new Image();
imgIdleLeft.src = "PlaugeDoctorLeft.png";
const imgIdleRight = new Image();
imgIdleRight.src = "PlaugeDoctorRight.png";
const imgAttackLeft = new Image();
imgAttackLeft.src = "PlaugeDoctorAttackLeft.png";
const imgAttackRight = new Image();
imgAttackRight.src = "PlaugeDoctorAttackRight.png";
const panel = new Image();
panel.src = "panel.png";
const bacteriaLeft = new Image();
bacteriaLeft.src = "bacteriaLeft.png";
const BacteriaDamaged = new Image();
BacteriaDamaged.src = "BacteriaDamaged.png";
const PlaugeDoctorDamagedRight = new Image();
PlaugeDoctorDamagedRight.src = "PlaugeDoctorDamagedRight.png";
const PlaugeDoctorDamagedLeft = new Image();
PlaugeDoctorDamagedLeft.src = "PlaugeDoctorDamagedLeft.png";
const Staph = new Image();
Staph.src = "Staph.png";
const StaphDamaged = new Image();
StaphDamaged.src = "DamagedStaph.png";
const Dead = new Image();
Dead.src = "Dead.png";

let enemies = [
  {
    x: 2000,
    y: canvas.height - PositionDecider - 200,
    width: 150 * sizeMultiplier,
    height: 150 * sizeMultiplier,
    sprite: bacteriaLeft,
    onGround: true,
    suttuned: false,
    health: 50,
    isRetreating: false,
    location: 0,
  },
  {
    x: 2100,
    y: canvas.height - PositionDecider,
    width: 150 * sizeMultiplier,
    height: 150 * sizeMultiplier,
    sprite: bacteriaLeft,
    onGround: true,
    suttuned: false,
    health: 50,
    isRetreating: false,
    location: 0,
  },
  {
    x: -200,
    y: canvas.height - PositionDecider,
    width: 150 * sizeMultiplier,
    height: 150 * sizeMultiplier,
    sprite: bacteriaLeft,
    onGround: true,
    suttuned: false,
    health: 50,
    isRetreating: false,
    location: 0,
  },
  {
    x: -300,
    y: canvas.height - PositionDecider,
    width: 150 * sizeMultiplier,
    height: 150 * sizeMultiplier,
    sprite: bacteriaLeft,
    onGround: true,
    suttuned: false,
    health: 50,
    isRetreating: false,
    location: 0,
  },
];

let player = {
  x: canvas.width / 2,
  y: canvas.height - 400,
  width: 300 * sizeMultiplier,
  height: 300 * sizeMultiplier,
  sprite: imgIdleLeft,
  onGround: true,
  hitboxScale: 0.4,
  isAttacking: false,
  health: 100,
  isDead: false,
};

let renderingNewWave = false;
let direction = "left";
let isAttacking = false;
let cooldown = false;
let keys = {};

document.addEventListener("keydown", (event) => {
  keys[event.key] = true;
  if (
    (event.code === "Space" || event.key === " " || event.code === "ArrowUp") &&
    player.onGround
  ) {
    ySpeed = jumpStrength;
    player.onGround = false;
  }
});

up.addEventListener(
  "touchstart",
  (e) => {
    e.preventDefault();
    if (player.onGround) {
      ySpeed = jumpStrength;
      player.onGround = false;
    }
  },
  { passive: false },
);

left.addEventListener(
  "touchstart",
  (e) => {
    e.preventDefault();
    HoldLeft = true;
  },
  { passive: false },
);
left.addEventListener("touchend", () => {
  HoldLeft = false;
});
left.addEventListener("touchcancel", () => {
  HoldLeft = false;
});

right.addEventListener(
  "touchstart",
  (e) => {
    e.preventDefault();
    HoldRight = true;
  },
  { passive: false },
);
right.addEventListener("touchend", () => {
  HoldRight = false;
});
right.addEventListener("touchcancel", () => {
  HoldRight = false;
});

document.addEventListener("keyup", (event) => {
  keys[event.key] = false;
});

let pStunned = false;
canvas.addEventListener("click", () => {
  if (cooldown) return;
  isAttacking = true;
  speed += direction === "left" ? -attackDash : attackDash;
  setTimeout(() => {
    isAttacking = false;
    cooldown = true;
    setTimeout(() => {
      cooldown = false;
    }, 100);
  }, 500);
});

let invincible = false;
let allreadyReversingX = false;
let allreadyReversingY = false;

function updateStaph(enemy, dt) {
  dt = sanitizeDeltaTime(dt);
  if (!enemy) return;

  enemy.x += enemy.xv * dt;
  enemy.y += enemy.yv * dt;

  if (enemy.x <= 0 && !allreadyReversingX) {
    enemy.x = 0;
    enemy.xv = Math.abs(enemy.xv);
    allreadyReversingX = true;
    setTimeout(() => {
      allreadyReversingX = false;
    }, 300);
  } else if (enemy.x + enemy.width >= canvas.width && !allreadyReversingX) {
    enemy.x = canvas.width - enemy.width;
    enemy.xv = -Math.abs(enemy.xv);
    allreadyReversingX = true;
    setTimeout(() => {
      allreadyReversingX = false;
    }, 300);
  }

  const ground = canvas.height - enemy.height;
  if (enemy.y >= ground && !allreadyReversingY) {
    enemy.y = ground;
    enemy.yv *= -1;
    allreadyReversingY = true;
    setTimeout(() => {
      allreadyReversingY = false;
    }, 300);
  }

  if (enemy.y <= 0 && !allreadyReversingY) {
    enemy.y = 0;
    enemy.yv *= -1;
    allreadyReversingY = true;
    setTimeout(() => {
      allreadyReversingY = false;
    }, 300);
  }
}

let HoldLeft = false;
let HoldRight = false;

function update(dt) {
  dt = sanitizeDeltaTime(dt);

  if (!isAttacking && !pStunned) {
    if (keys["a"] || keys["ArrowLeft"] || HoldLeft) {
      direction = "left";
      speed -= acceleration * dt;
    }
    if (keys["d"] || keys["ArrowRight"] || HoldRight) {
      direction = "right";
      speed += acceleration * dt;
    }
  }

  player.x += speed * dt;
  speed *= Math.pow(frictionBase, dt);

  ySpeed += gravity * dt;
  player.y += ySpeed * dt;

  const groundLevel = canvas.height - player.height;
  if (player.y >= groundLevel) {
    player.y = groundLevel;
    ySpeed = 0;
    player.onGround = true;
  }

  if (pStunned) {
    player.sprite =
      direction === "right"
        ? PlaugeDoctorDamagedRight
        : PlaugeDoctorDamagedLeft;
  } else if (isAttacking) {
    player.sprite = direction === "left" ? imgAttackLeft : imgAttackRight;
  } else {
    player.sprite = direction === "left" ? imgIdleLeft : imgIdleRight;
  }

  if (player.x < 0) player.x = 0;
  if (player.x + player.width > canvas.width)
    player.x = canvas.width - player.width;
}

function render(dt) {
  dt = sanitizeDeltaTime(dt);
  if (player.isDead) return;

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  healthDisplay.innerText = `health: ${player.health}`;
  ctx.drawImage(panel, canvas.width - 200, 0, 200, 200);
  ctx.drawImage(player.sprite, player.x, player.y, player.width, player.height);

  function getHitbox(entity) {
    const scale = entity.hitboxScale || 0.6;
    const w = entity.width * scale;
    const h = entity.height * scale;
    const x = entity.x + (entity.width - w) / 2;
    const y = entity.y + (entity.height - h) / 2;
    return { x, y, width: w, height: h };
  }

  function rectsOverlap(a, b) {
    const A = getHitbox(a);
    const B = getHitbox(b);
    return (
      A.x < B.x + B.width &&
      A.x + A.width > B.x &&
      A.y < B.y + B.height &&
      A.y + A.height > B.y
    );
  }

  if (enemies.length < 2 && !renderingNewWave) {
    healthIncrease <= 100 ? (healthIncrease += 10) : (healthIncrease += 0);
    renderingNewWave = true;
    waveNum += 1;
    setTimeout(() => {
      enemies = [
        {
          x: 2000,
          y: canvas.height - PositionDecider,
          width: 150 * sizeMultiplier,
          height: 150 * sizeMultiplier,
          sprite: bacteriaLeft,
          onGround: true,
          suttuned: false,
          health: 50 + healthIncrease,
          isRetreating: false,
          location: 0,
        },
        {
          x: 2100,
          y: canvas.height - PositionDecider,
          width: 150 * sizeMultiplier,
          height: 150 * sizeMultiplier,
          sprite: bacteriaLeft,
          onGround: true,
          suttuned: false,
          health: 50 + healthIncrease,
          isRetreating: false,
          location: 0,
        },
        {
          x: -200,
          y: canvas.height - PositionDecider,
          width: 150 * sizeMultiplier,
          height: 150 * sizeMultiplier,
          sprite: bacteriaLeft,
          onGround: true,
          suttuned: false,
          health: 50 + healthIncrease,
          isRetreating: false,
          location: 0,
        },
        {
          x: -300,
          y: canvas.height - PositionDecider,
          width: 150 * sizeMultiplier,
          height: 150 * sizeMultiplier,
          sprite: bacteriaLeft,
          onGround: true,
          suttuned: false,
          health: 50 + healthIncrease,
          isRetreating: false,
          location: 0,
        },
      ];
      if (score >= 10) {
        enemies.push({
          x: 300,
          y: waveNum >= 10 ? 20000 : player.y,
          width: 150 * sizeMultiplier,
          height: 150 * sizeMultiplier,
          sprite: Staph,
          tag: "staph",
          onGround: true,
          suttuned: false,
          health: 50 + healthIncrease,
          yv: staphSpeed,
          xv: staphSpeed,
        });
      }
      renderingNewWave = false;
    }, 7000);
  }

  for (let i = enemies.length - 1; i >= 0; i--) {
    const enemy = enemies[i];
    if (enemy.tag != "staph") enemy.y = canvas.height - 150;

    ctx.font = "20px Arial";
    ctx.fillStyle = "white";
    ctx.fillText(enemy.health, enemy.x + 5, enemy.y - 10);

    if (enemy.health <= 0) {
      score += 1;
      player.health +=
        Math.floor(Math.random() * 10 + 1) <= 2 && player.health != 100
          ? 10
          : 0;
      document.getElementById("score").innerText = `score: ${score}`;
      enemies.splice(i, 1);
      continue;
    }

    if (
      rectsOverlap(enemy, player) &&
      !isAttacking &&
      !pStunned &&
      !invincible &&
      !enemy.suttuned
    ) {
      pStunned = true;
      player.x +=
        enemy.x < player.x ? playerHitKnockbackX : -playerHitKnockbackXAlt;
      player.y -= playerHitKnockbackY;
      if (player.health > 10) {
        player.sprite =
          enemy.x < player.x
            ? PlaugeDoctorDamagedLeft
            : PlaugeDoctorDamagedRight;
        player.health -= 10;
        setTimeout(() => {
          pStunned = false;
          invincible = true;
          setTimeout(() => {
            invincible = false;
          }, 1000);
        }, 500);
      } else {
        player.sprite = Dead;
        player.health -= 10;
        setTimeout(() => {
          pStunned = false;
          invincible = true;
          setTimeout(() => {
            invincible = false;
          }, 1000);
        }, 500);
      }
    }

    if (enemy.suttuned) {
      ctx.drawImage(enemy.sprite, enemy.x, enemy.y, enemy.width, enemy.height);
      continue;
    }

    if (Math.random() < 0.003 && enemy.tag != "staph") {
      enemy.x += Math.random() < 0.51 ? -50 : 50;
    }

    if (Math.random() < 0.0015 && enemy.tag != "staph" && !enemy.isRetreating) {
      enemy.isRetreating = true;
      enemy.location = enemy.x > player.x ? enemy.x + 400 : enemy.x - 400;
      setTimeout(() => {
        enemy.isRetreating = false;
        enemy.location = player.x;
      }, 1000);
    }

    if (!enemy.isRetreating) enemy.location = player.x;

    if (
      rectsOverlap(enemy, player) &&
      enemy.tag === "staph" &&
      !allreadyReversingX &&
      !allreadyReversingY
    ) {
      enemy.xv *= -1;
      enemy.yv *= -1;
      allreadyReversingX = true;
      allreadyReversingY = true;
      setTimeout(() => {
        allreadyReversingX = false;
        allreadyReversingY = false;
      }, 100);
    }

    if (
      enemy.x !== enemy.location &&
      enemy.tag != "staph" &&
      !enemy.isRetreating
    ) {
      enemy.x +=
        (enemy.x >= enemy.location ? -enemyMoveSpeed : enemyMoveSpeed) * dt;
    }

    if (isAttacking && rectsOverlap(player, enemy) && !enemy.suttuned) {
      enemy.health -= 10;
      enemy.suttuned = true;
      if (enemy.tag == "staph") {
        enemy.sprite = StaphDamaged;
        setTimeout(() => {
          enemy.suttuned = false;
          enemy.sprite = Staph;
        }, 500);
      } else {
        enemy.x += enemy.x < player.x ? -enemyHitKnockback : enemyHitKnockback;
        enemy.sprite = BacteriaDamaged;
        setTimeout(() => {
          enemy.suttuned = false;
          enemy.sprite = bacteriaLeft;
        }, 1000);
      }
    }

    if (player.health <= 0) {
      sendScore(score);
      player.isDead = true;
      setTimeout(() => {
        running = false;
        gameOver = true;
        document.getElementById("HomePage").style.display = "block";
        document.getElementById("game-container").style.display = "none";
        window.location.reload();
      }, 500);
    }

    ctx.drawImage(enemy.sprite, enemy.x, enemy.y, enemy.width, enemy.height);
  }
}

function sendScore(score) {
  fetch("http://localhost:3000/api/score", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ player: "Shashank", score: score }),
  })
    .then((response) => response.json())
    .catch((error) => console.error("Error:", error));
}

function gameLoop(timestamp) {
  if (gameOver || !running) return;
  if (!lastTime) lastTime = timestamp;
  deltaTime = (timestamp - lastTime) / 1000;
  lastTime = timestamp;
  deltaTime = sanitizeDeltaTime(deltaTime);
  if (deltaTime > 0.1) deltaTime = 0.1;

  if (hitstop === true && hitstopTimeoutAllreadyBegun === false) {
    hitstopTimeoutAllreadyBegun = true;
    setTimeout(() => {
      hitstop = false;
    }, 100);
    return;
  }

  updateStaph(enemies[enemies.length - 1], deltaTime);
  update(deltaTime);
  render(deltaTime);
  requestAnimationFrame(gameLoop);
}

requestAnimationFrame(gameLoop);
