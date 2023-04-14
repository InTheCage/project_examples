<?php

namespace backend\controllers;

use Yii;
use common\components\Twilio;
use yii\base\InvalidConfigException;
use yii\web\BadRequestHttpException;
use yii\web\ServerErrorHttpException;

/**
 * Class TwilioController.
 */
class TwilioController extends AbstractSenderController
{
    /**
     * @return array|mixed
     */
    public static function initAttributes()
    {
        /** @var Twilio $component */
        $component = Yii::$app->twilio;

        return $component->setServiceAttributes();
    }

    /**
     * @throws BadRequestHttpException
     * @throws ServerErrorHttpException
     * @throws InvalidConfigException
     *
     * @return bool|mixed
     */
    public function actionSend()
    {
        /** @var Twilio $component */
        $component = Yii::$app->twilio;
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
