<?php

namespace backend\controllers;

use Yii;
use common\components\Twilio;
use yii\base\InvalidConfigException;
use yii\web\BadRequestHttpException;
use yii\web\ServerErrorHttpException;

/**
 * Class TwilioTemplatesController.
 */
class TwilioTemplatesController extends AbstractSenderController
{
    /**
     * @return array|mixed
     */
    public static function initAttributes()
    {
        /** @var Twilio $component */
        $component = Yii::$app->twilio;

        return $component->setServiceAttributes(true);
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
        /** @var Twilio $component */
        $component = Yii::$app->twilio;
        if (!$this->validateToken($component->token)) {
            throw new BadRequestHttpException();
        }

        $postProperties = Yii::$app->request->post('properties');
        if (empty($postProperties['phone_number']) || empty($postProperties['message_text'])) {
            throw new BadRequestHttpException();
        }

        $component->sendMessage($postProperties['phone_number'], $postProperties['message_text'], true);

        return true;
    }
}
