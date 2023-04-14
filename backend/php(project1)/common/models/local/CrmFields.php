<?php

namespace common\models\local;

use Yii;
use yii\db\ActiveRecord;

/**
 * Class CrmFields.
 *
 * @property-read int $id
 * @property string $crm_name
 * @property string $crm_type
 * @property string $model
 * @property string $property
 * @property-read string $timestamp
 */
class CrmFields extends ActiveRecord
{
    /**
     * {@inheritdoc}
     */
    public static function getDb()
    {
        return Yii::$app->db;
    }

    /**
     * {@inheritdoc}
     */
    public static function tableName()
    {
        return 'b2c_crm_fields';
    }

    /**
     * {@inheritdoc}
     */
    public static function primaryKey()
    {
        return ['id'];
    }

    /**
     * {@inheritdoc}
     */
    public function rules()
    {
        return [
            [
                [
                    'crm_name',
                    'crm_type',
                    'model',
                    'property',
                ],
                'required',
            ],
        ];
    }

    /**
     * {@inheritdoc}
     */
    public function fields(): array
    {
        return [
            'id',
            'crm_name',
            'crm_type',
            'model',
            'property',
            'timestamp',
        ];
    }
}
