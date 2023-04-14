/*
    Расчет агрегата по продуктам
*/

{{ config(
  tags = ["history_day","fct_product_all","fct_product"],
  schema = 'wb_fct',
  materialized = "incremental",
  primary_key =('user_id, product_id'),
  order_by =('user_id, product_id, brand_id, category_id, company_id, toYYYYMMDD(toYYYYMMDD(dt))'),
  engine = "SummingMergeTree()",
  partition_by = "toYYYYMMDD(dt)",
  pre_hook = "{{ get_drop_partitions(this, var('incremental_period'),  var('incremental_shift'),  'day') }}"
) }} 
with
cp as (
	select bp.product_id, arraySort((x) -> x, groupArray((bp.product_id, bp.category_id))) [1].2 as category_id
	from wb.category_product bp
	group by bp.product_id
),
bp as (
	select bp.product_id, arraySort((x) -> x, groupArray((bp.product_id, bp.brand_id))) [1].2 as brand_id
	from wb.brand_products bp
	group by bp.product_id
),
fct as 
(
SELECT date as dt, user_id, product_id, quantity as order_qty, cancelled as order_cancel_qty, null as date_of_last_incomes, null as incomes_qty, null as incomes_cost_price, null as stocks_qty, null as stocks_InWayToClient_qty, null as stocks_InWayFromClient_qty, null as stocks_NotInOrders_qty, null as stocks_full_qty, null as stocks_active_sizes_qty, null as purchases_qty, null as return_qty, null as sales_qty, null as payPrice_sum, null as finalPrice_sum, null as discountedPrice_sum, null as commission_sum, null as sales_active_qty, null as defectsForPeriod_qty, null as shipmentCost_sum, null as shipment_amt, null as `position`, null as discounted_price, null as base_price, null as sale_price, null as promo_price, null as profit_sum, null as cost_sales, null as cost_price_FBO, null as cost_price_FBS, null as active_day, null as turnover_sum, null as content_percent, null as comment_qty, null as rating, null as size_ok, null as size_bigger, null as size_smaller
from wb.data_api_wb_orders_records dawor
where toYYYYMMDD(date) in (
      {{ get_incremental_period(
        var("incremental_period"),
        var("incremental_shift"),
        "day"
      ) }}
    )
and product_id is not null
union all
SELECT date as dt, dawir.user_id, dawir.product_id as product_id, null as order_qty, null as order_cancel_qty, date as date_of_last_incomes, dawir.quantity as incomes_qty, dawir.quantity*coalesce(cp1.cost_price, cp2.cost_price) as incomes_cost_price, null as stocks_qty, null as stocks_InWayToClient_qty, null as stocks_InWayFromClient_qty, null as stocks_NotInOrders_qty, null as stocks_full_qty, null as stocks_active_sizes_qty, null as purchases_qty, null as return_qty, null as sales_qty, null as payPrice_sum, null as finalPrice_sum, null as discountedPrice_sum, null as commission_sum, null as sales_active_qty, null as defectsForPeriod_qty, null as shipmentCost_sum, null as shipment_amt, null as `position`, null as discounted_price, null as base_price, null as sale_price, null as promo_price, null as profit_sum, null as cost_sales, null as cost_price_FBO, null as cost_price_FBS, null as active_day, null as turnover_sum, null as content_percent, null as comment_qty, null as rating, null as size_ok, null as size_bigger, null as size_smaller
from wb.data_api_wb_incomes_records dawir
left join wb.product_cost_prices cp1 on cp1.product_id = dawir.product_id and cp1.wb_income_id = dawir.incomeId
left join wb.product_cost_prices cp2 on cp2.product_id = dawir.product_id and cp2.`type` = 'FBO' and cp2.is_initial = 1
where toYYYYMMDD(dawir.`date`) in (
      {{ get_incremental_period(
        var("incremental_period"),
        var("incremental_shift"),
        "day"
      ) }}
    )
and dawir.product_id is not null
union all
SELECT dt, user_id, product_id, null as order_qty, null as order_cancel_qty, null as date_of_last_incomes, null as incomes_qty, null as incomes_cost_price, quantity as stocks_qty, inWayToClient as stocks_InWayToClient_qty, inWayFromClient as stocks_InWayFromClient_qty, quantityNotInOrders as stocks_NotInOrders_qty, quantityFull as stocks_full_qty, if(quantity > 5,techSize,null) as stocks_active_sizes_qty, null as purchases_qty, null as return_qty, null as sales_qty, null as payPrice_sum, null as finalPrice_sum, null as discountedPrice_sum, null as commission_sum, null as sales_active_qty, null as defectsForPeriod_qty, null as shipmentCost_sum, null as shipment_amt, null as `position`, null as discounted_price, null as base_price, null as sale_price, null as promo_price, null as profit_sum, null as cost_sales, null as cost_price_FBO, null as cost_price_FBS, null as active_day, null as turnover_sum, null as content_percent, null as comment_qty, null as rating, null as size_ok, null as size_bigger, null as size_smaller
from 
( SELECT dawsr.date as dt, dawsr.user_id, dawsr.product_id, dawsr.techSize, 
	sum(dawsr.quantity) AS quantity, sum(dawsr.inWayToClient) AS inWayToClient, 
	sum(dawsr.inWayFromClient) AS inWayFromClient, sum(dawsr.quantityNotInOrders) AS quantityNotInOrders, sum(dawsr.quantityFull) AS quantityFull
  FROM wb.data_api_wb_stocks_records dawsr 
  where toYYYYMMDD(dawsr.date) in (
      {{ get_incremental_period(
        var("incremental_period"),
        var("incremental_shift"),
        "day"
      ) }}
    )
  and dawsr.product_id is not NULL
  GROUP BY dawsr.date, dawsr.user_id, dawsr.product_id, dawsr.techSize
) t
union all
SELECT date as dt, user_id, product_id, null as order_qty, null as order_cancel_qty, null as date_of_last_incomes, null as incomes_qty, null as incomes_cost_price, null as stocks_qty, null as stocks_InWayToClient_qty, null as stocks_InWayFromClient_qty, null as stocks_NotInOrders_qty, null as stocks_full_qty, null as stocks_active_sizes_qty, quantity as purchases_qty, returns as return_qty, (quantity-returns) as sales_qty, payPrice as payPrice_sum, finalPrice as finalPrice_sum, discountedPrice as discountedPrice_sum, (discountedPrice-payPrice) as commission_sum, (quantity-returns) as sales_active_qty, null as defectsForPeriod_qty, null as shipmentCost_sum, null as shipment_amt, null as `position`, null as discounted_price, null as base_price, null as sale_price, null as promo_price, null as profit_sum, null as cost_sales, null as cost_price_FBO, null as cost_price_FBS, null as active_day, null as turnover_sum, null as content_percent, null as comment_qty, null as rating, null as size_ok, null as size_bigger, null as size_smaller
from wb.data_api_wb_sales_records dawsr2 
where toYYYYMMDD(date) in (
      {{ get_incremental_period(
        var("incremental_period"),
        var("incremental_shift"),
        "day"
      ) }}
    )
and product_id is not null
union all
SELECT date as dt, user_id, product_id, null as order_qty, null as order_cancel_qty, null as date_of_last_incomes, null as incomes_qty, null as incomes_cost_price, null as stocks_qty, null as stocks_InWayToClient_qty, null as stocks_InWayFromClient_qty, null as stocks_NotInOrders_qty, null as stocks_full_qty, null as stocks_active_sizes_qty, null as purchases_qty, null as return_qty, null as sales_qty, null as payPrice_sum, null as finalPrice_sum, null as discountedPrice_sum, null as commission_sum, null as sales_active_qty, quantity as defectsForPeriod_qty, shipmentCost as shipmentCost_sum, shipmentAmount as shipment_amt, null as `position`, null as discounted_price, null as base_price, null as sale_price, null as promo_price, null as profit_sum, null as cost_sales, null as cost_price_FBO, null as cost_price_FBS, null as active_day, null as turnover_sum, null as content_percent, null as comment_qty, null as rating, null as size_ok, null as size_bigger, null as size_smaller
from wb.data_api_wb_detail_report_records dawdrr  
where toYYYYMMDD(date) in (
      {{ get_incremental_period(
        var("incremental_period"),
        var("incremental_shift"),
        "day"
      ) }}
    )
and product_id is not null
union all
SELECT date as dt, user_id, product_id, null as order_qty, null as order_cancel_qty, null as date_of_last_incomes, null as incomes_qty, null as incomes_cost_price, null as stocks_qty, null as stocks_InWayToClient_qty, null as stocks_InWayFromClient_qty, null as stocks_NotInOrders_qty, null as stocks_full_qty, null as stocks_active_sizes_qty, null as purchases_qty, null as return_qty, null as sales_qty, null as payPrice_sum, null as finalPrice_sum, null as discountedPrice_sum, null as commission_sum, null as sales_active_qty, null as defectsForPeriod_qty, null as shipmentCost_sum, null as shipment_amt, null as `position`, discounted_price as discounted_price, base_price as base_price, sale as sale_price, promo as promo_price, null as profit_sum, null as cost_sales, null as cost_price_FBO, null as cost_price_FBS, null as active_day, null as turnover_sum, null as content_percent, null as comment_qty, null as rating, null as size_ok, null as size_bigger, null as size_smaller
from wb.product_daily_prices pdp 
where toYYYYMMDD(date) in (
      {{ get_incremental_period(
        var("incremental_period"),
        var("incremental_shift"),
        "day"
      ) }}
    )
and product_id is not null
union all
SELECT date as dt, user_id, product_id, null as order_qty, null as order_cancel_qty, null as date_of_last_incomes, null as incomes_qty, null as incomes_cost_price, null as stocks_qty, null as stocks_InWayToClient_qty, null as stocks_InWayFromClient_qty, null as stocks_NotInOrders_qty, null as stocks_full_qty, null as stocks_active_sizes_qty, null as purchases_qty, null as return_qty, null as sales_qty, null as payPrice_sum, null as finalPrice_sum, null as discountedPrice_sum, null as commission_sum, null as sales_active_qty, null as defectsForPeriod_qty, null as shipmentCost_sum, null as shipment_amt, null as `position`, null as discounted_price, null as base_price, null as sale_price, null as promo_price, profit as profit_sum, cost_sales as cost_sales, null as cost_price_FBO, null as cost_price_FBS, null as active_day, null as turnover_sum, null as content_percent, null as comment_qty, null as rating, null as size_ok, null as size_bigger, null as size_smaller
from wb.product_profits pp  
where toYYYYMMDD(date) in (
      {{ get_incremental_period(
        var("incremental_period"),
        var("incremental_shift"),
        "day"
      ) }}
    )
and product_id is not null
union all
SELECT dt, dictGet('dict_products','user_id',product_id) as user_id, product_id, null as order_qty, null as order_cancel_qty, null as date_of_last_incomes, null as incomes_qty, null as incomes_cost_price, null as stocks_qty, null as stocks_InWayToClient_qty, null as stocks_InWayFromClient_qty, null as stocks_NotInOrders_qty, null as stocks_full_qty, null as stocks_active_sizes_qty, null as purchases_qty, null as return_qty, null as sales_qty, null as payPrice_sum, null as finalPrice_sum, null as discountedPrice_sum, null as commission_sum, null as sales_active_qty, null as defectsForPeriod_qty, null as shipmentCost_sum, null as shipment_amt, null as `position`, null as discounted_price, null as base_price, null as sale_price, null as promo_price, null as profit_sum, null as cost_sales, cost_price_FBO as cost_price_FBO, cost_price_FBS as cost_price_FBS, null as active_day, null as turnover_sum, null as content_percent, null as comment_qty, null as rating, null as size_ok, null as size_bigger, null as size_smaller
from {{ this.schema }}.fct_product_cost_price pcp  
where toYYYYMMDD(dt) in (
      {{ get_incremental_period(
        var("incremental_period"),
        var("incremental_shift"),
        "day"
      ) }}
    )
union all
SELECT date as dt, user_id, product_id, null as order_qty, null as order_cancel_qty, null as date_of_last_incomes, null as incomes_qty, null as incomes_cost_price, null as stocks_qty, null as stocks_InWayToClient_qty, null as stocks_InWayFromClient_qty, null as stocks_NotInOrders_qty, null as stocks_full_qty, null as stocks_active_sizes_qty, null as purchases_qty, null as return_qty, null as sales_qty, null as payPrice_sum, null as finalPrice_sum, null as discountedPrice_sum, null as commission_sum, null as sales_active_qty, null as defectsForPeriod_qty, null as shipmentCost_sum, null as shipment_amt, null as `position`, null as discounted_price, null as base_price, null as sale_price, null as promo_price, null as profit_sum, null as cost_sales, null as cost_price_FBO, null as cost_price_FBS, null as active_day, value as turnover_sum, null as content_percent, null as comment_qty, null as rating, null as size_ok, null as size_bigger, null as size_smaller
from wb.product_turnovers pt 
where toYYYYMMDD(date) in (
      {{ get_incremental_period(
        var("incremental_period"),
        var("incremental_shift"),
        "day"
      ) }}
    )
and product_id is not null
union all
SELECT date as dt, user_id, product_id, null as order_qty, null as order_cancel_qty, null as date_of_last_incomes, null as incomes_qty, null as incomes_cost_price, null as stocks_qty, null as stocks_InWayToClient_qty, null as stocks_InWayFromClient_qty, null as stocks_NotInOrders_qty, null as stocks_full_qty, null as stocks_active_sizes_qty, null as purchases_qty, null as return_qty, null as sales_qty, null as payPrice_sum, null as finalPrice_sum, null as discountedPrice_sum, null as commission_sum, null as sales_active_qty, null as defectsForPeriod_qty, null as shipmentCost_sum, null as shipment_amt, null as `position`, null as discounted_price, null as base_price, null as sale_price, null as promo_price, null as profit_sum, null as cost_sales, null as cost_price_FBO, null as cost_price_FBS, null as active_day, null as turnover_sum, content_percent as content_percent, null as comment_qty, null as rating, null as size_ok, null as size_bigger, null as size_smaller
from wb.product_optimization_states pos 
where toYYYYMMDD(date) in (
      {{ get_incremental_period(
        var("incremental_period"),
        var("incremental_shift"),
        "day"
      ) }}
    )
and product_id is not null
union all
SELECT date as dt, p.user_id as user_id, product_id, null as order_qty, null as order_cancel_qty, null as date_of_last_incomes, null as incomes_qty, null as incomes_cost_price, null as stocks_qty, null as stocks_InWayToClient_qty, null as stocks_InWayFromClient_qty, null as stocks_NotInOrders_qty, null as stocks_full_qty, null as stocks_active_sizes_qty, null as purchases_qty, null as return_qty, null as sales_qty, null as payPrice_sum, null as finalPrice_sum, null as discountedPrice_sum, null as commission_sum, null as sales_active_qty, null as defectsForPeriod_qty, null as shipmentCost_sum, null as shipment_amt, null as `position`, null as discounted_price, null as base_price, null as sale_price, null as promo_price, null as profit_sum, null as cost_sales, null as cost_price_FBO, null as cost_price_FBS, null as active_day, null as turnover_sum, null as content_percent, rate as comment_qty, null as rating, null as size_ok, null as size_bigger, null as size_smaller
from wb.product_comments pc
inner join wb.products p on p.id = pc.product_id
where toYYYYMMDD(date) in (
      {{ get_incremental_period(
        var("incremental_period"),
        var("incremental_shift"),
        "day"
      ) }}
    )
and product_id is not null
union all
SELECT date as dt, user_id, product_id, null as order_qty, null as order_cancel_qty, null as date_of_last_incomes, null as incomes_qty, null as incomes_cost_price, null as stocks_qty, null as stocks_InWayToClient_qty, null as stocks_InWayFromClient_qty, null as stocks_NotInOrders_qty, null as stocks_full_qty, null as stocks_active_sizes_qty, null as purchases_qty, null as return_qty, null as sales_qty, null as payPrice_sum, null as finalPrice_sum, null as discountedPrice_sum, null as commission_sum, null as sales_active_qty, null as defectsForPeriod_qty, null as shipmentCost_sum, null as shipment_amt, null as `position`, null as discounted_price, null as base_price, null as sale_price, null as promo_price, null as profit_sum, null as cost_sales, null as cost_price_FBO, null as cost_price_FBS, null as active_day, null as turnover_sum, null as content_percent, null as comment_qty, rating, size_ok, size_bigger, size_smaller
from wb.product_rating_histories pc
where toYYYYMMDD(date) in (
      {{ get_incremental_period(
        var("incremental_period"),
        var("incremental_shift"),
        "day"
      ) }}
    )
)
select 
	dt, user_id, product_id, brand_id, category_id, company_id, sum(order_qty), sum(order_cancel_qty), sum(order_qty*active_day) as order_active_qty, date_of_last_incomes, sum(incomes_qty), sum(incomes_cost_price), sum(stocks_qty), sum(stocks_InWayToClient_qty), sum(stocks_InWayFromClient_qty), sum(stocks_NotInOrders_qty), sum(stocks_full_qty), count(stocks_active_sizes_qty), sum(purchases_qty), sum(return_qty), sum(sales_qty), sum(payPrice_sum), sum(finalPrice_sum), sum(discountedPrice_sum), sum(commission_sum), sum(sales_active_qty), sum(defectsForPeriod_qty), sum(shipmentCost_sum), sum(shipment_amt), sum(`position`), sum(discounted_price), sum(base_price), sum(sale_price), sum(promo_price), sum(profit_sum), sum(cost_sales), max(cost_price_FBO), max(cost_price_FBS), max(active_day), sum(turnover_sum), sum(content_percent), sum(comment_qty), sum(rating), sum(size_ok), sum(size_bigger), sum(size_smaller)
from 
(	select dt, user_id, fct.product_id as product_id, COALESCE(bp.brand_id,0) as brand_id, COALESCE(cp.category_id, 0) as category_id, dictGet('dict_products','company_id',product_id) as company_id, order_qty, order_cancel_qty, date_of_last_incomes, incomes_qty, incomes_cost_price, stocks_qty, stocks_InWayToClient_qty, stocks_InWayFromClient_qty, stocks_NotInOrders_qty, stocks_full_qty, stocks_active_sizes_qty, purchases_qty, return_qty, sales_qty, payPrice_sum, finalPrice_sum, discountedPrice_sum, commission_sum, sales_active_qty, defectsForPeriod_qty, shipmentCost_sum, shipment_amt, `position`, discounted_price, base_price, sale_price, promo_price, profit_sum, cost_sales, cost_price_FBO, cost_price_FBS, NULLIF(ad.day_was_active,0) as active_day, turnover_sum, content_percent, comment_qty, rating, size_ok, size_bigger, size_smaller
	from fct 
	left join bp on bp.product_id = fct.product_id
	left join cp on cp.product_id = fct.product_id
	left join wb.active_days ad on ad.`date` = fct.dt and ad.product_id = fct.product_id
) t
where 1=1
group by dt, user_id, product_id, brand_id, category_id, company_id, date_of_last_incomes
