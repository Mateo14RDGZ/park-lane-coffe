const header = document.getElementById('siteHeader');
const headerTime = document.getElementById('headerTime');
const headerNote = document.getElementById('headerNote');
const visitTime = document.getElementById('visitTime');
const visitNote = document.getElementById('visitNote');
const visitHeadline = document.getElementById('visitHeadline');
const hourHand = document.getElementById('hourHand');
const minuteHand = document.getElementById('minuteHand');

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

function melbourneParts() {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Australia/Melbourne',
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(new Date());
  const values = Object.fromEntries(parts.map(part => [part.type, part.value]));
  const dayMap = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
  return { day: dayMap[values.weekday], hour: Number(values.hour) % 24, minute: Number(values.minute) };
}

function formatTime(minutes) {
  const hour = Math.floor(minutes / 60);
  const minute = minutes % 60;
  const period = hour >= 12 ? 'PM' : 'AM';
  const hour12 = hour % 12 || 12;
  return `${hour12}:${String(minute).padStart(2, '0')} ${period}`;
}

function formatHeadlineTime(minutes) {
  const hour = Math.floor(minutes / 60);
  const period = hour >= 12 ? 'PM' : 'AM';
  return `${hour % 12 || 12} ${period}`;
}

function nextOpening(fromDay) {
  for (let offset = 1; offset <= 7; offset += 1) {
    const day = (fromDay + offset) % 7;
    if (hoursSchedule[day]) return { day, open: hoursSchedule[day][0], isTomorrow: offset === 1 };
  }
  return null;
}

function updateMelbourneTime() {
  const { day, hour, minute } = melbourneParts();
  const minutes = hour * 60 + minute;
  const today = hoursSchedule[day];
  const isOpen = Boolean(today && minutes >= today[0] && minutes < today[1]);
  const time = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')} · Melbourne`;
  let note;
  let headline;

  if (isOpen) {
    note = `Open now · today until ${formatTime(today[1])}.`;
    headline = 'Open now —';
  } else if (today && minutes < today[0]) {
    note = `Opening today at ${formatTime(today[0])}.`;
    headline = `Open at ${formatHeadlineTime(today[0])} —`;
  } else {
    const next = nextOpening(day);
    const nextDay = next.isTomorrow ? 'tomorrow' : dayNames[next.day];
    note = `Closed · opens ${nextDay} at ${formatTime(next.open)}.`;
    headline = day === 0 ? 'Closed today —' : 'Closed for today —';
  }

  if (headerTime) headerTime.textContent = time;
  if (headerNote) headerNote.textContent = note;
  if (visitTime) visitTime.textContent = time;
  if (visitNote) visitNote.textContent = note;
  if (visitHeadline) visitHeadline.textContent = headline;
  if (hourHand) hourHand.style.transform = `translateX(-50%) rotate(${(hour % 12) * 30 + minute * .5}deg)`;
  if (minuteHand) minuteHand.style.transform = `translateX(-50%) rotate(${minute * 6}deg)`;

  document.querySelectorAll('.hours [data-day]').forEach(row => {
    row.classList.toggle('is-today', Number(row.dataset.day) === day);
  });
}

function updateHeader() {
  header?.classList.toggle('scrolled', window.scrollY > 24);
}

const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const revealElements = document.querySelectorAll('.reveal:not(.is-visible)');

if (prefersReducedMotion || !('IntersectionObserver' in window)) {
  revealElements.forEach(element => element.classList.add('is-visible'));
} else {
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-visible');
      observer.unobserve(entry.target);
    });
  }, { threshold: .12, rootMargin: '0px 0px -60px' });
  revealElements.forEach(element => observer.observe(element));
}

window.addEventListener('scroll', updateHeader, { passive: true });
updateHeader();
updateMelbourneTime();
setInterval(updateMelbourneTime, 60000);
