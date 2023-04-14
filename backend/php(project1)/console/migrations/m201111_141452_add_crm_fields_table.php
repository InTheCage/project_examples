<?php

use yii\db\Migration;

/**
 * Class m201111_141452_add_crm_fields_table.
 */
class m201111_141452_add_crm_fields_table extends Migration
{
    /**
     * {@inheritdoc}
     */
    public function up()
    {
        $this->createTable('b2c_crm_fields', [
            'id' => $this->primaryKey(),
            'crm_name' => $this->string()->notNull(),
            'crm_type' => $this->string()->notNull(),
            'model' => $this->string()->notNull(),
            'property' => $this->string()->notNull(),
            'timestamp' => $this->dateTime()->notNull()->defaultExpression('CURRENT_TIMESTAMP'),
        ]);
    }

    /**
     * {@inheritdoc}
     */
    public function down()
    {
        $this->dropTable('b2c_crm_fields');
    }
}
