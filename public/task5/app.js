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
    return title.normalize("NFC").replace(
      /^\s*\d+\s*[-–—.)]?\s*(?:тапсырма|задание)\s*[.:—–-]?\s*/iu,
      ""
    ).trim();
  }

  function sortTasks(items) {
    const direction = $("#task-order").value === "desc" ? -1 : 1;

    return [...items].sort((a, b) =>
      direction * alphabet.compare(
        titleForSort(a.title),
        titleForSort(b.title)
      ) || alphabet.compare(a.id, b.id)
    );
  }

  function visibleTasks() {
    const query = $("#task-search").value
      .trim()
      .normalize("NFC")
      .toLowerCase();

    const userId = $("#task-user-filter").value;

    return sortTasks(tasks.filter(task => {
      const matchesTitle = task.title
        .normalize("NFC")
        .toLowerCase()
        .includes(query);

      const matchesUser =
        userId === "" || task.userId === Number(userId);

      return matchesTitle && matchesUser;
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
          title="Изменить задание"
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
          title="Удалить задание"
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
              ${task.completed ? "Выполнил" : "Исполнитель"}
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
          По выбранным условиям заданий нет.
        </p>
      `;
    }

    $("#task-message").textContent =
      store.getStorageWarning() ||
      "Нажми на имя исполнителя, чтобы посмотреть профиль и его задания.";
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

  function focusTask(id) {
    const card = [...list.querySelectorAll(".task-card")]
      .find(node => node.dataset.taskId === id);

    const target =
      card?.querySelector("button:not(:disabled)") ||
      $("#task-search");

    target.focus({ preventScroll: true });
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
        <p class="eyebrow">УЧЕБНЫЕ РАБОТЫ</p>
        <h3>Задания пользователя</h3>

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

  function openEditor(id) {
    const task = tasks.find(item => item.id === id);
    if (!task || !users.size) return;

    editingId = id;

    $("#edit-name").value = task.title;
    $("#edit-completed").checked = task.completed;
    $("#edit-error").textContent = "";

    const sortedUsers = [...users.values()].sort((a, b) =>
      alphabet.compare(userName(a.id), userName(b.id))
    );

    $("#edit-user").replaceChildren(
      ...sortedUsers.map(user =>
        new Option(userName(user.id), user.id)
      )
    );

    $("#edit-user").value = String(task.userId);

    openModal(editDialog);
  }

  function confirmDeletion(id) {
    const task = tasks.find(item => item.id === id);
    if (!task) return;

    deletingId = id;
    $("#delete-name").textContent = task.title;

    openModal(deleteDialog);
  }

  // Закрытие окон кнопками, Escape и нажатием на затемнение.
  document.querySelectorAll("dialog").forEach(dialog => {
    dialog.querySelectorAll("[data-close]").forEach(button => {
      if (button.classList.contains("close-button")) {
        button.innerHTML = icon("close");
      }

      button.addEventListener("click", () => dialog.close());
    });

    dialog.addEventListener("click", event => {
      if (event.target !== dialog) return;

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
    const button = event.target.closest("button[data-action]");
    if (!button || !list.contains(button)) return;

    const action = button.dataset.action;

    if (action === "profile") {
      openProfile(Number(button.dataset.userId), button);
    } else if (action === "edit") {
      openEditor(button.dataset.id);
    } else if (action === "delete") {
      confirmDeletion(button.dataset.id);
    }
  });

  $("#edit-form").addEventListener("submit", event => {
    event.preventDefault();

    if (!editingId || !event.currentTarget.reportValidity()) return;

    try {
      const id = editingId;

      const result = store.updateTask(id, {
        title: $("#edit-name").value,
        userId: Number($("#edit-user").value),
        completed: $("#edit-completed").checked
      });

      editDialog.close();
      renderTasks();

      let message = "Изменения сохранены";

      if (!visibleTasks().some(task => task.id === id)) {
        message += ". Задание скрыто текущими фильтрами";
      }

      if (!result.saved) {
        message = "Задание изменено. " + result.warning;
      }

      notify(message, !result.saved);
      focusTask(id);
    } catch (error) {
      $("#edit-error").textContent = error.message;
    }
  });

  $("#confirm-delete").addEventListener("click", () => {
    if (!deletingId) return;

    try {
      const visible = visibleTasks();
      const position = visible.findIndex(task => task.id === deletingId);

      const nextId = (
        visible[position + 1] || visible[position - 1]
      )?.id;

      const result = store.deleteTask(deletingId);

      deleteDialog.close();
      renderTasks();

      notify(
        "Задание удалено" + (
          result.saved ? "" : ". " + result.warning
        ),
        !result.saved
      );

      focusTask(nextId);
    } catch (error) {
      deleteDialog.close();
      notify(error.message, true);
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

  $("#reset-filters").addEventListener("click", () => {
    $("#task-search").value = "";
    $("#task-order").value = "asc";
    $("#task-user-filter").value = "";

    renderTasks();
    $("#task-search").focus();
  });

  async function loadUsers() {
    $("#retry-users").hidden = true;
    $("#task-message").textContent =
      "Загрузка пользователей DummyJSON…";

    try {
      const loadedUsers = await store.getUsers();

      users.clear();

      for (const user of loadedUsers) {
        users.set(user.id, user);
      }

      renderTasks();
    } catch {
      renderTasks();

      $("#task-message").textContent =
        "Не удалось загрузить пользователей. Проверь интернет и повтори.";

      $("#retry-users").hidden = false;
    }
  }

  $("#retry-users").addEventListener("click", loadUsers);

  renderTasks();
  loadUsers();
})();