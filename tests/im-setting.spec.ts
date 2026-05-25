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
  await expect(page.locator('.im-setting-header')).toHaveCount(0)
  await expect(page.getByRole('button', { name: '常用语' })).toHaveAttribute('aria-pressed', 'true')
  await expect(page.getByRole('button', { name: '自动回复设置' })).toBeVisible()
  await expect(page.getByRole('button', { name: '页面设置' })).toBeVisible()
  await expect(page.getByRole('button', { name: '标签设置' })).toBeVisible()
  await expect(page.getByRole('button', { name: '快捷键设置' })).toBeVisible()
  await expect(page.getByRole('button', { name: '版本设置' })).toBeVisible()

  const phrasePanel = page.getByRole('region', { name: '常用语管理' })
  await expect(phrasePanel.getByRole('button', { name: '添加常用语' })).toBeVisible()
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

  await phrasePanel.getByRole('button', { name: '新建分类' }).click()
  await page.getByRole('dialog', { name: '新建分类' }).getByLabel('分类名称').fill('平台问候')
  await page.getByRole('dialog', { name: '新建分类' }).getByRole('button', { name: '确定' }).click()
  await expect(page.getByRole('status')).toContainText('分类已创建')
  await expect(phrasePanel.getByRole('button', { name: '平台问候' })).toBeVisible()

  await phrasePanel.getByRole('button', { name: '添加常用语' }).click()
  await page.getByRole('dialog', { name: '添加常用语' }).getByLabel('标题').fill('自助入住提醒')
  await page.getByRole('dialog', { name: '添加常用语' }).getByLabel('回复内容').fill('已为您准备自助入住指引，抵店后可直接输入门锁密码办理入住。')
  await page.getByRole('dialog', { name: '添加常用语' }).getByRole('button', { name: '确定' }).click()
  await expect(page.getByRole('status')).toContainText('常用语已保存')
  await expect(phrasePanel.getByText('自助入住提醒')).toBeVisible()

  await page.getByRole('button', { name: '快捷键设置' }).click()
  const shortcutPanel = page.getByRole('region', { name: '快捷键设置' })
  await expect(shortcutPanel.getByText('推荐房源')).toBeVisible()
  await shortcutPanel.getByLabel('推荐房源开关').check()
  await shortcutPanel.getByRole('button', { name: '保存' }).click()
  await expect(page.getByRole('status')).toContainText('快捷键设置已保存')

  diagnostics = await waitForDiagnostics(page, (value) => value?.lastAction?.endpoint === '/systemConfigs/user/shortcut/save')
  expect(diagnostics.lastAction).toMatchObject({
    endpoint: '/systemConfigs/user/shortcut/save',
    request: {
      userId: '1796067693261905922',
    },
  })
})

test('/setting/imSetting matches auto-reply panels and task dialog interactions', async ({ page }) => {
  await page.goto(appUrl(pagePath))

  await page.getByRole('button', { name: '自动回复设置' }).click()
  const autoReplyPanel = page.getByRole('region', { name: '自动回复设置' })

  await expect(autoReplyPanel.getByRole('button', { name: '欢迎语' })).toHaveAttribute('aria-pressed', 'true')
  await expect(autoReplyPanel.getByText('发送欢迎语')).toBeVisible()
  await expect(autoReplyPanel.getByText('当顾客发送的第一条消息分配到人工接待时')).toBeVisible()

  await autoReplyPanel.getByRole('button', { name: '超时提醒' }).click()
  await expect(autoReplyPanel.getByRole('button', { name: '超时提醒' })).toHaveAttribute('aria-pressed', 'true')
  await expect(autoReplyPanel.locator('.im-auto-reply-toggle-row strong')).toHaveText('超时提醒')
  await expect(autoReplyPanel.getByText('客户等待客服回复的时间超时后，发起这个回复')).toBeVisible()

  await autoReplyPanel.getByRole('button', { name: '任务提醒' }).click()
  await expect(autoReplyPanel.getByPlaceholder('输入任务名称或话术')).toBeVisible()
  await expect(autoReplyPanel.getByLabel('任务场景筛选')).toHaveValue('全部任务场景')
  await expect(autoReplyPanel.getByRole('button', { name: '新建任务' })).toBeVisible()
  await expect(autoReplyPanel.getByRole('columnheader', { name: '任务名称' })).toBeVisible()
  await expect(autoReplyPanel.getByText('暂无数据')).toBeVisible()

  await autoReplyPanel.getByRole('button', { name: '新建任务' }).click()
  const taskDialog = page.getByRole('dialog', { name: '新建任务' })
  await expect(taskDialog).toBeVisible()
  await expect(taskDialog.getByLabel('任务场景')).toHaveValue('【催单】咨询未下单')
  await expect(taskDialog.getByLabel('发送分钟数')).toHaveValue('5')
  await expect(taskDialog.getByLabel('催单话术')).toHaveValue(/您好，还有什么可以帮助的/)

  await taskDialog.getByLabel('任务名称').fill('咨询未下单提醒')
  await taskDialog.getByRole('button', { name: '确定' }).click()

  await expect(page.getByRole('status')).toContainText('任务提醒已创建')
  await expect(autoReplyPanel.getByText('咨询未下单提醒')).toBeVisible()
  await expect(autoReplyPanel.getByRole('cell', { name: '【催单】咨询未下单' })).toBeVisible()
})

test('/setting/imSetting matches page tags shortcuts and version layouts', async ({ page }) => {
  await page.goto(appUrl(pagePath))

  await page.getByRole('button', { name: '页面设置' }).click()
  const pagePanel = page.getByRole('region', { name: '页面设置' })
  await expect(pagePanel.getByText('会话标签')).toBeVisible()
  await expect(pagePanel.getByLabel('会话回复超时分钟数')).toHaveValue('3')
  await expect(pagePanel.getByLabel('会话回复严重超时分钟数')).toHaveValue('6')
  await expect(pagePanel.getByLabel('首回复提醒开关')).toHaveAttribute('aria-pressed', 'true')
  await expect(pagePanel.getByLabel('高成交提醒条数')).toHaveValue('6')
  await expect(pagePanel.getByLabel('消息通知音量')).toHaveValue('100')
  await pagePanel.getByRole('button', { name: '保存' }).click()
  await expect(page.getByRole('status')).toContainText('页面设置已保存')

  await page.getByRole('button', { name: '标签设置' }).click()
  const tagPanel = page.getByRole('region', { name: '标签设置' })
  await expect(tagPanel.getByPlaceholder('输入标签内容')).toBeVisible()
  await expect(tagPanel.getByRole('columnheader', { name: '标签类型' })).toBeVisible()
  await expect(tagPanel.getByRole('cell', { name: '客户标签', exact: true })).toBeVisible()
  await expect(tagPanel.getByLabel('客户标签启用开关')).toHaveAttribute('aria-pressed', 'true')
  await expect(tagPanel.getByRole('button', { name: '编辑' })).toBeVisible()
  await expect(tagPanel.getByText('第 1-1 条/总共 1 条')).toBeVisible()
  await tagPanel.getByRole('button', { name: '编辑' }).click()
  const tagDialog = page.getByRole('dialog', { name: '编辑标签' })
  await expect(tagDialog).toBeVisible()
  await expect(tagDialog.getByLabel('标签组')).toHaveValue('客户标签')
  await expect(tagDialog.getByRole('textbox', { name: '标签内容1' })).toHaveValue('')
  await tagDialog.getByRole('textbox', { name: '标签内容1' }).fill('高意向客户')
  await tagDialog.getByRole('button', { name: '添加标签内容' }).click()
  await tagDialog.getByRole('textbox', { name: '标签内容2' }).fill('复购用户')
  await tagDialog.getByRole('button', { name: '确定' }).click()
  await expect(page.getByRole('status')).toContainText('标签已保存')
  await expect(tagPanel.getByText('高意向客户，复购用户')).toBeVisible()

  await page.getByRole('button', { name: '快捷键设置' }).click()
  const shortcutPanel = page.getByRole('region', { name: '快捷键设置' })
  await expect(shortcutPanel.getByText('推荐激活键')).toBeVisible()
  await expect(shortcutPanel.getByText('Ctrl+Shift+1')).toBeVisible()
  await expect(shortcutPanel.getByText('Command+Shift+1')).toBeVisible()
  await expect(shortcutPanel.getByLabel('推荐房源开关')).not.toBeChecked()

  await page.getByRole('button', { name: '版本设置' }).click()
  const versionPanel = page.getByRole('region', { name: '版本设置' })
  await expect(versionPanel.getByText('会话默认基础版本，可根据需要切换版本')).toBeVisible()
  await expect(versionPanel.getByRole('radio', { name: '会话基础版' })).toBeChecked()
  await expect(versionPanel.getByRole('radio', { name: '会话升级版' })).toBeVisible()
  await versionPanel.getByRole('radio', { name: '会话升级版' }).check()
  await versionPanel.getByRole('button', { name: '保存' }).click()
  await expect(page.getByRole('status')).toContainText('版本设置已保存')
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
  await expect(page.getByRole('region', { name: '版本设置' })).toContainText('会话默认基础版本，可根据需要切换版本')
  await expect(page.getByRole('radio', { name: '会话基础版' })).toBeChecked()
  await expect(page.getByRole('radio', { name: '会话升级版' })).toBeVisible()

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
