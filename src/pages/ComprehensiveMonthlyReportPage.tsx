import { useLocation, useNavigate } from 'react-router-dom'
import './ComprehensiveMonthlyReportPage.css'

const monthlyRows = [
  {
    period: '2026年04月',
    range: '20260401 - 20260430',
    revenue: '21843.69',
    occ: '29.17%',
    adr: '624.11',
    revpar: '182.05',
    generatedAt: '2026-05-01\n09:41:53',
    creator: '系统自动',
    startDate: '2026-04-01',
    endDate: '2026-04-30',
  },
  {
    period: '2026年03月',
    range: '20260301 - 20260331',
    revenue: '27305.34',
    occ: '39.52%',
    adr: '557.25',
    revpar: '220.23',
    generatedAt: '2026-04-01\n09:38:28',
    creator: '系统自动',
    startDate: '2026-03-01',
    endDate: '2026-03-31',
  },
  {
    period: '2026年02月',
    range: '20260201 - 20260228',
    revenue: '21430.66',
    occ: '31.25%',
    adr: '612.3',
    revpar: '191.34',
    generatedAt: '2026-03-01\n09:46:34',
    creator: '系统自动',
    startDate: '2026-02-01',
    endDate: '2026-02-28',
  },
  {
    period: '2026年01月',
    range: '20260101 - 20260131',
    revenue: '19137.88',
    occ: '35.48%',
    adr: '434.95',
    revpar: '154.32',
    generatedAt: '2026-02-01\n09:38:51',
    creator: '系统自动',
    startDate: '2026-01-01',
    endDate: '2026-01-31',
  },
]

const summaryRows = [
  ['房费（含佣）', '', '入住率OCC', ''],
  ['房费（减佣）', '', 'ADR', ''],
  ['佣金', '', '全日房ADR', ''],
  ['其他消费', '', '钟点房ADR', ''],
  ['订单总收入', '', 'REVPAR', ''],
  ['记一笔收入', '', '总开房数', ''],
  ['总营收（含佣）', '', '过夜开房数', ''],
  ['总营收（减佣）', '', '钟点房开房数', ''],
]

const detailColumns = [
  '房费（含佣）',
  '房费（减佣）',
  '佣金',
  '其他消费',
  '记一笔消费',
  '总营收（含佣）',
  '总营收（减佣）',
  '入住率OCC',
  '平均房价ADR',
  '平均客房收益RevPar',
]

export function ComprehensiveMonthlyReportPage() {
  const location = useLocation()

  if (location.pathname.endsWith('/Monthly')) {
    return <ComprehensiveMonthlyDetail />
  }

  return <ComprehensiveMonthlyList />
}

function ComprehensiveMonthlyList() {
  const navigate = useNavigate()

  return (
    <div className="comprehensive-monthly-page">
      <section className="comprehensive-card">
        <header className="comprehensive-card-title">
          <h1>综合月报</h1>
        </header>

        <div className="comprehensive-table-shell">
          <table className="comprehensive-report-table" aria-label="综合月报列表">
            <thead>
              <tr>
                <th>时段</th>
                <th>统计周期</th>
                <th>营业收入</th>
                <th>入住率OCC</th>
                <th>平均房价ADR</th>
                <th>平均客房收益REVPAR</th>
                <th>生成时间</th>
                <th>生成人</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {monthlyRows.map((row) => (
                <tr key={row.period}>
                  <td>{row.period}</td>
                  <td>{row.range}</td>
                  <td>{row.revenue}</td>
                  <td>{row.occ}</td>
                  <td>{row.adr}</td>
                  <td>{row.revpar}</td>
                  <td>{row.generatedAt}</td>
                  <td>{row.creator}</td>
                  <td>
                    <button
                      type="button"
                      className="comprehensive-link-button"
                      onClick={() =>
                        navigate(`/statistics/Comprehensive/Monthly?startDate=${row.startDate}&endDate=${row.endDate}`)
                      }
                    >
                      查看报表
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <nav className="comprehensive-pagination" aria-label="分页">
          <span>第 1-4 条/总共 4 条</span>
          <button type="button" aria-label="上一页" disabled>
            ‹
          </button>
          <button type="button" className="is-current">
            1
          </button>
          <button type="button" aria-label="下一页" disabled>
            ›
          </button>
          <button type="button">20 条/页</button>
        </nav>
      </section>
    </div>
  )
}

function ComprehensiveMonthlyDetail() {
  return (
    <div className="comprehensive-monthly-page comprehensive-monthly-detail-page">
      <section className="comprehensive-card">
        <header className="comprehensive-detail-bar">
          <div className="comprehensive-breadcrumb">
            <span>综合月报 /</span>
            <strong>综合月报表（住宿）</strong>
          </div>
          <div className="comprehensive-detail-actions">
            <button type="button">更新报告</button>
            <button type="button">打 印</button>
          </div>
        </header>

        <section className="comprehensive-detail" aria-label="综合月报固化详情">
          <h1>综合月报表（固化）</h1>
          <div className="comprehensive-meta-row">
            <span>企业/门店：</span>
            <span>
              营业月份：<strong>2026年05月</strong>
            </span>
            <span>
              统计周期：<strong>2026-05-14 ~2026-05-14</strong>
            </span>
            <span>
              生成时间：<strong>2026-05-14 17:39:48</strong>
            </span>
          </div>

          <table className="comprehensive-summary-table">
            <thead>
              <tr>
                <th colSpan={2}>营业数据</th>
                <th colSpan={2}>经营指标</th>
              </tr>
            </thead>
            <tbody>
              {summaryRows.map(([leftLabel, leftValue, rightLabel, rightValue]) => (
                <tr key={`${leftLabel}-${rightLabel}`}>
                  <td>{leftLabel}</td>
                  <td>{leftValue}</td>
                  <td>{rightLabel}</td>
                  <td>{rightValue}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="comprehensive-detail-table-wrap">
            <table className="comprehensive-detail-table">
              <thead>
                <tr>
                  {detailColumns.map((column) => (
                    <th key={column}>{column}</th>
                  ))}
                </tr>
              </thead>
            </table>
            <div className="comprehensive-empty-state">
              <div aria-hidden="true" />
              <strong>暂无数据</strong>
            </div>
          </div>
        </section>
      </section>
    </div>
  )
}
