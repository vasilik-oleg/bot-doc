# **1. История изменений**

## **2022-06-22:**

- В FIX подключениях к фондовому и валютному рынкам Московской биржи снято ограничение на число заявок, выстаялемых за торговую сессию, связанное с длинными клиентскими кодами;
- Подключения к Binance переведены на потоки раздачи стаканов с меньшей "нарезкой".

## **2022-06-15:**

- В C++ интерфейс добавлены методы [min_step()](https://fkviking.github.io/bot-doc/docs/08-c-api.html#_8-3-%D0%B4%D0%BE%D1%81%D1%82%D1%83%D0%BF-%D0%BA-%D0%B1%D0%B8%D1%80%D0%B6%D0%B5%D0%B2%D1%8B%D0%BC-%D0%B4%D0%B0%D0%BD%D0%BD%D1%8B%D0%BC-%D0%BF%D0%BE-%D1%84%D0%B8%D0%BD%D0%B0%D0%BD%D1%81%D0%BE%D0%B2%D1%8B%D0%BC-%D0%B8%D0%BD%D1%81%D1%82%D1%80%D1%83%D0%BC%D0%B5%D0%BD%D1%82%D0%B0%D0%BC) и [lot_round()](https://fkviking.github.io/bot-doc/docs/08-c-api.html#_8-3-%D0%B4%D0%BE%D1%81%D1%82%D1%83%D0%BF-%D0%BA-%D0%B1%D0%B8%D1%80%D0%B6%D0%B5%D0%B2%D1%8B%D0%BC-%D0%B4%D0%B0%D0%BD%D0%BD%D1%8B%D0%BC-%D0%BF%D0%BE-%D1%84%D0%B8%D0%BD%D0%B0%D0%BD%D1%81%D0%BE%D0%B2%D1%8B%D0%BC-%D0%B8%D0%BD%D1%81%D1%82%D1%80%D1%83%D0%BC%D0%B5%D0%BD%D1%82%D0%B0%D0%BC) для объекта финансового инструмента;
- В C++ интерфейс добавлены методы [funding_rate()](https://fkviking.github.io/bot-doc/docs/08-c-api.html#_8-3-%D0%B4%D0%BE%D1%81%D1%82%D1%83%D0%BF-%D0%BA-%D0%B1%D0%B8%D1%80%D0%B6%D0%B5%D0%B2%D1%8B%D0%BC-%D0%B4%D0%B0%D0%BD%D0%BD%D1%8B%D0%BC-%D0%BF%D0%BE-%D1%84%D0%B8%D0%BD%D0%B0%D0%BD%D1%81%D0%BE%D0%B2%D1%8B%D0%BC-%D0%B8%D0%BD%D1%81%D1%82%D1%80%D1%83%D0%BC%D0%B5%D0%BD%D1%82%D0%B0%D0%BC) и [funding_time()](https://fkviking.github.io/bot-doc/docs/08-c-api.html#_8-3-%D0%B4%D0%BE%D1%81%D1%82%D1%83%D0%BF-%D0%BA-%D0%B1%D0%B8%D1%80%D0%B6%D0%B5%D0%B2%D1%8B%D0%BC-%D0%B4%D0%B0%D0%BD%D0%BD%D1%8B%D0%BC-%D0%BF%D0%BE-%D1%84%D0%B8%D0%BD%D0%B0%D0%BD%D1%81%D0%BE%D0%B2%D1%8B%D0%BC-%D0%B8%D0%BD%D1%81%D1%82%D1%80%D1%83%D0%BC%D0%B5%D0%BD%D1%82%D0%B0%D0%BC) для объекта финансового инструмента (для некоторых бирж).

## **2022-02-03:**

- Добавлена возможность подключения к бирже Deribit с быстрой маркетдатой. Для этого потребуется пересоздать торговое подключение к Deribit;
- Изменено поведение всех маркетдата подключений требующих авторизацию (Exante FIX, LMAX FIX, Bequant FIX, Deribit). Все эти маркетдата подключения добавляются вместе с соответствующим торговым подключением, а потому включаться и отключаться они тоже будут только вместе с торговым подключением;
- В C++ интерфейс добавлен метод [extra()](https://fkviking.github.io/bot-doc/docs/08-c-api.html#_8-5-%D0%B4%D0%BE%D1%81%D1%82%D1%83%D0%BF-%D0%B8-%D0%B8%D0%B7%D0%BC%D0%B5%D0%BD%D0%B5%D0%BD%D0%B8%D0%B5-%D0%BF%D0%BE%D0%BB%D0%B5%D0%B8-%D0%BF%D0%BE%D1%80%D1%82%D1%84%D0%B5%D0%BB%D1%8F) для объекта портфеля;
- В C++ интерфейс добавлена возможность вывода сообщений в лог ([функции log_*](https://fkviking.github.io/bot-doc/docs/08-c-api.html#_8-7-3-%D1%84%D1%83%D0%BD%D0%BA%D1%86%D0%B8%D0%B8-%D0%B4%D0%BB%D1%8F-%D1%80%D0%B0%D0%B1%D0%BE%D1%82%D1%8B-%D1%81-%D0%BE%D0%BF%D1%86%D0%B8%D0%BE%D0%BD%D0%B0%D0%BC%D0%B8));
- В меню "Action" на главной странице робота добавлена функция To0;
- В JSON API добавлено поле портфеля [__extra](https://fkviking.github.io/bot-doc/docs/09-api-v1.html#_9-21-%D1%81%D0%BB%D0%BE%D0%B2%D0%B0%D1%80%D1%8C-%D0%BF%D0%BE%D0%BB%D1%8C%D0%B7%D0%BE%D0%B2%D0%B0%D1%82%D0%B5%D0%BB%D1%8C%D1%81%D0%BA%D0%B8%D1%85-%D0%BF%D0%B0%D1%80%D0%B0%D0%BC%D0%B5%D1%82%D1%80%D0%BE%D0%B2) для возможности сохранения пользовательских настроек.
