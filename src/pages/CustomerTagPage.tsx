import { useState } from 'react'
import './CustomerTagPage.css'

const tableColumns = ['标签组', '标签名称', '创建人', '创建时间', '操作']

export function CustomerTagPage() {
  const [tagGroup, setTagGroup] = useState('')
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showAuthDialog, setShowAuthDialog] = useState(false)

  return (
    <div className="customer-tag-page">
      <h1 className="sr-only-heading">客户标签</h1>

      <section className="customer-tag-filter" aria-label="客户标签筛选">
        <label className="customer-tag-field">
          <span>标签组:</span>
          <input
            aria-label="标签组"
            value={tagGroup}
            placeholder="请输入"
            onChange={(event) => setTagGroup(event.target.value)}
          />
        </label>
        <div className="customer-tag-filter__actions">
          <button type="button" className="is-primary" onClick={() => undefined}>
            查 询
          </button>
          <button type="button" onClick={() => setTagGroup('')}>
            重 置
          </button>
        </div>
      </section>

      <div className="customer-tag-toolbar">
        <button type="button" className="is-primary" onClick={() => setShowAuthDialog(true)}>
          同步企微标签
        </button>
        <button type="button" className="is-primary" onClick={() => setShowCreateDialog(true)}>
          新建标签组
        </button>
      </div>

      <section className="customer-tag-table" aria-label="客户标签表格">
        <div className="customer-tag-table__head">
          {tableColumns.map((column) => (
            <div key={column}>{column}</div>
          ))}
        </div>
        <div className="customer-tag-table__body">
          <div className="customer-tag-empty">
            <span className="customer-tag-empty__icon" aria-hidden="true" />
            <p>暂无数据</p>
          </div>
        </div>
      </section>

      {showCreateDialog ? <CreateTagGroupDialog onClose={() => setShowCreateDialog(false)} /> : null}
      {showAuthDialog ? <AuthPromptDialog onClose={() => setShowAuthDialog(false)} /> : null}
    </div>
  )
}

function CreateTagGroupDialog({ onClose }: { onClose: () => void }) {
  const [tagInputs, setTagInputs] = useState<string[]>([])

  return (
    <div className="customer-tag-modal-backdrop">
      <section className="customer-tag-modal" role="dialog" aria-modal="true" aria-label="新建标签组">
        <header>
          <h2>新建标签组</h2>
          <button type="button" aria-label="关闭新建标签组" onClick={onClose}>
            ×
          </button>
        </header>
        <div className="customer-tag-modal__body">
          <label className="customer-tag-dialog-field">
            <span>标签组名称</span>
            <input aria-label="标签组名称" placeholder="请输入标签组名称" />
          </label>
          <div className="customer-tag-dialog-field customer-tag-dialog-tags">
            <span>标签</span>
            <div className="customer-tag-dialog-tags__content">
              {tagInputs.map((value, index) => (
                <input
                  key={index}
                  aria-label={`标签${index + 1}`}
                  value={value}
                  placeholder="请输入标签名称"
                  onChange={(event) =>
                    setTagInputs((current) =>
                      current.map((item, itemIndex) => (itemIndex === index ? event.target.value : item)),
                    )
                  }
                />
              ))}
              <button type="button" onClick={() => setTagInputs((current) => [...current, ''])}>
                + 添加标签
              </button>
            </div>
          </div>
        </div>
        <footer>
          <button type="button" onClick={onClose}>
            取消
          </button>
          <button type="button" className="is-primary" onClick={onClose}>
            确定
          </button>
        </footer>
      </section>
    </div>
  )
}

function AuthPromptDialog({ onClose }: { onClose: () => void }) {
  return (
    <div className="customer-tag-modal-backdrop">
      <section
        className="customer-tag-auth-modal"
        role="dialog"
        aria-modal="true"
        aria-label="企微授权提示"
      >
        <div className="customer-tag-auth-modal__message">
          <span aria-hidden="true">!</span>
          <p>请先前往授权企微再操作</p>
        </div>
        <div className="customer-tag-auth-modal__actions">
          <button type="button" onClick={onClose}>
            我知道了
          </button>
          <button type="button" className="is-primary" onClick={onClose}>
            前往授权
          </button>
        </div>
      </section>
    </div>
  )
}
