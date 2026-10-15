(() => {
  "use strict";

  const $ = selector => document.querySelector(selector);
  const store = window.StudyHubTaskData;

  if (!store) {
    $("#task-message").textContent =
      "Не загружен data.js. Подключите его перед app.js.";
    return;
  }

  const list = $("#task-list");
  const profile = $("#task-profile");
  const editDialog = $("#edit-dialog");
  const deleteDialog = $("#delete-dialog");
  const addButton = $("#add-task");

  const users = new Map();

  const alphabet = new Intl.Collator(["kk", "ru", "en"], {
    sensitivity: "base",
    numeric: true
  });

  let tasks = store.getTasks();
  let editingId = null;
  let deletingId = null;
  let activeProfileButton = null;
  let profileVersion = 0;
  let toastTimer;
  let busy = false;
  let loading = false;

  const icons = {
    edit:
      '<path d="m16 3 5 5-12 12-6 1 1-6L16 3Z"/>' +
      '<path d="m14 5 5 5"/>',

    trash:
      '<path d="M3 6h18M9 6V3h6v3M5 6l1 15h12l1-15M10 10v7M14 10v7"/>',

    close:
      '<path d="m6 6 12 12M6 18 18 6"/>'
  };

  function icon(name) {
    return `
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="1.7"
        stroke-linecap="round"
        stroke-linejoin="round"
        aria-hidden="true"
      >
        ${icons[name]}
      </svg>
    `;
  }

  function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, symbol => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    })[symbol]);
  }

  function userName(id) {
    const user = users.get(id);

    return user
      ? `${user.firstName} ${user.lastName} (@${user.username})`
      : `Пользователь #${id}`;
  }

  function initials(id) {
    const user = users.get(id);

    if (!user) return "?";

    return (
      (user.firstName?.[0] ?? "") +
      (user.lastName?.[0] ?? "")
    ).toUpperCase();
  }

  function titleForSort(title) {
    return title.normalize("NFC").trim();
  }

  function sortTasks(items) {
    const order = $("#task-order").value;
    const byUser = order.startsWith("user-");
    const direction = order.endsWith("desc") ? -1 : 1;

    return [...items].sort((a, b) => {
      const byTitle = alphabet.compare(
        titleForSort(a.title),
        titleForSort(b.title)
      );

      if (byUser) {
        return direction * alphabet.compare(userName(a.userId), userName(b.userId))
          || byTitle || a.id - b.id;
      }

      return direction * byTitle || a.id - b.id;
    });
  }

  function visibleTasks() {
    const query = $("#task-search").value
      .trim()
      .normalize("NFC")
      .toLowerCase();

    const userId = $("#task-user-filter").value;

    return sortTasks(tasks.filter(task => {
      const matchesQuery = [task.title, userName(task.userId)].some(value =>
        value.normalize("NFC").toLowerCase().includes(query)
      );

      const matchesUser =
        userId === "" || task.userId === Number(userId);

      return matchesQuery && matchesUser;
    }));
  }

  function badge(task) {
    return `
      <span class="task-badge ${task.completed ? "completed" : ""}">
        ${task.completed ? "Выполнено" : "В работе"}
      </span>
    `;
  }

  function actions(task) {
    const id = escapeHTML(task.id);
    const title = escapeHTML(task.title);

    return `
      <div class="card-actions">
        <button
          class="icon-button"
          type="button"
          data-action="edit"
          data-id="${id}"
          aria-label="Изменить: ${title}"
          title="Изменить задачу"
          aria-haspopup="dialog"
          ${users.size ? "" : "disabled"}
        >
          ${icon("edit")}
        </button>

        <button
          class="icon-button danger-icon"
          type="button"
          data-action="delete"
          data-id="${id}"
          aria-label="Удалить: ${title}"
          title="Удалить задачу"
          aria-haspopup="dialog"
        >
          ${icon("trash")}
        </button>
      </div>
    `;
  }

  function closeProfile(restoreFocus = false) {
    profileVersion++;
    profile.hidden = true;
    profile.setAttribute("aria-busy", "false");

    activeProfileButton?.setAttribute("aria-expanded", "false");

    if (restoreFocus && activeProfileButton?.isConnected) {
      activeProfileButton.focus();
    }

    activeProfileButton = null;
  }

  function updateUserFilter() {
    const select = $("#task-user-filter");
    const previous = select.value;

    const ids = [...new Set(tasks.map(task => task.userId))]
      .sort((a, b) => alphabet.compare(userName(a), userName(b)));

    select.replaceChildren(new Option("Все исполнители", ""));

    for (const id of ids) {
      select.append(new Option(userName(id), id));
    }

    select.value = ids.includes(Number(previous)) ? previous : "";
  }

  function renderTasks() {
    tasks = store.getTasks();

    closeProfile();

    // Переносим профиль перед очисткой сетки, чтобы не удалить его.
    $(".content").append(profile);

    updateUserFilter();

    const visible = visibleTasks();

    $("#task-count").textContent =
      `${visible.length} / ${tasks.length}`;

    list.innerHTML = visible.map(task => `
      <article
        class="product-card task-card"
        data-task-id="${escapeHTML(task.id)}"
      >
        <div class="task-card-top">
          ${badge(task)}
          ${actions(task)}
        </div>

        <h3>${escapeHTML(task.title)}</h3>

        <footer class="task-author">
          <span class="author-initials" aria-hidden="true">
            ${escapeHTML(initials(task.userId))}
          </span>

          <div class="author-info">
            <small>
              Исполнитель
            </small>

            <button
              class="author-button"
              type="button"
              data-action="profile"
              data-user-id="${task.userId}"
              aria-controls="task-profile"
              aria-expanded="false"
            >
              ${escapeHTML(userName(task.userId))}
            </button>
          </div>
        </footer>
      </article>
    `).join("");

    if (!visible.length) {
      list.innerHTML = `
        <p class="empty-state">
          По выбранным условиям задач нет.
        </p>
      `;
    }

    $("#task-message").textContent =
      "Нажми на имя исполнителя, чтобы посмотреть профиль и его задачи.";
  }

  function notify(message, warning = false) {
    clearTimeout(toastTimer);

    const host = $("#notifications");
    const toast = document.createElement("div");

    toast.className = "toast" + (warning ? " error" : "");
    toast.setAttribute("role", warning ? "alert" : "status");

    const text = document.createElement("p");
    text.textContent = message;

    const close = document.createElement("button");
    close.type = "button";
    close.className = "icon-button";
    close.setAttribute("aria-label", "Закрыть уведомление");
    close.innerHTML = icon("close");

    close.addEventListener("click", () => toast.remove());

    toast.append(text, close);
    host.replaceChildren(toast);

    toastTimer = setTimeout(
      () => toast.remove(),
      warning ? 10000 : 5000
    );
  }

  function focusTask(id, scroll = false) {
    const card = [...list.querySelectorAll(".task-card")]
      .find(node => Number(node.dataset.taskId) === id);

    const target =
      card?.querySelector("button:not(:disabled)") ||
      $("#task-search");

    target.focus({ preventScroll: true });
    if (scroll && card) card.scrollIntoView({ block: "nearest" });
  }

  function renderProfile(user) {
    const related = sortTasks(
      tasks.filter(task => task.userId === user.id)
    );

    const completed = related.filter(task => task.completed).length;

    const details = [
      ["Возраст", user.age],
      ["Email", user.email],
      ["Телефон", user.phone],
      ["Город", user.address?.city],
      ["Университет", user.university],
      ["Компания", user.company?.name]
    ];

    $("#profile-content").innerHTML = `
      <div class="profile-person">
        <p class="eyebrow">ПРОФИЛЬ ПОЛЬЗОВАТЕЛЯ</p>

        <img class="profile-photo" alt="" hidden>

        <h3>
          ${escapeHTML(user.firstName)}
          ${escapeHTML(user.lastName)}
        </h3>

        <p class="profile-muted">
          @${escapeHTML(user.username)} · userId: ${user.id}
        </p>

        <dl class="profile-details">
          ${details.map(([label, value]) => `
            <dt>${label}</dt>
            <dd>${escapeHTML(value ?? "—")}</dd>
          `).join("")}
        </dl>
      </div>

      <div class="profile-history">
        <p class="eyebrow">ЗАДАЧИ ПОЛЬЗОВАТЕЛЯ</p>
        <h3>Все задачи исполнителя</h3>

        <p class="profile-muted">
          Всего: ${related.length}
          · Выполнено: ${completed}
          · В работе: ${related.length - completed}
        </p>

        <ul class="profile-history-list">
          ${related.map(task => `
            <li class="profile-history-item">
              <p>${escapeHTML(task.title)}</p>

              <div class="profile-history-footer">
                ${badge(task)}
                ${actions(task)}
              </div>
            </li>
          `).join("")}
        </ul>
      </div>
    `;

    const image = profile.querySelector(".profile-photo");

    if (
      typeof user.image === "string" &&
      user.image.startsWith("https://")
    ) {
      image.alt = `${user.firstName} ${user.lastName}`;

      image.addEventListener("error", () => {
        image.hidden = true;
      }, { once: true });

      image.src = user.image;
      image.hidden = false;
    }
  }

  async function openProfile(id, button) {
    if (activeProfileButton === button && !profile.hidden) {
      closeProfile(true);
      return;
    }

    closeProfile();

    const version = ++profileVersion;
    activeProfileButton = button;

    button.setAttribute("aria-expanded", "true");
    button.closest(".task-card").after(profile);

    profile.hidden = false;
    profile.setAttribute("aria-busy", "true");

    $("#profile-content").innerHTML = `
      <p class="profile-loading">Загрузка профиля…</p>
    `;

    try {
      const user = await store.getUser(id);

      // Старый ответ не должен открывать уже закрытый профиль.
      if (version !== profileVersion) return;

      renderProfile(user);
      profile.scrollIntoView({ block: "nearest" });
    } catch {
      if (version !== profileVersion) return;

      const wrapper = document.createElement("div");
      wrapper.className = "profile-loading";

      const text = document.createElement("p");
      text.textContent = "Не удалось загрузить профиль.";

      const retry = document.createElement("button");
      retry.type = "button";
      retry.className = "btn-secondary";
      retry.textContent = "Повторить";

      retry.addEventListener("click", () => {
        closeProfile();
        openProfile(id, button);
      });

      wrapper.append(text, retry);
      $("#profile-content").replaceChildren(wrapper);
    } finally {
      if (version === profileVersion) {
        profile.setAttribute("aria-busy", "false");
      }
    }
  }

  function openModal(dialog) {
    if (!dialog.open) dialog.showModal();
    document.body.classList.add("modal-open");
  }

  function setDialogBusy(dialog, value) {
    busy = value;
    dialog.setAttribute("aria-busy", String(value));
    dialog.querySelectorAll("button, input, select").forEach(control => {
      control.disabled = value;
    });
  }

  function errorMessage(error) {
    return error instanceof TypeError
      ? "Нет соединения с API. Проверь интернет и повтори попытку."
      : error.message;
  }

  function openEditor(id = null) {
    const task = tasks.find(item => item.id === id);
    if (busy || loading || !users.size || (id !== null && !task)) return;

    editingId = id;

    $("#edit-title").textContent = task ? "Изменить задачу" : "Добавить задачу";
    $("#save-task").textContent = task ? "Сохранить изменения" : "Добавить";
    $("#edit-name").value = task?.title ?? "";
    $("#edit-completed").checked = task?.completed ?? false;
    $("#edit-error").textContent = "";

    const sortedUsers = [...users.values()].sort((a, b) =>
      alphabet.compare(userName(a.id), userName(b.id))
    );

    $("#edit-user").replaceChildren(
      new Option("Выберите исполнителя", ""),
      ...sortedUsers.map(user =>
        new Option(userName(user.id), user.id)
      )
    );

    const selectedUserId = task?.userId || Number($("#task-user-filter").value) ||
      Number(activeProfileButton?.dataset.userId);
    $("#edit-user").value = users.has(selectedUserId) ? String(selectedUserId) : "";

    openModal(editDialog);
  }

  function confirmDeletion(id) {
    const task = tasks.find(item => item.id === id);
    if (!task) return;

    deletingId = id;
    $("#delete-name").textContent = task.title;
    $("#delete-error").textContent = "";

    openModal(deleteDialog);
  }

  // Закрытие окон кнопками, Escape и нажатием на затемнение.
  document.querySelectorAll("dialog").forEach(dialog => {
    dialog.querySelectorAll("[data-close]").forEach(button => {
      if (button.classList.contains("close-button")) {
        button.innerHTML = icon("close");
      }

      button.addEventListener("click", () => {
        if (!busy) dialog.close();
      });
    });

    dialog.addEventListener("cancel", event => {
      if (busy) event.preventDefault();
    });

    dialog.addEventListener("click", event => {
      if (busy || event.target !== dialog) return;

      const rect = dialog.getBoundingClientRect();

      if (
        event.clientX < rect.left ||
        event.clientX > rect.right ||
        event.clientY < rect.top ||
        event.clientY > rect.bottom
      ) {
        dialog.close();
      }
    });

    dialog.addEventListener("close", () => {
      if (!document.querySelector("dialog[open]")) {
        document.body.classList.remove("modal-open");
      }
    });
  });

  editDialog.addEventListener("close", () => {
    editingId = null;
  });

  deleteDialog.addEventListener("close", () => {
    deletingId = null;
  });

  // Обрабатывает кнопки и на карточках, и внутри раскрытого профиля.
  list.addEventListener("click", event => {
    if (busy || loading) return;
    const button = event.target.closest("button[data-action]");
    if (!button || !list.contains(button)) return;

    const action = button.dataset.action;

    if (action === "profile") {
      openProfile(Number(button.dataset.userId), button);
    } else if (action === "edit") {
      openEditor(Number(button.dataset.id));
    } else if (action === "delete") {
      confirmDeletion(Number(button.dataset.id));
    }
  });

  $("#edit-form").addEventListener("submit", async event => {
    event.preventDefault();

    if (busy || !editDialog.open || !event.currentTarget.reportValidity()) return;

    $("#edit-error").textContent = "";
    setDialogBusy(editDialog, true);

    try {
      const isNew = editingId === null;
      let id = editingId;

      const fields = {
        title: $("#edit-name").value,
        userId: Number($("#edit-user").value),
        completed: $("#edit-completed").checked
      };

      if (isNew) {
        id = (await store.addTask(fields)).id;
      } else {
        await store.updateTask(id, fields);
      }

      tasks = store.getTasks();
      const resetFilters = isNew && !visibleTasks().some(task => task.id === id);
      if (resetFilters) {
        $("#task-search").value = "";
        $("#task-user-filter").value = "";
      }

      setDialogBusy(editDialog, false);
      editDialog.close();
      renderTasks();

      let message = isNew
        ? "Задача добавлена до перезагрузки страницы"
        : "Задача изменена до перезагрузки страницы";

      if (resetFilters) {
        message += ". Фильтры сброшены, чтобы показать новую задачу";
      } else if (!visibleTasks().some(task => task.id === id)) {
        message += ". Задача скрыта текущими фильтрами";
      }

      notify(message);
      focusTask(id, isNew);
    } catch (error) {
      $("#edit-error").textContent = errorMessage(error);
    } finally {
      setDialogBusy(editDialog, false);
    }
  });

  $("#confirm-delete").addEventListener("click", async () => {
    if (busy || !deletingId) return;

    $("#delete-error").textContent = "";
    setDialogBusy(deleteDialog, true);

    try {
      const visible = visibleTasks();
      const position = visible.findIndex(task => task.id === deletingId);

      const nextId = (
        visible[position + 1] || visible[position - 1]
      )?.id;

      await store.deleteTask(deletingId);

      setDialogBusy(deleteDialog, false);
      deleteDialog.close();
      renderTasks();

      notify("Задача удалена до перезагрузки страницы");

      focusTask(nextId);
    } catch (error) {
      $("#delete-error").textContent = errorMessage(error);
    } finally {
      setDialogBusy(deleteDialog, false);
    }
  });

  $("#close-profile").innerHTML = icon("close");
  $("#delete-symbol").innerHTML = icon("trash");

  $("#close-profile").addEventListener("click", () => {
    closeProfile(true);
  });

  profile.addEventListener("keydown", event => {
    if (event.key === "Escape") closeProfile(true);
  });

  $("#task-search").addEventListener("input", renderTasks);
  $("#task-order").addEventListener("change", renderTasks);
  $("#task-user-filter").addEventListener("change", renderTasks);
  addButton.addEventListener("click", () => openEditor());

  $("#reset-filters").addEventListener("click", () => {
    $("#task-search").value = "";
    $("#task-order").value = "asc";
    $("#task-user-filter").value = "";

    renderTasks();
    $("#task-search").focus();
  });

  async function loadData() {
    if (loading) return;
    loading = true;
    addButton.disabled = true;
    $("#retry-data").hidden = true;
    list.setAttribute("aria-busy", "true");
    document.querySelectorAll(".task-filters input, .task-filters select, .task-filters button")
      .forEach(control => { control.disabled = true; });
    $("#task-message").textContent =
      "Загрузка задач и пользователей DummyJSON…";
    $("#task-count").textContent = "…";
    const status = document.createElement("p");
    status.className = "empty-state";
    status.textContent = "Загружаем задачи и исполнителей…";
    list.replaceChildren(status);

    try {
      await store.load();

      users.clear();

      for (const user of store.getUsers()) {
        users.set(user.id, user);
      }

      renderTasks();
      addButton.disabled = !users.size;
      document.querySelectorAll(".task-filters input, .task-filters select, .task-filters button")
        .forEach(control => { control.disabled = false; });
    } catch (error) {
      status.textContent = "Не удалось загрузить задачи и пользователей.";
      $("#task-count").textContent = "—";
      $("#task-message").textContent =
        errorMessage(error);
      $("#retry-data").hidden = false;
    } finally {
      loading = false;
      list.setAttribute("aria-busy", "false");
    }
  }

  $("#retry-data").addEventListener("click", loadData);

  loadData();
})();
