import { useEffect, useId, useMemo, useState, type ChangeEvent, type ReactNode } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  createDefaultSmartHotelGlobalSettingFilters,
  fetchSmartHotelGlobalSettingDashboard,
  type SmartHotelGlobalSettingChoice,
  type SmartHotelGlobalSettingDashboard,
  type SmartHotelGlobalSettingMockState,
  type SmartHotelGlobalSettingTabId,
  type SmartHotelGlobalSettingToggle,
} from '../services/smartHotelGlobalSetting'
import './SmartHotelGlobalSettingPage.css'

type DialogState = 'identity' | 'sms' | 'payment' | 'guide-create' | 'wifi-create' | null

type GuideListRow = {
  id: string
  name: string
  roomType: string
}

type WifiListRow = {
  id: string
  name: string
  password: string
  rooms: string
}

type UploadItem = {
  id: string
  name: string
  url: string
}

type GuideCreateDraft = {
  guideName: string
  routeGuide: string
  processGuide: string
  noticeGuide: string
  routeImages: UploadItem[]
  processImages: UploadItem[]
  noticeImages: UploadItem[]
}

type WifiCreateDraft = {
  wifiName: string
  wifiPassword: string
}

const guideRows: GuideListRow[] = []
const wifiRows: WifiListRow[] = []

function createEmptyGuideDraft(): GuideCreateDraft {
  return {
    guideName: '',
    routeGuide: '',
    processGuide: '',
    noticeGuide: '',
    routeImages: [],
    processImages: [],
    noticeImages: [],
  }
}

function createEmptyWifiDraft(): WifiCreateDraft {
  return {
    wifiName: '',
    wifiPassword: '',
  }
}

export function SmartHotelGlobalSettingPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const [dashboard, setDashboard] = useState<SmartHotelGlobalSettingDashboard | null>(null)
  const [activeTab, setActiveTab] = useState<SmartHotelGlobalSettingTabId>('rules')
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')
  const [dialog, setDialog] = useState<DialogState>(null)
  const [guideRuleChecks, setGuideRuleChecks] = useState({ identity: false, deposit: false })
  const [wifiEnabled, setWifiEnabled] = useState(false)
  const [saveNotice, setSaveNotice] = useState('')
  const [guideKeyword, setGuideKeyword] = useState('')
  const [wifiKeyword, setWifiKeyword] = useState('')
  const [guideCreateDraft, setGuideCreateDraft] = useState<GuideCreateDraft>(() => createEmptyGuideDraft())
  const [wifiCreateDraft, setWifiCreateDraft] = useState<WifiCreateDraft>(() => createEmptyWifiDraft())

  useEffect(() => {
    const controller = new AbortController()
    const filters = createDefaultSmartHotelGlobalSettingFilters(new URLSearchParams(location.search))

    setIsLoading(true)
    setErrorMessage('')
    setDialog(null)
    setGuideRuleChecks({ identity: false, deposit: false })
    setWifiEnabled(false)
    setSaveNotice('')
    setGuideKeyword('')
    setWifiKeyword('')
    setGuideCreateDraft(createEmptyGuideDraft())
    setWifiCreateDraft(createEmptyWifiDraft())

    void fetchSmartHotelGlobalSettingDashboard(filters, controller.signal)
      .then((result) => {
        setDashboard(result)
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === 'AbortError') return
        setDashboard(null)
        setErrorMessage(error instanceof Error ? error.message : '全局设置数据加载失败，请稍后重试')
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setIsLoading(false)
        }
      })

    return () => controller.abort()
  }, [location.search])

  useEffect(() => {
    if (!saveNotice) return
    const timer = window.setTimeout(() => setSaveNotice(''), 1600)
    return () => window.clearTimeout(timer)
  }, [saveNotice])

  useEffect(() => {
    return () => {
      revokeDraftUrls(guideCreateDraft)
    }
  }, [guideCreateDraft])

  const fallbackState = createDefaultSmartHotelGlobalSettingFilters(new URLSearchParams(location.search)).mockState
  const diagnosticsState: SmartHotelGlobalSettingMockState = dashboard?.state ?? fallbackState
  const diagnosticsProvider = dashboard?.provider ?? 'mock'
  const diagnosticsRequest = JSON.stringify(dashboard?.requestBody ?? { campId: '', endpoints: [] })
  const emptyState = !errorMessage ? dashboard?.emptyState : undefined
  const routes = dashboard?.routes ?? {
    smartSettings: '/smartHotel/smartSettings',
    roomTypeInfo: '/setting/roomTypeInfo',
    paymentSetting: '/setting/paymentSetting',
    smsSetting: '/setting/balanceAndTemplate',
  }

  const canSubmitGuide = useMemo(
    () =>
      Boolean(
        guideCreateDraft.guideName.trim() &&
          guideCreateDraft.routeGuide.trim() &&
          guideCreateDraft.processGuide.trim() &&
          guideCreateDraft.noticeGuide.trim(),
      ),
    [guideCreateDraft],
  )

  const canSubmitWifi = useMemo(
    () => Boolean(wifiCreateDraft.wifiName.trim() && wifiCreateDraft.wifiPassword.trim()),
    [wifiCreateDraft],
  )

  function handleRetry() {
    navigate('/smartHotel/checkInGuide', { replace: true })
  }

  function handleGuideRuleToggle(key: 'identity' | 'deposit') {
    setGuideRuleChecks((current) => ({ ...current, [key]: !current[key] }))
    setSaveNotice('保存成功')
  }

  function handleWifiToggle() {
    setWifiEnabled((current) => !current)
    setSaveNotice('保存成功')
  }

  function handleGuideSearch() {
    setGuideKeyword((current) => current.trimStart())
  }

  function handleGuideReset() {
    setGuideKeyword('')
  }

  function handleWifiSearch() {
    setWifiKeyword((current) => current.trimStart())
  }

  function handleWifiReset() {
    setWifiKeyword('')
  }

  function openGuideCreateDialog() {
    revokeDraftUrls(guideCreateDraft)
    setGuideCreateDraft(createEmptyGuideDraft())
    setDialog('guide-create')
  }

  function closeGuideCreateDialog() {
    revokeDraftUrls(guideCreateDraft)
    setGuideCreateDraft(createEmptyGuideDraft())
    setDialog(null)
  }

  function openWifiCreateDialog() {
    setWifiCreateDraft(createEmptyWifiDraft())
    setDialog('wifi-create')
  }

  function closeWifiCreateDialog() {
    setWifiCreateDraft(createEmptyWifiDraft())
    setDialog(null)
  }

  function updateGuideDraft<K extends keyof GuideCreateDraft>(key: K, value: GuideCreateDraft[K]) {
    setGuideCreateDraft((current) => ({ ...current, [key]: value }))
  }

  function updateWifiDraft<K extends keyof WifiCreateDraft>(key: K, value: WifiCreateDraft[K]) {
    setWifiCreateDraft((current) => ({ ...current, [key]: value }))
  }

  function handleGuideImageUpload(
    key: 'routeImages' | 'processImages' | 'noticeImages',
    event: ChangeEvent<HTMLInputElement>,
  ) {
    const files = Array.from(event.target.files ?? [])
    if (!files.length) return

    setGuideCreateDraft((current) => {
      const existing = current[key]
      const nextItems = files.slice(0, Math.max(0, 15 - existing.length)).map((file, index) => ({
        id: `${key}-${Date.now()}-${index}`,
        name: file.name,
        url: URL.createObjectURL(file),
      }))

      return {
        ...current,
        [key]: [...existing, ...nextItems].slice(0, 15),
      }
    })

    event.target.value = ''
  }

  function handleGuideCreateSubmit() {
    if (!canSubmitGuide) return
    closeGuideCreateDialog()
    setSaveNotice('保存成功')
  }

  function handleWifiCreateSubmit() {
    if (!canSubmitWifi) return
    closeWifiCreateDialog()
    setSaveNotice('保存成功')
  }

  return (
    <div className="smart-global-page">
      <div
        id="smart-hotel-global-setting-diagnostics"
        data-provider={diagnosticsProvider}
        data-state={diagnosticsState}
        data-request={diagnosticsRequest}
      />

      <div className="smart-global-version">版本号：v4.10.7</div>

      {saveNotice ? (
        <div className="smart-global-toast" role="status" aria-label="保存成功提示">
          {saveNotice}
        </div>
      ) : null}

      <section className="smart-global-shell" aria-label="全局设置">
        <div className="smart-global-tabs" role="tablist" aria-label="全局设置页签">
          <TabButton active={activeTab === 'rules'} onClick={() => setActiveTab('rules')}>
            入住规则
          </TabButton>
          <TabButton active={activeTab === 'guide'} onClick={() => setActiveTab('guide')}>
            入住指引
          </TabButton>
          <TabButton active={activeTab === 'wifi'} onClick={() => setActiveTab('wifi')}>
            WIFI上网
          </TabButton>
        </div>

        {isLoading ? <section className="smart-global-state">全局设置数据加载中...</section> : null}

        {!isLoading && errorMessage ? (
          <section className="smart-global-state smart-global-state--error" role="alert">
            <strong>全局设置数据加载失败</strong>
            <span>{errorMessage}</span>
            <button type="button" onClick={handleRetry}>
              重新加载
            </button>
          </section>
        ) : null}

        {!isLoading && !errorMessage && emptyState ? (
          <section className="smart-global-state">
            <strong>{emptyState.title}</strong>
            <span>{emptyState.description}</span>
            <button type="button" onClick={() => navigate(emptyState.actionPath)}>
              {emptyState.actionLabel}
            </button>
          </section>
        ) : null}

        {!isLoading && !errorMessage && !emptyState ? (
          <>
            {activeTab === 'rules' ? (
              <RulesPanel
                roomTypeSummary={decodeMaybeGarbled(dashboard?.roomTypeSummary, '4 个房型已同步门锁时效策略')}
                smsTemplateSummary={decodeMaybeGarbled(dashboard?.smsTemplateSummary, '短信模板 15 条')}
                syncLabel={decodeMaybeGarbled(dashboard?.syncLabel, '最近同步：2026-05-19 16:30')}
                paymentMethods={(dashboard?.paymentMethods ?? []).map((item) => decodeMaybeGarbled(item, item))}
                identitySummary={{
                  realNameBalance: decodeMaybeGarbled(dashboard?.identitySummary.realNameBalance, '实名认证剩余 5 次'),
                  smsBalance: decodeMaybeGarbled(dashboard?.identitySummary.smsBalance, '短信剩余 50 条'),
                  channelName: decodeMaybeGarbled(dashboard?.identitySummary.channelName, '携程直连'),
                }}
                flowSteps={(dashboard?.flowSteps ?? []).map((item, index) =>
                  decodeMaybeGarbled(item, ['进入智住小程序', '办理登记', '查看门锁密码', '在线续住'][index] ?? `步骤${index + 1}`),
                )}
                roomPasswordStrategies={dashboard?.roomPasswordStrategies ?? []}
                guestVerificationChoices={dashboard?.guestVerificationChoices ?? []}
                registerChoices={dashboard?.registerChoices ?? []}
                smsSendChoices={dashboard?.smsSendChoices ?? []}
                toggles={dashboard?.toggles}
                onOpenIdentity={() => setDialog('identity')}
                onOpenSms={() => setDialog('sms')}
                onOpenPayment={() => setDialog('payment')}
                onOpenRoomType={() => navigate(routes.roomTypeInfo)}
                onOpenSmsSetting={() => navigate(routes.smsSetting)}
              />
            ) : null}

            {activeTab === 'guide' ? (
              <GuideTabPanel
                checkedState={guideRuleChecks}
                keyword={guideKeyword}
                onKeywordChange={setGuideKeyword}
                onSearch={handleGuideSearch}
                onReset={handleGuideReset}
                onToggleRule={handleGuideRuleToggle}
                onOpenCreate={openGuideCreateDialog}
                onOpenMiniProgram={() => navigate(routes.smartSettings)}
              />
            ) : null}

            {activeTab === 'wifi' ? (
              <WifiTabPanel
                keyword={wifiKeyword}
                enabled={wifiEnabled}
                onKeywordChange={setWifiKeyword}
                onSearch={handleWifiSearch}
                onReset={handleWifiReset}
                onToggle={handleWifiToggle}
                onOpenCreate={openWifiCreateDialog}
              />
            ) : null}
          </>
        ) : null}

        <footer className="smart-global-footer">
          <span>当前页仅对齐目标站视觉与结构，保存按钮保持禁用态</span>
          <button type="button" disabled>
            保存
          </button>
        </footer>
      </section>

      {dialog === 'identity' ? (
        <DialogFrame title="认证与短信余额详情" closeLabel="关闭认证与短信余额详情" onClose={() => setDialog(null)}>
          <dl className="smart-global-dialog-list">
            <div>
              <dt>实名认证</dt>
              <dd>{decodeMaybeGarbled(dashboard?.identitySummary.realNameBalance, '实名认证剩余 5 次')}</dd>
            </div>
            <div>
              <dt>短信余额</dt>
              <dd>{decodeMaybeGarbled(dashboard?.identitySummary.smsBalance, '短信剩余 50 条')}</dd>
            </div>
            <div>
              <dt>通道</dt>
              <dd>{decodeMaybeGarbled(dashboard?.identitySummary.channelName, '携程直连')}</dd>
            </div>
          </dl>
        </DialogFrame>
      ) : null}

      {dialog === 'sms' ? (
        <DialogFrame title="短信发送模板" closeLabel="关闭短信发送模板" onClose={() => setDialog(null)}>
          <div className="smart-global-template-list">
            {(dashboard?.smsTemplates ?? []).map((template, index) => (
              <article key={template.id}>
                <strong>
                  {decodeMaybeGarbled(
                    template.title,
                    ['获得密码（智能入住）', '实名认证（智能入住）', '押金提醒'][index] ?? template.title,
                  )}
                </strong>
                <p>{decodeMaybeGarbled(template.content, '模板内容以短信设置页中的配置为准')}</p>
              </article>
            ))}
          </div>
        </DialogFrame>
      ) : null}

      {dialog === 'payment' ? (
        <DialogFrame title="押金与收款方式" closeLabel="关闭押金与收款方式" onClose={() => setDialog(null)}>
          <div className="smart-global-payment-list">
            {(dashboard?.paymentMethods ?? ['微信', '支付宝']).map((item, index) => (
              <span key={`${item}-${index}`}>{decodeMaybeGarbled(item, item)}</span>
            ))}
          </div>
        </DialogFrame>
      ) : null}

      {dialog === 'guide-create' ? (
        <GuideCreateDialog
          draft={guideCreateDraft}
          canSubmit={canSubmitGuide}
          onClose={closeGuideCreateDialog}
          onChange={updateGuideDraft}
          onUpload={handleGuideImageUpload}
          onSubmit={handleGuideCreateSubmit}
        />
      ) : null}

      {dialog === 'wifi-create' ? (
        <WifiCreateDialog
          draft={wifiCreateDraft}
          canSubmit={canSubmitWifi}
          onClose={closeWifiCreateDialog}
          onChange={updateWifiDraft}
          onSubmit={handleWifiCreateSubmit}
        />
      ) : null}
    </div>
  )
}

function RulesPanel({
  roomTypeSummary,
  smsTemplateSummary,
  syncLabel,
  paymentMethods,
  identitySummary,
  flowSteps,
  roomPasswordStrategies,
  guestVerificationChoices,
  registerChoices,
  smsSendChoices,
  toggles,
  onOpenIdentity,
  onOpenSms,
  onOpenPayment,
  onOpenRoomType,
  onOpenSmsSetting,
}: {
  roomTypeSummary: string
  smsTemplateSummary: string
  syncLabel: string
  paymentMethods: string[]
  identitySummary: { realNameBalance: string; smsBalance: string; channelName: string }
  flowSteps: string[]
  roomPasswordStrategies: SmartHotelGlobalSettingChoice[]
  guestVerificationChoices: SmartHotelGlobalSettingChoice[]
  registerChoices: SmartHotelGlobalSettingChoice[]
  smsSendChoices: SmartHotelGlobalSettingChoice[]
  toggles?: SmartHotelGlobalSettingDashboard['toggles']
  onOpenIdentity: () => void
  onOpenSms: () => void
  onOpenPayment: () => void
  onOpenRoomType: () => void
  onOpenSmsSetting: () => void
}) {
  return (
    <div className="smart-global-rule-layout">
      <div className="smart-global-rule-main">
        <section className="smart-global-section">
          <h2>门锁密码有效时间</h2>
          <div className="smart-global-summary-row">
            <strong>{roomTypeSummary}</strong>
            <button type="button" className="smart-global-link-button" onClick={onOpenRoomType}>
              前往房型信息
            </button>
          </div>
          <ChoiceList items={roomPasswordStrategies} />
        </section>

        <section className="smart-global-section">
          <h2>入住身份认证与登记</h2>
          <div className="smart-global-summary-row">
            <strong>{identitySummary.realNameBalance}</strong>
            <button type="button" className="smart-global-link-button" onClick={onOpenIdentity}>
              充值
            </button>
          </div>
          <div className="smart-global-setting-line">
            <div className="smart-global-label">入住人身份认证：</div>
            <div>
              <ChoiceList items={guestVerificationChoices} />
            </div>
          </div>
          <div className="smart-global-setting-line">
            <div className="smart-global-label">入住登记要求：</div>
            <div>
              <ChoiceList items={registerChoices} compact />
            </div>
          </div>
        </section>

        <section className="smart-global-section">
          <h2>短信与押金设置</h2>
          <div className="smart-global-summary-row">
            <strong>{smsTemplateSummary}</strong>
            <div className="smart-global-summary-actions">
              <button type="button" className="smart-global-link-button" onClick={onOpenSms}>
                查看短信模板
              </button>
              <button type="button" className="smart-global-link-button" onClick={onOpenSmsSetting}>
                编辑短信内容
              </button>
            </div>
          </div>
          <div className="smart-global-setting-line">
            <div className="smart-global-label">发送短信内容：</div>
            <div>
              <ChoiceList items={smsSendChoices} />
            </div>
          </div>
          <div className="smart-global-setting-line">
            <div className="smart-global-label">押金与收款方式：</div>
            <div className="smart-global-inline-actions">
              <span>{paymentMethods.join(' / ')}</span>
              <button type="button" className="smart-global-link-button" onClick={onOpenPayment}>
                查看支付方式
              </button>
            </div>
          </div>
        </section>

        <section className="smart-global-section">
          <h2>其他规则</h2>
          <SettingToggleRow toggle={toggles?.autoInvite} fallbackLabel="自动发送入住邀请" />
          <SettingToggleRow toggle={toggles?.deposit} fallbackLabel="收取押金" />
          <SettingToggleRow toggle={toggles?.guestStatus} fallbackLabel="房客变更入住状态" />
          <SettingToggleRow toggle={toggles?.dirtyRoomBlock} fallbackLabel="脏房不允许入住" />
          <SettingToggleRow toggle={toggles?.earlyPassword} fallbackLabel="提前入住生成密码" />
          <div className="smart-global-sync-row">{syncLabel}</div>
        </section>
      </div>

      <aside className="smart-global-flow">
        <h2>场景流程</h2>
        <div className="smart-global-flow__steps">
          {flowSteps.map((step, index) => (
            <div key={`${step}-${index}`} className="smart-global-flow-step">
              <span>步骤 {index + 1}</span>
              <strong>{step}</strong>
            </div>
          ))}
        </div>
      </aside>
    </div>
  )
}

function GuideTabPanel({
  checkedState,
  keyword,
  onKeywordChange,
  onSearch,
  onReset,
  onToggleRule,
  onOpenCreate,
  onOpenMiniProgram,
}: {
  checkedState: { identity: boolean; deposit: boolean }
  keyword: string
  onKeywordChange: (value: string) => void
  onSearch: () => void
  onReset: () => void
  onToggleRule: (key: 'identity' | 'deposit') => void
  onOpenCreate: () => void
  onOpenMiniProgram: () => void
}) {
  return (
    <div className="smart-global-panel-layout">
      <PhonePreviewCard
        title="入住指引"
        description="住客在智住小程序中查看入住规则、办理登记并获取开门信息。"
        items={['查看入住规则', '完成身份登记', '缴纳押金', '查看入住指引']}
        actionLabel="前往智住小程序"
        onAction={onOpenMiniProgram}
      />

      <div className="smart-global-panel-main">
        <section className="smart-global-card">
          <CardTitle>入住指引查看规则</CardTitle>
          <div className="smart-global-check-stack">
            <label>
              <input
                type="checkbox"
                checked={checkedState.identity}
                aria-label="完成身份登记要求"
                onChange={() => onToggleRule('identity')}
              />
              <span>完成身份登记要求</span>
            </label>
            <label>
              <input
                type="checkbox"
                checked={checkedState.deposit}
                aria-label="完成押金要求"
                onChange={() => onToggleRule('deposit')}
              />
              <span>完成押金要求</span>
            </label>
          </div>
        </section>

        <section className="smart-global-card">
          <div className="smart-global-card__head">
            <CardTitle>入住指引</CardTitle>
            <button type="button" className="smart-global-primary-button" onClick={onOpenCreate}>
              新增入住指引
            </button>
          </div>

          <div className="smart-global-toolbar">
            <input
              aria-label="入住指引搜索"
              placeholder="请输入入住指引名称/房型名称"
              value={keyword}
              onChange={(event) => onKeywordChange(event.target.value)}
            />
            <button type="button" className="smart-global-primary-button smart-global-primary-button--small" onClick={onSearch}>
              搜索
            </button>
            <button type="button" className="smart-global-secondary-button" onClick={onReset}>
              重置
            </button>
          </div>

          <TableCard
            columns={['入住指引名称', '应用房型', '操作']}
            rows={guideRows}
            emptyText="暂无数据"
            renderRow={(row) => (
              <>
                <td>{row.name}</td>
                <td>{row.roomType}</td>
                <td>
                  <button type="button" className="smart-global-link-button">
                    编辑
                  </button>
                </td>
              </>
            )}
          />
        </section>
      </div>
    </div>
  )
}

function WifiTabPanel({
  keyword,
  enabled,
  onKeywordChange,
  onSearch,
  onReset,
  onToggle,
  onOpenCreate,
}: {
  keyword: string
  enabled: boolean
  onKeywordChange: (value: string) => void
  onSearch: () => void
  onReset: () => void
  onToggle: () => void
  onOpenCreate: () => void
}) {
  return (
    <div className="smart-global-panel-layout">
      <PhonePreviewCard
        title="WIFI上网"
        description="住客可在智住小程序中查看当前房间可用的 WIFI 名称与密码。"
        items={['查看WIFI规则', '获取WIFI名称', '查看WIFI密码', '连接网络']}
      />

      <div className="smart-global-panel-main">
        <section className="smart-global-card">
          <CardTitle>WIFI查看规则</CardTitle>
          <div className="smart-global-rule-form">
            <div className="smart-global-setting-line">
              <div className="smart-global-label">开启WIFI：</div>
              <div>
                <button
                  type="button"
                  className={`smart-global-switch${enabled ? ' is-on' : ''}`}
                  aria-label="开启WIFI"
                  aria-pressed={enabled ? 'true' : 'false'}
                  onClick={onToggle}
                >
                  <span />
                </button>
              </div>
            </div>
            <div className="smart-global-setting-line">
              <div className="smart-global-label">WIFI可查看条件：</div>
              <div className="smart-global-radio-stack is-compact">
                <label className="smart-global-radio-line is-selected">
                  <input type="radio" name="wifi-rule" checked readOnly />
                  <strong>不限制</strong>
                </label>
              </div>
            </div>
          </div>
        </section>

        <section className="smart-global-card">
          <div className="smart-global-card__head">
            <CardTitle>WIFI</CardTitle>
            <button type="button" className="smart-global-primary-button" onClick={onOpenCreate}>
              新增WIFI
            </button>
          </div>

          <div className="smart-global-toolbar">
            <input aria-label="WIFI搜索" placeholder="输入WIFI名称" value={keyword} onChange={(event) => onKeywordChange(event.target.value)} />
            <button type="button" className="smart-global-primary-button smart-global-primary-button--small" onClick={onSearch}>
              搜索
            </button>
            <button type="button" className="smart-global-secondary-button" onClick={onReset}>
              重置
            </button>
          </div>

          <TableCard
            columns={['WIFI名称', 'WIFI密码', '应用房间', '操作']}
            rows={wifiRows}
            emptyText="暂无数据"
            renderRow={(row) => (
              <>
                <td>{row.name}</td>
                <td>{row.password}</td>
                <td>{row.rooms}</td>
                <td>
                  <button type="button" className="smart-global-link-button">
                    编辑
                  </button>
                </td>
              </>
            )}
          />
        </section>
      </div>
    </div>
  )
}

function GuideCreateDialog({
  draft,
  canSubmit,
  onClose,
  onChange,
  onUpload,
  onSubmit,
}: {
  draft: GuideCreateDraft
  canSubmit: boolean
  onClose: () => void
  onChange: <K extends keyof GuideCreateDraft>(key: K, value: GuideCreateDraft[K]) => void
  onUpload: (key: 'routeImages' | 'processImages' | 'noticeImages', event: ChangeEvent<HTMLInputElement>) => void
  onSubmit: () => void
}) {
  return (
    <div className="smart-global-modal-backdrop">
      <section className="smart-global-modal smart-global-modal--guide" role="dialog" aria-modal="true" aria-label="新增入住指引">
        <header>
          <h2>新增入住指引</h2>
          <button type="button" aria-label="关闭新增入住指引" onClick={onClose}>
            ×
          </button>
        </header>

        <div className="smart-global-guide-dialog__body" data-testid="guide-create-scrollable">
          <div className="smart-global-guide-dialog__field">
            <label htmlFor="guide-name-input">入住指引名称：</label>
            <input
              id="guide-name-input"
              aria-label="入住指引名称"
              placeholder="请输入入住指引名称"
              value={draft.guideName}
              onChange={(event) => onChange('guideName', event.target.value)}
            />
          </div>

          <GuideSectionEditor
            index={1}
            title="房源路线"
            label="到达房源路线："
            fieldName="到达房源路线"
            placeholder="请输入路线指引"
            helper="请采用房源附近显著的地理标志物进行引导，如地铁、公交留空，用户端不展示该选项。"
            uploadHint="建议上传路线实景图，引导房客如何从路线起点找到小区，再到楼栋及找到自己的房间"
            draftValue={draft.routeGuide}
            images={draft.routeImages}
            onTextChange={(value) => onChange('routeGuide', value)}
            onUpload={(event) => onUpload('routeImages', event)}
          />

          <GuideSectionEditor
            index={2}
            title="入住流程"
            label="入住流程说明："
            fieldName="入住流程说明"
            placeholder="请输入入住流程说明"
            helper="入住流程说明，引导房客在找到自己的房间后，如何开锁入住房间，如留空，用户端不展示该项目。"
            uploadHint="建议上传实景图，引导房客如何开锁进入房间"
            draftValue={draft.processGuide}
            images={draft.processImages}
            onTextChange={(value) => onChange('processGuide', value)}
            onUpload={(event) => onUpload('processImages', event)}
          />

          <GuideSectionEditor
            index={3}
            title="入住须知"
            label="入住须知："
            fieldName="入住须知"
            placeholder="请输入入住须知"
            helper="入住注意事项，如禁止黄赌毒，不可举办集会，不可商业拍照等需要房客遵守的规则条款。"
            uploadHint="可上传示意图，房客看得更清晰"
            draftValue={draft.noticeGuide}
            images={draft.noticeImages}
            onTextChange={(value) => onChange('noticeGuide', value)}
            onUpload={(event) => onUpload('noticeImages', event)}
          />
        </div>

        <footer className="smart-global-guide-dialog__footer">
          <button type="button" className="smart-global-secondary-button" onClick={onClose}>
            取消
          </button>
          <button type="button" className="smart-global-primary-button" disabled={!canSubmit} onClick={onSubmit}>
            确定
          </button>
        </footer>
      </section>
    </div>
  )
}

function GuideSectionEditor({
  index,
  title,
  label,
  fieldName,
  placeholder,
  helper,
  uploadHint,
  draftValue,
  images,
  onTextChange,
  onUpload,
}: {
  index: number
  title: string
  label: string
  fieldName: string
  placeholder: string
  helper: string
  uploadHint: string
  draftValue: string
  images: UploadItem[]
  onTextChange: (value: string) => void
  onUpload: (event: ChangeEvent<HTMLInputElement>) => void
}) {
  const inputId = useId()

  return (
    <section className="smart-global-guide-section">
      <h3>
        {index}.{title}
      </h3>

      <div className="smart-global-guide-section__row">
        <label htmlFor={inputId}>{label}</label>
        <div className="smart-global-guide-section__main">
          <textarea
            id={inputId}
            aria-label={fieldName}
            placeholder={placeholder}
            value={draftValue}
            onChange={(event) => onTextChange(event.target.value)}
          />
          <p>{helper}</p>
          <UploadCard fieldName={fieldName} images={images} onUpload={onUpload} />
          <p className="smart-global-guide-section__hint">
            {uploadHint}
            <br />
            建议尺寸：800*800像素，你可以拖拽图片上传，最多上传15张。最少一张
            <button type="button">调整图片顺序</button>
          </p>
        </div>
      </div>
    </section>
  )
}

function WifiCreateDialog({
  draft,
  canSubmit,
  onClose,
  onChange,
  onSubmit,
}: {
  draft: WifiCreateDraft
  canSubmit: boolean
  onClose: () => void
  onChange: <K extends keyof WifiCreateDraft>(key: K, value: WifiCreateDraft[K]) => void
  onSubmit: () => void
}) {
  return (
    <div className="smart-global-modal-backdrop">
      <section className="smart-global-modal smart-global-modal--wifi" role="dialog" aria-modal="true" aria-label="新增WIFI">
        <header>
          <h2>新增WIFI</h2>
          <button type="button" aria-label="关闭新增WIFI" onClick={onClose}>
            ×
          </button>
        </header>

        <div className="smart-global-modal__body smart-global-wifi-dialog__body">
          <div className="smart-global-wifi-dialog__field">
            <label htmlFor="wifi-name-input">
              <span>*</span> WIFI名称
            </label>
            <input
              id="wifi-name-input"
              aria-label="WIFI名称"
              placeholder="请输入WIFI名称"
              value={draft.wifiName}
              onChange={(event) => onChange('wifiName', event.target.value)}
            />
          </div>

          <div className="smart-global-wifi-dialog__field">
            <label htmlFor="wifi-password-input">
              <span>*</span> WIFI密码
            </label>
            <input
              id="wifi-password-input"
              aria-label="WIFI密码"
              placeholder="请输入WIFI密码"
              value={draft.wifiPassword}
              onChange={(event) => onChange('wifiPassword', event.target.value)}
            />
          </div>
        </div>

        <footer className="smart-global-guide-dialog__footer">
          <button type="button" className="smart-global-secondary-button" onClick={onClose}>
            取消
          </button>
          <button type="button" className="smart-global-primary-button" disabled={!canSubmit} onClick={onSubmit}>
            确定
          </button>
        </footer>
      </section>
    </div>
  )
}

function UploadCard({
  fieldName,
  images,
  onUpload,
}: {
  fieldName: string
  images: UploadItem[]
  onUpload: (event: ChangeEvent<HTMLInputElement>) => void
}) {
  const inputId = useId()

  return (
    <div className="smart-global-upload-field">
      <label htmlFor={inputId} className="smart-global-upload-card">
        <span className="smart-global-upload-card__plus">+</span>
        <span>上传</span>
      </label>
      <input id={inputId} className="smart-global-upload-input" type="file" multiple accept="image/*" onChange={onUpload} />

      {images.length > 0 ? (
        <div className="smart-global-upload-list" aria-label={`${fieldName}已上传图片`}>
          {images.map((image) => (
            <article key={image.id}>
              <img src={image.url} alt={image.name} />
              <span>{image.name}</span>
            </article>
          ))}
        </div>
      ) : null}
    </div>
  )
}

function PhonePreviewCard({
  title,
  description,
  items,
  actionLabel,
  onAction,
}: {
  title: string
  description: string
  items: string[]
  actionLabel?: string
  onAction?: () => void
}) {
  return (
    <aside className="smart-global-phone-card" aria-label={`${title}预览`}>
      <div className="smart-global-phone">
        <div className="smart-global-phone__status">
          <span>09:41</span>
          <span>5G</span>
        </div>
        <div className="smart-global-phone__hero">
          <span className="smart-global-phone__badge">智住小程序</span>
          <strong>{title}</strong>
          <p>{description}</p>
        </div>
        <div className="smart-global-phone__list">
          {items.map((item, index) => (
            <article key={item}>
              <span>{index + 1}</span>
              <strong>{item}</strong>
            </article>
          ))}
        </div>
        {actionLabel && onAction ? (
          <button type="button" className="smart-global-phone__action" onClick={onAction}>
            {actionLabel}
          </button>
        ) : null}
      </div>
    </aside>
  )
}

function TableCard<T>({
  columns,
  rows,
  emptyText,
  renderRow,
}: {
  columns: string[]
  rows: T[]
  emptyText: string
  renderRow: (row: T) => ReactNode
}) {
  return (
    <div className="smart-global-table-card">
      <table>
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column}>{column}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length > 0 ? (
            rows.map((row, index) => <tr key={index}>{renderRow(row)}</tr>)
          ) : (
            <tr>
              <td className="smart-global-empty-cell" colSpan={columns.length}>
                {emptyText}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}

function ChoiceList({
  items,
  compact = false,
}: {
  items: SmartHotelGlobalSettingChoice[]
  compact?: boolean
}) {
  return (
    <div className={`smart-global-radio-stack${compact ? ' is-compact' : ''}`}>
      {items.map((item) => (
        <label key={item.id} className={`smart-global-radio-line${item.selected ? ' is-selected' : ''}`}>
          <input type="radio" checked={Boolean(item.selected)} readOnly />
          <div>
            <strong>{decodeChoiceTitle(item.title)}</strong>
            {item.badge ? <span className="smart-global-tag">推荐</span> : null}
            {item.description ? <p className="smart-global-muted">{decodeMaybeGarbled(item.description, item.description)}</p> : null}
          </div>
        </label>
      ))}
    </div>
  )
}

function SettingToggleRow({
  toggle,
  fallbackLabel,
}: {
  toggle?: SmartHotelGlobalSettingToggle
  fallbackLabel: string
}) {
  return (
    <div className="smart-global-setting-line">
      <div className="smart-global-label">{decodeMaybeGarbled(toggle?.label, fallbackLabel)}：</div>
      <div>
        <button
          type="button"
          className={`smart-global-switch${toggle?.checked ? ' is-on' : ''}`}
          disabled
          aria-label={decodeMaybeGarbled(toggle?.label, fallbackLabel)}
          aria-pressed={toggle?.checked ? 'true' : 'false'}
        >
          <span />
        </button>
        {toggle?.description ? (
          <span className="smart-global-muted">{decodeMaybeGarbled(toggle.description, toggle.description)}</span>
        ) : null}
      </div>
    </div>
  )
}

function TabButton({
  active,
  children,
  onClick,
}: {
  active: boolean
  children: ReactNode
  onClick: () => void
}) {
  return (
    <button type="button" role="tab" aria-selected={active} className={active ? 'is-active' : ''} onClick={onClick}>
      {children}
    </button>
  )
}

function CardTitle({ children }: { children: ReactNode }) {
  return <h2 className="smart-global-card-title">{children}</h2>
}

function DialogFrame({
  title,
  closeLabel,
  children,
  onClose,
}: {
  title: string
  closeLabel: string
  children: ReactNode
  onClose: () => void
}) {
  return (
    <div className="smart-global-modal-backdrop">
      <section className="smart-global-modal" role="dialog" aria-modal="true" aria-label={title}>
        <header>
          <h2>{title}</h2>
          <button type="button" aria-label={closeLabel} onClick={onClose}>
            ×
          </button>
        </header>
        <div className="smart-global-modal__body">{children}</div>
      </section>
    </div>
  )
}

function revokeDraftUrls(draft: GuideCreateDraft) {
  draft.routeImages.forEach((item) => URL.revokeObjectURL(item.url))
  draft.processImages.forEach((item) => URL.revokeObjectURL(item.url))
  draft.noticeImages.forEach((item) => URL.revokeObjectURL(item.url))
}

function decodeMaybeGarbled(value: string | undefined, fallback: string) {
  if (!value) return fallback
  if (/[\u4e00-\u9fff]/.test(value)) return value
  return fallback
}

function decodeChoiceTitle(value: string) {
  return decodeMaybeGarbled(value, '配置项')
}
