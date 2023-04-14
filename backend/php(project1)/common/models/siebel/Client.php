<?php

namespace common\models\siebel;

use common\models\bitrix\Contact;
use common\models\local\CrmFields;

/**
 * Class Client.
 *
 * @property string $ID
 * @property string $NAME
 * @property string $SURNAME
 * @property string $BIRTHDAY
 * @property string $GENDER
 * @property string $EMAIL
 * @property string $EMAIL_CONFIRMED
 * @property string $EMAIL_COMMUNICATIONS
 * @property string $PHONE
 * @property string $PHONE_CONFIRMED
 * @property string $PHONE_COMMUNICATIONS
 * @property string $USE_EMAIL_FOR_ORDER
 * @property string $EMPLOYEE
 * @property float $BONUSES
 * @property float $STAMPS
 * @property string $TIMESTAMP
 */
class Client extends AbstractModel
{
    /**
     * @var string
     */
    public string $address;

    /**
     * @var array|string[]
     */
    private static array $genders = ['М', 'Ж'];

    /**
     * @var array|string[]
     */
    private static array $yes_no = ['Y', 'N'];

    /**
     * @var array|string[]
     */
    private static array $confirmation = [
        'Подтвержден',
        'Не подтвержден',
    ];

    /**
     * @var array|string[]
     */
    private static array $phoneConfirmation = [
        'Подтвержден',
        'Заблокирован',
        'Неактуален',
        'Откреплен по ТП',
        'Не подтвержден',
    ];

    public const REDIS_IMPORTED_TIMESTAMP = 'clients_datetime';

    public const EVENT_CREATED = self::class . '_created';

    public const EVENT_UPDATED = self::class . '_updated';

    public const EVENT_DELETED = self::class . '_deleted';

    /**
     * {@inheritdoc}
     */
    public static function tableName()
    {
        return 'SIEBEL.B2C_CRM_CLIENT';
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
                    'NAME',
                    'SURNAME',
                    'BIRTHDAY',
                    'GENDER',
                    'EMAIL',
                    'EMAIL_CONFIRMED',
                    'EMAIL_COMMUNICATIONS',
                    'PHONE',
                    'PHONE_CONFIRMED',
                    'PHONE_COMMUNICATIONS',
                    'USE_EMAIL_FOR_ORDER',
                    'EMPLOYEE',
                    'BONUSES',
                    'STAMPS',
                    'TIMESTAMP',
                ],
                'required',
            ],
            [
                [
                    'ID',
                    'NAME',
                    'SURNAME',
                    'GENDER',
                    'EMAIL_CONFIRMED',
                    'PHONE',
                    'PHONE_CONFIRMED',
                    'EMPLOYEE',
                ],
                'string',
            ],
            [
                [
                    'email_communications',
                    'PHONE_COMMUNICATIONS',
                    'USE_EMAIL_FOR_ORDER',
                    'EMPLOYEE',
                ],
                'in', 'range' => static::$yes_no,
            ],
            ['EMAIL', 'email'],
            [['BONUSES', 'STAMPS'], 'number'],
            ['GENDER', 'in', 'range' => static::$genders],
            ['EMAIL_CONFIRMED', 'in', 'range' => static::$confirmation],
            ['PHONE_CONFIRMED', 'in', 'range' => static::$phoneConfirmation],
            ['BIRTHDAY', 'date', 'format' => static::DATE_FORMAT_RULE],
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
            'NAME',
            'SURNAME',
            'BIRTHDAY',
            'GENDER',
            'EMAIL',
            'EMAIL_CONFIRMED',
            'EMAIL_COMMUNICATIONS',
            'PHONE',
            'PHONE_CONFIRMED',
            'PHONE_COMMUNICATIONS',
            'USE_EMAIL_FOR_ORDER',
            'EMPLOYEE',
            'BONUSES',
            'STAMPS',
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
                'addOne',
            ]
        );

        $this->on(
            static::EVENT_UPDATED,
            [
                Contact::class,
                'updateOne',
            ]
        );
    }

    public function setAddress(string $value)
    {
        return $this->address = $value;
    }

    public function getAddress()
    {
        return $this->address;
    }

    /**
     * Mapping to bitrix\Contact.
     *
     * @return array
     */
    public function toCrm()
    {
        $mapped = [
            'NAME' => $this->NAME,
            'LAST_NAME' => $this->SURNAME,
            'BIRTHDATE' => $this->BIRTHDAY,
            'EMAIL' => [
                [
                    'VALUE' => $this->EMAIL,
                    'VALUE_TYPE' => 'HOME',
                ],
            ],
            'PHONE' => [
                [
                    'VALUE' => $this->PHONE,
                    'VALUE_TYPE' => 'HOME',
                ],
            ],
            'OPENED' => 'Y',
            'EXPORT' => 'Y',
            'ADDRESS' => $this->address ?? '',
        ];

        foreach (CrmFields::findAll(['model' => static::class]) as $crmField) {
            if ($crmField->crm_type == 'string') {
                $mapped[$crmField->crm_name] = $this->{strtoupper($crmField->property)};
            } elseif ($crmField->crm_type == 'boolean') {
                switch ($crmField->property) {
                    case 'email_confirmed':
                        $mapped[$crmField->crm_name] =
                            ($this->EMAIL_CONFIRMED == reset(static::$confirmation)) ?
                                1 :
                                0;
                        break;
                    case 'email_communications':
                        $mapped[$crmField->crm_name] =
                            ($this->EMAIL_COMMUNICATIONS == reset(static::$yes_no)) ?
                                1 :
                                0;
                        break;
                    case 'phone_confirmed':
                        $mapped[$crmField->crm_name] =
                            ($this->PHONE_CONFIRMED == reset(static::$phoneConfirmation)) ?
                                1 :
                                0;
                        break;
                    case 'phone_communications':
                        $mapped[$crmField->crm_name] =
                            ($this->PHONE_COMMUNICATIONS == reset(static::$yes_no)) ?
                                1 :
                                0;
                        break;
                    case 'use_email_for_order':
                        $mapped[$crmField->crm_name] =
                            ($this->USE_EMAIL_FOR_ORDER == reset(static::$yes_no)) ?
                                1 :
                                0;
                        break;
                    case 'employee':
                        $mapped[$crmField->crm_name] =
                            ($this->EMPLOYEE == reset(static::$yes_no)) ?
                                1 :
                                0;
                        break;
                    default:
                        break;
                }
            }
        }

        return $mapped;
    }
}
