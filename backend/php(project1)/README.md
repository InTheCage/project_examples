# B24 integration

## Системные требование
- PHP >= 7.4 (+ ext-curl, ext-http, ext-soap)
- MySQL (>=5.5)
- Git
- Composer
- Redis

### Перед запуском
- `composer install`
- Запустить `php init` и выбрать `development(0)`
- заполнить данные для подключения к DB + внешние DB + Redis 
(`db` / `navision` / `siebel` / `hybris` / `express` / `redis`) 
в файле `/common/config/main-local.php` 
пример в файле `/common/config/main-local.php.example`

- Применить миграции `php yii migrate`
- скопировать файл и заполнить все параметры:

`cp /common/config/params-local.php.example /common/config/params-local.php`

### Настройка и подключение CRM
- подключить "Локальное приложение":

"настройка прав" - CRM, Телефония, Телефония (совершение звонков), Служба сообщений, Почтовые сервисы, catalog

"путь для первоначальной установки" - `https://DOMAIN.COM/F`/init`

- если в таблице БД не появилась запись с доступами, то нажать "Переустановить" на сайте Bitrix24

- Выбрать сотрудников "Разработчика -- Интеграции" - "Права доступа для сотрудников"

### Настройка SMS провайдера для CRM
Endpoints:
 
`https://DOMAIN.COM/sms/send`

`https://DOMAIN.COM/twilio/send`

`https://DOMAIN.COM/twilio-templates/send`

Настройки `common/config/main-local.php`, пример `common/config/main-local.php.example`

### Подготовка CRM
- Убрать галочку "Обновлять дату завершения при переходе в финальную стадию" на странице "Настройки — Другое — Прочие настройки"

- выполнить консольную команду для создания SMS провайдера

`php yii crm/add-sms-services`

- если SMS провайдер уже существует, то можно проверить список и удалить его

`php yii crm/list-sms-service`

`php yii crm/del-sms-service CODE_NAME`

- выполнить консольную команду для создания доп. полей Контакта и Товара и заполнения таблицы `b2c_crm_fields` 

`php yii crm/add-fields`

### События моделей и их обработчики
Общий префикс для всех `namespace` ниже - `common\models\`

- `navision\Item::EVENT_CREATED` - `bitrix\Product->addOne()`
- `navision\Item::EVENT_UPDATED` - `bitrix\Product->updateOne()`
- `navision\Item::EVENT_DELETED` - 
- `siebel\Client::EVENT_CREATED` - `bitrix\Contact->addOne()`
- `siebel\Client::EVENT_UPDATED` - `bitrix\Contact->updateOne()`
- `siebel\Client::EVENT_DELETED` - 
- `siebel\Card::EVENT_CREATED` - `bitrix\Contact->addCardTimelineComment()`
- `siebel\Card::EVENT_UPDATED` - `bitrix\Contact->addCardTimelineComment()`
- `siebel\Card::EVENT_DELETED` -
- `siebel\AccrualPoints::EVENT_CREATED` - `bitrix\Contact->addAccrualTimelineComment()`
- `siebel\AccrualPoints::EVENT_UPDATED` -
- `siebel\AccrualPoints::EVENT_DELETED` -
- `siebel\AccrualStamps::EVENT_CREATED` - `bitrix\Contact->addAccrualTimelineComment()`
- `siebel\AccrualStamps::EVENT_UPDATED` -
- `siebel\AccrualStamps::EVENT_DELETED` -
- `siebel|hybris|express\Order::EVENT_CREATED` - `bitrix\Deal->addOne()`
- `siebel|hybris|express\Order::EVENT_UPDATED` - `bitrix\Deal->updateOne()`
- `siebel|hybris|express\Order::EVENT_DELETED` - 

### Консольные команды
- добавить дополнительные поля для Контакта, Товара и Сделки в CRM 

`php yii crm/add-fields`

- добавить в CRM Контакт по номеру телефона Клиента

`php yii crm/add-contact +70000000000`

- получить из CRM Контакт по номеру телефона Клиента

`php yii crm/contact-info +70000000000`

- список SMS провайдеров в CRM 

`php yii crm/list-sms-service`

- добавить SMS провайдера в CRM 

`php yii crm/add-sms-services`

- удалить SMS провайдера в CRM 

`php yii crm/del-sms-service CODE_NAME`

- обновить импортированные в CRM Контакты

`php yii update-exists/clients`
 
- обновить импортированные в CRM Заказы Siebel

`php yii update-exists/siebel-orders`

### Консольные команды для Cron jobs
- добавить/обновить в CRM `AccrualPoints|AccrualStamps|Card|Client|Item|HybrisOrder|SiebelOrder|ExpressOrder` сущности

`php yii cron-import/add`

`php yii cron-import/update`

- также можно добавить в Cron создание доп. полей на случай их удаления из CRM

`php yii crm/add-fields`

### Запуск Yii
`php yii serve --docroot="backend/web/" --port=8000`

### Тестовые данные
В классе `common\helpers\FakeModels` методы с тестовыми данными для моделей

### TODO
- `Event::on()`
- `navision\Classifier` in CRM Product Sections
- other `TODO` in project
