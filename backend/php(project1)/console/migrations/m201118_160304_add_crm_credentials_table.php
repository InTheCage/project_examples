<?php

use yii\db\Migration;

/**
 * Class m201118_160304_add_crm_credentials_table.
 */
class m201118_160304_add_crm_credentials_table extends Migration
{
    /**
     * {@inheritdoc}
     */
    public function up()
    {
        $this->createTable('b2c_crm_credentials', [
            'id' => $this->primaryKey(),
            'json_data' => $this->text()->notNull(),
            'crm_env' => $this->string(50)->notNull(),
            'timestamp' => $this->dateTime()->notNull()->defaultExpression('CURRENT_TIMESTAMP'),
        ]);
    }

    /**
     * {@inheritdoc}
     */
    public function down()
    {
        $this->dropTable('b2c_crm_credentials');

        return false;
    }
}
