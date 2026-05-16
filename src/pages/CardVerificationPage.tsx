import { useState } from 'react'
import './CardVerificationPage.css'

const tableColumns = [
  '卡券码',
  '类目',
  '商品名称',
  '卡券名称',
  '用户昵称',
  '用户手机',
  '价格',
  '核销人',
  '核销时间',
  '相关订单',
  '状态',
]

export function CardVerificationPage() {
  const [code, setCode] = useState('')
  const [notice, setNotice] = useState('')

  function submitVerification() {
    const trimmedCode = code.trim()
    setNotice(trimmedCode ? `已输入卡券码：${trimmedCode}` : '请输入卡券码')
  }

  return (
    <div className="card-verify-page">
      <h1 className="sr-only-heading">卡券核销</h1>

      <section className="card-verify-entry" aria-label="卡券核销">
        <input
          value={code}
          placeholder="请输入卡券码"
          onChange={(event) => setCode(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') submitVerification()
          }}
        />
        <button type="button" onClick={submitVerification}>
          核 销
        </button>
      </section>

      {notice ? (
        <div className="card-verify-notice" role="status">
          {notice}
        </div>
      ) : null}

      <section className="card-verify-records" aria-label="核销记录">
        <header className="card-verify-records__head">
          <h2>核销记录</h2>
          <button type="button" onClick={() => setNotice('已触发导出明细')}>
            导出明细
          </button>
        </header>

        <div className="card-verify-table" aria-label="卡券核销记录表格">
          <div className="card-verify-table__head">
            {tableColumns.map((column) => (
              <div key={column}>{column}</div>
            ))}
          </div>
          <div className="card-verify-empty">
            <span className="card-verify-empty__icon" aria-hidden="true" />
            <strong>暂无数据</strong>
          </div>
        </div>
      </section>
    </div>
  )
}
