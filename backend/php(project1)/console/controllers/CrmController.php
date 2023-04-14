<?php

namespace console\controllers;

use Yii;
use common\traits\Crm;
use yii\console\ExitCode;
use yii\console\Controller;
use common\models\bitrix\Deal;
use common\models\siebel\Card;
use common\models\navision\Item;
use common\models\siebel\Client;
use common\models\bitrix\Contact;
use common\models\bitrix\Product;
use common\models\local\CrmFields;
use common\models\siebel\AccrualPoints;
use common\models\siebel\AccrualStamps;
use common\models\hybris\Order as HybrisOrder;
use common\models\siebel\Order as SiebelOrder;
use common\models\express\Order as ExpressOrder;
use backend\controllers\AbstractSenderController;

/**
 * Class CrmController.
 */
class CrmController extends Controller
{
    /**
     * Создание Контакта в CRM по номеру телефона.
     *
     * crm/add-contact
     *
     * @param string $phone
     * @param bool   $withAllData
     * @param bool   $minData
     *
     * @return int
     */
    public function actionAddContact(string $phone, bool $withAllData = false, bool $minData = true)
    {
        if (!$client = Client::findOne(['PHONE' => $phone])) {
            $this->stderr('Client not found' . PHP_EOL);

            return ExitCode::UNSPECIFIED_ERROR;
        }

        $crmContact = Contact::getByClientId($client->ID);
        if (!isset($crmContact['result'])) {
            $this->stderr('Can not check CRM Contact with ' . $phone . PHP_EOL);

            return ExitCode::UNSPECIFIED_ERROR;
        }

        $crmContact = reset($crmContact['result']);
        if ($crmContact) {
            $this->stderr('CRM Contact already exists' . PHP_EOL);
            $client->trigger(Client::EVENT_UPDATED);

            return ExitCode::UNSPECIFIED_ERROR;
        }

        $client->trigger(Client::EVENT_CREATED);
        $this->stdout('Client with phone ' . $phone . ' was added' . PHP_EOL);

        if ($withAllData) {
            if (!$minData) {
                $cardsArr = Card::find()
                    ->where(['OWNER_ID' => $client->ID])
                    ->orderBy('TIMESTAMP ASC')
                    ->all();
                foreach ($cardsArr as $card) {
                    $card->trigger(Card::EVENT_CREATED);
                    $this->stdout('Client Card with ID = ' . $card->ID . ' was added' . PHP_EOL);
                }

                $accrualPointsArr = AccrualPoints::find()
                    ->where(['CLIENT_ID' => $client->ID])
                    ->orderBy('TIMESTAMP ASC')
                    ->all();
                foreach ($accrualPointsArr as $accrualPoints) {
                    $accrualPoints->trigger(AccrualPoints::EVENT_CREATED);
                    $this->stdout("Client Accrual points with ID = {$accrualPoints->ID} was added" . PHP_EOL);
                }

                $accrualStampsArr = AccrualStamps::find()
                    ->where(['CLIENT_ID' => $client->ID])
                    ->orderBy('TIMESTAMP ASC')
                    ->all();
                foreach ($accrualStampsArr as $accrualStamps) {
                    $accrualStamps->trigger(AccrualStamps::EVENT_CREATED);
                    $this->stdout("Client Accrual stamps with ID = {$accrualStamps->ID} was added" . PHP_EOL);
                }
            }

            $siebelOrderArr = SiebelOrder::find()
                ->where(['CLIENT_ID' => $client->ID])
                ->orderBy('TIMESTAMP ASC')
                ->all();
            foreach ($siebelOrderArr as $siebelOrder) {
                $siebelOrder->trigger(SiebelOrder::EVENT_CREATED);
                $this->stdout('Deal with Siebel ID = ' . $siebelOrder->ID . ' was added' . PHP_EOL);
            }

//            $hybrisOrderArr = HybrisOrder::find()
//                ->where(['client_id' => $client->ID])
//                ->orderBy('timestamp ASC')
//                ->all();
//            foreach ($hybrisOrderArr as $hybrisOrder) {
//                $hybrisOrder->trigger(HybrisOrder::EVENT_CREATED);
//                $this->stdout('Deal with Hybris ID = ' . $hybrisOrder->id . ' was added' . PHP_EOL);
//            }
//
//            $expressOrderArr = ExpressOrder::find()
//                ->where(['client_id' => $client->ID])
//                ->orderBy('timestamp ASC')
//                ->all();
//            foreach ($expressOrderArr as $expressOrder) {
//                $expressOrder->trigger(ExpressOrder::EVENT_CREATED);
//                $this->stdout('Deal with Express ID = ' . $expressOrder->id . ' was added' . PHP_EOL);
//            }
        }

        return ExitCode::OK;
    }

    /**
     * Информация о Контакте из CRM по номеру телефона.
     *
     * crm/contact-info
     *
     * @param string $phone
     *
     * @return int
     */
    public function actionContactInfo(string $phone)
    {
        $crmContactRes = Contact::getByClientPhone($phone, ['*']);
        if (!empty($crmContactRes)) {
            print_r($crmContactRes);
        }

        return ExitCode::OK;
    }

    /**
     * Список SMS сервисов в CRM.
     *
     * crm/list-sms-service
     *
     * @return int
     */
    public function actionListSmsService()
    {
        $smsServicesRes = Crm::smsServiceList();
        if (!empty($smsServicesRes['result'])) {
            $services = $smsServicesRes['result'];

            print_r($services);
        }

        return ExitCode::OK;
    }

    /**
     * Удалить SMS Traffic сервис в CRM.
     *
     * crm/del-sms-service
     *
     * @param string $code
     *
     * @return int
     */
    public function actionDelSmsService(string $code)
    {
        $smsServicesRes = Crm::smsServiceList();
        if (!empty($smsServicesRes['result'])) {
            $services = $smsServicesRes['result'];

            if (in_array($code, $services)) {
                Crm::smsServiceDel($code);
                $this->stdout('SMS service with ' . $code . ' name was deleted' . PHP_EOL);
            } else {
                $this->stderr('SMS service with ' . $code . ' name does not exist' . PHP_EOL);
            }
        } else {
            $this->stderr('No SMS services available' . PHP_EOL);
        }

        return ExitCode::OK;
    }

    /**
     * Добавить сервис отправки сообщений в CRM.
     *
     * crm/add-sms-services
     *
     * @return int
     */
    public function actionAddSmsServices()
    {
        $smsServicesRes = Crm::smsServiceList();
        $services = !empty($smsServicesRes['result']) ? $smsServicesRes['result'] : [];

        $backendControllersPath = Yii::getAlias('@backend') . DIRECTORY_SEPARATOR . 'controllers';
        foreach (array_diff(scandir($backendControllersPath), ['.', '..']) as $file) {
            $file = pathinfo($file);
            if (
                is_subclass_of(
                    'backend\controllers\\' . $file['filename'],
                AbstractSenderController::class,
                true
                )
            ) {
                /** @var AbstractSenderController $serviceClass */
                $serviceClass = 'backend\controllers\\' . $file['filename'];
                if (!$attributes = $serviceClass::initAttributes()) {
                    $this->stderr("{$file['filename']}. Invalid service parameters " . PHP_EOL);
                }
                if ($this->confirm("Add {$attributes['NAME']} service?", true)) {
                    if (!in_array($attributes['CODE'], $services)) {
                        $response = Crm::smsServiceAdd($attributes);

                        print_r($response);
                    } else {
                        $this->stderr(
                            "SMS service with {$attributes['NAME']} name already exist" . PHP_EOL
                        );
                    }
                }
            }
        }

        return ExitCode::OK;
    }

    /**
     * Создание доп. полей для Контакта, Товара и Сделки в CRM.
     *
     * crm/add-fields
     *
     * @return int
     */
    public function actionAddFields()
    {
        CrmFields::deleteAll();

        foreach (Contact::additionalFields() as $clientProperty => $fieldData) {
            $contactFieldRes = Contact::addFields($fieldData);
            if (isset($contactFieldRes['result']) && is_int($contactFieldRes['result'])) {
                $this->stdout(
                    Contact::UF_PREFIX . $fieldData['FIELD_NAME'] . ' was added to CRM' . PHP_EOL
                );
            } elseif (isset($contactFieldRes['error_description'])) {
                $this->stdout($contactFieldRes['error_description'] . PHP_EOL);
            }

            if (!CrmFields::findOne(['crm_name' => Contact::UF_PREFIX . $fieldData['FIELD_NAME']])) {
                (new CrmFields([
                    'crm_name' => Contact::UF_PREFIX . $fieldData['FIELD_NAME'],
                    'crm_type' => $fieldData['USER_TYPE_ID'],
                    'model' => Client::class,
                    'property' => $clientProperty,
                ]))->save();

                $this->stdout(
                    Contact::UF_PREFIX . $fieldData['FIELD_NAME'] . ' was added to DB' . PHP_EOL
                );
            }
        }

        foreach (Product::additionalFields() as $itemProperty => $fieldData) {
            if ($productFieldRes = Product::getProperty($fieldData['FIELD_NAME'])) {
                if (isset($productFieldRes['result']) && $productFieldRes = $productFieldRes['result']) {
                    foreach ($productFieldRes as $productField) {
                        if (!CrmFields::findOne(['crm_name' => Product::UF_PREFIX . $productField['ID']])) {
                            (new CrmFields([
                                'crm_name' => Product::UF_PREFIX . $productField['ID'],
                                'crm_type' => ($productField['PROPERTY_TYPE'] == 'S') ? 'string' : 'boolean',
                                'model' => Item::class,
                                'property' => $itemProperty,
                            ]))->save();

                            $this->stdout(
                                Product::UF_PREFIX . $productField['ID'] . ' was added to DB' . PHP_EOL
                            );
                        }
                    }
                }
            } else {
                $productFieldRes = Product::addProperty($fieldData);
                if (isset($productFieldRes['result']) && is_int($productFieldRes['result'])) {
                    if (!CrmFields::findOne(['crm_name' => Product::UF_PREFIX . $productFieldRes['result']])) {
                        (new CrmFields([
                            'crm_name' => Product::UF_PREFIX . $productFieldRes['result'],
                            'crm_type' => ($fieldData['PROPERTY_TYPE'] == 'S') ? 'string' : 'boolean',
                            'model' => Item::class,
                            'property' => $itemProperty,
                        ]))->save();

                        $this->stdout(
                            Product::UF_PREFIX . $productFieldRes['result'] . ' was added to DB' . PHP_EOL
                        );
                    }

                    $this->stdout(
                        Product::UF_PREFIX . $productFieldRes['result'] . ' was added to CRM' . PHP_EOL
                    );
                } elseif (isset($productFieldRes['error_description'])) {
                    $this->stdout($productFieldRes['error_description'] . PHP_EOL);
                }
            }
        }

        foreach (Deal::additionalFields() as $orderProperty => $fieldData) {
            $dealFieldRes = Deal::addFields($fieldData);
            if (isset($dealFieldRes['result']) && is_int($dealFieldRes['result'])) {
                $this->stdout(
                    Deal::UF_PREFIX . $fieldData['FIELD_NAME'] . ' was added to CRM' . PHP_EOL
                );
            } elseif (isset($dealFieldRes['error_description'])) {
                $this->stdout($dealFieldRes['error_description'] . PHP_EOL);
            }

            if (!CrmFields::findOne(['crm_name' => Deal::UF_PREFIX . $fieldData['FIELD_NAME']])) {
                (new CrmFields([
                    'crm_name' => Deal::UF_PREFIX . $fieldData['FIELD_NAME'],
                    'crm_type' => $fieldData['USER_TYPE_ID'],
                    'model' => Deal::class,
                    'property' => $orderProperty,
                ]))->save();

                $this->stdout(
                    Deal::UF_PREFIX . $fieldData['FIELD_NAME'] .
                    ' was added to DB' .
                    PHP_EOL
                );
            }
        }

        return ExitCode::OK;
    }
}
