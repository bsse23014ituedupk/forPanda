const sections = Array.from(document.querySelectorAll(".proposal-section"));
const nextButtons = Array.from(document.querySelectorAll("[data-next]"));
const restartButton = document.querySelector("[data-restart]");
const dots = Array.from(document.querySelectorAll(".dot"));
const particleLayer = document.getElementById("particleLayer");
const confettiLayer = document.getElementById("confettiLayer");
const floatingParty = document.getElementById("floatingParty");
const runawayButton = document.querySelector(".runaway-button");
const soundToggle = document.querySelector(".sound-toggle");
const soundLabel = document.querySelector(".sound-label");
const pandaPeek = document.querySelector(".panda-peek");
const secretToast = document.querySelector(".secret-toast");
const cursorPaw = document.querySelector(".cursor-paw");

let currentSectionIndex = 0;
let isTransitioning = false;
let celebrationStarted = false;
let pandaClicks = 0;
let toastTimer = null;
let audioContext = null;
let musicTimer = null;
let musicStep = 0;
let lastTrailTime = 0;
let mouseX = -40;
let mouseY = -40;
let cursorX = -40;
let cursorY = -40;

const sectionDuration = 520;
const celebrationColors = ["#ff4faf", "#ff9ed4", "#60f4ff", "#ffd166", "#fff3fb"];
const notes = [392, 493.88, 523.25, 659.25, 587.33, 493.88, 440, 523.25];

function wrapAnimatedHeadings() {
  document.querySelectorAll("[data-animate]").forEach((heading) => {
    const text = heading.textContent || "";
    heading.textContent = "";

    Array.from(text).forEach((char, index) => {
      const span = document.createElement("span");
      span.className = "char";
      span.style.setProperty("--char-index", index);
      span.textContent = char === " " ? "\u00a0" : char;
      heading.appendChild(span);
    });
  });
}

function replayHeading(section) {
  section.querySelectorAll(".char").forEach((char) => {
    char.style.animation = "none";
    char.offsetHeight;
    char.style.animation = "";
  });
}

function updateProgress() {
  dots.forEach((dot, index) => {
    dot.classList.toggle("is-active", index === currentSectionIndex);
  });
}

function showSection(nextIndex) {
  if (isTransitioning || nextIndex < 0 || nextIndex >= sections.length || nextIndex === currentSectionIndex) {
    return;
  }

  isTransitioning = true;
  const current = sections[currentSectionIndex];
  const next = sections[nextIndex];

  current.classList.add("section-exit");
  current.setAttribute("aria-hidden", "true");

  window.setTimeout(() => {
    current.classList.remove("active", "section-exit");
    next.classList.add("active");
    next.removeAttribute("aria-hidden");
    currentSectionIndex = nextIndex;
    updateProgress();
    replayHeading(next);

    if (next.id === "reaction") {
      startCelebration();
    }

    isTransitioning = false;
  }, sectionDuration);
}

function goNext() {
  showSection(Math.min(currentSectionIndex + 1, sections.length - 1));
}

function restartExperience() {
  celebrationStarted = false;
  confettiLayer.innerHTML = "";
  floatingParty.innerHTML = "";
  showSection(0);
}

function createParticles() {
  const types = ["spark", "heart", "paw"];

  for (let index = 0; index < 54; index += 1) {
    const particle = document.createElement("span");
    const type = types[index % types.length];
    particle.className = `particle ${type}`;
    particle.style.setProperty("--x", `${Math.random() * 100}%`);
    particle.style.setProperty("--size", `${7 + Math.random() * 22}px`);
    particle.style.setProperty("--alpha", `${0.2 + Math.random() * 0.46}`);
    particle.style.setProperty("--dur", `${16 + Math.random() * 25}s`);
    particle.style.setProperty("--delay", `${Math.random() * -30}s`);
    particle.style.setProperty("--sway", `${-55 + Math.random() * 110}px`);
    particleLayer.appendChild(particle);
  }
}

function loadFirstExistingImage(element, candidates) {
  if (!candidates.length) {
    return;
  }

  const [candidate, ...rest] = candidates;
  const probe = new Image();

  probe.onload = () => {
    element.style.backgroundImage = `url("${candidate}")`;
    element.classList.add("has-image");

    if (element.parentElement && element.classList.contains("image-fill")) {
      element.parentElement.classList.add("has-image");
    }
  };

  probe.onerror = () => loadFirstExistingImage(element, rest);
  probe.src = candidate;
}

function setupImageCandidates() {
  document.querySelectorAll("[data-image-candidates]").forEach((element) => {
    const candidates = element.dataset.imageCandidates
      .split(",")
      .map((candidate) => candidate.trim())
      .filter(Boolean);

    loadFirstExistingImage(element, candidates);
  });
}

function setupMemoryCards() {
  document.querySelectorAll(".memory-card").forEach((card) => {
    card.addEventListener("pointermove", (event) => {
      const rect = card.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width - 0.5;
      const y = (event.clientY - rect.top) / rect.height - 0.5;
      card.style.setProperty("--rx", `${y * -6}deg`);
      card.style.setProperty("--ry", `${x * 8}deg`);
    });

    card.addEventListener("pointerleave", () => {
      card.style.setProperty("--rx", "0deg");
      card.style.setProperty("--ry", "0deg");
    });
  });
}

function moveRunawayButton() {
  if (!runawayButton) {
    return;
  }

  const row = runawayButton.parentElement;
  const rowRect = row.getBoundingClientRect();
  const buttonRect = runawayButton.getBoundingClientRect();
  const maxX = Math.max(10, rowRect.width - buttonRect.width - 12);
  const maxY = Math.max(10, rowRect.height - buttonRect.height - 12);
  const nextX = Math.round(Math.random() * maxX - maxX / 2);
  const nextY = Math.round(Math.random() * maxY - maxY / 2);

  runawayButton.style.setProperty("--run-x", `${nextX}px`);
  runawayButton.style.setProperty("--run-y", `${nextY}px`);
}

function setupRunawayButton() {
  if (!runawayButton) {
    return;
  }

  ["pointerenter", "click", "focus"].forEach((eventName) => {
    runawayButton.addEventListener(eventName, (event) => {
      if (eventName === "click") {
        event.preventDefault();
      }

      moveRunawayButton();
    });
  });
}

function showSecretToast() {
  secretToast.classList.add("show");
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => {
    secretToast.classList.remove("show");
  }, 3600);
}

function setupPandaSecret() {
  if (!pandaPeek) {
    return;
  }

  pandaPeek.addEventListener("click", () => {
    pandaClicks += 1;

    if (pandaClicks >= 5) {
      pandaClicks = 0;
      showSecretToast();
    }
  });
}

function createConfettiPiece(index) {
  const piece = document.createElement("span");
  piece.className = "confetti";
  piece.style.setProperty("--x", `${Math.random() * 100}%`);
  piece.style.setProperty("--w", `${6 + Math.random() * 9}px`);
  piece.style.setProperty("--h", `${10 + Math.random() * 18}px`);
  piece.style.setProperty("--color", celebrationColors[index % celebrationColors.length]);
  piece.style.setProperty("--rot", `${Math.random() * 360}deg`);
  piece.style.setProperty("--dur", `${2.4 + Math.random() * 2.4}s`);
  piece.style.setProperty("--delay", `${Math.random() * 0.55}s`);
  piece.style.setProperty("--fall-x", `${-120 + Math.random() * 240}px`);
  return piece;
}

function createFloatingPartyPiece(index) {
  const piece = document.createElement("span");
  piece.className = index % 3 === 0 ? "float-panda" : "float-heart";
  piece.style.setProperty("--x", `${Math.random() * 100}%`);
  piece.style.setProperty("--size", `${24 + Math.random() * 28}px`);
  piece.style.setProperty("--dur", `${7 + Math.random() * 5}s`);
  piece.style.setProperty("--delay", `${Math.random() * -6}s`);
  piece.style.setProperty("--sway", `${-70 + Math.random() * 140}px`);
  piece.style.setProperty("--rot", `${-18 + Math.random() * 36}deg`);
  return piece;
}

function startCelebration() {
  if (celebrationStarted) {
    return;
  }

  celebrationStarted = true;

  for (let index = 0; index < 110; index += 1) {
    confettiLayer.appendChild(createConfettiPiece(index));
  }

  for (let index = 0; index < 24; index += 1) {
    floatingParty.appendChild(createFloatingPartyPiece(index));
  }
}

function createPawTrail(x, y) {
  const now = performance.now();

  if (now - lastTrailTime < 82) {
    return;
  }

  lastTrailTime = now;
  const trail = document.createElement("span");
  trail.className = "paw-trail";
  trail.style.left = `${x - 8}px`;
  trail.style.top = `${y - 8}px`;
  document.body.appendChild(trail);

  window.setTimeout(() => {
    trail.remove();
  }, 760);
}

function animateCursor() {
  cursorX += (mouseX - cursorX) * 0.18;
  cursorY += (mouseY - cursorY) * 0.18;
  cursorPaw.style.transform = `translate3d(${cursorX - 6}px, ${cursorY - 6}px, 0) rotate(-12deg)`;
  requestAnimationFrame(animateCursor);
}

function setupCursor() {
  if (!window.matchMedia("(pointer: fine)").matches) {
    return;
  }

  window.addEventListener("mousemove", (event) => {
    mouseX = event.clientX;
    mouseY = event.clientY;
    createPawTrail(mouseX, mouseY);
  });

  animateCursor();
}

function playTone(frequency, startTime, duration) {
  const oscillator = audioContext.createOscillator();
  const gain = audioContext.createGain();

  oscillator.type = "sine";
  oscillator.frequency.setValueAtTime(frequency, startTime);
  gain.gain.setValueAtTime(0.0001, startTime);
  gain.gain.exponentialRampToValueAtTime(0.04, startTime + 0.04);
  gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

  oscillator.connect(gain);
  gain.connect(audioContext.destination);
  oscillator.start(startTime);
  oscillator.stop(startTime + duration + 0.04);
}

function scheduleMusic() {
  if (!audioContext) {
    return;
  }

  const now = audioContext.currentTime;
  const note = notes[musicStep % notes.length];
  playTone(note, now, 0.62);
  playTone(note / 2, now + 0.01, 0.84);
  musicStep += 1;
}

function startMusic() {
  const AudioEngine = window.AudioContext || window.webkitAudioContext;

  if (!AudioEngine) {
    soundLabel.textContent = "N/A";
    soundToggle.setAttribute("aria-pressed", "false");
    return;
  }

  audioContext = audioContext || new AudioEngine();

  if (audioContext.state === "suspended") {
    audioContext.resume();
  }

  scheduleMusic();
  musicTimer = window.setInterval(scheduleMusic, 820);
  soundToggle.setAttribute("aria-pressed", "true");
  soundLabel.textContent = "On";
}

function stopMusic() {
  window.clearInterval(musicTimer);
  musicTimer = null;
  soundToggle.setAttribute("aria-pressed", "false");
  soundLabel.textContent = "Off";
}

function setupMusicToggle() {
  soundToggle.addEventListener("click", () => {
    if (musicTimer) {
      stopMusic();
    } else {
      startMusic();
    }
  });
}

function setupNavigation() {
  nextButtons.forEach((button) => {
    button.addEventListener("click", goNext);
  });

  restartButton.addEventListener("click", restartExperience);
}

wrapAnimatedHeadings();
setupImageCandidates();
createParticles();
setupMemoryCards();
setupRunawayButton();
setupPandaSecret();
setupCursor();
setupMusicToggle();
setupNavigation();
updateProgress();
replayHeading(sections[0]);
