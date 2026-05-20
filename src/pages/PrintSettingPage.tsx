import { useEffect, useMemo, useState } from 'react'
import { useLocation } from 'react-router-dom'
import {
  applyDefaultPrintSettingTemplates,
  createDefaultPrintSettingQuery,
  loadPrintSettingViewModel,
  PrintSettingServiceError,
  resolvePrintSettingRuntimeConfig,
  savePrintSettingSection,
  type PrintPaperType,
  type PrintSectionKey,
  type PrintSettingDraft,
  type PrintSettingQuery,
  type PrintSettingViewModel,
} from '../services/printSetting'
import './PrintSettingPage.css'

type ContractState = {
  provider: string
  responseState: 'loading' | 'success' | 'empty' | 'error'
  endpoint: string
  traceId: string
  timestamp: string
  request: Record<string, unknown>
}

type LoadState =
  | { kind: 'loading'; contract: ContractState }
  | { kind: 'ready'; data: PrintSettingViewModel; contract: ContractState }
  | { kind: 'error'; message: string; contract: ContractState }

const defaultContract: ContractState = {
  provider: 'mock',
  responseState: 'loading',
  endpoint: '/setting/print/bootstrap',
  traceId: '',
  timestamp: '',
  request: {},
}

export function PrintSettingPage() {
  const location = useLocation()
  const runtimeConfig = useMemo(() => resolvePrintSettingRuntimeConfig({ search: location.search }), [location.search])
  const query = useMemo(() => createDefaultPrintSettingQuery(runtimeConfig), [runtimeConfig])
  const queryKey = JSON.stringify(query)

  return <PrintSettingSurface key={queryKey} query={query} />
}

function PrintSettingSurface({ query }: { query: PrintSettingQuery }) {
  const [reloadKey, setReloadKey] = useState(0)
  const [loadStateOverride, setLoadStateOverride] = useState<'success' | 'empty' | 'error' | null>(null)
  const [state, setState] = useState<LoadState>({
    kind: 'loading',
    contract: {
      ...defaultContract,
      provider: query.provider ?? 'mock',
      request: query,
    },
  })
  const [feedback, setFeedback] = useState('正在同步打印设置...')
  const [drafts, setDrafts] = useState<Record<PrintSectionKey, PrintSettingDraft>>({
    stay: { key: 'stay', paperType: '80mm', selectedDocument: '', customText: '' },
    receipt: { key: 'receipt', paperType: 'A4', selectedDocument: '', customText: '' },
  })
  const [openDropdown, setOpenDropdown] = useState<PrintSectionKey | null>(null)
  const [savingSection, setSavingSection] = useState<PrintSectionKey | null>(null)

  const requestQuery = useMemo(
    () => ({
      ...query,
      mockState: loadStateOverride ?? query.mockState,
    }),
    [loadStateOverride, query],
  )

  useEffect(() => {
    const abort = new AbortController()
    setState({
      kind: 'loading',
      contract: {
        ...defaultContract,
        provider: requestQuery.provider ?? 'mock',
        request: requestQuery,
      },
    })

    loadPrintSettingViewModel(requestQuery, abort.signal)
      .then((data) => {
        setDrafts(createDraftMap(data))
        setState({
          kind: 'ready',
          data,
          contract: toContract(data),
        })
        setFeedback(data.state === 'empty' ? '当前还没有可用的打印模板配置' : '打印设置已更新')
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === 'AbortError') return

        const message = error instanceof Error ? error.message : '打印设置加载失败，请稍后重试'
        setState({
          kind: 'error',
          message,
          contract: toErrorContract(error, requestQuery),
        })
        setFeedback(message)
      })

    return () => abort.abort()
  }, [reloadKey, requestQuery])

  const contractJson = JSON.stringify(state.contract)
  const readyData = state.kind === 'ready' ? state.data : null

  function updateDraft(sectionKey: PrintSectionKey, patch: Partial<PrintSettingDraft>) {
    setDrafts((current) => ({
      ...current,
      [sectionKey]: {
        ...current[sectionKey],
        ...patch,
      },
    }))
  }

  async function handleSave(sectionKey: PrintSectionKey) {
    setSavingSection(sectionKey)

    try {
      const data = await savePrintSettingSection(query, drafts[sectionKey])
      setState({
        kind: 'ready',
        data,
        contract: toContract(data),
      })
      setFeedback(sectionKey === 'stay' ? '住宿打印配置已保存' : '收款账单配置已保存')
      setOpenDropdown(null)
    } catch (error) {
      const message = error instanceof Error ? error.message : '打印模板保存失败，请稍后重试'
      setFeedback(message)
      setState((current) =>
        current.kind === 'ready'
          ? {
              ...current,
              contract: toErrorContract(error, query, current.data),
            }
          : current,
      )
    } finally {
      setSavingSection(null)
    }
  }

  async function handleApplyDefault() {
    try {
      const data = await applyDefaultPrintSettingTemplates(query)
      setDrafts(createDraftMap(data))
      setState({
        kind: 'ready',
        data,
        contract: toContract(data),
      })
      setFeedback('已恢复默认打印模板')
    } catch (error) {
      const message = error instanceof Error ? error.message : '默认模板恢复失败，请稍后重试'
      setFeedback(message)
    }
  }

  function handleRetry() {
    setLoadStateOverride('success')
    setReloadKey((current) => current + 1)
    setFeedback('正在重新加载打印设置...')
  }

  return (
    <div className="print-setting-page">
      <pre
        hidden
        data-testid="print-setting-service-contract"
        data-provider={state.contract.provider}
        data-response-state={state.contract.responseState}
        data-endpoint={state.contract.endpoint}
      >
        {contractJson}
      </pre>

      <section className="print-setting-shell" aria-label="打印设置">
        <div className="print-setting-feedback" role="status" aria-label="打印设置操作反馈">
          {feedback}
        </div>

        {state.kind === 'error' ? (
          <section className="print-setting-state print-setting-state--error" role="alert" aria-label="打印设置错误状态">
            <h2>打印设置加载失败，请稍后重试</h2>
            <p>{state.message}</p>
            <button type="button" className="print-setting-primary" onClick={handleRetry}>
              重新加载打印设置
            </button>
          </section>
        ) : null}

        {state.kind === 'loading' ? (
          <section className="print-setting-state" role="status" aria-label="打印设置加载中">
            <h2>打印设置加载中</h2>
            <p>正在同步纸张、单据和提示文案配置，请稍候。</p>
          </section>
        ) : null}

        {readyData?.state === 'empty' ? (
          <section className="print-setting-state print-setting-state--empty" aria-label="打印设置空状态">
            <h2>{readyData.emptyState.title}</h2>
            <p>{readyData.emptyState.description}</p>
            <button type="button" className="print-setting-primary" onClick={() => void handleApplyDefault()}>
              {readyData.emptyState.actionText}
            </button>
          </section>
        ) : null}

        {readyData?.state === 'success'
          ? readyData.sections.map((section) => {
              const draft = drafts[section.key]
              const isSaving = savingSection === section.key
              const currentDocument =
                section.documentOptions.find((item) => item.value === draft.selectedDocument)?.label ??
                section.documentOptions[0]?.label ??
                ''

              return (
                <section className="print-setting-section" key={section.key} aria-label={section.ariaLabel}>
                  <h2>{section.title}</h2>
                  <div className="print-setting-card">
                    <fieldset className="print-setting-field">
                      <legend>打印纸张</legend>
                      <div className="print-setting-radio-group">
                        {section.paperOptions.map((option) => (
                          <label className="print-setting-radio" key={option.value}>
                            <input
                              type="radio"
                              name={`${section.key}-paper`}
                              aria-label={option.label}
                              checked={draft.paperType === option.value}
                              onChange={() => updateDraft(section.key, { paperType: option.value as PrintPaperType })}
                            />
                            <span>{option.label}</span>
                          </label>
                        ))}
                      </div>
                    </fieldset>

                    <div className="print-setting-field">
                      <div className="print-setting-label">选择单据</div>
                      <div className="print-setting-select-wrap">
                        <button
                          type="button"
                          className={`print-setting-select${openDropdown === section.key ? ' is-open' : ''}`}
                          aria-haspopup="listbox"
                          aria-expanded={openDropdown === section.key}
                          aria-label={section.key === 'stay' ? '选择住宿打印单据' : '选择收款账单单据'}
                          onClick={() => setOpenDropdown(openDropdown === section.key ? null : section.key)}
                        >
                          <span>{currentDocument}</span>
                          <i aria-hidden="true">▾</i>
                        </button>
                        {openDropdown === section.key ? (
                          <ul
                            className="print-setting-options"
                            role="listbox"
                            aria-label={section.key === 'stay' ? '住宿打印单据选项' : '收款账单单据选项'}
                          >
                            {section.documentOptions.map((option) => (
                              <li
                                key={option.value}
                                role="option"
                                aria-selected={draft.selectedDocument === option.value}
                                tabIndex={0}
                                onClick={() => {
                                  updateDraft(section.key, { selectedDocument: option.value })
                                  setOpenDropdown(null)
                                }}
                              >
                                {option.label}
                              </li>
                            ))}
                          </ul>
                        ) : null}
                      </div>
                    </div>

                    <div className="print-setting-field print-setting-field--text">
                      <label htmlFor={`${section.key}-custom-text`}>自定义提示文案</label>
                      <textarea
                        id={`${section.key}-custom-text`}
                        aria-label="自定义提示文案"
                        placeholder={section.placeholder}
                        value={draft.customText}
                        onChange={(event) => updateDraft(section.key, { customText: event.target.value })}
                      />
                    </div>

                    <div className="print-setting-actions">
                      <button
                        type="button"
                        className="print-setting-primary"
                        aria-label={section.key === 'stay' ? '保存住宿打印配置' : '保存收款账单配置'}
                        disabled={isSaving}
                        onClick={() => void handleSave(section.key)}
                      >
                        {isSaving ? '保存中...' : '保 存'}
                      </button>
                    </div>
                  </div>
                </section>
              )
            })
          : null}
      </section>
    </div>
  )
}

function createDraftMap(data: PrintSettingViewModel): Record<PrintSectionKey, PrintSettingDraft> {
  const draftMap = data.sections.reduce<Record<PrintSectionKey, PrintSettingDraft>>(
    (current, section) => ({
      ...current,
      [section.key]: {
        key: section.key,
        paperType: section.paperType,
        selectedDocument: section.selectedDocument,
        customText: section.customText,
      },
    }),
    {} as Record<PrintSectionKey, PrintSettingDraft>,
  )

  return {
    stay: draftMap.stay ?? { key: 'stay', paperType: '80mm', selectedDocument: '', customText: '' },
    receipt: draftMap.receipt ?? { key: 'receipt', paperType: 'A4', selectedDocument: '', customText: '' },
  }
}

function toContract(data: PrintSettingViewModel): ContractState {
  return {
    provider: data.provider,
    responseState: data.state,
    endpoint: data.endpoint,
    traceId: data.traceId,
    timestamp: data.timestamp,
    request: data.request,
  }
}

function toErrorContract(
  error: unknown,
  query: PrintSettingQuery,
  previousData?: PrintSettingViewModel,
): ContractState {
  if (error instanceof PrintSettingServiceError) {
    return {
      provider: error.provider,
      responseState: 'error',
      endpoint: previousData?.endpoint ?? '/setting/print/bootstrap',
      traceId: error.response.traceId,
      timestamp: error.response.timestamp,
      request: error.request,
    }
  }

  return {
    provider: query.provider ?? 'mock',
    responseState: 'error',
    endpoint: previousData?.endpoint ?? '/setting/print/bootstrap',
    traceId: '',
    timestamp: '',
    request: query,
  }
}
