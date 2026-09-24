// LevelManager.js – simple multi‑level loader

// Global array of level definitions (filled by separate level files)
window.LEVELS = [];

const LevelManager = (function () {
  let currentIndex = 0;

  function loadLevel(index) {
    if (index < 0 || index >= window.LEVELS.length) return;
    currentIndex = index;
    const level = window.LEVELS[currentIndex];
    // Clear existing arrays (these are defined in main.js as globals)
    window.platforms = [];
    window.collectibles = [];
    window.enemies = [];
    window.keyItems = [];
    window.gates = [];
    // Populate arrays from level data
    (level.platforms || []).forEach(p => window.platforms.push(p));
    (level.collectibles || []).forEach(c => {
      c.collected = false;
      window.collectibles.push(c);
    });
    (level.enemies || []).forEach(e => {
      e.defeated = false;
      e.hp = 1;
      e.x = e.startX;
      window.enemies.push(e);
    });
    (level.keyItems || []).forEach(k => {
      k.collected = false;
      window.keyItems.push(k);
    });
    (level.gates || []).forEach(g => {
      g.unlocked = false;
      g.openOffset = 0;
      window.gates.push(g);
    });
    // Set checkpoint
    window.checkpoint = { x: level.checkpoint.x, y: level.checkpoint.y };
    // Reset timer for the level
    window.levelStartTime = performance.now();
  }

  function nextLevel() {
    const next = currentIndex + 1;
    if (next < window.LEVELS.length) {
      loadLevel(next);
    } else {
      // No more levels – trigger victory state (custom overlay)
      window.gameState = 'victory';
    }
  }

  function getCurrent() {
    return window.LEVELS[currentIndex];
  }

  function getCurrentIndex() {
    return currentIndex;
  }

  return {
    loadLevel,
    nextLevel,
    getCurrent,
    getCurrentIndex,
  };
})();

// expose globally
window.LevelManager = LevelManager;

