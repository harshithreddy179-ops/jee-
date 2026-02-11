const STORAGE_KEY = 'jeeasy-productivity-state-v2';

const chapters = [
  { subject: 'Physics', name: 'Current Electricity', priority: 'High', score: 10, weightage: '2-3 Q' },
  { subject: 'Physics', name: 'Electrostatics', priority: 'High', score: 10, weightage: '2-3 Q' },
  { subject: 'Physics', name: 'Kinematics & NLM', priority: 'High', score: 9, weightage: '2 Q' },
  { subject: 'Physics', name: 'Modern Physics', priority: 'High', score: 9, weightage: '2 Q' },
  { subject: 'Physics', name: 'Ray Optics', priority: 'Medium', score: 7, weightage: '1-2 Q' },
  { subject: 'Physics', name: 'SHM & Waves', priority: 'Medium', score: 6, weightage: '1-2 Q' },
  { subject: 'Chemistry', name: 'Chemical Bonding', priority: 'High', score: 10, weightage: '2-3 Q' },
  { subject: 'Chemistry', name: 'Coordination Compounds', priority: 'High', score: 9, weightage: '2 Q' },
  { subject: 'Chemistry', name: 'GOC + Hydrocarbons', priority: 'High', score: 9, weightage: '2 Q' },
  { subject: 'Chemistry', name: 'P-Block', priority: 'Medium', score: 7, weightage: '1-2 Q' },
  { subject: 'Chemistry', name: 'Thermodynamics', priority: 'Medium', score: 7, weightage: '1-2 Q' },
  { subject: 'Chemistry', name: 'Biomolecules/Polymers', priority: 'Low', score: 4, weightage: '1 Q' },
  { subject: 'Mathematics', name: 'Calculus (Differential)', priority: 'High', score: 10, weightage: '3 Q' },
  { subject: 'Mathematics', name: 'Coordinate Geometry', priority: 'High', score: 10, weightage: '3 Q' },
  { subject: 'Mathematics', name: 'Matrices & Determinants', priority: 'High', score: 9, weightage: '2 Q' },
  { subject: 'Mathematics', name: 'Vector 3D', priority: 'High', score: 8, weightage: '2 Q' },
  { subject: 'Mathematics', name: 'Probability', priority: 'Medium', score: 7, weightage: '1-2 Q' },
  { subject: 'Mathematics', name: 'Complex Numbers', priority: 'Medium', score: 6, weightage: '1-2 Q' }
];

const PRIORITY_RANK = { High: 0, Medium: 1, Low: 2 };

let state = loadState();

const subjectGroups = document.getElementById('subject-groups');
const subjectTemplate = document.getElementById('subject-template');
const chapterTemplate = document.getElementById('chapter-template');
const subjectFilter = document.getElementById('subject-filter');
const priorityFilter = document.getElementById('priority-filter');
const searchInput = document.getElementById('search');

const totalCount = document.getElementById('total-count');
const completedCount = document.getElementById('completed-count');
const progressCount = document.getElementById('progress-count');
const nextTarget = document.getElementById('next-target');

document.getElementById('reset-all').addEventListener('click', () => {
  state = { completed: {} };
  persistState();
  render();
});

document.getElementById('mark-high-priority').addEventListener('click', () => {
  chapters.filter((c) => c.priority === 'High').forEach((c) => {
    state.completed[c.name] = true;
  });
  persistState();
  render();
});

subjectFilter.addEventListener('change', render);
priorityFilter.addEventListener('change', render);
searchInput.addEventListener('input', render);

function loadState() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return { completed: {} };
  try {
    const parsed = JSON.parse(raw);
    return { completed: parsed.completed || {} };
  } catch {
    return { completed: {} };
  }
}

function persistState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function chapterSort(a, b) {
  if (PRIORITY_RANK[a.priority] !== PRIORITY_RANK[b.priority]) {
    return PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority];
  }
  if (b.score !== a.score) {
    return b.score - a.score;
  }
  return a.name.localeCompare(b.name);
}

function render() {
  const filtered = chapters.filter((chapter) => {
    const bySubject = subjectFilter.value === 'all' || chapter.subject === subjectFilter.value;
    const byPriority = priorityFilter.value === 'all' || chapter.priority === priorityFilter.value;
    const bySearch = chapter.name.toLowerCase().includes(searchInput.value.toLowerCase().trim());
    return bySubject && byPriority && bySearch;
  });

  const grouped = filtered.reduce((acc, chapter) => {
    if (!acc[chapter.subject]) acc[chapter.subject] = [];
    acc[chapter.subject].push(chapter);
    return acc;
  }, {});

  subjectGroups.innerHTML = '';

  Object.keys(grouped)
    .sort((a, b) => a.localeCompare(b))
    .forEach((subject) => {
      const section = subjectTemplate.content.firstElementChild.cloneNode(true);
      section.querySelector('.subject-title').textContent = subject;

      const subjectChapters = grouped[subject].sort(chapterSort);
      const doneCount = subjectChapters.filter((c) => state.completed[c.name]).length;
      section.querySelector('.subject-progress').textContent = `${doneCount}/${subjectChapters.length} done`;

      const list = section.querySelector('.chapter-list');

      subjectChapters.forEach((chapter) => {
        const node = chapterTemplate.content.firstElementChild.cloneNode(true);
        const checkbox = node.querySelector('input');
        const nameNode = node.querySelector('.chapter-name');
        const [priorityChip, weightageChip] = node.querySelectorAll('.chip');

        checkbox.checked = Boolean(state.completed[chapter.name]);
        checkbox.addEventListener('change', (event) => {
          state.completed[chapter.name] = event.target.checked;
          persistState();
          render();
        });

        nameNode.textContent = chapter.name;
        priorityChip.textContent = `${chapter.priority} Priority`;
        priorityChip.classList.add(chapter.priority.toLowerCase());
        weightageChip.textContent = chapter.weightage;

        list.appendChild(node);
      });

      subjectGroups.appendChild(section);
    });

  updateStats();
}

function updateStats() {
  const total = chapters.length;
  const completed = chapters.filter((c) => state.completed[c.name]).length;
  const percent = Math.round((completed / total) * 100);

  const pendingSorted = chapters
    .filter((c) => !state.completed[c.name])
    .sort((a, b) => PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority] || b.score - a.score || a.name.localeCompare(b.name));

  totalCount.textContent = total;
  completedCount.textContent = completed;
  progressCount.textContent = `${percent}%`;
  nextTarget.textContent = pendingSorted[0] ? `${pendingSorted[0].name} (${pendingSorted[0].subject})` : 'All done 🎉';
}

render();
