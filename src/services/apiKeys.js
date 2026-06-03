const HUDSON_BASE_URL = '/api';
export const API_KEYS_GET_PATH = '/user/secret/get';
export const API_KEYS_GENERATE_PATH = '/user/secret/generate';
const API_KEYS_PROVIDER_KEY = 'pms.apiKeys.provider';
const API_KEYS_FETCH_STATE_KEY = 'pms.apiKeys.mockState';
const API_KEYS_GENERATE_STATE_KEY = 'pms.apiKeys.generateMockState';
const API_KEYS_LAST_REQUEST_KEY = 'pms.apiKeys.lastRequest';
const API_KEYS_GENERATION_COUNTER_KEY = 'pms.apiKeys.generationCounter';
const DEFAULT_MOCK_CAMP_ID = '1796067693589061634';
export function resolveApiKeysProviderName() {
    if (typeof window === 'undefined')
        return 'mock';
    return normalizeProviderValue(window.localStorage.getItem(API_KEYS_PROVIDER_KEY)) === 'api' ? 'api' : 'mock';
}
export function resolveApiKeysQuery(search) {
    const params = new URLSearchParams(search);
    const state = params.get('mockState');
    return {
        mockState: state === 'success' || state === 'empty' || state === 'error' ? state : undefined,
    };
}
export function resolveApiKeysCampId() {
    if (typeof window === 'undefined')
        return DEFAULT_MOCK_CAMP_ID;
    const fromQuery = new URLSearchParams(window.location.search).get('campId');
    const fromStorage = window.localStorage.getItem('pmsCampId');
    const fromEnv = import.meta.env.VITE_PMS_CAMP_ID;
    return fromQuery || fromStorage || fromEnv || DEFAULT_MOCK_CAMP_ID;
}
export async function fetchApiKeysPageData(overrides = {}) {
    const provider = overrides.provider ?? resolveApiKeysProviderName();
    const requestBody = {
        campId: overrides.campId ?? resolveApiKeysCampId(),
    };
    if (provider === 'api') {
        const response = await fetch(`${HUDSON_BASE_URL}${API_KEYS_GET_PATH}`, {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify(requestBody),
        });
        const payload = (await response.json());
        if (!response.ok || payload.success === false) {
            throw new Error(payload.errorMsg || 'API keys 加载失败，请稍后重试');
        }
        return adaptHudsonPayload('get', provider, requestBody, payload.data, payload.traceId, payload.timestamp);
    }
    const state = overrides.mockState ?? resolveFetchMockState();
    const envelope = await fetchMockApiKeysEnvelope('get', state);
    return adaptEnvelope('get', provider, requestBody, envelope, state);
}
export async function generateApiKeys(overrides = {}) {
    const provider = overrides.provider ?? resolveApiKeysProviderName();
    const requestBody = {
        campId: overrides.campId ?? resolveApiKeysCampId(),
    };
    if (provider === 'api') {
        const response = await fetch(`${HUDSON_BASE_URL}${API_KEYS_GENERATE_PATH}`, {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify(requestBody),
        });
        const payload = (await response.json());
        if (!response.ok || payload.success === false) {
            throw new Error(payload.errorMsg || 'API keys 生成失败，请稍后重试');
        }
        return adaptHudsonPayload('generate', provider, requestBody, payload.data, payload.traceId, payload.timestamp);
    }
    const envelope = await fetchMockApiKeysEnvelope('generate', resolveGenerateMockState());
    return adaptEnvelope('generate', provider, requestBody, envelope, 'success');
}
function adaptHudsonPayload(action, provider, requestBody, payload, traceId, timestamp) {
    const data = normalizeApiKeysPayload(payload);
    return buildPageData({
        provider,
        action,
        state: data.keyRecord ? 'success' : 'empty',
        endpoint: `${HUDSON_BASE_URL}${action === 'get' ? API_KEYS_GET_PATH : API_KEYS_GENERATE_PATH}`,
        requestBody,
        keyRecord: data.keyRecord,
        activityLog: data.activityLog,
        traceId: traceId || `api-shezhi--qiye-shezhi--api-keys-${action}-${data.keyRecord ? 'success' : 'empty'}`,
        timestamp: timestamp || new Date().toISOString(),
    });
}
function normalizeApiKeysPayload(payload) {
    if (payload === '' || payload === null || payload === undefined) {
        return { keyRecord: null, activityLog: [] };
    }
    if (!isRecord(payload)) {
        throw new Error('API keys real response is invalid: data must be an object');
    }
    return {
        keyRecord: normalizeApiKeyRecord(payload.keyRecord),
        activityLog: normalizeApiKeysActivities(payload.activityLog),
    };
}
function normalizeApiKeyRecord(value) {
    if (value === null || value === undefined || value === '')
        return null;
    if (!isRecord(value)) {
        throw new Error('API keys real response is invalid: keyRecord must be an object');
    }
    return {
        appId: readRequiredString(value.appId, 'keyRecord.appId'),
        accessKeyId: readRequiredString(value.accessKeyId, 'keyRecord.accessKeyId'),
        secretKeyPreview: readRequiredString(value.secretKeyPreview, 'keyRecord.secretKeyPreview'),
        createdAt: readRequiredString(value.createdAt, 'keyRecord.createdAt'),
        lastUsedAt: readDisplayString(value.lastUsedAt, 'Not used yet'),
        rotationTip: readDisplayString(value.rotationTip, 'Rotate regularly'),
        status: readActiveStatus(value.status),
        scopes: normalizeStringArray(value.scopes, 'keyRecord.scopes'),
    };
}
function normalizeApiKeysActivities(value) {
    if (value === null || value === undefined)
        return [];
    if (!Array.isArray(value)) {
        throw new Error('API keys real response is invalid: activityLog must be an array');
    }
    return value.map((item, index) => {
        if (!isRecord(item)) {
            throw new Error(`API keys real response is invalid: activityLog[${index}] must be an object`);
        }
        return {
            id: readRequiredString(item.id, `activityLog[${index}].id`),
            title: readRequiredString(item.title, `activityLog[${index}].title`),
            detail: readRequiredString(item.detail, `activityLog[${index}].detail`),
            occurredAt: readDisplayString(item.occurredAt, ''),
        };
    });
}
function normalizeStringArray(value, fieldName) {
    if (!Array.isArray(value)) {
        throw new Error(`API keys real response is invalid: ${fieldName} must be an array`);
    }
    return value.map((item, index) => readRequiredString(item, `${fieldName}[${index}]`));
}
function readRequiredString(value, fieldName) {
    if (typeof value === 'number')
        return String(value);
    if (typeof value === 'string' && value.trim())
        return value.trim();
    throw new Error(`API keys real response is invalid: ${fieldName} is required`);
}
function readDisplayString(value, fallback) {
    if (typeof value === 'number')
        return String(value);
    if (typeof value === 'string' && value.trim())
        return value.trim();
    return fallback;
}
function readActiveStatus(value) {
    const status = readRequiredString(value, 'keyRecord.status');
    if (status !== 'active') {
        throw new Error(`API keys real response has unsupported keyRecord.status=${status}`);
    }
    return 'active';
}
function isRecord(value) {
    return value !== null && typeof value === 'object' && !Array.isArray(value);
}
async function fetchMockApiKeysEnvelope(action, state) {
    await delay(160);
    if (state === 'error') {
        return {
            code: 50001,
            message: action === 'get' ? 'API keys 加载失败，请稍后重试' : 'API keys 生成失败，请稍后重试',
            data: {
                keyRecord: null,
                activityLog: [],
            },
            traceId: `mock-shezhi--qiye-shezhi--api-keys-${action}-error-001`,
            timestamp: '2026-05-19T10:00:00+08:00',
        };
    }
    if (action === 'get' && state === 'empty') {
        return {
            code: 0,
            message: 'success',
            data: {
                keyRecord: null,
                activityLog: [],
            },
            traceId: 'mock-shezhi--qiye-shezhi--api-keys-get-empty-001',
            timestamp: '2026-05-19T10:00:00+08:00',
        };
    }
    const version = nextGenerationVersion(action === 'get' ? 'peek' : 'increment');
    const keyRecord = createMockKeyRecord(version);
    return {
        code: 0,
        message: 'success',
        data: {
            keyRecord,
            activityLog: [
                {
                    id: `activity-${version}`,
                    title: action === 'generate' ? '已生成新的 API keys' : '最近一次密钥巡检完成',
                    detail: action === 'generate'
                        ? '请同步更新 Locals AI 服务端配置。'
                        : '当前凭证状态正常，可继续用于 Locals AI 服务端接入。',
                    occurredAt: keyRecord.createdAt,
                },
                {
                    id: `rotation-${version}`,
                    title: '建议每 90 天轮换一次',
                    detail: '若已在多个服务端节点接入，请在切换窗口内完成更新。',
                    occurredAt: '2026-05-19 09:45',
                },
            ],
        },
        traceId: `mock-shezhi--qiye-shezhi--api-keys-${action}-success-${String(version).padStart(3, '0')}`,
        timestamp: '2026-05-19T10:00:00+08:00',
    };
}
function adaptEnvelope(action, provider, requestBody, envelope, state) {
    if (envelope.code !== 0) {
        persistDiagnostics({
            provider,
            action,
            state: 'error',
            endpoint: `${HUDSON_BASE_URL}${action === 'get' ? API_KEYS_GET_PATH : API_KEYS_GENERATE_PATH}`,
            requestBody,
            traceId: envelope.traceId,
            timestamp: envelope.timestamp,
        });
        throw new Error(envelope.message || 'API keys 请求失败');
    }
    return buildPageData({
        provider,
        action,
        state,
        endpoint: `${HUDSON_BASE_URL}${action === 'get' ? API_KEYS_GET_PATH : API_KEYS_GENERATE_PATH}`,
        requestBody,
        keyRecord: envelope.data.keyRecord,
        activityLog: envelope.data.activityLog,
        traceId: envelope.traceId,
        timestamp: envelope.timestamp,
    });
}
function buildPageData(input) {
    const diagnostics = {
        provider: input.provider,
        action: input.action,
        state: input.state,
        endpoint: input.endpoint,
        requestBody: input.requestBody,
        traceId: input.traceId,
        timestamp: input.timestamp,
    };
    persistDiagnostics(diagnostics);
    return {
        ...input,
        diagnostics,
    };
}
function persistDiagnostics(diagnostics) {
    if (typeof window === 'undefined')
        return;
    window.localStorage.setItem(API_KEYS_LAST_REQUEST_KEY, JSON.stringify(diagnostics));
}
function resolveFetchMockState() {
    if (typeof window === 'undefined')
        return 'empty';
    const configured = window.localStorage.getItem(API_KEYS_FETCH_STATE_KEY);
    if (configured === 'success' || configured === 'empty' || configured === 'error')
        return configured;
    return 'empty';
}
function resolveGenerateMockState() {
    if (typeof window === 'undefined')
        return 'success';
    return window.localStorage.getItem(API_KEYS_GENERATE_STATE_KEY) === 'error' ? 'error' : 'success';
}
function nextGenerationVersion(mode) {
    if (typeof window === 'undefined')
        return 1;
    const current = Number(window.localStorage.getItem(API_KEYS_GENERATION_COUNTER_KEY) || '0');
    if (mode === 'peek') {
        const stable = current > 0 ? current : 1;
        if (current <= 0) {
            window.localStorage.setItem(API_KEYS_GENERATION_COUNTER_KEY, String(stable));
        }
        return stable;
    }
    const next = current > 0 ? current + 1 : 1;
    window.localStorage.setItem(API_KEYS_GENERATION_COUNTER_KEY, String(next));
    return next;
}
function createMockKeyRecord(version) {
    const padded = String(version).padStart(3, '0');
    return {
        appId: `locals-ai-${padded}`,
        accessKeyId: `ak_local_20260519_${padded}`,
        secretKeyPreview: `sk_local_20260519_${padded}_****************`,
        createdAt: `2026-05-19 10:${String(10 + version).padStart(2, '0')}`,
        lastUsedAt: version === 1 ? '尚未使用' : `2026-05-19 11:${String(version).padStart(2, '0')}`,
        rotationTip: '建议在 90 天内完成轮换',
        status: 'active',
        scopes: ['Locals AI 服务端接入', '推理调用鉴权', '环境隔离密钥托管'],
    };
}
function delay(ms) {
    return new Promise((resolve) => window.setTimeout(resolve, ms));
}
function normalizeProviderValue(value) {
    return value === 'api' || value === 'real' ? 'api' : value === 'mock' ? 'mock' : undefined;
}
