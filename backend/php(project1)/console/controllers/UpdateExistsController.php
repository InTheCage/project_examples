<?php

namespace console\controllers;

use Yii;
use Exception;
use yii\console\ExitCode;
use common\models\siebel\Order;
use common\models\siebel\Client;

/**
 * Class UpdateExistsController.
 */
class UpdateExistsController extends BaseCronController
{
    /**
     * Обновить существующих в CRM клиентов.
     *
     * update-exists/clients
     *
     * @return int
     */
    public function actionClients()
    {
        $existsClients = static::getClientsInCRM();
        $count = count($existsClients);

        $this->stdout("Updating only existing clients ($count)" . PHP_EOL);

        /** @var Client[] $clients */
        $clients = Client::find()
            ->where(['ID' => $existsClients])
            ->orderBy(['TIMESTAMP' => SORT_ASC])
            ->all();

        if (!empty($clients)) {
            foreach ($clients as $client) {
                try {
                    $client->trigger(Client::EVENT_UPDATED);

                    $this->stdout('Contact ID = ' . $client->ID . ' was updated' . PHP_EOL);
                } catch (Exception $e) {
                    Yii::warning(
                        'update-exists/clientsException: ' .
                        $e->getCode() .
                        ' ' .
                        $e->getMessage() .
                        PHP_EOL .
                        json_encode($e->getTrace())
                    );
                }
            }
        } else {
            $this->stdout('No clients to update' . PHP_EOL);
        }

        return ExitCode::OK;
    }

    /**
     * Обновить существующие в CRM заказы.
     *
     * update-exists/siebel-orders
     *
     * @return int
     */
    public function actionSiebelOrders()
    {
        $existsClients = static::getClientsInCRM();
        $count = count($existsClients);

        $this->stdout("Updating only existing orders for clients ($count)" . PHP_EOL);

        /** @var Order[] $orders */
        $orders = Order::find()
            ->where(['CLIENT_ID' => $existsClients])
            ->orderBy(['TIMESTAMP' => SORT_ASC])
            ->all();

        if (!empty($orders)) {
            foreach ($orders as $order) {
                try {
                    $order->trigger(Order::EVENT_UPDATED);

                    $this->stdout(
                        'Deal with Siebel ID = ' .
                        $order->ID . ' (Client ID = ' . $order->CLIENT_ID . ')' .
                        ' was updated' .
                        PHP_EOL
                    );
                } catch (Exception $e) {
                    Yii::warning(
                        'update-exists/clientsException: ' .
                        $e->getCode() .
                        ' ' .
                        $e->getMessage() .
                        PHP_EOL .
                        json_encode($e->getTrace())
                    );
                }
            }
        } else {
            $this->stdout('No orders to update' . PHP_EOL);
        }

        return ExitCode::OK;
    }
}
