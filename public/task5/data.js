(() => {
  "use strict";

  const API = "https://dummyjson.com";
  const users = new Map();
  const profiles = new Map();
  const localTaskIds = new Set();
  let tasks = [];
  let nextLocalId = -1;

  function validUser(user) {
    return user && Number.isInteger(user.id) && user.id > 0 &&
      typeof user.firstName === "string" &&
      typeof user.lastName === "string" &&
      typeof user.username === "string";
  }

  function validTodo(todo) {
    return todo && Number.isInteger(todo.id) && todo.id > 0 &&
      typeof todo.todo === "string" && todo.todo.trim().length > 0 &&
      Number.isInteger(todo.userId) && todo.userId > 0 &&
      typeof todo.completed === "boolean";
  }

  function validList(items, validate) {
    return Array.isArray(items) && items.every(validate) &&
      new Set(items.map(item => item.id)).size === items.length;
  }

  function toTask(todo) {
    return {
      id: todo.id,
      title: todo.todo,
      userId: todo.userId,
      completed: todo.completed
    };
  }

  async function request(path, method = "GET", body) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 15000);
    const options = { method, signal: controller.signal };

    if (body !== undefined) {
      options.headers = { "Content-Type": "application/json" };
      options.body = JSON.stringify(body);
    }

    try {
      const response = await fetch(API + path, options);
      if (!response.ok) {
        throw new Error("Сервер вернул HTTP " + response.status);
      }
      return await response.json();
    } catch (error) {
      if (error.name === "AbortError") {
        throw new Error("Сервер не ответил вовремя. Повторите попытку.");
      }
      throw error;
    } finally {
      clearTimeout(timer);
    }
  }

  async function load() {
    // Получаем все страницы, чтобы фильтр и профиль учитывали все задачи.
    const [todoData, userData] = await Promise.all([
      request("/todos?limit=0"),
      request("/users?limit=0&select=id,firstName,lastName,username")
    ]);

    if (!validList(todoData?.todos, validTodo) ||
        !validList(userData?.users, validUser)) {
      throw new Error("API вернул некорректные задачи или пользователей.");
    }

    const loadedUsers = new Map(userData.users.map(user => [user.id, user]));
    if (todoData.todos.some(todo => !loadedUsers.has(todo.userId))) {
      throw new Error("Для одной из задач не найден пользователь.");
    }

    // Заменяем данные только после успешной загрузки обоих списков.
    users.clear();
    for (const [id, user] of loadedUsers) users.set(id, user);
    profiles.clear();
    tasks = todoData.todos.map(toTask);
    localTaskIds.clear();
    nextLocalId = -1;
  }

  function getUsers() {
    return [...users.values()].map(user => ({ ...user }));
  }

  async function getUser(id) {
    if (!users.has(id)) throw new Error("Пользователь не найден.");

    if (!profiles.has(id)) {
      const user = await request("/users/" + id);
      if (!validUser(user) || user.id !== id) {
        throw new Error("Не удалось получить профиль пользователя.");
      }
      profiles.set(id, user);
    }

    return profiles.get(id);
  }

  function getTasks() {
    return tasks.map(task => ({ ...task }));
  }

  function taskBody(fields) {
    const title = typeof fields.title === "string" ? fields.title.trim() : "";
    if (!title || title.length > 200) {
      throw new Error("Название должно содержать от 1 до 200 символов.");
    }
    if (!users.has(fields.userId)) {
      throw new Error("Выберите существующего исполнителя.");
    }
    if (typeof fields.completed !== "boolean") {
      throw new Error("Некорректный статус задачи.");
    }

    return {
      todo: title,
      userId: fields.userId,
      completed: fields.completed
    };
  }

  async function addTask(fields) {
    const response = await request("/todos/add", "POST", taskBody(fields));
    const created = { ...response, id: Number(response?.id) };
    if (!validTodo(created) || !users.has(created.userId)) {
      throw new Error("API вернул некорректную задачу.");
    }

    // POST не сохраняет задачу и может повторно вернуть тот же ID.
    // Отрицательные ID уникальны в этой вкладке и не отправляются в API.
    const task = { ...toTask(created), id: nextLocalId-- };
    localTaskIds.add(task.id);
    tasks.push(task);
    return { ...task };
  }

  async function updateTask(id, fields) {
    const index = tasks.findIndex(task => task.id === id);
    if (index < 0) throw new Error("Задача уже удалена.");
    const body = taskBody(fields);

    // Созданной через POST задачи на сервере нет: редактируем её в памяти.
    if (localTaskIds.has(id)) {
      tasks[index] = toTask({ id, ...body });
      return { ...tasks[index] };
    }

    const response = await request("/todos/" + id, "PATCH", body);
    const updated = { ...response, id: Number(response?.id) };
    if (!validTodo(updated) || updated.id !== id || !users.has(updated.userId)) {
      throw new Error("API вернул некорректную задачу.");
    }

    // DummyJSON имитирует запись: результат хранится в текущей вкладке.
    tasks[index] = toTask(updated);
    return { ...tasks[index] };
  }

  async function deleteTask(id) {
    if (!tasks.some(task => task.id === id)) {
      throw new Error("Задача уже удалена.");
    }

    if (!localTaskIds.has(id)) {
      const deleted = await request("/todos/" + id, "DELETE");
      if (Number(deleted?.id) !== id || deleted?.isDeleted !== true) {
        throw new Error("API не подтвердил удаление задачи.");
      }
    }
    tasks = tasks.filter(task => task.id !== id);
    localTaskIds.delete(id);
  }

  window.StudyHubTaskData = Object.freeze({
    load,
    getUsers,
    getUser,
    getTasks,
    addTask,
    updateTask,
    deleteTask
  });
})();
