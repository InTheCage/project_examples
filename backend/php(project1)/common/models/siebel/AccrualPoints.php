<?php

namespace common\models\siebel;

use common\models\bitrix\Contact;

/**
 * Class AccrualPoints.
 *
 * @property string $ID
 * @property string $CLIENT_ID
 * @property string $TYPE_ID
 * @property float $QUANTITY
 * @property string $TIMESTAMP
 */
class AccrualPoints extends AbstractModel
{
    public const REDIS_IMPORTED_TIMESTAMP = 'accrual_points_datetime';

    public const EVENT_CREATED = self::class . '_created';

    public const EVENT_UPDATED = self::class . '_updated';

    public const EVENT_DELETED = self::class . '_deleted';

    /**
     * {@inheritdoc}
     */
    public static function tableName()
    {
        return 'SIEBEL.B2C_CRM_ACCRUAL_POINTS';
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
                    'TYPE_ID',
                    'QUANTITY',
                    'TIMESTAMP',
                ],
                'required',
            ],
            ['QUANTITY', 'number'],
            ['TIMESTAMP', 'datetime', 'format' => static::DATETIME_FORMAT_RULE],
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
                Contact::class,
                'addAccrualTimelineComment',
            ]
        );
    }
}
