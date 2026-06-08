import { expect, test } from '@playwright/test'
import { runMysql, selectActiveRooms } from './helpers/real-db'
import { appUrl, installRealSession, loginViaGateway } from './helpers/real-auth'

test('income report renders real accommodation report data through gateway', async ({ page, request }) => {
  seedIncomeReportRealSmokeData()

  const token = await loginViaGateway(request)
  const reportRequests: Array<Record<string, unknown>> = []

  page.on('request', (req) => {
    if (req.url().includes('/api/report/accommodation/get')) {
      reportRequests.push((req.postDataJSON() as Record<string, unknown>) ?? {})
    }
  })

  await page.setViewportSize({ width: 1440, height: 900 })
  await installRealSession(page, token, {
    providers: {
      'pms.incomeReport.provider': 'real',
    },
  })

  await page.goto(appUrl('/#/statistics/stay'))

  const contract = page.getByTestId('income-report-contract')
  await expect(page.locator('.income-report-page')).toHaveAttribute('data-provider', 'api', { timeout: 15_000 })
  await expect(contract).toHaveAttribute('data-endpoint', '/report/accommodation/get')
  await expect.poll(() => reportRequests.length).toBeGreaterThan(0)

  await page.locator('.income-date-range').click()
  await page.getByRole('button', { name: '2026-05-26' }).click()
  await page.getByRole('button', { name: '2026-05-31' }).click()
  await page.locator('.income-report-actions .is-primary').click()

  await expect(contract).toContainText('"startDate":"2026-05-26"', { timeout: 15_000 })
  await expect(contract).toContainText('"endDate":"2026-05-31"', { timeout: 15_000 })
  await expect.poll(() => reportRequests.some((body) => body.startDate === '2026-05-26' && body.endDate === '2026-05-31')).toBeTruthy()
  await expect(page.locator('.income-report-table-wrap')).toContainText('2026-05-26', { timeout: 15_000 })
  await expect(contract).toContainText(/\"total\":[1-9]/)
  await expect(page.locator('.income-report-page')).not.toContainText('HTTP 401')
  await expect(page.locator('.income-report-page')).not.toContainText('????')
})


function seedIncomeReportRealSmokeData() {
  const [room] = selectActiveRooms(1)

  runMysql(`
    SET NAMES utf8mb4;

    INSERT INTO order_main (
      order_id, camp_id, poi_id, room_category_id, room_id, channel_id, goods_id,
      order_no, out_order_no, order_type, status, guest_name, guest_mobile,
      start_at, end_at, day_num, total_price_cent, discount_price_cent, total_pay_price_cent,
      refund_price_cent, commission_price_cent, payment_fee_cent, platform_service_fee_cent,
      distribution_commission_cent, settlement_amount_cent, payment_status, payment_type_id,
      payment_way_id, source_type, remark, created_at, updated_at, created_by, updated_by,
      is_deleted, version_no
    ) VALUES
      (66101, 10001, ${room.poiId}, ${room.roomCategoryId}, ${room.roomId}, NULL, NULL,
       'REALINCOME20260526001', NULL, 'daily_room', 'completed', 'Real Income Guest', '13900066101',
       '2026-05-26 14:00:00', '2026-05-28 12:00:00', 2, 60000, 0, 60000,
       0, 6000, 0, 0, 0, 54000, 'paid', 17101,
       17201, 'frontdesk', 'real income report smoke order', '2026-05-25 10:00:00', '2026-05-25 10:00:00', 14001, 14001,
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
