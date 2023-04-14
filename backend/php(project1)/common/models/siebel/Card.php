<?php

namespace common\models\siebel;

use common\models\bitrix\Contact;

/**
 * Class Card.
 *
 * @property string $ID
 * @property string $OWNER_ID
 * @property string $STATUS_ID
 * @property string $TYPE_ID
 * @property string $BLOCK_REASON
 * @property string $TIMESTAMP
 */
class Card extends AbstractModel
{
    public const REDIS_IMPORTED_TIMESTAMP = 'cards_datetime';

    public const EVENT_CREATED = self::class . '_created';

    public const EVENT_UPDATED = self::class . '_updated';

    public const EVENT_DELETED = self::class . '_deleted';

    /**
     * @var array|string[]
     */
    private static array $statuses = [
        'Загружена',
        'Выдана',
        'Активирована',
        'Заблокирована',
    ];

    /**
     * @var array|string[]
     */
    private static array $types = [
        'Основная',
        'Виртуальная',
        'Семейная',
        'Тинькофф',
    ];

    /**
     * @var array|string[]
     */
    private static array $block_reasons = [
        'Временно заблокирована партнером',
        'Заблокирована партнером',
        'Заблокировано Маркетологом',
        'Заблокировано в CM',
        'Заблокировано в Navision',
        'Заблокировано в ЛК',
        'Заблокировано в МП/Web',
        'Истек срок действия',
        'Нулевой баланс',
        'Обмен в ЛК',
        'Обмен на Кассе',
        'Окончание VIP',
        'Отзыв карты',
        'Утеря',
    ];

    /**
     * {@inheritdoc}
     */
    public static function tableName()
    {
        return 'SIEBEL.B2C_CRM_CARD';
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
                    'OWNER_ID',
                    'STATUS_ID',
                    'TYPE_ID',
                    'BLOCK_REASON',
                    'TIMESTAMP',
                ],
                'required',
            ],
            ['STATUS_ID', 'in', 'range' => static::$statuses],
            ['TYPE_ID', 'in', 'range' => static::$types],
            ['BLOCK_REASON', 'in', 'range' => static::$block_reasons],
            ['TIMESTAMP', 'datetime', 'format' => static::DATETIME_FORMAT_RULE],
        ];
    }

    /**
     * {@inheritdoc}
     */
    public function fields(): array
    {
        return [
            'ID',
            'OWNER_ID',
            'STATUS_ID',
            'TYPE_ID',
            'BLOCK_REASON',
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
                Contact::class,
                'addCardTimelineComment',
            ]
        );

        $this->on(
            static::EVENT_UPDATED,
            [
                Contact::class,
                'addCardTimelineComment',
            ]
        );
    }
}
