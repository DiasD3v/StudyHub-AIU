const API = "https://dummyjson.com/products";

const form = document.getElementById("product-form");
const titleInput = document.getElementById("product-title");
const priceInput = document.getElementById("product-price");
const tableBody = document.getElementById("products");
const count = document.getElementById("product-count");
const statusText = document.getElementById("status");
const errorText = document.getElementById("error");
const loadButton = document.getElementById("load-button");
const saveButton = document.getElementById("save-button");
const cancelButton = document.getElementById("cancel-button");

let products = [];
let editingKey = null;
let nextLocalId = 1;
let busy = false;

// Общая функция для запросов к API.
async function request(path, method = "GET", body) {
  const options = {
    method,
    signal: AbortSignal.timeout(15000)
  };

  if (body !== undefined) {
    options.headers = { "Content-Type": "application/json" };
    options.body = JSON.stringify(body);
  }

  const response = await fetch(API + path, options);

  if (!response.ok) {
    throw new Error("HTTP " + response.status);
  }

  return response.json();
}

// Блокируем повторные действия во время запроса.
function setBusy(value) {
  busy = value;
  document.getElementById("form-fields").disabled = value;
  loadButton.disabled = value;

  tableBody.querySelectorAll("button").forEach(button => {
    button.disabled = value;
  });
}

// Обработка загрузки и ошибок для всех операций.
async function run(action) {
  if (busy) return;

  errorText.textContent = "";
  statusText.textContent = "Выполняется...";
  setBusy(true);

  try {
    await action();
  } catch (error) {
    statusText.textContent = "";
    errorText.textContent =
      "Ошибка: " + error.message +
      ". Проверьте интернет и попробуйте снова.";
  } finally {
    setBusy(false);
  }
}

function renderProducts() {
  tableBody.replaceChildren();
  count.textContent = products.length;

  if (products.length === 0) {
    const cell = tableBody.insertRow().insertCell();
    cell.colSpan = 4;
    cell.textContent = "Товаров нет. Загрузите список или добавьте товар.";
    return;
  }

  products.forEach(product => {
    const row = tableBody.insertRow();

    const values = [
      product.local ? "Локальный" : product.id,
      product.title,
      "$" + Number(product.price).toFixed(2)
    ];

    values.forEach(value => {
      // textContent безопасно отображает текст.
      row.insertCell().textContent = value;
    });

    const actions = document.createElement("div");
    actions.className = "actions";

    const editButton = document.createElement("button");
    editButton.type = "button";
    editButton.className = "btn-secondary";
    editButton.textContent = product.local
      ? "Изменить локально"
      : "Изменить · PATCH";

    editButton.addEventListener("click", () => {
      editProduct(product.key);
    });

    const deleteButton = document.createElement("button");
    deleteButton.type = "button";
    deleteButton.className = "btn-delete";
    deleteButton.textContent = product.local
      ? "Удалить локально"
      : "Удалить · DELETE";

    deleteButton.addEventListener("click", () => {
      deleteProduct(product.key);
    });

    actions.append(editButton, deleteButton);
    row.insertCell().append(actions);
  });
}

function loadProducts() {
  return run(async () => {
    const data = await request("?limit=12");

    products = data.products.map(product => ({
      ...product,
      key: "api-" + product.id,
      local: false
    }));

    resetForm();
    renderProducts();

    statusText.textContent =
      "GET выполнен. Загружено товаров: " + products.length;
  });
}

// Сбрасываем форму и возвращаем режим добавления.
function resetForm() {
  editingKey = null;
  form.reset();

  document.getElementById("form-title").textContent = "Добавить товар";
  saveButton.textContent = "Добавить · POST";
  cancelButton.hidden = true;
}

// Заполняем форму данными выбранного товара.
function editProduct(key) {
  if (busy) return;

  const product = products.find(item => item.key === key);
  if (!product) return;

  editingKey = key;
  titleInput.value = product.title;
  priceInput.value = product.price;

  document.getElementById("form-title").textContent = "Изменить товар";
  saveButton.textContent = product.local
    ? "Сохранить локально"
    : "Сохранить · PATCH";

  cancelButton.hidden = false;
  titleInput.focus();
}

// Добавление или изменение товара.
form.addEventListener("submit", event => {
  event.preventDefault();

  if (busy || !form.reportValidity()) return;

  const title = titleInput.value.trim();
  const price = Number(priceInput.value);

  if (!title) {
    errorText.textContent = "Введите название товара.";
    titleInput.focus();
    return;
  }

  const body = { title, price };

  run(async () => {
    if (editingKey === null) {
      // CREATE — отправляем новый товар на API.
      const created = await request("/add", "POST", body);

      products.unshift({
        ...created,

        // DummyJSON может возвращать одинаковый ID.
        // Для каждого нового товара создаём отдельный ключ.
        key: "local-" + nextLocalId++,
        local: true
      });

      statusText.textContent = "POST выполнен. Товар добавлен.";
    } else {
      // UPDATE — изменяем выбранный товар.
      const product = products.find(item => item.key === editingKey);

      if (!product) {
        throw new Error("Товар для редактирования не найден");
      }

      if (product.local) {
        // DummyJSON не сохраняет новые товары на сервере.
        Object.assign(product, body);
        statusText.textContent = "Товар изменён локально.";
      } else {
        const updated = await request(
          "/" + product.id,
          "PATCH",
          body
        );

        Object.assign(product, updated);
        statusText.textContent = "PATCH выполнен. Товар изменён.";
      }
    }

    resetForm();
    renderProducts();
  });
});

// Удаление товара.
function deleteProduct(key) {
  if (busy) return;

  const product = products.find(item => item.key === key);
  if (!product) return;

  return run(async () => {
    if (!product.local) {
      // DELETE — запрос для товара, полученного из API.
      await request("/" + product.id, "DELETE");
    }

    // Обновляем список после успешного запроса.
    products = products.filter(item => item.key !== key);

    if (editingKey === key) {
      resetForm();
    }

    renderProducts();

    statusText.textContent = product.local
      ? "Товар удалён локально."
      : "DELETE выполнен. Товар удалён.";
  });
}

// Подключаем кнопки.
cancelButton.addEventListener("click", resetForm);
loadButton.addEventListener("click", loadProducts);

// Загружаем товары при открытии страницы.
renderProducts();
loadProducts();