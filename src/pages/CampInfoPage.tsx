import { useEffect, useRef, useState, type ChangeEvent } from 'react'
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import {
  createCampInfoImportTask,
  fetchCampInfoDetail,
  fetchCampInfoOverview,
  fetchCampInfoSortData,
  saveCampInfoDetail,
  saveCampInfoSort,
  type CampInfoDetail,
  type CampInfoOverview,
  type CampInfoRoomType,
  type CampInfoSortData,
  type CampInfoSortTab,
} from '../services/campInfo'
import { validateOptionalContactPhone } from '../utils/inputValidation'
import './CampInfoPage.css'

type LoadIntent = 'initial' | 'query' | 'reset' | 'retry'
type DetailTabKey = 'basic' | 'detail'
type CampInfoEditStep = 'basic' | 'detail'
type CampInfoEditFormState = {
  storeName: string
  typeLabel: string
  phone: string
  cityPath: string
  streetAddress: string
  communityName: string
  unitNo: string
  fullAddress: string
  plainIntro: string
  richIntro: string
}
type CampInfoUploadedPhoto = {
  id: string
  name: string
  mimeType: string
  size: number
  dataUrl: string
  uploadedAt: string
}
type CampInfoFormErrors = Partial<Record<'storeName' | 'phone', string>>

const defaultQuery = { keyword: '', page: 1, pageSize: 20 }
const CAMP_INFO_PHOTO_STORAGE_KEY = 'pms.campInfoUploadedPhotos'
const NEW_CAMP_INFO_STORE_ID = 'new-camp-info-store'
const campInfoTypeOptions = ['酒店', '公寓', '民宿']
const campInfoCityOptions = ['深圳市', '广州市', '上海市', '北京市']
const emptyCampInfoEditForm: CampInfoEditFormState = {
  storeName: '',
  typeLabel: '',
  phone: '',
  cityPath: '',
  streetAddress: '',
  communityName: '',
  unitNo: '',
  fullAddress: '',
  plainIntro: '',
  richIntro: '',
}

function createEmptyCampInfoDetail(storeId: string): CampInfoDetail {
  return {
    provider: 'mock',
    endpoint: 'camp-info-new-store-form',
    traceId: `mock-shezhi--xinxi-weihu--mendian-xinxi-new-${storeId}`,
    timestamp: new Date().toISOString(),
    store: {
      id: storeId,
      campId: storeId,
      name: '',
      typeLabel: '',
      coverLabel: '门店图片预览',
      address: '',
      cityLabel: '',
      phone: '',
      tagLine: '',
      listedRoomTypeCount: 0,
      roomTypes: [],
    },
    albumImageCount: 0,
    cityPath: '',
    streetAddress: '',
    communityName: '',
    unitNo: '',
    fullAddress: '',
    plainIntro: '',
    richIntro: '',
    mapCopyright: '© 2026 AutoNavi - GS(2023)4677号',
  }
}

function isCampInfoUploadedPhoto(value: unknown): value is CampInfoUploadedPhoto {
  if (!value || typeof value !== 'object') return false
  const photo = value as Partial<CampInfoUploadedPhoto>
  return (
    typeof photo.id === 'string' &&
    typeof photo.name === 'string' &&
    typeof photo.mimeType === 'string' &&
    typeof photo.size === 'number' &&
    typeof photo.dataUrl === 'string' &&
    photo.dataUrl.startsWith('data:image/') &&
    typeof photo.uploadedAt === 'string'
  )
}

function readCampInfoPhotoStore(): Record<string, CampInfoUploadedPhoto[]> {
  if (typeof window === 'undefined') return {}
  const rawValue = window.localStorage.getItem(CAMP_INFO_PHOTO_STORAGE_KEY)
  if (!rawValue) return {}
  try {
    const parsedValue = JSON.parse(rawValue) as Record<string, unknown>
    return Object.fromEntries(
      Object.entries(parsedValue)
        .filter((entry): entry is [string, unknown[]] => Array.isArray(entry[1]))
        .map(([storeId, photos]) => [storeId, photos.filter(isCampInfoUploadedPhoto)]),
    )
  } catch (error) {
    console.warn('Failed to read camp info uploaded photos from localStorage', error)
    return {}
  }
}

function readCampInfoUploadedPhotos(storeId: string): CampInfoUploadedPhoto[] {
  return readCampInfoPhotoStore()[storeId] ?? []
}

function writeCampInfoUploadedPhotos(storeId: string, photos: CampInfoUploadedPhoto[]) {
  if (typeof window === 'undefined') return
  const photoStore = readCampInfoPhotoStore()
  window.localStorage.setItem(
    CAMP_INFO_PHOTO_STORAGE_KEY,
    JSON.stringify({
      ...photoStore,
      [storeId]: photos,
    }),
  )
}

function readCampInfoUploadedCovers(storeIds: string[]): Record<string, CampInfoUploadedPhoto | undefined> {
  const photoStore = readCampInfoPhotoStore()
  return Object.fromEntries(storeIds.map((storeId) => [storeId, photoStore[storeId]?.[0]]))
}

function createCampInfoCoverPhoto(detail: CampInfoDetail): CampInfoUploadedPhoto | null {
  const coverImageDataUrl = detail.store.coverImageDataUrl
  if (!coverImageDataUrl?.startsWith('data:image/')) return null
  return {
    id: `${detail.store.id}-backend-cover`,
    name: `${detail.store.name || '门店'}封面`,
    mimeType: coverImageDataUrl.slice(5, coverImageDataUrl.indexOf(';')) || 'image/*',
    size: coverImageDataUrl.length,
    dataUrl: coverImageDataUrl,
    uploadedAt: detail.timestamp,
  }
}

function resolveCampInfoUploadedPhotos(storeId: string, detail?: CampInfoDetail): CampInfoUploadedPhoto[] {
  const localPhotos = readCampInfoUploadedPhotos(storeId)
  const coverPhoto = detail ? createCampInfoCoverPhoto(detail) : null
  if (!coverPhoto) return localPhotos
  if (localPhotos.some((photo) => photo.dataUrl === coverPhoto.dataUrl)) return localPhotos
  return [coverPhoto, ...localPhotos]
}

function createCampInfoPhotoId(file: File, index: number) {
  return `${Date.now()}-${index}-${file.name.replace(/\W+/g, '-')}`
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.addEventListener('load', () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result)
        return
      }
      reject(new Error('图片读取失败'))
    })
    reader.addEventListener('error', () => reject(new Error('图片读取失败')))
    reader.readAsDataURL(file)
  })
}

function CampInfoRoomImage({ room }: { room: CampInfoRoomType }) {
  if (room.imageUrl) {
    return <img className="camp-info-room-image" src={room.imageUrl} alt={`${room.name}房型图片`} />
  }
  if (room.imageKey.startsWith('api-')) {
    return (
      <div className="camp-info-room-image camp-info-room-image--empty" aria-label={`${room.name}暂无图片`}>
        暂无图片
      </div>
    )
  }
  return <div className={`camp-info-room-image camp-info-room-image--${room.imageKey}`} aria-label={`${room.name}房型图片`} />
}

export function CampInfoPage() {
  const location = useLocation()

  if (location.pathname.endsWith('/detail')) return <CampInfoDetailPage />
  if (location.pathname.endsWith('/edit') || location.pathname.endsWith('/new')) return <CampInfoEditPage />
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
  const [, setStatusMessage] = useState('门店信息加载中')
  const [expandedStoreIds, setExpandedStoreIds] = useState<string[]>([])
  const [showImportDialog, setShowImportDialog] = useState(false)
  const [selectedImportOptionId, setSelectedImportOptionId] = useState('room-types')
  const [reloadSeed, setReloadSeed] = useState(0)
  const [uploadedCovers, setUploadedCovers] = useState<Record<string, CampInfoUploadedPhoto | undefined>>({})

  useEffect(() => {
    const controller = new AbortController()

    fetchCampInfoOverview(appliedQuery, controller.signal)
      .then((nextOverview) => {
        setOverview(nextOverview)
        setExpandedStoreIds((current) => current.filter((item) => nextOverview.stores.some((store) => store.id === item)))
        setUploadedCovers(readCampInfoUploadedCovers(nextOverview.stores.map((store) => store.id)))
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
              <button
                type="button"
                className="is-primary"
                disabled={loading}
                onClick={() => navigate('/InformationMaintenance/campInfo/new')}
              >
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
                    const uploadedCover = uploadedCovers[store.id]
                    const coverDataUrl = store.coverImageDataUrl ?? uploadedCover?.dataUrl
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
                            {coverDataUrl ? (
                              <img className="camp-info-thumb" src={coverDataUrl} alt={`${store.name}封面`} />
                            ) : (
                              <div className="camp-info-thumb is-empty" aria-label={store.coverLabel}>
                                暂无图片
                              </div>
                            )}
                          </div>
                          <div role="cell">{store.address}</div>
                          <div role="cell">{store.listedRoomTypeCount}</div>
                          <div role="cell" className="camp-info-actions">
                            <button
                              type="button"
                              onClick={() => navigate(`/InformationMaintenance/campInfo/detail?storeId=${store.id}`)}
                            >
                              详情
                            </button>
                            <button
                              type="button"
                              onClick={() => navigate(`/InformationMaintenance/campInfo/edit?storeId=${store.id}`)}
                            >
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
                                <CampInfoRoomImage room={room} />
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

    </div>
  )
}

function CampInfoDetailPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const storeId = searchParams.get('storeId') ?? 'store-qianhai-001'
  const [detail, setDetail] = useState<CampInfoDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')
  const [activeTab, setActiveTab] = useState<DetailTabKey>('basic')
  const [reloadSeed, setReloadSeed] = useState(0)
  const [uploadedPhotos, setUploadedPhotos] = useState<CampInfoUploadedPhoto[]>([])

  useEffect(() => {
    const controller = new AbortController()
    setLoading(true)
    setErrorMessage('')
    setDetail(null)
    setUploadedPhotos([])

    fetchCampInfoDetail(storeId, controller.signal)
      .then((nextDetail) => {
        setDetail(nextDetail)
        setUploadedPhotos(resolveCampInfoUploadedPhotos(storeId, nextDetail))
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return
        setErrorMessage(error instanceof Error ? error.message : '门店详情加载失败')
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false)
      })

    return () => controller.abort()
  }, [reloadSeed, storeId])

  const tags = detail?.store.tagLine.split('/').map((item) => item.trim()).filter(Boolean) ?? []

  return (
    <div className="camp-info-page camp-info-detail-page">
      <div className="camp-info-detail-breadcrumb" aria-label="门店信息路径">
        <button type="button" onClick={() => navigate('/InformationMaintenance/campInfo')}>
          门店信息
        </button>
        <span>/</span>
        <strong>详情</strong>
      </div>

      <section className="camp-info-detail-shell">
        <div className="camp-info-detail-shell__header">
          <div className="camp-info-detail-tabs" role="tablist" aria-label="门店详情页签">
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'basic'}
              className={activeTab === 'basic' ? 'is-active' : ''}
              onClick={() => setActiveTab('basic')}
            >
              基础信息
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'detail'}
              className={activeTab === 'detail' ? 'is-active' : ''}
              onClick={() => setActiveTab('detail')}
            >
              详细信息
            </button>
          </div>
          <button
            type="button"
            className="is-primary camp-info-detail-edit"
            onClick={() => navigate(`/InformationMaintenance/campInfo/edit?storeId=${storeId}`)}
          >
            编辑
          </button>
        </div>

        {loading ? <CampInfoLoadingState /> : null}
        {errorMessage ? (
          <CampInfoErrorState
            message={errorMessage}
            onRetry={() => {
              setReloadSeed((value) => value + 1)
            }}
          />
        ) : null}

        {!loading && detail ? (
          <div className="camp-info-detail-content">
            <div className="camp-info-detail-title">
              <h1>{detail.store.name}</h1>
              <p>门店资料与房型信息统一按当前服务返回结果展示，字段按目标页布局重新对齐。</p>
            </div>

            {activeTab === 'basic' ? (
              <>
                <section className="camp-info-detail-facts" aria-label="门店基础信息">
                  <article className="camp-info-detail-field">
                    <span>门店类型</span>
                    <strong>{detail.store.typeLabel}</strong>
                  </article>
                  <article className="camp-info-detail-field">
                    <span>联系电话</span>
                    <strong>{detail.store.phone}</strong>
                  </article>
                  <article className="camp-info-detail-field">
                    <span>所在城市</span>
                    <strong>{detail.cityPath}</strong>
                  </article>
                  <article className="camp-info-detail-field">
                    <span>门店标签</span>
                    <div className="camp-info-detail-tags" aria-label="门店标签列表">
                      {tags.map((item) => (
                        <b key={item}>{item}</b>
                      ))}
                    </div>
                  </article>
                  <article className="camp-info-detail-field is-wide">
                    <span>详细地址</span>
                    <strong>{detail.fullAddress}</strong>
                  </article>
                  <article className="camp-info-detail-field is-wide">
                    <span>门店图片</span>
                    <div className="camp-info-detail-photo-grid" aria-label="门店图片">
                      {uploadedPhotos.length > 0 ? (
                        uploadedPhotos.map((photo, index) => (
                          <img
                            key={photo.id}
                            className="camp-info-photo"
                            src={photo.dataUrl}
                            alt={`${photo.name}${index === 0 ? ' 封面' : ''}`}
                          />
                        ))
                      ) : (
                        <div className="camp-info-photo-empty">暂无图片</div>
                      )}
                    </div>
                  </article>
                </section>

                <section className="camp-info-detail-map-card" aria-label="门店地图">
                  <div className="camp-info-detail-map-card__header">
                    <strong>地图位置</strong>
                    <span>{detail.mapCopyright}</span>
                  </div>
                  <div className="camp-info-detail-map">
                    <div className="camp-info-detail-map__marker" />
                  </div>
                </section>
              </>
            ) : (
              <section className="camp-info-detail-panel" aria-label="门店详细信息">
                <article className="camp-info-detail-note">
                  <span>门店介绍</span>
                  <p>{detail.store.name} 当前已同步 {detail.store.listedRoomTypeCount} 个上架房型，已上传门店图片 {uploadedPhotos.length} 张，标签与城市信息可直接用于 OTA 渠道展示。</p>
                </article>
                <article className="camp-info-detail-note">
                  <span>地址拆分</span>
                  <p>
                    街道地址：{detail.streetAddress}
                    <br />
                    小区名称：{detail.communityName}
                    <br />
                    单元门牌：{detail.unitNo}
                  </p>
                </article>
                <section className="camp-info-detail-room-list" aria-label="房型概览">
                  {detail.store.roomTypes.map((room) => (
                    <article key={room.id} className="camp-info-detail-room-card">
                      <CampInfoRoomImage room={room} />
                      <div>
                        <strong>{room.name}</strong>
                        <p>房间数量：{room.roomCount}</p>
                        <p>{room.roomLabel}</p>
                      </div>
                    </article>
                  ))}
                </section>
              </section>
            )}
          </div>
        ) : null}
      </section>
    </div>
  )
}

function CampInfoEditPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const [newStoreDraftId] = useState(() => `${NEW_CAMP_INFO_STORE_ID}-${Date.now()}`)
  const isNewStore = location.pathname.endsWith('/new')
  const storeId = isNewStore ? newStoreDraftId : searchParams.get('storeId') ?? 'store-qianhai-001'
  const [detail, setDetail] = useState<CampInfoDetail | null>(null)
  const [form, setForm] = useState<CampInfoEditFormState | null>(null)
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')
  const [tagInput, setTagInput] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [uploadedPhotos, setUploadedPhotos] = useState<CampInfoUploadedPhoto[]>([])
  const [mapZoom, setMapZoom] = useState(12)
  const [step, setStep] = useState<CampInfoEditStep>('basic')
  const [saving, setSaving] = useState(false)
  const [formErrors, setFormErrors] = useState<CampInfoFormErrors>({})
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    setLoading(true)
    setErrorMessage('')
    setDetail(null)
    setForm(null)
    setTagInput('')
    setTags([])
    setUploadedPhotos([])
    setMapZoom(12)
    setStep('basic')
    setSaving(false)
    setFormErrors({})

    if (isNewStore) {
      const nextDetail = createEmptyCampInfoDetail(storeId)
      setDetail(nextDetail)
      setForm({ ...emptyCampInfoEditForm })
      setUploadedPhotos(resolveCampInfoUploadedPhotos(storeId, nextDetail))
      setLoading(false)
      return
    }

    const controller = new AbortController()
    fetchCampInfoDetail(storeId, controller.signal)
      .then((nextDetail) => {
        setDetail(nextDetail)
        setForm({
          storeName: nextDetail.store.name,
          typeLabel: nextDetail.store.typeLabel,
          phone: nextDetail.store.phone,
          cityPath: nextDetail.cityPath,
          streetAddress: nextDetail.streetAddress,
          communityName: nextDetail.communityName,
          unitNo: nextDetail.unitNo,
          fullAddress: nextDetail.fullAddress,
          plainIntro: nextDetail.plainIntro,
          richIntro: nextDetail.richIntro,
        })
        setTags(nextDetail.store.tagLine.split('/').map((item) => item.trim()).filter(Boolean))
        setUploadedPhotos(resolveCampInfoUploadedPhotos(storeId, nextDetail))
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return
        setErrorMessage(error instanceof Error ? error.message : '门店详情加载失败')
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false)
      })

    return () => controller.abort()
  }, [isNewStore, storeId])

  function updateForm<K extends keyof CampInfoEditFormState>(field: K, value: CampInfoEditFormState[K]) {
    setForm((current) => (current ? { ...current, [field]: value } : current))
    setFormErrors((current) => {
      if (field !== 'storeName' && field !== 'phone') return current
      return { ...current, [field]: undefined }
    })
  }

  function validateBasicInfo() {
    if (!form) return false
    const nextErrors: CampInfoFormErrors = {}
    if (!form.storeName.trim()) nextErrors.storeName = '门店名称不能为空'
    const phoneError = validateOptionalContactPhone(form.phone)
    if (phoneError) nextErrors.phone = phoneError
    setFormErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) {
      setErrorMessage('')
      return false
    }
    return true
  }

  function addTag() {
    const nextTag = tagInput.trim()
    if (!nextTag || tags.includes(nextTag)) return
    setTags((current) => [...current, nextTag])
    setTagInput('')
  }

  function persistPhotos(nextPhotos: CampInfoUploadedPhoto[]) {
    setUploadedPhotos(nextPhotos)
    writeCampInfoUploadedPhotos(storeId, nextPhotos)
  }

  async function handlePhotoUpload(event: ChangeEvent<HTMLInputElement>) {
    const selectedFiles = Array.from(event.currentTarget.files ?? [])
    event.currentTarget.value = ''
    const imageFiles = selectedFiles.filter((file) => file.type.startsWith('image/'))
    if (imageFiles.length === 0) return

    try {
      const nextPhotos = await Promise.all(
        imageFiles.map(async (file, index) => ({
          id: createCampInfoPhotoId(file, index),
          name: file.name,
          mimeType: file.type,
          size: file.size,
          dataUrl: await readFileAsDataUrl(file),
          uploadedAt: new Date().toISOString(),
        })),
      )
      setUploadedPhotos((current) => {
        const mergedPhotos = [...current, ...nextPhotos]
        writeCampInfoUploadedPhotos(storeId, mergedPhotos)
        return mergedPhotos
      })
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : '图片读取失败')
    }
  }

  function removePhoto(photoId: string) {
    persistPhotos(uploadedPhotos.filter((photo) => photo.id !== photoId))
  }

  function reversePhotos() {
    persistPhotos([...uploadedPhotos].reverse())
  }

  async function handleSaveAndExit() {
    if (!detail || !form) return
    if (!validateBasicInfo()) {
      setStep('basic')
      return
    }
    const storeName = form.storeName.trim()

    setSaving(true)
    setErrorMessage('')
    try {
      await saveCampInfoDetail({
        storeId,
        campId: isNewStore ? undefined : detail.store.campId,
        poiId: isNewStore ? undefined : storeId,
        campName: storeName,
        name: storeName,
        typeName: form.typeLabel,
        campTypeName: form.typeLabel,
        phone: form.phone,
        contactNumber: form.phone,
        cityName: form.cityPath,
        cityPath: form.cityPath,
        address: form.fullAddress,
        streetAddress: form.streetAddress,
        communityName: form.communityName,
        unitNo: form.unitNo,
        fullAddress: form.fullAddress,
        tags,
        plainIntro: form.plainIntro,
        richIntro: form.richIntro,
        coverImageDataUrl: uploadedPhotos[0]?.dataUrl,
        photoCount: uploadedPhotos.length,
      })
      navigate('/InformationMaintenance/campInfo')
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : '门店信息保存失败')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="camp-info-page camp-info-edit-page">
      <div className="camp-info-edit-breadcrumb" aria-label="门店信息路径">
        <button type="button" disabled={saving} onClick={() => navigate('/InformationMaintenance/campInfo')}>
          门店信息
        </button>
        <span>/</span>
        <strong>{isNewStore ? '新建门店' : '编辑'}</strong>
      </div>

      <nav className="camp-info-edit-steps" aria-label="门店信息步骤">
        <span className={`camp-info-step ${step === 'basic' ? 'is-active' : 'is-complete'}`}>
          <b>{step === 'detail' ? '✓' : '1'}</b>
          基本信息
        </span>
        <i />
        <span className={`camp-info-step ${step === 'detail' ? 'is-active' : ''}`}>
          <b>2</b>
          详细介绍
        </span>
      </nav>

      {loading ? <CampInfoLoadingState /> : null}
      {errorMessage ? <CampInfoErrorState message={errorMessage} onRetry={() => navigate(0)} /> : null}

      {detail && form ? (
        <>
          <pre data-testid="camp-info-detail-contract" className="camp-info-contract" hidden>
            {JSON.stringify({
              endpoint: detail.endpoint,
              provider: detail.provider,
              traceId: detail.traceId,
              timestamp: detail.timestamp,
            })}
          </pre>

          {step === 'basic' ? (
            <section className="camp-info-form-card camp-info-edit-basic" aria-label="基本信息">
              <div className="camp-info-edit-form">
                <label className="camp-info-edit-row">
                  <span>* 门店名称:</span>
                  <div className="camp-info-edit-field">
                    <input
                      aria-label="门店名称"
                      value={form.storeName}
                      onChange={(event) => updateForm('storeName', event.target.value)}
                    />
                    {formErrors.storeName ? <small className="camp-info-field-error">{formErrors.storeName}</small> : null}
                  </div>
                </label>
                <label className="camp-info-edit-row">
                  <span>* 门店类型:</span>
                  <select
                    aria-label="门店类型"
                    value={form.typeLabel}
                    onChange={(event) => updateForm('typeLabel', event.target.value)}
                  >
                    <option value="">请选择</option>
                    {campInfoTypeOptions.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="camp-info-edit-row">
                  <span>* 联系电话:</span>
                  <div className="camp-info-edit-field">
                    <input
                      aria-label="联系电话"
                      value={form.phone}
                      onChange={(event) => updateForm('phone', event.target.value)}
                    />
                    {formErrors.phone ? <small className="camp-info-field-error">{formErrors.phone}</small> : null}
                  </div>
                </label>
                <div className="camp-info-edit-row camp-info-edit-tag-row">
                  <span>门店标签:</span>
                  <input
                    value={tagInput}
                    onChange={(event) => setTagInput(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') {
                        event.preventDefault()
                        addTag()
                      }
                    }}
                    placeholder="请输入门店标签"
                  />
                  <button type="button" onClick={addTag}>
                    + 添加门店标签
                  </button>
                  <div className="camp-info-tags" aria-label="门店标签列表">
                    {tags.map((item) => (
                      <button
                        key={item}
                        type="button"
                        onClick={() => setTags((current) => current.filter((tag) => tag !== item))}
                        title="点击移除标签"
                      >
                        {item}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="camp-info-edit-row camp-info-edit-photo-row">
                  <span>* 门店图片:</span>
                  <div className="camp-info-edit-photo-grid" aria-label="门店图片">
                    {uploadedPhotos.length > 0 ? (
                      uploadedPhotos.map((photo, index) => (
                        <figure key={photo.id} className="camp-info-photo-item">
                          <img
                            className="camp-info-photo"
                            src={photo.dataUrl}
                            alt={`${photo.name}${index === 0 ? ' 封面' : ''}`}
                          />
                          {index === 0 ? <span>封面</span> : null}
                          <button type="button" aria-label={`删除${photo.name}`} onClick={() => removePhoto(photo.id)}>
                            ×
                          </button>
                        </figure>
                      ))
                    ) : (
                      <div className="camp-info-photo-empty">暂无图片</div>
                    )}
                    <input
                      ref={fileInputRef}
                      type="file"
                      className="camp-info-upload-input"
                      accept="image/*"
                      multiple
                      aria-label="上传门店图片"
                      onChange={(event) => void handlePhotoUpload(event)}
                    />
                    <button
                      type="button"
                      className="camp-info-upload-button"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      +
                      <span>上传</span>
                    </button>
                  </div>
                  <p>
                    <em>第一张图片将会作为封面</em>
                    <button type="button" disabled={uploadedPhotos.length < 2} onClick={reversePhotos}>
                      调整图片顺序
                    </button>
                  </p>
                </div>
                <label className="camp-info-edit-row">
                  <span>* 所在城市:</span>
                  <select
                    aria-label="所在城市"
                    value={form.cityPath}
                    onChange={(event) => updateForm('cityPath', event.target.value)}
                  >
                    <option value="">请选择</option>
                    {[form.cityPath, ...campInfoCityOptions]
                      .map((item) => item.trim())
                      .filter(Boolean)
                      .filter((item, index, list) => list.indexOf(item) === index)
                      .map((item) => (
                        <option key={item} value={item}>
                          {item}
                        </option>
                      ))}
                  </select>
                </label>
                <label className="camp-info-edit-row">
                  <span>* 街道地址:</span>
                  <input value={form.streetAddress} onChange={(event) => updateForm('streetAddress', event.target.value)} />
                </label>
                <label className="camp-info-edit-row">
                  <span>小区名称:</span>
                  <input value={form.communityName} onChange={(event) => updateForm('communityName', event.target.value)} />
                </label>
                <label className="camp-info-edit-row">
                  <span>* 单元、门牌号:</span>
                  <input value={form.unitNo} onChange={(event) => updateForm('unitNo', event.target.value)} />
                </label>
                <label className="camp-info-edit-row camp-info-address">
                  <span>* 详细地址:</span>
                  <textarea value={form.fullAddress} onChange={(event) => updateForm('fullAddress', event.target.value)} />
                </label>
                <div className="camp-info-edit-row camp-info-map">
                  <span>地图位置:</span>
                  <div className="camp-info-map__canvas" aria-label="地图位置预览">
                    <button type="button" aria-label="放大地图" onClick={() => setMapZoom((value) => Math.min(value + 1, 18))}>
                      +
                    </button>
                    <button type="button" aria-label="缩小地图" onClick={() => setMapZoom((value) => Math.max(value - 1, 3))}>
                      −
                    </button>
                    <div className="camp-info-map__marker" />
                    <small>{detail.mapCopyright} · zoom {mapZoom}</small>
                  </div>
                  <p>若地图自动获取坐标有误，请拖动图标至正确坐标</p>
                </div>
              </div>
            </section>
          ) : (
            <section className="camp-info-form-card camp-info-edit-detail" aria-label="详细介绍">
              <div className="camp-info-edit-form camp-info-edit-form--detail">
                <label className="camp-info-edit-row camp-info-edit-text-row">
                  <span>文字介绍:</span>
                  <textarea
                    aria-label="文字介绍"
                    value={form.plainIntro}
                    onChange={(event) => updateForm('plainIntro', event.target.value)}
                    placeholder="请输入文字介绍"
                  />
                </label>
                <div className="camp-info-edit-row camp-info-rich-row">
                  <span>图文介绍:</span>
                  <div className="camp-info-rich-editor">
                    <div className="camp-info-rich-editor__toolbar" aria-label="图文介绍工具栏">
                      {['H', 'B', 'I', 'U', 'S'].map((item) => (
                        <button key={item} type="button" aria-label={`格式 ${item}`}>
                          {item}
                        </button>
                      ))}
                      <select aria-label="字号">
                        <option>字号</option>
                      </select>
                      <select aria-label="行高">
                        <option>行高</option>
                      </select>
                      {['≡', '☰', '↶', '↷', 'Link', 'Img'].map((item, index) => (
                        <button key={`${item}-${index}`} type="button" aria-label={`编辑工具 ${index + 1}`}>
                          {item}
                        </button>
                      ))}
                      <button type="button" className="camp-info-rich-editor__preview">
                        预览
                      </button>
                    </div>
                    <textarea
                      aria-label="图文介绍"
                      value={form.richIntro}
                      onChange={(event) => updateForm('richIntro', event.target.value)}
                      placeholder="请输入正文"
                    />
                  </div>
                </div>
              </div>
            </section>
          )}
        </>
      ) : null}

      {detail && form ? (
        <footer className="camp-info-edit-footer">
          {step === 'basic' ? (
            <>
              <button type="button" disabled={saving} onClick={() => navigate('/InformationMaintenance/campInfo')}>
                取 消
              </button>
              <button type="button" className="is-primary" disabled={saving} onClick={() => validateBasicInfo() && setStep('detail')}>
                下一步
              </button>
            </>
          ) : (
            <>
              <button type="button" disabled={saving} onClick={() => setStep('basic')}>
                上一步
              </button>
              <button type="button" className="is-primary" disabled={saving} onClick={() => void handleSaveAndExit()}>
                {saving ? '保存中...' : '保存并退出'}
              </button>
            </>
          )}
        </footer>
      ) : null}
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
