import { type ReactNode, useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  createDefaultSmartDoorLockQuery,
  fetchSmartDoorLockDashboard,
  submitSmartDoorLockAccount,
  type SmartDoorLockAccount,
  type SmartDoorLockBrand,
  type SmartDoorLockDashboard,
  type SmartDoorLockTabKey,
} from '../services/smartDoorLock'
import './SmartDoorLockPage.css'

type AccountsByTab = Record<SmartDoorLockTabKey, SmartDoorLockAccount[]>

const defaultAccountsByTab: AccountsByTab = {
  password: [],
  card: [],
}

const text = {
  loading: '\u667a\u80fd\u95e8\u9501\u6570\u636e\u52a0\u8f7d\u4e2d',
  ready: '\u667a\u80fd\u95e8\u9501\u6570\u636e\u5df2\u5c31\u7eea',
  empty: '\u5f53\u524d\u95e8\u5e97\u8fd8\u6ca1\u6709\u5df2\u7ed1\u5b9a\u7684\u95e8\u9501\u8d26\u53f7',
  pageLabel: '\u667a\u80fd\u95e8\u9501\u63a5\u5165\u7ba1\u7406',
  title: '\u667a\u80fd\u95e8\u9501',
  subtitle:
    '\u56f4\u7ed5\u5bc6\u7801\u95e8\u9501\u548c\u623f\u5361\u95e8\u9501\u7edf\u4e00\u7ba1\u7406\u54c1\u724c\u63a5\u5165\u3001\u8d26\u53f7\u7ed1\u5b9a\u548c\u8bbe\u5907\u8054\u52a8\u72b6\u6001\u3002',
  refresh: '\u5237\u65b0\u6570\u636e',
  localsMall: '\u524d\u5f80\u8def\u5ba2\u5546\u57ce',
  hardwareMall: '\u524d\u5f80\u667a\u80fd\u786c\u4ef6\u5546\u57ce',
  selfCheckin: '\u67e5\u770b\u81ea\u52a9\u5165\u4f4f',
  passwordTabHint: '\u5df2\u7ed1\u5b9a\u8d26\u53f7\u652f\u6301\u67e5\u770b\u8be6\u60c5\u548c\u5237\u65b0\u540c\u6b65\u8bb0\u5f55\u3002',
  cardTabHint:
    '\u771f\u5b9e\u9875\u623f\u5361 tab \u5148\u9009\u54c1\u724c\uff0c\u518d\u6839\u636e\u72b6\u6001\u8d70\u767b\u5f55\u6216\u5f00\u901a\u6d41\u7a0b\u3002',
  brandsHint:
    '\u54c1\u724c\u5165\u53e3\u7edf\u4e00\u8d70\u767b\u5f55\u3001\u5f00\u901a\u6216\u67e5\u770b\u72b6\u6001\uff0c\u4e0d\u518d\u505c\u7559\u5728\u65e0\u53cd\u9988\u7684\u9759\u6001\u6309\u94ae\u3002',
  compactLinks: '\u8054\u52a8\u5165\u53e3',
  compactCard: '\u623f\u5361\u7cfb\u7edf\u63d0\u9192',
  localsMallCompact: '\u67e5\u770b\u8def\u5ba2\u5546\u57ce',
  emptyDesc:
    '\u8bf7\u5148\u9009\u62e9\u54c1\u724c\u7ed1\u5b9a\u8d26\u53f7\uff0c\u518d\u7ee7\u7eed\u540c\u6b65\u95e8\u9501\u5bc6\u7801\u3001\u623f\u5361\u8bbe\u5907\u548c\u5165\u4f4f\u8054\u52a8\u3002',
  loadAlertTitle: '\u667a\u80fd\u95e8\u9501\u52a0\u8f7d\u5931\u8d25',
  retry: '\u91cd\u65b0\u52a0\u8f7d',
  serviceStateLabel: '\u667a\u80fd\u95e8\u9501\u64cd\u4f5c\u53cd\u9988',
  loginTitle: '\u95e8\u9501\u767b\u5f55',
  loginClose: '\u5173\u95ed\u95e8\u9501\u767b\u5f55',
  cancel: '\u53d6\u6d88',
  submit: '\u63d0\u4ea4',
  accountDetail: '\u8d26\u53f7\u8be6\u60c5',
  accountDetailClose: '\u5173\u95ed\u8d26\u53f7\u8be6\u60c5',
  close: '\u5173\u95ed',
  brand: '\u54c1\u724c',
  accountName: '\u8d26\u53f7\u540d\u79f0',
  syncScope: '\u540c\u6b65\u8303\u56f4',
  linkedSource: '\u7ed1\u5b9a\u6765\u6e90',
  cardSystemClosedTitle: '\u95e8\u5361\u7ba1\u7406\u7cfb\u7edf\u672a\u5f00\u901a',
  cardSystemClosedClose: '\u5173\u95ed\u95e8\u5361\u7ba1\u7406\u7cfb\u7edf\u672a\u5f00\u901a\u63d0\u793a',
  cardSystemClosedContent: '\u60a8\u5c1a\u672a\u5f00\u901a\u95e8\u5361\u7ba1\u7406\u7cfb\u7edf\uff0c\u8bf7\u5f00\u901a\u540e\u518d\u4f7f\u7528\u3002',
  cardSystemOpen: '\u7acb\u5373\u5f00\u901a',
  cardSystemTitle: '\u95e8\u5361\u7ba1\u7406\u7cfb\u7edf',
  cardSystemClose: '\u5173\u95ed\u95e8\u5361\u7ba1\u7406\u7cfb\u7edf\u6982\u89c8',
  cardSystemPath: '\u67e5\u770b\u5f00\u901a\u8def\u5f84',
  prepareBind: '\u51c6\u5907\u7ed1\u5b9a',
  cardSystemReady: '\u95e8\u5361\u7ba1\u7406\u7cfb\u7edf\u5df2\u5f00\u901a\uff0c\u53ef\u7ee7\u7eed\u67e5\u770b\u8bbe\u5907\u540c\u6b65\u72b6\u6001',
  cardSystemNeedOpen: '\u95e8\u5361\u7ba1\u7406\u7cfb\u7edf\u5c1a\u672a\u5f00\u901a\uff0c\u8bf7\u5148\u5f00\u901a\u540e\u518d\u63a5\u5165',
  syncRecord: '\u540c\u6b65\u8bb0\u5f55',
  detail: '\u67e5\u770b\u8be6\u60c5',
  disabledSync: '\u5f53\u524d\u8d26\u53f7\u6682\u65f6\u4e0d\u53ef\u540c\u6b65',
  syncedPrefix: '\u5df2\u5237\u65b0 ',
  linkedSuffix: '\u8d26\u53f7\u5df2\u7ed1\u5b9a',
  version: '\u7248\u672c\u53f7\uff1av4.10.7',
}

export function SmartDoorLockPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const initialQuery = createDefaultSmartDoorLockQuery(new URLSearchParams(location.search))
  const [dashboard, setDashboard] = useState<SmartDoorLockDashboard | null>(null)
  const [accountsByTab, setAccountsByTab] = useState<AccountsByTab>(defaultAccountsByTab)
  const [activeTab, setActiveTab] = useState<SmartDoorLockTabKey>(initialQuery.tab)
  const [reloadKey, setReloadKey] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [feedback, setFeedback] = useState(text.loading)
  const [loginBrand, setLoginBrand] = useState<SmartDoorLockBrand | null>(null)
  const [loginUserName, setLoginUserName] = useState('')
  const [loginPassword, setLoginPassword] = useState('')
  const [detailAccount, setDetailAccount] = useState<SmartDoorLockAccount | null>(null)
  const [isCardSystemConfirmOpen, setIsCardSystemConfirmOpen] = useState(false)
  const [isCardSystemOverviewOpen, setIsCardSystemOverviewOpen] = useState(false)

  useEffect(() => {
    const controller = new AbortController()
    const query = createDefaultSmartDoorLockQuery(new URLSearchParams(location.search))

    void fetchSmartDoorLockDashboard(query, controller.signal)
      .then((result) => {
        setDashboard(result)
        setActiveTab(query.tab)
        setAccountsByTab({
          password: getTabAccounts(result, 'password'),
          card: getTabAccounts(result, 'card'),
        })
        setFeedback(result.state === 'empty' ? text.empty : text.ready)
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === 'AbortError') return
        const message = error instanceof Error ? error.message : text.loadAlertTitle
        setDashboard(null)
        setAccountsByTab(defaultAccountsByTab)
        setErrorMessage(message)
        setFeedback(message)
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setIsLoading(false)
        }
      })

    return () => controller.abort()
  }, [location.search, reloadKey])

  const tabs = useMemo(() => {
    if (!dashboard) return []
    return dashboard.tabs.map((tab) => ({
      ...tab,
      accounts: accountsByTab[tab.key] ?? tab.accounts,
    }))
  }, [accountsByTab, dashboard])

  const activeTabView = tabs.find((tab) => tab.key === activeTab) ?? tabs[0] ?? null
  const hasAccounts = tabs.some((tab) => tab.accounts.length > 0)
  const pageState = errorMessage ? 'error' : isLoading ? 'loading' : hasAccounts ? 'ready' : dashboard?.state ?? 'empty'
  const provider = dashboard?.provider ?? 'mock'
  const requestedAtLabel = dashboard?.requestedAtLabel ?? '\u6700\u8fd1\u540c\u6b65\uff1a\u5f85\u5237\u65b0'
  const routes = dashboard?.routes ?? {
    localsMall: '/version/localsMall',
    hardwareMall: '/smartHotel/smartHardware/mall',
    selfCheckin: '/smartHotel/smartHome',
  }

  function resetForReload(nextTab: SmartDoorLockTabKey) {
    setDashboard(null)
    setAccountsByTab(defaultAccountsByTab)
    setActiveTab(nextTab)
    setErrorMessage('')
    setLoginBrand(null)
    setDetailAccount(null)
    setIsCardSystemConfirmOpen(false)
    setIsCardSystemOverviewOpen(false)
    setIsLoading(true)
    setFeedback(text.loading)
  }

  function handleRetry() {
    resetForReload('password')
    navigate('/smartHotel/smartHardware/smartLook', { replace: true })
    setReloadKey((current) => current + 1)
  }

  function handleRefresh() {
    resetForReload(activeTab)
    setReloadKey((current) => current + 1)
  }

  function openBrand(brand: SmartDoorLockBrand) {
    if (brand.action === 'activate') {
      if (dashboard?.cardSystemEnabled) {
        setIsCardSystemOverviewOpen(true)
        setFeedback(text.cardSystemReady)
      } else {
        setIsCardSystemConfirmOpen(true)
        setFeedback(text.cardSystemNeedOpen)
      }
      return
    }

    setLoginBrand(brand)
    setLoginUserName('')
    setLoginPassword('')
    setFeedback(`${text.prepareBind} ${brand.label}`)
  }

  async function handleSubmitLogin() {
    if (!loginBrand) return
    setIsSubmitting(true)
    try {
      const account = await submitSmartDoorLockAccount({
        brandId: loginBrand.id,
        tab: loginBrand.tab,
        userName: loginUserName,
        password: loginPassword,
      })
      setAccountsByTab((current) => ({
        ...current,
        [loginBrand.tab]: [account, ...(current[loginBrand.tab] ?? []).filter((item) => item.brandId !== account.brandId)],
      }))
      setLoginBrand(null)
      setLoginUserName('')
      setLoginPassword('')
      setFeedback(`${loginBrand.label}${text.linkedSuffix}`)
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : text.loadAlertTitle)
    } finally {
      setIsSubmitting(false)
    }
  }

  function handleSyncAccount(account: SmartDoorLockAccount) {
    if (account.syncDisabled) {
      setFeedback(account.syncDisabledReason || text.disabledSync)
      return
    }
    setFeedback(`${text.syncedPrefix}${account.displayName}${text.syncRecord}`)
  }

  return (
    <div className="smart-door-lock-page smart-lock-page" data-provider={provider} data-state={pageState}>
      <span
        data-testid="smart-door-lock-service-contract"
        data-provider={provider}
        data-active-tab={activeTab}
        data-state={pageState}
        data-trace-id={dashboard?.traceId ?? ''}
        hidden
      />

      <span className="smart-lock-version">{text.version}</span>

      <section className="smart-door-lock-surface" aria-label={text.pageLabel}>
        <header className="smart-door-lock-header">
          <div>
            <h1>{text.title}</h1>
            <p>{text.subtitle}</p>
          </div>
          <div className="smart-door-lock-header__actions">
            <span className="smart-door-lock-requested-at">{requestedAtLabel}</span>
            <button type="button" onClick={handleRefresh} disabled={isLoading}>
              {text.refresh}
            </button>
            <button type="button" className="is-primary" onClick={() => navigate(routes.localsMall)}>
              {text.localsMall}
            </button>
          </div>
        </header>

        <div className="smart-door-lock-tabs" role="tablist" aria-label="\u95e8\u9501\u7c7b\u578b">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'password'}
            className={activeTab === 'password' ? 'is-active' : ''}
            onClick={() => setActiveTab('password')}
            disabled={isLoading}
          >
            {'\u5bc6\u7801\u95e8\u9501'}
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'card'}
            className={activeTab === 'card' ? 'is-active' : ''}
            onClick={() => setActiveTab('card')}
            disabled={isLoading}
          >
            {'\u623f\u5361\u95e8\u9501'}
          </button>
        </div>

        <div className="smart-door-lock-statusbar">
          <span className="smart-door-lock-lead">{activeTabView?.leadText ?? '\u8bf7\u9009\u62e9\u95e8\u9501\u54c1\u724c\u6dfb\u52a0\u8d26\u53f7'}</span>
          <div className="smart-door-lock-shortcuts">
            <button type="button" onClick={() => navigate(routes.hardwareMall)}>
              {text.hardwareMall}
            </button>
            <button type="button" onClick={() => navigate(routes.selfCheckin)}>
              {text.selfCheckin}
            </button>
          </div>
        </div>

        {isLoading ? <div className="smart-door-lock-loading">{text.loading}</div> : null}

        {errorMessage ? (
          <section className="smart-door-lock-alert" role="alert" aria-label={text.loadAlertTitle}>
            <strong>{text.loadAlertTitle}</strong>
            <span>{errorMessage}</span>
            <button type="button" onClick={handleRetry}>
              {text.retry}
            </button>
          </section>
        ) : null}

        {!isLoading && !errorMessage && activeTabView ? (
          <div className="smart-door-lock-layout">
            <div className="smart-door-lock-main">
              <section className="smart-door-lock-panel" aria-labelledby="smart-door-lock-accounts-title">
                <div className="smart-door-lock-panel__head">
                  <h2 id="smart-door-lock-accounts-title">{activeTabView.accountsTitle}</h2>
                  <span>{activeTab === 'card' ? text.cardTabHint : text.passwordTabHint}</span>
                </div>

                {activeTabView.accounts.length > 0 ? (
                  <div className="smart-door-lock-account-grid">
                    {activeTabView.accounts.map((account) => (
                      <article key={account.id} className="smart-door-lock-account-card">
                        <div className="smart-door-lock-account-card__head">
                          <div>
                            <span className={`smart-door-lock-tag smart-door-lock-tag--${account.statusTone}`}>{account.statusLabel}</span>
                            <strong>{account.displayName}</strong>
                          </div>
                          <span>{account.brandLabel}</span>
                        </div>
                        <p>{account.roomSummary}</p>
                        <small>{account.lastSyncLabel}</small>
                        <div className="smart-door-lock-account-card__footer">
                          <button
                            type="button"
                            aria-label={`${text.syncRecord} ${account.displayName}`}
                            onClick={() => handleSyncAccount(account)}
                            disabled={account.syncDisabled}
                          >
                            {account.syncDisabled ? account.syncDisabledReason || text.disabledSync : text.syncRecord}
                          </button>
                          <button type="button" onClick={() => setDetailAccount(account)}>
                            {text.detail}
                          </button>
                        </div>
                      </article>
                    ))}
                  </div>
                ) : (
                  <section
                    className="smart-door-lock-empty"
                    role="region"
                    aria-label="\u667a\u80fd\u95e8\u9501\u7a7a\u72b6\u6001"
                  >
                    <strong>{text.empty}</strong>
                    <p>{text.emptyDesc}</p>
                    <button type="button" onClick={() => navigate(routes.hardwareMall)}>
                      {text.hardwareMall}
                    </button>
                  </section>
                )}
              </section>

              <section className="smart-door-lock-panel" aria-labelledby="smart-door-lock-brands-title">
                <div className="smart-door-lock-panel__head">
                  <h2 id="smart-door-lock-brands-title">{activeTabView.brandsTitle}</h2>
                  <span>{text.brandsHint}</span>
                </div>
                <div className="smart-door-lock-brand-grid" aria-label="\u95e8\u9501\u54c1\u724c\u5217\u8868">
                  {activeTabView.brands.map((brand) => (
                    <button
                      key={brand.id}
                      type="button"
                      className="smart-door-lock-brand"
                      aria-label={`\u6dfb\u52a0${brand.label}\u8d26\u53f7`}
                      onClick={() => openBrand(brand)}
                    >
                      <span className={`smart-lock-logo smart-lock-logo--${brand.tone}`}>{brand.logo}</span>
                      <strong>{brand.label}</strong>
                    </button>
                  ))}

                  <article className="smart-door-lock-mall-card">
                    <div className="smart-lock-mall-logo">{'\u8def\u5ba2\u5546\u57ce'}</div>
                    <button type="button" onClick={() => navigate(routes.localsMall)}>
                      {'+ \u52a0\u8d2d\u95e8\u9501'}
                    </button>
                  </article>
                </div>
              </section>
            </div>

            <aside className="smart-door-lock-aside">
              <section className="smart-door-lock-panel smart-door-lock-panel--compact">
                <div className="smart-door-lock-panel__head">
                  <h2>{text.compactLinks}</h2>
                </div>
                <div className="smart-door-lock-link-list">
                  <button type="button" onClick={() => navigate(routes.hardwareMall)}>
                    {text.hardwareMall}
                  </button>
                  <button type="button" onClick={() => navigate(routes.selfCheckin)}>
                    {text.selfCheckin}
                  </button>
                  <button type="button" onClick={() => navigate(routes.localsMall)}>
                    {text.localsMallCompact}
                  </button>
                </div>
              </section>

              <section className="smart-door-lock-panel smart-door-lock-panel--compact">
                <div className="smart-door-lock-panel__head">
                  <h2>{text.compactCard}</h2>
                </div>
                <p>{dashboard?.cardSystemSummary.description}</p>
                <ul className="smart-door-lock-meta-list">
                  <li>{dashboard?.cardSystemSummary.deviceCountLabel}</li>
                  <li>{dashboard?.cardSystemSummary.lastSyncLabel}</li>
                </ul>
                <button type="button" onClick={() => setIsCardSystemConfirmOpen(true)}>
                  {text.cardSystemPath}
                </button>
              </section>
            </aside>
          </div>
        ) : null}
      </section>

      <div className="smart-door-lock-status" role="status" aria-live="polite" aria-label={text.serviceStateLabel}>
        {feedback}
      </div>

      {loginBrand ? (
        <Modal title={text.loginTitle} closeLabel={text.loginClose} onClose={() => setLoginBrand(null)}>
          <div className="smart-door-lock-form">
            <label className="smart-door-lock-field">
              <span>{loginBrand.accountLabel ?? `${loginBrand.label}\u8d26\u53f7`}</span>
              <input
                aria-label={loginBrand.accountLabel ?? `${loginBrand.label}\u8d26\u53f7`}
                value={loginUserName}
                onChange={(event) => setLoginUserName(event.target.value)}
                placeholder="\u8bf7\u8f93\u5165\u8d26\u53f7"
                disabled={isSubmitting}
              />
            </label>
            <label className="smart-door-lock-field">
              <span>{loginBrand.passwordLabel ?? `${loginBrand.label}\u5bc6\u7801`}</span>
              <input
                aria-label={loginBrand.passwordLabel ?? `${loginBrand.label}\u5bc6\u7801`}
                type="password"
                value={loginPassword}
                onChange={(event) => setLoginPassword(event.target.value)}
                placeholder="\u8bf7\u8f93\u5165\u5bc6\u7801"
                disabled={isSubmitting}
              />
            </label>
          </div>
          <div className="smart-door-lock-modal__footer">
            <button type="button" onClick={() => setLoginBrand(null)} disabled={isSubmitting}>
              {text.cancel}
            </button>
            <button type="button" className="is-primary" onClick={() => void handleSubmitLogin()} disabled={isSubmitting}>
              {text.submit}
            </button>
          </div>
        </Modal>
      ) : null}

      {detailAccount ? (
        <Modal title={text.accountDetail} closeLabel={text.accountDetailClose} onClose={() => setDetailAccount(null)}>
          <div className="smart-door-lock-detail">
            <dl>
              <div>
                <dt>{text.brand}</dt>
                <dd>{detailAccount.brandLabel}</dd>
              </div>
              <div>
                <dt>{text.accountName}</dt>
                <dd>{detailAccount.displayName}</dd>
              </div>
              <div>
                <dt>{text.syncScope}</dt>
                <dd>{detailAccount.roomSummary}</dd>
              </div>
              <div>
                <dt>{text.linkedSource}</dt>
                <dd>{detailAccount.linkedBy}</dd>
              </div>
            </dl>
          </div>
          <div className="smart-door-lock-modal__footer">
            <button type="button" onClick={() => setDetailAccount(null)}>
              {text.close}
            </button>
          </div>
        </Modal>
      ) : null}

      {isCardSystemConfirmOpen ? (
        <Modal title={text.cardSystemClosedTitle} closeLabel={text.cardSystemClosedClose} onClose={() => setIsCardSystemConfirmOpen(false)}>
          <div className="smart-door-lock-detail">
            <p>{text.cardSystemClosedContent}</p>
          </div>
          <div className="smart-door-lock-modal__footer">
            <button type="button" onClick={() => setIsCardSystemConfirmOpen(false)}>
              {text.cancel}
            </button>
            <button
              type="button"
              className="is-primary"
              onClick={() => {
                setIsCardSystemConfirmOpen(false)
                navigate(routes.localsMall)
              }}
            >
              {text.cardSystemOpen}
            </button>
          </div>
        </Modal>
      ) : null}

      {isCardSystemOverviewOpen ? (
        <Modal title={text.cardSystemTitle} closeLabel={text.cardSystemClose} onClose={() => setIsCardSystemOverviewOpen(false)}>
          <div className="smart-door-lock-detail">
            <p>{dashboard?.cardSystemSummary.description}</p>
            <ul className="smart-door-lock-meta-list">
              <li>{dashboard?.cardSystemSummary.deviceCountLabel}</li>
              <li>{dashboard?.cardSystemSummary.lastSyncLabel}</li>
            </ul>
          </div>
          <div className="smart-door-lock-modal__footer">
            <button type="button" onClick={() => setIsCardSystemOverviewOpen(false)}>
              {text.close}
            </button>
          </div>
        </Modal>
      ) : null}
    </div>
  )
}

function Modal({
  title,
  closeLabel,
  onClose,
  children,
}: {
  title: string
  closeLabel: string
  onClose: () => void
  children: ReactNode
}) {
  return (
    <div className="smart-lock-modal-backdrop">
      <section className="smart-lock-modal smart-lock-modal--wide" role="dialog" aria-modal="true" aria-label={title}>
        <header>
          <h2>{title}</h2>
          <button type="button" aria-label={closeLabel} onClick={onClose}>
            ×
          </button>
        </header>
        <div className="smart-lock-modal__body">{children}</div>
      </section>
    </div>
  )
}

function getTabAccounts(dashboard: SmartDoorLockDashboard, key: SmartDoorLockTabKey) {
  return dashboard.tabs.find((tab) => tab.key === key)?.accounts ?? []
}
