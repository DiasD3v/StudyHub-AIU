// Переключаем разделы внутри index.html, не меняя адрес и состояние заданий.
const pageTabs = Array.from(document.querySelectorAll('.browser-tab'));
const pages = document.querySelectorAll('[role="tabpanel"]');

function switchPage(pageId) {
  const activeTab = pageTabs.find(tab => tab.dataset.page === pageId);
  if (!activeTab) return;

  pages.forEach(page => {
    page.hidden = page.id !== pageId;
  });
  pageTabs.forEach(tab => {
    const selected = tab === activeTab;
    tab.setAttribute('aria-selected', String(selected));
    tab.tabIndex = selected ? 0 : -1;
  });

  // Созданный в конце body блок относится только к первому заданию.
  const newDiv = document.querySelector('.new-div');
  if (newDiv) newDiv.hidden = pageId !== 'page-one';

  activeTab.focus();
  window.scrollTo(0, 0);
}

document.querySelectorAll('[data-page]').forEach(button => {
  button.addEventListener('click', () => switchPage(button.dataset.page));
});

// Вкладки доступны стрелками, Home и End; Enter и пробел работают как обычно.
pageTabs.forEach((tab, index) => {
  tab.addEventListener('keydown', event => {
    let nextIndex;
    if (event.key === 'ArrowRight') nextIndex = (index + 1) % pageTabs.length;
    else if (event.key === 'ArrowLeft') nextIndex = (index - 1 + pageTabs.length) % pageTabs.length;
    else if (event.key === 'Home') nextIndex = 0;
    else if (event.key === 'End') nextIndex = pageTabs.length - 1;
    else return;

    event.preventDefault();
    switchPage(pageTabs[nextIndex].dataset.page);
  });
});

// Текстовые элементы работают и по клику, и с клавиатуры.
function onTextActivate(element, action) {
  element.addEventListener('click', action);
  element.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      if (!event.repeat) action();
    }
  });
}

// Обработчики обоих заданий подключаются один раз при загрузке страницы.
const greeting = document.getElementById('greeting');

if (greeting) {
  // 1. Находим текст по ID. Меняем его только после нажатия.
  onTextActivate(greeting, () => {
    const changed = greeting.getAttribute('aria-pressed') !== 'true';
    greeting.textContent = changed ? 'Сәлем, әлем!' : 'Бастапқы мәтін';
    greeting.setAttribute('aria-pressed', String(changed));
  });

  // 2. По кнопке создаём div и добавляем последним элементом body.
  const createElementButton = document.getElementById('create-element');
  createElementButton.addEventListener('click', () => {
    if (document.querySelector('.new-div')) return;

    const newDiv = document.createElement('div');
    newDiv.classList.add('new-div');
    newDiv.textContent = 'Мен жаңа элементпін';
    newDiv.tabIndex = -1;
    document.body.appendChild(newDiv);

    createElementButton.disabled = true;
    document.getElementById('creation-status').textContent = 'Жаңа элемент беттің соңына қосылды.';
    newDiv.focus();
  });

  // 3. Старый элемент остаётся на странице, пока пользователь его не нажмёт.
  const oldElement = document.querySelector('.old-element');
  onTextActivate(oldElement, () => {
    oldElement.remove();
    const status = document.getElementById('removal-status');
    status.textContent = 'Ескі элемент жойылды.';
    status.focus();
  });

  // 4. Второй кнопкой создаём абзац. Его стиль меняется по нажатию на текст.
  const createParagraphButton = document.getElementById('create-paragraph');
  createParagraphButton.addEventListener('click', () => {
    const container = document.getElementById('paragraph-container');
    if (container.firstElementChild) return;

    const paragraph = document.createElement('p');
    paragraph.textContent = 'Бұл ауыспалы абзац';
    paragraph.classList.add('interactive-text', 'interactive-paragraph');
    paragraph.tabIndex = 0;
    paragraph.setAttribute('role', 'button');
    paragraph.setAttribute('aria-pressed', 'false');
    paragraph.setAttribute('aria-describedby', 'paragraph-container-hint');

    onTextActivate(paragraph, () => {
      const enlarged = paragraph.getAttribute('aria-pressed') !== 'true';
      paragraph.style.color = enlarged ? '#6d28d9' : '';
      paragraph.style.fontSize = enlarged ? '24px' : '';
      paragraph.setAttribute('aria-pressed', String(enlarged));
    });

    container.appendChild(paragraph);
    createParagraphButton.disabled = true;
    paragraph.focus();
  });
}

// Задание 2. Нажатие на сам элемент переключает только класс active.
const classTarget = document.getElementById('class-target');

if (classTarget) {
  onTextActivate(classTarget, () => {
    const isActive = classTarget.classList.toggle('active');
    classTarget.setAttribute('aria-pressed', String(isActive));

    const classes = Array.from(classTarget.classList).join(', ');
    console.log('Элемент кластары:', classes);
    document.getElementById('class-list').textContent = `Элемент кластары: ${classes}`;
  });
}

// Задание 3. Создание таблицы и работа с цветами ячеек.
const tableContainer = document.getElementById('table-container');
const tableRows = document.getElementById('table-rows');
const tableColumns = document.getElementById('table-columns');
const paintColor = document.getElementById('paint-color');
const countColor = document.getElementById('count-color');

const colorNames = {
  red: 'Қызыл',
  blue: 'Көк',
  green: 'Жасыл',
  yellow: 'Сары',
  none: 'Түссіз'
};

function validTableSize(value) {
  return Number.isInteger(value) && value >= 1 && value <= 50;
}

function createTable(rows, columns) {
  // Проверяем ввод до удаления предыдущей таблицы.
  if (!validTableSize(rows) || !validTableSize(columns)) {
    throw new RangeError(
      'Жолдар мен бағандар саны 1–50 аралығындағы бүтін сан болуы керек.'
    );
  }

  const table = document.createElement('table');
  table.id = 'generated-table';
  table.setAttribute('aria-describedby', 'table-click-hint');

  const caption = table.createCaption();
  caption.textContent = `${rows} × ${columns} кесте`;

  const body = table.createTBody();

  for (let row = 1; row <= rows; row++) {
    const tr = body.insertRow();

    for (let column = 1; column <= columns; column++) {
      const cell = tr.insertCell();

      cell.dataset.color = 'none';
      cell.dataset.row = row;
      cell.dataset.column = column;

      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'cell-button';
      button.textContent = `${row}, ${column}`;
      button.setAttribute(
        'aria-label',
        `${row}-жол, ${column}-баған: ${colorNames.none}`
      );

      cell.appendChild(button);
    }
  }

  tableContainer.replaceChildren(table);
  document.getElementById('table-tools').hidden = false;

  document.getElementById('table-status').textContent =
    `${rows} жол, ${columns} баған: ${rows * columns} ұяшық құрылды.`;

  showColorCount();
}

function countCellsByColor(color) {
  const cells = tableContainer.querySelectorAll('td');

  return Array.from(cells)
    .filter(cell => cell.dataset.color === color)
    .length;
}

function showColorCount() {
  const color = countColor.value;

  document.getElementById('color-count').textContent =
    `${colorNames[color]} ұяшықтар саны: ${countCellsByColor(color)}`;
}

document.getElementById('table-form').addEventListener('submit', event => {
  event.preventDefault();

  const rows = tableRows.valueAsNumber;
  const columns = tableColumns.valueAsNumber;

  tableRows.setAttribute('aria-invalid', String(!validTableSize(rows)));
  tableColumns.setAttribute('aria-invalid', String(!validTableSize(columns)));

  try {
    createTable(rows, columns);
    document.getElementById('table-error').textContent = '';
  } catch (error) {
    if (!(error instanceof RangeError)) throw error;

    document.getElementById('table-error').textContent = error.message;

    const invalidInput = !validTableSize(rows) ? tableRows : tableColumns;
    invalidInput.focus();
  }
});

tableContainer.addEventListener('click', event => {
  const cell = event.target.closest('td');
  if (!cell || !tableContainer.contains(cell)) return;

  // Повторное нажатие тем же цветом снимает окраску.
  const color = cell.dataset.color === paintColor.value
    ? 'none'
    : paintColor.value;

  cell.dataset.color = color;

  cell.querySelector('button').setAttribute(
    'aria-label',
    `${cell.dataset.row}-жол, ${cell.dataset.column}-баған: ${colorNames[color]}`
  );

  showColorCount();
});

countColor.addEventListener('change', showColorCount);
document.getElementById('count-cells')
  .addEventListener('click', showColorCount);