const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

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

/* ---------- Scroll-linked pour (transform-only, rAF throttled) ---------- */
const manifesto = document.querySelector('.manifesto-grid');
const liquid = document.querySelector('.pour-liquid');
const pourLabels = document.querySelectorAll('.pour-label');
let ticking = false;

function updatePour() {
  if (!manifesto || !liquid) return;
  const rect = manifesto.getBoundingClientRect();
  const vh = window.innerHeight;
  // Fill starts as soon as the section is barely on screen and finishes
  // well within one viewport of scrolling, regardless of section height,
  // so it doesn't lag behind while reading the text next to it.
  const startTrigger = vh * 0.92;
  const endTrigger = vh * 0.15;
  const progress = Math.min(1, Math.max(0, (startTrigger - rect.top) / (startTrigger - endTrigger)));
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

/* ---------- Reveal on scroll (review cards, menu rows) ---------- */
const revealTargets = document.querySelectorAll('.review-card, .menu-row');
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

/* ---------- Live open/closed status (Australia/Melbourne) ---------- */
const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const hoursSchedule = {
  1: [7 * 60, 14 * 60],
  2: [7 * 60, 14 * 60],
  3: [7 * 60, 14 * 60],
  4: [7 * 60, 14 * 60],
  5: [7 * 60, 14 * 60],
  6: [8 * 60, 14 * 60],
  0: null,
};

function getMelbourneNow() {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Australia/Melbourne',
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

function nextOpening(fromDay) {
  for (let i = 1; i <= 7; i++) {
    const day = (fromDay + i) % 7;
    if (hoursSchedule[day]) {
      return { day, open: hoursSchedule[day][0], isTomorrow: i === 1 };
    }
  }
  return null;
}

function updateStatus() {
  const statusDot = document.getElementById('statusDot');
  const statusText = document.getElementById('statusText');
  const hoursHeadline = document.getElementById('hoursHeadline');
  const hoursNote = document.getElementById('hoursNote');
  const rows = document.querySelectorAll('#hoursTable tr');

  const { day, minutes } = getMelbourneNow();
  const today = hoursSchedule[day];
  const isOpen = today ? (minutes >= today[0] && minutes < today[1]) : false;

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
      hoursNote.textContent = `Today until ${formatTime(today[1])} — Melbourne time.`;
    } else {
      hoursHeadline.textContent = 'Closed';
      if (today && minutes < today[0]) {
        hoursNote.textContent = `Opens today at ${formatTime(today[0])} — Melbourne time.`;
      } else {
        const next = nextOpening(day);
        hoursNote.textContent = next
          ? `Opens ${next.isTomorrow ? 'tomorrow' : dayNames[next.day]} at ${formatTime(next.open)} — Melbourne time.`
          : 'See the week below.';
      }
    }
  }
}

updateStatus();
setInterval(updateStatus, 60000);
