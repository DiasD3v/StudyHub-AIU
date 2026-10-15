(() => {
  "use strict";

  const API = "https://dummyjson.com";
  const STORAGE_KEY = "studyhub-user-card-demo-v2";

  // Учебные назначения и статусы.
  // Это не реальные авторы коммитов GitHub.
  const SEED_TASKS = [
    ["dom-one", "1-тапсырма. Элементтермен жұмыс", 1, true],
    ["dom-two", "2-тапсырма. Кластарды басқару", 2, true],
    ["dom-three", "3-тапсырма. Кестемен жұмыс", 1, false],
    ["dom-four", "4-тапсырма. Қараңғы тақырып", 3, true],

    ["demo-1-validation", "Валидация формы регистрации", 1, true],
    ["demo-1-errors", "Обработка ошибок API", 1, false],
    ["demo-1-search", "Поиск заданий по названию", 1, true],
    ["demo-1-sort", "Сортировка массива пользователей", 1, false],

    ["demo-2-grid", "Адаптивная сетка карточек", 2, true],
    ["demo-2-menu", "Выпадающее меню навигации", 2, true],
    ["demo-2-fetch", "Загрузка данных через fetch", 2, false],
    ["demo-2-theme", "Кнопка переключения темы", 2, true],
    ["demo-2-filter", "Фильтрация выполненных заданий", 2, false],

    ["demo-3-add", "Добавление задания в список", 3, true],
    ["demo-3-status", "Изменение статуса задания", 3, false],
    ["demo-3-keyboard", "Клавиатурная навигация", 3, true],
    ["demo-3-storage", "Сохранение заданий в localStorage", 3, true],
    ["demo-3-delete", "Удаление задания из списка", 3, false],

    ["demo-4-animation", "Анимация открытия профиля", 4, true],
    ["demo-4-profile", "Вёрстка карточки пользователя", 4, true],
    ["demo-4-photo", "Загрузка фотографии профиля", 4, false],
    ["demo-4-counts", "Обновление счётчиков заданий", 4, true],
    ["demo-4-form", "Проверка полей формы", 4, false],
    ["demo-4-events", "Работа с событиями DOM", 4, true]
  ].map(([id, title, userId, completed]) => ({
    id,
    title,
    userId,
    completed
  }));

  const users = new Map();
  const profiles = new Map();

  let tasks = SEED_TASKS.map(task => ({ ...task }));
  let deletedIds = new Set();
  let storageWarning = "";

  function validTask(task) {
    return task &&
      typeof task.id === "string" &&
      task.id.length > 0 &&
      typeof task.title === "string" &&
      task.title.trim().length > 0 &&
      Number.isInteger(task.userId) &&
      task.userId > 0 &&
      typeof task.completed === "boolean";
  }

  function loadStoredTasks() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw === null) return;

      const saved = JSON.parse(raw);
      const oldFormat = Array.isArray(saved);

      // Поддержка сохранений из предыдущей тестовой версии.
      const storedTasks = oldFormat
        ? saved
        : saved?.version === 3 ? saved.tasks : null;

      const removed = oldFormat ? [] : saved?.deletedIds;

      if (
        !Array.isArray(storedTasks) ||
        !storedTasks.every(validTask) ||
        new Set(storedTasks.map(task => task.id)).size !== storedTasks.length ||
        !Array.isArray(removed) ||
        !removed.every(id => typeof id === "string" && id.length > 0)
      ) {
        throw new Error("Неверный формат сохранённых данных");
      }

      deletedIds = new Set(removed);

      tasks = storedTasks
        .filter(task => !deletedIds.has(task.id))
        .map(({ id, title, userId, completed, pageId, kind }) => ({
          id,
          title,
          userId,
          completed,
          pageId,
          kind
        }));

      const existingIds = new Set(tasks.map(task => task.id));

      // Новые примеры добавляются без удаления сохранённых работ.
      for (const task of SEED_TASKS) {
        if (!existingIds.has(task.id) && !deletedIds.has(task.id)) {
          tasks.push({ ...task });
        }
      }
    } catch {
      storageWarning =
        "Сохранённые данные недоступны. Показаны исходные примеры.";
    }
  }

  function persistTasks() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        version: 3,
        tasks,
        deletedIds: [...deletedIds]
      }));

      storageWarning = "";
      return true;
    } catch {
      storageWarning =
        "Изменения действуют до перезагрузки: сохранение недоступно.";

      return false;
    }
  }

  async function request(path) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 15000);

    try {
      const response = await fetch(API + path, {
        signal: controller.signal
      });

      if (!response.ok) {
        throw new Error("Сервер вернул HTTP " + response.status);
      }

      return await response.json();
    } finally {
      clearTimeout(timer);
    }
  }

  async function getUsers() {
    if (!users.size) {
      const data = await request(
        "/users?limit=0&select=id,firstName,lastName,username"
      );

      if (
        !Array.isArray(data.users) ||
        !data.users.length ||
        !data.users.every(user =>
          user &&
          Number.isInteger(user.id) &&
          user.id > 0 &&
          typeof user.firstName === "string" &&
          typeof user.lastName === "string" &&
          typeof user.username === "string"
        )
      ) {
        throw new Error("Не удалось получить список пользователей");
      }

      for (const user of data.users) {
        users.set(user.id, user);
      }
    }

    return [...users.values()].map(user => ({ ...user }));
  }

  async function getUser(id) {
    if (!Number.isInteger(id) || id <= 0) {
      throw new Error("Некорректный userId");
    }

    if (!profiles.has(id)) {
      const user = await request("/users/" + id);

      if (user.id !== id) {
        throw new Error("ID профиля не совпадает");
      }

      profiles.set(id, user);
    }

    return profiles.get(id);
  }

  function getTasks() {
    return tasks.map(task => ({ ...task }));
  }

  function updateTask(id, fields) {
    const index = tasks.findIndex(task => task.id === id);

    if (index < 0) {
      throw new Error("Задание уже удалено.");
    }

    if (typeof fields.title !== "string") {
      throw new Error("Введите название задания.");
    }

    const title = fields.title.trim();

    if (!title || title.length > 200) {
      throw new Error(
        "Название должно содержать от 1 до 200 символов."
      );
    }

    if (
      !Number.isInteger(fields.userId) ||
      !users.has(fields.userId)
    ) {
      throw new Error("Выберите существующего исполнителя.");
    }

    if (typeof fields.completed !== "boolean") {
      throw new Error("Некорректный статус задания.");
    }

    tasks[index] = {
      ...tasks[index],
      title,
      userId: fields.userId,
      completed: fields.completed
    };

    const saved = persistTasks();

    return {
      task: { ...tasks[index] },
      saved,
      warning: storageWarning
    };
  }

  function deleteTask(id) {
    const index = tasks.findIndex(task => task.id === id);

    if (index < 0) {
      throw new Error("Задание уже удалено.");
    }

    const [task] = tasks.splice(index, 1);

    if (SEED_TASKS.some(seed => seed.id === id)) {
      deletedIds.add(id);
    }

    const saved = persistTasks();

    return {
      task: { ...task },
      saved,
      warning: storageWarning
    };
  }

  loadStoredTasks();

  // Публичные методы для app.js.
  window.StudyHubTaskData = Object.freeze({
    getUsers,
    getUser,
    getTasks,
    updateTask,
    deleteTask,

    getStorageWarning() {
      return storageWarning;
    }
  });
})();