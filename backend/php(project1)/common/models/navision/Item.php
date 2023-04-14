<?php

namespace common\models\navision;

use Yii;
use yii\db\ActiveQuery;
use common\models\bitrix\Product;
use common\models\local\CrmFields;

/**
 * Class Item.
 *
 * @property string $id
 * @property string $classifier_id
 * @property string $category_id
 * @property string $name
 * @property int $gravimetric
 * @property float $weight
 * @property int $alcohol
 * @property float $min_price
 * @property-read  Classifier $classifier
 */
class Item extends AbstractModel
{
    public const REDIS_IMPORTED_TIMESTAMP = '';

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
                    'classifier_id',
                    'category_id',
                    'name',
                    'gravimetric',
                    'weight',
                    'alcohol',
                    'min_price',
                ],
                'required',
            ],
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
                Product::class,
                'addOne',
            ]
        );

        $this->on(
            static::EVENT_UPDATED,
            [
                Product::class,
                'updateOne',
            ]
        );
    }

    /**
     * @return ActiveQuery
     */
    public function getClassifier()
    {
        return $this->hasOne(Classifier::class, ['id' => 'classifier_id']);
    }

    /**
     * Mapping to bitrix\Product.
     *
     * @return array
     */
    public function toCrm()
    {
        if (!$catalogId = Product::getCatalogId()) {
            return [];
        }

        $mapped = [
            'iblockId' => $catalogId,
            'iblockSectionId' => 1,
            'xmlId' => $this->id,
            'name' => $this->name,
            'measure' => ($this->gravimetric == 0) ?
                Product::PRODUCT_QUANTITY :
                Product::PRODUCT_WEIGHT,
            'quantity' => Yii::$app->formatter->asDecimal(
                (float) str_replace(',', '.', $this->weight)
            ),
            'PRICE' => Yii::$app->formatter->asDecimal(
                (float) str_replace(',', '.', $this->min_price)
            ),
            'CURRENCY_ID' => 'RUB',
        ];

        $isAlcohol = $isNonAlcohol = '';
        $alcoholField = Product::getProperty(Product::ITEM_ALCOHOL);
        if (isset($alcoholField['result']) && $alcoholField['result']) {
            $alcoholField = reset($alcoholField['result']);
            if (isset($alcoholField['VALUES']) && is_array($alcoholField['VALUES'])) {
                foreach ($alcoholField['VALUES'] as $valueData) {
                    if (isset($valueData['XML_ID'])) {
                        if ($valueData['XML_ID'] == 1) {
                            $isAlcohol = $valueData['ID'];
                        } else {
                            $isNonAlcohol = $valueData['ID'];
                        }
                    }
                }
            }
        }

        foreach (CrmFields::findAll(['model' => static::class]) as $crmField) {
            if ($crmField->property == 'classifier_id') {
                $mapped[$crmField->crm_name] = !empty($this->classifier) ? $this->classifier->name : '';
            } elseif ($crmField->crm_type == 'string') {
                $mapped[$crmField->crm_name] = $this->{$crmField->property};
            } elseif ($crmField->crm_type == 'boolean') {
                if ($crmField->property == 'alcohol') {
                    $mapped[$crmField->crm_name] = ($this->alcohol == 1) ?
                        $isAlcohol :
                        $isNonAlcohol;
                }
            }
        }

        return $mapped;
    }
}
