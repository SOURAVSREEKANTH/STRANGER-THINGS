// main.js – Stranger Things Prototype with Slingshot Combat, Puzzle Gates & Web Audio

// ----- Canvas setup -----
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
window.ctx = ctx;

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

// ----- Input & Combat Handling -----
const keys = {};
let lastShotTime = 0;
const shootCooldown = 320; // ms between slingshot shots

function shootSlingshot(screenTargetX, screenTargetY) {
  if (window.gameState === 'victory') return;
  const now = performance.now();
  if (now - lastShotTime < shootCooldown) return;
  lastShotTime = now;

  // Origin at player's slingshot hand
  const originX = player.x + (player.facing === 1 ? player.width + 2 : -2);
  const originY = player.y + 28;

  let vx, vy;
  if (screenTargetX !== undefined && screenTargetY !== undefined) {
    // Aim toward mouse cursor in world space
    const worldTargetX = screenTargetX + cameraX;
    const worldTargetY = screenTargetY + cameraY;
    const dx = worldTargetX - originX;
    const dy = worldTargetY - originY;
    const angle = Math.atan2(dy, dx);
    const speed = 11.5;
    vx = Math.cos(angle) * speed;
    vy = Math.sin(angle) * speed;
    player.facing = vx >= 0 ? 1 : -1;
  } else {
    // Shoot forward in facing direction with slight upward angle
    vx = player.facing * 11;
    vy = -1.5;
  }

  if (window.Projectile) {
    window.projectiles.push(new Projectile(originX, originY, vx, vy));
  }
  if (window.SoundManager) {
    window.SoundManager.playSlingshot();
  }
}

window.addEventListener('keydown', e => {
  const k = e.key.toLowerCase();
  keys[k] = true;

  // Initialize/resume audio on first user interaction
  if (window.SoundManager) {
    window.SoundManager.resume();
  }

  // Shoot slingshot forward with F
  if (k === 'f') {
    shootSlingshot();
  }

  // Toggle dimension when E is pressed
  if (k === 'e') {
    if (window.DimensionManager) {
      window.DimensionManager.toggle();
    }
  }

  // Toggle Mute with M
  if (k === 'm') {
    if (window.SoundManager) {
      window.SoundManager.toggleMute();
    }
  }

  // Restart game after victory when R is pressed
  if (k === 'r' && window.gameState === 'victory') {
    window.gameState = null;
    if (window.LevelManager) {
      window.LevelManager.loadLevel(0);
    }
    score = 0;
    health = maxHealth;
    player.inventory = null;
    player.x = window.checkpoint ? window.checkpoint.x : 100;
    player.y = window.checkpoint ? window.checkpoint.y : 0;
    player.vx = player.vy = 0;
    window.projectiles = [];
    window.hitParticles = [];
    window.levelStartTime = performance.now();
  }
});

window.addEventListener('keyup', e => {
  keys[e.key.toLowerCase()] = false;
});

// Click / tap to aim and shoot slingshot
window.addEventListener('pointerdown', e => {
  if (window.SoundManager) {
    window.SoundManager.resume();
  }
  // Left click fires slingshot towards cursor
  if (e.button === 0) {
    shootSlingshot(e.clientX, e.clientY);
  }
});

// ----- Global game state -----
window.platforms = window.platforms || [];
window.collectibles = window.collectibles || [];
window.enemies = window.enemies || [];
window.keyItems = window.keyItems || [];
window.gates = window.gates || [];
window.projectiles = [];
window.hitParticles = [];
window.checkpoint = window.checkpoint || { x: 100, y: 0 };
window.levelStartTime = performance.now();
window.gameState = null;

const levelTimeLimit = 120000; // 2 minutes per level
let score = 0;
let health = 3;
const maxHealth = 3;
let gateWarningTimer = 0;
let gateWarningMessage = '';

// ----- Instantiate player -----
const player = new Player();
player.inventory = null;

// ----- Load the first level -----
if (window.LevelManager) {
  window.LevelManager.loadLevel(0);
  player.x = window.checkpoint.x;
  player.y = window.checkpoint.y;
}

// ----- Collision handling (Platforms, Gate Doors & Checkpoints) -----
function resolveCollisions() {
  player.onGround = false;
  const currentPlatforms = window.platforms || [];
  const currentGates = window.gates || [];

  // 1. Platform collisions
  for (const p of currentPlatforms) {
    if (!window.DimensionManager.isVisible(p)) continue;
    // AABB check
    if (
      player.x < p.x + p.w &&
      player.x + player.width > p.x &&
      player.y < p.y + p.h &&
      player.y + player.height > p.y
    ) {
      const overlapX = Math.min(player.x + player.width - p.x, p.x + p.w - player.x);
      const overlapY = Math.min(player.y + player.height - p.y, p.y + p.h - player.y);
      if (overlapY < overlapX) {
        // vertical resolution
        if (player.y + player.height / 2 < p.y + p.h / 2) {
          // landed on top
          player.y = p.y - player.height;
          player.vy = 0;
          player.onGround = true;
          // checkpoint activation
          if (p instanceof CheckpointPlatform) {
            window.checkpoint.x = p.x + p.w / 2 - player.width / 2;
            window.checkpoint.y = p.y - player.height;
          }
          // level completion
          if (p.isGoal) {
            if (window.SoundManager) {
              window.SoundManager.playLevelComplete();
            }
            if (window.LevelManager) {
              window.LevelManager.nextLevel();
              player.inventory = null;
              window.projectiles = [];
              if (window.checkpoint) {
                player.x = window.checkpoint.x;
                player.y = window.checkpoint.y;
                player.vx = player.vy = 0;
              }
            }
          }
        } else {
          // hit from below
          player.y = p.y + p.h;
          player.vy = 0;
        }
      } else {
        // horizontal resolution
        if (player.x + player.width / 2 < p.x + p.w / 2) {
          player.x = p.x - player.width;
        } else {
          player.x = p.x + p.w;
        }
        player.vx = 0;
      }
    }
  }

  // 2. Sealed Blast Gate collisions
  for (const g of currentGates) {
    if (!window.DimensionManager.isVisible(g)) continue;
    g.update();
    const effectiveH = g.h - g.openOffset;
    if (effectiveH <= 4) continue; // Door is open, pass freely

    // Check overlap with gate
    if (
      player.x < g.x + g.w &&
      player.x + player.width > g.x &&
      player.y < g.y + effectiveH &&
      player.y + player.height > g.y
    ) {
      if (player.inventory === g.requiredKey) {
        // Key matches: unlock gate!
        g.unlocked = true;
        if (window.SoundManager) {
          window.SoundManager.playGateUnlock();
        }
      } else {
        // Access Denied
        if (gateWarningTimer <= 0) {
          gateWarningMessage = `ACCESS DENIED: FIND ${g.requiredKey.toUpperCase()}!`;
          gateWarningTimer = 85;
          if (window.SoundManager) {
            window.SoundManager.playDenied();
          }
        }
        // Horizontal pushback
        if (player.x + player.width / 2 < g.x + g.w / 2) {
          player.x = g.x - player.width;
        } else {
          player.x = g.x + g.w;
        }
        player.vx = 0;
      }
    }
  }
}

function handleEnemyCollisions() {
  const currentEnemies = window.enemies || [];
  for (const e of currentEnemies) {
    if (!window.DimensionManager.isVisible(e) || e.defeated) continue;
    if (
      player.x < e.x + e.w &&
      player.x + player.width > e.x &&
      player.y < e.y + e.h &&
      player.y + player.height > e.y
    ) {
      health--;
      if (window.SoundManager) {
        window.SoundManager.playHurt();
      }
      if (player.x < e.x) player.x -= 28; else player.x += 28;
      player.vy = -6.5;
    }
  }
}

function handleCollectibles() {
  const currentCollectibles = window.collectibles || [];
  for (const c of currentCollectibles) {
    if (!window.DimensionManager.isVisible(c) || c.collected) continue;
    const dx = (player.x + player.width / 2) - c.x;
    const dy = (player.y + player.height / 2) - c.y;
    const dist = Math.hypot(dx, dy);
    if (dist < c.r + Math.min(player.width, player.height) / 2) {
      c.collected = true;
      score += 10;
      if (window.SoundManager) {
        window.SoundManager.playCollect();
      }
    }
  }
}

// ----- Key Items / Quest Objects -----
function handleKeyItems() {
  const items = window.keyItems || [];
  for (const item of items) {
    if (!window.DimensionManager.isVisible(item) || item.collected) continue;
    const dx = (player.x + player.width / 2) - (item.x + item.w / 2);
    const dy = (player.y + player.height / 2) - (item.y + item.h / 2);
    const dist = Math.hypot(dx, dy);
    if (dist < 34) {
      item.collected = true;
      player.inventory = item.type;
      score += 25;
      if (window.SoundManager) {
        window.SoundManager.playRadioTune();
      }
    }
  }
}

// ----- Projectile & Combat Collisions -----
function updateCombat() {
  const currentPlatforms = window.platforms || [];
  const currentEnemies = window.enemies || [];
  const currentGates = window.gates || [];

  // Update projectiles
  for (let i = window.projectiles.length - 1; i >= 0; i--) {
    const proj = window.projectiles[i];
    proj.update();

    let removed = false;

    // 1. Check collision with visible platforms
    for (const p of currentPlatforms) {
      if (!window.DimensionManager.isVisible(p)) continue;
      if (
        proj.x > p.x &&
        proj.x < p.x + p.w &&
        proj.y > p.y &&
        proj.y < p.y + p.h
      ) {
        // Spawn small sparks on platform hit
        if (window.HitParticle) {
          for (let s = 0; s < 4; s++) {
            window.hitParticles.push(new HitParticle(proj.x, proj.y, '#ffffaa'));
          }
        }
        if (window.SoundManager) {
          window.SoundManager.playHitPlatform();
        }
        window.projectiles.splice(i, 1);
        removed = true;
        break;
      }
    }
    if (removed) continue;

    // 2. Check collision with locked blast gates
    for (const g of currentGates) {
      if (!window.DimensionManager.isVisible(g)) continue;
      const effectiveH = g.h - g.openOffset;
      if (effectiveH <= 4) continue;
      if (
        proj.x > g.x &&
        proj.x < g.x + g.w &&
        proj.y > g.y &&
        proj.y < g.y + effectiveH
      ) {
        if (window.HitParticle) {
          for (let s = 0; s < 4; s++) {
            window.hitParticles.push(new HitParticle(proj.x, proj.y, '#ffea00'));
          }
        }
        if (window.SoundManager) {
          window.SoundManager.playHitPlatform();
        }
        window.projectiles.splice(i, 1);
        removed = true;
        break;
      }
    }
    if (removed) continue;

    // 3. Check collision with visible enemies
    for (const e of currentEnemies) {
      if (!window.DimensionManager.isVisible(e) || e.defeated) continue;
      if (
        proj.x > e.x &&
        proj.x < e.x + e.w &&
        proj.y > e.y &&
        proj.y < e.y + e.h
      ) {
        e.hp--;
        if (e.hp <= 0) {
          e.defeated = true;
          score += 50;
          // Spawn satisfying dissolution particles
          if (window.HitParticle) {
            for (let p = 0; p < 16; p++) {
              window.hitParticles.push(new HitParticle(e.x + e.w / 2, e.y + e.h / 2, '#ff1744'));
              window.hitParticles.push(new HitParticle(e.x + e.w / 2, e.y + e.h / 2, '#424242'));
            }
          }
          if (window.SoundManager) {
            window.SoundManager.playEnemyDefeated();
          }
        }
        window.projectiles.splice(i, 1);
        removed = true;
        break;
      }
    }
    if (removed) continue;

    // 4. Remove expired projectiles
    if (proj.life <= 0) {
      window.projectiles.splice(i, 1);
    }
  }

  // Update hit particles
  for (let i = window.hitParticles.length - 1; i >= 0; i--) {
    const part = window.hitParticles[i];
    part.update();
    if (part.alpha <= 0) {
      window.hitParticles.splice(i, 1);
    }
  }
}

// ----- Camera -----
let cameraX = 0;
let cameraY = 0;
function updateCamera() {
  const targetX = player.x - canvas.width / 2 + player.width / 2;
  cameraX += (targetX - cameraX) * 0.1;
  const targetY = player.y - canvas.height / 2 + player.height / 2;
  cameraY += (targetY - cameraY) * 0.1;
}

// ----- UI -----
function drawUI() {
  ctx.save();
  ctx.fillStyle = '#fff';
  ctx.font = '16px monospace';
  ctx.textAlign = 'left';
  ctx.fillText(`SCORE: ${score}`, 20, 30);

  // Health display with hearts
  let healthStr = '';
  for (let i = 0; i < maxHealth; i++) {
    healthStr += i < health ? '♥ ' : '♡ ';
  }
  ctx.fillStyle = '#ff1744';
  ctx.fillText(`HEALTH: ${healthStr}`, 20, 55);

  ctx.fillStyle = '#fff';
  const elapsed = performance.now() - (window.levelStartTime || performance.now());
  const remaining = Math.max(0, Math.ceil((levelTimeLimit - elapsed) / 1000));
  ctx.fillText(`TIME: ${remaining}s`, 20, 80);

  // Dimension indicator
  const dim = window.DimensionManager ? window.DimensionManager.getCurrent() : 'hawkins';
  ctx.fillStyle = dim === 'hawkins' ? '#00e5ff' : '#ff4444';
  ctx.font = 'bold 16px monospace';
  ctx.fillText(`REALM: ${dim === 'hawkins' ? 'HAWKINS' : 'THE UPSIDE DOWN'} [E]`, 20, 105);

  // Slingshot status
  const now = performance.now();
  const ready = now - lastShotTime >= shootCooldown;
  ctx.fillStyle = ready ? '#ffff00' : '#888';
  ctx.font = '13px monospace';
  ctx.fillText(`SLINGSHOT: ${ready ? 'READY [F / Click]' : 'RELOADING...'}`, 20, 130);

  // Inventory / Quest item status
  const itemText = player.inventory ? player.inventory.toUpperCase() : 'NONE';
  ctx.fillStyle = player.inventory ? '#00e676' : '#888';
  ctx.font = 'bold 13px monospace';
  ctx.fillText(`QUEST ITEM: [${itemText}]`, 20, 150);

  // Audio status
  const isMuted = window.SoundManager ? window.SoundManager.isMuted() : false;
  ctx.fillStyle = '#aaa';
  ctx.font = '13px monospace';
  ctx.fillText(`AUDIO: ${isMuted ? 'MUTED [M]' : 'ON [M]'}`, 20, 170);

  // Warning Banner on Locked Door Interaction
  if (gateWarningTimer > 0) {
    gateWarningTimer--;
    const pulse = Math.sin(performance.now() * 0.015);
    ctx.save();
    ctx.fillStyle = 'rgba(20, 0, 0, 0.85)';
    ctx.strokeStyle = '#ff1744';
    ctx.lineWidth = 3;
    const bannerW = 540;
    const bannerH = 44;
    const bx = canvas.width / 2 - bannerW / 2;
    const by = 80;
    ctx.fillRect(bx, by, bannerW, bannerH);
    ctx.strokeRect(bx, by, bannerW, bannerH);

    ctx.fillStyle = '#ff1744';
    ctx.shadowColor = '#ff1744';
    ctx.shadowBlur = 10;
    ctx.font = 'bold 16px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(gateWarningMessage, canvas.width / 2, by + 28);
    ctx.restore();
  }

  ctx.restore();
}

// ----- Main loop -----
function gameLoop() {
  const isUpsideDown = window.DimensionManager ? window.DimensionManager.getCurrent() === 'upsideDown' : false;

  if (window.gameState !== 'victory') {
    // updates
    player.update(keys);
    resolveCollisions();
    for (const e of (window.enemies || [])) {
      const isVis = window.DimensionManager ? window.DimensionManager.isVisible(e) : true;
      e.update(player, window.platforms, isVis);
    }
    handleEnemyCollisions();
    handleCollectibles();
    handleKeyItems();
    updateCombat();

    // death / respawn
    if (health <= 0 || player.y > 1500) {
      player.x = window.checkpoint ? window.checkpoint.x : 100;
      player.y = window.checkpoint ? window.checkpoint.y : 0;
      player.vx = player.vy = 0;
      health = maxHealth;
      player.inventory = null;
      window.projectiles = [];
      window.hitParticles = [];
      window.levelStartTime = performance.now();
    }
  }

  updateCamera();

  // 1. Clear background
  ctx.fillStyle = isUpsideDown ? '#09050d' : '#0d131a';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // 2. Render game entities in world space
  for (const p of (window.platforms || [])) {
    if (window.DimensionManager.isVisible(p)) p.draw(cameraX, cameraY);
  }
  for (const g of (window.gates || [])) {
    if (window.DimensionManager.isVisible(g)) g.draw(cameraX, cameraY);
  }
  for (const item of (window.keyItems || [])) {
    if (window.DimensionManager.isVisible(item)) item.draw(cameraX, cameraY);
  }
  for (const c of (window.collectibles || [])) {
    if (window.DimensionManager.isVisible(c)) c.draw(cameraX, cameraY);
  }
  for (const e of (window.enemies || [])) {
    if (window.DimensionManager.isVisible(e)) e.draw(cameraX, cameraY);
  }

  // Draw projectiles & combat particles
  for (const proj of window.projectiles) {
    proj.draw(cameraX, cameraY);
  }
  for (const part of window.hitParticles) {
    part.draw(cameraX, cameraY);
  }

  player.draw(cameraX, cameraY);

  // 3. Render floating ash/spores in the Upside Down
  if (window.Atmosphere) {
    window.Atmosphere.drawParticles(ctx, canvas, isUpsideDown);
  }

  // 4. Render Dynamic Flashlight & Atmospheric Darkness Lighting Mask
  if (window.Atmosphere) {
    window.Atmosphere.drawLighting(
      ctx,
      canvas,
      player,
      cameraX,
      cameraY,
      isUpsideDown,
      window.platforms,
      window.collectibles
    );
  }

  // 5. Draw Dimension Transition Flash Overlay
  if (window.DimensionManager && window.DimensionManager.updateTransition()) {
    window.DimensionManager.drawOverlay(ctx, canvas);
  }

  // 6. Draw HUD / UI
  drawUI();

  // 7. Victory Overlay
  if (window.gameState === 'victory') {
    ctx.save();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.82)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#ff1744';
    ctx.shadowColor = '#ff1744';
    ctx.shadowBlur = 25;
    ctx.font = 'bold 58px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('ESCAPE SUCCESSFUL!', canvas.width / 2, canvas.height / 2 - 40);

    ctx.fillStyle = '#ffffff';
    ctx.shadowBlur = 0;
    ctx.font = '24px monospace';
    ctx.fillText(`All Dimensions Conquered | Score: ${score}`, canvas.width / 2, canvas.height / 2 + 15);

    ctx.fillStyle = '#00e5ff';
    ctx.font = '18px monospace';
    ctx.fillText('[ Press R to Play Again ]', canvas.width / 2, canvas.height / 2 + 65);
    ctx.restore();
  }

  requestAnimationFrame(gameLoop);
}

requestAnimationFrame(gameLoop);
