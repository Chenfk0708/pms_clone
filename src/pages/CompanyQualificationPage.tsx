import { useState } from 'react'
import './CompanyQualificationPage.css'

const tabs = ['企业信息', '营业资质', '法人证件'] as const

type QualificationTab = (typeof tabs)[number]

const companyFields = [
  { label: '企业名称', value: '路客云6TS5的店铺' },
  { label: '企业类型', value: '民宿' },
  { label: '联系电话', value: '暂无联系电话' },
  { label: '所在城市', value: '暂无所在城市' },
  { label: '详细地址', value: '暂无详细地址' },
  { label: '图片', value: '暂无图片数据' },
]

const licenseGroups = [
  {
    index: 1,
    title: '营业执照',
    links: ['查看示例'],
    hint: '小于4MB，最多上传1张，支持jpeg、jpg、png格式',
  },
  {
    index: 2,
    title: '商铺行业资质（涉及餐饮相关内容的商家请上传《食品经营许可证》）',
    links: ['公共场所许可证查看示例', '特种行业许可证查看示例', '食品经营许可证查看示例'],
    hint: '小于4MB，支持jpeg、jpg、png格式',
  },
  {
    index: 3,
    title: '补充资质 (如商铺行业资质信息不全时，需要上传补充资质)',
    links: ['查看示例', '行业补充资质说明'],
    hint: '小于4MB，最多上传4张，支持jpeg、jpg、png格式',
  },
  {
    index: 4,
    title: '商家授权承诺函（开通抖音必传）',
    links: ['查看示例', '下载授权承诺函模板'],
    hint: '小于4MB，仅支持PDF格式',
    pdf: true,
  },
]

const legalPhotos = ['证件人像面照片', '证件国徽面照片', '法人手持证件照']

export function CompanyQualificationPage() {
  const [activeTab, setActiveTab] = useState<QualificationTab>('企业信息')
  const [editing, setEditing] = useState(false)

  function selectTab(tab: QualificationTab) {
    setActiveTab(tab)
    if (tab !== '企业信息') setEditing(false)
  }

  return (
    <div className="company-qualification-page">
      <nav className="qualification-tabs" aria-label="企业资质页签">
        {tabs.map((tab) => (
          <button
            key={tab}
            type="button"
            className={activeTab === tab ? 'is-active' : ''}
            onClick={() => selectTab(tab)}
          >
            {tab}
          </button>
        ))}
      </nav>

      <section className="qualification-card">
        {activeTab === '企业信息' ? (
          <CompanyInfoPanel editing={editing} onEdit={() => setEditing(true)} onDone={() => setEditing(false)} />
        ) : null}
        {activeTab === '营业资质' ? <BusinessLicensePanel /> : null}
        {activeTab === '法人证件' ? <LegalIdentityPanel /> : null}
      </section>
    </div>
  )
}

function CompanyInfoPanel({
  editing,
  onEdit,
  onDone,
}: {
  editing: boolean
  onEdit: () => void
  onDone: () => void
}) {
  return (
    <>
      <div className="qualification-heading">
        <h2>企业信息</h2>
        <div className="qualification-actions">
          {editing ? (
            <>
              <button type="button" className="qualification-button" onClick={onDone}>
                取 消
              </button>
              <button type="button" className="qualification-button qualification-button--primary" onClick={onDone}>
                保 存
              </button>
            </>
          ) : (
            <button type="button" className="qualification-button qualification-button--primary" onClick={onEdit}>
              编 辑
            </button>
          )}
        </div>
      </div>

      {editing ? <CompanyEditForm /> : <CompanyInfoView />}
    </>
  )
}

function CompanyInfoView() {
  return (
    <dl className="company-info-list">
      {companyFields.map((field) => (
        <div key={field.label} className="company-info-row">
          <dt>{field.label}：</dt>
          <dd>{field.value}</dd>
        </div>
      ))}
    </dl>
  )
}

function CompanyEditForm() {
  return (
    <form className="company-edit-form">
      <label className="company-edit-row">
        <span>企业名称</span>
        <input aria-label="企业名称" defaultValue="路客云6TS5的店铺" />
      </label>
      <label className="company-edit-row">
        <span>企业类型</span>
        <input aria-label="企业类型" defaultValue="民宿" />
      </label>
      <label className="company-edit-row">
        <span>联系电话</span>
        <input aria-label="联系电话" placeholder="请输入联系电话" />
      </label>
      <div className="company-edit-row">
        <span>所在城市</span>
        <button type="button" className="city-picker">
          请选择所在城市
        </button>
      </div>
      <label className="company-edit-row">
        <span>详细地址</span>
        <input aria-label="详细地址" placeholder="请输入详细地址" />
      </label>
      <div className="company-edit-row company-edit-row--upload">
        <span>图片</span>
        <button type="button" className="upload-tile">
          上传
        </button>
      </div>
    </form>
  )
}

function BusinessLicensePanel() {
  return (
    <>
      <div className="qualification-heading">
        <h2>营业资质</h2>
      </div>
      <div className="license-list">
        {licenseGroups.map((group) => (
          <article key={group.index} className="license-item">
            <div className="license-index">{group.index}</div>
            <div className="license-main">
              <h3>{group.title}</h3>
              <div className="license-links">
                {group.links.map((link) => (
                  <button key={link} type="button">
                    {link}
                  </button>
                ))}
              </div>
              <div className="license-upload">
                <button type="button" className={group.pdf ? 'license-upload-pdf' : ''}>
                  上传文件
                </button>
                <span>{group.hint}</span>
              </div>
            </div>
          </article>
        ))}
      </div>
    </>
  )
}

function LegalIdentityPanel() {
  return (
    <>
      <div className="qualification-heading">
        <h2>法人证件</h2>
      </div>
      <dl className="legal-info-list">
        <div>
          <dt>证件类型：</dt>
          <dd>居民身份证</dd>
        </div>
        <div>
          <dt>证件号码：</dt>
          <dd />
        </div>
      </dl>
      <div className="legal-photo-list">
        {legalPhotos.map((title) => (
          <article key={title} className="legal-photo-card">
            <h3>{title}</h3>
            <button type="button">上传</button>
          </article>
        ))}
      </div>
    </>
  )
}
