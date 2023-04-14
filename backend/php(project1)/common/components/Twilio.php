<?php

namespace common\components;

use Exception;
use yii\helpers\Url;
use common\traits\Crm;
use Twilio\Rest\Client;
use yii\base\Component;
use common\models\bitrix\Contact;
use yii\base\InvalidConfigException;
use yii\web\BadRequestHttpException;
use yii\web\ServerErrorHttpException;

class Twilio extends Component
{
    private const SERVICE_TYPE = 'SMS';

    public string $name;

    public string $code;

    public string $template_name;

    public string $template_code;

    public string $api_sid;

    public string $api_access_token;

    public string $whatsapp_id;

    public string $token;

    /**
     * @param bool $byTemplate
     *
     * @return array
     */
    public function setServiceAttributes($byTemplate = false)
    {
        if (empty($this->name) || empty($this->template_name) ||
            empty($this->code) || empty($this->template_code) ||
            empty($this->token)
        ) {
            return [];
        }

        $handler = URL::to(['/twilio/send', 'token' => $this->token], true);
        if ($byTemplate) {
            $this->name = $this->template_name;
            $this->code = $this->template_code;
            $handler = URL::to(['/twilio-templates/send', 'token' => $this->token], true);
        }

        return [
            'CODE' => $this->code,
            'TYPE' => static::SERVICE_TYPE,
            'HANDLER' => $handler,
            'NAME' => $this->name,
        ];
    }

    /**
     * @param string $phone
     * @param string $message
     * @param bool   $byTemplate
     *
     * @throws BadRequestHttpException
     * @throws InvalidConfigException
     * @throws ServerErrorHttpException
     */
    public function sendMessage(string $phone, string $message, $byTemplate = false)
    {
        if (empty($this->api_sid) || empty($this->api_access_token) || empty($this->whatsapp_id)) {
            throw new InvalidConfigException();
        }

        if (!$crmContact = static::getRecipient($phone)) {
            throw new BadRequestHttpException("Recipient with phone {$phone} not found");
        }

        if ($byTemplate) {
            if (empty($message)) {
                throw new BadRequestHttpException("Message for recipient {$phone} not found");
            }

            $contactMessage = $message;
        } else {
            if (!$crmManager = static::getManager($crmContact['ASSIGNED_BY_ID'])) {
                throw new BadRequestHttpException("Manager for recipient with phone {$phone} not found");
            }

            $contactMessage = "Здравствуйте, {$crmContact['NAME']}!

Ваш персональный ассистент: {$crmManager['NAME']} {$crmManager['LAST_NAME']}.
Вы можете связаться с ним по телефону +7 495 414-18-28 или написать письмо по адресу my@test.ru в любое удобное время!

Официальная страница сервиса и список авторизованных персональных ассистентов: https://lp.local.ru/my

С уважением,
Консьерж-сервис «Азбука вкуса»";
        }

        try {
            $twilio = new Client($this->api_sid, $this->api_access_token);
            $twilio->messages->create("whatsapp:{$phone}",
                [
                    'from' => 'whatsapp:' . $this->whatsapp_id,
                    'body' => $contactMessage,
                ]
            );
        } catch (Exception $exception) {
            throw new ServerErrorHttpException($exception->getMessage());
        }
    }

    /**
     * @param string $phone
     *
     * @return bool|array
     */
    private static function getRecipient(string $phone)
    {
        $crmContactRes = Contact::getByClientPhone($phone, ['*']);
        if (!isset($crmContactRes['result'])) {
            return false;
        }

        $crmContact = reset($crmContactRes['result']);
        if (!$crmContact || !isset($crmContact['ID'])) {
            return false;
        }

        return $crmContact;
    }

    /**
     * @param string $managerId
     *
     * @return bool|array
     */
    private static function getManager(string $managerId)
    {
        $managerRes = Crm::userGetById($managerId);

        if (!isset($managerRes['result'])) {
            return false;
        }

        $crmManager = reset($managerRes['result']);
        if (!$crmManager || empty($crmManager['ID'])) {
            return false;
        }

        return $crmManager;
    }
}
