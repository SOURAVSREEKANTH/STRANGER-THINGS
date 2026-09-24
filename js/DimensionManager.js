// DimensionManager.js – handles world toggling and visual/audio transition

const DimensionManager = (function () {
  // Two possible dimensions
  const DIMENSIONS = {
    HAWKINS: 'hawkins',
    UPSIDE_DOWN: 'upsideDown',
  };

  let current = DIMENSIONS.HAWKINS;
  let transitioning = false;
  let transitionStart = 0;
  const TRANSITION_DURATION = 300; // ms

  // Simple audio cue using Web Audio API (generated beep)
  function playShiftSound() {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(440, ctx.currentTime);
      osc.connect(gain);
      gain.connect(ctx.destination);
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      osc.start();
      osc.stop(ctx.currentTime + 0.15);
    } catch (e) {
      console.warn('Audio context not supported', e);
    }
  }

  function toggle() {
    if (transitioning) return; // ignore if already transitioning
    current =
      current === DIMENSIONS.HAWKINS ? DIMENSIONS.UPSIDE_DOWN : DIMENSIONS.HAWKINS;
    transitioning = true;
    transitionStart = performance.now();
    if (window.SoundManager) {
      window.SoundManager.playDimensionShift(current === DIMENSIONS.UPSIDE_DOWN);
    } else {
      playShiftSound();
    }
  }

  function isVisible(entity) {
    // entity.visibility should be an object like { hawkins: true, upsideDown: false }
    if (!entity.visibility) return true; // default: visible in both
    if (current === DIMENSIONS.HAWKINS) return !!entity.visibility.hawkins;
    return !!entity.visibility.upsideDown;
  }

  function updateTransition() {
    if (!transitioning) return false;
    const now = performance.now();
    if (now - transitionStart >= TRANSITION_DURATION) {
      transitioning = false;
    }
    return true; // still in transition
  }

  function drawOverlay(ctx, canvas) {
    if (!transitioning) return;
    const progress = (performance.now() - transitionStart) / TRANSITION_DURATION;
    const alpha = Math.sin(Math.min(progress, 1) * Math.PI); // fade in/out smooth
    ctx.fillStyle = `rgba(255, 0, 200, ${alpha * 0.4})`;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  return {
    toggle,
    isVisible,
    updateTransition,
    drawOverlay,
    getCurrent: () => current,
    DIMENSIONS,
  };
})();

// Export for global usage (non‑module script)
window.DimensionManager = DimensionManager;

