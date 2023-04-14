<?php

namespace common\traits;

use Yii;
use common\components\Bitrix;

/**
 * Trait Crm.
 */
trait Crm
{
    /**
     * @param string $method
     * @param null   $arguments
     *
     * @return mixed
     */
    public static function publicCall(string $method, $arguments = null)
    {
        /** @var Bitrix $component */
        $component = Yii::$app->bitrix;

        return $component::call($method, !is_null($arguments) ? $arguments : []);
    }

    /**
     * Список SMS провайдеров.
     *
     * @return mixed
     */
    public static function smsServiceList()
    {
        return static::publicCall('messageservice.sender.list');
    }

    /**
     * Добавить SMS провайдер.
     *
     * @param array $smsServiceData
     *
     * @return mixed
     */
    public static function smsServiceAdd(array $smsServiceData)
    {
        return static::publicCall(
            'messageservice.sender.add',
            $smsServiceData
        );
    }

    /**
     * Удалить SMS провайдер по CODE.
     *
     * @param string $smsServiceCode
     *
     * @return mixed
     */
    public static function smsServiceDel(string $smsServiceCode)
    {
        return static::publicCall(
            'messageservice.sender.delete',
            [
                'CODE' => $smsServiceCode,
            ]
        );
    }

    /**
     * @param string $id
     *
     * @return mixed
     */
    public static function userGetById(string $id)
    {
        return static::publicCall(
            'user.get',
            [
                'filter' => [
                    'ID' => $id,
                ],
            ]
        );
    }
}
