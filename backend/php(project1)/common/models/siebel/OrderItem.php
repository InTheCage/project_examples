<?php

namespace common\models\siebel;

use yii\db\ActiveQuery;
use common\models\navision\Item;

/**
 * Class OrderItem.
 *
 * @property string $ORDER_ID
 * @property string $ITEM_ID
 * @property float $QUANTITY
 * @property float $PRICE
 * @property float $SUBTOTAL
 * @property float $TOTAL
 * @property-read  Item $item
 */
class OrderItem extends AbstractModel
{
    /**
     * {@inheritdoc}
     */
    public static function tableName()
    {
        return 'SIEBEL.B2C_CRM_ORDER_ITEM';
    }

    /**
     * {@inheritdoc}
     */
    public static function primaryKey()
    {
        return ['ORDER_ID'];
    }

    /**
     * {@inheritdoc}
     */
    public function rules()
    {
        return [
            [
                [
                    'ORDER_ID',
                    'ITEM_ID',
                    'QUANTITY',
                    'PRICE',
                    'SUBTOTAL',
                    'TOTAL',
                ],
                'required',
            ],
            [
                [
                    'QUANTITY',
                    'PRICE',
                    'SUBTOTAL',
                    'TOTAL',
                ],
                'number',
            ],
        ];
    }

    /**
     * {@inheritdoc}
     */
    public function fields(): array
    {
        return [
            'ORDER_ID',
            'ITEM_ID',
            'QUANTITY',
            'PRICE',
            'SUBTOTAL',
            'TOTAL',
        ];
    }

    /**
     * @return ActiveQuery
     */
    public function getItem()
    {
        return $this->hasOne(Item::class, ['id' => 'ITEM_ID']);
    }
}
