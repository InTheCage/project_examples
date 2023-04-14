<?php

namespace common\traits;

use Yii;
use DateTime;
use common\models\bitrix\Deal;
use common\models\bitrix\Contact;
use common\models\bitrix\Product;
use common\models\local\CrmFields;
use common\models\hybris\Order as HybrisOrder;
use common\models\siebel\Order as SiebelOrder;
use common\models\express\Order as ExpressOrder;
use common\models\hybris\OrderItem as HybrisOrderItem;
use common\models\siebel\OrderItem as SiebelOrderItem;
use common\models\express\OrderItem as ExpressOrderItem;

/**
 * Trait OrderTrait.
 */
trait OrderTrait
{
    /**
     * @param SiebelOrder|ExpressOrder|HybrisOrder $order
     *
     * @return array
     */
    public static function collectForCrm($order)
    {
        $crmContact = Contact::getByClientId($order->CLIENT_ID ?? $order->client_id);
        if (isset($crmContact['result']) && !empty($crmContact['result'])) {
            $crmContact = reset($crmContact['result']);
            $crmContactId = isset($crmContact['ID']) ? $crmContact['ID'] : '';
        } else {
            Yii::warning(
                'OrderTrait->collectForCrm CRM response: ' .
                json_encode($crmContact) .
                PHP_EOL
            );
        }

        $orderAmount = $order->AMOUNT ?? $order->amount;
        $orderDate = DateTime::createFromFormat(
            'd-m-Y H:i:s',
            $order->TIMESTAMP ?? $order->timestamp
        )->format('Y-m-d');

        $mapped = [
            'ORIGIN_ID' => $order->ID ?? $order->id,
            'TITLE' => $order->ID ?? $order->id,
            'OPPORTUNITY' => Yii::$app->formatter->asDecimal(
                (float) str_replace(',', '.', $orderAmount)
            ),
            'IS_MANUAL_OPPORTUNITY' => 'Y',
            'CURRENCY_ID' => 'RUB',
            'BEGINDATE' => $orderDate,
            'CLOSEDATE' => $orderDate,
            'IS_NEW' => 'N',
            'CLOSED' => 'Y',
            'STAGE_ID' => 'WON',
            'TYPE_ID' => 'GOODS',
            'COMMENTS' => $order->comment ?? '',
            'CONTACT_IDS' => [isset($crmContactId) ? $crmContactId : ''],
        ];

        foreach (CrmFields::findAll(['model' => Deal::class]) as $crmField) {
            if ($crmField->crm_type == 'string') {
                $mapped[$crmField->crm_name] = $order->{$crmField->property} ?? $order->{strtoupper($crmField->property)};
            }
        }

        return $mapped;
    }

    /**
     * @param SiebelOrder|ExpressOrder|HybrisOrder $order
     *
     * @return array
     */
    public static function collectItemsForCrm($order)
    {
        if ($order->items) {
            /** @var SiebelOrderItem|ExpressOrderItem|HybrisOrderItem $orderItem */
            foreach ($order->items as $orderItem) {
                $crmProduct = Product::getByItemId($orderItem->ITEM_ID ?? $orderItem->item_id);
                if (isset($crmProduct['result']) && !empty($crmProduct['result'])) {
                    $crmProduct = reset($crmProduct['result']);
                    $crmProductId = isset($crmProduct['ID']) ? $crmProduct['ID'] : '';
                } else {
                    return [];
                }

                if (isset($crmProductId) && !empty($crmProductId)) {
                    $quantity = Yii::$app->formatter->asDecimal(
                            (float) str_replace(',', '.', $orderItem->QUANTITY)
                        ) ??
                        Yii::$app->formatter->asDecimal(
                            (float) str_replace(',', '.', $orderItem->quantity)
                        );

                    $priceAfterDiscount = Yii::$app->formatter->asDecimal(
                            ($quantity != 0 && $orderItem->QUANTITY) ?
                                (float) (str_replace(',', '.', $orderItem->TOTAL) / $quantity) : 0
                        ) ??
                        Yii::$app->formatter->asDecimal(
                            ($quantity != 0 && $orderItem->quantity) ?
                                (float) (str_replace(',', '.', $orderItem->total) / $quantity) : 0
                        );

                    $priceRegular = Yii::$app->formatter->asDecimal(
                            (float) str_replace(',', '.', $orderItem->PRICE)
                        ) ??
                        Yii::$app->formatter->asDecimal(
                            (float) str_replace(',', '.', $orderItem->price)
                        );

                    $orderSubtotal = Yii::$app->formatter->asDecimal(
                            (float) str_replace(',', '.', $orderItem->SUBTOTAL)
                        ) ??
                        Yii::$app->formatter->asDecimal(
                            (float) str_replace(',', '.', $orderItem->subtotal)
                        );

                    $orderTotal = Yii::$app->formatter->asDecimal(
                            (float) str_replace(',', '.', $orderItem->TOTAL)
                        ) ??
                        Yii::$app->formatter->asDecimal(
                            (float) str_replace(',', '.', $orderItem->total)
                        );

                    $totalDiscount = $orderSubtotal - $orderTotal;
                    $itemDiscount = ($quantity != 0) ? $totalDiscount / $quantity : 0;

                    $items[] = [
                        'PRODUCT_ID' => $crmProductId,
                        'PRICE' => $priceAfterDiscount ?? $priceRegular,
                        'PRICE_NETTO' => $priceRegular,
                        'PRICE_BRUTTO' => $priceRegular,
                        'PRICE_EXCLUSIVE' => $priceAfterDiscount ?? $priceRegular,
                        'PRICE_ACCOUNT' => $priceAfterDiscount ?? $priceRegular,
                        'QUANTITY' => $quantity,
                        'DISCOUNT_TYPE_ID' => Deal::DISCOUNT_RUB_ID,
                        'DISCOUNT_RATE' => Yii::$app->formatter->asDecimal(
                            (float) str_replace(',', '.', $itemDiscount)
                        ),
                        'DISCOUNT_SUM' => Yii::$app->formatter->asDecimal(
                            (float) str_replace(',', '.', $totalDiscount)
                        ),
                        'MEASURE_CODE' => ($orderItem->item->gravimetric == 0) ?
                            Deal::MEASURE_QUANTITY_ID :
                            Deal::MEASURE_WEIGHT_ID,
                        'MEASURE_NAME' => ($orderItem->item->gravimetric == 0) ?
                            Deal::MEASURE_QUANTITY :
                            Deal::MEASURE_WEIGHT,
                    ];
                }
            }
        }

        return $items ?? [];
    }

    /**
     * @param SiebelOrder|ExpressOrder|HybrisOrder $order
     *
     * @return string
     */
    public static function collectAddress($order)
    {
        if (isset($order->order_address, $order->order_address->address) && !empty($order->order_address->address)) {
            $address = $order->order_address->address->value;
        }

        return $address ?? '';
    }

    /**
     * @param SiebelOrder|ExpressOrder|HybrisOrder $order
     *
     * @return string
     */
    public static function collectComment($order): string
    {
        if (isset($order->order_address, $order->order_address->address) && !empty($order->order_address->address)) {
            $comment = $order->order_address->address->comment . PHP_EOL;
            if ($phone = $order->order_address->address->comment) {
                $comment .= 'Телефон ' . $phone;
            }
        }

        return $comment ?? '';
    }
}
