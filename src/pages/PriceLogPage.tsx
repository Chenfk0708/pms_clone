import { useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { fetchPriceLogEvidence } from '../services/priceLogs'
import type { PriceLogEvidence, PriceLogEvidenceQuery } from '../services/priceLogs'
import './PriceLogPage.css'

const columns = ['房型', '价格日期', '操作内容', '调整方式', '同步渠道', '渠道价格', '操作人', '操作时间']
const adjustmentOptions = ['手动调整', '系统调整']
const channelOptions = [
  { label: '自来客', apiValue: '0' },
  { label: '路客云聚合', apiValue: '17' },
  { label: '美团民宿', apiValue: '3' },
  { label: '美团酒店', apiValue: '6' },
  { label: '途家', apiValue: '2' },
  { label: '途家直连', apiValue: '49' },
  { label: '爱彼迎', apiValue: '1' },
  { label: '飞猪淘酒店', apiValue: '8' },
  { label: '飞猪民宿直连', apiValue: '59' },
  { label: '飞猪酒店直连', apiValue: '60' },
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
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState('请设置筛选条件后查询调价日志')
  const [error, setError] = useState('')
  const [evidence, setEvidence] = useState<PriceLogEvidence | null>(null)
  const [lastQuery, setLastQuery] = useState<PriceLogEvidenceQuery | null>(null)

  const campId = useMemo(() => resolveCampId(), [])

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setOpenSelect(null)
    void runQuery()
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
    setError('')
    setEvidence(null)
    setLastQuery(null)
    setMessage('筛选条件已重置')
  }

  async function runQuery(query = buildQuery()) {
    if (!query) {
      setError('缺少门店上下文 campId，无法发起真实调价日志取证请求。请从项目带门店上下文的入口进入，或在 URL query 中提供 campId。')
      setMessage('调价日志请求被阻塞')
      setEvidence(null)
      return
    }

    setIsLoading(true)
    setError('')
    setMessage('正在请求目标站已取证的调价日志上下文接口...')
    setLastQuery(query)

    try {
      const nextEvidence = await fetchPriceLogEvidence(query)
      setEvidence(nextEvidence)
      setMessage(
        `已完成真实取证请求：渠道 ${nextEvidence.channels.length} 个，房型 ${nextEvidence.roomCategories.length} 个；目标站本次未触发调价日志列表接口，保持空态并记录为阻塞`,
      )
    } catch (requestError) {
      setEvidence(null)
      setError(
        `真实接口请求失败：${requestError instanceof Error ? requestError.message : String(requestError)}。这通常表示登录态、CORS 或后端接口不可达阻塞。`,
      )
      setMessage('调价日志请求失败')
    } finally {
      setIsLoading(false)
    }
  }

  function retryLastQuery() {
    void runQuery(lastQuery ?? buildQuery())
  }

  function buildQuery(): PriceLogEvidenceQuery | null {
    if (!campId) return null

    const selectedChannel = channelOptions.find((option) => option.label === channel)
    return {
      campId,
      keyword: keyword.trim(),
      channelId: selectedChannel?.apiValue ?? '',
    }
  }

  return (
    <div className="price-log-page">
      <section className="price-log-panel">
        <form className={`price-log-query${expanded ? ' is-expanded' : ''}`} aria-label="调价日志筛选" onSubmit={handleSubmit}>
          <label className="price-log-field price-log-field--keyword">
            <span>日志关键词</span>
            <input
              type="text"
              aria-label="日志关键词"
              placeholder="搜索房型名称/房间号/渠道房源名称"
              value={keyword}
              onChange={(event) => setKeyword(event.target.value)}
              disabled={isLoading}
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
                disabled={isLoading}
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
                disabled={isLoading}
              >
                {channel || '请选择'}
              </button>
              {openSelect === 'channel' ? (
                <div className="price-log-options price-log-options--channel" role="listbox" aria-label="渠道">
                  {channelOptions.map((option) => (
                    <button
                      type="button"
                      role="option"
                      aria-selected={option.label === channel}
                      key={option.label}
                      onClick={() => {
                        setChannel(option.label)
                        setOpenSelect(null)
                      }}
                    >
                      {option.label}
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
                    disabled={isLoading}
                  />
                  <span aria-hidden="true">→</span>
                  <input
                    aria-label="调整时间结束"
                    type="text"
                    placeholder="请选择"
                    value={adjustmentEnd}
                    onChange={(event) => setAdjustmentEnd(event.target.value)}
                    disabled={isLoading}
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
                    disabled={isLoading}
                  />
                  <span aria-hidden="true">→</span>
                  <input
                    aria-label="操作日期结束"
                    type="text"
                    placeholder="请选择"
                    value={operationEnd}
                    onChange={(event) => setOperationEnd(event.target.value)}
                    disabled={isLoading}
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
                  disabled={isLoading}
                />
              </label>
            </>
          ) : null}

          <div className="price-log-query__actions">
            <button type="button" onClick={handleReset} disabled={isLoading}>
              重 置
            </button>
            <button type="submit" className="is-primary" disabled={isLoading}>
              {isLoading ? '查询中' : '查 询'}
            </button>
            <button
              type="button"
              className="is-link"
              disabled={isLoading}
              onClick={() => {
                setExpanded((value) => !value)
                setOpenSelect(null)
              }}
            >
              {expanded ? '收起' : '展开'}
            </button>
          </div>
        </form>

        <div className="price-log-table" aria-busy={isLoading}>
          <div className="price-log-table__head">
            {columns.map((column) => (
              <div key={column}>{column}</div>
            ))}
          </div>
          <div className="price-log-empty">
            <div className="price-log-empty__icon" aria-hidden="true" />
            <span>{isLoading ? '正在加载' : '暂无数据'}</span>
          </div>
        </div>

        <div className="price-log-feedback" role="status" aria-live="polite">
          {message}
          {evidence ? <span>；已接入接口 {evidence.requests.length} 个</span> : null}
        </div>

        {error ? (
          <div className="price-log-error" role="alert">
            <span>{error}</span>
            <button type="button" onClick={retryLastQuery} disabled={isLoading}>
              重试
            </button>
          </div>
        ) : null}
      </section>
    </div>
  )
}

function resolveCampId() {
  const params = new URLSearchParams(window.location.search)
  const queryCampId = params.get('campId')
  if (queryCampId) return queryCampId

  for (const key of ['currentCamp', 'camp', 'pms.currentCamp']) {
    const rawValue = window.localStorage.getItem(key)
    if (!rawValue) continue

    try {
      const parsed = JSON.parse(rawValue) as { campId?: unknown; id?: unknown }
      const campId = parsed.campId ?? parsed.id
      if (typeof campId === 'string' && campId) return campId
      if (typeof campId === 'number') return String(campId)
    } catch {
      if (/^\d+$/.test(rawValue)) return rawValue
    }
  }

  return ''
}
