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
