<?php

use yii\db\Migration;

/**
 * Class m201112_122730_add_item_table
 */
class m201112_122730_add_item_table extends Migration
{
    public function up()
    {
        $this->createTable('b2c_crm_item', [
            'id' => $this->primaryKey(),
            'classifier_id' => $this->string()->notNull(),
            'category_id' => $this->string()->notNull(),
            'name' => $this->string()->notNull(),
            'gravimetric' => $this->integer()->notNull(),
            'weight' => $this->float()->notNull(),
            'alcohol' => $this->integer()->notNull(),
            'min_price' => $this->float()->notNull(),
        ]);
    }

    public function down()
    {
        $this->dropTable('b2c_crm_item');
    }

}
