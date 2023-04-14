<?php

namespace console\controllers;

use Yii;
use yii\base\Action;
use yii\redis\Connection;
use yii\console\Controller;
use common\models\bitrix\Contact;

/**
 * Class BaseCronController.
 */
class BaseCronController extends Controller
{
    public const TIMESTAMP_DATE_FORMAT = 'd.m.y';

    public const TIMESTAMP_DATETIME_FORMAT = 'd-m-y H:i:s';

    public const DATETIME_FORMAT = 'Y-m-d H:i:s';

    /**
     * @return array
     */
    protected static function getClientsInCRM(): array
    {
        $result = Contact::getAll();
        $key = Contact::UF_PREFIX . Contact::CLIENT_ID;

        return !empty($result['result']) ? array_unique(array_column($result['result'], $key)) : [];
    }

    /**
     * {@inheritdoc}
     */
    public function beforeAction($action): bool
    {
        if (!parent::beforeAction($action)) {
            return false;
        }

        return $this->acquireLock($action);
    }

    /**
     * {@inheritdoc}
     */
    public function afterAction($action, $result): bool
    {
        $result = parent::afterAction($action, $result);

        $this->releaseLock($action);

        return $result;
    }

    /**
     * @param Action $action the action to be locked.
     *
     * @return bool
     */
    protected static function acquireLock(Action $action): bool
    {
        /** @var Connection $redis */
        $redis = Yii::$app->redis;
        $uid = $action->uniqueId;
        $pid = getmypid();

        if ($redis->exists($uid)) {
            $pid = $redis->get($uid);

            if (file_exists("/proc/{$pid}")) {
                return false;
            }
        }

        if (true !== $redis->set($uid, $pid)) {
            return false;
        }
        register_shutdown_function(function () use ($redis, $uid) {
            $redis->del($uid);
        });

        return true;
    }

    /**
     * @param Action $action the action to be locked.
     *
     * @return bool
     */
    protected static function releaseLock(Action $action): bool
    {
        /** @var Connection $redis */
        $redis = Yii::$app->redis;
        $uid = $action->uniqueId;

        return true === $redis->del($uid);
    }
}
