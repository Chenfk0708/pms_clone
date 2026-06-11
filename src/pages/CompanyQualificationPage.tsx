import { useEffect, useMemo, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import {
  CompanyQualificationRequestError,
  createDraftCompanyQualificationImage,
  createEmptyCompanyQualificationDraft,
  defaultCompanyQualificationQuery,
  fetchCompanyQualification,
  resolveCompanyQualificationRuntimeConfig,
  saveCompanyQualificationProfile,
  uploadCompanyQualificationAsset,
  type CompanyQualificationDocumentSection,
  type CompanyQualificationFile,
  type CompanyQualificationLegalPhoto,
  type CompanyQualificationProfile,
  type CompanyQualificationUploadTarget,
  type CompanyQualificationViewModel,
} from '../services/companyQualification'
import { validateOptionalContactPhone } from '../utils/inputValidation'
import './CompanyQualificationPage.css'

const tabs = ['企业信息', '营业资质', '法人证件'] as const

type QualificationTab = (typeof tabs)[number]

export function CompanyQualificationPage() {
  const location = useLocation()
  const runtime = useMemo(
    () => resolveCompanyQualificationRuntimeConfig(location.search),
    [location.search],
  )
  const [viewModel, setViewModel] = useState<CompanyQualificationViewModel | null>(null)
  const [draft, setDraft] = useState<CompanyQualificationProfile>(createEmptyCompanyQualificationDraft())
  const [activeTab, setActiveTab] = useState<QualificationTab>('企业信息')
  const [editing, setEditing] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [feedback, setFeedback] = useState('企业资质加载中')
  const [refreshToken, setRefreshToken] = useState(0)
  const [formErrors, setFormErrors] = useState<
    Partial<Record<'name' | 'phone' | 'city' | 'address', string>>
  >({})
  const [dialog, setDialog] = useState<{ title: string; description: string } | null>(null)
  const nextSuccessMessageRef = useRef('企业资质已加载')

  useEffect(() => {
    const controller = new AbortController()

    queueMicrotask(() => {
      if (controller.signal.aborted) return
      setLoading(true)
      setError('')
    })

    fetchCompanyQualification(
      {
        ...defaultCompanyQualificationQuery,
        provider: runtime.provider,
      },
      controller.signal,
    )
      .then((nextViewModel) => {
        if (controller.signal.aborted) return
        setViewModel(nextViewModel)
        setDraft(
          nextViewModel.profile ? cloneProfile(nextViewModel.profile) : createEmptyCompanyQualificationDraft(),
        )
        setEditing(false)
        setFormErrors({})
        setFeedback(nextSuccessMessageRef.current)
      })
      .catch((requestError: Error) => {
        if (controller.signal.aborted) return
        setError(requestError.message || '企业资质加载失败')
        setFeedback('企业资质加载失败')
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false)
      })

    return () => controller.abort()
  }, [refreshToken, runtime.mockState, runtime.provider])

  const contractText = useMemo(
    () =>
      JSON.stringify(
        viewModel?.contract ?? {
          provider: runtime.provider ?? 'mock',
          action: 'get',
          path: '/company/qualification/get',
          method: 'POST',
          requestBody: defaultCompanyQualificationQuery,
          traceId: '',
          timestamp: '',
          responseCode: 0,
          state: runtime.mockState ?? 'success',
        },
        null,
        2,
      ),
    [runtime.mockState, runtime.provider, viewModel?.contract],
  )

  function selectTab(tab: QualificationTab) {
    setActiveTab(tab)
    if (tab !== '企业信息') setEditing(false)
    setDialog(null)
    setFeedback(`已切换到${tab}`)
  }

  function openEditor() {
    setEditing(true)
    setDraft(viewModel?.profile ? cloneProfile(viewModel.profile) : createEmptyCompanyQualificationDraft())
    setFormErrors({})
    setFeedback('已进入企业信息编辑状态')
  }

  function cancelEditing() {
    setEditing(false)
    setDraft(viewModel?.profile ? cloneProfile(viewModel.profile) : createEmptyCompanyQualificationDraft())
    setFormErrors({})
    setFeedback('已取消本次修改')
  }

  function updateDraft<K extends keyof CompanyQualificationProfile>(
    key: K,
    value: CompanyQualificationProfile[K],
  ) {
    setDraft((current) => ({ ...current, [key]: value }))
    setFormErrors((current) => ({ ...current, [key]: undefined }))
  }

  function uploadDraftImage() {
    const nextImage = createDraftCompanyQualificationImage(draft.images)
    updateDraft('images', [...draft.images, nextImage])
    setFeedback('已添加企业图片，保存后生效')
  }

  function validateDraft() {
    const nextErrors: Partial<Record<'name' | 'phone' | 'city' | 'address', string>> = {}

    if (!draft.name.trim()) nextErrors.name = '请输入企业名称'
    const phoneError = validateOptionalContactPhone(draft.phone)
    if (phoneError) nextErrors.phone = phoneError
    if (!draft.city.trim()) nextErrors.city = '请选择所在城市'
    if (!draft.address.trim()) nextErrors.address = '请输入详细地址'

    setFormErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  async function submitDraft() {
    if (!validateDraft()) {
      setFeedback('请先补全企业信息后再保存')
      return
    }

    setSaving(true)
    setFeedback('企业资质保存中')

    try {
      const nextViewModel = await saveCompanyQualificationProfile(draft, {
        ...defaultCompanyQualificationQuery,
        provider: runtime.provider,
        legalIdentity: viewModel?.legalIdentity,
      })
      setViewModel(nextViewModel)
      setDraft(nextViewModel.profile ? cloneProfile(nextViewModel.profile) : createEmptyCompanyQualificationDraft())
      setEditing(false)
      setFormErrors({})
      setFeedback('企业资质已保存')
    } catch (requestError) {
      const message =
        requestError instanceof CompanyQualificationRequestError
          ? requestError.message
          : '企业资质保存失败'
      setFeedback(message)
    } finally {
      setSaving(false)
    }
  }

  function retryLoad() {
    nextSuccessMessageRef.current = '企业资质已重新加载'
    setLoading(true)
    setError('')
    setFeedback('企业资质加载中')
    setRefreshToken((current) => current + 1)
  }

  function startFromEmpty() {
    setEditing(true)
    setActiveTab('企业信息')
    setDraft(createEmptyCompanyQualificationDraft())
    setFormErrors({})
    setFeedback('请完善企业信息后保存')
  }

  async function handleAssetUpload(target: CompanyQualificationUploadTarget, label: string) {
    setSaving(true)
    setFeedback(`正在上传${label}`)

    try {
      const result = await uploadCompanyQualificationAsset(target, {
        ...defaultCompanyQualificationQuery,
        provider: runtime.provider,
      })
      setViewModel(result.viewModel)
      setFeedback(`${label}已上传：${result.file.name}`)
    } catch (requestError) {
      const message =
        requestError instanceof CompanyQualificationRequestError
          ? requestError.message
          : `${label}上传失败`
      setFeedback(message)
    } finally {
      setSaving(false)
    }
  }

  function openReference(label: string) {
    if (label === '下载授权承诺函模板') {
      setFeedback('授权承诺函模板下载任务已创建')
      return
    }

    setDialog({
      title: label,
      description: referenceDescriptionMap[label] ?? '已打开对应资质说明，请按示例准备并上传清晰文件。',
    })
  }

  return (
    <div
      className="company-qualification-page"
      data-provider={viewModel?.provider ?? runtime.provider ?? 'mock'}
    >
      <h1 className="sr-only-heading">企业资质</h1>
      <pre
        hidden
        data-testid="company-qualification-service-contract"
        data-provider={viewModel?.provider ?? runtime.provider ?? 'mock'}
        aria-label="企业资质服务契约"
      >
        {contractText}
      </pre>

      <div className="qualification-feedback" role="status" aria-label="企业资质操作反馈">
        {feedback}
      </div>

      {error ? (
        <section className="qualification-state qualification-state--error" role="alert" aria-label="企业资质数据错误">
          <strong>企业资质加载失败</strong>
          <span>{error}</span>
          <button type="button" className="qualification-button qualification-button--primary" onClick={retryLoad}>
            重新加载
          </button>
        </section>
      ) : null}

      <nav className="qualification-tabs" aria-label="企业资质页签" role="tablist">
        {tabs.map((tab) => (
          <button
            key={tab}
            type="button"
            role="tab"
            aria-selected={activeTab === tab}
            className={activeTab === tab ? 'is-active' : ''}
            onClick={() => selectTab(tab)}
          >
            {tab}
          </button>
        ))}
      </nav>

      <section className="qualification-card">
        {!loading && !error && !editing && activeTab === '企业信息' && !viewModel?.profile ? (
          <section className="qualification-state" role="status" aria-label="企业资质空态">
            <strong>暂未完善企业资质</strong>
            <span>请先补齐企业基础信息、营业资质和法人证件，后续门店展示与渠道接入会直接复用这些资料。</span>
            <button type="button" className="qualification-button qualification-button--primary" onClick={startFromEmpty}>
              立即完善
            </button>
          </section>
        ) : null}

        {activeTab === '企业信息' ? (
          <CompanyInfoPanel
            editing={editing}
            loading={loading}
            saving={saving}
            draft={draft}
            fields={viewModel?.fields ?? []}
            cityOptions={viewModel?.cityOptions ?? []}
            formErrors={formErrors}
            imageFiles={editing ? draft.images : viewModel?.profile?.images ?? []}
            onEdit={openEditor}
            onCancel={cancelEditing}
            onSave={() => void submitDraft()}
            onChange={updateDraft}
            onUploadImage={uploadDraftImage}
          />
        ) : null}
        {activeTab === '营业资质' ? (
          <BusinessLicensePanel
            sections={viewModel?.businessLicenses ?? []}
            disabled={loading || saving}
            onReference={openReference}
            onUpload={(section) => void handleAssetUpload(section.id, section.title)}
          />
        ) : null}
        {activeTab === '法人证件' ? (
          <LegalIdentityPanel
            legalIdentity={viewModel?.legalIdentity}
            disabled={loading || saving}
            onUpload={(photo) => void handleAssetUpload(photo.id, photo.label)}
          />
        ) : null}
      </section>

      {dialog ? (
        <div className="qualification-dialog-backdrop">
          <section role="dialog" aria-modal="true" aria-label={dialog.title} className="qualification-dialog">
            <h2>{dialog.title}</h2>
            <p>{dialog.description}</p>
            <button type="button" className="qualification-button qualification-button--primary" onClick={() => setDialog(null)}>
              关闭说明
            </button>
          </section>
        </div>
      ) : null}
    </div>
  )
}

function CompanyInfoPanel({
  editing,
  loading,
  saving,
  draft,
  fields,
  cityOptions,
  formErrors,
  imageFiles,
  onEdit,
  onCancel,
  onSave,
  onChange,
  onUploadImage,
}: {
  editing: boolean
  loading: boolean
  saving: boolean
  draft: CompanyQualificationProfile
  fields: CompanyQualificationViewModel['fields']
  cityOptions: string[]
  formErrors: Partial<Record<'name' | 'phone' | 'city' | 'address', string>>
  imageFiles: CompanyQualificationFile[]
  onEdit: () => void
  onCancel: () => void
  onSave: () => void
  onChange: <K extends keyof CompanyQualificationProfile>(
    key: K,
    value: CompanyQualificationProfile[K],
  ) => void
  onUploadImage: () => void
}) {
  return (
    <>
      <div className="qualification-heading">
        <h2>企业信息</h2>
        <div className="qualification-actions">
          {editing ? (
            <>
              <button type="button" className="qualification-button" onClick={onCancel} disabled={saving}>
                取 消
              </button>
              <button type="button" className="qualification-button qualification-button--primary" onClick={onSave} disabled={saving}>
                保 存
              </button>
            </>
          ) : (
            <button type="button" className="qualification-button qualification-button--primary" onClick={onEdit} disabled={loading}>
              编 辑
            </button>
          )}
        </div>
      </div>

      {editing ? (
        <CompanyEditForm
          draft={draft}
          cityOptions={cityOptions}
          formErrors={formErrors}
          onChange={onChange}
          onUploadImage={onUploadImage}
          imageFiles={imageFiles}
          disabled={saving}
        />
      ) : (
        <CompanyInfoView fields={fields} imageFiles={imageFiles} loading={loading} />
      )}
    </>
  )
}

function CompanyInfoView({
  fields,
  imageFiles,
  loading,
}: {
  fields: CompanyQualificationViewModel['fields']
  imageFiles: CompanyQualificationFile[]
  loading: boolean
}) {
  return (
    <dl className="company-info-list" aria-label="企业资质企业信息详情">
      {fields.map((field) => (
        <div key={field.label} className="company-info-row">
          <dt>{field.label}：</dt>
          <dd>{loading ? '加载中...' : field.value}</dd>
        </div>
      ))}
      <div className="company-info-row company-info-row--files">
        <dt>图片：</dt>
        <dd>
          {imageFiles.length > 0 ? (
            <div className="qualification-file-list" aria-label="企业资质图片列表">
              {imageFiles.map((file) => (
                <article key={file.id} className="qualification-file-card">
                  <strong>{file.name}</strong>
                  <span>{file.uploadedAt}</span>
                </article>
              ))}
            </div>
          ) : (
            '暂无图片数据'
          )}
        </dd>
      </div>
    </dl>
  )
}

function CompanyEditForm({
  draft,
  cityOptions,
  formErrors,
  onChange,
  onUploadImage,
  imageFiles,
  disabled,
}: {
  draft: CompanyQualificationProfile
  cityOptions: string[]
  formErrors: Partial<Record<'name' | 'phone' | 'city' | 'address', string>>
  onChange: <K extends keyof CompanyQualificationProfile>(
    key: K,
    value: CompanyQualificationProfile[K],
  ) => void
  onUploadImage: () => void
  imageFiles: CompanyQualificationFile[]
  disabled: boolean
}) {
  return (
    <form className="company-edit-form">
      <label className="company-edit-row">
        <span>企业名称</span>
        <div>
          <input
            aria-label="企业名称"
            value={draft.name}
            onChange={(event) => onChange('name', event.target.value)}
            disabled={disabled}
          />
          {formErrors.name ? <em>{formErrors.name}</em> : null}
        </div>
      </label>
      <label className="company-edit-row">
        <span>企业类型</span>
        <input
          aria-label="企业类型"
          value={draft.type}
          onChange={(event) => onChange('type', event.target.value)}
          disabled={disabled}
        />
      </label>
      <label className="company-edit-row">
        <span>联系电话</span>
        <div>
          <input
            aria-label="联系电话"
            value={draft.phone}
            placeholder="请输入联系电话"
            onChange={(event) => onChange('phone', event.target.value)}
            disabled={disabled}
          />
          {formErrors.phone ? <em>{formErrors.phone}</em> : null}
        </div>
      </label>
      <label className="company-edit-row">
        <span>所在城市</span>
        <div>
          <select
            aria-label="所在城市"
            className="city-picker"
            value={draft.city}
            onChange={(event) => onChange('city', event.target.value)}
            disabled={disabled}
          >
            <option value="">请选择所在城市</option>
            {cityOptions.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
          {formErrors.city ? <em>{formErrors.city}</em> : null}
        </div>
      </label>
      <label className="company-edit-row">
        <span>详细地址</span>
        <div>
          <input
            aria-label="详细地址"
            value={draft.address}
            placeholder="请输入详细地址"
            onChange={(event) => onChange('address', event.target.value)}
            disabled={disabled}
          />
          {formErrors.address ? <em>{formErrors.address}</em> : null}
        </div>
      </label>
      <div className="company-edit-row company-edit-row--upload">
        <span>图片</span>
        <div className="company-edit-upload">
          <button
            type="button"
            className="upload-tile"
            aria-label="上传 企业图片"
            onClick={onUploadImage}
            disabled={disabled}
          >
            上传
          </button>
          {imageFiles.length > 0 ? (
            <div className="qualification-file-list" aria-label="企业资质图片列表">
              {imageFiles.map((file) => (
                <article key={file.id} className="qualification-file-card">
                  <strong>{file.name}</strong>
                  <span>{file.uploadedAt}</span>
                </article>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </form>
  )
}

function BusinessLicensePanel({
  sections,
  disabled,
  onReference,
  onUpload,
}: {
  sections: CompanyQualificationDocumentSection[]
  disabled: boolean
  onReference: (label: string) => void
  onUpload: (section: CompanyQualificationDocumentSection) => void
}) {
  return (
    <>
      <div className="qualification-heading">
        <h2>营业资质</h2>
      </div>
      <div className="license-list">
        {sections.map((group, index) => (
          <article key={group.id} className="license-item">
            <div className="license-index">{index + 1}</div>
            <div className="license-main">
              <h3>{group.title}</h3>
              <div className="license-links">
                {group.links.map((link) => (
                  <button key={link} type="button" onClick={() => onReference(link)}>
                    {link}
                  </button>
                ))}
              </div>
              <div className="license-upload">
                <button
                  type="button"
                  className={group.kind === 'pdf' ? 'license-upload-pdf' : ''}
                  aria-label={`上传 ${group.title}`}
                  onClick={() => onUpload(group)}
                  disabled={disabled}
                >
                  {group.uploadLabel}
                </button>
                <div className="license-upload__meta">
                  <span>{group.hint}</span>
                  {group.files.length > 0 ? (
                    <div className="qualification-file-list" aria-label={`${group.title}文件列表`}>
                      {group.files.map((file) => (
                        <article key={file.id} className="qualification-file-card">
                          <strong>{file.name}</strong>
                          <span>
                            {file.uploadedAt} · {file.sizeLabel}
                          </span>
                        </article>
                      ))}
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          </article>
        ))}
      </div>
    </>
  )
}

function LegalIdentityPanel({
  legalIdentity,
  disabled,
  onUpload,
}: {
  legalIdentity?: CompanyQualificationViewModel['legalIdentity']
  disabled: boolean
  onUpload: (photo: CompanyQualificationLegalPhoto) => void
}) {
  return (
    <>
      <div className="qualification-heading">
        <h2>法人证件</h2>
      </div>
      <dl className="legal-info-list">
        <div>
          <dt>证件类型：</dt>
          <dd>{legalIdentity?.documentType ?? '居民身份证'}</dd>
        </div>
        <div>
          <dt>证件号码：</dt>
          <dd>{legalIdentity?.documentNumber || '待补充'}</dd>
        </div>
      </dl>
      <div className="legal-photo-list">
        {(legalIdentity?.photos ?? []).map((photo) => (
          <article key={photo.id} className="legal-photo-card">
            <h3>{photo.label}</h3>
            <button
              type="button"
              aria-label={`上传 ${photo.label}`}
              onClick={() => onUpload(photo)}
              disabled={disabled}
            >
              上传
            </button>
            {photo.files.length > 0 ? (
              <div className="qualification-file-list" aria-label={`${photo.label}文件列表`}>
                {photo.files.map((file) => (
                  <article key={file.id} className="qualification-file-card">
                    <strong>{file.name}</strong>
                    <span>
                      {file.uploadedAt} · {file.sizeLabel}
                    </span>
                  </article>
                ))}
              </div>
            ) : null}
          </article>
        ))}
      </div>
    </>
  )
}

const referenceDescriptionMap: Record<string, string> = {
  查看示例: '请上传清晰、完整且四角可见的证照示例图片，避免反光、遮挡或裁切。',
  公共场所许可证查看示例: '公共场所许可证需包含经营主体、经营地址和有效期等关键信息。',
  特种行业许可证查看示例: '特种行业许可证需保证证号、发证机关和经营范围完整可辨识。',
  食品经营许可证查看示例: '食品经营许可证建议上传彩色原件照片，确保许可项目可读。',
  行业补充资质说明: '若行业资质未覆盖经营范围，请补传补充资质并保持与营业执照主体一致。',
}

function cloneProfile(profile: CompanyQualificationProfile): CompanyQualificationProfile {
  return {
    ...profile,
    images: profile.images.map((file) => ({ ...file })),
  }
}
