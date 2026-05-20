import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  createCampInfoImportTask,
  fetchCampInfoDetail,
  fetchCampInfoOverview,
  fetchCampInfoSortData,
  saveCampInfoSort,
  type CampInfoDetail,
  type CampInfoOverview,
  type CampInfoSortData,
  type CampInfoSortTab,
} from '../services/campInfo'
import './CampInfoPage.css'

type LoadIntent = 'initial' | 'query' | 'reset' | 'retry'

const defaultQuery = { keyword: '', page: 1, pageSize: 20 }

export function CampInfoPage() {
  const location = useLocation()

  if (location.pathname.endsWith('/edit')) return <CampInfoEditPage />
  if (location.pathname.endsWith('/sort')) return <CampInfoSortPage />
  return <CampInfoListPage />
}

function CampInfoListPage() {
  const navigate = useNavigate()
  const [keyword, setKeyword] = useState(defaultQuery.keyword)
  const [appliedQuery, setAppliedQuery] = useState(defaultQuery)
  const [overview, setOverview] = useState<CampInfoOverview | null>(null)
  const [loadIntent, setLoadIntent] = useState<LoadIntent>('initial')
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')
  const [statusMessage, setStatusMessage] = useState('门店信息加载中')
  const [expandedStoreIds, setExpandedStoreIds] = useState<string[]>([])
  const [showImportDialog, setShowImportDialog] = useState(false)
  const [selectedImportOptionId, setSelectedImportOptionId] = useState('room-types')
  const [showNewStoreLimit, setShowNewStoreLimit] = useState(false)
  const [detailStoreId, setDetailStoreId] = useState('')
  const [detail, setDetail] = useState<CampInfoDetail | null>(null)
  const [detailError, setDetailError] = useState('')
  const [detailLoading, setDetailLoading] = useState(false)
  const [reloadSeed, setReloadSeed] = useState(0)

  useEffect(() => {
    const controller = new AbortController()

    fetchCampInfoOverview(appliedQuery, controller.signal)
      .then((nextOverview) => {
        setOverview(nextOverview)
        setExpandedStoreIds((current) => current.filter((item) => nextOverview.stores.some((store) => store.id === item)))
        setStatusMessage(resolveLoadMessage(loadIntent))
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return
        setErrorMessage(error instanceof Error ? error.message : '门店信息加载失败')
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false)
      })

    return () => controller.abort()
  }, [appliedQuery, loadIntent, reloadSeed])

  useEffect(() => {
    if (!detailStoreId) return
    const controller = new AbortController()
    fetchCampInfoDetail(detailStoreId, controller.signal)
      .then((nextDetail) => setDetail(nextDetail))
      .catch((error: unknown) => {
        if (controller.signal.aborted) return
        setDetailError(error instanceof Error ? error.message : '门店详情加载失败')
      })
      .finally(() => {
        if (!controller.signal.aborted) setDetailLoading(false)
      })

    return () => controller.abort()
  }, [detailStoreId])

  const contractPayload = overview
    ? {
        provider: overview.provider,
        endpoint: overview.endpoint,
        traceId: overview.traceId,
        timestamp: overview.timestamp,
        request: overview.request,
        observedEndpoints: overview.observedEndpoints,
        pagination: overview.pagination,
      }
    : null

  async function handleImportConfirm() {
    const result = await createCampInfoImportTask(selectedImportOptionId)
    setShowImportDialog(false)
    setStatusMessage(result.message)
  }

  function toggleExpanded(storeId: string) {
    setExpandedStoreIds((current) =>
      current.includes(storeId) ? current.filter((item) => item !== storeId) : [...current, storeId],
    )
  }

  return (
    <div className="camp-info-page">
      <section className="camp-info-toolbar">
        <div>
          <h1>门店信息</h1>
          <p>门店、房型、详情和排序统一由当前数据服务承接。</p>
        </div>
        <CampInfoStatus message={statusMessage} />
      </section>

      {contractPayload ? (
        <pre data-testid="camp-info-contract" className="camp-info-contract" hidden>
          {JSON.stringify(contractPayload)}
        </pre>
      ) : null}

      <section className="camp-info-query" aria-label="门店信息筛选">
        <label>
          <span>门店名称</span>
          <input
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
            placeholder="请输入门店名称"
            disabled={loading}
          />
        </label>
        <div className="camp-info-query__actions">
          <button
            type="button"
            className="is-primary"
            disabled={loading}
            onClick={() => {
              setLoading(true)
              setErrorMessage('')
              setStatusMessage('门店信息加载中')
              setLoadIntent('query')
              setAppliedQuery({ ...defaultQuery, keyword })
            }}
          >
            查 询
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={() => {
              setKeyword('')
              setLoading(true)
              setErrorMessage('')
              setStatusMessage('门店信息加载中')
              setLoadIntent('reset')
              setAppliedQuery(defaultQuery)
            }}
          >
            重 置
          </button>
        </div>
      </section>

      {errorMessage ? (
        <CampInfoErrorState
          message={errorMessage}
          onRetry={() => {
            setLoading(true)
            setErrorMessage('')
            setStatusMessage('门店信息加载中')
            setLoadIntent('retry')
            setReloadSeed((value) => value + 1)
          }}
        />
      ) : null}

      {!errorMessage ? (
        <>
          <section className="camp-info-summary">
            <div>
              <span>当前系统门店：</span>
              <strong>{overview?.summary.activeStoreText ?? '--/--'}</strong>
              <em>（{overview?.summary.effectivePeriod ?? '待刷新'}）</em>
            </div>
            <div className="camp-info-summary__actions">
              <button type="button" className="is-primary" disabled={loading} onClick={() => setShowNewStoreLimit(true)}>
                新建门店
              </button>
              <button type="button" className="is-primary" disabled={loading} onClick={() => setShowImportDialog(true)}>
                一键导入
              </button>
              <button
                type="button"
                className="is-primary"
                disabled={loading}
                onClick={() => navigate('/InformationMaintenance/campInfo/sort')}
              >
                门店排序
              </button>
            </div>
          </section>

          {loading ? <CampInfoLoadingState /> : null}

          {!loading && overview?.state === 'empty' ? (
            <section className="camp-info-empty" role="status" aria-label="门店信息空态">
              <h2>{overview.emptyMessage}</h2>
              <p>请调整筛选条件，或继续维护当前门店资料。</p>
            </section>
          ) : null}

          {!loading && overview?.state === 'success' ? (
            <>
              <section className="camp-info-table" role="table" aria-label="门店信息列表">
                <div className="camp-info-table__head" role="row">
                  <div role="columnheader" />
                  <div role="columnheader">门店名称</div>
                  <div role="columnheader">门店类型</div>
                  <div role="columnheader">图片</div>
                  <div role="columnheader">地址</div>
                  <div role="columnheader">上架房型数量</div>
                  <div role="columnheader">操作</div>
                </div>
                <div className="camp-info-table__body">
                  {overview.stores.map((store) => {
                    const expanded = expandedStoreIds.includes(store.id)
                    return (
                      <div key={store.id} className="camp-info-table__group">
                        <div className="camp-info-table__row" role="row">
                          <div role="cell">
                            <button
                              type="button"
                              className={expanded ? 'camp-info-expand is-open' : 'camp-info-expand'}
                              aria-label="展开门店房型"
                              aria-expanded={expanded}
                              onClick={() => toggleExpanded(store.id)}
                            >
                              {expanded ? '−' : '+'}
                            </button>
                          </div>
                          <div role="cell">
                            <strong>{store.name}</strong>
                            <small>{store.tagLine}</small>
                          </div>
                          <div role="cell">{store.typeLabel}</div>
                          <div role="cell">
                            <div className="camp-info-thumb" aria-label={store.coverLabel}>
                              预览
                            </div>
                          </div>
                          <div role="cell">{store.address}</div>
                          <div role="cell">{store.listedRoomTypeCount}</div>
                          <div role="cell" className="camp-info-actions">
                            <button
                              type="button"
                              onClick={() => {
                                setDetailLoading(true)
                                setDetailError('')
                                setDetail(null)
                                setDetailStoreId(store.id)
                              }}
                            >
                              详情
                            </button>
                            <button type="button" onClick={() => navigate('/InformationMaintenance/campInfo/edit')}>
                              编辑
                            </button>
                            <button type="button" onClick={() => setStatusMessage('当前门店已下架，待重新启用后恢复展示')}>
                              下架
                            </button>
                            <button
                              type="button"
                              className="is-danger"
                              onClick={() => setStatusMessage('删除操作已进入确认队列，请先处理门店关联房型')}
                            >
                              删除
                            </button>
                          </div>
                        </div>
                        {expanded ? (
                          <div className="camp-info-room-detail" role="rowgroup" aria-label="门店房型明细">
                            {store.roomTypes.map((room) => (
                              <article key={room.id} className="camp-info-room-row">
                                <div className={`camp-info-room-image camp-info-room-image--${room.imageKey}`} />
                                <div>
                                  <p>房型名称: {room.name}</p>
                                  <p>房间数量: {room.roomCount}</p>
                                </div>
                                <div>房间: {room.roomLabel}</div>
                                <div className="camp-info-room-actions">
                                  <button type="button" onClick={() => setStatusMessage(`已打开 ${room.name} 的房型修改入口`)}>
                                    修改
                                  </button>
                                  <button type="button" onClick={() => setStatusMessage(`已查看 ${room.name} 的房间清单`)}>
                                    房间
                                  </button>
                                  <button type="button" onClick={() => setStatusMessage(`${room.name} 已加入联动关房检查队列`)}>
                                    联动关房
                                  </button>
                                  <button
                                    type="button"
                                    className="is-danger"
                                    onClick={() => setStatusMessage(`${room.name} 删除前需要先处理在线售卖商品`)}
                                  >
                                    删除
                                  </button>
                                </div>
                              </article>
                            ))}
                          </div>
                        ) : null}
                      </div>
                    )
                  })}
                </div>
              </section>

              <footer className="camp-info-pagination">
                <span>
                  第 {(overview.pagination.page - 1) * overview.pagination.pageSize + 1}-{overview.pagination.total} 条/总共{' '}
                  {overview.pagination.total} 条
                </span>
                <button type="button" aria-current="page" onClick={() => setStatusMessage('当前已定位到第 1 页')}>
                  1
                </button>
                <button type="button" onClick={() => setStatusMessage('当前每页展示 20 条门店记录')}>
                  20 条/页
                </button>
              </footer>
            </>
          ) : null}
        </>
      ) : null}

      {showImportDialog && overview ? (
        <div className="camp-info-modal-backdrop">
          <section className="camp-info-limit-modal camp-info-import-modal" role="dialog" aria-modal="true" aria-label="一键导入">
            <h2>一键导入</h2>
            <p>导入门店基础资料，保持门店、房型与排序信息同步。</p>
            <div className="camp-info-import-options">
              {overview.importOptions.map((item) => (
                <label key={item.id} className={selectedImportOptionId === item.id ? 'is-active' : ''}>
                  <input
                    type="radio"
                    name="camp-info-import"
                    value={item.id}
                    checked={selectedImportOptionId === item.id}
                    onChange={() => setSelectedImportOptionId(item.id)}
                  />
                  <strong>{item.label}</strong>
                  <span>{item.description}</span>
                </label>
              ))}
            </div>
            <footer>
              <button type="button" onClick={() => setShowImportDialog(false)}>
                取消
              </button>
              <button type="button" className="is-primary" onClick={() => void handleImportConfirm()}>
                开始导入
              </button>
            </footer>
          </section>
        </div>
      ) : null}

      {showNewStoreLimit ? (
        <div className="camp-info-modal-backdrop">
          <section className="camp-info-limit-modal" role="dialog" aria-modal="true" aria-label="门店剩余数量不足">
            <h2>门店剩余数量不足</h2>
            <p>您当前门店数量已达到上限，无法新增，可扩容后重试</p>
            <footer>
              <button type="button" onClick={() => setShowNewStoreLimit(false)}>
                取消操作
              </button>
              <button
                type="button"
                className="is-primary"
                onClick={() => {
                  setShowNewStoreLimit(false)
                  setStatusMessage('扩容入口已打开，请继续处理门店数量扩容')
                }}
              >
                前往扩容
              </button>
            </footer>
          </section>
        </div>
      ) : null}

      {detailStoreId ? (
        <div className="camp-info-modal-backdrop">
          <section className="camp-info-detail-modal" role="dialog" aria-modal="true" aria-label="门店详情">
            <header>
              <div>
                <strong>门店详情</strong>
                <span>基础信息与房型展示统一由当前数据服务返回。</span>
              </div>
              <button
                type="button"
                aria-label="关闭门店详情"
                onClick={() => {
                  setDetailStoreId('')
                  setDetail(null)
                  setDetailError('')
                }}
              >
                ×
              </button>
            </header>
            {detailLoading ? <CampInfoLoadingState compact /> : null}
            {detailError ? <CampInfoErrorState message={detailError} onRetry={() => setDetailStoreId(detailStoreId)} compact /> : null}
            {detail ? (
              <div className="camp-info-detail-grid">
                <div>
                  <span>门店名称</span>
                  <strong>{detail.store.name}</strong>
                </div>
                <div>
                  <span>门店类型</span>
                  <strong>{detail.store.typeLabel}</strong>
                </div>
                <div>
                  <span>联系电话</span>
                  <strong>{detail.store.phone}</strong>
                </div>
                <div>
                  <span>所在城市</span>
                  <strong>{detail.cityPath}</strong>
                </div>
                <div className="is-wide">
                  <span>详细地址</span>
                  <strong>{detail.fullAddress}</strong>
                </div>
                <div className="is-wide">
                  <span>门店图片</span>
                  <strong>共 {detail.albumImageCount} 张，第一张作为封面展示。</strong>
                </div>
              </div>
            ) : null}
          </section>
        </div>
      ) : null}
    </div>
  )
}

function CampInfoEditPage() {
  const navigate = useNavigate()
  const [detail, setDetail] = useState<CampInfoDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')
  const [statusMessage, setStatusMessage] = useState('门店详情加载中')
  const [tagInput, setTagInput] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [step, setStep] = useState<'basic' | 'detail'>('basic')

  useEffect(() => {
    const controller = new AbortController()
    fetchCampInfoDetail('store-qianhai-001', controller.signal)
      .then((nextDetail) => {
        setDetail(nextDetail)
        setTags(nextDetail.store.tagLine.split('/').map((item) => item.trim()).filter(Boolean))
        setStatusMessage('门店详情已加载')
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return
        setErrorMessage(error instanceof Error ? error.message : '门店详情加载失败')
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false)
      })

    return () => controller.abort()
  }, [])

  return (
    <div className="camp-info-page camp-info-edit-page">
      <section className="camp-info-toolbar">
        <div>
          <h1>编辑</h1>
          <p>门店信息 / 编辑</p>
        </div>
        <CampInfoStatus message={statusMessage} />
      </section>

      <nav className="camp-info-steps" aria-label="门店信息步骤">
        <span className={step === 'basic' ? 'is-active' : ''}>
          <b>1</b>
          基本信息
        </span>
        <i />
        <span className={step === 'detail' ? 'is-active' : ''}>
          <b>2</b>
          详细介绍
        </span>
      </nav>

      {loading ? <CampInfoLoadingState /> : null}
      {errorMessage ? <CampInfoErrorState message={errorMessage} onRetry={() => navigate(0)} /> : null}

      {detail ? (
        <section className="camp-info-form-card">
          <pre data-testid="camp-info-detail-contract" className="camp-info-contract" hidden>
            {JSON.stringify({
              endpoint: detail.endpoint,
              provider: detail.provider,
              traceId: detail.traceId,
              timestamp: detail.timestamp,
            })}
          </pre>
          <div className="camp-info-form-grid">
            <label>
              <span>* 门店名称</span>
              <input aria-label="门店名称" value={detail.store.name} readOnly />
            </label>
            <label>
              <span>* 门店类型</span>
              <button type="button" className="camp-info-select" onClick={() => setStatusMessage('当前门店类型由门店资料统一维护')}>
                {detail.store.typeLabel}
              </button>
            </label>
            <label>
              <span>* 联系电话</span>
              <input aria-label="联系电话" value={detail.store.phone} readOnly />
            </label>
            <label className="camp-info-tag-row">
              <span>门店标签</span>
              <input value={tagInput} onChange={(event) => setTagInput(event.target.value)} placeholder="请输入门店标签" />
              <button
                type="button"
                onClick={() => {
                  if (!tagInput.trim()) {
                    setStatusMessage('请先输入门店标签再添加')
                    return
                  }
                  setTags((current) => [...current, tagInput.trim()])
                  setTagInput('')
                  setStatusMessage('门店标签已添加')
                }}
              >
                ＋ 添加门店标签
              </button>
            </label>
            <div className="camp-info-tags">
              {tags.map((item) => (
                <span key={item}>{item}</span>
              ))}
            </div>
            <div className="camp-info-upload-row">
              <span>* 门店图片</span>
              <div className="camp-info-photo-grid" aria-label="门店图片">
                {Array.from({ length: detail.albumImageCount }, (_, index) => (
                  <div key={index} className={`camp-info-photo camp-info-photo--${(index % 9) + 1}`} />
                ))}
                <button type="button" className="camp-info-upload-button" onClick={() => setStatusMessage('门店图片上传队列已创建')}>
                  ＋
                  <br />
                  上传
                </button>
              </div>
              <p>
                <em>第一张图片将会作为封面</em>
                <button type="button" onClick={() => setStatusMessage('图片顺序调整入口已打开')}>
                  调整图片顺序
                </button>
              </p>
            </div>
            <label>
              <span>* 所在城市</span>
              <button type="button" className="camp-info-select" onClick={() => setStatusMessage('城市信息来源于门店基础资料')}>
                {detail.cityPath}
              </button>
            </label>
            <label>
              <span>* 街道地址</span>
              <input value={detail.streetAddress} readOnly />
            </label>
            <label>
              <span>小区名称</span>
              <input value={detail.communityName} readOnly />
            </label>
            <label>
              <span>* 单元、门牌号</span>
              <input value={detail.unitNo} readOnly />
            </label>
            <label className="camp-info-address">
              <span>* 详细地址</span>
              <textarea value={detail.fullAddress} readOnly />
            </label>
            <div className="camp-info-map">
              <span>地图位置</span>
              <div className="camp-info-map__canvas">
                <button type="button" onClick={() => setStatusMessage('地图已放大查看')}>
                  +
                </button>
                <button type="button" onClick={() => setStatusMessage('地图已缩小查看')}>
                  −
                </button>
                <small>{detail.mapCopyright}</small>
              </div>
              <p>若地图自动获取坐标有误，请拖动图标至正确坐标</p>
            </div>
          </div>
        </section>
      ) : null}

      <footer className="camp-info-edit-footer">
        <button type="button" onClick={() => navigate('/InformationMaintenance/campInfo')}>
          取 消
        </button>
        <button
          type="button"
          className="is-primary"
          onClick={() => {
            setStep('detail')
            setStatusMessage('已进入详细介绍步骤')
          }}
        >
          下一步
        </button>
      </footer>
    </div>
  )
}

function CampInfoSortPage() {
  const [activeTab, setActiveTab] = useState<CampInfoSortTab>('store')
  const [data, setData] = useState<CampInfoSortData | null>(null)
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')
  const [statusMessage, setStatusMessage] = useState('门店排序加载中')
  const [reloadSeed, setReloadSeed] = useState(0)

  useEffect(() => {
    const controller = new AbortController()
    fetchCampInfoSortData(activeTab, controller.signal)
      .then((nextData) => {
        setData(nextData)
        setStatusMessage('排序数据已更新')
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return
        setErrorMessage(error instanceof Error ? error.message : '门店排序加载失败')
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false)
      })

    return () => controller.abort()
  }, [activeTab, reloadSeed])

  return (
    <div className="camp-info-page camp-info-sort-page">
      <section className="camp-info-toolbar">
        <div>
          <h1>门店排序</h1>
          <p>按业务展示顺序维护门店、房型和商品排序。</p>
        </div>
        <CampInfoStatus message={statusMessage} />
      </section>

      {data ? (
        <pre data-testid="camp-info-sort-contract" className="camp-info-contract" hidden>
          {JSON.stringify({
            endpoint: data.endpoint,
            provider: data.provider,
            traceId: data.traceId,
            timestamp: data.timestamp,
            activeTab: data.activeTab,
          })}
        </pre>
      ) : null}

      <div className="camp-info-sort-tabs" role="tablist" aria-label="排序类型">
        {[
          ['store', '门店排序'],
          ['roomType', '房型排序'],
          ['goods', '商品排序'],
        ].map(([key, label]) => (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={activeTab === key}
            onClick={() => {
              setLoading(true)
              setErrorMessage('')
              setStatusMessage('门店排序加载中')
              setActiveTab(key as CampInfoSortTab)
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {loading ? <CampInfoLoadingState compact /> : null}
      {errorMessage ? (
        <CampInfoErrorState
          message={errorMessage}
          onRetry={() => {
            setLoading(true)
            setErrorMessage('')
            setStatusMessage('门店排序加载中')
            setReloadSeed((value) => value + 1)
          }}
          compact
        />
      ) : null}

      {!loading && data ? (
        <>
          <p className="camp-info-sort-help">拖拽即可进行排序，选定排序方式之后，系统将按照下方顺序展示</p>
          <section
            className="camp-info-sort-list"
            aria-label={activeTab === 'store' ? '门店排序列表' : activeTab === 'roomType' ? '房型排序列表' : '商品排序列表'}
          >
            {data.items.map((item) => (
              <article key={item.id} className="camp-info-sort-item">
                <span className="camp-info-drag-handle">⋮⋮</span>
                <strong>{item.label}</strong>
              </article>
            ))}
          </section>
          <button
            type="button"
            className="camp-info-save-sort is-primary"
            onClick={async () => {
              const result = await saveCampInfoSort(activeTab, data.items.map((item) => item.id))
              setStatusMessage(result.message)
            }}
          >
            保存排序
          </button>
        </>
      ) : null}
    </div>
  )
}

function CampInfoStatus({ message }: { message: string }) {
  return message ? (
    <div role="status" aria-label="门店信息操作反馈" className="camp-info-status">
      {message}
    </div>
  ) : null
}

function CampInfoLoadingState({ compact = false }: { compact?: boolean }) {
  return (
    <section className={compact ? 'camp-info-loading is-compact' : 'camp-info-loading'} aria-live="polite">
      <div className="camp-info-loading__spinner" />
      <strong>门店信息加载中</strong>
      <p>正在同步当前门店资料、房型和排序信息。</p>
    </section>
  )
}

function CampInfoErrorState({
  message,
  onRetry,
  compact = false,
}: {
  message: string
  onRetry: () => void
  compact?: boolean
}) {
  return (
    <section className={compact ? 'camp-info-error is-compact' : 'camp-info-error'} role="alert">
      <strong>{message}</strong>
      <p>请重新加载当前门店信息，确认接口契约与数据状态后再继续操作。</p>
      <button type="button" className="is-primary" onClick={onRetry}>
        重新加载
      </button>
    </section>
  )
}

function resolveLoadMessage(intent: LoadIntent) {
  if (intent === 'query') return '已按当前条件更新门店信息'
  if (intent === 'reset') return '筛选条件已重置'
  return '门店信息已更新'
}
