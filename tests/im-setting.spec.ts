import { expect, test, type Page } from '@playwright/test'

const pagePath = '/setting/imSetting?campId=1796067693589061634&userId=1796067693261905922'
const appBaseURL = process.env.PMS_TEST_BASE_URL

const phraseListEndpoint = '**/imWords/page/get'
const phraseGroupEndpoint = '**/imWordsGroup/tree/get'
const shortcutEndpoint = '**/systemConfigs/user/shortcut/get'
const commonsEndpoint = '**/commons/get'
const imAccountEndpoint = '**/imYunxinUser/get'
const editionEndpoint = '**/edition/resource/get'
const menuOptionEndpoint = '**/menu/optionJsons/get'

function appUrl(routePath: string) {
  return appBaseURL ? `${appBaseURL}${routePath}` : routePath
}

test.beforeEach(async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.addInitScript(() => {
    window.localStorage.setItem('pms.imSettingProvider', 'mock')
    window.localStorage.removeItem('pms.imSettingMockState')
    window.localStorage.removeItem('pms.imSetting.diagnostics')
  })
})

test('/setting/imSetting renders provider-driven conversation settings without backend requests', async ({ page }) => {
  const requestedUrls: string[] = []
  for (const endpoint of [
    phraseListEndpoint,
    phraseGroupEndpoint,
    shortcutEndpoint,
    commonsEndpoint,
    imAccountEndpoint,
    editionEndpoint,
    menuOptionEndpoint,
  ]) {
    await page.route(endpoint, async (route) => {
      requestedUrls.push(route.request().url())
      await route.fulfill({ status: 500, json: { success: false, errorMsg: 'mock provider must not call backend' } })
    })
  }

  await page.goto(appUrl(pagePath))

  await expect(page.locator('.sidebar').getByRole('link', { name: '会话设置', exact: true })).toHaveClass(/is-active/)
  await expect(page.getByRole('heading', { name: '会话设置中心' })).toBeVisible()
  await expect(page.getByRole('button', { name: '常用语' })).toHaveAttribute('aria-pressed', 'true')
  await expect(page.getByRole('button', { name: '自动回复设置' })).toBeVisible()
  await expect(page.getByRole('button', { name: '页面设置' })).toBeVisible()
  await expect(page.getByRole('button', { name: '标签设置' })).toBeVisible()
  await expect(page.getByRole('button', { name: '快捷键设置' })).toBeVisible()
  await expect(page.getByRole('button', { name: '版本设置' })).toBeVisible()

  await expect(page.getByRole('button', { name: '微信客服运营台' })).toBeVisible()
  await expect(page.getByRole('button', { name: '聊天工具栏' })).toBeVisible()
  await expect(page.getByRole('button', { name: '接待配置' })).toBeVisible()

  const phrasePanel = page.getByRole('region', { name: '常用语管理' })
  await expect(phrasePanel.getByRole('button', { name: '新增常用语' })).toBeVisible()
  await expect(phrasePanel.getByRole('button', { name: '新建分类' })).toBeVisible()
  await expect(phrasePanel.getByRole('button', { name: '导出常用语' })).toBeVisible()
  await expect(phrasePanel.getByText('入住前停车指引')).toBeVisible()
  await expect(phrasePanel.getByText('深夜入住须知')).toBeVisible()
  await expect(phrasePanel.getByText('退房追评邀请')).toBeVisible()
  await expect(page.locator('.im-setting-page')).not.toContainText(/mock 数据|mock provider|未接入|阻塞|后端未就绪|后端接口未完成/)

  expect(requestedUrls).toEqual([])

  const diagnostics = await readDiagnostics(page)
  expect(diagnostics).toMatchObject({
    provider: 'mock',
    state: 'success',
    currentTab: 'phrases',
    requests: {
      phraseGroups: {
        endpoint: '/imWordsGroup/tree/get',
        request: {
          campId: '1796067693589061634',
        },
      },
      phraseList: {
        endpoint: '/imWords/page/get',
        request: {
          campId: '1796067693589061634',
          pageNum: 1,
          pageSize: 10,
          keyword: '',
          isTemplate: 0,
          imWordsGroupId: null,
          scope: 1,
        },
      },
      shortcuts: {
        endpoint: '/systemConfigs/user/shortcut/get',
        request: {
          userId: '1796067693261905922',
        },
      },
    },
  })
})

test('/setting/imSetting supports filtering, phrase editing, shortcut saving, and coordinated routes', async ({ page }) => {
  await page.goto(appUrl(pagePath))

  const phrasePanel = page.getByRole('region', { name: '常用语管理' })
  await phrasePanel.getByRole('button', { name: '入住前沟通' }).click()
  await phrasePanel.getByLabel('常用语关键词').fill('停车')
  await phrasePanel.getByRole('button', { name: '查询' }).click()

  await expect(phrasePanel.getByText('入住前停车指引')).toBeVisible()
  await expect(phrasePanel.getByText('深夜入住须知')).toHaveCount(0)
  let diagnostics = await waitForDiagnostics(page, (value) => value?.requestSummary?.keyword === '停车')
  expect(diagnostics.requestSummary).toMatchObject({
    keyword: '停车',
    groupId: 'group-checkin',
  })

  await phrasePanel.getByRole('button', { name: '查看 入住前停车指引' }).click()
  await expect(page.getByRole('dialog', { name: '常用语详情' })).toContainText('停车场位于 3 层')
  await page.getByRole('button', { name: '关闭常用语详情' }).click()

  await phrasePanel.getByRole('button', { name: '新增常用语' }).click()
  await page.getByLabel('常用语标题').fill('自助入住提醒')
  await page.getByLabel('常用语内容').fill('已为您准备自助入住指引，抵店后可直接输入门锁密码办理入住。')
  await page.getByRole('button', { name: '保存常用语' }).click()
  await expect(page.getByRole('status')).toContainText('常用语已保存')
  await expect(phrasePanel.getByText('自助入住提醒')).toBeVisible()

  await page.getByRole('button', { name: '快捷键设置' }).click()
  const shortcutPanel = page.getByRole('region', { name: '快捷键设置' })
  await expect(shortcutPanel.getByText('推荐房源')).toBeVisible()
  await shortcutPanel.getByRole('button', { name: '启用 推荐房源' }).click()
  await shortcutPanel.getByRole('button', { name: '保存快捷键' }).click()
  await expect(page.getByRole('status')).toContainText('快捷键设置已保存')

  diagnostics = await waitForDiagnostics(page, (value) => value?.lastAction?.endpoint === '/systemConfigs/user/shortcut/save')
  expect(diagnostics.lastAction).toMatchObject({
    endpoint: '/systemConfigs/user/shortcut/save',
    request: {
      userId: '1796067693261905922',
    },
  })

  await page.getByRole('button', { name: '微信客服运营台' }).click()
  await expect(page).toHaveURL(/\/scrm\/wechatService\/manage$/)
})

test('/setting/imSetting exposes empty and error states from the mock provider', async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.setItem('pms.imSettingMockState', 'empty')
  })

  await page.goto(appUrl(pagePath))

  const phrasePanel = page.getByRole('region', { name: '常用语管理' })
  await expect(phrasePanel.getByText('当前分类下暂无常用语')).toBeVisible()
  let diagnostics = await waitForDiagnostics(page)
  expect(diagnostics).toMatchObject({
    provider: 'mock',
    state: 'empty',
  })

  await page.evaluate(() => {
    window.localStorage.setItem('pms.imSettingMockState', 'error')
  })
  await phrasePanel.getByRole('button', { name: '刷新' }).click()

  await expect(page.getByRole('alert')).toContainText('会话设置数据加载失败，请重试')
  await expect(page.getByRole('button', { name: '重试' })).toBeVisible()
  diagnostics = await waitForDiagnostics(page, (value) => value?.state === 'error')
  expect(diagnostics).toMatchObject({
    provider: 'mock',
    state: 'error',
  })
})

test('/setting/imSetting can switch to captured api contracts', async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.setItem('pms.imSettingProvider', 'api')
  })

  const requests = {
    phraseGroups: null as Record<string, unknown> | null,
    phraseList: null as Record<string, unknown> | null,
    shortcuts: null as Record<string, unknown> | null,
    commons: null as Record<string, unknown> | null,
  }

  await page.route(phraseGroupEndpoint, async (route) => {
    requests.phraseGroups = route.request().postDataJSON() as Record<string, unknown>
    await route.fulfill({
      json: {
        success: true,
        errorCode: null,
        errorMsg: null,
        errorDetail: null,
        data: {
          imWordsGroupGetViews: [
            { imWordsGroupId: 'api-group-1', name: '平台话术', sortNum: 1, children: [] },
          ],
        },
      },
    })
  })

  await page.route(phraseListEndpoint, async (route) => {
    requests.phraseList = route.request().postDataJSON() as Record<string, unknown>
    await route.fulfill({
      json: {
        success: true,
        errorCode: null,
        errorMsg: null,
        errorDetail: null,
        data: {
          total: 1,
          size: 10,
          current: 1,
          pageNum: 1,
          hasNextPage: false,
          pages: 1,
          list: [
            {
              imWordsId: 'api-phrase-1',
              title: '接口欢迎语',
              content: '这是接口返回的会话欢迎语',
              groupName: '平台话术',
              imWordsGroupId: 'api-group-1',
              scope: 1,
              updatedAt: '2026-05-19 18:30:00',
            },
          ],
        },
      },
    })
  })

  await page.route(shortcutEndpoint, async (route) => {
    requests.shortcuts = route.request().postDataJSON() as Record<string, unknown>
    await route.fulfill({
      json: {
        success: true,
        errorCode: null,
        errorMsg: null,
        errorDetail: null,
        data: {
          userShortcuts: [
            { code: 0, name: '推荐激活键', win: 'Ctrl+Shift+1', mac: '⌘⇧1', isOpen: 1 },
            { code: 9, name: '推荐房源', win: 'Ctrl+Shift+9', mac: '⌘⇧9', isOpen: 1 },
          ],
        },
      },
    })
  })

  await page.route(commonsEndpoint, async (route) => {
    requests.commons = route.request().postDataJSON() as Record<string, unknown>
    await route.fulfill({
      json: {
        success: true,
        errorCode: null,
        errorMsg: null,
        errorDetail: null,
        data: {
          commons: [
            { commonId: '46', code: null, value: '1', codeName: '爱彼迎IM支持发送图片', groupId: '45' },
            { commonId: '54', code: null, value: '41', codeName: '企微IM支持发送图片', groupId: '45' },
          ],
        },
      },
    })
  })

  await page.route(imAccountEndpoint, async (route) => {
    await route.fulfill({
      json: {
        success: true,
        errorCode: null,
        errorMsg: null,
        errorDetail: null,
        data: {
          appKey: '8d0514326dbd437d73cf9dc837543884',
          accid: 'prod_0_1796067702522908674',
          token: 'redacted-token',
        },
      },
    })
  })

  await page.route(editionEndpoint, async (route) => {
    await route.fulfill({
      json: {
        success: true,
        errorCode: null,
        errorMsg: null,
        errorDetail: null,
        data: {
          editionId: '9',
          editionName: '畅享版',
          editionType: 1,
          resourceGetViews: [],
          valueAddServices: null,
        },
      },
    })
  })

  await page.route(menuOptionEndpoint, async (route) => {
    await route.fulfill({
      json: {
        success: true,
        errorCode: null,
        errorMsg: null,
        errorDetail: null,
        data: {
          optionJsonViews: [
            {
              menuId: '1848317056370487297',
              optionJson: {
                versionModals: {
                  title: '畅享版全新上线！',
                  info: '接口返回的版本说明',
                  buttons: [{ buttonText: '续费/升级', type: 'primary', action: '1' }],
                },
              },
            },
          ],
        },
      },
    })
  })

  await page.goto(appUrl(pagePath))

  await expect(page.getByText('接口欢迎语')).toBeVisible()
  await page.getByRole('button', { name: '快捷键设置' }).click()
  await expect(page.getByRole('region', { name: '快捷键设置' })).toContainText('Ctrl+Shift+1')
  await page.getByRole('button', { name: '版本设置' }).click()
  await expect(page.getByRole('region', { name: '版本设置' })).toContainText('畅享版全新上线！')

  expect(requests.phraseGroups).toEqual({
    campId: '1796067693589061634',
  })
  expect(requests.phraseList).toEqual({
    campId: '1796067693589061634',
    pageNum: 1,
    pageSize: 10,
    keyword: '',
    isTemplate: 0,
    imWordsGroupId: null,
    scope: 1,
  })
  expect(requests.shortcuts).toEqual({
    userId: '1796067693261905922',
  })
  expect(requests.commons).toEqual({
    campId: '1796067693589061634',
    code: 'hudson.im.picture.support.channels',
  })
})

async function readDiagnostics(page: Page) {
  return page.evaluate(() => {
    const value = window.localStorage.getItem('pms.imSetting.diagnostics')
    return value ? JSON.parse(value) : null
  })
}

async function waitForDiagnostics(page: Page, predicate?: (value: unknown) => boolean) {
  await page.waitForFunction(
    (matcherSource) => {
      const raw = window.localStorage.getItem('pms.imSetting.diagnostics')
      if (!raw) return false
      const parsed = JSON.parse(raw)
      if (!matcherSource) return true
      const matcher = new Function(`return (${matcherSource})`)()
      return matcher(parsed)
    },
    predicate ? predicate.toString() : null,
  )

  return readDiagnostics(page)
}
