import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  createDefaultStaffListQuery,
  loadStaffListViewModel,
  resolveStaffListRuntimeConfig,
  StaffListServiceError,
  type StaffListMockState,
  type StaffListViewModel,
} from '../services/staffList'
import './StaffListPage.css'

type LoadState =
  | {
      kind: 'loading'
      contract: StaffListContract
    }
  | {
      kind: 'ready'
      data: StaffListViewModel
      contract: StaffListContract
    }
  | {
      kind: 'error'
      message: string
      contract: StaffListContract
    }

type StaffListContract = {
  provider: string
  responseState: 'loading' | 'success' | 'empty' | 'error'
  endpoint: string
  traceId: string
  timestamp: string
  request: Record<string, unknown>
}

const defaultContract: StaffListContract = {
  provider: 'mock',
  responseState: 'loading',
  endpoint: '/customer/staffList/bootstrap',
  traceId: '',
  timestamp: '',
  request: {},
}

export function StaffListPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const runtimeConfig = useMemo(() => resolveStaffListRuntimeConfig({ search: location.search }), [location.search])
  const query = useMemo(() => createDefaultStaffListQuery(runtimeConfig), [runtimeConfig])
  const queryKey = JSON.stringify(query)

  return <StaffListSurface key={queryKey} query={query} navigate={navigate} />
}

function StaffListSurface({
  query,
  navigate,
}: {
  query: ReturnType<typeof createDefaultStaffListQuery>
  navigate: ReturnType<typeof useNavigate>
}) {
  const [reloadKey, setReloadKey] = useState(0)
  const [mockStateOverride, setMockStateOverride] = useState<StaffListMockState | null>(null)
  const [state, setState] = useState<LoadState>({
    kind: 'loading',
    contract: {
      ...defaultContract,
      provider: query.provider ?? 'mock',
    },
  })

  useEffect(() => {
    const abort = new AbortController()
    const requestQuery = mockStateOverride ? { ...query, mockState: mockStateOverride } : query

    loadStaffListViewModel(requestQuery, abort.signal)
      .then((data) => {
        setState({
          kind: 'ready',
          data,
          contract: toContract(data),
        })
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === 'AbortError') return
        setState({
          kind: 'error',
          message: error instanceof Error ? error.message : '企微员工管理订阅信息加载失败',
          contract: toErrorContract(error, query.provider ?? 'mock'),
        })
      })

    return () => abort.abort()
  }, [mockStateOverride, query, reloadKey])

  const contractJson = JSON.stringify(state.contract)
  const viewModel = state.kind === 'ready' ? state.data : null

  return (
    <div className="staff-list-page">
      <pre
        hidden
        data-testid="staff-list-contract"
        data-provider={state.contract.provider}
        data-response-state={state.contract.responseState}
        data-endpoint={state.contract.endpoint}
        data-trace-id={state.contract.traceId}
      >
        {contractJson}
      </pre>

      {state.kind === 'loading' ? (
        <section className="staff-list-state-card" role="status" aria-label="企微员工列表加载中">
          <h1>企微SCRM-员工管理</h1>
          <p>正在加载企微员工管理订阅信息，请稍候。</p>
        </section>
      ) : null}

      {state.kind === 'error' ? (
        <section className="staff-list-state-card staff-list-state-card--error" role="alert" aria-label="企微员工列表错误态">
          <h1>企微员工管理订阅信息加载失败</h1>
          <p>{state.message}</p>
          <button
            type="button"
            onClick={() => {
              window.localStorage.setItem('pms.staffList.mockState', 'success')
              setMockStateOverride('success')
              setState({
                kind: 'loading',
                contract: {
                  ...state.contract,
                  responseState: 'loading',
                },
              })
              setReloadKey((value) => value + 1)
            }}
          >
            重试
          </button>
        </section>
      ) : null}

      {viewModel?.state === 'empty' ? (
        <section className="staff-list-state-card staff-list-state-card--empty" role="status" aria-label="企微员工列表空态">
          <h1>{viewModel.emptyState.title}</h1>
          <p>{viewModel.emptyState.description}</p>
        </section>
      ) : null}

      {viewModel?.state === 'success' ? (
        <section className="staff-subscription-card" aria-label="企微员工列表未开通态">
          <header className="staff-subscription-hero">
            <img src={viewModel.hero.logoSrc} alt="" aria-hidden="true" />
            <div>
              <h1>{viewModel.hero.title}</h1>
              <p>{viewModel.hero.description}</p>
            </div>
            <div className="staff-subscription-action">
              <button
                type="button"
                onClick={() =>
                  navigate(viewModel.routeTargets.paymentDetail, {
                    state: { product: 'scrm', source: '/customer/staffList' },
                  })
                }
              >
                {viewModel.hero.actionText}
              </button>
              <span>{viewModel.hero.badgeText}</span>
            </div>
          </header>

          <section className="staff-product-detail" aria-label="商品详情">
            <h2>{viewModel.detail.title}</h2>
            <div className="staff-product-images">
              {viewModel.detail.images.map((image) => (
                <img key={image.id} src={image.src} alt={image.alt} />
              ))}
            </div>
          </section>
        </section>
      ) : null}
    </div>
  )
}

function toContract(data: StaffListViewModel): StaffListContract {
  return {
    provider: data.provider,
    responseState: data.state,
    endpoint: data.endpoint,
    traceId: data.traceId,
    timestamp: data.timestamp,
    request: data.request,
  }
}

function toErrorContract(error: unknown, provider: string): StaffListContract {
  if (error instanceof StaffListServiceError) {
    return {
      provider: error.provider,
      responseState: 'error',
      endpoint: '/customer/staffList/bootstrap',
      traceId: error.response.traceId,
      timestamp: error.response.timestamp,
      request: error.request,
    }
  }

  return {
    provider,
    responseState: 'error',
    endpoint: '/customer/staffList/bootstrap',
    traceId: '',
    timestamp: '',
    request: {},
  }
}
