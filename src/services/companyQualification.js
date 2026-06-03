import { apiPost } from '../api/client';
import { resolveCurrentCampId } from '../utils/camp';
const TASK_ID = 'shezhi--qiye-shezhi--qiye-zizhi';
const DEFAULT_CAMP_ID = '10001';
const RESPONSE_TIMESTAMP = '2026-05-19T18:40:00+08:00';
const COMPANY_QUALIFICATION_GET_ENDPOINT = '/company/qualification/get';
const COMPANY_QUALIFICATION_SAVE_ENDPOINT = '/company/qualification/save';
const COMPANY_QUALIFICATION_UPLOAD_ENDPOINT = '/company/qualification/upload';
const CITY_OPTIONS = ['深圳 / 福田', '深圳 / 宝安', '广州 / 天河'];
const emptyProfileDraft = {
    name: '',
    type: '民宿',
    phone: '',
    city: '',
    address: '',
    images: [],
};
const defaultProfile = {
    name: '路客云6TS5的店铺',
    type: '民宿',
    phone: '',
    city: '',
    address: '',
    images: [],
};
const defaultBusinessLicenses = [
    {
        id: 'businessLicense',
        title: '营业执照',
        links: ['查看示例'],
        hint: '小于4MB，最多上传1张，支持jpeg、jpg、png格式',
        uploadLabel: '上传',
        kind: 'image',
        maxFiles: 1,
        files: [],
    },
    {
        id: 'industryLicense',
        title: '商铺行业资质（涉及餐饮相关内容的商家请上传《食品经营许可证》）',
        links: ['公共场所许可证查看示例', '特种行业许可证查看示例', '食品经营许可证查看示例'],
        hint: '小于4MB，支持jpeg、jpg、png格式',
        uploadLabel: '上传',
        kind: 'image',
        maxFiles: 4,
        files: [],
    },
    {
        id: 'supplementLicense',
        title: '补充资质 (如商铺行业资质信息不全时，需要上传补充资质)',
        links: ['查看示例', '行业补充资质说明'],
        hint: '小于4MB，最多上传4张，支持jpeg、jpg、png格式',
        uploadLabel: '上传',
        kind: 'image',
        maxFiles: 4,
        files: [],
    },
    {
        id: 'authorizationLetter',
        title: '商家授权承诺函（开通抖音必传）',
        links: ['查看示例', '下载授权承诺函模板'],
        hint: '小于4MB，仅支持PDF格式',
        uploadLabel: '上传文件',
        kind: 'pdf',
        maxFiles: 1,
        files: [],
    },
];
const defaultLegalIdentity = {
    documentType: '居民身份证',
    documentNumber: '',
    photos: [
        { id: 'legalFront', label: '证件人像面照片', files: [] },
        { id: 'legalBack', label: '证件国徽面照片', files: [] },
        { id: 'legalHandheld', label: '法人手持证件照', files: [] },
    ],
};
let mockSnapshotState = cloneSnapshot({
    profile: defaultProfile,
    businessLicenses: defaultBusinessLicenses,
    legalIdentity: defaultLegalIdentity,
});
export const defaultCompanyQualificationQuery = {
    campId: DEFAULT_CAMP_ID,
    includeAssets: true,
};
export class CompanyQualificationRequestError extends Error {
    constructor(message = '企业资质加载失败') {
        super(message);
        this.name = 'CompanyQualificationRequestError';
    }
}
export function resolveCompanyQualificationRuntimeConfig(search) {
    const params = new URLSearchParams(search);
    const provider = params.get('provider');
    const mockState = params.get('mockState') || params.get('companyQualificationMockMode');
    return {
        provider: provider === 'api' || provider === 'real' ? 'api' : provider === 'mock' ? provider : undefined,
        mockState: mockState === 'success' || mockState === 'empty' || mockState === 'error' ? mockState : undefined,
    };
}
export async function fetchCompanyQualification(query = defaultCompanyQualificationQuery, signal) {
    const provider = resolveProvider(query.provider);
    const normalizedQuery = normalizeQuery(query);
    if (provider === 'api') {
        const data = await apiPost(COMPANY_QUALIFICATION_GET_ENDPOINT, normalizedQuery, signal);
        return buildApiViewModel({
            action: 'get',
            path: COMPANY_QUALIFICATION_GET_ENDPOINT,
            requestBody: normalizedQuery,
            data,
            traceId: `api-${TASK_ID}-get`,
        });
    }
    return waitForMockQualification(normalizedQuery, signal);
}
export async function saveCompanyQualificationProfile(profile, options = {}, signal) {
    const provider = resolveProvider(options.provider);
    const campId = resolveCompanyQualificationCampId(options.campId);
    const normalizedProfile = normalizeProfile(profile);
    const requestBody = {
        campId,
        profile: normalizedProfile,
        legalIdentity: normalizeLegalIdentityForRequest(options.legalIdentity),
    };
    if (provider === 'api') {
        const data = await apiPost(COMPANY_QUALIFICATION_SAVE_ENDPOINT, requestBody, signal);
        return buildApiViewModel({
            action: 'save',
            path: COMPANY_QUALIFICATION_SAVE_ENDPOINT,
            requestBody,
            data,
            traceId: `api-${TASK_ID}-save`,
        });
    }
    mockSnapshotState = {
        ...mockSnapshotState,
        profile: normalizedProfile,
    };
    return buildViewModel({
        provider,
        state: 'success',
        action: 'save',
        path: COMPANY_QUALIFICATION_SAVE_ENDPOINT,
        requestBody: {
            campId,
            profile: cloneProfile(mockSnapshotState.profile),
        },
        responseCode: 0,
        traceId: `mock-${TASK_ID}-save-001`,
        timestamp: RESPONSE_TIMESTAMP,
        snapshot: cloneSnapshot(mockSnapshotState),
    });
}
export async function uploadCompanyQualificationAsset(target, options = {}, signal) {
    const provider = resolveProvider(options.provider);
    const campId = resolveCompanyQualificationCampId(options.campId);
    if (provider === 'api') {
        const draftFile = createUploadedFile(target, cloneSnapshot({
            profile: null,
            businessLicenses: defaultBusinessLicenses,
            legalIdentity: defaultLegalIdentity,
        }));
        const requestBody = {
            campId,
            target,
            fileName: draftFile.name,
            kind: draftFile.kind,
            sizeLabel: draftFile.sizeLabel,
        };
        const data = await apiPost(COMPANY_QUALIFICATION_UPLOAD_ENDPOINT, requestBody, signal);
        const file = adaptFile(data.file) ?? draftFile;
        return {
            file,
            viewModel: buildApiViewModel({
                action: 'upload',
                path: COMPANY_QUALIFICATION_UPLOAD_ENDPOINT,
                requestBody,
                data: data.viewModel ?? buildFallbackUploadPayload(target, file),
                traceId: `api-${TASK_ID}-upload-${target}`,
            }),
        };
    }
    await delay(120);
    const file = createUploadedFile(target, mockSnapshotState);
    mockSnapshotState = appendUploadedFile(mockSnapshotState, target, file);
    return {
        file,
        viewModel: buildViewModel({
            provider,
            state: 'success',
            action: 'upload',
            path: COMPANY_QUALIFICATION_UPLOAD_ENDPOINT,
            requestBody: {
                campId,
                target,
                fileName: file.name,
            },
            responseCode: 0,
            traceId: `mock-${TASK_ID}-upload-${target}-001`,
            timestamp: RESPONSE_TIMESTAMP,
            snapshot: cloneSnapshot(mockSnapshotState),
        }),
    };
}
export function createDraftCompanyQualificationImage(existingImages) {
    return {
        id: `company-image-${existingImages.length + 1}`,
        name: `企业门头-${String(existingImages.length + 1).padStart(2, '0')}.png`,
        kind: 'image',
        uploadedAt: '2026-05-19 18:40',
        sizeLabel: '1.8MB',
    };
}
export function createEmptyCompanyQualificationDraft() {
    return cloneProfile(emptyProfileDraft);
}
function normalizeQuery(query = defaultCompanyQualificationQuery) {
    return {
        campId: resolveCompanyQualificationCampId(query.campId),
        includeAssets: query.includeAssets ?? true,
    };
}
function resolveCompanyQualificationCampId(campId) {
    return campId?.trim() || resolveCurrentCampId(DEFAULT_CAMP_ID);
}
function cloneSnapshot(snapshot) {
    return {
        profile: snapshot.profile ? cloneProfile(snapshot.profile) : null,
        businessLicenses: snapshot.businessLicenses.map((section) => ({
            ...section,
            files: section.files.map((file) => ({ ...file })),
        })),
        legalIdentity: {
            ...snapshot.legalIdentity,
            photos: snapshot.legalIdentity.photos.map((photo) => ({
                ...photo,
                files: photo.files.map((file) => ({ ...file })),
            })),
        },
    };
}
function cloneProfile(profile) {
    return {
        ...(profile ?? emptyProfileDraft),
        images: (profile?.images ?? []).map((file) => ({ ...file })),
    };
}
function normalizeProfile(profile) {
    return {
        name: profile.name.trim(),
        type: profile.type.trim() || '民宿',
        phone: profile.phone.trim(),
        city: profile.city.trim(),
        address: profile.address.trim(),
        images: profile.images.map((file) => ({ ...file })),
    };
}
function normalizeLegalIdentityForRequest(legalIdentity) {
    return {
        documentType: legalIdentity?.documentType?.trim() || defaultLegalIdentity.documentType,
        documentNumber: legalIdentity?.documentNumber?.trim() || '',
    };
}
function resolveProvider(explicitProvider) {
    const configured = explicitProvider ||
        readRuntimeConfig('pms.companyQualification.provider') ||
        import.meta.env.VITE_COMPANY_QUALIFICATION_PROVIDER;
    return configured === 'api' || configured === 'real' ? 'api' : 'mock';
}
function resolveMockMode() {
    const configured = readUrlMode() ||
        readRuntimeConfig('pms.companyQualification.mockMode') ||
        import.meta.env.VITE_COMPANY_QUALIFICATION_MOCK_MODE;
    if (configured === 'empty' || configured === 'error')
        return configured;
    return 'success';
}
function readUrlMode() {
    if (typeof window === 'undefined')
        return '';
    const params = new URLSearchParams(window.location.search);
    const configured = params.get('mockState') || params.get('companyQualificationMockMode');
    if (configured === 'success' || configured === 'empty' || configured === 'error')
        return configured;
    return '';
}
function resolveMockLatencyMs() {
    const configured = Number(readRuntimeConfig('pms.companyQualification.mockLatencyMs'));
    return Number.isFinite(configured) && configured > 0 ? configured : 0;
}
function readRuntimeConfig(key) {
    if (typeof window === 'undefined')
        return '';
    return window.localStorage.getItem(key)?.trim() || '';
}
function buildApiViewModel(input) {
    const state = normalizeApiState(input.data.state);
    const snapshot = adaptApiSnapshot(input.data);
    return {
        provider: 'api',
        state,
        profile: snapshot.profile ? cloneProfile(snapshot.profile) : null,
        fields: Array.isArray(input.data.fields) ? input.data.fields.map((field) => ({ ...field })) : buildFields(snapshot.profile),
        cityOptions: Array.isArray(input.data.cityOptions) && input.data.cityOptions.length > 0 ? [...input.data.cityOptions] : [...CITY_OPTIONS],
        businessLicenses: snapshot.businessLicenses.map((section) => ({
            ...section,
            files: section.files.map((file) => ({ ...file })),
        })),
        legalIdentity: {
            ...snapshot.legalIdentity,
            photos: snapshot.legalIdentity.photos.map((photo) => ({
                ...photo,
                files: photo.files.map((file) => ({ ...file })),
            })),
        },
        contract: {
            provider: 'api',
            action: input.action,
            path: input.path,
            method: 'POST',
            requestBody: input.requestBody,
            traceId: input.traceId,
            timestamp: new Date().toISOString(),
            responseCode: 0,
            state,
        },
    };
}
function adaptApiSnapshot(data) {
    return {
        profile: adaptProfile(data.profile),
        businessLicenses: adaptBusinessLicenses(data.businessLicenses),
        legalIdentity: adaptLegalIdentity(data.legalIdentity),
    };
}
function adaptProfile(profile) {
    if (!profile)
        return null;
    return {
        name: typeof profile.name === 'string' ? profile.name : '',
        type: typeof profile.type === 'string' ? profile.type : emptyProfileDraft.type,
        phone: typeof profile.phone === 'string' ? profile.phone : '',
        city: typeof profile.city === 'string' ? profile.city : '',
        address: typeof profile.address === 'string' ? profile.address : '',
        images: Array.isArray(profile.images) ? profile.images.map(adaptFile).filter(isFile) : [],
    };
}
function adaptBusinessLicenses(businessLicenses) {
    const source = Array.isArray(businessLicenses) && businessLicenses.length > 0 ? businessLicenses : defaultBusinessLicenses;
    return source.map((section, index) => {
        const fallback = defaultBusinessLicenses[index] ?? defaultBusinessLicenses[0];
        return {
            id: isUploadTarget(section.id) ? section.id : fallback.id,
            title: typeof section.title === 'string' && section.title ? section.title : fallback.title,
            links: Array.isArray(section.links) ? section.links.map(String) : [...fallback.links],
            hint: typeof section.hint === 'string' && section.hint ? section.hint : fallback.hint,
            uploadLabel: typeof section.uploadLabel === 'string' && section.uploadLabel ? section.uploadLabel : fallback.uploadLabel,
            kind: section.kind === 'pdf' ? 'pdf' : 'image',
            maxFiles: typeof section.maxFiles === 'number' && section.maxFiles > 0 ? section.maxFiles : fallback.maxFiles,
            files: Array.isArray(section.files) ? section.files.map(adaptFile).filter(isFile) : [],
        };
    });
}
function adaptLegalIdentity(legalIdentity) {
    const source = legalIdentity ?? defaultLegalIdentity;
    return {
        documentType: typeof source.documentType === 'string' && source.documentType ? source.documentType : defaultLegalIdentity.documentType,
        documentNumber: typeof source.documentNumber === 'string' ? source.documentNumber : '',
        photos: Array.isArray(source.photos) && source.photos.length > 0
            ? source.photos.map((photo, index) => {
                const fallback = defaultLegalIdentity.photos[index] ?? defaultLegalIdentity.photos[0];
                return {
                    id: isLegalPhotoTarget(photo.id) ? photo.id : fallback.id,
                    label: typeof photo.label === 'string' && photo.label ? photo.label : fallback.label,
                    files: Array.isArray(photo.files) ? photo.files.map(adaptFile).filter(isFile) : [],
                };
            })
            : defaultLegalIdentity.photos.map((photo) => ({ ...photo, files: [] })),
    };
}
function adaptFile(file) {
    if (!file || typeof file !== 'object')
        return null;
    const id = String(file.id ?? '').trim();
    const name = String(file.name ?? '').trim();
    if (!id || !name)
        return null;
    return {
        id,
        name,
        kind: file.kind === 'pdf' ? 'pdf' : 'image',
        uploadedAt: String(file.uploadedAt ?? ''),
        sizeLabel: String(file.sizeLabel ?? ''),
    };
}
function isFile(file) {
    return file !== null;
}
function normalizeApiState(state) {
    return state === 'empty' ? 'empty' : 'success';
}
function isUploadTarget(value) {
    return (value === 'businessLicense' ||
        value === 'industryLicense' ||
        value === 'supplementLicense' ||
        value === 'authorizationLetter' ||
        value === 'legalFront' ||
        value === 'legalBack' ||
        value === 'legalHandheld');
}
function isLegalPhotoTarget(value) {
    return value === 'legalFront' || value === 'legalBack' || value === 'legalHandheld';
}
function buildFallbackUploadPayload(target, file) {
    const snapshot = appendUploadedFile({
        profile: null,
        businessLicenses: defaultBusinessLicenses,
        legalIdentity: defaultLegalIdentity,
    }, target, file);
    return {
        provider: 'api',
        state: 'success',
        businessLicenses: snapshot.businessLicenses,
        legalIdentity: snapshot.legalIdentity,
    };
}
async function waitForMockQualification(query, signal) {
    const latencyMs = resolveMockLatencyMs();
    if (latencyMs > 0) {
        await delay(latencyMs, signal);
    }
    const state = resolveMockMode();
    if (state === 'error') {
        throw new CompanyQualificationRequestError('企业资质加载失败');
    }
    const snapshot = state === 'empty'
        ? cloneSnapshot({
            profile: null,
            businessLicenses: defaultBusinessLicenses,
            legalIdentity: defaultLegalIdentity,
        })
        : cloneSnapshot(mockSnapshotState);
    return buildViewModel({
        provider: 'mock',
        state,
        action: 'get',
        path: COMPANY_QUALIFICATION_GET_ENDPOINT,
        requestBody: query,
        responseCode: 0,
        traceId: `mock-${TASK_ID}-${state === 'empty' ? 'empty' : 'detail'}-001`,
        timestamp: RESPONSE_TIMESTAMP,
        snapshot,
    });
}
function buildViewModel(input) {
    return {
        provider: input.provider,
        state: input.state,
        profile: input.snapshot.profile ? cloneProfile(input.snapshot.profile) : null,
        fields: buildFields(input.snapshot.profile),
        cityOptions: [...CITY_OPTIONS],
        businessLicenses: input.snapshot.businessLicenses.map((section) => ({
            ...section,
            files: section.files.map((file) => ({ ...file })),
        })),
        legalIdentity: {
            ...input.snapshot.legalIdentity,
            photos: input.snapshot.legalIdentity.photos.map((photo) => ({
                ...photo,
                files: photo.files.map((file) => ({ ...file })),
            })),
        },
        contract: {
            provider: input.provider,
            action: input.action,
            path: input.path,
            method: 'POST',
            requestBody: input.requestBody,
            traceId: input.traceId,
            timestamp: input.timestamp,
            responseCode: input.responseCode,
            state: input.state,
        },
    };
}
function buildFields(profile) {
    if (!profile) {
        return [
            { label: '企业名称', value: '暂未填写' },
            { label: '企业类型', value: '暂未填写' },
            { label: '联系电话', value: '暂未填写' },
            { label: '所在城市', value: '暂未填写' },
            { label: '详细地址', value: '暂未填写' },
        ];
    }
    return [
        { label: '企业名称', value: profile.name || '暂无企业名称' },
        { label: '企业类型', value: profile.type || '暂无企业类型' },
        { label: '联系电话', value: profile.phone || '暂无联系电话' },
        { label: '所在城市', value: profile.city || '暂无所在城市' },
        { label: '详细地址', value: profile.address || '暂无详细地址' },
    ];
}
function appendUploadedFile(snapshot, target, file) {
    const nextSnapshot = cloneSnapshot(snapshot);
    const sectionIndex = nextSnapshot.businessLicenses.findIndex((section) => section.id === target);
    if (sectionIndex >= 0) {
        const section = nextSnapshot.businessLicenses[sectionIndex];
        section.files = [...section.files.slice(-(section.maxFiles - 1)), file];
        return nextSnapshot;
    }
    const photoIndex = nextSnapshot.legalIdentity.photos.findIndex((photo) => photo.id === target);
    if (photoIndex >= 0) {
        nextSnapshot.legalIdentity.photos[photoIndex].files = [file];
    }
    return nextSnapshot;
}
function createUploadedFile(target, snapshot) {
    const now = '2026-05-19 18:40';
    switch (target) {
        case 'businessLicense':
            return {
                id: 'license-business-1',
                name: '营业执照-深圳宝安店.png',
                kind: 'image',
                uploadedAt: now,
                sizeLabel: '2.1MB',
            };
        case 'industryLicense':
            return {
                id: `license-industry-${countFiles(snapshot, target) + 1}`,
                name: `食品经营许可证-${String(countFiles(snapshot, target) + 1).padStart(2, '0')}.png`,
                kind: 'image',
                uploadedAt: now,
                sizeLabel: '1.6MB',
            };
        case 'supplementLicense':
            return {
                id: `license-supplement-${countFiles(snapshot, target) + 1}`,
                name: `补充资质-${String(countFiles(snapshot, target) + 1).padStart(2, '0')}.png`,
                kind: 'image',
                uploadedAt: now,
                sizeLabel: '1.2MB',
            };
        case 'authorizationLetter':
            return {
                id: 'license-letter-1',
                name: '商家授权承诺函.pdf',
                kind: 'pdf',
                uploadedAt: now,
                sizeLabel: '0.8MB',
            };
        case 'legalFront':
            return {
                id: 'legal-front-1',
                name: '法人身份证-人像面.png',
                kind: 'image',
                uploadedAt: now,
                sizeLabel: '0.9MB',
            };
        case 'legalBack':
            return {
                id: 'legal-back-1',
                name: '法人身份证-国徽面.png',
                kind: 'image',
                uploadedAt: now,
                sizeLabel: '0.8MB',
            };
        case 'legalHandheld':
        default:
            return {
                id: 'legal-handheld-1',
                name: '法人手持证件照.png',
                kind: 'image',
                uploadedAt: now,
                sizeLabel: '1.4MB',
            };
    }
}
function countFiles(snapshot, target) {
    const section = snapshot.businessLicenses.find((item) => item.id === target);
    if (section)
        return section.files.length;
    const photo = snapshot.legalIdentity.photos.find((item) => item.id === target);
    return photo?.files.length ?? 0;
}
function delay(ms, signal) {
    if (signal?.aborted) {
        return Promise.reject(new DOMException('Aborted', 'AbortError'));
    }
    return new Promise((resolve, reject) => {
        const timer = window.setTimeout(resolve, ms);
        signal?.addEventListener('abort', () => {
            window.clearTimeout(timer);
            reject(new DOMException('Aborted', 'AbortError'));
        }, { once: true });
    });
}
