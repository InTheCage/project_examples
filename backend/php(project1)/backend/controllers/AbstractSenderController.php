<?php

namespace backend\controllers;

use Yii;
use yii\web\Controller;

abstract class AbstractSenderController extends Controller
{
    /**
     * {@inheritdoc}
     */
    public $enableCsrfValidation = false;

    /**
     * @return mixed
     */
    abstract public static function initAttributes();

    /**
     * @return mixed
     */
    abstract public function actionSend();

    /**
     * @param string $serviceToken
     *
     * @return bool
     */
    protected function validateToken(string $serviceToken)
    {
        $requestToken = Yii::$app->request->get('token', '');
        if (!$requestToken || empty($serviceToken) || $requestToken != $serviceToken) {
            return false;
        }

        return true;
    }
}
