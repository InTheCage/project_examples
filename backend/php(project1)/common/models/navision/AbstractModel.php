<?php

namespace common\models\navision;

use Yii;
use yii\db\Connection;
use yii\db\ActiveRecord;

abstract class AbstractModel extends ActiveRecord
{
    /**
     * {@inheritdoc}
     */
    public static function getDb(): ?Connection
    {
        return Yii::$app->navision;
    }

    /**
     * @return array|ActiveRecord[]
     */
    protected static function getForImport()
    {
        return static::find()
            ->orderBy('id DESC')
            ->all();
    }
}
