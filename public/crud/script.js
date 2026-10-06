const API = "https://dummyjson.com/products";
const list = document.getElementById("products");
const count = document.getElementById("product-count");
const loadButton = document.getElementById("load-button");
const addButton = document.getElementById("add-button");
const form = document.getElementById("product-form");
const saveButton = document.getElementById("save-button");
const productDialog = document.getElementById("product-dialog");
const formDialog = document.getElementById("form-dialog");
const deleteDialog = document.getElementById("delete-dialog");

const fields = {
  title: document.getElementById("product-title"),
  price: document.getElementById("product-price"),
  category: document.getElementById("product-category"),
  description: document.getElementById("product-description"),
  tags: document.getElementById("product-tags"),
  thumbnail: document.getElementById("product-image")
};

let products = [];
let editingKey = null;
let selectedKey = null;
let pendingDeleteKey = null;
let nextLocalId = 1;
let busy = false;
let hasLoaded = false;

// SVG заданы в коде. Данные API вставляем только через textContent.
const icons = {
  edit: '<path d="m16 3 5 5-12 12-6 1 1-6L16 3Z"/><path d="m14 5 5 5"/>',
  trash: '<path d="M3 6h18M9 6V3h6v3M5 6l1 15h12l1-15M10 10v7M14 10v7"/>',
  close: '<path d="m6 6 12 12M6 18 18 6"/>',
  image: '<rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="8" cy="8" r="1.5"/><path d="m3 17 5-5 4 4 4-6 5 7"/>'
};

function icon(name) {
  const span = document.createElement("span");
  span.setAttribute("aria-hidden", "true");
  span.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">' + icons[name] + '</svg>';
  return span;
}

function element(tag, className, text) {
  const node = document.createElement(tag);
  node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function money(value) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value);
}

function ratingText(product) {
  return Number.isFinite(product.rating) ? "★ " + product.rating.toFixed(1) + " / 5" : "Нет оценок";
}

// Не используем произвольные схемы URL для изображений.
function imageUrl(value) {
  try {
    const url = new URL(value);
    return ["https:", "http:"].includes(url.protocol) ? url.href : "";
  } catch {
    return "";
  }
}

function productImage(product) {
  const placeholder = element("span", "image-placeholder");
  placeholder.append(icon("image"), element("span", "", "Нет фотографии"));
  const source = imageUrl(product.thumbnail || product.images?.[0]);
  if (!source) return placeholder;

  const image = document.createElement("img");
  image.src = source;
  image.alt = product.title;
  image.loading = "lazy";
  image.addEventListener("error", () => image.replaceWith(placeholder), { once: true });
  return image;
}

// Уведомление показываем внутри верхнего dialog, если он открыт.
function notify(message, type = "success") {
  const openDialogs = [...document.querySelectorAll("dialog[open]")];
  const host = openDialogs.at(-1)?.querySelector(".toast-region")
    || document.getElementById("notifications");
  const toast = element("div", "toast " + (type === "error" ? "error" : ""));
  toast.setAttribute("role", type === "error" ? "alert" : "status");
  const close = element("button", "icon-button toast-close");
  close.type = "button";
  close.setAttribute("aria-label", "Закрыть уведомление");
  close.append(icon("close"));
  close.addEventListener("click", () => toast.remove());
  toast.append(element("p", "", message), close);
  host.append(toast);
  if (host.children.length > 3) host.firstElementChild.remove();
  setTimeout(() => toast.remove(), type === "error" ? 9000 : 5000);
}

async function request(path, method = "GET", body) {
  const options = { method, signal: AbortSignal.timeout(15000) };
  if (body !== undefined) {
    options.headers = { "Content-Type": "application/json" };
    options.body = JSON.stringify(body);
  }
  const response = await fetch(API + path, options);
  if (!response.ok) throw new Error("Сервер вернул HTTP " + response.status);
  return response.json();
}

function setBusy(value) {
  busy = value;
  document.getElementById("form-fields").disabled = value;
  list.setAttribute("aria-busy", String(value));
  document.querySelectorAll("button:not(.toast-close)").forEach(button => {
    button.disabled = value;
  });
}

async function run(action) {
  if (busy) return;
  setBusy(true);
  try {
    await action();
  } catch (error) {
    const message = error.name === "TimeoutError"
      ? "Сервер не ответил вовремя. Попробуйте ещё раз."
      : error instanceof TypeError
        ? "Нет соединения с API. Проверьте интернет и повторите попытку."
        : error.message;
    notify(message, "error");
    if (!hasLoaded && products.length === 0) renderProducts();
  } finally {
    setBusy(false);
  }
}

function openModal(dialog) {
  // Старые уведомления не должны оставаться под новым окном.
  document.querySelectorAll(".toast").forEach(toast => toast.remove());
  if (!dialog.open) dialog.showModal();
  document.body.classList.add("modal-open");
}

function focusCard(key) {
  const card = [...list.children].find(item => item.dataset.key === key);
  (card?.querySelector(".card-open") || addButton).focus();
}

// Escape, крестик и клик по затемнению закрывают окно.
document.querySelectorAll("dialog").forEach(dialog => {
  dialog.addEventListener("cancel", event => {
    if (busy) event.preventDefault();
  });
  dialog.addEventListener("click", event => {
    if (busy || event.target !== dialog) return;
    const rect = dialog.getBoundingClientRect();
    if (event.clientX < rect.left || event.clientX > rect.right
      || event.clientY < rect.top || event.clientY > rect.bottom) dialog.close();
  });
  dialog.addEventListener("close", () => {
    dialog.querySelector(".toast-region").replaceChildren();
    if (!document.querySelector("dialog[open]")) {
      document.body.classList.remove("modal-open");
      if (document.activeElement === document.body) focusCard(selectedKey);
    }
  });
  dialog.querySelectorAll("[data-close]").forEach(button => {
    button.append(icon("close"));
    button.addEventListener("click", () => { if (!busy) dialog.close(); });
  });
});

function actionButton(action, product, iconName, label) {
  const button = element("button", "icon-button" + (action === "delete" ? " danger-icon" : ""));
  button.type = "button";
  button.dataset.action = action;
  button.setAttribute("aria-label", label + ": " + product.title);
  button.title = label;
  button.append(icon(iconName));
  return button;
}

function renderProducts() {
  list.replaceChildren();
  count.textContent = products.length;
  if (!products.length) {
    list.append(element("p", "empty-state", hasLoaded
      ? "Пока нет товаров. Добавьте первый товар."
      : "Каталог пока не загружен. Нажмите «Обновить каталог»."));
    return;
  }

  products.forEach(product => {
    const card = element("article", "product-card");
    card.dataset.key = product.key;

    // Настоящая кнопка позволяет открыть карточку клавишами Enter и Space.
    const open = element("button", "card-open");
    open.type = "button";
    open.dataset.action = "open";
    open.setAttribute("aria-label", "Подробнее: " + product.title);
    const photo = element("span", "card-image");
    photo.append(productImage(product));
    const info = element("span", "card-info");
    info.append(
      element("span", "card-category", product.category || "Без категории"),
      element("span", "card-title", product.title),
      element("span", "rating", ratingText(product))
    );
    open.append(photo, info);

    const actions = element("div", "card-actions");
    actions.append(
      actionButton("edit", product, "edit", "Изменить товар"),
      actionButton("delete", product, "trash", "Удалить товар")
    );
    const footer = element("div", "card-footer");
    footer.append(element("span", "card-price", money(product.price)), actions);
    card.append(open, footer);
    list.append(card);
  });
}

function fillDetails(product) {
  document.getElementById("detail-image").replaceChildren(productImage(product));
  document.getElementById("detail-title").textContent = product.title;
  document.getElementById("detail-category").textContent = "Категория: " + (product.category || "Не указана");
  document.getElementById("detail-price").textContent = money(product.price);
  document.getElementById("detail-rating").textContent = "Рейтинг: " + ratingText(product);
  document.getElementById("detail-description").textContent = product.description || "Описание пока не добавлено.";
  const tags = document.getElementById("detail-tags");
  tags.replaceChildren();
  if (product.tags?.length) {
    product.tags.forEach(tag => tags.append(element("span", "tag", tag)));
  } else {
    tags.textContent = "Теги не указаны";
  }
}

function showProduct(key) {
  const product = products.find(item => item.key === key);
  if (!product || busy) return;
  selectedKey = key;
  fillDetails(product);
  openModal(productDialog);
  document.getElementById("detail-title").focus();
}

function openForm(key = null) {
  if (busy) return;
  const product = products.find(item => item.key === key);
  if (key !== null && !product) return;
  editingKey = key;
  form.reset();
  Object.entries(fields).forEach(([name, input]) => {
    input.value = name === "tags" ? (product?.tags || []).join(", ") : (product?.[name] ?? "");
  });
  document.getElementById("form-title").textContent = product ? "Изменить товар" : "Добавить товар";
  saveButton.textContent = product ? "Сохранить изменения" : "Добавить товар";
  openModal(formDialog);
  fields.title.focus();
}

function confirmDelete(key) {
  if (busy) return;
  const product = products.find(item => item.key === key);
  if (!product) return;
  pendingDeleteKey = key;
  document.getElementById("delete-name").textContent = product.title;
  openModal(deleteDialog);
  document.getElementById("delete-cancel").focus();
}

// Одна обработка кликов для всей сетки. Иконки не открывают подробности.
list.addEventListener("click", event => {
  if (busy) return;
  const card = event.target.closest(".product-card");
  if (!card) return;
  const action = event.target.closest("[data-action]")?.dataset.action || "open";
  if (action === "edit") openForm(card.dataset.key);
  else if (action === "delete") confirmDelete(card.dataset.key);
  else showProduct(card.dataset.key);
});

form.addEventListener("submit", event => {
  event.preventDefault();
  if (busy || !form.reportValidity()) return;
  if (!fields.title.value.trim()) {
    notify("Введите название товара.", "error");
    fields.title.focus();
    return;
  }
  if (fields.thumbnail.value && !imageUrl(fields.thumbnail.value)) {
    notify("Укажите ссылку на фото, начинающуюся с https:// или http://.", "error");
    fields.thumbnail.focus();
    return;
  }

  const body = {
    title: fields.title.value.trim(),
    price: Number(fields.price.value),
    category: fields.category.value.trim(),
    description: fields.description.value.trim(),
    tags: [...new Set(fields.tags.value.split(",").map(tag => tag.trim()).filter(Boolean))],
    thumbnail: fields.thumbnail.value.trim()
  };

  run(async () => {
    let product;
    const isNew = editingKey === null;
    if (isNew) {
      const created = await request("/add", "POST", body);
      // POST не сохраняет товар в DummyJSON: повторные ID разделяем ключом.
      product = { ...created, ...body, key: "local-" + nextLocalId++, local: true };
      products.unshift(product);
    } else {
      product = products.find(item => item.key === editingKey);
      if (!product) throw new Error("Товар не найден.");
      if (!product.local) await request("/" + product.id, "PATCH", body);
      // Сохраняем метаданные (рейтинг, images), меняем только поля формы.
      Object.assign(product, body);
    }
    renderProducts();
    if (productDialog.open && selectedKey === product.key) fillDetails(product);
    formDialog.close();
    notify(isNew ? "Товар добавлен" : "Изменения сохранены");
    // После перерисовки возвращаем фокус на новую кнопку карточки.
    if (!productDialog.open) {
      setBusy(false);
      focusCard(product.key);
    }
  });
});

document.getElementById("delete-confirm").addEventListener("click", () => {
  const product = products.find(item => item.key === pendingDeleteKey);
  if (!product) return;
  run(async () => {
    if (!product.local) await request("/" + product.id, "DELETE");
    products = products.filter(item => item.key !== product.key);
    renderProducts();
    deleteDialog.close();
    if (productDialog.open && selectedKey === product.key) productDialog.close();
    pendingDeleteKey = null;
    setBusy(false);
    focusCard(products[0]?.key);
    notify("Товар удалён");
  });
});

function loadProducts() {
  return run(async () => {
    loadButton.textContent = "Загрузка…";
    if (!hasLoaded && !products.length) {
      list.replaceChildren(element("p", "empty-state", "Загружаем товары…"));
    }
    try {
      const data = await request("?limit=12");
      products = data.products.map(product => ({ ...product, key: "api-" + product.id, local: false }));
      hasLoaded = true;
      renderProducts();
      notify("Каталог обновлён");
    } finally {
      loadButton.textContent = "Обновить каталог";
    }
  });
}

document.getElementById("detail-edit").append(icon("edit"));
document.getElementById("detail-delete").append(icon("trash"));
document.getElementById("delete-symbol").append(icon("trash"));
document.getElementById("detail-edit").addEventListener("click", () => openForm(selectedKey));
document.getElementById("detail-delete").addEventListener("click", () => confirmDelete(selectedKey));
document.getElementById("cancel-button").addEventListener("click", () => formDialog.close());
document.getElementById("delete-cancel").addEventListener("click", () => deleteDialog.close());
addButton.addEventListener("click", () => openForm());
loadButton.addEventListener("click", loadProducts);
loadProducts();
