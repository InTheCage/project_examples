<?php

namespace console\controllers;

use Yii;
use DateTime;
use Exception;
use yii\console\ExitCode;
use common\models\siebel\Card;
use common\models\siebel\Client;
use common\models\navision\Item;
use common\models\siebel\AccrualPoints;
use common\models\siebel\AccrualStamps;
use common\models\hybris\Order as HybrisOrder;
use common\models\siebel\Order as SiebelOrder;
use common\models\express\Order as ExpressOrder;

/**
 * Class CronImportController.
 */
class CronImportController extends BaseCronController
{
    /**
     * @param string $entityClass
     *
     * @return mixed
     */
    private function getEntities(string $entityClass)
    {
        if (class_exists($entityClass) && method_exists($entityClass, 'getForImport')) {
            return $entityClass::getForImport();
        }
    }

    /**
     * @param string $entityClass
     * @param string $entityTimestamp
     *
     * @return int
     */
    private function setTimestamp(string $entityClass, string $entityTimestamp = '')
    {
        if ($entityTimestamp) {
            Yii::$app->redis->set(
                $entityClass::REDIS_IMPORTED_TIMESTAMP,
                date(
                    static::DATETIME_FORMAT,
                    DateTime::createFromFormat(
                        static::TIMESTAMP_DATETIME_FORMAT,
                        $entityTimestamp
                    )->getTimestamp()
                )
            );
        }

        return ExitCode::OK;
    }

    /**
     * cron-import/add
     *
     * @param string $entityClass
     *
     * @return int
     */
    public function actionAdd(string $entityClass)
    {
        /** @var AccrualPoints|AccrualStamps|Card|Client|Item|HybrisOrder|SiebelOrder|ExpressOrder $entities */
        $entities = $this->getEntities($entityClass);
        if (!empty($entities)) {
            foreach ($entities as $entity) {
                try {
                    $entity->trigger($entityClass::EVENT_CREATED);

                    $this->stdout(
                        "{$entityClass::EVENT_CREATED} done for " .
                        $entity->ID ?? $entity->id .
                        PHP_EOL
                    );
                } catch (Exception $e) {
                    Yii::warning(
                        "Action cron-import/add {$entityClass} Exception: " .
                        $e->getCode() .
                        ' ' .
                        $e->getMessage() .
                        PHP_EOL .
                        json_encode($e->getTrace())
                    );
                }
            }
        } else {
            $this->stderr(
                'Action cron-import/add got wrong model name or no records for import ' .
                $entityClass .
                PHP_EOL
            );
        }

        return $this->setTimestamp($entityClass, $entity->TIMESTAMP);
    }

    /**
     * cron-import/add
     *
     * @param string $entityClass
     *
     * @return int
     */
    public function actionUpdate(string $entityClass)
    {
        /** @var AccrualPoints|AccrualStamps|Card|Client|Item|HybrisOrder|SiebelOrder|ExpressOrder $entities */
        $entities = $this->getEntities($entityClass);
        if (!empty($entities)) {
            foreach ($entities as $entity) {
                try {
                    $entity->trigger($entityClass::EVENT_UPDATED);

                    $this->stdout(
                        "{$entityClass::EVENT_UPDATED} done for " .
                        $entity->ID ?? $entity->id .
                        PHP_EOL
                    );
                } catch (Exception $e) {
                    Yii::warning(
                        "Action cron-import/update {$entityClass} Exception: " .
                        $e->getCode() .
                        ' ' .
                        $e->getMessage() .
                        PHP_EOL .
                        json_encode($e->getTrace())
                    );
                }
            }
        } else {
            $this->stderr(
                'Action cron-import/update got wrong model name or no records for import ' .
                $entityClass .
                PHP_EOL
            );
        }

        return $this->setTimestamp($entityClass, $entity->TIMESTAMP ?? $entity->timestamp ?? '');
    }
}
