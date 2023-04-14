<?php

namespace backend\controllers;

use yii\web\Controller;

/**
 * Class BitrixController.
 */
class BitrixController extends Controller
{
    /**
     * {@inheritdoc}
     */
    public $enableCsrfValidation = false;

    /**
     * @return string
     */
    public function actionInit()
    {
        return $this->render('install', []);
    }
}
