<?php

namespace common\models\hybris;

/**
 * Class Address.
 *
 * @property int $id
 * @property int $client_id
 * @property string $value
 * @property string $phone
 * @property string $comment
 * @property int $timestamp
 */
class Address extends AbstractModel
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
                    'client_id',
                    'value',
                    'phone',
                    'comment',
                    'timestamp',
                ],
                'required',
            ],
        ];
    }
}
