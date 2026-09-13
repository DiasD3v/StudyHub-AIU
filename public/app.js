document.getElementById('currentDate').textContent = new Date().toLocaleDateString('ru-RU', { 
  weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
});

const form = document.getElementById('diaryForm');
const tableBody = document.getElementById('diaryTableBody');

function updateDashboardStats(entries) {
  const grades = entries.filter(e => e.grade).map(e => parseInt(e.grade));
  const avg = grades.length ? (grades.reduce((a, b) => a + b) / grades.length).toFixed(1) : '0.0';
  document.getElementById('avgGrade').textContent = avg;

  const tasks = entries.filter(e => e.homework !== '').length;
  document.getElementById('taskCount').textContent = tasks;
}

function getGradeBadge(grade) {
  if (!grade) return '<span class="badge badge-empty">—</span>';
  return `<span class="badge badge-${grade}">${grade}</span>`;
}

function renderDiary() {
  const entries = JSON.parse(localStorage.getItem('studyhub_diary')) || [];
  
  // Сортировка по дате (по убыванию)
  entries.sort((a, b) => new Date(b.date) - new Date(a.date));

  tableBody.innerHTML = entries.map((entry, index) => {
    const formattedDate = new Date(entry.date).toLocaleDateString('ru-RU');
    return `
      <tr>
        <td>${formattedDate}</td>
        <td style="font-weight: 500;">${entry.subject}</td>
        <td style="color: var(--text-secondary);">${entry.homework || '—'}</td>
        <td>${getGradeBadge(entry.grade)}</td>
        <td><button onclick="deleteEntry(${index})" class="btn-delete">Удалить</button></td>
      </tr>
    `;
  }).join('');

  updateDashboardStats(entries);
}

form.addEventListener('submit', (e) => {
  e.preventDefault();
  const entry = {
    date: document.getElementById('date').value,
    subject: document.getElementById('subject').value,
    homework: document.getElementById('homework').value,
    grade: document.getElementById('grade').value
  };

  const entries = JSON.parse(localStorage.getItem('studyhub_diary')) || [];
  entries.push(entry);
  localStorage.setItem('studyhub_diary', JSON.stringify(entries));
  
  form.reset();
  renderDiary();
});

window.deleteEntry = function(index) {
  const entries = JSON.parse(localStorage.getItem('studyhub_diary')) || [];
  entries.splice(index, 1);
  localStorage.setItem('studyhub_diary', JSON.stringify(entries));
  renderDiary();
};

renderDiary();