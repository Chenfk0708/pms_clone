import { useEffect, useRef, useState } from 'react'
import './CompanyInfoPage.css'
import {
  CompanyInfoRequestError,
  createEmptyCompanyInfoDraft,
  createUploadedCompanyImage,
  defaultCompanyInfoQuery,
  fetchCompanyInfo,
  saveCompanyInfo,
  type CompanyInfoProfile,
  type CompanyInfoViewModel,
} from '../services/companyInfo'

type FormErrors = Partial<Record<'name' | 'phone' | 'city' | 'address', string>>

export function CompanyInfoPage() {
  const [viewModel, setViewModel] = useState<CompanyInfoViewModel | null>(null)
  const [draft, setDraft] = useState<CompanyInfoProfile>(createEmptyCompanyInfoDraft())
  const [editing, setEditing] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [feedback, setFeedback] = useState('企业信息加载中')
  const [formErrors, setFormErrors] = useState<FormErrors>({})
  const [refreshToken, setRefreshToken] = useState(0)
  const nextSuccessMessageRef = useRef('企业信息已加载')

  useEffect(() => {
    const controller = new AbortController()

    fetchCompanyInfo(defaultCompanyInfoQuery, controller.signal)
      .then((data) => {
        if (controller.signal.aborted) return
        setViewModel(data)
        setDraft(data.profile ? cloneProfile(data.profile) : createEmptyCompanyInfoDraft())
        setEditing(false)
        setFormErrors({})
        setFeedback(nextSuccessMessageRef.current)
      })
      .catch((requestError: Error) => {
        if (controller.signal.aborted) return
        setError(requestError.message || '企业信息加载失败')
        setFeedback('企业信息加载失败')
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false)
      })

    return () => controller.abort()
  }, [refreshToken])

  const provider = viewModel?.provider ?? 'mock'
  const contractText = JSON.stringify(
    viewModel?.contract ?? {
      provider,
      path: '/company/info/get',
      method: 'POST',
      requestBody: defaultCompanyInfoQuery,
      traceId: '',
      timestamp: '',
    },
  )

  function openEditor() {
    setEditing(true)
    setDraft(viewModel?.profile ? cloneProfile(viewModel.profile) : createEmptyCompanyInfoDraft())
    setFormErrors({})
    setFeedback('已进入编辑状态')
  }

  function cancelEditing() {
    setEditing(false)
    setDraft(viewModel?.profile ? cloneProfile(viewModel.profile) : createEmptyCompanyInfoDraft())
    setFormErrors({})
    setFeedback('已取消本次修改')
  }

  function updateDraft<K extends keyof CompanyInfoProfile>(key: K, value: CompanyInfoProfile[K]) {
    setDraft((current) => ({ ...current, [key]: value }))
    setFormErrors((current) => ({ ...current, [key]: undefined }))
  }

  function uploadImage() {
    const image = createUploadedCompanyImage(draft.images)
    updateDraft('images', [...draft.images, image])
    setFeedback('已添加图片，保存后生效')
  }

  function validateDraft() {
    const errors: FormErrors = {}

    if (!draft.name.trim()) errors.name = '请输入企业名称'
    if (draft.phone && !/^\d{11}$/.test(draft.phone.trim())) errors.phone = '联系电话需为 11 位手机号'
    if (!draft.city.trim()) errors.city = '请选择所在城市'
    if (!draft.address.trim()) errors.address = '请输入详细地址'

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  async function submitDraft() {
    if (!validateDraft()) {
      setFeedback('请先补全必填信息')
      return
    }

    setSaving(true)
    setFeedback('企业信息保存中')
    try {
      const nextViewModel = await saveCompanyInfo(draft)
      setViewModel(nextViewModel)
      setDraft(nextViewModel.profile ? cloneProfile(nextViewModel.profile) : createEmptyCompanyInfoDraft())
      setEditing(false)
      setFormErrors({})
      setFeedback('企业信息已保存')
    } catch (requestError) {
      const message = requestError instanceof CompanyInfoRequestError ? requestError.message : '企业信息保存失败'
      setFeedback(message)
    } finally {
      setSaving(false)
    }
  }

  function retryLoad() {
    nextSuccessMessageRef.current = '企业信息已重新加载'
    setLoading(true)
    setError('')
    setFeedback('企业信息加载中')
    setRefreshToken((current) => current + 1)
  }

  function startFromEmpty() {
    openEditor()
    setFeedback('请填写企业信息后保存')
  }

  return (
    <div className="company-info-page" data-provider={provider}>
      <section className="company-info-panel" aria-label="企业信息">
        <header className="company-info-header">
          <div>
            <h1>企业信息</h1>
            <p>维护企业基础资料，后续用于门店展示、成员协作和对外信息同步。</p>
          </div>
          <div className="company-info-actions">
            {editing ? (
              <>
                <button type="button" className="company-info-button company-info-button--ghost" onClick={cancelEditing} disabled={saving}>
                  取 消
                </button>
                <button type="button" className="company-info-button company-info-button--primary" onClick={() => void submitDraft()} disabled={saving}>
                  保 存
                </button>
              </>
            ) : (
              <button type="button" className="company-info-button company-info-button--primary" onClick={openEditor} disabled={loading || Boolean(error)}>
                编 辑
              </button>
            )}
          </div>
        </header>

        <div className="company-info-feedback" role="status" aria-label="企业信息操作反馈">
          {feedback}
        </div>

        <pre className="company-info-contract" aria-label="企业信息服务契约">
          {contractText}
        </pre>

        {error ? (
          <section className="company-info-state company-info-state--error" role="alert" aria-label="企业信息数据错误">
            <strong>企业信息加载失败</strong>
            <span>{error}</span>
            <button type="button" className="company-info-button company-info-button--primary" onClick={retryLoad}>
              重试
            </button>
          </section>
        ) : null}

        {!error && !loading && !editing && !viewModel?.profile ? (
          <section className="company-info-state" role="status" aria-label="企业信息空态">
            <strong>暂未填写企业信息</strong>
            <span>先补齐企业名称、所在城市和详细地址，后续门店展示与成员协作会直接复用这些资料。</span>
            <button type="button" className="company-info-button company-info-button--primary" onClick={startFromEmpty}>
              立即填写
            </button>
          </section>
        ) : null}

        {!error && (editing || viewModel?.profile || loading) ? (
          <div className={`company-info-content ${loading ? 'is-loading' : ''}`}>
            {editing ? (
              <CompanyInfoForm
                draft={draft}
                errors={formErrors}
                loading={loading || saving}
                cityOptions={viewModel?.cityOptions ?? []}
                onChange={updateDraft}
                onUpload={uploadImage}
              />
            ) : (
              <CompanyInfoReadonly
                fields={viewModel?.fields ?? []}
                images={viewModel?.profile?.images ?? []}
                loading={loading}
              />
            )}
          </div>
        ) : null}
      </section>
    </div>
  )
}

function CompanyInfoReadonly({
  fields,
  images,
  loading,
}: {
  fields: CompanyInfoViewModel['fields']
  images: CompanyInfoProfile['images']
  loading: boolean
}) {
  return (
    <div className="company-info-readonly" aria-label="企业信息详情">
      {fields.map((field) => (
        <div className="company-info-row" key={field.label}>
          <span className="company-info-label">{field.label}：</span>
          <span className="company-info-value">{loading ? '加载中...' : field.value}</span>
        </div>
      ))}

      <div className="company-info-row company-info-row--images">
        <span className="company-info-label">图片：</span>
        <div className="company-info-image-column">
          {images.length > 0 ? (
            <div className="company-info-image-list" aria-label="企业信息图片列表">
              {images.map((image) => (
                <article key={image.id} className="company-info-image-card">
                  <div className="company-info-image-card__preview" aria-hidden="true">
                    {image.name.slice(0, 2)}
                  </div>
                  <div>
                    <strong>{image.name}</strong>
                    <span>{image.uploadedAt}</span>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="company-info-empty-image" aria-label="企业信息图片列表">
              <div className="company-info-empty-box" aria-hidden="true">
                <span />
                <i />
              </div>
              <p>暂无图片数据</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function CompanyInfoForm({
  draft,
  errors,
  loading,
  cityOptions,
  onChange,
  onUpload,
}: {
  draft: CompanyInfoProfile
  errors: FormErrors
  loading: boolean
  cityOptions: string[]
  onChange: <K extends keyof CompanyInfoProfile>(key: K, value: CompanyInfoProfile[K]) => void
  onUpload: () => void
}) {
  return (
    <form className="company-info-form" aria-label="编辑企业信息" onSubmit={(event) => event.preventDefault()}>
      <label className="company-info-form-row">
        <span>企业名称：</span>
        <div className="company-info-field">
          <input aria-label="企业名称" value={draft.name} disabled={loading} onChange={(event) => onChange('name', event.target.value)} />
          {errors.name ? <small>{errors.name}</small> : null}
        </div>
      </label>

      <label className="company-info-form-row">
        <span>企业类型：</span>
        <div className="company-info-field">
          <input aria-label="企业类型" value={draft.type} disabled readOnly />
        </div>
      </label>

      <label className="company-info-form-row">
        <span>联系电话：</span>
        <div className="company-info-field">
          <input aria-label="联系电话" value={draft.phone} disabled={loading} onChange={(event) => onChange('phone', event.target.value)} />
          {errors.phone ? <small>{errors.phone}</small> : null}
        </div>
      </label>

      <label className="company-info-form-row">
        <span>所在城市：</span>
        <div className="company-info-field">
          <select aria-label="所在城市" value={draft.city} disabled={loading} onChange={(event) => onChange('city', event.target.value)}>
            <option value="">请选择所在城市</option>
            {cityOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
          {errors.city ? <small>{errors.city}</small> : null}
        </div>
      </label>

      <label className="company-info-form-row company-info-form-row--textarea">
        <span>详细地址：</span>
        <div className="company-info-field">
          <textarea
            aria-label="详细地址"
            value={draft.address}
            disabled={loading}
            placeholder="请输入详细地址(不包括省市区)"
            onChange={(event) => onChange('address', event.target.value)}
          />
          {errors.address ? <small>{errors.address}</small> : null}
        </div>
      </label>

      <div className="company-info-form-row company-info-form-row--upload">
        <span>图片：</span>
        <div className="company-info-upload-panel">
          <button type="button" className="company-info-upload" onClick={onUpload} disabled={loading}>
            <strong>+</strong>
            上传
          </button>
          <div className="company-info-image-list company-info-image-list--compact" aria-label="企业信息图片列表">
            {draft.images.length > 0 ? (
              draft.images.map((image) => (
                <article key={image.id} className="company-info-image-card">
                  <div className="company-info-image-card__preview" aria-hidden="true">
                    {image.name.slice(0, 2)}
                  </div>
                  <div>
                    <strong>{image.name}</strong>
                    <span>{image.uploadedAt}</span>
                  </div>
                </article>
              ))
            ) : (
              <div className="company-info-upload-hint">保存后会同步到企业资料展示区。</div>
            )}
          </div>
        </div>
      </div>
    </form>
  )
}

function cloneProfile(profile: CompanyInfoProfile): CompanyInfoProfile {
  return {
    ...profile,
    images: profile.images.map((image) => ({ ...image })),
  }
}
