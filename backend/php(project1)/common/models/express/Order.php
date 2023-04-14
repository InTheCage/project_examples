<?php

namespace common\models\express;

use yii\db\ActiveQuery;
use common\traits\OrderTrait;
use common\models\bitrix\Deal;
use common\models\siebel\Card;
use common\models\navision\Shop;
use common\models\siebel\Client;
use common\interfaces\OrderInterface;

/**
 * Class Order.
 *
 * @property string $id
 * @property string $client_id
 * @property string $card_id
 * @property string $shop_id
 * @property float $amount
 * @property int $timestamp
 * @property-read  Client $client
 * @property-read  Card $card
 * @property-read  Shop $shop
 * @property-read  OrderAddress $order_address
 * @property-read  OrderItem[] $items
 * @property-read string $comment
 * @property-read string $address
 */
class Order extends AbstractModel implements OrderInterface
{
    public const REDIS_IMPORTED_TIMESTAMP = 'order_express_datetime';

    public const EVENT_CREATED = self::class . '_created';

    public const EVENT_UPDATED = self::class . '_updated';

    public const EVENT_DELETED = self::class . '_deleted';

    /**
     * {@inheritdoc}
     */
    public function rules()
    {
        return [
            [
                [
                    'id',
                    'client_id',
                    'card_id',
                    'shop_id',
                    'amount',
                    'timestamp',
                ],
                'required',
            ],
        ];
    }

    /**
     * {@inheritdoc}
     */
    public function init()
    {
        parent::init();

        $this->on(
            static::EVENT_CREATED,
            [
                Deal::class,
                'addOne',
            ]
        );

        $this->on(
            static::EVENT_UPDATED,
            [
                Deal::class,
                'updateOne',
            ]
        );
    }

    /**
     * @return ActiveQuery
     */
    public function getClient()
    {
        return $this->hasOne(Client::class, ['ID' => 'client_id']);
    }

    /**
     * @return ActiveQuery
     */
    public function getCard()
    {
        return $this->hasOne(Card::class, ['ID' => 'card_id']);
    }

    /**
     * @return ActiveQuery
     */
    public function getShop()
    {
        return $this->hasOne(Shop::class, ['id' => 'shop_id']);
    }

    /**
     * @return ActiveQuery
     */
    public function getOrderAddress()
    {
        return $this->hasOne(OrderAddress::class, ['order_id' => 'id']);
    }

    /**
     * @return string
     */
    public function getAddress() : string
    {
        return OrderTrait::collectAddress($this);
    }

    /**
     * @return string
     */
    public function getComment() : string
    {
        return OrderTrait::collectComment($this);
    }

    /**
     * @return ActiveQuery
     */
    public function getItems()
    {
        return $this->hasMany(OrderItem::class, ['order_id' => 'id']);
    }

    /**
     * Collect OrderItems.
     *
     * @return array
     */
    public function toCrmItems() : array
    {
        return OrderTrait::collectItemsForCrm($this);
    }

    /**
     * Mapping to bitrix\Deal.
     *
     * @return array
     */
    public function toCrm() : array
    {
        return OrderTrait::collectForCrm($this);
    }
}
