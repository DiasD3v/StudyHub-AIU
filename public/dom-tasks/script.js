// 1. Находим элемент по ID и меняем его текст.
const greeting = document.getElementById('greeting');
greeting.textContent = 'Сәлем, әлем!';

// 2. Создаём div с нужным классом и добавляем последним элементом body.
const newDiv = document.createElement('div');
newDiv.classList.add('new-div');
newDiv.textContent = 'Мен жаңа элементпін';
document.body.appendChild(newDiv);

// 3. Находим старый элемент по классу и удаляем его из DOM.
const oldElement = document.querySelector('.old-element');
if (oldElement) {
  oldElement.remove();
  document.getElementById('removal-status').textContent = 'Ескі элемент жойылды.';
}

// 4. Создаём абзац и добавляем его в контейнер первого задания.
const paragraph = document.createElement('p');
paragraph.textContent = 'Бұл ауыспалы абзац';
paragraph.classList.add('interactive-paragraph');
paragraph.tabIndex = 0;
paragraph.setAttribute('role', 'button');
paragraph.setAttribute('aria-describedby', 'paragraph-container-hint');
document.getElementById('paragraph-container').appendChild(paragraph);

// 5. При нажатии меняем цвет текста и размер шрифта.
function changeParagraphStyle() {
  paragraph.style.color = '#7c3aed';
  paragraph.style.fontSize = '24px';
}

paragraph.addEventListener('click', changeParagraphStyle);
// Тот же результат доступен с клавиатуры.
paragraph.addEventListener('keydown', (event) => {
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault();
    changeParagraphStyle();
  }
});

// Задание 2. Выводим все классы выбранного элемента в консоль и соседний p.
const classTarget = document.getElementById('class-target');
const classListOutput = document.getElementById('class-list');
const toggleButton = document.getElementById('toggle-class');

function showClasses() {
  const classes = Array.from(classTarget.classList).join(', ');
  console.log('Элемент кластары:', classes);
  classListOutput.textContent = `Элемент кластары: ${classes}`;
}

toggleButton.addEventListener('click', () => {
  // toggle добавляет отсутствующий класс и удаляет существующий.
  const isActive = classTarget.classList.toggle('active');
  toggleButton.setAttribute('aria-pressed', String(isActive));
  showClasses();
});

// Показываем исходный список сразу после загрузки страницы.
showClasses();
