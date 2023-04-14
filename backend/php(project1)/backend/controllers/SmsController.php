<?php

namespace backend\controllers;

use Yii;
use common\components\SmsTraffic;
use yii\base\InvalidConfigException;
use yii\web\BadRequestHttpException;
use yii\web\ServerErrorHttpException;

/**
 * Class SmsController.
 */
class SmsController extends AbstractSenderController
{
    /**
     * @return array|mixed
     */
    public static function initAttributes()
    {
        /** @var SmsTraffic $component */
        $component = Yii::$app->smstraffic;

        return $component->setServiceAttributes();
    }

    /**
     * @throws BadRequestHttpException
     * @throws InvalidConfigException
     * @throws ServerErrorHttpException
     *
     * @return bool|mixed
     */
    public function actionSend()
    {
        /** @var SmsTraffic $component */
        $component = Yii::$app->smstraffic;
        if (!$this->validateToken($component->token)) {
            throw new BadRequestHttpException();
        }

        $postProperties = Yii::$app->request->post('properties');
        if (empty($postProperties['phone_number']) || empty($postProperties['message_text'])) {
            throw new BadRequestHttpException();
        }

        $component->sendMessage($postProperties['phone_number'], $postProperties['message_text']);

        return true;
    }
}
