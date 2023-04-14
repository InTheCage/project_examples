<?php

namespace common\models\local;

use Yii;
use yii\db\ActiveRecord;

/**
 * Class CrmCredentials.
 *
 * @property-read int $id
 * @property string $json_data
 * @property string $crm_env
 * @property string $timestamp
 * @property-read array $credentialArray
 */
class CrmCredentials extends ActiveRecord
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
        return 'b2c_crm_credentials';
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
                    'json_data',
                    'crm_env',
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
            'json_data',
            'crm_env',
            'timestamp',
        ];
    }

    /**
     * @return array
     */
    public function getCredentialArray()
    {
        return json_decode($this->json_data, true);
    }
}
