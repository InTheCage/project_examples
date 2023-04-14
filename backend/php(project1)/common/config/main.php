<?php

$params = array_merge(
    require __DIR__ . '/params.php',
    require __DIR__ . '/params-local.php',
);

return [
    'aliases' => [
        '@bower' => '@vendor/bower-asset',
        '@npm' => '@vendor/npm-asset',
    ],
    'vendorPath' => dirname(dirname(__DIR__)) . '/vendor',
    'components' => [
        'cache' => [
            'class' => 'yii\caching\FileCache',
        ],
        'bitrix' => [
            'class' => 'common\components\Bitrix',
        ],
        'smstraffic' => [
            'class' => 'common\components\SmsTraffic',
            'name' => 'SMS Traffic',
            'code' => 'sms_traffic',
            'username' => '',
            'password' => '',
            'token' => '',
        ],
        'twilio' => [
            'class' => 'common\components\Twilio',
            'name' => 'Twilio',
            'code' => 'twilio',
            'template_name' => 'Twilio WhatsApp Templates',
            'template_code' => 'twilio_templates',
            'api_sid' => '',
            'api_access_token' => '',
            'whatsapp_id' => '',
            'token' => '',
        ],
        'formatter' => [
            'class' => 'yii\i18n\Formatter',
            'dateFormat' => 'dd-MM-YY',
            'timeFormat' => 'HH:mm:ss',
            'datetimeFormat' => 'yyyy-MM-dd HH:mm:ss',
            'thousandSeparator' => '',
        ],
    ],
    'params' => $params,
];
