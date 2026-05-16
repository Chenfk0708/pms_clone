import { useEffect, useState } from 'react'
import './MemberEquityPage.css'

const tableColumns = ['展示名称', '权益图标', '权益简介', '操作']

export function MemberEquityPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isSorting, setIsSorting] = useState(false)
  const [notice, setNotice] = useState('')

  useEffect(() => {
    if (!isDialogOpen) return undefined

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsDialogOpen(false)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isDialogOpen])

  function saveSort() {
    setNotice('memberBenefitSeqs:不能为空')
  }

  return (
    <div className="member-equity-page">
      <section className="member-equity-panel" aria-label="会员权益管理">
        <header className="member-equity-panel__header">
          <div>
            <h1>权益列表</h1>
            <p>可以在此处配置所需的会员权益</p>
          </div>
          <div className="member-equity-actions">
            <button type="button" className="member-equity-button is-primary" onClick={() => setIsDialogOpen(true)}>
              添 加
            </button>
            <button
              type="button"
              className="member-equity-button is-primary"
              onClick={() => (isSorting ? saveSort() : setIsSorting(true))}
            >
              {isSorting ? '保存排序' : '排 序'}
            </button>
          </div>
        </header>

        {isSorting ? <div className="member-equity-sort-tip">拖动列表项排序</div> : null}
        {notice ? (
          <div className="member-equity-notice" role="status">
            {notice}
          </div>
        ) : null}

        <table className="member-equity-table" aria-label="会员权益列表">
          <thead>
            <tr>
              {tableColumns.map((column) => (
                <th key={column}>{column}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr>
              <td colSpan={tableColumns.length}>
                <div className="member-equity-empty">
                  <span aria-hidden="true" />
                  <strong>暂无数据</strong>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </section>

      {isDialogOpen ? (
        <div className="member-equity-modal-backdrop" role="presentation">
          <section className="member-equity-modal" role="dialog" aria-modal="true" aria-labelledby="member-equity-modal-title">
            <header>
              <h2 id="member-equity-modal-title">新增权益</h2>
              <button type="button" aria-label="Close" onClick={() => setIsDialogOpen(false)}>
                ×
              </button>
            </header>
            <form className="member-equity-form">
              <label>
                <span>权益名称</span>
                <input type="text" placeholder="请输入权益名称" />
              </label>
              <label>
                <span>权益图标</span>
                <button type="button" className="member-equity-upload">
                  + 添加图标
                </button>
              </label>
              <label>
                <span>权益简介</span>
                <textarea placeholder="请输入权益简介" />
              </label>
            </form>
            <footer>
              <button type="button" onClick={() => setIsDialogOpen(false)}>
                取 消
              </button>
              <button type="button" className="is-primary">
                提 交
              </button>
            </footer>
          </section>
        </div>
      ) : null}
    </div>
  )
}
