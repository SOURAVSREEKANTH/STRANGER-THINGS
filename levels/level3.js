// levels/level3.js – final challenge with alternating dimensional shifting and Lab Keycard puzzle
window.LEVELS.push({
  name: 'Level 3 - Final Challenge & Hawkins Lab Gate',
  checkpoint: { x: 100, y: 0 },
  platforms: [
    new Platform(0, 500, 2400, 40), // Ground (both)
    // Step 1: Hawkins
    new Platform(260, 410, 140, 20, { hawkins: true, upsideDown: false }),
    // Step 2: Upside-Down (must press E mid-air or from prev platform)
    new Platform(480, 340, 140, 20, { hawkins: false, upsideDown: true }),
    // Step 3: Hawkins (contains Lab Keycard)
    new Platform(700, 280, 140, 20, { hawkins: true, upsideDown: false }),
    // Step 4: Upside-Down
    new Platform(920, 230, 140, 20, { hawkins: false, upsideDown: true }),
    // Bridge to finish (both dimensions)
    new Platform(1140, 200, 140, 20, { hawkins: true, upsideDown: true }),
    new Platform(1360, 190, 140, 20, { hawkins: true, upsideDown: true }),
    // Gateway platform
    new Platform(1580, 180, 160, 22, { hawkins: true, upsideDown: true }, true)
  ],
  keyItems: [
    new KeyItem(760, 220, 'Lab Keycard', { hawkins: true, upsideDown: false })
  ],
  gates: [
    new SealedGate(1470, 20, 26, 480, 'Lab Keycard', { hawkins: true, upsideDown: true })
  ],
  collectibles: [
    new Collectible(330, 370),
    new Collectible(550, 300, { hawkins: false, upsideDown: true }),
    new Collectible(770, 240, { hawkins: true, upsideDown: false }),
    new Collectible(990, 190, { hawkins: false, upsideDown: true }),
    new Collectible(1210, 160),
    new Collectible(1430, 150)
  ],
  enemies: [
    new Enemy(450, 460, 40, 40, 250),
    new Enemy(1050, 160, 40, 40, 120, { hawkins: false, upsideDown: true })
  ]
});
