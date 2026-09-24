// js/SoundManager.js – Procedural 80s Synth Music & SFX using Web Audio API

const SoundManager = (function () {
  let ctx = null;
  let isMuted = false;
  let isInitialized = false;
  let musicGainNode = null;
  let sfxGainNode = null;
  let arpeggioTimer = null;
  let isPlayingMusic = false;

  // Stranger Things iconic arpeggio motif frequencies (C3, E3, G3, B3, C4, B3, G3, E3)
  const ARPEGGIO_NOTES = [
    130.81, // C3
    164.81, // E3
    196.00, // G3
    246.94, // B3
    261.63, // C4
    246.94, // B3
    196.00, // G3
    164.81  // E3
  ];
  let noteIndex = 0;

  function initAudio() {
    if (isInitialized) return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      ctx = new AudioCtx();

      // Master gain nodes
      musicGainNode = ctx.createGain();
      musicGainNode.gain.setValueAtTime(0.18, ctx.currentTime);
      musicGainNode.connect(ctx.destination);

      sfxGainNode = ctx.createGain();
      sfxGainNode.gain.setValueAtTime(0.35, ctx.currentTime);
      sfxGainNode.connect(ctx.destination);

      isInitialized = true;
      startMusic();
    } catch (e) {
      console.warn('Web Audio API not supported in this browser.', e);
    }
  }

  // Plays a single retro analog synth bass note
  function playSynthNote(freq, time, duration = 0.16) {
    if (!ctx || isMuted) return;

    // Dual oscillator for rich 80s chorus/detune
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const filter = ctx.createBiquadFilter();
    const noteGain = ctx.createGain();

    osc1.type = 'sawtooth';
    osc1.frequency.setValueAtTime(freq, time);

    osc2.type = 'sawtooth';
    // Slight detune for thick 80s analog warmth
    osc2.frequency.setValueAtTime(freq * 1.004, time);

    // Filter envelope for classic synth "plink"
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(800, time);
    filter.frequency.exponentialRampToValueAtTime(150, time + duration);
    filter.Q.setValueAtTime(4, time);

    // Amplitude envelope
    noteGain.gain.setValueAtTime(0.01, time);
    noteGain.gain.linearRampToValueAtTime(0.5, time + 0.02);
    noteGain.gain.exponentialRampToValueAtTime(0.001, time + duration);

    osc1.connect(filter);
    osc2.connect(filter);
    filter.connect(noteGain);
    noteGain.connect(musicGainNode);

    osc1.start(time);
    osc2.start(time);
    osc1.stop(time + duration);
    osc2.stop(time + duration);
  }

  function startMusic() {
    if (!ctx || isPlayingMusic) return;
    isPlayingMusic = true;

    // 16th note arpeggiator clock (~140 BPM)
    const stepTime = 135; // ms per note
    arpeggioTimer = setInterval(() => {
      if (!ctx || isMuted || ctx.state !== 'running') return;
      const freq = ARPEGGIO_NOTES[noteIndex];
      playSynthNote(freq, ctx.currentTime, 0.18);
      noteIndex = (noteIndex + 1) % ARPEGGIO_NOTES.length;
    }, stepTime);
  }

  function resume() {
    if (!isInitialized) {
      initAudio();
    } else if (ctx && ctx.state === 'suspended') {
      ctx.resume();
    }
  }

  function toggleMute() {
    isMuted = !isMuted;
    if (musicGainNode && ctx) {
      musicGainNode.gain.setValueAtTime(isMuted ? 0 : 0.18, ctx.currentTime);
    }
    if (sfxGainNode && ctx) {
      sfxGainNode.gain.setValueAtTime(isMuted ? 0 : 0.35, ctx.currentTime);
    }
    return isMuted;
  }

  // --- Sound Effects (SFX) ---

  // Jump SFX (retro upward pitch sweep)
  function playJump() {
    if (!ctx || isMuted) return;
    resume();
    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(150, t);
    osc.frequency.exponentialRampToValueAtTime(450, t + 0.12);

    gain.gain.setValueAtTime(0.3, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.12);

    osc.connect(gain);
    gain.connect(sfxGainNode);

    osc.start(t);
    osc.stop(t + 0.12);
  }

  // Collectible pickup (crisp bright dual bell/chime)
  function playCollect() {
    if (!ctx || isMuted) return;
    resume();
    const t = ctx.currentTime;
    [659.25, 987.77].forEach((freq, i) => { // E5, B5
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t + i * 0.06);

      gain.gain.setValueAtTime(0.4, t + i * 0.06);
      gain.gain.exponentialRampToValueAtTime(0.01, t + i * 0.06 + 0.18);

      osc.connect(gain);
      gain.connect(sfxGainNode);

      osc.start(t + i * 0.06);
      osc.stop(t + i * 0.06 + 0.18);
    });
  }

  // Player hurt / damaged (noise punch)
  function playHurt() {
    if (!ctx || isMuted) return;
    resume();
    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(200, t);
    osc.frequency.exponentialRampToValueAtTime(40, t + 0.25);

    gain.gain.setValueAtTime(0.5, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.25);

    osc.connect(gain);
    gain.connect(sfxGainNode);

    osc.start(t);
    osc.stop(t + 0.25);
  }

  // Dimension shift dimensional warp sound
  function playDimensionShift(toUpsideDown) {
    if (!ctx || isMuted) return;
    resume();
    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const filter = ctx.createBiquadFilter();
    const gain = ctx.createGain();

    osc.type = 'sawtooth';
    if (toUpsideDown) {
      // Warp downward into darkness
      osc.frequency.setValueAtTime(320, t);
      osc.frequency.exponentialRampToValueAtTime(65, t + 0.35);
      filter.frequency.setValueAtTime(1200, t);
      filter.frequency.exponentialRampToValueAtTime(200, t + 0.35);
    } else {
      // Warp upward into Hawkins
      osc.frequency.setValueAtTime(80, t);
      osc.frequency.exponentialRampToValueAtTime(360, t + 0.35);
      filter.frequency.setValueAtTime(300, t);
      filter.frequency.exponentialRampToValueAtTime(1500, t + 0.35);
    }

    gain.gain.setValueAtTime(0.4, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.35);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(sfxGainNode);

    osc.start(t);
    osc.stop(t + 0.35);
  }

  // Level complete / victory fanfare
  function playLevelComplete() {
    if (!ctx || isMuted) return;
    resume();
    const t = ctx.currentTime;
    const notes = [261.63, 329.63, 392.00, 523.25]; // C, E, G, High C
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, t + idx * 0.12);

      gain.gain.setValueAtTime(0.4, t + idx * 0.12);
      gain.gain.exponentialRampToValueAtTime(0.01, t + idx * 0.12 + 0.35);

      osc.connect(gain);
      gain.connect(sfxGainNode);

      osc.start(t + idx * 0.12);
      osc.stop(t + idx * 0.12 + 0.35);
    });
  }

  // Slingshot snap / projectile fired SFX
  function playSlingshot() {
    if (!ctx || isMuted) return;
    resume();
    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(650, t);
    osc.frequency.exponentialRampToValueAtTime(180, t + 0.09);

    gain.gain.setValueAtTime(0.4, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.09);

    osc.connect(gain);
    gain.connect(sfxGainNode);

    osc.start(t);
    osc.stop(t + 0.09);
  }

  // Enemy defeated / dissolution explosion SFX
  function playEnemyDefeated() {
    if (!ctx || isMuted) return;
    resume();
    const t = ctx.currentTime;

    // Bass crunch
    const osc = ctx.createOscillator();
    const filter = ctx.createBiquadFilter();
    const gain = ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(180, t);
    osc.frequency.exponentialRampToValueAtTime(30, t + 0.28);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1000, t);
    filter.frequency.exponentialRampToValueAtTime(100, t + 0.28);

    gain.gain.setValueAtTime(0.6, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.28);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(sfxGainNode);

    osc.start(t);
    osc.stop(t + 0.28);
  }

  // Pebble hit platform clink SFX
  function playHitPlatform() {
    if (!ctx || isMuted) return;
    resume();
    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, t);
    osc.frequency.exponentialRampToValueAtTime(440, t + 0.05);

    gain.gain.setValueAtTime(0.2, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.05);

    osc.connect(gain);
    gain.connect(sfxGainNode);

    osc.start(t);
    osc.stop(t + 0.05);
  }

  // Demogorgon predatory screech SFX
  function playDemogorgonScreech() {
    if (!ctx || isMuted) return;
    resume();
    const t = ctx.currentTime;

    const carrier = ctx.createOscillator();
    const modulator = ctx.createOscillator();
    const modGain = ctx.createGain();
    const filter = ctx.createBiquadFilter();
    const gain = ctx.createGain();

    // FM modulation for guttural alien screech
    modulator.type = 'sawtooth';
    modulator.frequency.setValueAtTime(55, t);
    modulator.frequency.linearRampToValueAtTime(80, t + 0.32);

    modGain.gain.setValueAtTime(280, t);
    modGain.gain.exponentialRampToValueAtTime(80, t + 0.32);

    modulator.connect(carrier.frequency);

    carrier.type = 'sawtooth';
    carrier.frequency.setValueAtTime(380, t);
    carrier.frequency.exponentialRampToValueAtTime(720, t + 0.12);
    carrier.frequency.exponentialRampToValueAtTime(220, t + 0.32);

    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1100, t);
    filter.Q.setValueAtTime(4.5, t);

    gain.gain.setValueAtTime(0.01, t);
    gain.gain.linearRampToValueAtTime(0.35, t + 0.04);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.32);

    carrier.connect(filter);
    filter.connect(gain);
    gain.connect(sfxGainNode);

    modulator.start(t);
    carrier.start(t);
    modulator.stop(t + 0.32);
    carrier.stop(t + 0.32);
  }

  // Walkie-Talkie radio chirp & tuning static
  function playRadioTune() {
    if (!ctx || isMuted) return;
    resume();
    const t = ctx.currentTime;

    // Dual electronic radio beeps
    [1046.5, 1318.5].forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(freq, t + idx * 0.08);

      gain.gain.setValueAtTime(0.25, t + idx * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.01, t + idx * 0.08 + 0.12);

      osc.connect(gain);
      gain.connect(sfxGainNode);

      osc.start(t + idx * 0.08);
      osc.stop(t + idx * 0.08 + 0.12);
    });
  }

  // Sealed Gate hydraulic unlock & power-up chime
  function playGateUnlock() {
    if (!ctx || isMuted) return;
    resume();
    const t = ctx.currentTime;

    // Heavy mechanical bass unlatch
    const bass = ctx.createOscillator();
    const bassGain = ctx.createGain();
    bass.type = 'sawtooth';
    bass.frequency.setValueAtTime(80, t);
    bass.frequency.exponentialRampToValueAtTime(40, t + 0.4);

    bassGain.gain.setValueAtTime(0.4, t);
    bassGain.gain.exponentialRampToValueAtTime(0.01, t + 0.4);

    bass.connect(bassGain);
    bassGain.connect(sfxGainNode);
    bass.start(t);
    bass.stop(t + 0.4);

    // Chime progression
    [523.25, 659.25, 783.99, 1046.5].forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, t + 0.1 + idx * 0.08);

      gain.gain.setValueAtTime(0.35, t + 0.1 + idx * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.1 + idx * 0.08 + 0.25);

      osc.connect(gain);
      gain.connect(sfxGainNode);

      osc.start(t + 0.1 + idx * 0.08);
      osc.stop(t + 0.1 + idx * 0.08 + 0.25);
    });
  }

  // Access Denied / Gate Locked buzzer
  function playDenied() {
    if (!ctx || isMuted) return;
    resume();
    const t = ctx.currentTime;

    [0, 0.12].forEach(offset => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(110, t + offset);

      gain.gain.setValueAtTime(0.3, t + offset);
      gain.gain.exponentialRampToValueAtTime(0.01, t + offset + 0.09);

      osc.connect(gain);
      gain.connect(sfxGainNode);

      osc.start(t + offset);
      osc.stop(t + offset + 0.09);
    });
  }

  return {
    initAudio,
    resume,
    toggleMute,
    isMuted: () => isMuted,
    playJump,
    playCollect,
    playHurt,
    playDimensionShift,
    playLevelComplete,
    playSlingshot,
    playEnemyDefeated,
    playHitPlatform,
    playDemogorgonScreech,
    playRadioTune,
    playGateUnlock,
    playDenied
  };
})();

window.SoundManager = SoundManager;

