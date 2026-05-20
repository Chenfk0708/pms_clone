import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  createDefaultSmartIdCardReaderFilters,
  fetchSmartIdCardReaderDashboard,
  getSmartIdCardReaderRequestSummary,
  type SmartIdCardReaderDashboard,
  type SmartIdCardReaderDatePreset,
  type SmartIdCardReaderDeviceStatus,
  type SmartIdCardReaderFilters,
  type SmartIdCardReaderGuestPreview,
  type SmartIdCardReaderRecord,
} from '../services/smartIdCardReader'
import './SmartIdCardReaderPage.css'

const datePresetLabels: Record<SmartIdCardReaderDatePreset, string> = {
  today: '今日',
  '7d': '近7天',
  '30d': '近30天',
}

const deviceStatusLabels: Record<SmartIdCardReaderDeviceStatus, string> = {
  all: '全部',
  connected: '已连接',
  pending: '待调试',
  warning: '需复核',
}

const emptyPreview: SmartIdCardReaderGuestPreview = {
  guestName: '',
  maskedIdNumber: '',
  roomType: '读取后将自动匹配订单房型',
  roomNo: '读取后自动展示房间号',
}

const readSuccessPreview: SmartIdCardReaderGuestPreview = {
  guestName: '张小雅',
  maskedIdNumber: '4401********0621',
  roomType: '顶层套房（浴缸巨幕电竞麻将）',
  roomNo: '1808',
}

export function SmartIdCardReaderPage() {
  const location = useLocation()
  return <SmartIdCardReaderPageContent key={location.search || '__default__'} />
}

function SmartIdCardReaderPageContent() {
  const location = useLocation()
  const navigate = useNavigate()
  const defaults = useMemo(
    () => createDefaultSmartIdCardReaderFilters(new URLSearchParams(location.search)),
    [location.search],
  )

  const [dashboard, setDashboard] = useState<SmartIdCardReaderDashboard | null>(null)
  const [filters, setFilters] = useState<SmartIdCardReaderFilters>(defaults)
  const [keyword, setKeyword] = useState(defaults.keyword)
  const [deviceStatus, setDeviceStatus] = useState<SmartIdCardReaderDeviceStatus>(defaults.deviceStatus)
  const [datePreset, setDatePreset] = useState<SmartIdCardReaderDatePreset>(defaults.datePreset)
  const [records, setRecords] = useState<SmartIdCardReaderRecord[]>([])
  const [preview, setPreview] = useState<SmartIdCardReaderGuestPreview>(emptyPreview)
  const [currentBrand, setCurrentBrand] = useState('华视')
  const [feedback, setFeedback] = useState('身份证读卡器数据加载中')
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')
  const [isBrandListOpen, setIsBrandListOpen] = useState(false)
  const [isStatusListOpen, setIsStatusListOpen] = useState(false)
  const [selectedRecord, setSelectedRecord] = useState<SmartIdCardReaderRecord | null>(null)
  const [reloadSeq, setReloadSeq] = useState(0)

  useEffect(() => {
    const controller = new AbortController()

    void fetchSmartIdCardReaderDashboard(filters, controller.signal)
      .then((result) => {
        setDashboard(result)
        setRecords(result.records)
        setPreview(result.guestPreview)
        setCurrentBrand(result.currentBrand)
        setFeedback(result.emptyState?.title ?? '身份证读卡器数据已加载')
        setSelectedRecord(null)
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === 'AbortError') return

        const message = error instanceof Error ? error.message : '身份证读卡器数据加载失败，请稍后重试'
        setDashboard(null)
        setRecords([])
        setPreview(emptyPreview)
        setCurrentBrand('华视')
        setErrorMessage(message)
        setFeedback(message)
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setIsLoading(false)
        }
      })

    return () => controller.abort()
  }, [filters, reloadSeq])

  const requestSummary = getSmartIdCardReaderRequestSummary(filters, dashboard?.traceId ?? '')
  const recordCount = records.length

  function syncSearchParams(nextFilters: SmartIdCardReaderFilters) {
    const params = new URLSearchParams()
    params.set('campId', nextFilters.campId)

    if (nextFilters.datePreset !== 'today') {
      params.set('datePreset', nextFilters.datePreset)
    }

    if (nextFilters.deviceStatus !== 'all') {
      params.set('deviceStatus', nextFilters.deviceStatus)
    }

    if (nextFilters.keyword) {
      params.set('keyword', nextFilters.keyword)
    }

    if (nextFilters.mockState !== 'success') {
      params.set('mockState', nextFilters.mockState)
    }

    const search = params.toString()
    navigate(
      {
        pathname: '/smartHotel/smartHardware/IDCardReader',
        search: search ? `?${search}` : '',
      },
      { replace: true },
    )
  }

  function commitFilters(next: SmartIdCardReaderFilters, message: string) {
    setIsLoading(true)
    setErrorMessage('')
    setKeyword(next.keyword)
    setDeviceStatus(next.deviceStatus)
    setDatePreset(next.datePreset)
    setFilters(next)
    setFeedback(message)
    setIsStatusListOpen(false)
    setIsBrandListOpen(false)
    syncSearchParams(next)
  }

  function applyFilters() {
    commitFilters(
      {
        ...filters,
        datePreset,
        deviceStatus,
        keyword: keyword.trim(),
      },
      '身份证读卡记录筛选条件已更新',
    )
  }

  function resetFilters() {
    commitFilters(
      {
        ...filters,
        datePreset: defaults.datePreset,
        deviceStatus: 'all',
        keyword: '',
      },
      '身份证读卡筛选条件已重置',
    )
  }

  function refreshDashboard() {
    setIsLoading(true)
    setErrorMessage('')
    setFeedback('身份证读卡器数据刷新中')
    setReloadSeq((current) => current + 1)
    setIsStatusListOpen(false)
    setIsBrandListOpen(false)
  }

  function exportRecords() {
    setFeedback(`读卡记录导出任务已创建，共 ${recordCount} 条记录待导出`)
  }

  function readIdCard() {
    setPreview(readSuccessPreview)
    setFeedback('已读取身份证信息，并匹配到待入住订单')
  }

  function clearPreview() {
    setPreview(emptyPreview)
    setFeedback('已清空本次读卡预览')
  }

  function finishSetup() {
    if (!preview.guestName || !preview.maskedIdNumber) {
      setFeedback('请先读取身份证信息，再完成对接')
      return
    }

    setFeedback(`身份证读卡器已完成对接，住客 ${preview.guestName} 的登记信息已写入 PMS`)
  }

  function retryLoad() {
    setIsLoading(true)
    setErrorMessage('')
    navigate('/smartHotel/smartHardware/IDCardReader', { replace: true })
  }

  return (
    <div
      className="smart-id-reader-page"
      data-provider={dashboard?.provider ?? ''}
      data-record-count={recordCount}
    >
      <div
        data-testid="smart-id-reader-service-contract"
        data-provider={dashboard?.provider ?? ''}
        data-mock-state={filters.mockState}
        data-device-status={filters.deviceStatus}
        data-record-count={String(recordCount)}
        hidden
      >
        {requestSummary.join(';')}
      </div>

      <section className="smart-id-reader-hero">
        <div className="smart-id-reader-hero__content">
          <span className="smart-id-reader-version">
            {dashboard?.versionLabel ?? '版本号：v4.10.7'}
          </span>
          <h1>身份证读卡器</h1>
          <p>
            接入身份证读卡器后，可直接读取住客信息，自动匹配订单并联动入住与公安上报流程。
          </p>
        </div>
        <div className="smart-id-reader-status-card">
          <strong>接入状态</strong>
          <span>{dashboard?.setupStatus ?? '异常待处理'}</span>
          <em>{dashboard?.requestedAtLabel ?? '最近同步：--'}</em>
        </div>
      </section>

      <section className="smart-id-reader-toolbar" aria-label="身份证读卡器筛选">
        <div className="smart-id-reader-date-presets" role="group" aria-label="数据范围">
          {(Object.keys(datePresetLabels) as SmartIdCardReaderDatePreset[]).map((preset) => (
            <button
              key={preset}
              type="button"
              className={preset === datePreset ? 'is-active' : ''}
              onClick={() => {
                setDatePreset(preset)
                setFeedback(`已切换数据范围：${datePresetLabels[preset]}`)
              }}
            >
              {datePresetLabels[preset]}
            </button>
          ))}
        </div>

        <div className="smart-id-reader-toolbar__actions">
          <div className="smart-id-reader-select-group">
            <button
              type="button"
              className="smart-id-reader-filter-button"
              aria-haspopup="listbox"
              aria-expanded={isStatusListOpen}
              onClick={() => setIsStatusListOpen((current) => !current)}
            >
              {`设备状态：${deviceStatusLabels[deviceStatus]}`}
            </button>
            {isStatusListOpen ? (
              <div className="smart-id-reader-option-list" role="listbox" aria-label="设备状态选项">
                {(Object.keys(deviceStatusLabels) as SmartIdCardReaderDeviceStatus[]).map((status) => (
                  <button
                    key={status}
                    type="button"
                    role="option"
                    aria-selected={status === deviceStatus}
                    onClick={() => {
                      setDeviceStatus(status)
                      setIsStatusListOpen(false)
                      setFeedback(`已选择设备状态：${deviceStatusLabels[status]}`)
                    }}
                  >
                    {deviceStatusLabels[status]}
                  </button>
                ))}
              </div>
            ) : null}
          </div>

          <input
            value={keyword}
            aria-label="搜索关键词"
            placeholder="搜索住客姓名、身份证号、订单号"
            onChange={(event) => setKeyword(event.target.value)}
          />

          <button type="button" onClick={applyFilters}>
            查询
          </button>
          <button type="button" className="is-secondary" onClick={resetFilters}>
            重置
          </button>
          <button type="button" className="is-secondary" onClick={refreshDashboard}>
            刷新
          </button>
          <button type="button" className="is-secondary" onClick={exportRecords} disabled={isLoading}>
            导出记录
          </button>
        </div>
      </section>

      <section className="smart-id-reader-metrics">
        {(dashboard?.metrics ?? []).map((metric) => (
          <button
            key={metric.id}
            type="button"
            className={`smart-id-reader-metric smart-id-reader-metric--${metric.tone}`}
            onClick={() => setFeedback(`${metric.label}：${metric.value}，${metric.detail}`)}
          >
            <span>{metric.label}</span>
            <strong>{metric.value}</strong>
            <small>{metric.detail}</small>
          </button>
        ))}
      </section>

      <div className="smart-id-reader-content">
        <section className="smart-id-reader-card" aria-label="身份证读卡器接入流程">
          <div className="smart-id-reader-card__head">
            <h2>接入流程</h2>
            <p>延续真实站三步接入流程，并补齐设备状态、读卡预览与记录联动闭环。</p>
          </div>

          <div className="smart-id-reader-flow">
            <article className="smart-id-reader-step">
              <span className="smart-id-reader-step__dot" aria-hidden="true" />
              <div className="smart-id-reader-step__body">
                <h3>请选择读卡器品牌</h3>
                <div className="smart-id-reader-select-group">
                  <button
                    type="button"
                    className="smart-id-reader-brand-button"
                    aria-haspopup="listbox"
                    aria-expanded={isBrandListOpen}
                    onClick={() => setIsBrandListOpen((current) => !current)}
                  >
                    {currentBrand}
                  </button>
                  {isBrandListOpen ? (
                    <div className="smart-id-reader-option-list" role="listbox" aria-label="读卡器品牌选项">
                      {(dashboard?.brandOptions ?? ['华视']).map((brand) => (
                        <button
                          key={brand}
                          type="button"
                          role="option"
                          aria-selected={brand === currentBrand}
                          onClick={() => {
                            setCurrentBrand(brand)
                            setIsBrandListOpen(false)
                            setFeedback(`读卡器品牌已切换为 ${brand}`)
                          }}
                        >
                          {brand}
                        </button>
                      ))}
                    </div>
                  ) : null}
                </div>
              </div>
            </article>

            <article className="smart-id-reader-step">
              <span className="smart-id-reader-step__dot" aria-hidden="true" />
              <div className="smart-id-reader-step__body">
                <h3>请下载插件（如已下载，可跳过）</h3>
                <div className="smart-id-reader-inline-action">
                  <span>{dashboard?.assistantPackageName ?? 'PMS 助手'}</span>
                  <button
                    type="button"
                    onClick={() => setFeedback('PMS 助手安装包下载任务已创建')}
                  >
                    PMS助手下载
                  </button>
                </div>
              </div>
            </article>

            <article className="smart-id-reader-step smart-id-reader-step--preview">
              <span className="smart-id-reader-step__dot" aria-hidden="true" />
              <div className="smart-id-reader-step__body">
                <h3>请调试读卡</h3>
                <div className="smart-id-reader-preview">
                  <label>
                    <span>住客姓名</span>
                    <input aria-label="住客姓名" value={preview.guestName} readOnly placeholder="住客姓名" />
                  </label>
                  <label>
                    <span>身份证号码</span>
                    <input
                      aria-label="身份证号码"
                      value={preview.maskedIdNumber}
                      readOnly
                      placeholder="身份证号码"
                    />
                  </label>
                  <div className="smart-id-reader-preview__actions">
                    <button type="button" onClick={readIdCard}>
                      读身份证
                    </button>
                    <button type="button" className="is-secondary" onClick={clearPreview}>
                      清空预览
                    </button>
                  </div>
                </div>

                <div className="smart-id-reader-preview-meta">
                  <p>
                    <strong>匹配房型</strong>
                    <span>{preview.roomType}</span>
                  </p>
                  <p>
                    <strong>房间号</strong>
                    <span>{preview.roomNo}</span>
                  </p>
                </div>
              </div>
            </article>
          </div>

          <div className="smart-id-reader-card__footer">
            <button type="button" onClick={finishSetup}>
              完成对接
            </button>
          </div>
        </section>

        <section className="smart-id-reader-card smart-id-reader-card--records">
          <div className="smart-id-reader-card__head">
            <h2>最近读卡记录</h2>
            <p>读卡结果与入住单联动状态全部由统一服务层返回，并支持筛选、空态与错误重试。</p>
          </div>

          {isLoading ? <div className="smart-id-reader-loading">身份证读卡器数据加载中</div> : null}

          {errorMessage ? (
            <div className="smart-id-reader-alert" role="alert" aria-label="身份证读卡器加载失败">
              <strong>身份证读卡器数据加载失败</strong>
              <span>{errorMessage}</span>
              <button type="button" onClick={retryLoad}>
                重新加载
              </button>
            </div>
          ) : null}

          {!isLoading && !errorMessage && !records.length ? (
            <div className="smart-id-reader-empty" role="status" aria-label="身份证读卡记录空状态">
              <strong>{dashboard?.emptyState?.title ?? '当前筛选条件下暂无读卡记录'}</strong>
              <p>
                {dashboard?.emptyState?.description ?? '请调整筛选条件后重试，或先在前台完成一次设备调试。'}
              </p>
            </div>
          ) : null}

          {!isLoading && !errorMessage && records.length ? (
            <div className="smart-id-reader-table-shell">
              <table className="smart-id-reader-table" aria-label="身份证读卡记录表格">
                <thead>
                  <tr>
                    <th>读卡时间</th>
                    <th>住客</th>
                    <th>身份证号码</th>
                    <th>房型 / 房号</th>
                    <th>订单号</th>
                    <th>设备</th>
                    <th>结果</th>
                    <th>操作</th>
                  </tr>
                </thead>
                <tbody>
                  {records.map((record) => (
                    <tr key={record.id}>
                      <td>{record.scannedAt}</td>
                      <td>{record.guestName}</td>
                      <td>{record.maskedIdNumber}</td>
                      <td>{`${record.roomType} / ${record.roomNo}`}</td>
                      <td>{record.orderNo}</td>
                      <td>{record.deviceName}</td>
                      <td>
                        <span className={`smart-id-reader-result smart-id-reader-result--${record.resultTone}`}>
                          {record.result}
                        </span>
                      </td>
                      <td>
                        <button
                          type="button"
                          className="smart-id-reader-link-button"
                          aria-label={`查看详情 ${record.guestName}`}
                          onClick={() => setSelectedRecord(record)}
                        >
                          查看详情
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}
        </section>
      </div>

      <section className="smart-id-reader-card smart-id-reader-card--quick-links">
        <div className="smart-id-reader-card__head">
          <h2>快捷入口</h2>
          <p>读卡完成后可直接联动门锁、公安对接、硬件商城与全局设置页面。</p>
        </div>
        <div className="smart-id-reader-quick-links">
          {(dashboard?.quickLinks ?? []).map((link) => (
            <button
              key={link.id}
              type="button"
              className="smart-id-reader-quick-link"
              onClick={() => navigate(link.path)}
            >
              <strong>{link.label}</strong>
              <span>{link.description}</span>
            </button>
          ))}
        </div>
      </section>

      <div className="smart-id-reader-feedback">
        <div role="status" aria-label="身份证读卡器操作反馈">
          {feedback}
        </div>
      </div>

      {selectedRecord ? (
        <RecordDetailDrawer
          record={selectedRecord}
          onClose={() => setSelectedRecord(null)}
        />
      ) : null}
    </div>
  )
}

function RecordDetailDrawer({
  record,
  onClose,
}: {
  record: SmartIdCardReaderRecord
  onClose: () => void
}) {
  return (
    <div className="smart-id-reader-drawer-backdrop" onMouseDown={onClose}>
      <aside
        className="smart-id-reader-drawer"
        role="dialog"
        aria-modal="true"
        aria-label="读卡记录详情"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header>
          <div>
            <strong>读卡记录详情</strong>
            <span>{record.guestName}</span>
          </div>
          <button type="button" aria-label="关闭读卡记录详情" onClick={onClose}>
            ×
          </button>
        </header>
        <dl>
          <div>
            <dt>订单号</dt>
            <dd>{record.orderNo}</dd>
          </div>
          <div>
            <dt>读卡时间</dt>
            <dd>{record.scannedAt}</dd>
          </div>
          <div>
            <dt>身份证号码</dt>
            <dd>{record.maskedIdNumber}</dd>
          </div>
          <div>
            <dt>房型 / 房号</dt>
            <dd>{`${record.roomType} / ${record.roomNo}`}</dd>
          </div>
          <div>
            <dt>设备</dt>
            <dd>{record.deviceName}</dd>
          </div>
          <div>
            <dt>处理备注</dt>
            <dd>{record.note}</dd>
          </div>
        </dl>
      </aside>
    </div>
  )
}
