<?php

namespace common\models\navision;

/**
 * Class Shop.
 *
 * @property string $id
 * @property string $name
 * @property string $address
 * @property string $format_id
 * @property string $region_id
 */
class Shop extends AbstractModel
{
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
                    'name',
                    'address',
                    'format_id',
                    'region_id',
                ],
                'required',
            ],
        ];
    }
}
