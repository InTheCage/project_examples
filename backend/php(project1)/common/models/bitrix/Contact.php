<?php

namespace common\models\bitrix;

use DateTime;
use yii\base\Event;
use common\traits\Crm;
use common\components\Bitrix;
use common\models\siebel\Client;
use common\models\siebel\AccrualPoints;
use common\models\siebel\AccrualStamps;

class Contact extends Bitrix
{
    public const UF_PREFIX = 'UF_CRM_';

    public const CLIENT_ID = 'CLIENT_ID';

    public const CLIENT_GENDER = 'CLIENT_GENDER';

    public const CLIENT_EMAIL_CONFIRM = 'CLIENT_EMAIL_CONFIRM';

    public const CLIENT_EMAIL_CONFIRM_LABEL = 'Email подтвержден';

    public const CLIENT_EMAIL_COMMUNICATION = 'CLIENT_EMAIL_COMMUNICATION';

    public const CLIENT_EMAIL_COMMUNICATION_LABEL = 'Согласие на коммуникации по Email';

    public const CLIENT_PHONE_CONFIRM = 'CLIENT_PHONE_CONFIRM';

    public const CLIENT_PHONE_CONFIRM_LABEL = 'Телефон подтвержден';

    public const CLIENT_PHONE_COMMUNICATION = 'CLIENT_PHONE_COMMUNICATION';

    public const CLIENT_PHONE_COMMUNICATION_LABEL = 'Согласие на коммуникации по телефону';

    public const CLIENT_EMAIL_FOR_ORDER = 'CLIENT_EMAIL_FOR_ORDER';

    public const CLIENT_EMAIL_FOR_ORDER_LABEL = 'Отправка чека по Email';

    public const CLIENT_EMPLOYEE = 'CLIENT_EMPLOYEE';

    public const CLIENT_EMPLOYEE_LABEL = 'Статус сотрудника';

    public const CLIENT_BONUSES = 'CLIENT_BONUSES';

    public const CLIENT_STAMPS = 'CLIENT_STAMPS';

    public const CLIENT_MODIFIED = 'CLIENT_MODIFIED';

    /**
     * Дополнительные поля.
     *
     * @return array
     */
    public static function additionalFields()
    {
        return [
            'id' => [
                'FIELD_NAME' => static::CLIENT_ID,
                'EDIT_FORM_LABEL' => 'Внутренний ID',
                'LIST_COLUMN_LABEL' => 'Внутренний ID',
                'USER_TYPE_ID' => 'string',
                'XML_ID' => static::CLIENT_ID,
            ],
            'gender' => [
                'FIELD_NAME' => static::CLIENT_GENDER,
                'EDIT_FORM_LABEL' => 'Пол',
                'LIST_COLUMN_LABEL' => 'Пол',
                'USER_TYPE_ID' => 'string',
                'XML_ID' => static::CLIENT_GENDER,
            ],
            'email_confirmed' => [
                'FIELD_NAME' => static::CLIENT_EMAIL_CONFIRM,
                'EDIT_FORM_LABEL' => static::CLIENT_EMAIL_CONFIRM_LABEL,
                'LIST_COLUMN_LABEL' => static::CLIENT_EMAIL_CONFIRM_LABEL,
                'USER_TYPE_ID' => 'boolean',
                'XML_ID' => static::CLIENT_EMAIL_CONFIRM,
                'SETTINGS' => [
                    'DEFAULT_VALUE' => 0,
                    'DISPLAY' => 'RADIO',
                    'LABEL_CHECKBOX' => static::CLIENT_EMAIL_CONFIRM_LABEL,
                ],
            ],
            'email_communications' => [
                'FIELD_NAME' => static::CLIENT_EMAIL_COMMUNICATION,
                'EDIT_FORM_LABEL' => static::CLIENT_EMAIL_COMMUNICATION_LABEL,
                'LIST_COLUMN_LABEL' => static::CLIENT_EMAIL_COMMUNICATION_LABEL,
                'USER_TYPE_ID' => 'boolean',
                'XML_ID' => static::CLIENT_EMAIL_COMMUNICATION,
                'SETTINGS' => [
                    'DEFAULT_VALUE' => 0,
                    'DISPLAY' => 'RADIO',
                    'LABEL_CHECKBOX' => static::CLIENT_EMAIL_COMMUNICATION_LABEL,
                ],
            ],
            'phone_confirmed' => [
                'FIELD_NAME' => static::CLIENT_PHONE_CONFIRM,
                'EDIT_FORM_LABEL' => static::CLIENT_PHONE_CONFIRM_LABEL,
                'LIST_COLUMN_LABEL' => static::CLIENT_PHONE_CONFIRM_LABEL,
                'USER_TYPE_ID' => 'boolean',
                'XML_ID' => static::CLIENT_PHONE_CONFIRM,
                'SETTINGS' => [
                    'DEFAULT_VALUE' => 0,
                    'DISPLAY' => 'RADIO',
                    'LABEL_CHECKBOX' => static::CLIENT_PHONE_CONFIRM_LABEL,
                ],
            ],
            'phone_communications' => [
                'FIELD_NAME' => static::CLIENT_PHONE_COMMUNICATION,
                'EDIT_FORM_LABEL' => static::CLIENT_PHONE_COMMUNICATION_LABEL,
                'LIST_COLUMN_LABEL' => static::CLIENT_PHONE_COMMUNICATION,
                'USER_TYPE_ID' => 'boolean',
                'XML_ID' => static::CLIENT_PHONE_COMMUNICATION,
                'SETTINGS' => [
                    'DEFAULT_VALUE' => 0,
                    'DISPLAY' => 'RADIO',
                    'LABEL_CHECKBOX' => static::CLIENT_PHONE_COMMUNICATION,
                ],
            ],
            'use_email_for_order' => [
                'FIELD_NAME' => static::CLIENT_EMAIL_FOR_ORDER,
                'EDIT_FORM_LABEL' => static::CLIENT_EMAIL_FOR_ORDER_LABEL,
                'LIST_COLUMN_LABEL' => static::CLIENT_EMAIL_FOR_ORDER_LABEL,
                'USER_TYPE_ID' => 'boolean',
                'XML_ID' => static::CLIENT_EMAIL_FOR_ORDER,
                'SETTINGS' => [
                    'DEFAULT_VALUE' => 0,
                    'DISPLAY' => 'RADIO',
                    'LABEL_CHECKBOX' => static::CLIENT_EMAIL_FOR_ORDER_LABEL,
                ],
            ],
            'employee' => [
                'FIELD_NAME' => static::CLIENT_EMPLOYEE,
                'EDIT_FORM_LABEL' => static::CLIENT_EMPLOYEE_LABEL,
                'LIST_COLUMN_LABEL' => static::CLIENT_EMPLOYEE_LABEL,
                'USER_TYPE_ID' => 'boolean',
                'XML_ID' => static::CLIENT_EMPLOYEE,
                'SETTINGS' => [
                    'DEFAULT_VALUE' => 0,
                    'DISPLAY' => 'RADIO',
                    'LABEL_CHECKBOX' => static::CLIENT_EMPLOYEE_LABEL,
                ],
            ],
            'bonuses' => [
                'FIELD_NAME' => static::CLIENT_BONUSES,
                'EDIT_FORM_LABEL' => 'Баланс бонусов',
                'LIST_COLUMN_LABEL' => 'Баланс бонусов',
                'USER_TYPE_ID' => 'string',
                'XML_ID' => static::CLIENT_BONUSES,
            ],
            'stamps' => [
                'FIELD_NAME' => static::CLIENT_STAMPS,
                'EDIT_FORM_LABEL' => 'Баланс марок',
                'LIST_COLUMN_LABEL' => 'Баланс марок',
                'USER_TYPE_ID' => 'string',
                'XML_ID' => static::CLIENT_STAMPS,
            ],
            'timestamp' => [
                'FIELD_NAME' => static::CLIENT_MODIFIED,
                'EDIT_FORM_LABEL' => 'Дата изменения',
                'LIST_COLUMN_LABEL' => 'Дата изменения',
                'USER_TYPE_ID' => 'string',
                'XML_ID' => static::CLIENT_MODIFIED,
            ],
        ];
    }

    /**
     * Добавить UF_CRM_* поле для Контакта.
     *
     * @param array $field
     *
     * @return mixed
     */
    public static function addFields(array $field)
    {
        return Crm::publicCall(
            'crm.contact.userfield.add',
            [
                'fields' => $field,
            ]
        );
    }

    /**
     * Получить список контактов.
     *
     * @param array $select
     *
     * @return mixed
     */
    public static function getAll(array $select = [])
    {
        $UF_ClientId = static::UF_PREFIX . static::CLIENT_ID;
        if (empty($select)) {
            $select = [
                'ID',
                $UF_ClientId,
            ];
        }

        return Crm::publicCall(
            'crm.contact.list',
            [
                'filter' => [
                    '!' . $UF_ClientId => '',
                ],
                'select' => $select,
            ]
        );
    }

    /**
     * Получить Контакт по Client.ID.
     *
     * @param string $clientId
     * @param array  $select
     *
     * @return mixed
     */
    public static function getByClientId(string $clientId, array $select = [])
    {
        if (empty($select)) {
            $select = [
                'ID',
                'PHONE',
                'ADDRESS',
            ];
        }

        return Crm::publicCall(
            'crm.contact.list',
            [
                'filter' => [
                    self::UF_PREFIX . self::CLIENT_ID => $clientId,
                ],
                'select' => $select,
            ]
        );
    }

    /**
     * Получить Контакт по Client.PHONE.
     *
     * @param string $clientPhone
     * @param array  $select
     *
     * @return mixed
     */
    public static function getByClientPhone(string $clientPhone, array $select = [])
    {
        if (empty($select)) {
            $select = [
                'ID',
                static::UF_PREFIX . static::CLIENT_ID,
            ];
        }

        return Crm::publicCall(
            'crm.contact.list',
            [
                'filter' => [
                    'PHONE' => $clientPhone,
                ],
                'select' => $select,
            ]
        );
    }

    /**
     * Добавить контакт
     *
     * Client::EVENT_CREATED.
     *
     * @param Event $event
     *
     * @return bool
     */
    public static function addOne(Event $event)
    {
        /** @var Client $client */
        if ($client = $event->sender) {
            $crmContactRes = static::getByClientId($client->ID);
            if (!empty($crmContactRes['result'])) {
                $crmContact = reset($crmContactRes['result']);
                if (!empty($crmContact['ID'])) {
                    return false;
                }
            }

            Crm::publicCall(
                'crm.contact.add',
                [
                    'fields' => $client->toCrm(),
                ]
            );

            return true;
        }

        return false;
    }

    /**
     * Обновить контакт
     *
     * Client::EVENT_UPDATED.
     *
     * @param Event $event
     *
     * @return bool
     */
    public static function updateOne(Event $event)
    {
        if ($client = $event->sender) {
            $crmContactRes = static::getByClientId($client->ID);
            if (empty($crmContactRes['result'])) {
                return false;
            }

            $crmContact = reset($crmContactRes['result']);
            if (empty($crmContact['ID'])) {
                return false;
            }

            Crm::publicCall(
                'crm.contact.update',
                [
                    'id' => $crmContact['ID'],
                    'fields' => $client->toCrm(),
                ]
            );

            return true;
        }

        return false;
    }

    /**
     * Добавить комментарий в timeline Контакта.
     *
     * @param string $clientId
     * @param string $comment
     *
     * @return mixed
     */
    public static function addTimelineComment(string $clientId, string $comment)
    {
        $crmContactRes = static::getByClientId($clientId);
        if (empty($crmContactRes['result'])) {
            return false;
        }

        $crmContact = reset($crmContactRes['result']);
        if (empty($crmContact['ID'])) {
            return false;
        }

        return Crm::publicCall(
            'crm.timeline.comment.add',
            [
                'fields' => [
                    'ENTITY_ID' => $crmContact['ID'],
                    'ENTITY_TYPE' => 'contact',
                    'COMMENT' => $comment,
                ],
            ]
        );
    }

    /**
     * Card::EVENT_CREATED.
     * Card::EVENT_UPDATED.
     *
     * @param Event $event
     *
     * @return bool
     */
    public static function addCardTimelineComment(Event $event)
    {
        if ($cardData = $event->sender->getAttributes()) {
            $crmContactRes = static::getByClientId($cardData['OWNER_ID']);
            if (!empty($crmContactRes['result']) && reset($crmContactRes['result'])) {
                $comment = "{$cardData['ID']} карта клиента . ";
                $comment .= "Тип - {$cardData['TYPE_ID']}, статус - {$cardData['STATUS_ID']}" . PHP_EOL;

                if ($cardData['BLOCK_REASON']) {
                    $comment .= "Заблокирована по причине: {$cardData['BLOCK_REASON']}" . PHP_EOL;
                }

                $comment .= DateTime::createFromFormat(
                    'd-m-Y H:i:s',
                    $cardData['TIMESTAMP']
                )->format('d.m.Y H:i:s');

                static::addTimelineComment($cardData['OWNER_ID'], $comment);

                return true;
            }
        }

        return false;
    }

    /**
     * AccrualPoints::EVENT_CREATED.
     * AccrualStamps::EVENT_CREATED.
     *
     * @param Event $event
     *
     * @return bool
     */
    public static function addAccrualTimelineComment(Event $event)
    {
        switch ($event->name) {
            case AccrualPoints::EVENT_CREATED:
            case AccrualPoints::EVENT_UPDATED:
                $accrualType = 'баллов';
                break;
            case AccrualStamps::EVENT_CREATED:
            case AccrualStamps::EVENT_UPDATED:
                $accrualType = 'марок';
                break;
            default:
                $accrualType = '';
                break;
        }

        if ($accrualData = $event->sender->getAttributes()) {
            $crmContactRes = static::getByClientId($accrualData['CLIENT_ID']);
            if (!empty($crmContactRes['result']) && reset($crmContactRes['result'])) {
                $comment = "Транзакция {$accrualData['ID']}. ";
                $comment .= "Перевод {$accrualData['QUANTITY']} {$accrualType} ({$accrualData['TYPE_ID']}). " . PHP_EOL;
                $comment .= DateTime::createFromFormat(
                        'd-m-Y H:i:s',
                        $accrualData['TIMESTAMP']
                    )->format('d.m.Y H:i:s');

                static::addTimelineComment($accrualData['CLIENT_ID'], $comment);

                return true;
            }
        }

        return false;
    }
}
