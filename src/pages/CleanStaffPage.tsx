import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  CLEAN_STAFF_LIST_PATH,
  CLEAN_STAFF_PROVIDER,
  CLEAN_STAFF_STORES_PATH,
  createCleanStaffExport,
  createCleanStaffMember,
  createDefaultCleanStaffQuery,
  fetchCleanStaffDashboard,
} from '../services/cleanStaff'
import type {
  CleanStaffDashboard,
  CleanStaffMember,
  CleanStaffQuery,
  CleanStaffScenario,
  CleanStaffStatus,
} from '../services/cleanStaff'
import { StoreSelectControl } from '../components/StoreSelect'
import { useStoreOptions } from '../hooks/useStoreOptions'
import './CleanStaffPage.css'

const defaultQuery = createDefaultCleanStaffQuery()
const statusOptions: Array<{ label: string; value: CleanStaffStatus }> = [
  { label: '全部状态', value: 'all' },
  { label: '在岗', value: 'onDuty' },
  { label: '休息', value: 'offDuty' },
  { label: '请假', value: 'leave' },
]

export function CleanStaffPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [query, setQuery] = useState<CleanStaffQuery>(() => ({
    ...defaultQuery,
    scenario: readScenario(searchParams.get('scenario')),
  }))
  const [draftKeyword, setDraftKeyword] = useState(defaultQuery.keyword)
  const [dashboard, setDashboard] = useState<CleanStaffDashboard | null>(null)
  const [selectedMember, setSelectedMember] = useState<CleanStaffMember | null>(null)
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [feedback, setFeedback] = useState('保洁人员数据已就绪')
  const [refreshKey, setRefreshKey] = useState(0)

  const loadDashboard = useCallback(
    async (signal?: AbortSignal) => {
      setIsLoading(true)
      setError('')
      try {
        const nextDashboard = await fetchCleanStaffDashboard(query, signal)
        setDashboard(nextDashboard)
        setFeedback((current) =>
          current.startsWith('已刷新') ? current : `已同步 ${nextDashboard.pagination.total} 名保洁人员`,
        )
      } catch (loadError) {
        if (loadError instanceof DOMException && loadError.name === 'AbortError') return
        setDashboard(null)
        setError(loadError instanceof Error ? loadError.message : '保洁人员数据加载失败')
      } finally {
        setIsLoading(false)
      }
    },
    [query],
  )

  useEffect(() => {
    const controller = new AbortController()
    const timer = window.setTimeout(() => {
      void loadDashboard(controller.signal)
    }, 0)
    return () => {
      window.clearTimeout(timer)
      controller.abort()
    }
  }, [loadDashboard, refreshKey])

  const requestText = useMemo(() => {
    const requestBody = dashboard?.requestBody ?? {
      campId: query.campId,
      poiId: query.poiId,
      keyword: query.keyword,
      status: query.status === 'all' ? '' : query.status,
      serviceDate: query.serviceDate,
      pageNum: query.pageNum,
      pageSize: query.pageSize,
    }
    return [
      `provider=${CLEAN_STAFF_PROVIDER}`,
      `path=${CLEAN_STAFF_LIST_PATH}`,
      `storesPath=${CLEAN_STAFF_STORES_PATH}`,
      `campId=${requestBody.campId}`,
      `poiId=${requestBody.poiId}`,
      `keyword=${requestBody.keyword}`,
      `status=${requestBody.status}`,
      `serviceDate=${requestBody.serviceDate}`,
      `pageNum=${requestBody.pageNum}`,
      `pageSize=${requestBody.pageSize}`,
    ].join(';')
  }, [dashboard, query])

  const { storeOptions, storeLoading } = useStoreOptions({
    fallbackOptions: (dashboard?.stores ?? [{ id: 'all', name: '全部门店' }]).map((store) => ({
      id: store.id,
      label: store.name,
    })),
  })
  const list = dashboard?.list ?? []
  const summary = dashboard?.summary ?? {
    total: 0,
    onDuty: 0,
    offDuty: 0,
    leave: 0,
    todayTasks: 0,
    completedTasks: 0,
    overdueTasks: 0,
  }

  const applySearch = () => {
    setFeedback('正在查询保洁人员')
    setQuery((current) => ({
      ...current,
      keyword: draftKeyword,
      pageNum: 1,
      scenario: 'success',
    }))
  }

  const resetFilters = () => {
    setDraftKeyword('')
    setQuery({
      ...defaultQuery,
      scenario: 'success',
    })
    setFeedback('筛选条件已重置')
  }

  const refresh = () => {
    setQuery((current) => ({ ...current, scenario: 'success' }))
    setRefreshKey((current) => current + 1)
    setFeedback('已刷新当前保洁人员数据')
  }

  const retry = () => {
    setQuery((current) => ({ ...current, scenario: 'success' }))
    setRefreshKey((current) => current + 1)
  }

  const saveMember = async () => {
    setIsLoading(true)
    try {
      await createCleanStaffMember()
      setIsAddOpen(false)
      setFeedback('已保存成员并同步保洁人员列表')
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : '保存成员失败')
    } finally {
      setIsLoading(false)
    }
  }

  const exportMembers = async () => {
    setIsLoading(true)
    try {
      await createCleanStaffExport(query)
      setFeedback('导出任务已创建，可在下载中心查看')
    } catch (exportError) {
      setError(exportError instanceof Error ? exportError.message : '导出任务创建失败')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="clean-staff-page">
      <header className="clean-staff-hero">
        <div>
          <h1>保洁人员</h1>
          <p>按门店、日期和状态管理保洁人员排班、任务承接与服务质量。</p>
        </div>
        <div className="clean-staff-hero__actions">
          <button type="button" onClick={() => navigate('/cleanManage/cleanTask')} disabled={isLoading}>
            查看保洁任务
          </button>
          <button type="button" onClick={() => navigate('/cleanManage/cleanStatistics')} disabled={isLoading}>
            查看保洁统计
          </button>
        </div>
      </header>

      <section className="clean-staff-panel" aria-label="保洁人员筛选">
        <StoreSelectControl
          className="clean-store-tabs"
          label="门店筛选"
          options={storeOptions.map((store) => ({ id: store.id, name: store.label }))}
          value={query.poiId}
          disabled={isLoading || storeLoading}
          onChange={(storeId) => setQuery((current) => ({ ...current, poiId: storeId, pageNum: 1, scenario: 'success' }))}
        />

        <div className="clean-staff-filters">
          <label>
            <span>日期</span>
            <input
              type="date"
              value={query.serviceDate}
              disabled={isLoading}
              onChange={(event) =>
                setQuery((current) => ({ ...current, serviceDate: event.target.value, pageNum: 1, scenario: 'success' }))
              }
            />
          </label>

          <label>
            <span>保洁状态</span>
            <select
              aria-label="保洁状态"
              value={query.status}
              disabled={isLoading}
              onChange={(event) =>
                setQuery((current) => ({
                  ...current,
                  status: event.target.value as CleanStaffStatus,
                  pageNum: 1,
                  scenario: 'success',
                }))
              }
            >
              {statusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span>搜索</span>
            <input
              type="search"
              placeholder="姓名/手机号"
              value={draftKeyword}
              disabled={isLoading}
              onChange={(event) => setDraftKeyword(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') applySearch()
              }}
            />
          </label>

          <div className="clean-staff-actions">
            <button type="button" className="is-primary" onClick={applySearch} disabled={isLoading}>
              查询
            </button>
            <button type="button" onClick={resetFilters} disabled={isLoading}>
              重置
            </button>
            <button type="button" onClick={refresh} disabled={isLoading}>
              刷新
            </button>
            <button type="button" onClick={exportMembers} disabled={isLoading || list.length === 0}>
              导出
            </button>
            <button type="button" className="is-primary" onClick={() => setIsAddOpen(true)} disabled={isLoading}>
              新增保洁员
            </button>
          </div>
        </div>

        <output data-testid="clean-staff-request" className="clean-staff-request" aria-label="保洁人员请求参数" hidden>
          {requestText}
        </output>
      </section>

      <section className="clean-staff-metrics" aria-label="保洁人员核心指标" aria-busy={isLoading}>
        <MetricCard
          label="在岗保洁员"
          value={`${summary.onDuty} 人`}
          detail={`总人数 ${summary.total} 人`}
          onClick={() => setFeedback('已按在岗保洁员维度聚焦列表')}
        />
        <MetricCard
          label="今日任务"
          value={`${summary.todayTasks} 单`}
          detail={`完成 ${summary.completedTasks} 单`}
          onClick={() => navigate('/cleanManage/cleanTask')}
        />
        <MetricCard
          label="逾期任务"
          value={`${summary.overdueTasks} 单`}
          detail="点击查看待处理任务"
          onClick={() => navigate('/cleanManage/cleanTask')}
        />
        <MetricCard
          label="休息/请假"
          value={`${summary.offDuty + summary.leave} 人`}
          detail="用于排班容量判断"
          onClick={() => setFeedback('已切换到排班容量视图')}
        />
      </section>

      {error ? (
        <section className="clean-staff-error" role="alert">
          <div>
            <strong>保洁人员数据加载失败</strong>
            <span>{error}</span>
          </div>
          <button type="button" onClick={retry}>
            重试
          </button>
        </section>
      ) : (
        <section className="clean-staff-table-card" aria-label="保洁人员数据">
          <div className="clean-staff-table-card__head">
            <div>
              <h2>保洁人员列表</h2>
              <span>{isLoading ? '正在同步数据' : `共 ${dashboard?.pagination.total ?? 0} 名`}</span>
            </div>
            <span className="clean-staff-sync">最近同步：{dashboard?.generatedAt ?? '-'}</span>
          </div>

          <table aria-label="保洁人员列表" className="clean-staff-table">
            <thead>
              <tr>
                <th>姓名</th>
                <th>手机号</th>
                <th>门店</th>
                <th>状态</th>
                <th>房源范围</th>
                <th>今日任务</th>
                <th>完成/逾期</th>
                <th>服务评分</th>
                <th>最后任务</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {list.map((member) => (
                <tr key={member.id} data-testid="clean-staff-row">
                  <td>
                    <strong>{member.name}</strong>
                    <span>{member.role}</span>
                  </td>
                  <td>{member.mobile}</td>
                  <td>{member.storeName}</td>
                  <td>
                    <span className={`clean-staff-status clean-staff-status--${member.status}`}>{member.statusText}</span>
                  </td>
                  <td>{member.roomScope.join('、')}</td>
                  <td>{member.todayTasks}</td>
                  <td>
                    {member.completedTasks}/{member.overdueTasks}
                  </td>
                  <td>{member.rating}</td>
                  <td>{member.lastTaskAt}</td>
                  <td>
                    <button type="button" onClick={() => setSelectedMember(member)}>
                      查看详情
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {!isLoading && list.length === 0 ? (
            <div className="clean-staff-empty">
              <strong>暂无符合条件的保洁人员</strong>
              <span>调整门店、状态或关键词后重新查询。</span>
            </div>
          ) : null}
        </section>
      )}

      <div className="clean-staff-footer">
        <div className="clean-staff-pagination" aria-label="保洁人员分页">
          <button
            type="button"
            disabled={isLoading || query.pageNum <= 1}
            onClick={() => setQuery((current) => ({ ...current, pageNum: Math.max(1, current.pageNum - 1) }))}
          >
            上一页
          </button>
          <span>第 {query.pageNum} 页</span>
          <button
            type="button"
            disabled={isLoading || list.length < query.pageSize}
            onClick={() => setQuery((current) => ({ ...current, pageNum: current.pageNum + 1 }))}
          >
            下一页
          </button>
        </div>
        <div role="status" aria-label="保洁人员操作反馈" className="clean-staff-feedback">
          {isLoading ? '正在处理保洁人员数据' : feedback}
        </div>
      </div>

      {selectedMember ? <DetailDialog member={selectedMember} onClose={() => setSelectedMember(null)} /> : null}
      {isAddOpen ? <AddDialog isSaving={isLoading} onCancel={() => setIsAddOpen(false)} onSave={saveMember} /> : null}
    </div>
  )
}

function MetricCard({
  label,
  value,
  detail,
  onClick,
}: {
  label: string
  value: string
  detail: string
  onClick: () => void
}) {
  return (
    <button type="button" className="clean-staff-metric" onClick={onClick}>
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{detail}</small>
    </button>
  )
}

function DetailDialog({ member, onClose }: { member: CleanStaffMember; onClose: () => void }) {
  return (
    <div className="clean-staff-dialog-backdrop">
      <section className="clean-staff-dialog" role="dialog" aria-modal="true" aria-label={`${member.name} 保洁员详情`}>
        <header>
          <div>
            <h2>{member.name} 保洁员详情</h2>
            <span>{member.storeName}</span>
          </div>
          <button type="button" onClick={onClose} aria-label="关闭详情">
            关闭详情
          </button>
        </header>
        <dl>
          <div>
            <dt>今日任务</dt>
            <dd>{member.todayTasks} 单</dd>
          </div>
          <div>
            <dt>完成任务</dt>
            <dd>{member.completedTasks} 单</dd>
          </div>
          <div>
            <dt>逾期任务</dt>
            <dd>{member.overdueTasks} 单</dd>
          </div>
          <div>
            <dt>服务评分</dt>
            <dd>{member.rating}</dd>
          </div>
        </dl>
        <p>负责房源：{member.roomScope.join('、')}</p>
      </section>
    </div>
  )
}

function AddDialog({
  isSaving,
  onCancel,
  onSave,
}: {
  isSaving: boolean
  onCancel: () => void
  onSave: () => void
}) {
  return (
    <div className="clean-staff-dialog-backdrop">
      <section className="clean-staff-dialog clean-staff-dialog--form" role="dialog" aria-modal="true" aria-label="新增保洁员">
        <header>
          <div>
            <h2>新增保洁员</h2>
            <span>保存后同步到当前保洁人员列表。</span>
          </div>
          <button type="button" onClick={onCancel}>
            取消
          </button>
        </header>
        <label>
          <span>姓名</span>
          <input defaultValue="周敏" />
        </label>
        <label>
          <span>手机号</span>
          <input defaultValue="18612345678" />
        </label>
        <label>
          <span>负责房源</span>
          <input defaultValue="观影大床房、总裁套间" />
        </label>
        <footer>
          <button type="button" onClick={onCancel} disabled={isSaving}>
            取消
          </button>
          <button type="button" className="is-primary" onClick={onSave} disabled={isSaving}>
            保存成员
          </button>
        </footer>
      </section>
    </div>
  )
}

function readScenario(value: string | null): CleanStaffScenario {
  if (value === 'empty' || value === 'error') return value
  return 'success'
}
