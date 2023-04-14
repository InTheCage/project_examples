<?php

namespace common\helpers;

use common\models\siebel\Order;
use common\models\navision\Item;
use common\models\navision\Shop;
use common\models\siebel\Client;
use common\models\navision\Classifier;

/**
 * Class FakeModels.
 */
class FakeModels
{
    /**
     * @return Client
     */
    public static function client(): Client
    {
        return new Client([
            'ID' => '123',
            'NAME' => 'YII',
            'SURNAME' => 'YII',
            'BIRTHDAY' => date('d.m.Y'),
            'GENDER' => 'М',
            'EMAIL' => 'yii@test.com',
            'EMAIL_CONFIRMED' => 'Подтвержден',
            'EMAIL_COMMUNICATIONS' => 'N',
            'PHONE' => '+79185865587',
            'PHONE_CONFIRMED' => 'Подтвержден',
            'PHONE_COMMUNICATIONS' => 'N',
            'USE_EMAIL_FOR_ORDER' => 'N',
            'EMPLOYEE' => 'N',
            'BONUSES' => 5,
            'STAMPS' => 25,
            'TIMESTAMP' => date('d-m-Y H:i:s'),
        ]);
    }

    /**
     * @return Item
     */
    public static function item(): Item
    {
        return new Item([
            'id' => 'item-132',
            'classifier_id' => 'Классификатор item-132',
            'category_id' => 'Категория item-132',
            'name' => 'Товар из АВ',
            'gravimetric' => 1,
            'weight' => 10,
            'alcohol' => 'N',
            'min_price' => 100,
        ]);
    }

    /**
     * @return Classifier
     */
    public static function classifier(): Classifier
    {
        return new Classifier([
            'id' => 1,
            'name' => 'Classifier 1',
        ]);
    }

    /**
     * @return Shop
     */
    public static function shop(): Shop
    {
        return new Shop([
            'id' => 1,
            'name' => 'АВ Магазин №1',
            'address' => 'Москва, пр. Мира д.14',
            'format_id' => 'format',
            'region_id' => '10',
        ]);
    }

    /**
     * @return Order
     */
    public static function order()
    {
        return new Order([
            'ID' => 'ORDER-ID',
            'CLIENT_ID' => 123,
            'STATUS_ID' => 'Отложено',
            'CARD_ID' => 'CARD-ID-0',
            'SHOP_ID' => 'SHOP-ID-0',
            'AMOUNT' => 1500,
            'REFUND_ID' => 'REFUND-ID-0',
            'TIMESTAMP' => date('d-m-Y H:i:s'),
        ]);
    }
}
