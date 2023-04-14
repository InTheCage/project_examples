<?php

namespace common\models\hybris;

use Yii;
use yii\db\Connection;
use yii\db\ActiveRecord;
use yii\db\Expression;

abstract class AbstractModel extends ActiveRecord
{
    /**
     * {@inheritdoc}
     */
    public static function getDb(): ?Connection
    {
        # TODO: fix connection
        return Yii::$app->db;
    }

    /**
     * @return array|ActiveRecord[]
     */
    protected static function getForImport()
    {
        if (Yii::$app->redis->exists(static::REDIS_IMPORTED_TIMESTAMP) == '0') {
            return static::find()
                ->orderBy('TIMESTAMP ASC')
                ->all();
        }

        $entityTimestamp = new Expression(
            "to_timestamp('" .
            Yii::$app->redis->get(static::REDIS_IMPORTED_TIMESTAMP) .
            "', 'yyyy-mm-dd hh24:mi:ss')"
        );

        return static::find()
            ->where(
                [
                    '>=',
                    'TIMESTAMP',
                    $entityTimestamp,
                ]
            )
            ->orderBy('TIMESTAMP ASC')
            ->all();
    }
}
