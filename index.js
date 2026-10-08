// Plants vs Zombies (2009 PC Edition Recreation)
// Complete game engine: 5x9 grid, Sun economy, Plants, Zombies, Lawnmowers, Audio & UI

document.addEventListener("DOMContentLoaded", () => {
  // --- Audio System ---
  const bgm = document.getElementById("bgm");
  let musicEnabled = true;
  let sfxEnabled = true;

  // Web Audio Context for synthesized retro effects
  let audioCtx = null;
  function getAudioCtx() {
    if (!audioCtx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) audioCtx = new AudioContext();
    }
    if (audioCtx && audioCtx.state === "suspended") {
      audioCtx.resume().catch(() => {});
    }
    return audioCtx;
  }

  function playSoundFile(path) {
    if (!sfxEnabled) return;
    try {
      const audio = new Audio(path);
      audio.volume = 0.7;
      audio.play().catch(() => {});
    } catch (e) {}
  }

  function playSunChime() {
    if (!sfxEnabled) return;
    const ctx = getAudioCtx();
    if (!ctx) return;
    try {
      const now = ctx.currentTime;
      // Dual bell chime (C6 -> G6)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = "sine";
      osc1.frequency.setValueAtTime(1046.5, now);
      osc1.frequency.exponentialRampToValueAtTime(1567.98, now + 0.12);
      gain1.gain.setValueAtTime(0.3, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.45);
    } catch (e) {}
  }

  function playPlantThud() {
    if (!sfxEnabled) return;
    const ctx = getAudioCtx();
    if (!ctx) return;
    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(160, now);
      osc.frequency.exponentialRampToValueAtTime(45, now + 0.15);
      gain.gain.setValueAtTime(0.4, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.2);
    } catch (e) {}
  }

  function playChompSound() {
    if (!sfxEnabled) return;
    const ctx = getAudioCtx();
    if (!ctx) return;
    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(180, now);
      osc.frequency.exponentialRampToValueAtTime(80, now + 0.08);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.1);
    } catch (e) {}
  }

  function playMowerSound() {
    if (!sfxEnabled) return;
    const ctx = getAudioCtx();
    if (!ctx) return;
    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(90, now);
      osc.frequency.linearRampToValueAtTime(220, now + 0.4);
      gain.gain.setValueAtTime(0.4, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 1.2);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 1.2);
    } catch (e) {}
  }

  function playWarningHorn() {
    if (!sfxEnabled) return;
    const ctx = getAudioCtx();
    if (!ctx) return;
    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(220, now);
      osc.frequency.linearRampToValueAtTime(140, now + 0.6);
      gain.gain.setValueAtTime(0.35, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.8);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.8);
    } catch (e) {}
  }

  // --- Sound Control Buttons ---
  const btnMusic = document.getElementById("btn-music");
  const btnSfx = document.getElementById("btn-sfx");

  btnMusic.addEventListener("click", () => {
    musicEnabled = !musicEnabled;
    btnMusic.textContent = `Music: ${musicEnabled ? "ON" : "OFF"}`;
    if (musicEnabled) {
      if (gameState === "PLAYING") bgm.play().catch(() => {});
    } else {
      bgm.pause();
    }
  });

  btnSfx.addEventListener("click", () => {
    sfxEnabled = !sfxEnabled;
    btnSfx.textContent = `SFX: ${sfxEnabled ? "ON" : "OFF"}`;
  });

  // --- Responsive Stage Scaling (Uniform 1024x626) ---
  const stage = document.getElementById("background");
  function updateStageScale() {
    if (!stage) return;
    const padding = 10;
    const availW = window.innerWidth - padding;
    const availH = window.innerHeight - padding;
    const scale = Math.min(availW / 1024, availH / 626);
    stage.style.transform = `scale(${scale})`;
  }
  window.addEventListener("resize", updateStageScale);
  updateStageScale();

  // --- Plant Database ---
  const PLANT_TYPES = {
    sunflower: {
      id: "sunflower",
      name: "Sunflower",
      cost: 50,
      cooldown: 7.5,
      hp: 300,
      iconPos: "-60px 0px", // plants.gif
      iconImg: "images/plants.gif",
      className: "sunflower",
    },
    peashooter: {
      id: "peashooter",
      name: "Peashooter",
      cost: 100,
      cooldown: 7.5,
      hp: 300,
      iconPos: "0px 0px", // plants.gif
      iconImg: "images/plants.gif",
      className: "peashooter",
    },
    wallnut: {
      id: "wallnut",
      name: "Wall-nut",
      cost: 50,
      cooldown: 30.0,
      hp: 4000,
      iconPos: "-180px 0px", // plants.gif
      iconImg: "images/plants.gif",
      className: "wallnut",
    },
    potatomine: {
      id: "potatomine",
      name: "Potato Mine",
      cost: 25,
      cooldown: 20.0,
      hp: 300,
      iconPos: "-240px 0px", // plants.gif
      iconImg: "images/plants.gif",
      className: "potatomine",
    },
    cherrybomb: {
      id: "cherrybomb",
      name: "Cherry Bomb",
      cost: 150,
      cooldown: 35.0,
      hp: 300,
      iconPos: "-120px 0px", // plants.gif
      iconImg: "images/plants.gif",
      className: "cherrybomb",
    },
  };

  // --- Zombie Types (Accurate row-based matching from monsters.png) ---
  // monsters.png contains 4 rows of 4 frames each (128x128px):
  // Row 0 (y = 0px): Browncoat Zombie
  // Row 1 (y = -128px): Grey Coat Zombie
  // Row 2 (y = -256px): Olive Coat Zombie
  // Row 3 (y = -384px): Dark Suit Zombie / Runner
  const ZOMBIE_TYPES = {
    1: { id: 1, name: "Zombie", className: "zombie1", hp: 200, speed: 20 },
    2: { id: 2, name: "Zombie (Grey Coat)", className: "zombie2", hp: 270, speed: 20 },
    3: { id: 3, name: "Zombie (Olive Coat)", className: "zombie3", hp: 360, speed: 20 },
    4: { id: 4, name: "Zombie Runner", className: "zombie4", hp: 200, speed: 30 },
  };

  // --- Game State Variables ---
  const ROWS = 5;
  const COLS = 9;
  const GRID_LEFT = 250;
  const GRID_TOP = 80;
  const CELL_WIDTH = 80;
  const CELL_HEIGHT = 100;

  let gameState = "START"; // 'START', 'PLAYING', 'GAMEOVER', 'VICTORY'
  let sun = 150;
  let totalSunCollected = 0;
  let totalZombiesDefeated = 0;
  let selectedPlantType = null;
  let shovelActive = false;

  // 5x9 Board Matrix: grid[row][col]
  let grid = Array.from({ length: ROWS }, () => Array(COLS).fill(null));

  // Entities
  let plants = [];
  let zombies = [];
  let bullets = [];
  let suns = [];
  let lawnmowers = [];

  // Elapsed-time tracking
  let gameTime = 0; // seconds
  let lastNaturalSunSpawn = 0;

  // Seed Cooldown Trackers (seconds remaining)
  const seedCooldowns = {
    sunflower: 0,
    peashooter: 0,
    wallnut: 0,
    potatomine: 0,
    cherrybomb: 0,
  };

  // Level Progression Waves
  const SPAWN_TIMELINE = [
    { time: 18, row: 2, type: 1 },
    { time: 38, row: 1, type: 1 },
    { time: 55, row: 3, type: 2 },
    { time: 70, row: 0, type: 1 },
    { time: 72, row: 4, type: 2 },
    { time: 92, row: 2, type: 3 },
    { time: 110, row: 1, type: 2 },
    { time: 112, row: 3, type: 3 },
    { time: 130, row: 0, type: 3 },
    { time: 132, row: 4, type: 1 },
    { time: 145, row: 2, type: 3 },
    // Huge Wave Approach Announcement at 160s
    { time: 160, announcement: "A HUGE WAVE OF ZOMBIES IS APPROACHING!" },
    // Wave 1 Spawns at 164s
    { time: 164, row: 2, type: 4 }, // Runner
    { time: 164, row: 1, type: 2 },
    { time: 165, row: 3, type: 3 },
    { time: 166, row: 0, type: 1 },
    { time: 166, row: 4, type: 2 },
    // Post Wave trickle
    { time: 182, row: 1, type: 2 },
    { time: 184, row: 3, type: 3 },
    // Final Wave Announcement at 198s
    { time: 198, announcement: "FINAL WAVE!" },
    // Final Wave Spawns at 202s
    { time: 202, row: 2, type: 4 },
    { time: 202, row: 0, type: 3 },
    { time: 203, row: 1, type: 2 },
    { time: 203, row: 2, type: 3 },
    { time: 204, row: 3, type: 3 },
    { time: 204, row: 4, type: 3 },
    { time: 205, row: 1, type: 1 },
    { time: 205, row: 3, type: 2 },
  ];
  let spawnIndex = 0;
  const LEVEL_TOTAL_TIME = 210;

  // DOM Elements
  const lawnGridEl = document.getElementById("lawn-grid");
  const seedSlotsEl = document.getElementById("seed-slots");
  const shovelSlotEl = document.getElementById("shovel-slot");
  const sunValEl = document.getElementById("sun-val");
  const plantGhostEl = document.getElementById("plant-ghost");
  const announcementEl = document.getElementById("announcement-banner");
  const waveFillEl = document.getElementById("wave-fill");
  const waveZombieHeadEl = document.getElementById("wave-zombie-head");

  const startScreen = document.getElementById("start-screen");
  const gameOverScreen = document.getElementById("game-over-screen");
  const victoryScreen = document.getElementById("victory-screen");

  // --- Initialize UI: Grid Cells & Seed Cards ---
  function initGridCells() {
    lawnGridEl.innerHTML = "";
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const cell = document.createElement("div");
        cell.className = "grid-cell";
        cell.dataset.row = r;
        cell.dataset.col = c;

        cell.addEventListener("mouseenter", () => onCellHover(r, c));
        cell.addEventListener("mouseleave", () => onCellLeave());
        cell.addEventListener("click", () => onCellClick(r, c));

        lawnGridEl.appendChild(cell);
      }
    }
  }

  function initSeedCards() {
    seedSlotsEl.innerHTML = "";
    Object.values(PLANT_TYPES).forEach((plant) => {
      const card = document.createElement("div");
      card.className = "seed-card";
      card.dataset.id = plant.id;

      card.innerHTML = `
        <div class="seed-img-wrap">
          <div class="seed-icon" style="background: url('${plant.iconImg}'); background-position: ${plant.iconPos};"></div>
        </div>
        <div class="seed-cost">${plant.cost}</div>
        <div class="cooldown-overlay" id="cd-${plant.id}"></div>
      `;

      card.addEventListener("click", () => selectSeedPacket(plant.id));
      seedSlotsEl.appendChild(card);
    });
  }

  function initLawnmowers() {
    lawnmowers = [];
    for (let r = 0; r < ROWS; r++) {
      lawnmowers.push({
        row: r,
        x: 165,
        y: GRID_TOP + r * CELL_HEIGHT + 22,
        active: false,
        used: false,
      });
    }
    renderLawnmowers();
  }

  // --- Seed Selection & Shovel Controls ---
  function selectSeedPacket(plantId) {
    if (gameState !== "PLAYING") return;
    const plant = PLANT_TYPES[plantId];
    if (!plant) return;

    if (seedCooldowns[plantId] > 0 || sun < plant.cost) {
      return;
    }

    shovelActive = false;
    shovelSlotEl.classList.remove("selected");

    if (selectedPlantType === plantId) {
      selectedPlantType = null;
    } else {
      selectedPlantType = plantId;
    }
    updateSeedCardsState();
  }

  shovelSlotEl.addEventListener("click", () => {
    if (gameState !== "PLAYING") return;
    selectedPlantType = null;
    shovelActive = !shovelActive;
    shovelSlotEl.classList.toggle("selected", shovelActive);
    updateSeedCardsState();
  });

  function updateSeedCardsState() {
    Object.values(PLANT_TYPES).forEach((plant) => {
      const card = seedSlotsEl.querySelector(`[data-id="${plant.id}"]`);
      if (!card) return;

      const cdOverlay = document.getElementById(`cd-${plant.id}`);
      const cd = seedCooldowns[plant.id];
      const maxCd = plant.cooldown;

      if (cd > 0) {
        card.classList.add("on-cooldown");
        const pct = (cd / maxCd) * 100;
        cdOverlay.style.height = `${pct}%`;
      } else {
        card.classList.remove("on-cooldown");
        cdOverlay.style.height = "0%";
      }

      if (sun < plant.cost) {
        card.classList.add("disabled");
      } else {
        card.classList.remove("disabled");
      }

      if (selectedPlantType === plant.id) {
        card.classList.add("selected");
      } else {
        card.classList.remove("selected");
      }
    });
  }

  // --- Grid Hover & Click Handlers ---
  let hoveredRow = -1;
  let hoveredCol = -1;

  function onCellHover(r, c) {
    if (gameState !== "PLAYING") return;
    hoveredRow = r;
    hoveredCol = c;

    const cell = lawnGridEl.children[r * COLS + c];
    if (shovelActive) {
      if (grid[r][c] !== null) {
        cell.classList.add("shovel-highlight");
      }
      plantGhostEl.style.display = "none";
    } else if (selectedPlantType) {
      if (grid[r][c] === null) {
        cell.classList.add("highlight");
        const plant = PLANT_TYPES[selectedPlantType];
        plantGhostEl.style.display = "block";
        plantGhostEl.style.left = `${GRID_LEFT + c * CELL_WIDTH + 10}px`;
        plantGhostEl.style.top = `${GRID_TOP + r * CELL_HEIGHT + 18}px`;
        plantGhostEl.className = plant.className;
        if (plant.iconImg) {
          plantGhostEl.style.background = `url("${plant.iconImg}")`;
          plantGhostEl.style.backgroundPosition = plant.iconPos;
          plantGhostEl.style.width = "60px";
          plantGhostEl.style.height = "60px";
        }
      } else {
        plantGhostEl.style.display = "none";
      }
    } else {
      plantGhostEl.style.display = "none";
    }
  }

  function onCellLeave() {
    if (hoveredRow >= 0 && hoveredCol >= 0) {
      const idx = hoveredRow * COLS + hoveredCol;
      if (lawnGridEl.children[idx]) {
        lawnGridEl.children[idx].classList.remove("highlight", "shovel-highlight");
      }
    }
    hoveredRow = -1;
    hoveredCol = -1;
    plantGhostEl.style.display = "none";
  }

  function onCellClick(r, c) {
    if (gameState !== "PLAYING") return;

    if (shovelActive) {
      if (grid[r][c] !== null) {
        removePlant(r, c);
        playPlantThud();
        spawnDirtPuff(GRID_LEFT + c * CELL_WIDTH + 40, GRID_TOP + r * CELL_HEIGHT + 50);
        shovelActive = false;
        shovelSlotEl.classList.remove("selected");
        onCellLeave();
      }
      return;
    }

    if (selectedPlantType) {
      const plantDef = PLANT_TYPES[selectedPlantType];
      if (!plantDef) return;

      if (grid[r][c] === null && sun >= plantDef.cost && seedCooldowns[selectedPlantType] <= 0) {
        sun -= plantDef.cost;
        sunValEl.textContent = sun;
        seedCooldowns[selectedPlantType] = plantDef.cooldown;

        const newPlant = {
          id: Math.random().toString(36).substring(2, 9),
          type: selectedPlantType,
          row: r,
          col: c,
          x: GRID_LEFT + c * CELL_WIDTH + 10,
          y: GRID_TOP + r * CELL_HEIGHT + 18,
          hp: plantDef.hp,
          maxHp: plantDef.hp,
          lastShotTime: gameTime,
          lastSunTime: gameTime - 17, // produces first sun after 7s
          armed: plantDef.id !== "potatomine",
          armTimer: plantDef.id === "potatomine" ? 14 : 0,
          fuseTimer: plantDef.id === "cherrybomb" ? 1.2 : 0,
        };

        grid[r][c] = newPlant;
        plants.push(newPlant);
        playPlantThud();

        selectedPlantType = null;
        updateSeedCardsState();
        onCellLeave();
      }
    }
  }

  function removePlant(r, c) {
    const p = grid[r][c];
    if (!p) return;
    grid[r][c] = null;
    plants = plants.filter((item) => item !== p);
  }

  function spawnDirtPuff(x, y) {
    const el = document.createElement("div");
    el.className = "hit-splat";
    el.style.left = `${x - 12}px`;
    el.style.top = `${y - 12}px`;
    el.style.backgroundColor = "#795548";
    document.getElementById("effects").appendChild(el);
    setTimeout(() => el.remove(), 250);
  }

  // --- Sun Economy System ---
  function spawnSun(startX, startY, targetY, isSunflower = false) {
    const sunItem = {
      id: Math.random().toString(36).substring(2, 9),
      x: startX,
      y: startY,
      targetY: targetY,
      isSunflower: isSunflower,
      createdTime: gameTime,
      collected: false,
    };
    suns.push(sunItem);
  }

  function collectSun(sunObj) {
    if (sunObj.collected) return;
    sunObj.collected = true;
    playSunChime();

    const targetX = 45;
    const targetY = 35;
    const el = document.getElementById(`sun-${sunObj.id}`);

    if (el) {
      el.style.transition = "all 0.45s cubic-bezier(0.2, 0.8, 0.2, 1)";
      el.style.left = `${targetX}px`;
      el.style.top = `${targetY}px`;
      el.style.transform = "scale(0.5)";
      el.style.opacity = "0.7";
    }

    setTimeout(() => {
      sun += 25;
      totalSunCollected += 25;
      sunValEl.textContent = sun;
      sunValEl.style.transform = "scale(1.3)";
      setTimeout(() => (sunValEl.style.transform = "scale(1)"), 150);
      updateSeedCardsState();
      suns = suns.filter((s) => s !== sunObj);
      if (el) el.remove();
    }, 450);
  }

  // --- Zombie Spawning & Waves ---
  function spawnZombie(row, type) {
    const def = ZOMBIE_TYPES[type] || ZOMBIE_TYPES[1];
    const zombie = {
      id: Math.random().toString(36).substring(2, 9),
      type: type,
      row: row,
      x: 1020,
      y: GRID_TOP + row * CELL_HEIGHT - 32,
      hp: def.hp,
      maxHp: def.hp,
      speed: def.speed,
      eating: false,
      lastBiteTime: 0,
      walkTime: 0,
      animFrame: 0,
      hitFlashTime: 0,
    };
    zombies.push(zombie);
  }

  function showAnnouncement(text, isReady = false) {
    announcementEl.textContent = text;
    announcementEl.style.display = "block";
    if (isReady) {
      announcementEl.classList.add("ready-set-plant");
    } else {
      announcementEl.classList.remove("ready-set-plant");
      playWarningHorn();
    }

    setTimeout(() => {
      announcementEl.style.display = "none";
    }, 2800);
  }

  // --- Projectiles & Bullets ---
  function fireBullet(plant) {
    bullets.push({
      id: Math.random().toString(36).substring(2, 9),
      row: plant.row,
      x: plant.x + 45,
      y: plant.y + 14,
    });
    playSoundFile("puff.mp3");
  }

  // --- Explosions (Cherry Bomb & Potato Mine) ---
  function triggerExplosion(centerX, centerY, radius, damage, text = "BOOM!") {
    playSoundFile("puff.mp3");
    const blast = document.createElement("div");
    blast.className = "spudow-blast";
    blast.textContent = text;
    blast.style.left = `${centerX}px`;
    blast.style.top = `${centerY}px`;
    document.getElementById("effects").appendChild(blast);
    setTimeout(() => blast.remove(), 800);

    zombies.forEach((z) => {
      const zCenterX = z.x + 64;
      const zCenterY = z.y + 64;
      const dist = Math.hypot(zCenterX - centerX, zCenterY - centerY);
      if (dist <= radius) {
        z.hp -= damage;
        z.hitFlashTime = gameTime + 0.15;
        if (z.hp <= 0) {
          totalZombiesDefeated++;
          playSoundFile("die.mp3");
        }
      }
    });
    zombies = zombies.filter((z) => z.hp > 0);
  }

  // --- Elapsed-Time Based Game Update Loop ---
  let lastFrameTime = performance.now();

  function update(dt) {
    if (gameState !== "PLAYING") return;
    gameTime += dt;

    // 1. Natural Falling Sun Spawner (every 8s)
    if (gameTime - lastNaturalSunSpawn >= 8.0) {
      lastNaturalSunSpawn = gameTime;
      const rx = Math.floor(Math.random() * 550) + 280;
      const ry = Math.floor(Math.random() * 340) + 120;
      spawnSun(rx, -40, ry);
    }

    // 2. Cooldown Countdown (time-based)
    Object.keys(seedCooldowns).forEach((key) => {
      if (seedCooldowns[key] > 0) {
        seedCooldowns[key] = Math.max(0, seedCooldowns[key] - dt);
      }
    });
    updateSeedCardsState();

    // 3. Level Spawner Timeline Check
    while (spawnIndex < SPAWN_TIMELINE.length && SPAWN_TIMELINE[spawnIndex].time <= gameTime) {
      const item = SPAWN_TIMELINE[spawnIndex];
      if (item.announcement) {
        showAnnouncement(item.announcement);
      } else {
        spawnZombie(item.row, item.type);
      }
      spawnIndex++;
    }

    // Update Progress Bar
    const progress = Math.min(100, (gameTime / LEVEL_TOTAL_TIME) * 100);
    waveFillEl.style.width = `${progress}%`;
    waveZombieHeadEl.style.right = `${100 - progress}%`;

    // 4. Update Plants (Shooting & Sun Production)
    plants.forEach((plant) => {
      if (plant.type === "sunflower") {
        if (gameTime - plant.lastSunTime >= 24) {
          plant.lastSunTime = gameTime;
          spawnSun(plant.x + 10, plant.y, plant.y + 35, true);
        }
      }

      if (plant.type === "peashooter") {
        const hasZombieInRow = zombies.some(
          (z) => z.row === plant.row && z.x > plant.x && z.x < 1000
        );
        if (hasZombieInRow && gameTime - plant.lastShotTime >= 1.45) {
          plant.lastShotTime = gameTime;
          fireBullet(plant);
        }
      }

      if (plant.type === "potatomine" && !plant.armed) {
        plant.armTimer -= dt;
        if (plant.armTimer <= 0) {
          plant.armed = true;
        }
      }

      if (plant.type === "potatomine" && plant.armed) {
        const steppedZombie = zombies.find(
          (z) => z.row === plant.row && Math.abs(z.x + 40 - plant.x) < 30
        );
        if (steppedZombie) {
          triggerExplosion(plant.x + 30, plant.y + 30, 90, 1800, "SPUDOW!");
          removePlant(plant.row, plant.col);
        }
      }

      if (plant.type === "cherrybomb") {
        plant.fuseTimer -= dt;
        if (plant.fuseTimer <= 0) {
          triggerExplosion(plant.x + 30, plant.y + 30, 150, 1800, "BOOM!");
          removePlant(plant.row, plant.col);
        }
      }
    });

    // 5. Update Bullets (time-based movement: 280 px/s)
    for (let i = bullets.length - 1; i >= 0; i--) {
      const b = bullets[i];
      b.x += 280 * dt;

      let hit = false;
      for (let j = 0; j < zombies.length; j++) {
        const z = zombies[j];
        if (z.row === b.row && b.x >= z.x + 30 && b.x <= z.x + 85) {
          hit = true;
          z.hp -= 20;
          z.hitFlashTime = gameTime + 0.08;
          playSoundFile("puff.mp3");

          const splat = document.createElement("div");
          splat.className = "hit-splat";
          splat.style.left = `${b.x - 12}px`;
          splat.style.top = `${b.y - 12}px`;
          document.getElementById("effects").appendChild(splat);
          setTimeout(() => splat.remove(), 250);

          if (z.hp <= 0) {
            totalZombiesDefeated++;
            playSoundFile("die.mp3");
          }
          break;
        }
      }

      if (hit || b.x > 1024) {
        bullets.splice(i, 1);
      }
    }
    zombies = zombies.filter((z) => z.hp > 0);

    // 6. Update Zombies (time-based movement: speed * dt)
    zombies.forEach((z) => {
      // 4-frame animation cycle: strictly 0, 1, 2, 3 frames
      z.walkTime += dt;
      z.animFrame = Math.floor(z.walkTime * 3.5) % 4;

      const targetPlant = plants.find(
        (p) => p.row === z.row && Math.abs(z.x + 25 - p.x) < 25
      );

      if (targetPlant) {
        z.eating = true;
        if (gameTime - z.lastBiteTime >= 0.35) {
          z.lastBiteTime = gameTime;
          targetPlant.hp -= 18;
          playChompSound();
          if (targetPlant.hp <= 0) {
            removePlant(targetPlant.row, targetPlant.col);
            z.eating = false;
          }
        }
      } else {
        z.eating = false;
        z.x -= z.speed * dt;
      }

      // Lawnmower Trigger Check (x <= 220)
      if (z.x <= 220) {
        const mower = lawnmowers[z.row];
        if (mower && !mower.used && !mower.active) {
          mower.active = true;
          playMowerSound();
        }
      }

      // House Breach (x <= 150) -> Game Over!
      if (z.x <= 150) {
        triggerGameOver();
      }
    });

    // 7. Update Lawnmowers (time-based movement: 520 px/s)
    lawnmowers.forEach((mower) => {
      if (mower.active) {
        mower.x += 520 * dt;
        zombies.forEach((z) => {
          if (z.row === mower.row && z.x < mower.x + 60 && z.x > mower.x - 40) {
            z.hp = 0;
            totalZombiesDefeated++;
            playSoundFile("die.mp3");
          }
        });
        if (mower.x > 1050) {
          mower.active = false;
          mower.used = true;
        }
      }
    });
    zombies = zombies.filter((z) => z.hp > 0);

    // 8. Update Sun items (time-based fall)
    suns.forEach((s) => {
      if (!s.collected && s.y < s.targetY) {
        s.y += (s.isSunflower ? 70 : 45) * dt;
      }
      if (!s.collected && gameTime - s.createdTime > 13) {
        s.collected = true;
        const el = document.getElementById(`sun-${s.id}`);
        if (el) el.remove();
      }
    });
    suns = suns.filter((s) => !s.collected || s.y < s.targetY);

    // 9. Check Victory Condition
    if (spawnIndex >= SPAWN_TIMELINE.length && zombies.length === 0 && gameTime > LEVEL_TOTAL_TIME) {
      triggerVictory();
    }

    render();
  }

  // --- Main Animation Frame Loop ---
  function gameLoop(now) {
    const dt = Math.min((now - lastFrameTime) / 1000, 0.1);
    lastFrameTime = now;

    update(dt);

    requestAnimationFrame(gameLoop);
  }

  // --- Rendering Pipeline ---
  const plantsContainer = document.getElementById("plants");
  const zombiesContainer = document.getElementById("zombies");
  const bulletsContainer = document.getElementById("bullets");
  const sunsContainer = document.getElementById("suns");
  const lawnmowersContainer = document.getElementById("lawnmowers");

  function renderLawnmowers() {
    let html = "";
    lawnmowers.forEach((m) => {
      if (!m.used) {
        html += `<div class="lawnmower ${m.active ? "active" : ""}" style="left: ${m.x}px; top: ${m.y}px;"></div>`;
      }
    });
    lawnmowersContainer.innerHTML = html;
  }

  function render() {
    renderLawnmowers();

    // Render Plants
    let plantsHtml = "";
    const peashooterAnimFrame = Math.floor((gameTime * 8) % 8);

    plants.forEach((p) => {
      const def = PLANT_TYPES[p.type];
      let style = `left: ${p.x}px; top: ${p.y}px; z-index: ${20 + p.row * 5};`;
      let extraClass = "";

      if (p.type === "peashooter") {
        style += ` background-position-x: -${peashooterAnimFrame * 60 - 3}px;`;
      } else if (p.type === "wallnut") {
        if (p.hp < 1333) extraClass = " heavy-cracked";
        else if (p.hp < 2666) extraClass = " cracked";
      } else if (p.type === "potatomine") {
        if (!p.armed) extraClass = " unarmed";
      }

      plantsHtml += `<div class="plant-entity ${def.className}${extraClass}" style="${style}"></div>`;
    });
    plantsContainer.innerHTML = plantsHtml;

    // Render Zombies (strictly 4 frames: 0..3)
    let zombiesHtml = "";
    zombies.forEach((z) => {
      let extraClass = "";
      if (z.hitFlashTime > gameTime) extraClass += " hit";
      if (z.eating) extraClass += " eating";

      const bgPosX = -(z.animFrame * 128);
      const def = ZOMBIE_TYPES[z.type] || ZOMBIE_TYPES[1];
      const zIndex = 25 + z.row * 5;
      zombiesHtml += `<div class="zombie-entity ${def.className}${extraClass}" style="left: ${z.x}px; top: ${z.y}px; z-index: ${zIndex}; background-position-x: ${bgPosX}px;"></div>`;
    });
    zombiesContainer.innerHTML = zombiesHtml;

    // Render Bullets
    let bulletsHtml = "";
    bullets.forEach((b) => {
      bulletsHtml += `<div class="bullet" style="left: ${b.x}px; top: ${b.y}px; z-index: ${28 + b.row * 5};"></div>`;
    });
    bulletsContainer.innerHTML = bulletsHtml;

    // Render Suns
    suns.forEach((s) => {
      let el = document.getElementById(`sun-${s.id}`);
      if (!el) {
        el = document.createElement("div");
        el.className = "sun-item";
        el.id = `sun-${s.id}`;
        el.addEventListener("click", () => collectSun(s));
        sunsContainer.appendChild(el);
      }
      if (!s.collected) {
        el.style.left = `${s.x}px`;
        el.style.top = `${s.y}px`;
      }
    });
  }

  // --- Game Lifecycle (Start, Victory, Game Over) ---
  function startGame() {
    gameState = "PLAYING";
    startScreen.style.display = "none";
    gameOverScreen.style.display = "none";
    victoryScreen.style.display = "none";

    grid = Array.from({ length: ROWS }, () => Array(COLS).fill(null));
    plants = [];
    zombies = [];
    bullets = [];
    suns = [];
    document.getElementById("effects").innerHTML = "";

    sun = 150;
    totalSunCollected = 0;
    totalZombiesDefeated = 0;
    sunValEl.textContent = sun;

    gameTime = 0;
    spawnIndex = 0;
    lastNaturalSunSpawn = 0;
    selectedPlantType = null;
    shovelActive = false;
    shovelSlotEl.classList.remove("selected");

    Object.keys(seedCooldowns).forEach((k) => (seedCooldowns[k] = 0));

    initLawnmowers();
    initGridCells();
    initSeedCards();
    updateSeedCardsState();

    if (musicEnabled) {
      bgm.currentTime = 0;
      bgm.play().catch(() => {});
    }

    showAnnouncement("READY... SET... PLANT!", true);
    lastFrameTime = performance.now();
  }

  function triggerGameOver() {
    gameState = "GAMEOVER";
    bgm.pause();
    gameOverScreen.style.display = "flex";
  }

  function triggerVictory() {
    gameState = "VICTORY";
    bgm.pause();
    document.getElementById("victory-stats").innerHTML = `
      Zombies Defeated: <strong>${totalZombiesDefeated}</strong><br/>
      Sun Collected: <strong>${totalSunCollected}</strong>
    `;
    victoryScreen.style.display = "flex";
  }

  // --- Buttons Event Listeners ---
  document.getElementById("btn-start").addEventListener("click", () => {
    getAudioCtx();
    startGame();
  });
  document.getElementById("btn-restart").addEventListener("click", () => {
    getAudioCtx();
    startGame();
  });
  document.getElementById("btn-next").addEventListener("click", () => {
    getAudioCtx();
    startGame();
  });

  // Right-click or Escape deselects seed/shovel
  document.addEventListener("contextmenu", (e) => {
    e.preventDefault();
    selectedPlantType = null;
    shovelActive = false;
    shovelSlotEl.classList.remove("selected");
    onCellLeave();
    updateSeedCardsState();
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      selectedPlantType = null;
      shovelActive = false;
      shovelSlotEl.classList.remove("selected");
      onCellLeave();
      updateSeedCardsState();
    }
  });

  // Start the requestAnimationFrame loop
  requestAnimationFrame(gameLoop);

  // Initialize display
  initGridCells();
  initSeedCards();
  initLawnmowers();
});
