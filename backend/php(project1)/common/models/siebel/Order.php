<?php

namespace common\models\siebel;

use common\traits\Crm;
use yii\db\ActiveQuery;
use common\traits\OrderTrait;
use common\models\bitrix\Deal;
use common\models\navision\Shop;
use common\models\bitrix\Contact;
use common\interfaces\OrderInterface;

/**
 * Class Order.
 *
 * @property string $ID
 * @property string $CLIENT_ID
 * @property string $STATUS_ID
 * @property string $CARD_ID
 * @property string $SHOP_ID
 * @property float $AMOUNT
 * @property string $REFUND_ID
 * @property string $TIMESTAMP
 * @property-read  Client $client
 * @property-read  Card $card
 * @property-read  Shop $shop
 * @property-read  OrderItem[] $items
 * @property-read string $comment
 * @property-read string $address
 */
class Order extends AbstractModel implements OrderInterface
{
    public const REDIS_IMPORTED_TIMESTAMP = 'order_siebel_datetime';

    public const EVENT_CREATED = self::class . '_created';

    public const EVENT_UPDATED = self::class . '_updated';

    public const EVENT_DELETED = self::class . '_deleted';

    /**
     * @var array|string[]
     */
    private static array $statuses = [
        'Отложено',
        'Закрыт',
        'Отменен',
        'Ожидание закрытия',
    ];

    /**
     * {@inheritdoc}
     */
    public static function tableName()
    {
        return 'SIEBEL.B2C_CRM_ORDER';
    }

    /**
     * {@inheritdoc}
     */
    public static function primaryKey()
    {
        return 'ID';
    }

    /**
     * {@inheritdoc}
     */
    public function rules()
    {
        return [
            [
                [
                    'ID',
                    'CLIENT_ID',
                    'STATUS_ID',
                    'CARD_ID',
                    'SHOP_ID',
                    'AMOUNT',
                    'TIMESTAMP',
                ],
                'required',
            ],
            ['AMOUNT', 'number'],
            ['STATUS_ID', 'in', 'range' => static::$statuses],
            ['TIMESTAMP', 'datetime', 'format' => static::DATETIME_FORMAT_RULE],
        ];
    }

    /**
     * {@inheritdoc}
     */
    public function fields(): array
    {
        return [
            'id',
            'CLIENT_ID',
            'STATUS_ID',
            'CARD_ID',
            'SHOP_ID',
            'AMOUNT',
            'REFUND_ID',
            'TIMESTAMP',
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
        return $this->hasOne(Client::class, ['ID' => 'CLIENT_ID']);
    }

    /**
     * @return ActiveQuery
     */
    public function getCard()
    {
        return $this->hasOne(Card::class, ['ID' => 'CARD_ID']);
    }

    /**
     * @return ActiveQuery
     */
    public function getShop()
    {
        return $this->hasOne(Shop::class, ['id' => 'SHOP_ID']);
    }

    /**
     * @return ActiveQuery
     */
    public function getItems()
    {
        return $this->hasMany(OrderItem::class, ['ORDER_ID' => 'ID']);
    }

    /**
     * @return string
     */
    public function getAddress() : string
    {
        if (isset($this->shop) && !empty($this->shop)) {
            return $address = $this->shop->address;
        }

        return $address ?? '';
    }

    /**
     * @return string
     */
    public function getComment() : string
    {
        return '';
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
        $crmContactRes = Contact::getByClientId($this->CLIENT_ID);
        if (isset($crmContactRes['result'])) {
            $crmContact = reset($crmContactRes['result']);
            if ($crmContact && $this->client && $this->shop) {
                if ($address = $this->shop->address) {
                    $this->client->address = $address;
                }

                if (isset($crmContact['ADDRESS']) && $crmContact['ADDRESS'] != $this->client->address) {
                    $this->client->trigger(Client::EVENT_UPDATED);
                }
            }
        }

        return OrderTrait::collectForCrm($this);
    }
}
