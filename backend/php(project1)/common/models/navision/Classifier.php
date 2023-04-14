<?php

namespace common\models\navision;

/**
 * Class Classifier.
 *
 * @property string $id
 * @property string $name
 */
class Classifier extends AbstractModel
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
                ],
                'required',
            ],
        ];
    }
}
