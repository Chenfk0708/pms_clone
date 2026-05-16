import { useState } from 'react'
import './DistributionListPage.css'

type DistributionTab = 'distributed' | 'undistributed'

const actionButtons = ['提现教程', '房态管理', '房价管理', '房型管理', '分销配置']

export function DistributionListPage() {
  const [tab, setTab] = useState<DistributionTab>('distributed')
  const [notice, setNotice] = useState('')
  const [showImportMenu, setShowImportMenu] = useState(false)

  const selectTab = (nextTab: DistributionTab) => {
    setTab(nextTab)
    setNotice('')
    setShowImportMenu(false)
  }

  return (
    <div className="distribution-list-page">
      <div className="distribution-list-tabs" role="group" aria-label="分销状态">
        <button
          type="button"
          className={tab === 'distributed' ? 'is-active' : ''}
          onClick={() => selectTab('distributed')}
        >
          已分销
        </button>
        <button
          type="button"
          className={tab === 'undistributed' ? 'is-active' : ''}
          onClick={() => selectTab('undistributed')}
        >
          未分销
        </button>
      </div>

      {tab === 'distributed' ? (
        <section className="distribution-panel distribution-panel--distributed" aria-label="已分销操作">
          <div className="distribution-panel__actions">
            {actionButtons.map((label, index) => (
              <button
                key={label}
                type="button"
                className={index === 0 ? 'is-outline' : 'is-primary'}
                onClick={() => setNotice(`${label}入口已打开`)}
              >
                {label}
              </button>
            ))}
          </div>
          <div className="distribution-blank" aria-hidden="true" />
        </section>
      ) : (
        <section className="distribution-panel" aria-label="未分销列表">
          <div className="distribution-toolbar">
            <div className="distribution-store-filter" aria-label="门店筛选">
              <span>全部门店</span>
              <button type="button">天落会宿公寓(前海壹方城宝安中心店)</button>
            </div>
            <div className="distribution-panel__actions">
              <button type="button" className="is-primary" onClick={() => setNotice('已触发一键上架')}>
                一键上架
              </button>
              <div className="distribution-dropdown">
                <button
                  type="button"
                  className="is-primary"
                  aria-expanded={showImportMenu}
                  onClick={() => setShowImportMenu((value) => !value)}
                >
                  渠道导入完善
                </button>
                {showImportMenu ? (
                  <div className="distribution-dropdown__menu" role="menu">
                    <button type="button" role="menuitem" onClick={() => setNotice('已选择 OTA 导入完善')}>
                      OTA 导入完善
                    </button>
                    <button type="button" role="menuitem" onClick={() => setNotice('已选择 模板导入完善')}>
                      模板导入完善
                    </button>
                  </div>
                ) : null}
              </div>
            </div>
          </div>

          <div className="distribution-table-wrap">
            <table className="distribution-table" aria-label="未分销房型表">
              <colgroup>
                <col className="distribution-table__select" />
                <col />
                <col />
                <col className="distribution-table__actions" />
              </colgroup>
              <thead>
                <tr>
                  <th>
                    <input type="checkbox" aria-label="Select all" />
                  </th>
                  <th>房型</th>
                  <th>原因</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                <tr className="distribution-empty-row">
                  <td colSpan={4}>
                    <div className="distribution-empty">
                      <span aria-hidden="true" />
                      <p>暂无数据</p>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      )}

      {notice ? (
        <div className="distribution-toast" role="status">
          {notice}
        </div>
      ) : null}
    </div>
  )
}
