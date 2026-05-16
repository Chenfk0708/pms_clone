import { useState } from 'react'
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
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [submitMessage, setSubmitMessage] = useState('')

  function closeDialog() {
    setIsAddOpen(false)
    setSubmitMessage('')
  }

  function submitDialog() {
    setSubmitMessage('请完善必填信息后提交')
  }

  return (
    <div className="psb-page">
      <h1 className="sr-only-heading">PSB公安对接</h1>
      <span className="psb-version">版本号：v4.10.7</span>

      <section className="psb-panel" aria-label="公安登记">
        <header className="psb-panel__head">
          <div>
            <h2>公安登记</h2>
            <p>入住客人登记的信息同步到当地合法监管部门</p>
          </div>
          <button type="button" className="psb-primary-button" onClick={() => setIsAddOpen(true)}>
            新 增
          </button>
        </header>

        <div className="psb-table" role="table" aria-label="公安登记列表">
          <div className="psb-table__head" role="row">
            {tableColumns.map((column) => (
              <div key={column} role="columnheader">
                {column}
              </div>
            ))}
          </div>
          <div className="psb-table__empty" role="row">
            <div role="cell" aria-colspan={tableColumns.length}>
              <span className="psb-empty-icon" aria-hidden="true" />
              <strong>暂无数据</strong>
            </div>
          </div>
        </div>
      </section>

      {isAddOpen ? (
        <AddPsbDialog
          submitMessage={submitMessage}
          onClose={closeDialog}
          onSubmit={submitDialog}
        />
      ) : null}
    </div>
  )
}

function AddPsbDialog({
  submitMessage,
  onClose,
  onSubmit,
}: {
  submitMessage: string
  onClose: () => void
  onSubmit: () => void
}) {
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
            <button type="button" className="psb-select">
              广东旅业系统
            </button>
          </div>

          {addFormFields.map((field) => (
            <div key={field.label} className={`psb-form-row${field.kind === 'textarea' ? ' is-textarea' : ''}`}>
              <span>
                <em>*</em> {field.label}：
              </span>
              {field.kind === 'textarea' ? (
                <textarea aria-label={field.label} placeholder={field.placeholder} />
              ) : field.kind === 'select' ? (
                <button type="button" className="psb-select">
                  {field.placeholder}
                </button>
              ) : (
                <input aria-label={field.label} placeholder={field.placeholder} />
              )}
            </div>
          ))}
          {submitMessage ? <div className="psb-submit-message" role="status">{submitMessage}</div> : null}
        </div>

        <footer className="psb-modal__foot">
          <button type="button" onClick={onClose}>
            取 消
          </button>
          <button type="button" className="is-primary" onClick={onSubmit}>
            确 定
          </button>
        </footer>
      </section>
    </div>
  )
}
