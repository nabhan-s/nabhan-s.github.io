// Animated counter
const counter = document.querySelector('.counter');
if (counter) {
  const from = +counter.dataset.from, to = +counter.dataset.to;
  new IntersectionObserver((e, o) => {
    if (!e[0].isIntersecting) return;
    o.disconnect();
    let v = from;
    const t = setInterval(() => {
      v += 0.1; counter.textContent = Math.min(v, to).toFixed(1);
      if (v >= to) clearInterval(t);
    }, 120);
  }).observe(counter);
}

function wire(formId, resultId, render) {
  const form = document.getElementById(formId);
  if (!form) return;
  form.addEventListener('submit', e => {
    e.preventDefault();
    const out = document.getElementById(resultId);
    out.innerHTML = render(Object.fromEntries(new FormData(form)));
    out.classList.remove('hidden');
  });
}

wire('impact-quiz', 'impact-result', () => 'Result placeholder.');

// Team matcher
const ROLES = {
  partnership: ['Nonprofit Partnership', 'Brings in new nonprofit projects: reviews applications, meets with potential partners about their product needs, and develops proposals.'],
  design: ['Design', 'Product designers join nonprofit project teams with PMs and engineers, identify design needs, and create lo-fi to hi-fi mockups. Design bootcampers take a one-semester course covering the end-to-end research and design process.'],
  marketing: ['Marketing', 'Manages external branding and communication, creates campaigns for BoG events, and attracts nonprofits and sponsors to the mission. The writers and creators behind BoG in all forms of media.'],
  engineering: ['Engineering', 'Handles the nuts-and-bolts of every project, building JavaScript web apps with the MERN stack (MongoDB, ExpressJS, ReactJS, NodeJS). Specialize in frontend or backend, or be a jack-of-all-trades.'],
  product: ['Product', 'Defines project expectations and features by working with nonprofit partners. Effective communicators who talk to clients in terms they understand, and who draft product specs and actionable roadmaps.'],
  operations: ['Operations', 'Events and logistics: managing finances, member management and recruitment, or planning events that bring the community closer together.'],
  brand: ['Brand', 'Drives engagement through creative visual content creation and promotion of the Bits of Good brand.']
};
const QUESTIONS = [
  ['What sounds like the best way to spend an afternoon?', [
    ['Building a feature and watching it work', 'engineering'],
    ['Sketching how a screen should look and feel', 'design'],
    ['Planning an event and sorting out the details', 'operations'],
    ['Talking with someone about what they need', 'partnership,product']]],
  ['Which of these would you be proud to make?', [
    ['A polished app people use every day', 'engineering,design'],
    ['A campaign that gets people talking', 'marketing,brand'],
    ['A clear plan that keeps a team on track', 'product,operations'],
    ['A proposal that wins over a new partner', 'partnership']]],
  ['How do you like to work?', [
    ['Deep focus on a hard problem', 'engineering'],
    ['Creating visuals, videos, or graphics', 'brand,design'],
    ['Meeting and talking with lots of people', 'partnership,operations'],
    ['Writing and storytelling', 'marketing,product']]],
  ['What do you most want to get better at?', [
    ['Writing production-quality code', 'engineering'],
    ['User research and design', 'design'],
    ['Communicating with clients', 'product,partnership'],
    ['Leading people and running things', 'operations'],
    ['Creative content and media', 'marketing,brand']]],
  ['Which nonprofit task would you take on?', [
    ['Build their new website or app', 'engineering'],
    ['Interview staff to find their real pain points', 'product,design,partnership'],
    ['Tell their story to attract donors', 'marketing,brand'],
    ['Organize a launch event', 'operations']]]
];

// Race-style team quiz
const startBtn = document.getElementById('quiz-start');
const teamList = document.getElementById('team-list');
if (teamList) {
  teamList.innerHTML = Object.values(ROLES)
    .map(r => `<div class="card"><h3>${r[0]}</h3><p>${r[1]}</p></div>`).join('');
}

if (startBtn) {
  const race = document.createElement('div');
  race.className = 'race hidden';
  race.setAttribute('role', 'dialog');
  race.setAttribute('aria-modal', 'true');
  race.innerHTML = `<button class="race-close" type="button" aria-label="Close quiz">✕</button>
    <div class="race-track"><div class="race-fill"></div><span class="race-car">🏎️</span><span class="race-flag">🏁</span></div>
    <div class="race-stage"></div>`;
  document.body.appendChild(race);
  const stage = race.querySelector('.race-stage');
  const fill = race.querySelector('.race-fill');
  const car = race.querySelector('.race-car');
  let step = 0, answers = [], locked = false;

  function progress(p) { fill.style.width = p + '%'; car.style.left = p + '%'; }

  function question() {
    locked = false;
    const [text, opts] = QUESTIONS[step];
    progress((step / QUESTIONS.length) * 100);
    stage.innerHTML = `<div class="zoom-card">
      <div class="q-count">Question ${step + 1} of ${QUESTIONS.length}</div>
      <h2>${text}</h2>
      <div class="q-opts">${opts.map((o, i) =>
        `<button type="button" class="q-opt" data-v="${o[1]}"><span class="q-key">${i + 1}</span>${o[0]}</button>`).join('')}</div>
    </div>`;
  }

  function pick(btn) {
    if (locked) return;
    locked = true;
    btn.classList.add('chosen');
    answers.push(btn.dataset.v);
    const card = stage.firstElementChild;
    setTimeout(() => card.classList.add('zoom-out'), 250);
    setTimeout(() => { step++; step < QUESTIONS.length ? question() : finish(); }, 650);
  }

  function finish() {
    progress(100);
    const score = Object.fromEntries(Object.keys(ROLES).map(k => [k, 0]));
    answers.forEach(v => v.split(',').forEach(r => score[r]++));
    const [first, second] = Object.keys(score).sort((x, y) => score[y] - score[x]);
    stage.innerHTML = `<div class="zoom-card result-card">
      <div class="q-count">🏆 You made it to the finish</div>
      <h2>Your top match: ${ROLES[first][0]}</h2>
      <p>${ROLES[first][1]}</p>
      <p class="runner-up">Also consider <strong>${ROLES[second][0]}</strong>: ${ROLES[second][1]}</p>
      <div class="result-actions"><button class="btn" id="race-again" type="button">Retake quiz</button>
      <button class="btn secondary" id="race-done" type="button">See all teams</button></div>
    </div>`;
  }

  function open() { step = 0; answers = []; race.classList.remove('hidden'); document.body.style.overflow = 'hidden'; question(); }
  function close() { race.classList.add('hidden'); document.body.style.overflow = ''; }

  startBtn.addEventListener('click', open);
  race.querySelector('.race-close').addEventListener('click', close);
  stage.addEventListener('click', e => {
    const opt = e.target.closest('.q-opt');
    if (opt) return pick(opt);
    if (e.target.id === 'race-again') open();
    if (e.target.id === 'race-done') { close(); teamList.scrollIntoView({behavior: 'smooth'}); }
  });
  document.addEventListener('keydown', e => {
    if (race.classList.contains('hidden')) return;
    if (e.key === 'Escape') close();
    const opts = stage.querySelectorAll('.q-opt');
    if (/^[1-9]$/.test(e.key) && opts[+e.key - 1]) pick(opts[+e.key - 1]);
  });
}
