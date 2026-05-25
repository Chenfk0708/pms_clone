export const PRINT_SETTING_PROVIDER_KEY = 'pms.printSettingProvider';
export const PRINT_SETTING_MOCK_STATE_KEY = 'pms.printSettingMockState';
export const PRINT_SETTING_MUTATION_STATE_KEY = 'pms.printSettingMutationState';
export const PRINT_SETTING_BOOTSTRAP_ENDPOINT = '/setting/print/bootstrap';
export const PRINT_SETTING_SAVE_ENDPOINT = '/setting/print/save';
const DEFAULT_CAMP_ID = '1796067693589061634';
const DEFAULT_TIMESTAMP = '2026-05-19T19:25:52+08:00';
export class PrintSettingServiceError extends Error {
    provider;
    request;
    response;
    constructor(provider, request, response) {
        super(response.message);
        this.name = 'PrintSettingServiceError';
        this.provider = provider;
        this.request = request;
        this.response = response;
    }
}
const paperOptions = [
    { value: '80mm', label: '小票（80mm）' },
    { value: '58mm', label: '小票（58mm）' },
    { value: 'A4', label: 'A4' },
];
const stayDocumentOptions = [
    { value: 'stay-consume-short', label: '消费明细账单（短租）' },
    { value: 'stay-register-short', label: '住宿登记账单（短租）' },
    { value: 'stay-consume-long', label: '消费明细账单（长租）' },
];
const receiptDocumentOptions = [{ value: 'receipt-default', label: '收款账单' }];
const initialSections = [
    {
        key: 'stay',
        title: '住宿打印',
        ariaLabel: '住宿打印设置',
        paperType: '80mm',
        paperOptions,
        selectedDocument: 'stay-consume-short',
        documentOptions: stayDocumentOptions,
        customText: '请您仔细核对金额，确认无误后签名确认，谢谢!欢迎您再次光临!',
        placeholder: '请填写文案',
    },
    {
        key: 'receipt',
        title: '收款账单',
        ariaLabel: '收款账单设置',
        paperType: 'A4',
        paperOptions,
        selectedDocument: 'receipt-default',
        documentOptions: receiptDocumentOptions,
        customText: '',
        placeholder: '请填写文案',
    },
];
let mockSections = cloneSections(initialSections);
export function resolvePrintSettingRuntimeConfig(location) {
    const searchParams = new URLSearchParams(location.search);
    return {
        provider: normalizeProvider(searchParams.get('printSettingProvider')) ?? readProvider(),
        mockState: normalizeMockState(searchParams.get('printSettingMockState')) ?? readMockState(),
        mutationState: normalizeMutationState(searchParams.get('printSettingMutationState')) ?? readMutationState(),
    };
}
export function createDefaultPrintSettingQuery(runtimeConfig) {
    return {
        campId: DEFAULT_CAMP_ID,
        provider: runtimeConfig.provider,
        mockState: runtimeConfig.mockState,
        mutationState: runtimeConfig.mutationState,
    };
}
export async function loadPrintSettingViewModel(query, signal) {
    const provider = query.provider ?? 'mock';
    const request = buildBootstrapRequest(query);
    await delay(180, signal);
    if (provider === 'api') {
        throw new PrintSettingServiceError(provider, request, createEnvelope('error', 'bootstrap', 503, '打印设置暂时不可用，请稍后重试'));
    }
    if (query.mockState === 'error') {
        throw new PrintSettingServiceError(provider, request, createEnvelope('error', 'bootstrap', 50001, '打印设置加载失败，请稍后重试'));
    }
    const response = query.mockState === 'empty'
        ? createEnvelope('empty', 'bootstrap', 0, 'success', buildPayload([]))
        : createEnvelope('success', 'bootstrap', 0, 'success', buildPayload(mockSections));
    return adaptPrintSettingEnvelope(provider, request, response, query.mockState === 'empty' ? 'empty' : 'success');
}
export async function savePrintSettingSection(query, draft, signal) {
    validateDraft(draft);
    await delay(160, signal);
    const provider = query.provider ?? 'mock';
    const request = {
        campId: query.campId,
        section: draft.key,
        paperType: draft.paperType,
        selectedDocument: draft.selectedDocument,
        customText: draft.customText,
    };
    if (provider === 'api' || query.mutationState === 'error') {
        throw new PrintSettingServiceError(provider, request, createEnvelope('error', 'save', 50011, '打印模板保存失败，请稍后重试'));
    }
    mockSections = mockSections.map((section) => section.key === draft.key
        ? {
            ...section,
            paperType: draft.paperType,
            selectedDocument: draft.selectedDocument,
            customText: draft.customText,
        }
        : section);
    return adaptPrintSettingEnvelope(provider, request, createEnvelope('success', 'save', 0, 'success', buildPayload(mockSections)), 'success');
}
export async function applyDefaultPrintSettingTemplates(query, signal) {
    await delay(140, signal);
    mockSections = cloneSections(initialSections);
    const request = {
        campId: query.campId,
        action: 'apply-default',
    };
    return adaptPrintSettingEnvelope(query.provider ?? 'mock', request, createEnvelope('success', 'save', 0, 'success', buildPayload(mockSections)), 'success');
}
function adaptPrintSettingEnvelope(provider, request, response, state) {
    if (response.code !== 0) {
        throw new PrintSettingServiceError(provider, request, response);
    }
    return {
        provider,
        state,
        endpoint: String(request.section ? PRINT_SETTING_SAVE_ENDPOINT : PRINT_SETTING_BOOTSTRAP_ENDPOINT),
        traceId: response.traceId,
        timestamp: response.timestamp,
        request,
        sections: cloneSections(response.data.sections),
        emptyState: response.data.emptyState,
    };
}
function buildPayload(sections) {
    return {
        sections: cloneSections(sections),
        emptyState: {
            title: '当前还没有可用的打印模板配置',
            description: '请先恢复默认模板，再根据门店业务需要调整纸张、单据和提示文案。',
            actionText: '应用默认模板',
        },
    };
}
function buildBootstrapRequest(query) {
    return {
        campId: query.campId,
        scene: 'print-setting',
    };
}
function createEnvelope(state, action, code, message, data) {
    return {
        code,
        message,
        data: data ?? buildPayload([]),
        traceId: `mock-shezhi--tongyong-shezhi--dayin-shezhi-${action}-${state}-001`,
        timestamp: DEFAULT_TIMESTAMP,
    };
}
function validateDraft(draft) {
    if (!draft.selectedDocument) {
        throw new Error('请选择打印单据');
    }
    if (!draft.customText.trim() && draft.key === 'stay') {
        throw new Error('请填写住宿打印提示文案');
    }
}
function cloneSections(sections) {
    return sections.map((section) => ({
        ...section,
        paperOptions: section.paperOptions.map((option) => ({ ...option })),
        documentOptions: section.documentOptions.map((option) => ({ ...option })),
    }));
}
function delay(ms, signal) {
    return new Promise((resolve, reject) => {
        const timer = window.setTimeout(resolve, ms);
        signal?.addEventListener('abort', () => {
            window.clearTimeout(timer);
            reject(new DOMException('Aborted', 'AbortError'));
        }, { once: true });
    });
}
function normalizeProvider(value) {
    return value === 'api' || value === 'mock' ? value : undefined;
}
function normalizeMockState(value) {
    return value === 'success' || value === 'empty' || value === 'error' ? value : undefined;
}
function normalizeMutationState(value) {
    return value === 'success' || value === 'error' ? value : undefined;
}
function readProvider() {
    if (typeof window === 'undefined')
        return 'mock';
    return normalizeProvider(window.localStorage.getItem(PRINT_SETTING_PROVIDER_KEY)) ?? 'mock';
}
function readMockState() {
    if (typeof window === 'undefined')
        return 'success';
    return normalizeMockState(window.localStorage.getItem(PRINT_SETTING_MOCK_STATE_KEY)) ?? 'success';
}
function readMutationState() {
    if (typeof window === 'undefined')
        return 'success';
    return normalizeMutationState(window.localStorage.getItem(PRINT_SETTING_MUTATION_STATE_KEY)) ?? 'success';
}
