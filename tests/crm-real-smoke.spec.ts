import { execFileSync } from 'node:child_process'
import { expect, test, type APIRequestContext } from '@playwright/test'
import { loginViaGateway, REAL_AUTH_DEFAULT_BASE_URL } from './helpers/real-auth'

const baseURL = REAL_AUTH_DEFAULT_BASE_URL
const campId = '10001'
const userId = '12001'

type ApiPayload<T> = {
  code: number
  message?: string | null
  data: T
}

type SeedIds = {
  customerId: string
  messageId: string
  authorityId: string
  groupType: string
}

async function requestGateway<T>(
  request: APIRequestContext,
  token: string,
  method: 'POST' | 'DELETE',
  path: string,
  data: unknown,
) {
  const response = await request.fetch(`${baseURL}/api${path}`, {
    method,
    headers: { Authorization: `Bearer ${token}`, 'content-type': 'application/json' },
    data,
  })
  const responseText = await response.text()
  expect(response.ok(), `${method} ${path} HTTP ${response.status()}: ${responseText}`).toBeTruthy()
  const payload = JSON.parse(responseText) as ApiPayload<T>
  expect(payload.code, `${method} ${path} business response: ${responseText}`).toBe(0)
  expect(payload.data, `${method} ${path} should return data`).not.toBeNull()
  return payload.data
}

function postGateway<T>(request: APIRequestContext, token: string, path: string, data: unknown) {
  return requestGateway<T>(request, token, 'POST', path, data)
}

function deleteGateway<T>(request: APIRequestContext, token: string, path: string, data: unknown) {
  return requestGateway<T>(request, token, 'DELETE', path, data)
}

function seedCrmPrerequisites(ids: SeedIds) {
  runMysql(`
    DELETE FROM system_message_read WHERE message_id = ${ids.messageId};
    DELETE FROM system_message WHERE camp_id = ${campId} AND message_id = ${ids.messageId};
    INSERT INTO system_message (
      message_id,
      camp_id,
      group_type,
      title,
      content,
      related_type,
      related_id,
      priority,
      status,
      created_at
    ) VALUES (
      ${ids.messageId},
      ${campId},
      ${sqlString(ids.groupType)},
      ${sqlString(`CRM smoke message ${ids.messageId}`)},
      ${sqlString('CRM real smoke content')},
      'customer',
      ${ids.customerId},
      'normal',
      1,
      NOW()
    );

    DELETE FROM user_authority_exclude WHERE camp_id = ${campId} AND user_id = ${userId} AND authority_id = ${ids.authorityId};
    DELETE FROM authority_dict WHERE authority_id = ${ids.authorityId};
    INSERT INTO authority_dict (
      authority_id,
      authority_name,
      authority_code,
      authority_type,
      module_name,
      remark,
      seq_no,
      status,
      created_at
    ) VALUES (
      ${ids.authorityId},
      ${sqlString(`CRM smoke authority ${ids.authorityId}`)},
      ${sqlString(`crm.real.smoke.${ids.authorityId}`)},
      'notification',
      'CRM notification',
      'crm real smoke authority',
      1,
      1,
      NOW()
    );
  `)
}

function cleanupCrmPrerequisites(ids: SeedIds) {
  runMysql(`
    DELETE FROM crm_customer_tag_rel WHERE customer_id = ${ids.customerId};
    DELETE FROM crm_customer WHERE camp_id = ${campId} AND customer_id = ${ids.customerId};
    DELETE FROM system_message_read WHERE message_id = ${ids.messageId};
    DELETE FROM system_message WHERE camp_id = ${campId} AND message_id = ${ids.messageId};
    DELETE FROM user_authority_exclude WHERE camp_id = ${campId} AND user_id = ${userId} AND authority_id = ${ids.authorityId};
    DELETE FROM authority_dict WHERE authority_id = ${ids.authorityId};
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

function sqlString(value: string) {
  return `'${value.replace(/\\/g, '\\\\').replace(/'/g, "''")}'`
}

test('CRM customer, system message and notification authority APIs work through real gateway', async ({ request }) => {
  const token = await loginViaGateway(request)
  const suffix = `${Date.now()}`
  const ids: SeedIds = {
    customerId: `8${suffix.slice(-12)}`,
    messageId: `7${suffix.slice(-12)}`,
    authorityId: `6${suffix.slice(-12)}`,
    groupType: `crm-smoke-${suffix.slice(-10)}`,
  }
  const customerName = `TDD-crm-${suffix}`
  const mobile = `139${suffix.slice(-8)}`

  seedCrmPrerequisites(ids)

  try {
    const saveResult = await postGateway<{ customerId: string; message: string }>(request, token, '/customers/save', {
      customerId: ids.customerId,
      campId,
      name: customerName,
      mobile,
      profileJson: JSON.stringify({ source: 'real-smoke', suffix }),
    })
    expect(saveResult.customerId).toBe(ids.customerId)
    expect(saveResult.message).toBeTruthy()

    const pageAfterSave = await postGateway<{
      total: number
      pageNum: number
      pageSize: number
      list: Array<{ customerId: string; name: string; mobile: string; status: number }>
    }>(request, token, '/customers/page/get', {
      campId,
      pageNum: 1,
      pageSize: 10,
      keyword: customerName,
    })
    expect(pageAfterSave.total).toBeGreaterThanOrEqual(1)
    const savedCustomer = pageAfterSave.list.find((item) => item.customerId === ids.customerId)
    expect(savedCustomer).toBeTruthy()
    expect(savedCustomer?.name).toBe(customerName)
    expect(savedCustomer?.mobile).toBe(mobile)
    expect(savedCustomer?.status).toBe(1)

    const detail = await postGateway<{ customerId: string; name: string; mobile: string; profileJson: string; status: number }>(
      request,
      token,
      '/customers/detail/get',
      { campId, customerId: ids.customerId },
    )
    expect(detail.customerId).toBe(ids.customerId)
    expect(detail.name).toBe(customerName)
    expect(detail.mobile).toBe(mobile)
    expect(detail.profileJson).toContain('real-smoke')
    expect(detail.status).toBe(1)

    const messages = await postGateway<{
      total: number
      list: Array<{ messageId: string; groupType: string; title: string; isRead: boolean }>
    }>(request, token, '/systemMessage/page/get', {
      campId,
      pageNum: 1,
      pageSize: 10,
      groupType: ids.groupType,
    })
    expect(messages.total).toBe(1)
    const targetMessage = messages.list[0]
    expect(targetMessage.messageId).toBe(ids.messageId)
    expect(targetMessage.groupType).toBe(ids.groupType)
    expect(targetMessage.isRead).toBe(false)

    const unreadCountBefore = await postGateway<number>(request, token, '/systemMessage/unReadCount/get', {
      campId,
      groupType: ids.groupType,
    })
    expect(unreadCountBefore).toBe(1)

    const markReadResult = await postGateway<boolean>(request, token, '/systemMessage/read/update', {
      campId,
      messageId: targetMessage.messageId,
      groupType: ids.groupType,
    })
    expect(markReadResult).toBe(true)

    const unreadCountAfterSingleRead = await postGateway<number>(request, token, '/systemMessage/unReadCount/get', {
      campId,
      groupType: ids.groupType,
    })
    expect(unreadCountAfterSingleRead).toBe(0)

    const markAllReadResult = await postGateway<boolean>(request, token, '/systemMessage/read/all', {
      campId,
      groupType: ids.groupType,
    })
    expect(markAllReadResult).toBe(true)

    const authorityList = await postGateway<{
      modules: Array<{
        moduleName: string
        items: Array<{ authorityId: string; authorityName: string; authorityCode: string; excluded: boolean }>
      }>
    }>(request, token, '/userAuthority/notification/get', { campId })
    const authority = authorityList.modules.flatMap((module) => module.items).find((item) => item.authorityId === ids.authorityId)
    expect(authority?.authorityId).toBe(ids.authorityId)
    expect(authority?.excluded).toBe(false)

    const excludeResult = await postGateway<boolean>(request, token, '/userAuthority/exclude', {
      campId,
      authorityIds: [ids.authorityId],
    })
    expect(excludeResult).toBe(true)

    const authorityListAfterExclude = await postGateway<typeof authorityList>(request, token, '/userAuthority/notification/get', { campId })
    const excludedAuthority = authorityListAfterExclude.modules
      .flatMap((module) => module.items)
      .find((item) => item.authorityId === ids.authorityId)
    expect(excludedAuthority?.excluded).toBe(true)

    const restoreResult = await deleteGateway<boolean>(request, token, '/userAuthority/exclude', {
      campId,
      authorityIds: [ids.authorityId],
    })
    expect(restoreResult).toBe(true)

    const authorityListAfterRestore = await postGateway<typeof authorityList>(request, token, '/userAuthority/notification/get', { campId })
    const restoredAuthority = authorityListAfterRestore.modules
      .flatMap((module) => module.items)
      .find((item) => item.authorityId === ids.authorityId)
    expect(restoredAuthority?.excluded).toBe(false)
  } finally {
    cleanupCrmPrerequisites(ids)
  }
})
