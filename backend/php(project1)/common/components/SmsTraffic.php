<?php

namespace common\components;

use stdClass;
use Exception;
use SoapClient;
use yii\helpers\Url;
use yii\base\Component;
use yii\base\InvalidConfigException;
use yii\web\ServerErrorHttpException;
use yii\base\InvalidArgumentException;

class SmsTraffic extends Component
{
    private const SERVICE_TYPE = 'SMS';

    private const SMS_TRAFFIC_NAME = 'AzbukaVkusa';

    private const SMS_TRAFFIC_URL = 'http://soap.smstraffic.ru/SoapSms2.wsdl';

    private const SMS_TRAFFIC_CACHE_TTL = 32200;

    private const SMS_TRAFFIC_TIMEOUT = 10;

    private const SMS_TRAFFIC_MAX_PARTS = 5;

    public string $name;

    public string $code;

    public string $username;

    public string $password;

    public string $token;

    /**
     * @return array
     */
    public function setServiceAttributes()
    {
        if (empty($this->code) || empty($this->token) || empty($this->name)) {
            return [];
        }

        return [
            'CODE' => $this->code,
            'TYPE' => static::SERVICE_TYPE,
            'HANDLER' => URL::to(['/sms/send', 'token' => $this->token], true),
            'NAME' => $this->name,
        ];
    }

    /**
     * @param string $phone
     * @param string $message
     *
     * @throws InvalidConfigException
     * @throws ServerErrorHttpException
     */
    public function sendMessage(string $phone, string $message)
    {
        if (empty($phone) || empty($message)) {
            throw new InvalidArgumentException();
        }

        if (empty($this->username) || empty($this->password)) {
            throw new InvalidConfigException();
        }

        $request = new stdClass;
        $request->login = $this->username;
        $request->password = $this->password;
        $request->message = '';
        $request->originator = static::SMS_TRAFFIC_NAME;
        $request->rus = '5';
        $request->max_parts = static::SMS_TRAFFIC_MAX_PARTS;
        $request->bulk = new stdClass;
        $request->bulk->message = $message;
        $request->bulk->phone = $phone;

        try {
            $client = new SoapClient(
                static::SMS_TRAFFIC_URL,
                [
                    'wsdl_cache_ttl' => static::SMS_TRAFFIC_CACHE_TTL,
                    'connection_timeout' => static::SMS_TRAFFIC_TIMEOUT,
                ]
            );

            $client->send($request);
        } catch (Exception $exception) {
            throw new ServerErrorHttpException($exception->getMessage());
        }
    }
}
