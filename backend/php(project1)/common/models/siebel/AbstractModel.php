<?php

namespace common\models\siebel;

use Yii;
use yii\db\Connection;
use yii\db\Expression;
use yii\db\ActiveRecord;

abstract class AbstractModel extends ActiveRecord
{
    protected const DATE_FORMAT_RULE = 'dd.MM.yyyy';

    protected const DATETIME_FORMAT_RULE = 'yyyy-MM-dd HH:mm:ss';

    /**
     * {@inheritdoc}
     */
    public static function getDb(): ?Connection
    {
        return Yii::$app->siebel;
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
