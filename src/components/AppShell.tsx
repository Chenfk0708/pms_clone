import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { channelSideNav, distributionSideNav, globalRadarSideNav, informationSideNav, scrmSideNav } from '../data/discovery'
import type { TopNavItem } from '../types'
import { resolveSideNav } from '../data/mock'
import { getCurrentSessionUser } from '../services/session'

interface AppShellProps {
  path: string
  pageTitle: string
  children: React.ReactNode
}

const topNav: TopNavItem[] = [
  { label: '首页', path: '/workspace' },
  { label: '房态', path: '/houseManage/months' },
  { label: '房价', path: '/houseManage/houseCale' },
  { label: '订单', path: '/order/house-order/list' },
  { label: '售卖/产品', path: '/setting/localRoomTypeProductionSetting' },
  { label: 'OTA', path: '/channels/ota' },
  { label: '社媒', path: '/channels/social' },
  { label: '私域', path: '/channels/private' },
  { label: '聚合分销', path: '/channels/distribution/distributionSecond', badge: 'HOT' },
  { label: 'SCRM', path: '/scrm/general' },
  { label: 'AI全域雷达', path: '/channels/globalRadar/globalData' },
  { label: '智慧酒店', path: '/smartHotel/smartHome' },
  { label: '报表', path: '/statistics/report' },
  { label: '设置', path: '/InformationMaintenance/informationOverview' },
]

type TopbarTool = 'message' | 'payment' | 'reception' | 'key' | 'service' | 'notice'
type TopbarPanel = 'payment' | 'service' | 'user'

const topbarTools: Array<{ id: TopbarTool; label: string; icon: string }> = [
  { id: 'message', label: '消息', icon: 'message' },
  { id: 'payment', label: '收款', icon: 'payment' },
  { id: 'reception', label: '接待', icon: 'reception' },
  { id: 'key', label: '门锁', icon: 'key' },
  { id: 'service', label: '客服', icon: 'service' },
  { id: 'notice', label: '通知', icon: 'notice' },
]

export function AppShell({ path, pageTitle, children }: AppShellProps) {
  const navigate = useNavigate()
  const sessionUser = getCurrentSessionUser()
  const [openTopbarPanel, setOpenTopbarPanel] = useState<TopbarPanel | null>(null)
  const [collapsedSidebarGroups, setCollapsedSidebarGroups] = useState<Record<string, boolean>>({})
  const isRoomSituation = path === '/statistics/roomSituation'
  const isCleanStatistics = path === '/cleanManage/cleanStatistics'
  const isInformationSettingPath = path === '/setting/customChannel'
  const usesFlushContent = isRoomSituation || isCleanStatistics || isInformationSettingPath
  const usesSrOnlyHeading = isRoomSituation || isCleanStatistics
  const showDefaultPageHeader = false
  const isHouseTopNav = isRoomSituation || path.startsWith('/cleanManage/')
  const isOrderMallPath =
    path.startsWith('/mallManagement/orderManagement') ||
    path.startsWith('/mallManagement/verificationManagement') ||
    path.startsWith('/mallManagement/hotelPackageOrder')
  const isProductSettingPath = path.startsWith('/setting/localRoomTypeProductionSetting')
  const isCompanySettingPath = path.startsWith('/CompanySetting/')
  const isInformationMaintenancePath = path.startsWith('/InformationMaintenance/')
  const isSystemSettingPath =
    isInformationMaintenancePath ||
    isInformationSettingPath ||
    (path.startsWith('/setting/') && !isProductSettingPath) ||
    isCompanySettingPath
  const isSalesTopNav =
    isProductSettingPath ||
    path.startsWith('/mallManagement/goodsManagement') ||
    path.startsWith('/mallManagement/hotelProduct')
  const isFullMarketingPath = path === '/mallManagement/distribution'
  const isCouponPath = path.startsWith('/mallManagement/couponMgt')
  const isCustomerScrmPath = path.startsWith('/customer/')
  const isScrmTopNav = path.startsWith('/scrm/') || isCustomerScrmPath || isFullMarketingPath || isCouponPath
  const isGlobalRadarTopNav = path.startsWith('/channels/globalRadar/')
  const isDistributionTopNav = path.startsWith('/channels/distribution/')
  const isReportTopNav = path.startsWith('/statistics/') && !isRoomSituation
  const isPsbSmartHotelPath = path.startsWith('/psb/')
  const isSmartHotelTopNav = path.startsWith('/smartHotel/') || isPsbSmartHotelPath
  const isOrderTopNav = path.startsWith('/order/') || isOrderMallPath
  const sideGroups = path.startsWith('/channels/globalRadar/')
    ? globalRadarSideNav
    : path.startsWith('/channels/distribution/')
    ? distributionSideNav
    : path.startsWith('/channels/')
      ? channelSideNav
    : isScrmTopNav
      ? scrmSideNav
    : isInformationMaintenancePath || isSystemSettingPath
        ? informationSideNav
        : isRoomSituation
          ? resolveSideNav('/houseManage/houseStatus')
          : isPsbSmartHotelPath
            ? resolveSideNav('/smartHotel/smartHome')
            : resolveSideNav(path)
  const usesHouseManagementSidebar = path.startsWith('/houseManage/') || path.startsWith('/cleanManage/') || isRoomSituation

  function handleTopbarTool(tool: TopbarTool) {
    setOpenTopbarPanel(null)

    if (tool === 'message') {
      return
    }

    if (tool === 'payment') {
      setOpenTopbarPanel('payment')
      return
    }

    if (tool === 'reception') {
      navigate('/statistics/shift/record')
      return
    }

    if (tool === 'key') {
      navigate('/smartHotel/smartHardware/smartLook')
      return
    }

    if (tool === 'service') {
      setOpenTopbarPanel('service')
      return
    }

    navigate('/setting/notification')
  }

  function isSidebarGroupActive(group: (typeof sideGroups)[number]) {
    return group.items.some((item) => path === item.path || path.startsWith(`${item.path}/`) || (isRoomSituation && item.path === '/houseManage/houseStatus'))
  }

  function getSidebarGroupKey(group: (typeof sideGroups)[number]) {
    return group.title || group.items[0]?.path || pageTitle
  }

  function getSidebarGroupTitle(group: (typeof sideGroups)[number]) {
    if (group.title) return group.title

    const firstPath = group.items[0]?.path ?? ''
    if (firstPath.startsWith('/scrm/') || firstPath.startsWith('/customer/')) return 'SCRM'
    if (firstPath.startsWith('/channels/globalRadar/')) return 'AI全域雷达'

    return group.items[0]?.label ?? pageTitle
  }

  function isLeafSidebarGroup(group: (typeof sideGroups)[number]) {
    return group.items.length === 1 && group.items[0].label === getSidebarGroupTitle(group)
  }

  function isSidebarGroupExpanded(group: (typeof sideGroups)[number]) {
    if (isLeafSidebarGroup(group)) return false

    const key = getSidebarGroupKey(group)
    const userCollapsedState = collapsedSidebarGroups[key]
    if (typeof userCollapsedState === 'boolean') return !userCollapsedState

    return isSidebarGroupActive(group)
  }

  function toggleSidebarGroup(groupTitle: string, isCurrentlyExpanded: boolean) {
    setCollapsedSidebarGroups((current) => ({
      ...current,
      [groupTitle]: isCurrentlyExpanded,
    }))
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand-block">
          <div className="brand-mark">LOCALS</div>
          <div className="brand-store">
            <strong>路客云 6TS5 的店铺</strong>
            <span>畅享版</span>
          </div>
        </div>
        <nav className="topnav" aria-label="顶部导航">
          {topNav.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              aria-label={item.label}
              className={({ isActive }) =>
                `topnav-link${
                  isActive ||
                  (isHouseTopNav && item.path === '/houseManage/months') ||
                  (isOrderTopNav && item.path === '/order/house-order/list') ||
                  (isSalesTopNav && item.path === '/setting/localRoomTypeProductionSetting') ||
                  (isSystemSettingPath && item.path === '/InformationMaintenance/informationOverview') ||
                  (isScrmTopNav && item.path === '/scrm/general') ||
                  (isGlobalRadarTopNav && item.path === '/channels/globalRadar/globalData') ||
                  (isDistributionTopNav && item.path === '/channels/distribution/distributionSecond') ||
                  (isReportTopNav && item.path === '/statistics/report') ||
                  (isSmartHotelTopNav && item.path === '/smartHotel/smartHome')
                    ? ' is-active'
                    : ''
                }`
              }
            >
              {item.label}
              {item.badge ? <em>{item.badge}</em> : null}
            </NavLink>
          ))}
        </nav>
        <div className="topbar-actions" aria-label="顶部工具栏">
          <Link className="topbar-app-entry" to="/version/applicationPayment" aria-label="应用订阅">
            <span className="topbar-grid-icon" aria-hidden="true">
              <i />
            </span>
            <span>应用订阅</span>
            <em>限时试用</em>
          </Link>
          {topbarTools.map((tool) => (
            <button
              key={tool.id}
              type="button"
              className={`topbar-tool-button topbar-tool-button--${tool.icon}`}
              aria-label={tool.label}
              aria-expanded={(tool.id === 'payment' && openTopbarPanel === 'payment') || (tool.id === 'service' && openTopbarPanel === 'service')}
              onClick={() => handleTopbarTool(tool.id)}
            >
              <TopbarIcon type={tool.icon} />
            </button>
          ))}
          <button type="button" className="topbar-user-menu" aria-label="用户菜单" aria-expanded={openTopbarPanel === 'user'} onClick={() => setOpenTopbarPanel(openTopbarPanel === 'user' ? null : 'user')}>
            <span className="topbar-user-avatar" aria-hidden="true">
              <TopbarIcon type="user" />
            </span>
            <TopbarIcon type="chevron" />
          </button>
          {openTopbarPanel === 'user' ? (
            <div className="topbar-user-popover" role="dialog" aria-label="用户菜单面板">
              <strong>{sessionUser?.name ?? '路客云 6TS5 的店铺'}</strong>
              {sessionUser ? <span>{sessionUser.roleLabel}</span> : null}
              <Link to="/InformationMaintenance/campInfo" onClick={() => setOpenTopbarPanel(null)}>门店信息</Link>
              <Link to="/setting/member" onClick={() => setOpenTopbarPanel(null)}>成员设置</Link>
              <Link to="/CompanySetting/Apikeys" onClick={() => setOpenTopbarPanel(null)}>API keys</Link>
            </div>
          ) : null}
        </div>
      </header>

      <div className="page-body">
        {sideGroups.length > 0 ? (
          <aside className="sidebar" aria-label={`${pageTitle}侧边导航`}>
            {sideGroups.map((group) => {
              const isExpanded = isSidebarGroupExpanded(group)
              const isActiveGroup = isSidebarGroupActive(group)
              const isLeafGroup = isLeafSidebarGroup(group)
              const groupKey = getSidebarGroupKey(group)
              const groupTitle = getSidebarGroupTitle(group)

              return (
                <section
                  key={groupKey}
                  className={`sidebar-group sidebar-group--module${isExpanded ? ' is-expanded' : ' is-collapsed'}${usesHouseManagementSidebar ? ' sidebar-group--house' : ''}${isActiveGroup ? ' is-active-group' : ''}${isLeafGroup ? ' sidebar-group--leaf' : ''}`}
                >
                  {isLeafGroup ? (
                    <NavLink
                      to={group.items[0].path}
                      aria-label={groupTitle}
                      className={({ isActive }) =>
                        `sidebar-group-title sidebar-group-title--link sidebar-link${isActive || isActiveGroup ? ' is-active' : ''}`
                      }
                    >
                      <SidebarGroupIcon group={group} />
                      <span className="sidebar-group-heading" role="heading" aria-level={2}>{groupTitle}</span>
                    </NavLink>
                  ) : (
                    <button
                      type="button"
                      className={`sidebar-group-title${isActiveGroup ? ' is-active' : ''}`}
                      aria-expanded={isExpanded}
                      onClick={() => toggleSidebarGroup(groupKey, isExpanded)}
                    >
                      <SidebarGroupIcon group={group} />
                      <span className="sidebar-group-heading" role="heading" aria-level={2}>{groupTitle}</span>
                      <TopbarIcon type="chevron" />
                    </button>
                  )}
                  {isExpanded ? (
                    <div className="sidebar-items">
                      {group.items.map((item) => (
                        <NavLink
                          key={item.path}
                          to={item.path}
                          aria-label={item.label}
                          className={({ isActive }) =>
                            `sidebar-link${isActive || (isRoomSituation && item.path === '/houseManage/houseStatus') ? ' is-active' : ''}`
                          }
                        >
                          {item.label}
                        </NavLink>
                      ))}
                    </div>
                  ) : null}
                </section>
              )
            })}
          </aside>
        ) : null}

        <main className={`page-content${usesFlushContent ? ' page-content--room-situation' : ''}`}>
          {usesSrOnlyHeading ? (
            <h1 className="sr-only-heading">{pageTitle}</h1>
          ) : usesFlushContent || !showDefaultPageHeader ? null : (
          <div className="page-header">
            <div>
              <p className="eyebrow">PMS Clone Prototype</p>
              <h1>{pageTitle}</h1>
            </div>
            <div className="page-meta">采集基线：Chrome 1440x900 / 账号已授权登录</div>
          </div>
          )}
          {children}
        </main>
      </div>
      {openTopbarPanel === 'payment' ? <TopbarPaymentDialog onClose={() => setOpenTopbarPanel(null)} /> : null}
      {openTopbarPanel === 'service' ? <TopbarServicePanel onClose={() => setOpenTopbarPanel(null)} /> : null}
    </div>
  )
}

function SidebarGroupIcon({ group }: { group: ReturnType<typeof resolveSideNav>[number] }) {
  const firstPath = group.items[0]?.path ?? ''

  if (firstPath.startsWith('/houseManage/houseCale') || firstPath.startsWith('/houseManage/channelPrice')) {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M4.5 9.5 12 5l7.5 4.5v9.8H4.5z" />
        <path d="M9 10.2h6M9 13h6M12 8.5v6.2" />
      </svg>
    )
  }

  if (firstPath.startsWith('/houseManage/houseStatus')) {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <rect x="6" y="4.5" width="12" height="16" rx="1.5" />
        <path d="M9.2 4.5h5.6l.7 2.3h-7zM9 11h6M9 15h6" />
      </svg>
    )
  }

  if (firstPath.startsWith('/cleanManage/')) {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M4.5 20.5V9.2M7.2 20.5V8.5M10 20.5V10" />
        <path d="M3.3 20.5h8" />
        <path d="M12.5 7.5h7v13h-7z" />
        <path d="M15 7.5V4h2.8v3.5M15.2 11.3c1.6.6 2.8.3 3.6-.8" />
      </svg>
    )
  }

  if (firstPath.startsWith('/order/') || firstPath.startsWith('/mallManagement/')) {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <rect x="5" y="4.5" width="14" height="16" rx="2" />
        <path d="M8.5 8h7M8.5 12h7M8.5 16h4" />
      </svg>
    )
  }

  if (firstPath.startsWith('/channels/distribution/')) {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="7" cy="7" r="2.4" />
        <circle cx="17" cy="7" r="2.4" />
        <circle cx="12" cy="17" r="2.4" />
        <path d="m9 8.5 2 5M15 8.5l-2 5" />
      </svg>
    )
  }

  if (firstPath.startsWith('/channels/globalRadar/')) {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 20a8 8 0 1 0 0-16 8 8 0 0 0 0 16Z" />
        <path d="M12 8v4l3 2M4 12h2M18 12h2M12 4v2M12 18v2" />
      </svg>
    )
  }

  if (firstPath.startsWith('/channels/')) {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M5 8.5h14M7 5h10l2 3.5v9.8H5V8.5z" />
        <path d="M8.5 13h7M8.5 16h5" />
      </svg>
    )
  }

  if (firstPath.startsWith('/scrm/') || firstPath.startsWith('/customer/')) {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="9" cy="8" r="3" />
        <path d="M4.5 19a5.2 5.2 0 0 1 9 0" />
        <path d="M15 7.5h4M15 11h5M16.5 15h2" />
      </svg>
    )
  }

  if (firstPath.startsWith('/smartHotel/') || firstPath.startsWith('/psb/')) {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M5 20V8l7-4 7 4v12" />
        <path d="M9 20v-6h6v6M9 10h6" />
      </svg>
    )
  }

  if (firstPath.startsWith('/statistics/')) {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M5 19V5M5 19h14" />
        <path d="M9 16v-5M13 16V8M17 16v-7" />
      </svg>
    )
  }

  if (firstPath.startsWith('/InformationMaintenance/') || firstPath.startsWith('/CompanySetting/') || firstPath.startsWith('/setting/')) {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z" />
        <path d="m19 12 2-1.2-2-3.4-2.2.8a7 7 0 0 0-1.4-.8L15 5h-6l-.4 2.4a7 7 0 0 0-1.4.8L5 7.4l-2 3.4L5 12l-2 1.2 2 3.4 2.2-.8a7 7 0 0 0 1.4.8L9 19h6l.4-2.4a7 7 0 0 0 1.4-.8l2.2.8 2-3.4Z" />
      </svg>
    )
  }

  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="m4 10 8-5.5 8 5.5v9.5H4z" />
      <path d="M9.5 19.5v-6h5v6" />
    </svg>
  )
}

function TopbarPaymentDialog({ onClose }: { onClose: () => void }) {
  return (
    <div className="topbar-payment-mask" role="presentation" onMouseDown={onClose}>
      <section className="topbar-payment-dialog" role="dialog" aria-modal="true" aria-label="收款" onMouseDown={(event) => event.stopPropagation()}>
        <header>
          <strong>收款</strong>
          <button type="button" aria-label="关闭收款" onClick={onClose}>×</button>
        </header>
        <div className="topbar-payment-form">
          <label>
            <span>收款方式</span>
            <button type="button">请选择收款方式</button>
          </label>
          <label>
            <span>金额</span>
            <div className="topbar-payment-inline">
              <input aria-label="金额" />
              <button type="button">人民币 | CNY</button>
            </div>
          </label>
          <label>
            <span>房型/房间</span>
            <button type="button">请选择房型/房间</button>
          </label>
          <label>
            <span>时间</span>
            <input aria-label="时间" defaultValue="2026-05-15 12:00" />
          </label>
        </div>
        <footer>
          <Link to="/statistics/ledger" onClick={onClose}>记一笔明细</Link>
          <button type="button" onClick={onClose}>取消</button>
          <button type="button" className="is-primary" onClick={onClose}>确定</button>
        </footer>
      </section>
    </div>
  )
}

function TopbarServicePanel({ onClose }: { onClose: () => void }) {
  return (
    <aside className="topbar-service-panel" role="dialog" aria-label="路客云AI客服">
      <header>
        <strong>路客云AI客服</strong>
        <button type="button" aria-label="关闭客服" onClick={onClose}>×</button>
      </header>
      <div className="topbar-service-message">您好，我是路客云AI客服，很高兴为您服务</div>
      <div className="topbar-service-questions">
        <span>您可以下方输入您要咨询的内容!</span>
        <button type="button">如何调整房价?</button>
        <button type="button">如何调整房态?</button>
        <button type="button">如何直连渠道?</button>
      </div>
      <div className="topbar-service-input">
        <Link to="/scrm/wechatService/manage" onClick={onClose}>人工客服</Link>
        <button type="button">发 送</button>
      </div>
    </aside>
  )
}

function TopbarIcon({ type }: { type: string }) {
  switch (type) {
    case 'message':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M5 6.5h14v9H9.5L6 18.5v-3H5z" />
          <path d="M8.5 10.5h.01M12 10.5h.01M15.5 10.5h.01" />
        </svg>
      )
    case 'payment':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M5 5h14v14H5z" />
          <path d="M8 9h8M9 13h6M12 8v8" />
        </svg>
      )
    case 'reception':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z" />
          <path d="M4 21c.8-4 3.5-6 8-6h2.5" />
          <path d="M16 16h5M18.5 13.5 21 16l-2.5 2.5" />
        </svg>
      )
    case 'key':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M8.5 14a4.5 4.5 0 1 1 3.8-2.1L21 3.2" />
          <path d="M16.5 7.7 19 10.2M14.4 9.8l2 2" />
          <circle cx="8.5" cy="14" r="1" />
        </svg>
      )
    case 'service':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M5 13v-2a7 7 0 0 1 14 0v2" />
          <path d="M5 13h3v5H5zM16 13h3v5h-3z" />
          <path d="M16 18c-.7 2-2 3-4 3" />
        </svg>
      )
    case 'notice':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M6 17h12l-1.4-2.1V11a4.6 4.6 0 0 0-9.2 0v3.9z" />
          <path d="M10 20h4" />
        </svg>
      )
    case 'user':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="12" cy="8" r="4" />
          <path d="M4.5 21a7.8 7.8 0 0 1 15 0" />
        </svg>
      )
    case 'chevron':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="m7 9 5 5 5-5" />
        </svg>
      )
    default:
      return null
  }
}
