<?php

use yii\db\Migration;

/**
 * Class m201106_074525_add_clients_table
 */
class m201106_074525_add_clients_table extends Migration
{
    public function up()
    {
        $this->createTable('b2c_crm_client', [
            'ID' => $this->primaryKey(),
            'NAME' => $this->string()->notNull(),
            'SURNAME' => $this->string()->notNull(),
            'BIRTHDAY' => $this->string()->notNull(),
            'GENDER' => $this->string()->notNull(),
            'EMAIL' => $this->string()->notNull()->unique(),
            'EMAIL_CONFIRMED' => $this->string()->notNull(),
            'EMAIL_COMMUNICATIONS' => $this->string()->notNull(),
            'PHONE' => $this->string()->notNull(),
            'PHONE_CONFIRMED' => $this->string()->notNull(),
            'PHONE_COMMUNICATIONS' => $this->string()->notNull(),
            'USE_EMAIL_FOR_ORDER' => $this->string()->notNull(),
            'EMPLOYEE' => $this->string()->notNull(),
            'BONUSES' => $this->float()->notNull(),
            'STAMPS' => $this->float()->notNull(),
            'TIMESTAMP' => $this->dateTime()->notNull(),
        ]);
    }

    public function down()
    {
        $this->dropTable('b2c_crm_client');
    }
}
