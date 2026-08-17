const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const fineHover = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

/* ---------- Preloader ---------- */
const preloader = document.getElementById('preloader');
window.addEventListener('load', () => {
  const delay = reduceMotion ? 0 : 900;
  setTimeout(() => preloader?.classList.add('is-hidden'), delay);
});

/* ---------- Smooth anchor scroll ---------- */
document.querySelectorAll('a[href^="#"], [data-scroll-to]').forEach(el => {
  el.addEventListener('click', function (e) {
    const href = this.getAttribute('href') || this.dataset.scrollTo;
    if (!href || !href.startsWith('#')) return;
    const target = document.querySelector(href);
    if (target) {
      e.preventDefault();
      target.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
      closeNavOverlay();
    }
  });
});

/* ---------- Nav overlay ---------- */
const navToggle = document.getElementById('navToggle');
const navOverlay = document.getElementById('navOverlay');

function openNavOverlay() {
  navOverlay.classList.add('is-open');
  navToggle.setAttribute('aria-expanded', 'true');
  document.body.style.overflow = 'hidden';
}

function closeNavOverlay() {
  navOverlay.classList.remove('is-open');
  navToggle.setAttribute('aria-expanded', 'false');
  document.body.style.overflow = '';
}

navToggle?.addEventListener('click', () => {
  const isOpen = navOverlay.classList.contains('is-open');
  isOpen ? closeNavOverlay() : openNavOverlay();
});

/* ---------- Custom cursor ---------- */
if (fineHover) {
  const dot = document.querySelector('.cursor-dot');
  const ring = document.querySelector('.cursor-ring');
  let mouseX = 0, mouseY = 0;
  let ringX = 0, ringY = 0;

  window.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
    dot.style.transform = `translate3d(${mouseX}px, ${mouseY}px, 0) translate(-50%, -50%)`;
  });

  function tick() {
    ringX += (mouseX - ringX) * 0.18;
    ringY += (mouseY - ringY) * 0.18;
    ring.style.transform = `translate3d(${ringX}px, ${ringY}px, 0) translate(-50%, -50%)`;
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);

  document.querySelectorAll('a, button, .magnetic').forEach(el => {
    el.addEventListener('mouseenter', () => ring.classList.add('is-active'));
    el.addEventListener('mouseleave', () => ring.classList.remove('is-active'));
  });
} else {
  document.querySelector('.cursor-dot')?.remove();
  document.querySelector('.cursor-ring')?.remove();
}

/* ---------- Magnetic buttons ---------- */
if (fineHover && !reduceMotion) {
  document.querySelectorAll('.magnetic').forEach(el => {
    el.addEventListener('mousemove', (e) => {
      const rect = el.getBoundingClientRect();
      const dx = e.clientX - (rect.left + rect.width / 2);
      const dy = e.clientY - (rect.top + rect.height / 2);
      el.style.transform = `translate(${dx * 0.25}px, ${dy * 0.35}px)`;
    });
    el.addEventListener('mouseleave', () => {
      el.style.transform = 'translate(0, 0)';
    });
  });
}

/* ---------- Scroll-linked pour (transform-only, rAF throttled) ---------- */
const manifesto = document.querySelector('.manifesto-grid');
const liquid = document.querySelector('.pour-liquid');
const pourLabels = document.querySelectorAll('.pour-label');
let ticking = false;

function updatePour() {
  if (!manifesto || !liquid) return;
  const rect = manifesto.getBoundingClientRect();
  const vh = window.innerHeight;
  const total = rect.height + vh * 0.6;
  const progressed = vh * 0.8 - rect.top;
  const progress = Math.min(1, Math.max(0, progressed / total));
  liquid.style.transform = `scaleY(${progress})`;

  const stage = progress < 0.34 ? 0 : progress < 0.7 ? 1 : 2;
  pourLabels.forEach((label, i) => label.classList.toggle('is-active', i === stage));

  ticking = false;
}

function onScroll() {
  if (!ticking && !reduceMotion) {
    requestAnimationFrame(updatePour);
    ticking = true;
  }
}

if (!reduceMotion) {
  window.addEventListener('scroll', onScroll, { passive: true });
  updatePour();
} else if (liquid) {
  liquid.style.transform = 'scaleY(1)';
}

/* ---------- Reveal on scroll (pillars, menu rows) ---------- */
const revealTargets = document.querySelectorAll('.pillar, .menu-row');
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry, i) => {
    if (entry.isIntersecting) {
      setTimeout(() => entry.target.classList.add('is-visible'), i * 60);
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.15, rootMargin: '0px 0px -60px 0px' });

revealTargets.forEach(el => revealObserver.observe(el));

if (reduceMotion) {
  revealTargets.forEach(el => el.classList.add('is-visible'));
}

/* ---------- Live open/closed status (Australia/Hobart) ---------- */
const hoursSchedule = {
  1: [7 * 60, 16 * 60],
  2: [7 * 60, 16 * 60],
  3: [7 * 60, 16 * 60],
  4: [7 * 60, 16 * 60],
  5: [7 * 60, 16 * 60],
  6: [7 * 60, 14 * 60 + 30],
  0: [8 * 60, 14 * 60],
};

function getHobartNow() {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Australia/Hobart',
    weekday: 'short',
    hour: 'numeric',
    minute: 'numeric',
    hour12: false,
  }).formatToParts(new Date());

  const map = {};
  parts.forEach(p => { map[p.type] = p.value; });
  const dayMap = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
  let hour = parseInt(map.hour, 10);
  if (hour === 24) hour = 0;
  return {
    day: dayMap[map.weekday],
    minutes: hour * 60 + parseInt(map.minute, 10),
  };
}

function formatTime(mins) {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  const period = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${String(m).padStart(2, '0')} ${period}`;
}

function updateStatus() {
  const statusDot = document.getElementById('statusDot');
  const statusText = document.getElementById('statusText');
  const hoursHeadline = document.getElementById('hoursHeadline');
  const hoursNote = document.getElementById('hoursNote');
  const rows = document.querySelectorAll('#hoursTable tr');

  const { day, minutes } = getHobartNow();
  const [open, close] = hoursSchedule[day];
  const isOpen = minutes >= open && minutes < close;

  rows.forEach(row => {
    row.classList.toggle('is-today', parseInt(row.dataset.day, 10) === day);
  });

  if (statusDot && statusText) {
    statusDot.classList.toggle('is-open', isOpen);
    statusText.textContent = isOpen ? 'Open now' : 'Closed';
  }

  if (hoursHeadline && hoursNote) {
    if (isOpen) {
      hoursHeadline.textContent = 'Open now';
      hoursNote.textContent = `Today until ${formatTime(close)} — Hobart time.`;
    } else {
      hoursHeadline.textContent = 'Closed';
      hoursNote.textContent = minutes < open
        ? `Opens today at ${formatTime(open)} — Hobart time.`
        : `Opens tomorrow — see the week below.`;
    }
  }
}

updateStatus();
setInterval(updateStatus, 60000);
