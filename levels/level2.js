// levels/level2.js – introduces Upside‑Down only platform bridges and dual-world challenges
window.LEVELS.push({
  name: 'Level 2 - Dual World & Sealed Gate',
  checkpoint: { x: 100, y: 0 },
  platforms: [
    new Platform(0, 500, 2200, 40), // Ground (both worlds)
    // Hawkins platform steps
    new Platform(260, 410, 140, 20),
    new Platform(480, 330, 140, 20),
    // Upside-Down bridge platforms (required to cross the gap!)
    new Platform(700, 270, 140, 20, { hawkins: false, upsideDown: true }),
    new Platform(920, 220, 140, 20, { hawkins: false, upsideDown: true }),
    // Hawkins exit platform
    new Platform(1140, 220, 140, 20, { hawkins: true, upsideDown: false }),
    // Gateway platform
    new Platform(1380, 200, 160, 22, { hawkins: true, upsideDown: true }, true)
  ],
  keyItems: [
    // Walkie-Talkie placed on a high Hawkins platform
    new KeyItem(540, 270, 'Walkie-Talkie', { hawkins: true, upsideDown: false })
  ],
  gates: [
    // Blast door blocking access to the Gateway platform
    new SealedGate(1260, 40, 26, 460, 'Walkie-Talkie', { hawkins: true, upsideDown: true })
  ],
  collectibles: [
    new Collectible(330, 370),
    new Collectible(550, 290),
    // Upside-Down exclusive collectibles
    new Collectible(770, 230, { hawkins: false, upsideDown: true }),
    new Collectible(990, 180, { hawkins: false, upsideDown: true }),
    new Collectible(1210, 180)
  ],
  enemies: [
    new Enemy(450, 460, 40, 40, 250),
    new Enemy(880, 180, 40, 40, 120, { hawkins: false, upsideDown: true })
  ]
});
