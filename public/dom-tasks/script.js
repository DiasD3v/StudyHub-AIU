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

// Каждый блок запускается только на своей странице.
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
