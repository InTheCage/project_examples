<?php

namespace common\models\express;

use yii\db\ActiveQuery;
use common\models\navision\Item;

/**
 * Class OrderItem.
 *
 * @property string $order_id
 * @property string $item_id
 * @property float $quantity
 * @property float $price
 * @property float $subtotal
 * @property float $total
 * @property-read  Item $item
 */
class OrderItem extends AbstractModel
{
    /**
     * {@inheritdoc}
     */
    public function rules()
    {
        return [
            [
                [
                    'order_id',
                    'item_id',
                    'quantity',
                    'price',
                    'subtotal',
                    'total',
                ],
                'required',
            ],
        ];
    }

    /**
     * @return ActiveQuery
     */
    public function getItem()
    {
        return $this->hasOne(Item::class, ['id' => 'item_id']);
    }
}
