import { useState } from 'react'
import './CompanyInfoPage.css'

const companyInfo = {
  name: '路客云6TS5的店铺',
  type: '民宿',
  phone: '',
  city: '',
  address: '',
}

const displayRows = [
  { label: '企业名称', value: companyInfo.name },
  { label: '企业类型', value: companyInfo.type },
  { label: '联系电话', value: '暂无联系电话' },
  { label: '所在城市', value: '暂无所在城市' },
  { label: '详细地址', value: '暂无详细地址' },
]

export function CompanyInfoPage() {
  const [editing, setEditing] = useState(false)

  return (
    <div className="company-info-page">
      <section className="company-info-panel" aria-label="企业信息">
        <header className="company-info-header">
          <h1>企业信息</h1>
          <div className="company-info-actions">
            {editing ? (
              <>
                <button type="button" className="company-info-button company-info-button--ghost" onClick={() => setEditing(false)}>
                  取 消
                </button>
                <button type="button" className="company-info-button company-info-button--primary" onClick={() => setEditing(false)}>
                  保 存
                </button>
              </>
            ) : (
              <button type="button" className="company-info-button company-info-button--primary" onClick={() => setEditing(true)}>
                编 辑
              </button>
            )}
          </div>
        </header>

        {editing ? <CompanyInfoForm /> : <CompanyInfoReadOnly />}
      </section>
    </div>
  )
}

function CompanyInfoReadOnly() {
  return (
    <div className="company-info-readonly" aria-label="企业信息详情">
      {displayRows.map((row) => (
        <div className="company-info-row" key={row.label}>
          <span className="company-info-label">{row.label}：</span>
          <span className="company-info-value">{row.value}</span>
        </div>
      ))}

      <div className="company-info-row company-info-row--image">
        <span className="company-info-label">图片：</span>
        <div className="company-info-empty-image" aria-label="暂无图片数据">
          <div className="company-info-empty-box" aria-hidden="true">
            <span />
            <i />
          </div>
          <p>暂无图片数据</p>
        </div>
      </div>
    </div>
  )
}

function CompanyInfoForm() {
  return (
    <form className="company-info-form" aria-label="编辑企业信息">
      <label className="company-info-form-row">
        <span>企业名称：</span>
        <input aria-label="企业名称" value={companyInfo.name} readOnly />
      </label>

      <label className="company-info-form-row company-info-form-row--select">
        <span>企业类型：</span>
        <input aria-label="企业类型" value={companyInfo.type} readOnly />
      </label>

      <label className="company-info-form-row">
        <span>联系电话：</span>
        <input aria-label="联系电话" value={companyInfo.phone} readOnly />
      </label>

      <label className="company-info-form-row company-info-form-row--wide company-info-form-row--select">
        <span>所在城市：</span>
        <input aria-label="所在城市" value={companyInfo.city} placeholder="请选择所在城市" readOnly />
      </label>

      <label className="company-info-form-row company-info-form-row--textarea">
        <span>详细地址：</span>
        <textarea aria-label="详细地址" value={companyInfo.address} placeholder="请输入详细地址(不包括省市区)" readOnly />
      </label>

      <div className="company-info-form-row company-info-form-row--upload">
        <span>图片：</span>
        <button type="button" className="company-info-upload">
          <strong>+</strong>
          上传
        </button>
      </div>
    </form>
  )
}
