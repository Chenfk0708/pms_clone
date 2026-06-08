import { expect, test } from '@playwright/test'
import { runMysql, selectActiveRooms } from './helpers/real-db'
import { appUrl, installRealSession, loginViaGateway } from './helpers/real-auth'

test('finance pages render through real gateway APIs without route mocks', async ({ page, request }) => {
  seedFinanceRealSmokeData()

  const token = await loginViaGateway(request)
  const apiCalls: string[] = []

  page.on('request', (req) => {
    const url = req.url()
    if (url.includes('/api/accountBookPaymentWay/page/get') || url.includes('/api/report/storer/statement/get')) {
      apiCalls.push(url)
    }
  })

  await page.setViewportSize({ width: 1440, height: 900 })
  await installRealSession(page, token, {
    providers: {
      'pms.totalLedgerProvider': 'real',
      'pms.statementOrderProvider': 'real',
    },
  })

  await page.goto(appUrl('/#/statistics/totalLedger'))
  const totalLedgerContract = page.getByTestId('total-ledger-service-contract')
  await expect(totalLedgerContract).toHaveAttribute('data-provider', 'api', { timeout: 15_000 })
  await expect(totalLedgerContract).toHaveAttribute('data-endpoint', '/accountBookPaymentWay/page/get')
  await expect(page.locator('.total-ledger-summary')).toContainText('净收入')
  await expect(page.locator('.total-ledger-table-section')).toContainText('收支汇总表')
  await expect(page.locator('.total-ledger-page')).not.toContainText('HTTP 401')
  await expect(page.locator('.total-ledger-page')).not.toContainText('请先登录')

  await page.getByRole('button', { name: '开始日期' }).click()
  await page.getByRole('button', { name: '2026-05-26' }).click()
  await page.getByRole('button', { name: '2026-05-31' }).click()
  await expect(totalLedgerContract).toHaveAttribute('data-request-body', /"beginTime":"2026-05-26"/, {
    timeout: 15_000,
  })
  await expect(totalLedgerContract).toHaveAttribute('data-request-body', /"endTime":"2026-05-31"/, {
    timeout: 15_000,
  })
  await expect(page.locator('.total-ledger-pagination')).toContainText('共 3 条', { timeout: 15_000 })

  await page.goto(appUrl('/#/statistics/statementOrder'))
  const statementContract = page.locator('[aria-label="品牌小程序订单数据服务"]')
  await expect(statementContract).toContainText('provider=api', { timeout: 15_000 })
  await expect(statementContract).toContainText('path=/report/storer/statement/get')
  await expect(statementContract).toContainText('campId=10001')
  await expect(page.locator('.statement-order-table-shell')).toContainText('DEMO20260526003')
  await expect(page.locator('.statement-order-table-shell')).toContainText('共 2 条订单')
  await expect(page.locator('.statement-order-page')).not.toContainText('HTTP 401')
  await expect(page.locator('.statement-order-page')).not.toContainText('请先登录')

  expect(apiCalls.some((url) => url.includes('/api/accountBookPaymentWay/page/get'))).toBeTruthy()
  expect(apiCalls.some((url) => url.includes('/api/report/storer/statement/get'))).toBeTruthy()
})


function seedFinanceRealSmokeData() {
  const [room] = selectActiveRooms(1)

  runMysql(`
    SET NAMES utf8mb4;

    INSERT INTO ledger_entry (
      ledger_entry_id, camp_id, poi_id, entry_type, payment_type_id, payment_way_id,
      order_id, source_type, source_id, amount_cent, occurred_at, operator_id,
      operator_name, biz_date, remark, attachment_json
    ) VALUES
      (66011, 10001, ${room.poiId}, 'income', 17101, 17201,
       NULL, 'frontdesk', NULL, 120000, '2026-05-26 10:00:00', 14001,
       'Real Finance Smoke', '2026-05-26', 'real smoke income 2026-05-26', NULL),
      (66012, 10001, ${room.poiId}, 'expense', 17106, 17201,
       NULL, 'frontdesk', NULL, 20000, '2026-05-26 11:00:00', 14001,
       'Real Finance Smoke', '2026-05-26', 'real smoke expense 2026-05-26', NULL),
      (66013, 10001, ${room.poiId}, 'income', 17101, 17201,
       NULL, 'frontdesk', NULL, 80000, '2026-05-27 10:00:00', 14001,
       'Real Finance Smoke', '2026-05-27', 'real smoke income 2026-05-27', NULL)
    ON DUPLICATE KEY UPDATE
      poi_id = VALUES(poi_id),
      entry_type = VALUES(entry_type),
      payment_type_id = VALUES(payment_type_id),
      payment_way_id = VALUES(payment_way_id),
      order_id = VALUES(order_id),
      source_type = VALUES(source_type),
      amount_cent = VALUES(amount_cent),
      occurred_at = VALUES(occurred_at),
      operator_id = VALUES(operator_id),
      operator_name = VALUES(operator_name),
      biz_date = VALUES(biz_date),
      remark = VALUES(remark),
      attachment_json = VALUES(attachment_json);

    INSERT INTO order_main (
      order_id, camp_id, poi_id, room_category_id, room_id, channel_id, goods_id,
      order_no, out_order_no, order_type, status, guest_name, guest_mobile,
      start_at, end_at, day_num, total_price_cent, discount_price_cent, total_pay_price_cent,
      refund_price_cent, commission_price_cent, payment_fee_cent, platform_service_fee_cent,
      distribution_commission_cent, settlement_amount_cent, payment_status, payment_type_id,
      payment_way_id, source_type, remark, created_at, updated_at, created_by, updated_by,
      is_deleted, version_no
    ) VALUES
      (66051, 10001, ${room.poiId}, ${room.roomCategoryId}, NULL, NULL, NULL,
       'DEMO20260526003', NULL, 'daily_room', 'booked', 'Real Mall Guest A', '13900066051',
       '2026-07-01 14:00:00', '2026-07-02 12:00:00', 1, 38800, 0, 38800,
       0, 0, 0, 0, 0, 38800, 'paid', 17101,
       17201, 'mall', 'real finance statement smoke order A', '2026-05-26 10:00:00', '2026-05-26 10:00:00', 14001, 14001,
       0, 0),
      (66052, 10001, ${room.poiId}, ${room.roomCategoryId}, NULL, NULL, NULL,
       'DEMO20260527004', NULL, 'daily_room', 'booked', 'Real Mall Guest B', '13900066052',
       '2026-07-02 14:00:00', '2026-07-03 12:00:00', 1, 29800, 0, 29800,
       0, 0, 0, 0, 0, 29800, 'paid', 17101,
       17201, 'mall', 'real finance statement smoke order B', '2026-05-27 10:00:00', '2026-05-27 10:00:00', 14001, 14001,
       0, 0)
    ON DUPLICATE KEY UPDATE
      poi_id = VALUES(poi_id),
      room_category_id = VALUES(room_category_id),
      room_id = VALUES(room_id),
      channel_id = VALUES(channel_id),
      goods_id = VALUES(goods_id),
      out_order_no = VALUES(out_order_no),
      order_type = VALUES(order_type),
      status = VALUES(status),
      guest_name = VALUES(guest_name),
      guest_mobile = VALUES(guest_mobile),
      start_at = VALUES(start_at),
      end_at = VALUES(end_at),
      day_num = VALUES(day_num),
      total_price_cent = VALUES(total_price_cent),
      discount_price_cent = VALUES(discount_price_cent),
      total_pay_price_cent = VALUES(total_pay_price_cent),
      refund_price_cent = VALUES(refund_price_cent),
      commission_price_cent = VALUES(commission_price_cent),
      payment_fee_cent = VALUES(payment_fee_cent),
      platform_service_fee_cent = VALUES(platform_service_fee_cent),
      distribution_commission_cent = VALUES(distribution_commission_cent),
      settlement_amount_cent = VALUES(settlement_amount_cent),
      payment_status = VALUES(payment_status),
      payment_type_id = VALUES(payment_type_id),
      payment_way_id = VALUES(payment_way_id),
      source_type = VALUES(source_type),
      remark = VALUES(remark),
      created_at = VALUES(created_at),
      updated_at = VALUES(updated_at),
      created_by = VALUES(created_by),
      updated_by = VALUES(updated_by),
      is_deleted = VALUES(is_deleted),
      version_no = VALUES(version_no);
  `)
}
