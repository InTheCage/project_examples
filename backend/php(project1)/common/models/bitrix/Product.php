<?php

namespace common\models\bitrix;

use yii\base\Event;
use common\traits\Crm;
use common\components\Bitrix;

class Product extends Bitrix
{
    public const UF_PREFIX = 'PROPERTY_';

    public const ITEM_CLASSIFIER = 'ITEM_CLASSIFIER';

    public const ITEM_CATEGORY = 'ITEM_CATEGORY';

    public const ITEM_ALCOHOL = 'ITEM_ALCOHOL';

    public const PRODUCT_WEIGHT = 7;

    public const PRODUCT_QUANTITY = 9;

    /**
     * Дополнительные поля.
     *
     * @return array
     */
    public static function additionalFields()
    {
        if (!$catalogId = self::getCatalogId()) {
            return [];
        }

        return [
            'classifier_id' => [
                'IBLOCK_ID' => $catalogId,
                'ACTIVE' => 'Y',
                'PROPERTY_TYPE' => 'S',
                'FIELD_NAME' => static::ITEM_CLASSIFIER,
                'NAME' => 'Классификатор',
                'XML_ID' => static::ITEM_CLASSIFIER,
            ],
            'category_id' => [
                'IBLOCK_ID' => $catalogId,
                'ACTIVE' => 'Y',
                'PROPERTY_TYPE' => 'S',
                'FIELD_NAME' => static::ITEM_CATEGORY,
                'NAME' => 'Категория',
                'XML_ID' => static::ITEM_CATEGORY,
            ],
            'alcohol' => [
                'IBLOCK_ID' => $catalogId,
                'ACTIVE' => 'Y',
                'PROPERTY_TYPE' => 'L',
                'FIELD_NAME' => static::ITEM_ALCOHOL,
                'NAME' => 'Алкоголь',
                'XML_ID' => static::ITEM_ALCOHOL,
                'VALUES' => [
                    0 => [
                        'VALUE' => 'нет',
                        'XML_ID' => -1,
                        'DEF' => 'Y',
                    ],
                    1 => [
                        'VALUE' => 'да',
                        'XML_ID' => 1,
                    ],
                ],
            ],
        ];
    }

    /**
     * Добавить свойство Товара.
     *
     * @param array $field
     *
     * @return mixed
     */
    public static function addProperty(array $field)
    {
        return Crm::publicCall(
            'crm.product.property.add',
            [
                'fields' => $field,
            ]
        );
    }

    /**
     * Получить свойство Товара по имени.
     *
     * @param string $property
     *
     * @return mixed
     */
    public static function getProperty(string $property)
    {
        return Crm::publicCall(
            'crm.product.property.list',
            [
                'filter' => [
                    'XML_ID' => $property,
                ],
            ]
        );
    }

    /**
     * Список каталогов товаров.
     *
     * @return mixed
     */
    public static function getCatalog()
    {
        return Crm::publicCall('crm.catalog.list');
    }

    /**
     * ID каталога товаров.
     *
     * @return string
     */
    public static function getCatalogId()
    {
        $catalog = static::getCatalog();
        if (!isset($catalog['result'])) {
            return '';
        }

        $catalog = reset($catalog['result']);
        if (isset($catalog['ID'])) {
            return $catalog['ID'];
        }

        return '';
    }

    /**
     * Получить Товар по Item.id.
     *
     * @param string $itemId
     * @param array  $select
     *
     * @return mixed
     */
    public static function getByItemId(string $itemId, array $select = [])
    {
        if (empty($select)) {
            $select = ['ID'];
        }

        return Crm::publicCall(
            'crm.product.list',
            [
                'filter' => [
                    'XML_ID' => $itemId,
                ],
                'select' => $select,
                'start' => -1,
            ]
        );
    }

    /**
     * Добавить Товар
     *
     * Item::EVENT_CREATED.
     *
     * @param Event $event
     *
     * @return bool
     */
    public static function addOne(Event $event)
    {
        if ($item = $event->sender) {
            $crmProductRes = self::getByItemId($item->id);
            if (!empty($crmProductRes['result'])) {
                $crmProduct = reset($crmProductRes['result']);
                if (!empty($crmProduct['ID'])) {
                    return false;
                }
            }

            Crm::publicCall(
                'catalog.product.add',
                [
                    'fields' => $item->toCrm(),
                ]
            );

            static::setAttributes($item->toCrm());

            return true;
        }

        return false;
    }

    /**
     * Обновить Товар
     *
     * Item::EVENT_UPDATED.
     *
     * @param Event $event
     *
     * @return bool
     */
    public static function updateOne(Event $event)
    {
        if ($item = $event->sender) {
            $crmProductRes = self::getByItemId($item->id);
            if (empty($crmProductRes['result'])) {
                return false;
            }

            $crmProduct = reset($crmProductRes['result']);
            if (empty($crmProduct['ID'])) {
                return false;
            }

            Crm::publicCall(
                'catalog.product.update',
                [
                    'id' => $crmProduct['ID'],
                    'fields' => $item->toCrm(),
                ]
            );

            static::setAttributes($item->toCrm(), $crmProduct['ID']);

            return true;
        }

        return false;
    }

    /**
     * Добавить price, currency, properties Товара.
     *
     * @param array       $itemToCrmData
     * @param null|string $productId
     *
     * @return mixed
     */
    public static function setAttributes(array $itemToCrmData, string $productId = null)
    {
        if ($productId == null) {
            if (!isset($itemToCrmData['xmlId']) || empty($itemToCrmData['xmlId'])) {
                return false;
            }

            $crmProductRes = self::getByItemId($itemToCrmData['xmlId']);
            if (!isset($crmProductRes['result'])) {
                return false;
            }

            $crmProduct = reset($crmProductRes['result']);
            if (!$crmProduct || !isset($crmProduct['ID']) || empty($crmProduct['ID'])) {
                return false;
            }
        }

        return Crm::publicCall(
            'crm.product.update',
            [
                'id' => $productId ?? $crmProduct['ID'],
                'fields' => $itemToCrmData,
            ]
        );
    }
}
