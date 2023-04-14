<?php

namespace common\models\hybris;

use yii\db\ActiveQuery;

/**
 * Class OrderAddress.
 *
 * @property string $order_id
 * @property int $address_id
 * @property-read  Address $address
 */
class OrderAddress extends AbstractModel
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
                    'address_id',
                ],
                'required',
            ],
        ];
    }

    /**
     * @return ActiveQuery
     */
    public function getAddress()
    {
        return $this->hasOne(Address::class, ['id' => 'address_id']);
    }
}
