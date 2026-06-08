import { execFileSync } from 'node:child_process'
import { expect, test } from '@playwright/test'
import { appUrl, installRealSession, loginViaGateway } from './helpers/real-auth'

test('version subscription uses real gateway APIs', async ({ page, request }) => {
  seedVersionSubscriptionCatalogData()
  const token = await loginViaGateway(request)
  const apiPaths: string[] = []

  page.on('request', (req) => {
    const url = new URL(req.url())
    if (url.pathname.startsWith('/api/')) apiPaths.push(url.pathname)
  })

  await page.setViewportSize({ width: 1440, height: 900 })
  await installRealSession(page, token, {
    providers: {
      'pms.versionSubscriptionProvider': 'real',
    },
  })

  await page.goto(appUrl('/#/version/subscriptionCenter'))

  await expect(page.locator('.version-subscription-page')).toHaveAttribute('data-provider', 'api', { timeout: 15_000 })
  await expect(page.locator('.version-subscription-page')).toHaveAttribute('data-response-state', 'success', { timeout: 15_000 })
  await expect(page.getByRole('alert')).toHaveCount(0, { timeout: 15_000 })
  await expect(page.getByRole('list').first().locator('li')).toHaveCount(2, { timeout: 15_000 })

  await page.locator('.version-subscription-duration button').nth(1).click()
  await page.locator('.version-subscription-buy').click()
  await expect(page).toHaveURL(/\/version\/applicationPayment\/detail\?plan=.*&duration=2y/, { timeout: 15_000 })

  expect(apiPaths).toEqual(
    expect.arrayContaining([
      '/api/edition/resource/get',
      '/api/weiRoomCategories/page/get',
      '/api/version/subscription/order/submit',
    ]),
  )
})

function seedVersionSubscriptionCatalogData() {
  const roomCategoryId = selectActiveRoomCategoryId()

  runMysql(`
    SET NAMES utf8mb4;

    INSERT INTO pms_camp (
      camp_id, name, type, network_num, province_id, province_name, city_id, city_name,
      county_id, county_name, address, contact_number, status, created_by, updated_by,
      is_deleted, version_no
    ) VALUES (
      64, CONVERT(0xE4B8ADE5A4AEE59586E59381E79BAEE5BD95 USING utf8mb4), 1, 'network-64',
      '440000', CONVERT(0xE5B9BFE4B89CE79C81 USING utf8mb4),
      '440300', CONVERT(0xE6B7B1E59CB3E5B882 USING utf8mb4),
      '440305', CONVERT(0xE58D97E5B1B1E58CBA USING utf8mb4),
      CONVERT(0xE58D97E5B1B1E58CBAE7A791E68A80E59BAD USING utf8mb4),
      '0755-00000000', 0, 12001, 12001, 0, 0
    ) ON DUPLICATE KEY UPDATE
      name = VALUES(name), status = VALUES(status), is_deleted = VALUES(is_deleted), updated_by = VALUES(updated_by);

    INSERT INTO goods_main (
      goods_id, camp_id, goods_type, name, category_id, category_name, room_category_type,
      selling_price_cent, original_price_cent, settlement_price_cent, stock, stock_mode,
      shelf_status, effective_start_at, effective_end_at, description, refund_rule,
      reservation_phone, reservation_note, status, remark, is_deleted
    ) VALUES
      (98631, 64, '2', CONVERT(0xE6A087E58786E78988 USING utf8mb4), 1,
       CONVERT(0xE78988E69CACE8AEA2E99885 USING utf8mb4), 1, 0, 0, 0, 9999, 'unlimited', 'on_shelf',
       '2026-01-01 00:00:00', '2027-12-31 23:59:59',
       CONVERT(0xE98082E59088E58D95E5BA97E59FBAE7A180E8BF90E890A5E38082 USING utf8mb4),
       CONVERT(0xE8B4ADE4B9B0E5908EE68C89E58D8FE8AEAEE689A7E8A18C USING utf8mb4),
       '13800000000', CONVERT(0xE8AFB7E88194E7B3BBE5AEA2E69C8DE7A1AEE8AEA4 USING utf8mb4),
       'published', 'sort:1', 0),
      (98632, 64, '2', CONVERT(0xE79585E4BAABE78988 USING utf8mb4), 1,
       CONVERT(0xE78988E69CACE8AEA2E99885 USING utf8mb4), 1, 138800, 158800, 120000, 9999, 'unlimited', 'on_shelf',
       '2026-01-01 00:00:00', '2027-12-31 23:59:59',
       CONVERT(0xE8A686E79B96E4BD8FE5AEBFE7AEA1E79086E38081E59FBAE7A180E6B8A0E98193E5928CE4B893E4B89AE68AA5E8A1A8E38082 USING utf8mb4),
       CONVERT(0xE8B4ADE4B9B0E5908EE68C89E58D8FE8AEAEE689A7E8A18C USING utf8mb4),
       '13800000000', CONVERT(0xE8AFB7E88194E7B3BBE5AEA2E69C8DE7A1AEE8AEA4 USING utf8mb4),
       'published', 'sort:2', 0)
    ON DUPLICATE KEY UPDATE
      name = VALUES(name), goods_type = VALUES(goods_type), room_category_type = VALUES(room_category_type),
      selling_price_cent = VALUES(selling_price_cent), original_price_cent = VALUES(original_price_cent),
      settlement_price_cent = VALUES(settlement_price_cent), stock = VALUES(stock), stock_mode = VALUES(stock_mode),
      shelf_status = VALUES(shelf_status), effective_start_at = VALUES(effective_start_at),
      effective_end_at = VALUES(effective_end_at), description = VALUES(description), status = VALUES(status),
      remark = VALUES(remark), is_deleted = VALUES(is_deleted);

    INSERT INTO goods_sku (
      goods_sku_id, camp_id, goods_id, room_category_product_id, sku_name,
      selling_price_cent, original_price_cent, stock, sort_no, status, is_deleted
    ) VALUES
      (986311, 64, 98631, '986311', '12 months', 0, 0, 9999, 1, 'published', 0),
      (986321, 64, 98632, '986321', '12 months', 138800, 158800, 9999, 1, 'published', 0),
      (986322, 64, 98632, '986322', '24 months', 277600, 317600, 9999, 2, 'published', 0)
    ON DUPLICATE KEY UPDATE
      sku_name = VALUES(sku_name), selling_price_cent = VALUES(selling_price_cent),
      original_price_cent = VALUES(original_price_cent), stock = VALUES(stock), sort_no = VALUES(sort_no),
      status = VALUES(status), is_deleted = VALUES(is_deleted);

    INSERT INTO goods_room_category_rel (id, goods_id, room_category_id)
    VALUES
      (9863122001, 98631, ${roomCategoryId}),
      (9863222001, 98632, ${roomCategoryId})
    ON DUPLICATE KEY UPDATE
      goods_id = VALUES(goods_id), room_category_id = VALUES(room_category_id);
  `)
}

function selectActiveRoomCategoryId() {
  const output = runMysql(`
    SET NAMES utf8mb4;
    SELECT CAST(room_category_id AS CHAR) AS room_category_id
    FROM room_category
    WHERE camp_id = 10001
      AND status = 1
      AND is_deleted = 0
    ORDER BY sort_no ASC, room_category_id ASC
    LIMIT 1;
  `)
  const value = output.trim().split(/\r?\n/).filter(Boolean).slice(1)[0]
  if (!value || !/^\d+$/.test(value)) {
    throw new Error(`version subscription real smoke requires an active room_category in camp 10001, got ${value ?? '<empty>'}`)
  }
  return value
}

function runMysql(sql: string) {
  const mysqlPath = process.env.PMS_MYSQL_PATH ?? 'C:/Program Files/MySQL/MySQL Server 8.0/bin/mysql.exe'
  return execFileSync(
    mysqlPath,
    [
      `--host=${process.env.PMS_DB_HOST ?? '127.0.0.1'}`,
      `--user=${process.env.PMS_DB_USER ?? 'root'}`,
      `--password=${process.env.PMS_DB_PASSWORD ?? '123456'}`,
      `--database=${process.env.PMS_DB_NAME ?? 'zp_pms'}`,
      '--default-character-set=utf8mb4',
      '--batch',
      '--raw',
      '--execute',
      sql,
    ],
    { encoding: 'utf8' },
  )
}
