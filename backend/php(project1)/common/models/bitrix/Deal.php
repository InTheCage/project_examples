<?php

namespace common\models\bitrix;

use yii\base\Event;
use common\traits\Crm;
use common\components\Bitrix;
use common\models\hybris\Order as HybrisOrder;
use common\models\siebel\Order as SiebelOrder;
use common\models\express\Order as ExpressOrder;

class Deal extends Bitrix
{
    public const MEASURE_WEIGHT = 'шт';

    public const MEASURE_QUANTITY = 'кг';

    public const MEASURE_WEIGHT_ID = 166;

    public const MEASURE_QUANTITY_ID = 796;

    public const DISCOUNT_RUB_ID = 1;

    public const DISCOUNT_PERCENT_ID = 2;

    public const UF_PREFIX = 'UF_CRM_';

    public const DEAL_CARD = 'DEAL_CARD';

    public const DEAL_SHOP = 'DEAL_SHOP';

    public const DEAL_STATUS = 'DEAL_STATUS';

    public const DEAL_ADDRESS = 'DEAL_ADDRESS';

    /**
     * Дополнительные поля.
     *
     * @return array
     */
    public static function additionalFields()
    {
        return [
            'card_id' => [
                'FIELD_NAME' => static::DEAL_CARD,
                'EDIT_FORM_LABEL' => 'ID карты',
                'LIST_COLUMN_LABEL' => 'ID карты',
                'USER_TYPE_ID' => 'string',
                'XML_ID' => static::DEAL_CARD,
            ],
            'shop_id' => [
                'FIELD_NAME' => static::DEAL_SHOP,
                'EDIT_FORM_LABEL' => 'ID магазина',
                'LIST_COLUMN_LABEL' => 'ID магазина',
                'USER_TYPE_ID' => 'string',
                'XML_ID' => static::DEAL_SHOP,
            ],
            'status_id' => [
                'FIELD_NAME' => static::DEAL_STATUS,
                'EDIT_FORM_LABEL' => 'Статус заказа',
                'LIST_COLUMN_LABEL' => 'Статус заказа',
                'USER_TYPE_ID' => 'string',
                'XML_ID' => static::DEAL_STATUS,
            ],
            'address' => [
                'FIELD_NAME' => static::DEAL_ADDRESS,
                'EDIT_FORM_LABEL' => 'Адрес доставки',
                'LIST_COLUMN_LABEL' => 'Адрес доставки',
                'USER_TYPE_ID' => 'string',
                'XML_ID' => static::DEAL_ADDRESS,
            ],
        ];
    }

    /**
     * Добавить UF_CRM_* поле для Сделки.
     *
     * @param array $field
     *
     * @return mixed
     */
    public static function addFields(array $field)
    {
        return Crm::publicCall(
            'crm.deal.userfield.add',
            [
                'fields' => $field,
            ]
        );
    }

    /**
     * Получить Сделку по Order.id.
     *
     * @param string $orderId
     *
     * @return mixed
     */
    public static function getByOrderId(string $orderId)
    {
        return Crm::publicCall(
            'crm.deal.list',
            [
                'filter' => [
                    'ORIGIN_ID' => $orderId,
                ],
                'select' => ['ID'],
            ]
        );
    }

    /**
     * Создать Сделку.
     *
     * siebel|hybris|express\Order::EVENT_CREATED.
     *
     * @param Event $event
     *
     * @return bool
     */
    public static function addOne(Event $event)
    {
        /** @var HybrisOrder|SiebelOrder|ExpressOrder $order */
        if ($order = $event->sender) {
            if (empty($order->items)) {
                return false;
            }

            if (is_a($order, SiebelOrder::class) && $order->REFUND_ID) {
                $comment = "{$order->ID} Возврат товаров по чеку {$order->REFUND_ID}" . PHP_EOL;
                $comment .= "На сумму {$order->AMOUNT}" . PHP_EOL;
                $comment .= "{$order->TIMESTAMP}";

                static::addTimelineComment($order->ID, $comment);
            } else {
                $crmDeal = static::getByOrderId($order->ID);
                if (!empty($crmDeal['result'])) {
                    $crmDeal = reset($crmDeal['result']);
                    if (!empty($crmDeal['ID'])) {
                        return false;
                    }
                }

                $orderCrmData = $order->toCrm();
                $dealRes = Crm::publicCall(
                    'crm.deal.add',
                    [
                        'fields' => $orderCrmData,
                    ]
                );

                if (isset($dealRes['result']) && is_int($dealRes['result'])) {
                    static::addProducts($dealRes['result'], $order->toCrmItems());
                }
            }

            return true;
        }

        return false;
    }

    /**
     * Обновить Сделку.
     *
     * siebel|hybris|express\Order::EVENT_UPDATED.
     *
     * @param Event $event
     *
     * @return bool
     */
    public static function updateOne(Event $event)
    {
        /** @var HybrisOrder|SiebelOrder|ExpressOrder $order */
        if ($order = $event->sender) {
            if (empty($order->items)) {
                return false;
            }

            $dealRes = static::addProducts(0, $order->toCrmItems(), $order);
            if (isset($dealRes['result']) && $dealRes['result']) {
                $orderCrmData = $order->toCrm();
                $crmDealRes = static::getByOrderId($orderCrmData['ORIGIN_ID']);
                if (!isset($crmDealRes['result'])) {
                    return false;
                }

                $crmDeal = reset($crmDealRes['result']);
                if (empty($crmDeal['ID'])) {
                    return false;
                }

                return Crm::publicCall(
                    'crm.deal.update',
                    [
                        'id' => $crmDeal['ID'],
                        'fields' => $orderCrmData,
                    ],
                );
            }

            return true;
        }

        return false;
    }

    /**
     * Добавить товары в Сделку.
     *
     * @param int                                       $dealId
     * @param array                                     $products
     * @param SiebelOrder|ExpressOrder|HybrisOrder|null $order
     *
     * @return mixed
     */
    public static function addProducts(int $dealId, array $products, $order = null)
    {
        if ($dealId == 0 && $order != null) {
            /** @var SiebelOrder|ExpressOrder|HybrisOrder $order */
            $crmDealRes = static::getByOrderId($order->ID ?? $order->id);
            if (!isset($crmDealRes['result'])) {
                return false;
            }

            $crmDeal = reset($crmDealRes['result']);
            if (empty($crmDeal) || !isset($crmDeal['ID'])) {
                return false;
            }

            $dealId = $crmDeal['ID'];
        }

        if ($dealId) {
            return Crm::publicCall(
                'crm.deal.productrows.set',
                [
                    'id' => $dealId,
                    'rows' => $products,
                ]
            );
        }

        return false;
    }

    /**
     * Добавить комментарий в timeline Сделки.
     *
     * @param string $orderId
     * @param string $comment
     *
     * @return mixed
     */
    public static function addTimelineComment(string $orderId, string $comment)
    {
        $crmDealRes = static::getByOrderId($orderId);
        if (!isset($crmDealRes['result'])) {
            return false;
        }

        $crmDeal = reset($crmDealRes['result']);
        if (!$crmDeal || !isset($crmDeal['ID'])) {
            return false;
        }

        return Crm::publicCall(
            'crm.timeline.comment.add',
            [
                'fields' => [
                    'ENTITY_ID' => $crmDeal['ID'],
                    'ENTITY_TYPE' => 'deal',
                    'COMMENT' => $comment,
                ],
            ]
        );
    }
}
