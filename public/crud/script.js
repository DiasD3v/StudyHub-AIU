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