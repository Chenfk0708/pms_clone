import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  createDefaultPsbPoliceFilters,
  fetchPsbPolicePageData,
  PSB_SYSTEM_NAME,
  submitPsbPoliceRegistration,
  type PsbPolicePageData,
  type PsbPoliceRow,
  type PsbPoliceSubmissionInput,
} from '../services/psbPolice'
import { validateCredentialNumber, validatePersonName } from '../utils/inputValidation'
import './PsbPolicePage.css'

const tableColumns = [
  '登记系统/机构',
  '酒店旅业编码/ID',
  '类型',
  '商户名称',
  '关联门店',
  '关联房间数',
  '操作',
]

const addFormFields = [
  { label: '商户名称', placeholder: '请输入商户名称' },
  { label: '选择门店', placeholder: '请选择门店', kind: 'select' },
  { label: '旅业经营名称', placeholder: '请输入旅业经营名称' },
  { label: '旅业编码', placeholder: '请输入旅业编码' },
  { label: '社会信用代码', placeholder: '请输入社会信用代码' },
  { label: '旅业经营地址', placeholder: '请输入旅业经营地址' },
  { label: '行政区划码', placeholder: '请输入行政区划码' },
  { label: '旅业申请的注册码', placeholder: '请输入旅业申请的注册码' },
  { label: '旅馆编码', placeholder: '请输入旅馆编码' },
  { label: 'accessKeyId', placeholder: '请输入accessKeyId' },
  { label: '设备处理业务公钥', placeholder: '请输入设备处理业务公钥', kind: 'textarea' },
  { label: '设备处理业务私钥', placeholder: '请输入设备处理业务私钥', kind: 'textarea' },
  { label: '登记人姓名', placeholder: '请输入登记人姓名' },
  { label: '登记人证件号码', placeholder: '请输入登记人证件号码' },
]

export function PsbPolicePage() {
  const location = useLocation()
  const navigate = useNavigate()
  const [pageData, setPageData] = useState<PsbPolicePageData | null>(null)
  const [rows, setRows] = useState<PsbPoliceRow[]>([])
  const [total, setTotal] = useState(0)
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')
  const [feedback, setFeedback] = useState('公安登记数据加载中')
  const [detailRow, setDetailRow] = useState<PsbPoliceRow | null>(null)
  const [pendingDeleteRow, setPendingDeleteRow] = useState<PsbPoliceRow | null>(null)

  useEffect(() => {
    const controller = new AbortController()
    const filters = createDefaultPsbPoliceFilters(new URLSearchParams(location.search))

    void fetchPsbPolicePageData(filters, controller.signal)
      .then((result) => {
        setPageData(result)
        setRows(result.rows)
        setTotal(result.pagination.total)
        setFeedback('公安登记数据已加载')
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === 'AbortError') return
        setPageData(null)
        setRows([])
        setTotal(0)
        const nextMessage =
          error instanceof Error
            ? error.message
            : 'PSB公安对接列表加载失败，请稍后重试'
        setErrorMessage(nextMessage)
        setFeedback(nextMessage)
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setIsLoading(false)
        }
      })

    return () => controller.abort()
  }, [location.search])

  function closeDialog() {
    setIsAddOpen(false)
  }

  function handleOpenDialog() {
    if (isLoading || errorMessage || !pageData) return
    setIsAddOpen(true)
  }

  function handleRetry() {
    setPageData(null)
    setRows([])
    setTotal(0)
    setErrorMessage('')
    setFeedback('公安登记数据加载中')
    setIsLoading(true)
    navigate('/psb/list', { replace: true })
  }

  function handleDeleteRow(rowId: string) {
    setRows((current) => {
      const nextRows = current.filter((row) => row.id !== rowId)
      setTotal(nextRows.length)
      if (detailRow?.id === rowId) {
        setDetailRow(null)
      }
      setFeedback('PSB公安对接商户已删除')
      return nextRows
    })
  }

  return (
    <div
      className="psb-page"
      data-provider={pageData?.provider ?? 'mock'}
      data-empty={rows.length === 0 ? 'true' : 'false'}
    >
      <h1 className="sr-only-heading">PSB公安对接</h1>
      <span className="psb-version">版本号：v4.10.7</span>

      <section className="psb-panel" aria-label="公安登记">
        <header className="psb-panel__head">
          <div>
            <h2>公安登记</h2>
            <p>入住客人登记的信息同步到当地合法监管部门</p>
          </div>
          <button
            type="button"
            className="psb-primary-button"
            onClick={handleOpenDialog}
            disabled={isLoading || Boolean(errorMessage)}
          >
            新 增
          </button>
        </header>

        <div className="psb-statusbar">
          <span role="status" aria-label="PSB公安对接操作反馈">
            {feedback}
          </span>
          <span className="psb-statusbar__meta">共 {total} 条登记记录</span>
        </div>

        {isLoading ? <div className="psb-loading">正在加载公安登记数据</div> : null}

        {errorMessage ? (
          <div className="psb-error" role="alert" aria-label="PSB公安对接加载失败">
            <div>
              <strong>PSB公安对接加载失败</strong>
              <span>{errorMessage}</span>
            </div>
            <button type="button" onClick={handleRetry}>
              重新加载
            </button>
          </div>
        ) : null}

        <div className="psb-table" role="table" aria-label="公安登记列表">
          <div className="psb-table__head" role="row">
            {tableColumns.map((column) => (
              <div key={column} role="columnheader">
                {column}
              </div>
            ))}
          </div>

          {!isLoading && !errorMessage && rows.length === 0 ? (
            <div className="psb-table__empty" role="row">
              <div role="cell" aria-colspan={tableColumns.length}>
                <span className="psb-empty-icon" aria-hidden="true" />
                <strong>暂无数据</strong>
              </div>
            </div>
          ) : null}

          {!isLoading && !errorMessage && rows.length > 0 ? (
            <div className="psb-table__body" role="rowgroup">
              {rows.map((row) => (
                <div key={row.id} className="psb-table__row" role="row">
                  <div role="cell">{row.systemName}</div>
                  <div role="cell">{row.hotelCode}</div>
                  <div role="cell">{row.typeLabel}</div>
                  <div role="cell">{row.merchantName}</div>
                  <div role="cell">{row.storeName}</div>
                  <div role="cell">{row.roomCount}</div>
                  <div role="cell" className="psb-table__actions">
                    <button type="button" onClick={() => setDetailRow(row)}>
                      查看
                    </button>
                    <button type="button" onClick={() => setPendingDeleteRow(row)}>
                      删除
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : null}
        </div>

        {pageData ? (
          <div className="sr-only-heading" aria-label="PSB公安对接数据服务">
            {pageData.requestSummary.join(' | ')}
          </div>
        ) : null}
      </section>

      {isAddOpen && pageData ? (
        <AddPsbDialog
          stores={pageData.stores}
          roomCount={pageData.roomCategories.reduce((sum, item) => sum + item.roomCount, 0)}
          filters={createDefaultPsbPoliceFilters(new URLSearchParams(location.search))}
          onClose={closeDialog}
          onSubmitSuccess={(result) => {
            setRows((current) => [result.createdRow, ...current])
            setTotal((current) => current + 1)
            setFeedback(result.feedbackMessage)
            setIsAddOpen(false)
          }}
        />
      ) : null}

      {detailRow ? (
        <div className="psb-modal-backdrop">
          <section className="psb-detail-modal" role="dialog" aria-modal="true" aria-labelledby="psb-detail-title">
            <header className="psb-modal__head">
              <h2 id="psb-detail-title">公安登记详情</h2>
              <button type="button" aria-label="关闭详情" onClick={() => setDetailRow(null)}>
                ×
              </button>
            </header>
            <div className="psb-detail-modal__body">
              <div>
                <span>登记系统/机构</span>
                <strong>{detailRow.systemName}</strong>
              </div>
              <div>
                <span>酒店旅业编码/ID</span>
                <strong>{detailRow.hotelCode}</strong>
              </div>
              <div>
                <span>商户名称</span>
                <strong>{detailRow.merchantName}</strong>
              </div>
              <div>
                <span>关联门店</span>
                <strong>{detailRow.storeName}</strong>
              </div>
              <div>
                <span>关联房间数</span>
                <strong>{detailRow.roomCount}</strong>
              </div>
            </div>
          </section>
        </div>
      ) : null}

      {pendingDeleteRow ? (
        <div className="psb-modal-backdrop">
          <section className="psb-confirm-modal" role="dialog" aria-modal="true" aria-labelledby="psb-delete-title">
            <header className="psb-modal__head">
              <h2 id="psb-delete-title">删除确认</h2>
              <button type="button" aria-label="关闭删除确认" onClick={() => setPendingDeleteRow(null)}>
                ×
              </button>
            </header>
            <div className="psb-confirm-modal__body">
              <p>确认删除当前 PSB 公安对接商户吗？</p>
              <strong>{pendingDeleteRow.merchantName}</strong>
            </div>
            <footer className="psb-modal__foot">
              <button type="button" onClick={() => setPendingDeleteRow(null)}>
                取 消
              </button>
              <button
                type="button"
                className="is-primary"
                onClick={() => {
                  handleDeleteRow(pendingDeleteRow.id)
                  setPendingDeleteRow(null)
                }}
              >
                确 定
              </button>
            </footer>
          </section>
        </div>
      ) : null}
    </div>
  )
}

function AddPsbDialog({
  stores,
  roomCount,
  filters,
  onClose,
  onSubmitSuccess,
}: {
  stores: Array<{ poiId: string; poiName: string }>
  roomCount: number
  filters: ReturnType<typeof createDefaultPsbPoliceFilters>
  onClose: () => void
  onSubmitSuccess: (result: Awaited<ReturnType<typeof submitPsbPoliceRegistration>>) => void
}) {
  const [formState, setFormState] = useState<PsbPoliceSubmissionInput>({
    systemName: PSB_SYSTEM_NAME,
    merchantName: '',
    poiId: '',
    travelBusinessName: '',
    travelBusinessCode: '',
    socialCreditCode: '',
    travelBusinessAddress: '',
    districtCode: '',
    registerCode: '',
    hotelCode: '',
    accessKeyId: '',
    devicePublicKey: '',
    devicePrivateKey: '',
    registrantName: '',
    registrantIdNumber: '',
  })
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof PsbPoliceSubmissionInput, string>>>({})
  const [submitMessage, setSubmitMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isStoreListOpen, setIsStoreListOpen] = useState(false)

  const selectedStore =
    stores.find((store) => store.poiId === formState.poiId) ?? null

  function updateField<K extends keyof PsbPoliceSubmissionInput>(
    field: K,
    value: PsbPoliceSubmissionInput[K],
  ) {
    setFormState((current) => ({ ...current, [field]: value }))
    setFieldErrors((current) => {
      if (!current[field]) return current
      return { ...current, [field]: undefined }
    })
    if (field === 'poiId') {
      setIsStoreListOpen(false)
    }
  }

  function validateForm() {
    const nextErrors: Partial<Record<keyof PsbPoliceSubmissionInput, string>> = {}
    if (!formState.merchantName.trim()) nextErrors.merchantName = '商户名称不能为空'
    if (!formState.poiId.trim()) nextErrors.poiId = '请选择门店'
    if (!formState.travelBusinessName.trim()) nextErrors.travelBusinessName = '旅业经营名称不能为空'
    if (!formState.travelBusinessCode.trim()) nextErrors.travelBusinessCode = '旅业编码不能为空'
    if (!formState.socialCreditCode.trim()) nextErrors.socialCreditCode = '社会信用代码不能为空'
    if (!formState.travelBusinessAddress.trim()) nextErrors.travelBusinessAddress = '旅业经营地址不能为空'
    if (!formState.districtCode.trim()) nextErrors.districtCode = '行政区划码不能为空'
    if (!formState.registerCode.trim()) nextErrors.registerCode = '旅业申请的注册码不能为空'
    if (!formState.hotelCode.trim()) nextErrors.hotelCode = '旅馆编码不能为空'
    if (!formState.accessKeyId.trim()) nextErrors.accessKeyId = 'accessKeyId不能为空'
    if (!formState.devicePublicKey.trim()) nextErrors.devicePublicKey = '设备处理业务公钥不能为空'
    if (!formState.devicePrivateKey.trim()) nextErrors.devicePrivateKey = '设备处理业务私钥不能为空'
    if (!formState.registrantName.trim()) nextErrors.registrantName = '登记人姓名不能为空'
    if (!formState.registrantIdNumber.trim()) nextErrors.registrantIdNumber = '登记人证件号码不能为空'
    if (formState.registrantName.trim()) {
      const nameError = validatePersonName(formState.registrantName)
      if (nameError) nextErrors.registrantName = nameError
    }
    if (formState.registrantIdNumber.trim()) {
      const credentialError = validateCredentialNumber('居民身份证', formState.registrantIdNumber)
      if (credentialError) nextErrors.registrantIdNumber = credentialError
    }
    setFieldErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  async function handleSubmit() {
    setSubmitMessage('')
    if (!validateForm()) return

    setIsSubmitting(true)
    try {
      const result = await submitPsbPoliceRegistration(formState, filters)
      onSubmitSuccess(result)
    } catch (error: unknown) {
      setSubmitMessage(
        error instanceof Error
          ? error.message
          : 'PSB公安对接资料提交失败，请稍后重试',
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="psb-modal-backdrop">
      <section className="psb-modal" role="dialog" aria-modal="true" aria-labelledby="psb-add-title">
        <header className="psb-modal__head">
          <h2 id="psb-add-title">新增</h2>
          <button type="button" aria-label="关闭" onClick={onClose}>
            ×
          </button>
        </header>

        <div className="psb-modal__body">
          <div className="psb-form-row">
            <span>
              <em>*</em> 登记系统/机构：
            </span>
            <button type="button" className="psb-select" disabled>
              {PSB_SYSTEM_NAME}
            </button>
          </div>

          {addFormFields.map((field) => {
            const fieldKey = mapFieldLabelToKey(field.label)
            const fieldError = fieldErrors[fieldKey]

            return (
              <div key={field.label} className={`psb-form-row${field.kind === 'textarea' ? ' is-textarea' : ''}`}>
              <span>
                <em>*</em> {field.label}：
              </span>
                <div className="psb-field-control">
                  {field.kind === 'textarea' ? (
                    <textarea
                      aria-label={field.label}
                      placeholder={field.placeholder}
                      value={String(formState[fieldKey])}
                      onChange={(event) => updateField(fieldKey, event.target.value)}
                    />
                  ) : field.kind === 'select' ? (
                    <div className="psb-select-wrap">
                      <button
                        type="button"
                        className="psb-select"
                        onClick={() => setIsStoreListOpen((current) => !current)}
                      >
                        {selectedStore?.poiName ?? field.placeholder}
                      </button>
                      {isStoreListOpen ? (
                        <div className="psb-select-options" role="listbox" aria-label="门店选项">
                          {stores.map((store) => (
                            <button
                              key={store.poiId}
                              type="button"
                              role="option"
                              aria-selected={store.poiId === formState.poiId}
                              onClick={() => updateField('poiId', store.poiId)}
                            >
                              {store.poiName}
                            </button>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  ) : (
                    <input
                      aria-label={field.label}
                      placeholder={field.placeholder}
                      value={String(formState[fieldKey])}
                      onChange={(event) => updateField(fieldKey, event.target.value)}
                    />
                  )}
                  {fieldError ? <span className="psb-form-error">{fieldError}</span> : null}
                </div>
              </div>
            )
          })}
          <div className="psb-form-summary">
            <span>当前关联房间数预估</span>
            <strong>{roomCount}</strong>
          </div>
          {submitMessage ? (
            <div className="psb-submit-message" role="status">
              {submitMessage}
            </div>
          ) : null}
        </div>

        <footer className="psb-modal__foot">
          <button type="button" onClick={onClose}>
            取 消
          </button>
          <button type="button" className="is-primary" onClick={handleSubmit} disabled={isSubmitting}>
            确 定
          </button>
        </footer>
      </section>
    </div>
  )
}

function mapFieldLabelToKey(label: string): keyof PsbPoliceSubmissionInput {
  const fieldMap: Record<string, keyof PsbPoliceSubmissionInput> = {
    商户名称: 'merchantName',
    选择门店: 'poiId',
    旅业经营名称: 'travelBusinessName',
    旅业编码: 'travelBusinessCode',
    社会信用代码: 'socialCreditCode',
    旅业经营地址: 'travelBusinessAddress',
    行政区划码: 'districtCode',
    旅业申请的注册码: 'registerCode',
    旅馆编码: 'hotelCode',
    accessKeyId: 'accessKeyId',
    设备处理业务公钥: 'devicePublicKey',
    设备处理业务私钥: 'devicePrivateKey',
    登记人姓名: 'registrantName',
    登记人证件号码: 'registrantIdNumber',
  }

  return fieldMap[label]
}
