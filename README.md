# Наша команда
- [Dias](https://github.com/DiasD3v) diasbolatov30@gmail.com
- [Bekulan](https://github.com/bekulanbalkashbay-dot) bekulanbekulan36@gmail.com
- [Tamerlan](https://github.com/bta2602) tamerlane.bolatov07@gmail.com
- [Didar](https://github.com/didarochKA) didarochka.19@gmail.com

## Каталог товаров — CRUD

Откройте public/index.html через Live Server и перейдите в «API · CRUD».
Для работы нужен интернет; API-ключ не требуется.

- Товары отображаются карточками с фото, ценой, категорией и рейтингом.
- Нажатие на карточку открывает описание, рейтинг, цену, категорию и теги поверх сайта.
- Кнопка «Добавить товар» открывает форму; карандаш позволяет изменить товар.
- Корзина открывает подтверждение. «Оставить» отменяет удаление.
- Результаты операций и ошибки показываются всплывающими уведомлениями.
- Окна закрываются крестиком, Escape или нажатием на затемнённый фон.

В public/crud/index.html находится разметка, в style.css — стили,
в script.js — fetch-запросы и работа с DOM.
В DevTools → Network можно увидеть GET /products?limit=12,
POST /products/add, PATCH /products/ID и DELETE /products/ID.

DummyJSON не сохраняет изменения в базе. Новые товары редактируются и удаляются
локально, а изменения исчезают при обновлении каталога или страницы.
Для новых товаров без рейтинга отображается «Нет оценок», без фото — заглушка.
