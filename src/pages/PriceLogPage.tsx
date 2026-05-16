import { useState } from 'react'
import type { FormEvent } from 'react'
import './PriceLogPage.css'

const columns = ['房型', '价格日期', '操作内容', '调整方式', '同步渠道', '渠道价格', '操作人', '操作时间']
const adjustmentOptions = ['手动调整', '系统调整']
const channelOptions = [
  '自来客',
  '路客云聚合',
  '美团民宿',
  '美团酒店',
  '途家',
  '途家直连',
  '爱彼迎',
  '飞猪淘酒店',
  '飞猪民宿直连',
  '飞猪酒店直连',
]

export function PriceLogPage() {
  const [keyword, setKeyword] = useState('')
  const [adjustmentMode, setAdjustmentMode] = useState('手动调整')
  const [channel, setChannel] = useState('')
  const [expanded, setExpanded] = useState(false)
  const [openSelect, setOpenSelect] = useState<'adjustment' | 'channel' | null>(null)
  const [adjustmentStart, setAdjustmentStart] = useState('')
  const [adjustmentEnd, setAdjustmentEnd] = useState('')
  const [operationStart, setOperationStart] = useState('')
  const [operationEnd, setOperationEnd] = useState('')
  const [operator, setOperator] = useState('')

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setOpenSelect(null)
  }

  function handleReset() {
    setKeyword('')
    setAdjustmentMode('手动调整')
    setChannel('')
    setAdjustmentStart('')
    setAdjustmentEnd('')
    setOperationStart('')
    setOperationEnd('')
    setOperator('')
    setOpenSelect(null)
  }

  return (
    <div className="price-log-page">
      <section className="price-log-panel">
        <form className={`price-log-query${expanded ? ' is-expanded' : ''}`} aria-label="调价日志筛选" onSubmit={handleSubmit}>
          <label className="price-log-field price-log-field--keyword">
            <span>日志关键词</span>
            <input
              type="text"
              placeholder="搜索房型名称/房间号/渠道房源名称"
              value={keyword}
              onChange={(event) => setKeyword(event.target.value)}
            />
          </label>

          <div className="price-log-field price-log-field--adjustment">
            <span>调整方式</span>
            <div className="price-log-select">
              <button
                type="button"
                aria-haspopup="listbox"
                aria-label={`调整方式 ${adjustmentMode}`}
                aria-expanded={openSelect === 'adjustment'}
                onClick={() => setOpenSelect(openSelect === 'adjustment' ? null : 'adjustment')}
              >
                {adjustmentMode}
              </button>
              {openSelect === 'adjustment' ? (
                <div className="price-log-options" role="listbox" aria-label="调整方式">
                  {adjustmentOptions.map((option) => (
                    <button
                      type="button"
                      role="option"
                      aria-selected={option === adjustmentMode}
                      key={option}
                      onClick={() => {
                        setAdjustmentMode(option)
                        setOpenSelect(null)
                      }}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
          </div>

          <div className="price-log-field price-log-field--channel">
            <span>渠道</span>
            <div className="price-log-select">
              <button
                type="button"
                aria-haspopup="listbox"
                aria-label={`渠道 ${channel || '请选择'}`}
                aria-expanded={openSelect === 'channel'}
                onClick={() => setOpenSelect(openSelect === 'channel' ? null : 'channel')}
              >
                {channel || '请选择'}
              </button>
              {openSelect === 'channel' ? (
                <div className="price-log-options price-log-options--channel" role="listbox" aria-label="渠道">
                  {channelOptions.map((option) => (
                    <button
                      type="button"
                      role="option"
                      aria-selected={option === channel}
                      key={option}
                      onClick={() => {
                        setChannel(option)
                        setOpenSelect(null)
                      }}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
          </div>

          {expanded ? (
            <>
              <label className="price-log-field price-log-field--date price-log-field--adjust-time">
                <span>调整时间</span>
                <div className="price-log-date-range" role="group" aria-label="调整时间">
                  <input
                    aria-label="调整时间开始"
                    type="text"
                    placeholder="请选择"
                    value={adjustmentStart}
                    onChange={(event) => setAdjustmentStart(event.target.value)}
                  />
                  <span aria-hidden="true">→</span>
                  <input
                    aria-label="调整时间结束"
                    type="text"
                    placeholder="请选择"
                    value={adjustmentEnd}
                    onChange={(event) => setAdjustmentEnd(event.target.value)}
                  />
                </div>
              </label>

              <label className="price-log-field price-log-field--date price-log-field--operation-date">
                <span>操作日期</span>
                <div className="price-log-date-range" role="group" aria-label="操作日期">
                  <input
                    aria-label="操作日期开始"
                    type="text"
                    placeholder="请选择"
                    value={operationStart}
                    onChange={(event) => setOperationStart(event.target.value)}
                  />
                  <span aria-hidden="true">→</span>
                  <input
                    aria-label="操作日期结束"
                    type="text"
                    placeholder="请选择"
                    value={operationEnd}
                    onChange={(event) => setOperationEnd(event.target.value)}
                  />
                </div>
              </label>

              <label className="price-log-field price-log-field--operator">
                <span>操作人姓名</span>
                <input
                  aria-label="操作人姓名"
                  type="text"
                  placeholder="搜索操作人名称/手机号"
                  value={operator}
                  onChange={(event) => setOperator(event.target.value)}
                />
              </label>
            </>
          ) : null}

          <div className="price-log-query__actions">
            <button type="button" onClick={handleReset}>
              重 置
            </button>
            <button type="submit" className="is-primary">
              查 询
            </button>
            <button
              type="button"
              className="is-link"
              onClick={() => {
                setExpanded((value) => !value)
                setOpenSelect(null)
              }}
            >
              {expanded ? '收起' : '展开'}
            </button>
          </div>
        </form>

        <div className="price-log-table">
          <div className="price-log-table__head">
            {columns.map((column) => (
              <div key={column}>{column}</div>
            ))}
          </div>
          <div className="price-log-empty">
            <div className="price-log-empty__icon" aria-hidden="true" />
            <span>暂无数据</span>
          </div>
        </div>
      </section>
    </div>
  )
}
