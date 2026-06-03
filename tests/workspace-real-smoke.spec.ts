import { execFileSync } from 'node:child_process'
import { expect, test, type Locator } from '@playwright/test'
import { appUrl, installRealSession, loginViaGateway } from './helpers/real-auth'


test('workspace renders live dashboard and order tabs through real gateway APIs', async ({ page, request }) => {
  seedWorkspaceTodayData()

  const token = await loginViaGateway(request)
  const apiCalls: Array<{ url: string; body: Record<string, unknown> }> = []

  page.on('request', (req) => {
    const url = req.url()
    if (
      url.includes('/api/report/homePage/v2') ||
      url.includes('/api/orders/get') ||
      url.includes('/api/report/accommodation/management/analysis/get') ||
      url.includes('/api/campFlow/get') ||
      url.includes('/api/backlogs/get') ||
      url.includes('/api/memo/page/get') ||
      url.includes('/api/memo/add') ||
      url.includes('/api/memo/handle')
    ) {
      let body: Record<string, unknown> = {}
      try {
        body = req.postDataJSON() as Record<string, unknown>
      } catch {
        body = {}
      }
      apiCalls.push({ url, body })
    }
  })

  await page.setViewportSize({ width: 1440, height: 900 })
  await installRealSession(page, token, {
    providers: {
      pmsWorkspaceProvider: 'real',
    },
  })

  await page.goto(appUrl('/#/workspace'))

  await expect(page.getByRole('alert')).toHaveCount(0, { timeout: 15_000 })
  await expectMetricNumberAtLeast(page.getByTestId('workspace-metric-arrivals'), 2)
  await expectMetricNumberAtLeast(page.getByTestId('workspace-metric-staying'), 2)
  await expect(page.getByTestId('workspace-metric-revenue')).not.toContainText('--')

  const ordersPanel = page.locator('.workspace-orders-panel')
  await ordersPanel.locator('input[type="text"]').fill('Real Guest')
  await ordersPanel.locator('input[type="text"]').press('Enter')
  await expect(ordersPanel).toContainText('Real Guest C', { timeout: 15_000 })
  await expect(ordersPanel).toContainText('Real Guest D', { timeout: 15_000 })
  await expect(page.getByTestId('workspace-order-row')).toHaveCount(2)

  await expect.poll(async () => page.getByTestId('workspace-todo-panel').locator('.workspace-news-list li').count(), { timeout: 15_000 }).toBeGreaterThan(0)
  await page.getByTestId('workspace-todo-panel').locator('.segmented button').nth(1).click()
  await expect.poll(async () => page.getByTestId('workspace-todo-panel').locator('.workspace-news-list li').count(), { timeout: 15_000 }).toBeGreaterThan(0)
  await expect.poll(async () => page.locator('.workspace-traffic-card .workspace-traffic-group span').count(), { timeout: 15_000 }).toBeGreaterThan(0)

  const memoContent = `real-workspace-memo-${Date.now()}`
  await page.locator('.memo-input input').fill(memoContent)
  await page.locator('.memo-input button').click()
  await expect(page.locator('.memo-panel')).toContainText(memoContent, { timeout: 15_000 })
  await page.locator('.workspace-memo-list button').first().click()
  await expect(page.getByRole('alert')).toHaveCount(0, { timeout: 15_000 })
  await page.locator('.memo-panel .segmented button').nth(1).click()
  await expect(page.locator('.memo-panel')).toContainText(memoContent, { timeout: 15_000 })

  await ordersPanel.locator('.segmented button').nth(1).click()
  await expect(ordersPanel).toContainText('Real Guest B', { timeout: 15_000 })
  await expect(page.getByTestId('workspace-order-row')).toHaveCount(1)

  await ordersPanel.locator('.segmented button').nth(2).click()
  await expect(ordersPanel).toContainText('Real Guest A', { timeout: 15_000 })
  await expect(page.getByTestId('workspace-order-row')).toHaveCount(1)

  expect(apiCalls.some((call) => call.url.includes('/api/report/homePage/v2'))).toBeTruthy()
  expect(apiCalls.some((call) => call.url.includes('/api/campFlow/get'))).toBeTruthy()
  expect(apiCalls.some((call) => call.url.includes('/api/backlogs/get'))).toBeTruthy()
  expect(apiCalls.some((call) => call.url.includes('/api/memo/add') && call.body.content === memoContent)).toBeTruthy()
  expect(apiCalls.some((call) => call.url.includes('/api/memo/handle') && call.body.isHandle === 1)).toBeTruthy()
  expect(apiCalls.some((call) => call.url.includes('/api/orders/get') && call.body.orderType === '11')).toBeTruthy()
  expect(apiCalls.some((call) => call.url.includes('/api/orders/get') && call.body.orderType === '12')).toBeTruthy()
  expect(apiCalls.some((call) => call.url.includes('/api/orders/get') && call.body.orderType === '13')).toBeTruthy()
})

async function expectMetricNumberAtLeast(locator: Locator, minimum: number) {
  await expect
    .poll(
      async () => {
        const text = (await locator.textContent()) ?? ''
        const numbers = text.match(/\d+/g)
        return numbers ? Number(numbers[numbers.length - 1]) : Number.NaN
      },
      { timeout: 15_000 },
    )
    .toBeGreaterThanOrEqual(minimum)
}

function seedWorkspaceTodayData() {
  runMysql(`
    SET NAMES utf8mb4;
    SET @today = CURDATE();
    SET @yesterday = DATE_SUB(@today, INTERVAL 1 DAY);
    SET @tomorrow = DATE_ADD(@today, INTERVAL 1 DAY);
    SET @after_tomorrow = DATE_ADD(@today, INTERVAL 2 DAY);

    INSERT INTO order_main (
      order_id, camp_id, poi_id, room_category_id, room_id, channel_id, goods_id,
      order_no, out_order_no, order_type, status, guest_name, guest_mobile,
      start_at, end_at, day_num, total_price_cent, discount_price_cent, total_pay_price_cent,
      refund_price_cent, commission_price_cent, payment_fee_cent, platform_service_fee_cent,
      distribution_commission_cent, settlement_amount_cent, payment_status, payment_type_id,
      payment_way_id, source_type, remark, created_by, updated_by, is_deleted, version_no
    ) VALUES
      (28531, 10001, 11001, 22001, 23001, NULL, NULL,
       'REALSMOKEDAILY0001', NULL, 'daily_room', 'checked_in', 'Real Guest A', '13900003101',
       TIMESTAMP(@yesterday, '14:00:00'), TIMESTAMP(@today, '12:00:00'), 1, 31800, 0, 31800,
       0, 0, 0, 0, 0, 31800, 'paid', 17101, 17201, 'frontdesk', 'real smoke departing order', 14001, 14001, 0, 0),
      (28532, 10001, 11001, 22003, 23007, 25301, NULL,
       'REALSMOKEDAILY0002', 'MT-REALSMOKE-DAILY-002', 'daily_room', 'checked_in', 'Real Guest B', '13900003102',
       TIMESTAMP(@yesterday, '15:00:00'), TIMESTAMP(@tomorrow, '12:00:00'), 2, 99600, 0, 99600,
       0, 0, 0, 0, 0, 99600, 'paid', 17101, 17202, 'channel', 'real smoke staying order', 14001, 14001, 0, 0),
      (28533, 10001, 11001, 22002, 23004, 25302, NULL,
       'REALSMOKEDAILY0003', 'CTRIP-REALSMOKE-DAILY-003', 'daily_room', 'booked', 'Real Guest C', '13900003103',
       TIMESTAMP(@today, '14:00:00'), TIMESTAMP(@tomorrow, '12:00:00'), 1, 37800, 0, 37800,
       0, 0, 0, 0, 0, 37800, 'paid', 17101, 17206, 'channel', 'real smoke arrival order', 14001, 14001, 0, 0),
      (28534, 10001, 11001, 22001, 23002, NULL, NULL,
       'REALSMOKEDAILY0004', NULL, 'daily_room', 'booked', 'Real Guest D', '13900003104',
       TIMESTAMP(@today, '16:00:00'), TIMESTAMP(@after_tomorrow, '12:00:00'), 2, 59600, 0, 59600,
       0, 0, 0, 0, 0, 59600, 'paid', 17101, 17201, 'frontdesk', 'real smoke second arrival order', 14001, 14001, 0, 0)
    ON DUPLICATE KEY UPDATE
      poi_id = VALUES(poi_id), room_category_id = VALUES(room_category_id), room_id = VALUES(room_id), channel_id = VALUES(channel_id),
      order_no = VALUES(order_no), out_order_no = VALUES(out_order_no), order_type = VALUES(order_type), status = VALUES(status),
      guest_name = VALUES(guest_name), guest_mobile = VALUES(guest_mobile), start_at = VALUES(start_at), end_at = VALUES(end_at),
      day_num = VALUES(day_num), total_price_cent = VALUES(total_price_cent), discount_price_cent = VALUES(discount_price_cent),
      total_pay_price_cent = VALUES(total_pay_price_cent), refund_price_cent = VALUES(refund_price_cent), commission_price_cent = VALUES(commission_price_cent),
      payment_fee_cent = VALUES(payment_fee_cent), platform_service_fee_cent = VALUES(platform_service_fee_cent),
      distribution_commission_cent = VALUES(distribution_commission_cent), settlement_amount_cent = VALUES(settlement_amount_cent),
      payment_status = VALUES(payment_status), payment_type_id = VALUES(payment_type_id), payment_way_id = VALUES(payment_way_id),
      source_type = VALUES(source_type), remark = VALUES(remark), is_deleted = VALUES(is_deleted), updated_by = VALUES(updated_by);

    INSERT INTO order_guest (id, order_id, guest_name, guest_mobile, guest_id_card, guest_type)
    VALUES
      (2853101, 28531, 'Real Guest A', '13900003101', '440300199001013101', 'adult'),
      (2853201, 28532, 'Real Guest B', '13900003102', '440300199002023102', 'adult'),
      (2853301, 28533, 'Real Guest C', '13900003103', '440300199003033103', 'adult'),
      (2853401, 28534, 'Real Guest D', '13900003104', '440300199004043104', 'adult')
    ON DUPLICATE KEY UPDATE
      guest_name = VALUES(guest_name), guest_mobile = VALUES(guest_mobile), guest_id_card = VALUES(guest_id_card), guest_type = VALUES(guest_type);
  `)
}

function runMysql(sql: string) {
  const mysqlPath = process.env.PMS_MYSQL_PATH ?? 'C:/Program Files/MySQL/MySQL Server 8.0/bin/mysql.exe'
  execFileSync(
    mysqlPath,
    [
      `--host=${process.env.PMS_DB_HOST ?? '127.0.0.1'}`,
      `--user=${process.env.PMS_DB_USER ?? 'root'}`,
      `--password=${process.env.PMS_DB_PASSWORD ?? '123456'}`,
      `--database=${process.env.PMS_DB_NAME ?? 'zp_pms'}`,
      '--batch',
      '--raw',
      '--execute',
      sql,
    ],
    { encoding: 'utf8' },
  )
}
