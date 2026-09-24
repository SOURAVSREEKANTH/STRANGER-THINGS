// js/Atmosphere.js – Atmosphere, Spores Particle System & Dynamic Flashlight Lighting

const Atmosphere = (function () {
  // Spore / Ash Particle System
  const PARTICLE_COUNT = 85;
  const particles = [];

  function initParticles() {
    particles.length = 0;
    const w = window.innerWidth || 1200;
    const h = window.innerHeight || 800;
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      particles.push({
        x: Math.random() * w,
        y: Math.random() * h,
        radius: Math.random() * 2.5 + 0.8,
        vx: (Math.random() - 0.5) * 0.8,
        vy: (Math.random() - 0.5) * 0.5 - 0.2, // slight upward float
        alpha: Math.random() * 0.6 + 0.2,
        phase: Math.random() * Math.PI * 2,
        pulseSpeed: Math.random() * 0.02 + 0.01
      });
    }
  }
  initParticles();
  window.addEventListener('resize', initParticles);

  function updateParticles(canvas) {
    for (const p of particles) {
      p.phase += p.pulseSpeed;
      p.x += p.vx + Math.sin(p.phase) * 0.4;
      p.y += p.vy;

      // Wrap around screen edges
      if (p.x < 0) p.x = canvas.width;
      if (p.x > canvas.width) p.x = 0;
      if (p.y < 0) p.y = canvas.height;
      if (p.y > canvas.height) p.y = 0;
    }
  }

  // Draw floating ash/spores in the Upside Down
  function drawParticles(ctx, canvas, isUpsideDown) {
    if (!isUpsideDown) return;
    updateParticles(canvas);

    ctx.save();
    for (const p of particles) {
      const currentAlpha = p.alpha * (0.6 + 0.4 * Math.sin(p.phase));
      ctx.fillStyle = `rgba(220, 180, 255, ${currentAlpha})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fill();

      // Soft glow on larger particles
      if (p.radius > 2.0) {
        ctx.fillStyle = `rgba(180, 70, 255, ${currentAlpha * 0.35})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius * 2.5, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.restore();
  }

  // Dynamic flashlight and darkness lighting overlay
  function drawLighting(ctx, canvas, player, cameraX, cameraY, isUpsideDown, platforms, collectibles) {
    ctx.save();

    // Create an offscreen-style darkness layer using composite operations
    // Base darkness level: deep eerie dark in Upside Down, mild dusk in Hawkins
    const darknessColor = isUpsideDown ? 'rgba(3, 2, 8, 0.90)' : 'rgba(10, 15, 25, 0.45)';

    // We use a dedicated canvas or blend mode
    // Draw darkness over entire screen
    ctx.fillStyle = darknessColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Now carve out light sources using 'destination-out'
    ctx.globalCompositeOperation = 'destination-out';

    const playerScreenX = player.x - cameraX + player.width / 2;
    const playerScreenY = player.y - cameraY + player.height / 2;
    const facing = player.facing || 1; // 1 = right, -1 = left

    // 1. Player ambient body glow
    const ambientRadius = isUpsideDown ? 70 : 120;
    const ambientGrad = ctx.createRadialGradient(
      playerScreenX, playerScreenY, 10,
      playerScreenX, playerScreenY, ambientRadius
    );
    ambientGrad.addColorStop(0, 'rgba(0, 0, 0, 1)');
    ambientGrad.addColorStop(0.5, 'rgba(0, 0, 0, 0.6)');
    ambientGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');

    ctx.fillStyle = ambientGrad;
    ctx.beginPath();
    ctx.arc(playerScreenX, playerScreenY, ambientRadius, 0, Math.PI * 2);
    ctx.fill();

    // 2. Directional Flashlight Cone
    const beamLength = isUpsideDown ? 360 : 440;
    const beamAngle = 0.40; // width of cone (~23 degrees each side)
    const baseAngle = facing === 1 ? 0 : Math.PI;

    const flashGrad = ctx.createRadialGradient(
      playerScreenX, playerScreenY, 20,
      playerScreenX + Math.cos(baseAngle) * (beamLength * 0.7),
      playerScreenY,
      beamLength
    );
    flashGrad.addColorStop(0, 'rgba(0, 0, 0, 0.95)');
    flashGrad.addColorStop(0.4, 'rgba(0, 0, 0, 0.85)');
    flashGrad.addColorStop(0.8, 'rgba(0, 0, 0, 0.4)');
    flashGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');

    ctx.fillStyle = flashGrad;
    ctx.beginPath();
    ctx.moveTo(playerScreenX, playerScreenY - 5);
    ctx.arc(playerScreenX, playerScreenY, beamLength, baseAngle - beamAngle, baseAngle + beamAngle);
    ctx.closePath();
    ctx.fill();

    // 3. Glowing Goal Platforms & Collectibles (beacon of light in the dark)
    if (platforms) {
      for (const p of platforms) {
        if (p.isGoal) {
          const gx = p.x - cameraX + p.w / 2;
          const gy = p.y - cameraY + p.h / 2;
          const goalGrad = ctx.createRadialGradient(gx, gy, 15, gx, gy, 160);
          goalGrad.addColorStop(0, 'rgba(0, 0, 0, 0.9)');
          goalGrad.addColorStop(0.5, 'rgba(0, 0, 0, 0.5)');
          goalGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
          ctx.fillStyle = goalGrad;
          ctx.beginPath();
          ctx.arc(gx, gy, 160, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }

    if (collectibles) {
      for (const c of collectibles) {
        if (!c.collected) {
          const cx = c.x - cameraX;
          const cy = c.y - cameraY;
          const coinGrad = ctx.createRadialGradient(cx, cy, 5, cx, cy, 45);
          coinGrad.addColorStop(0, 'rgba(0, 0, 0, 0.75)');
          coinGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
          ctx.fillStyle = coinGrad;
          ctx.beginPath();
          ctx.arc(cx, cy, 45, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }

    ctx.restore();
  }

  // Draw Upside Down platform tendrils / vines
  function drawTendrils(ctx, p, cameraX, cameraY, isUpsideDown) {
    if (!isUpsideDown) return;
    ctx.save();
    ctx.strokeStyle = '#4a154b';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    const px = p.x - cameraX;
    const py = p.y - cameraY + p.h;
    // Simple dripping tendrils
    const step = 30;
    for (let x = px + 10; x < px + p.w - 10; x += step) {
      const len = 12 + Math.sin(x * 0.1) * 8;
      ctx.moveTo(x, py);
      ctx.quadraticCurveTo(x + 5, py + len / 2, x + 2, py + len);
    }
    ctx.stroke();
    ctx.restore();
  }

  return {
    drawParticles,
    drawLighting,
    drawTendrils
  };
})();

window.Atmosphere = Atmosphere;

