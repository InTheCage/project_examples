<?php

namespace common\components;

use Yii;
use http\Exception;
use yii\base\Component;
use common\models\local\CrmCredentials;

class Bitrix extends Component
{
    public const VERSION = '1.36';

    public const BATCH_COUNT = 50; //count batch 1 query

    public const TYPE_TRANSPORT = 'json'; // json or xml

    public const ENV = 'prod';

    /**
     * call where install application even url
     * only for rest application, not webhook.
     */
    public static function installApp()
    {
        if (!isset($_REQUEST['event'])) {
            return false;
        }

        $result = [
            'rest_only' => true,
            'install' => false,
        ];
        if ($_REQUEST['event'] == 'ONAPPINSTALL' && !empty($_REQUEST['auth'])) {
            $result['install'] = static::setAppSettings($_REQUEST['auth'], true);
        } elseif ($_REQUEST['PLACEMENT'] == 'DEFAULT') {
            $result['rest_only'] = false;
            $result['install'] = static::setAppSettings(
                [
                    'access_token' => htmlspecialchars($_REQUEST['AUTH_ID']),
                    'expires_in' => htmlspecialchars($_REQUEST['AUTH_EXPIRES']),
                    'application_token' => htmlspecialchars($_REQUEST['APP_SID']),
                    'refresh_token' => htmlspecialchars($_REQUEST['REFRESH_ID']),
                    'domain' => htmlspecialchars($_REQUEST['DOMAIN']),
                    'client_endpoint' => 'https://' . htmlspecialchars($_REQUEST['DOMAIN']) . '/rest/',
                ],
                true
            );
        }

        static::setLog(
            [
                'request' => $_REQUEST,
                'result' => $result,
            ],
            'installApp'
        );

        return $result;
    }

    /**
     * @param array $arParams
     *
     * @example $arParams = [
     *  'method'    => 'some rest method',
     *  'params'    => []//array params of method
     * ];
     *
     * @return mixed array|string|boolean curl-return or error
     */
    protected static function callCurl($arParams)
    {
        if (!function_exists('curl_init')) {
            return [
                'error' => 'error_php_lib_curl',
                'error_information' => 'need install curl lib',
            ];
        }

        $arSettings = static::getAppSettings();
        if ($arSettings !== false) {
            if (isset($arParams['this_auth']) && $arParams['this_auth'] == 'Y') {
                $url = 'https://oauth.bitrix.info/oauth/token/';
            } else {
                $url = $arSettings['client_endpoint'] .
                    $arParams['method'] .
                    '.' .
                    static::TYPE_TRANSPORT;

                if (empty($arSettings['is_web_hook']) || $arSettings['is_web_hook'] != 'Y') {
                    $arParams['params']['auth'] = $arSettings['access_token'];
                }
            }

            $sPostFields = http_build_query($arParams['params']);

            try {
                $obCurl = curl_init();
                curl_setopt($obCurl, CURLOPT_URL, $url);
                curl_setopt($obCurl, CURLOPT_RETURNTRANSFER, true);
                curl_setopt($obCurl, CURLOPT_POSTREDIR, 10);
                curl_setopt($obCurl, CURLOPT_USERAGENT, 'Bitrix24 CRest PHP ' . static::VERSION);
                if ($sPostFields) {
                    curl_setopt($obCurl, CURLOPT_POST, true);
                    curl_setopt($obCurl, CURLOPT_POSTFIELDS, $sPostFields);
                }
                curl_setopt(
                    $obCurl, CURLOPT_FOLLOWLOCATION, (isset($arParams['followlocation']))
                    ? $arParams['followlocation'] : 1
                );
                if (
                    isset(Yii::$app->params['C_REST_IGNORE_SSL']) &&
                    Yii::$app->params['C_REST_IGNORE_SSL'] === true
                ) {
                    curl_setopt($obCurl, CURLOPT_SSL_VERIFYPEER, false);
                    curl_setopt($obCurl, CURLOPT_SSL_VERIFYHOST, false);
                }
                $out = curl_exec($obCurl);
                $info = curl_getinfo($obCurl);
                if (curl_errno($obCurl)) {
                    $info['curl_error'] = curl_error($obCurl);
                }
                if (
                    static::TYPE_TRANSPORT == 'xml' &&
                    (!isset($arParams['this_auth']) || $arParams['this_auth'] != 'Y')
                ) {
                    //auth only json support
                    $result = $out;
                } else {
                    $result = static::expandData($out);
                }

                curl_close($obCurl);

                if (!empty($result['error'])) {
                    if ($result['error'] == 'expired_token' && empty($arParams['this_auth'])) {
                        $result = static::GetNewAuth($arParams);
                    } else {
                        $arErrorInform = [
                            'expired_token' => 'expired token, cant get new auth? Check access oauth server.',
                            'invalid_token' => 'invalid token, need reinstall application',
                            'invalid_grant' => 'invalid grant, check out define C_REST_CLIENT_SECRET or C_REST_CLIENT_ID',
                            'invalid_client' => 'invalid client, check out define C_REST_CLIENT_SECRET or C_REST_CLIENT_ID',
                            'QUERY_LIMIT_EXCEEDED' => 'Too many requests, maximum 2 query by second',
                            'ERROR_METHOD_NOT_FOUND' => 'Method not found! You can see the permissions of the application: CRest::call(\'scope\')',
                            'NO_AUTH_FOUND' => 'Some setup error b24, check in table "b_module_to_module" event "OnRestCheckAuth"',
                            'INTERNAL_SERVER_ERROR' => 'Server down, try later',
                        ];
                        if (!empty($arErrorInform[$result['error']])) {
                            $result['error_information'] = $arErrorInform[$result['error']];
                        }
                    }
                }
                if (!empty($info['curl_error'])) {
                    $result['error'] = 'curl_error';
                    $result['error_information'] = $info['curl_error'];
                }

                static::setLog(
                    [
                        'url' => $url,
                        'info' => $info,
                        'params' => $arParams,
                        'result' => $result,
                    ],
                    'callCurl'
                );

                return $result;
            } catch (Exception $e) {
                static::setLog(
                    [
                        'message' => $e->getMessage(),
                        'code' => $e->getCode(),
                        'trace' => $e->getTrace(),
                        'params' => $arParams,
                    ],
                    'exceptionCurl'
                );

                return [
                    'error' => 'exception',
                    'error_exception_code' => $e->getCode(),
                    'error_information' => $e->getMessage(),
                ];
            }
        } else {
            static::setLog(
                [
                    'params' => $arParams,
                ],
                'emptySetting'
            );
        }

        return [
            'error' => 'no_install_app',
            'error_information' => 'error install app, pls install local application ',
        ];
    }

    /**
     * Generate a request for callCurl().
     *
     * @param string $method
     * @param array  $params method params
     *
     * @return mixed array|string|boolean curl-return or error
     */
    public static function call($method, $params = [])
    {
        $arPost = [
            'method' => $method,
            'params' => $params,
        ];

        return static::callCurl($arPost);
    }

    /**
     * @param array $arData
     * @param int   $halt
     *
     * @return array|mixed|string|string[]
     *
     * @example $arData = [
     *      'find_contact' => [
     *          'method' => 'crm.duplicate.findbycomm',
     *          'params' => [ "entity_type" => "CONTACT",  "type" => "EMAIL", "values" => array("info@bitrix24.com") ]
     *      ],
     *      'get_contact' => [
     *          'method' => 'crm.contact.get',
     *          'params' => [ "id" => '$result[find_contact][CONTACT][0]' ]
     *      ],
     *      'get_company' => [
     *          'method' => 'crm.company.get',
     *          'params' => [ "id" => '$result[get_contact][COMPANY_ID]', "select" => ["*"],]
     *      ]
     * ];
     */
    public static function callBatch($arData, $halt = 0)
    {
        $arResult = [];
        if (is_array($arData)) {
            $arDataRest = [];
            $i = 0;
            foreach ($arData as $key => $data) {
                if (!empty($data['method'])) {
                    $i++;
                    if (static::BATCH_COUNT >= $i) {
                        $arDataRest['cmd'][$key] = $data['method'];
                        if (!empty($data['params'])) {
                            $arDataRest['cmd'][$key] .= '?' . http_build_query($data['params']);
                        }
                    }
                }
            }

            if (!empty($arDataRest)) {
                $arDataRest['halt'] = $halt;
                $arPost = [
                    'method' => 'batch',
                    'params' => $arDataRest,
                ];

                $arResult = static::callCurl($arPost);
            }
        }

        return $arResult;
    }

    /**
     * Getting a new authorization and sending a request for the 2nd time.
     *
     * @param array $arParams request when authorization error returned
     *
     * @return array|mixed|string|string[] query result from $arParams
     */
    protected static function GetNewAuth($arParams)
    {
        $result = [];
        $arSettings = static::getAppSettings();
        if ($arSettings !== false) {
            $arParamsAuth = [
                'this_auth' => 'Y',
                'params' => [
                    'client_id' => $arSettings['C_REST_CLIENT_ID'],
                    'grant_type' => 'refresh_token',
                    'client_secret' => $arSettings['C_REST_CLIENT_SECRET'],
                    'refresh_token' => $arSettings['refresh_token'],
                ],
            ];

            $newData = static::callCurl($arParamsAuth);
            if (isset($newData['C_REST_CLIENT_ID'])) {
                unset($newData['C_REST_CLIENT_ID']);
            }

            if (isset($newData['C_REST_CLIENT_SECRET'])) {
                unset($newData['C_REST_CLIENT_SECRET']);
            }

            if (isset($newData['error'])) {
                unset($newData['error']);
            }

            if (static::setAppSettings($newData)) {
                $arParams['this_auth'] = 'N';
                $result = static::callCurl($arParams);
            }
        }

        return $result;
    }

    /**
     * @param array $arSettings settings application
     * @param bool  $isInstall  true if install app by installApp()
     *
     * @return bool
     */
    protected static function setAppSettings($arSettings, $isInstall = false)
    {
        $return = false;
        if (is_array($arSettings)) {
            $oldData = static::getAppSettings();
            if ($isInstall != true && !empty($oldData) && is_array($oldData)) {
                $arSettings = array_merge($oldData, $arSettings);
            }

            $return = static::setSettingData($arSettings);
        }

        return $return;
    }

    /**
     * @return array|bool|string setting application for query
     */
    protected static function getAppSettings()
    {
        if (
            isset(Yii::$app->params['C_REST_WEB_HOOK_URL']) &&
            $C_REST_WEB_HOOK_URL = Yii::$app->params['C_REST_WEB_HOOK_URL']
        ) {
            $arData = [
                'client_endpoint' => $C_REST_WEB_HOOK_URL,
                'is_web_hook' => 'Y',
            ];

            $isCurrData = true;
        } else {
            $arData = static::getSettingData();
            $isCurrData = false;
            if (
                !empty($arData['access_token']) &&
                !empty($arData['domain']) &&
                !empty($arData['refresh_token']) &&
                !empty($arData['application_token']) &&
                !empty($arData['client_endpoint'])
            ) {
                $isCurrData = true;
            }
        }

        return ($isCurrData) ? $arData : false;
    }

    /**
     * Can overridden this method to change the data storage location.
     *
     * @return array setting for getAppSettings()
     */
    protected static function getSettingData()
    {
        $return = [];
        if ($credentials = CrmCredentials::findOne(['crm_env' => static::ENV])) {
            $return = $credentials->credentialArray;
            if (
                isset(Yii::$app->params['C_REST_CLIENT_ID']) &&
                $C_REST_CLIENT_ID = Yii::$app->params['C_REST_CLIENT_ID']
            ) {
                $return['C_REST_CLIENT_ID'] = $C_REST_CLIENT_ID;
            }

            if (
                Yii::$app->params['C_REST_CLIENT_SECRET'] &&
                $C_REST_CLIENT_SECRET = Yii::$app->params['C_REST_CLIENT_SECRET']
            ) {
                $return['C_REST_CLIENT_SECRET'] = $C_REST_CLIENT_SECRET;
            }
        }

        return $return;
    }

    /**
     * @param mixed $data
     * @param bool  $debag
     *
     * @return string json_encode with encoding
     */
    protected static function wrapData($data, $debag = false)
    {
        $return = json_encode(
            $data,
            JSON_HEX_TAG | JSON_HEX_AMP | JSON_HEX_APOS | JSON_HEX_QUOT
        );

        if ($debag) {
            $e = json_last_error();
            if ($e != JSON_ERROR_NONE) {
                if ($e == JSON_ERROR_UTF8) {
                    return 'Failed encoding! Recommended \'UTF - 8\' or set define 
                        C_REST_CURRENT_ENCODING = current site encoding for function iconv()';
                }
            }
        }

        return $return;
    }

    /**
     * @param string $data
     *
     * @return string json_decode with encoding
     */
    protected static function expandData($data)
    {
        return json_decode($data, true);
    }

    /**
     * @param array $arSettings settings application
     *
     * @return bool is successes save data for setSettingData()
     */
    protected static function setSettingData($arSettings)
    {
        if (!$credentials = CrmCredentials::findOne(['crm_env' => static::ENV])) {
            $credentials = new CrmCredentials();
        }

        $credentials->json_data = static::wrapData($arSettings);
        $credentials->crm_env = static::ENV;
        $credentials->timestamp = date('Y-m-d H:i:s');

        return (bool) $credentials->save();
    }

    /**
     * Can overridden this method to change the log data storage location.
     *
     * @param array  $arData logs data
     * @param string $type   to more identification log data
     *
     * @return bool|false is successes save log data
     */
    public static function setLog($arData, $type = '')
    {
        $return = false;
        if (!isset(Yii::$app->params['C_REST_BLOCK_LOG']) || Yii::$app->params['C_REST_BLOCK_LOG'] !== true) {
            $path = isset(Yii::$app->params['C_REST_LOGS_DIR']) ?
                Yii::$app->params['C_REST_LOGS_DIR'] :
                __DIR__ . '/../runtime/logs/bitrix24/';

            $path .= date('Y-m-d/H') . '/';
            if (!file_exists($path)) {
                @mkdir($path, 0775, true);
            }

            $path .= time() . '_' . $type . '_' . rand(1, 9999999) . 'log';
            if (!isset(Yii::$app->params['C_REST_LOG_TYPE_DUMP']) || Yii::$app->params['C_REST_LOG_TYPE_DUMP'] !== true) {
                $jsonLog = static::wrapData($arData);
                if ($jsonLog === false) {
                    $return = file_put_contents($path . '_backup.txt', var_export($arData, true));
                } else {
                    $return = file_put_contents($path . '.json', $jsonLog);
                }
            } else {
                $return = file_put_contents($path . '.txt', var_export($arData, true));
            }
        }

        return $return;
    }
}
