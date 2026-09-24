// levels/level1.js – tutorial level (Hawkins Tutorial)
window.LEVELS.push({
  name: 'Level 1 - Hawkins Tutorial',
  checkpoint: { x: 100, y: 0 },
  platforms: [
    new Platform(0, 500, 2200, 40), // Ground
    new Platform(260, 410, 150, 20),
    new Platform(480, 340, 150, 20),
    new Platform(700, 280, 150, 20),
    new Platform(920, 220, 150, 20),
    new Platform(1140, 220, 150, 20),
    new Platform(1360, 220, 150, 20),
    // Gateway platform
    new Platform(1580, 200, 160, 22, { hawkins: true, upsideDown: true }, true)
  ],
  collectibles: [
    new Collectible(335, 370),
    new Collectible(555, 300),
    new Collectible(775, 240),
    new Collectible(995, 180),
    new Collectible(1215, 180),
    new Collectible(1435, 180)
  ],
  enemies: [
    new Enemy(460, 460, 40, 40, 260) // ground patroller
  ]
});
