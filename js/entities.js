// js/entities.js – Entity classes for Player, Platform, Collectibles, and Enemies

class Player {
  constructor() {
    this.width = 36;
    this.height = 56;
    this.x = 100;
    this.y = 0; // start above ground, gravity will drop
    this.vx = 0;
    this.vy = 0;
    this.speed = 4.6;
    this.jumpStrength = 13.5;
    this.color = '#00e5ff'; // retro cyan jacket
    this.onGround = false;
    this.facing = 1; // 1 = right, -1 = left
    this.coyoteTime = 0;
    this.jumpBuffer = 0;
  }
  update(keys) {
    // horizontal movement
    if (keys['a'] || keys['arrowleft']) {
      this.vx = -this.speed;
      this.facing = -1;
    } else if (keys['d'] || keys['arrowright']) {
      this.vx = this.speed;
      this.facing = 1;
    } else {
      this.vx = 0;
    }

    // Coyote time tracking (allows jumping a few frames after leaving a ledge)
    if (this.onGround) {
      this.coyoteTime = 8;
    } else if (this.coyoteTime > 0) {
      this.coyoteTime--;
    }

    // Jump buffering (detects jump pressed slightly before landing or on ground)
    const jumpPressed = keys[' '] || keys['space'] || keys['w'] || keys['arrowup'];
    if (jumpPressed) {
      this.jumpBuffer = 6;
    } else if (this.jumpBuffer > 0) {
      this.jumpBuffer--;
    }

    // Execute jump if buffered and coyote time is available
    if (this.jumpBuffer > 0 && this.coyoteTime > 0) {
      this.vy = -this.jumpStrength;
      this.onGround = false;
      this.coyoteTime = 0;
      this.jumpBuffer = 0;
      if (window.SoundManager) {
        window.SoundManager.playJump();
      }
    }

    // Smooth, responsive gravity
    this.vy += 0.52;
    if (this.vy > 18) this.vy = 18;
    this.x += this.vx;
    this.y += this.vy;
  }
  draw(offsetX, offsetY) {
    const c = window.ctx || (typeof ctx !== 'undefined' ? ctx : null);
    if (!c) return;

    c.save();
    const px = this.x - offsetX;
    const py = this.y - offsetY;

    // Body (Jacket)
    c.fillStyle = this.color;
    c.fillRect(px, py + 18, this.width, this.height - 18);

    // Head / Face
    c.fillStyle = '#ffccaa'; // skin tone
    c.fillRect(px + 4, py + 4, this.width - 8, 14);

    // Retro 80s Cap/Hair
    c.fillStyle = '#b71c1c'; // red trucker cap
    c.fillRect(px + 2, py, this.width - 4, 6);
    // Cap visor in facing direction
    if (this.facing === 1) {
      c.fillRect(px + this.width - 6, py + 4, 8, 3);
    } else {
      c.fillRect(px - 6, py + 4, 8, 3);
    }

    // Eyes
    c.fillStyle = '#111';
    const eyeX = this.facing === 1 ? px + this.width - 10 : px + 6;
    c.fillRect(eyeX, py + 8, 3, 3);

    // Flashlight held in hand
    c.fillStyle = '#e0e0e0';
    const flX = this.facing === 1 ? px + this.width - 2 : px - 8;
    c.fillRect(flX, py + 28, 10, 5);
    // Flashlight bulb lens glow
    c.fillStyle = '#ffff66';
    const bulbX = this.facing === 1 ? flX + 10 : flX - 2;
    c.fillRect(bulbX, py + 27, 2, 7);

    c.restore();
  }
}

class Platform {
  constructor(x, y, w, h, visibility = { hawkins: true, upsideDown: true }, isGoal = false) {
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
    this.color = isGoal ? '#ffd700' : '#455a64'; // goal highlighted in golden yellow
    this.visibility = visibility;
    this.isGoal = isGoal;
  }
  draw(offsetX, offsetY) {
    const c = window.ctx || (typeof ctx !== 'undefined' ? ctx : null);
    if (!c) return;

    c.save();
    const px = this.x - offsetX;
    const py = this.y - offsetY;

    if (this.isGoal) {
      // Pulsing golden beacon platform
      const pulse = 0.8 + 0.2 * Math.sin(performance.now() * 0.006);
      c.fillStyle = `rgba(255, 215, 0, ${pulse})`;
      c.shadowColor = '#ffea00';
      c.shadowBlur = 15;
      c.fillRect(px, py, this.w, this.h);

      // Finish flag / beacon sign
      c.fillStyle = '#fff';
      c.font = 'bold 12px sans-serif';
      c.textAlign = 'center';
      c.fillText('GATEWAY', px + this.w / 2, py - 8);
    } else {
      c.fillStyle = this.color;
      c.fillRect(px, py, this.w, this.h);
      // Top highlight line
      c.fillStyle = 'rgba(255, 255, 255, 0.2)';
      c.fillRect(px, py, this.w, 3);
    }
    c.restore();

    // In the Upside Down, add tendril vines hanging underneath
    if (window.Atmosphere && window.DimensionManager) {
      const isUD = window.DimensionManager.getCurrent() === 'upsideDown';
      window.Atmosphere.drawTendrils(c, this, offsetX, offsetY, isUD);
    }
  }
}

class CheckpointPlatform extends Platform {
  constructor(x, y, w, h) {
    super(x, y, w, h, { hawkins: true, upsideDown: false });
    this.color = '#00e676';
  }
}

class Collectible {
  constructor(x, y, visibility = { hawkins: true, upsideDown: true }) {
    this.x = x;
    this.y = y;
    this.r = 10;
    this.collected = false;
    this.color = '#ffeb3b';
    this.visibility = visibility;
  }
  draw(offsetX, offsetY) {
    if (this.collected) return;
    const c = window.ctx || (typeof ctx !== 'undefined' ? ctx : null);
    if (!c) return;

    c.save();
    const px = this.x - offsetX;
    const py = this.y - offsetY;
    const pulse = 1 + 0.15 * Math.sin(performance.now() * 0.008 + this.x);

    // Glowing orb
    c.shadowColor = '#ffeb3b';
    c.shadowBlur = 12;
    c.fillStyle = this.color;
    c.beginPath();
    c.arc(px, py, this.r * pulse, 0, Math.PI * 2);
    c.fill();

    // Inner bright core
    c.fillStyle = '#fff';
    c.beginPath();
    c.arc(px, py, (this.r * 0.4) * pulse, 0, Math.PI * 2);
    c.fill();

    c.restore();
  }
}

class Enemy {
  constructor(x, y, w, h, patrolDistance, visibility = { hawkins: true, upsideDown: true }) {
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
    this.vx = 0;
    this.vy = 0;
    this.speed = 1.8;
    this.chaseSpeed = 3.6;
    this.dir = 1;
    this.startX = x;
    this.startY = y;
    this.patrolDistance = patrolDistance;
    this.color = '#c62828'; // Dark Demogorgon crimson
    this.visibility = visibility;
    this.hp = 1;
    this.defeated = false;

    // AI States: 'PATROL', 'ALERT', 'CHASE', 'LUNGE'
    this.state = 'PATROL';
    this.alertTimer = 0;
    this.lungeCooldown = 0;
    this.onGround = false;
    this.petalOpen = 0; // 0 to 1 for mouth opening animation
  }

  update(player, platforms, isVisible) {
    if (this.defeated) return;

    if (this.lungeCooldown > 0) this.lungeCooldown--;

    const dx = player ? (player.x + player.width / 2) - (this.x + this.w / 2) : 0;
    const dy = player ? (player.y + player.height / 2) - (this.y + this.h / 2) : 0;
    const dist = Math.hypot(dx, dy);

    // Can only sense/hunt player if creature is active in the current dimension
    const canSensePlayer = isVisible && player && Math.abs(dy) < 220;

    // Heightened detection in Upside Down
    const isUD = window.DimensionManager && window.DimensionManager.getCurrent() === 'upsideDown';
    const detectionDist = isUD ? 330 : 250;

    // Check if player's flashlight is directly illuminating the enemy
    const playerFacingEnemy = player && ((player.facing === 1 && dx < 0) || (player.facing === -1 && dx > 0));
    const illuminatedByFlashlight = playerFacingEnemy && dist < (isUD ? 360 : 420);

    const playerDetected = canSensePlayer && (dist < detectionDist || illuminatedByFlashlight);

    // --- State Machine ---
    switch (this.state) {
      case 'PATROL':
        this.petalOpen = Math.max(0, this.petalOpen - 0.08);
        this.vx = this.speed * this.dir;
        if (this.x > this.startX + this.patrolDistance) {
          this.dir = -1;
        } else if (this.x < this.startX) {
          this.dir = 1;
        }

        if (playerDetected) {
          this.state = 'ALERT';
          this.alertTimer = 22; // brief menacing halt before sprint
          this.dir = dx >= 0 ? 1 : -1;
          this.vx = 0;
          if (window.SoundManager) {
            window.SoundManager.playDemogorgonScreech();
          }
        }
        break;

      case 'ALERT':
        this.vx = 0;
        this.dir = dx >= 0 ? 1 : -1;
        this.petalOpen = Math.min(1, this.petalOpen + 0.12);
        this.alertTimer--;
        if (this.alertTimer <= 0) {
          this.state = 'CHASE';
        }
        break;

      case 'CHASE':
        this.petalOpen = Math.min(1, this.petalOpen + 0.05);
        this.dir = dx >= 0 ? 1 : -1;
        this.vx = this.dir * this.chaseSpeed;

        // Initiate sudden LUNGE attack if within striking distance
        if (dist < 125 && Math.abs(dy) < 50 && this.onGround && this.lungeCooldown <= 0) {
          this.state = 'LUNGE';
          this.vy = -6.8;
          this.vx = this.dir * 6.2;
          this.lungeCooldown = 90;
          this.onGround = false;
        }

        // Lose track if player escapes range or shifts dimension
        if (!canSensePlayer || dist > 440) {
          this.state = 'PATROL';
        }
        break;

      case 'LUNGE':
        this.petalOpen = 1;
        // Check if landed back on ground to resume chasing
        if (this.onGround && this.vy >= 0) {
          this.state = 'CHASE';
        }
        break;
    }

    // Apply gravity and update position
    this.vy += 0.52;
    if (this.vy > 18) this.vy = 18;
    this.x += this.vx;
    this.y += this.vy;

    // Platform collision handling
    this.onGround = false;
    if (platforms) {
      for (const p of platforms) {
        if (!window.DimensionManager || !window.DimensionManager.isVisible(p)) continue;
        if (
          this.x < p.x + p.w &&
          this.x + this.w > p.x &&
          this.y + this.h >= p.y &&
          this.y + this.h <= p.y + p.h + 14 &&
          this.vy >= 0
        ) {
          this.y = p.y - this.h;
          this.vy = 0;
          this.onGround = true;
        }
      }
    }
  }

  draw(offsetX, offsetY) {
    if (this.defeated) return;
    const c = window.ctx || (typeof ctx !== 'undefined' ? ctx : null);
    if (!c) return;

    c.save();
    const px = this.x - offsetX;
    const py = this.y - offsetY;

    // Menacing Alert Indicator (!) when hunting
    if (this.state === 'ALERT' || this.state === 'CHASE' || this.state === 'LUNGE') {
      const pulse = 1 + 0.2 * Math.sin(performance.now() * 0.02);
      c.fillStyle = '#ff1744';
      c.shadowColor = '#ff1744';
      c.shadowBlur = 12;
      c.font = `bold ${Math.round(18 * pulse)}px monospace`;
      c.textAlign = 'center';
      c.fillText('!', px + this.w / 2, py - 12);
    }

    // Body
    c.shadowColor = '#ff1744';
    c.shadowBlur = this.state === 'CHASE' ? 14 : 6;
    c.fillStyle = this.color;
    c.fillRect(px, py, this.w, this.h);

    // Open/Closed Petal Jaws (Stranger Things Demogorgon face flower)
    const jawOpen = this.petalOpen * 6;
    c.fillStyle = '#ff5252';
    // Upper petal
    c.fillRect(px + 4, py - jawOpen, this.w - 8, 4 + jawOpen);
    // Lower petal
    c.fillRect(px + 4, py + 16, this.w - 8, 4 + jawOpen);

    // White needle teeth when mouth is open
    if (this.petalOpen > 0.3) {
      c.fillStyle = '#fff';
      c.fillRect(px + 8, py - jawOpen + 2, 4, 3);
      c.fillRect(px + this.w - 12, py - jawOpen + 2, 4, 3);
      c.fillRect(px + 8, py + 16, 4, 3);
      c.fillRect(px + this.w - 12, py + 16, 4, 3);
    }

    // Glowing predatory eyes
    c.fillStyle = '#ff1744';
    c.shadowColor = '#ff1744';
    c.shadowBlur = 10;
    const eyeOffsetX = this.dir === 1 ? this.w - 10 : 4;
    c.fillRect(px + eyeOffsetX, py + 6, 6, 6);

    // Claws / Feet
    c.fillStyle = '#1a1a1a';
    c.shadowBlur = 0;
    c.fillRect(px + 2, py + this.h - 6, 8, 6);
    c.fillRect(px + this.w - 10, py + this.h - 6, 8, 6);

    c.restore();
  }
}

class Projectile {
  constructor(x, y, vx, vy) {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.r = 4;
    this.gravity = 0.12;
    this.life = 80;
    this.trail = [];
  }
  update() {
    this.trail.push({ x: this.x, y: this.y, alpha: 0.8 });
    if (this.trail.length > 5) this.trail.shift();
    for (const t of this.trail) t.alpha -= 0.15;

    this.vy += this.gravity;
    this.x += this.vx;
    this.y += this.vy;
    this.life--;
  }
  draw(offsetX, offsetY) {
    const c = window.ctx || (typeof ctx !== 'undefined' ? ctx : null);
    if (!c) return;

    c.save();
    // Motion trail
    for (const t of this.trail) {
      if (t.alpha <= 0) continue;
      c.fillStyle = `rgba(255, 235, 59, ${t.alpha * 0.5})`;
      c.beginPath();
      c.arc(t.x - offsetX, t.y - offsetY, this.r * 0.7, 0, Math.PI * 2);
      c.fill();
    }

    // Glowing pebble projectile
    const px = this.x - offsetX;
    const py = this.y - offsetY;
    c.shadowColor = '#ffff00';
    c.shadowBlur = 8;
    c.fillStyle = '#fff59d';
    c.beginPath();
    c.arc(px, py, this.r, 0, Math.PI * 2);
    c.fill();
    c.restore();
  }
}

class HitParticle {
  constructor(x, y, color = '#ff1744') {
    this.x = x;
    this.y = y;
    const angle = Math.random() * Math.PI * 2;
    const speed = Math.random() * 4.5 + 1.5;
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed;
    this.radius = Math.random() * 3 + 1.5;
    this.color = color;
    this.alpha = 1.0;
    this.decay = Math.random() * 0.04 + 0.025;
  }
  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.vy += 0.12; // gravity
    this.alpha -= this.decay;
  }
  draw(offsetX, offsetY) {
    if (this.alpha <= 0) return;
    const c = window.ctx || (typeof ctx !== 'undefined' ? ctx : null);
    if (!c) return;
    c.save();
    c.fillStyle = this.color;
    c.globalAlpha = Math.max(0, this.alpha);
    c.beginPath();
    c.arc(this.x - offsetX, this.y - offsetY, this.radius, 0, Math.PI * 2);
    c.fill();
    c.restore();
  }
}

class KeyItem {
  constructor(x, y, type = 'Walkie-Talkie', visibility = { hawkins: true, upsideDown: false }) {
    this.x = x;
    this.y = y;
    this.type = type; // 'Walkie-Talkie' or 'Lab Keycard'
    this.visibility = visibility;
    this.collected = false;
    this.w = 24;
    this.h = 32;
    this.floatPhase = Math.random() * Math.PI * 2;
  }
  draw(offsetX, offsetY) {
    if (this.collected) return;
    const c = window.ctx || (typeof ctx !== 'undefined' ? ctx : null);
    if (!c) return;

    c.save();
    this.floatPhase += 0.05;
    const hoverY = Math.sin(this.floatPhase) * 6;
    const px = this.x - offsetX;
    const py = this.y - offsetY + hoverY;

    if (this.type === 'Walkie-Talkie') {
      // Radio antenna
      c.strokeStyle = '#bdbdbd';
      c.lineWidth = 2;
      c.beginPath();
      c.moveTo(px + 6, py);
      c.lineTo(px + 6, py - 14);
      c.stroke();

      // Pulsing radio wave arcs
      const pulse = (Math.sin(performance.now() * 0.008) + 1) / 2;
      c.strokeStyle = `rgba(0, 229, 255, ${0.8 - pulse * 0.5})`;
      c.lineWidth = 1.5;
      c.beginPath();
      c.arc(px + 6, py - 14, 8 + pulse * 10, -Math.PI * 0.7, -Math.PI * 0.1);
      c.stroke();

      // Walkie-Talkie body (retro black/grey radio)
      c.fillStyle = '#263238';
      c.fillRect(px, py, 22, 28);

      // Speaker grille
      c.fillStyle = '#455a64';
      c.fillRect(px + 4, py + 8, 14, 12);
      c.fillStyle = '#111';
      c.fillRect(px + 6, py + 11, 10, 2);
      c.fillRect(px + 6, py + 15, 10, 2);

      // Power LED (blinking yellow)
      c.fillStyle = '#ffea00';
      c.shadowColor = '#ffea00';
      c.shadowBlur = 8;
      c.beginPath();
      c.arc(px + 16, py + 4, 2.5, 0, Math.PI * 2);
      c.fill();
    } else {
      // Lab Keycard
      c.shadowColor = '#00e5ff';
      c.shadowBlur = 10;
      c.fillStyle = '#00e5ff';
      c.fillRect(px, py, 20, 28);
      c.fillStyle = '#fff';
      c.fillRect(px + 3, py + 4, 14, 8);
      c.fillStyle = '#263238';
      c.fillRect(px + 3, py + 16, 14, 4);
    }

    // Label above item
    c.shadowBlur = 0;
    c.fillStyle = '#fff';
    c.font = 'bold 11px monospace';
    c.textAlign = 'center';
    c.fillText(this.type.toUpperCase(), px + 10, py - 18);

    c.restore();
  }
}

class SealedGate {
  constructor(x, y, w, h, requiredKey = 'Walkie-Talkie', visibility = { hawkins: true, upsideDown: true }) {
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
    this.requiredKey = requiredKey;
    this.visibility = visibility;
    this.unlocked = false;
    this.openOffset = 0; // vertical slide opening
  }
  update() {
    if (this.unlocked && this.openOffset < this.h) {
      this.openOffset += 4;
      if (this.openOffset > this.h) this.openOffset = this.h;
    }
  }
  draw(offsetX, offsetY) {
    const c = window.ctx || (typeof ctx !== 'undefined' ? ctx : null);
    if (!c) return;

    c.save();
    const px = this.x - offsetX;
    const currentH = this.h - this.openOffset;

    if (currentH > 2) {
      const py = this.y - offsetY;

      // Heavy metallic blast door
      c.fillStyle = '#37474f';
      c.fillRect(px, py, this.w, currentH);

      // Warning hazard stripes
      c.fillStyle = '#ffb300';
      for (let y = py + 10; y < py + currentH - 10; y += 30) {
        c.fillRect(px + 2, y, this.w - 4, 10);
      }

      // Security Lock Status LED
      const ledY = py + Math.min(60, currentH / 2);
      c.fillStyle = this.unlocked ? '#00e676' : '#ff1744';
      c.shadowColor = this.unlocked ? '#00e676' : '#ff1744';
      c.shadowBlur = 12;
      c.beginPath();
      c.arc(px + this.w / 2, ledY, 6, 0, Math.PI * 2);
      c.fill();

      // Lock text / Key required indicator
      c.shadowBlur = 0;
      c.fillStyle = '#fff';
      c.font = 'bold 11px monospace';
      c.textAlign = 'center';
      c.save();
      c.translate(px + this.w / 2, ledY + 45);
      c.rotate(-Math.PI / 2);
      c.fillText(this.unlocked ? 'OPEN' : 'SEALED GATE', 0, 4);
      c.restore();
    }

    c.restore();
  }
}

window.Player = Player;
window.Platform = Platform;
window.CheckpointPlatform = CheckpointPlatform;
window.Collectible = Collectible;
window.Enemy = Enemy;
window.Projectile = Projectile;
window.HitParticle = HitParticle;
window.KeyItem = KeyItem;
window.SealedGate = SealedGate;
