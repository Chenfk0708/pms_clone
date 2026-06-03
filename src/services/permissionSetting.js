const realBaseUrl = '/api';
export const permissionRoleListEndpoint = '/role/camp/get';
export const permissionRoleDetailEndpoint = '/roleAuthority/camp/get';
export const permissionRoleCreateEndpoint = '/role/camp/create';
export const permissionRoleRenameEndpoint = '/role/camp/update';
export const permissionRoleDeleteEndpoint = '/role/camp/delete';
export const defaultPermissionSettingCampId = '1796067693589061634';
const mockLatencyMs = 140;
const mockTimestamp = '2026-05-20T00:30:00+08:00';
const basePermissionRows = [
    { moduleId: 'dashboard', moduleName: '首页', permissions: ['查看'] },
    { moduleId: 'rooms', moduleName: '房源', permissions: ['查看', '操作'] },
    { moduleId: 'room-status', moduleName: '房态', permissions: ['查看', '操作'] },
    { moduleId: 'pricing', moduleName: '房价', permissions: ['查看', '操作'] },
    { moduleId: 'full-pricing', moduleName: '全盘价格规划', permissions: ['查看', '操作'] },
    { moduleId: 'orders', moduleName: '订单', permissions: ['查看', '操作'] },
    { moduleId: 'statistics', moduleName: '数据统计', permissions: ['查看', '操作'] },
    { moduleId: 'ledger', moduleName: '账本', permissions: ['查看', '操作'] },
    { moduleId: 'platform', moduleName: '平台管理', permissions: ['查看', '操作'] },
    { moduleId: 'members', moduleName: '成员管理', permissions: ['查看', '操作'] },
    { moduleId: 'custom', moduleName: '自定义项目', permissions: ['查看', '操作'] },
    { moduleId: 'my-store', moduleName: '我的店', permissions: ['查看', '操作'] },
    { moduleId: 'wallet', moduleName: '我的钱包', permissions: ['启用'] },
    { moduleId: 'notify-order', moduleName: '接收系统通知 -订单相关', permissions: ['启用'] },
    { moduleId: 'notify-member', moduleName: '接收系统通知 -店铺成员相关', permissions: ['启用'] },
    { moduleId: 'notify-other', moduleName: '接收系统通知 -其他', permissions: ['启用'] },
    { moduleId: 'consult', moduleName: '咨询', permissions: ['咨询'] },
    { moduleId: 'service-im', moduleName: '客服IM', permissions: ['售前', '售后', '主管'] },
    { moduleId: 'smart-checkin', moduleName: '智能入住', permissions: ['启用'] },
    { moduleId: 'door-lock', moduleName: '门锁管理', permissions: ['操作'] },
    { moduleId: 'night-audit', moduleName: '夜审', permissions: ['修改夜审设置', '查看夜审数据', '重审'] },
    { moduleId: 'history-order', moduleName: '修改历史订单/账单数据敏感', permissions: ['启用'] },
    { moduleId: 'benefit', moduleName: '置换权益', permissions: ['启用'] },
    { moduleId: 'shift', moduleName: '交接班', permissions: ['启用'] },
];
const initialMockRoles = [
    {
        id: 'role-admin',
        name: '管理员',
        description: '负责店铺全局运营、成员权限与关键配置维护。',
        memberCount: 3,
        canDelete: false,
        updatedAt: '2026-05-18 09:12:00',
    },
    {
        id: 'role-housekeeper',
        name: '管家',
        description: '处理订单接待、入住服务与日常巡查。',
        memberCount: 8,
        canDelete: true,
        updatedAt: '2026-05-18 10:46:00',
    },
    {
        id: 'role-investor',
        name: '投资人',
        description: '聚焦经营数据、账本与收益分析。',
        memberCount: 2,
        canDelete: true,
        updatedAt: '2026-05-17 19:20:00',
    },
    {
        id: 'role-cleaner',
        name: '保洁员',
        description: '负责房态巡检与保洁执行。',
        memberCount: 6,
        canDelete: true,
        updatedAt: '2026-05-16 14:08:00',
    },
    {
        id: 'role-smart',
        name: '智住管家',
        description: '负责智能入住、门锁管理与设备巡检。',
        memberCount: 4,
        canDelete: true,
        updatedAt: '2026-05-16 21:10:00',
    },
    {
        id: 'role-owner',
        name: '业主',
        description: '查看店铺经营概览与关键订单数据。',
        memberCount: 5,
        canDelete: true,
        updatedAt: '2026-05-15 18:33:00',
    },
    {
        id: 'role-ai',
        name: 'localsAI',
        description: '面向 AI 协作场景的运营辅助角色。',
        memberCount: 1,
        canDelete: true,
        updatedAt: '2026-05-15 09:05:00',
    },
];
let mockRoles = cloneRoles(initialMockRoles);
const mockDetails = createInitialMockDetails(mockRoles);
export async function loadPermissionSettingRoleList(query, signal) {
    const provider = resolveProvider();
    if (provider === 'api') {
        return loadRealRoleList(query, signal);
    }
    await waitForMockLatency(signal);
    const requestBody = createRoleListRequestBody(query);
    const envelope = buildMockRoleListEnvelope(query);
    return adaptRoleListEnvelope(envelope, requestBody, 'mock', resolveMockState());
}
export async function loadPermissionSettingRoleDetail(query, signal) {
    const provider = resolveProvider();
    if (provider === 'api') {
        return loadRealRoleDetail(query, signal);
    }
    await waitForMockLatency(signal);
    const requestBody = createRoleDetailRequestBody(query);
    const envelope = buildMockRoleDetailEnvelope(query);
    return adaptRoleDetailEnvelope(envelope, requestBody, 'mock', resolveDetailMockState());
}
export async function createPermissionSettingRole(input, signal) {
    const provider = resolveProvider();
    if (provider === 'api') {
        throw new Error('角色新增服务暂不可用，请稍后重试');
    }
    await waitForMockLatency(signal);
    const roleName = input.roleName.trim();
    if (!roleName) {
        throw new Error('请输入角色名称');
    }
    if (mockRoles.some((role) => role.name === roleName)) {
        throw new Error(`角色“${roleName}”已存在，请更换名称`);
    }
    const now = '2026-05-20 00:32:00';
    const role = {
        id: `role-custom-${mockRoles.length + 1}`,
        name: roleName,
        description: input.description?.trim() || '自定义角色',
        memberCount: 0,
        canDelete: true,
        updatedAt: now,
    };
    mockRoles = [role, ...mockRoles];
    mockDetails[role.id] = {
        roleId: role.id,
        roleName: role.name,
        description: role.description,
        permissionRows: clonePermissionRows(basePermissionRows.slice(0, 8)),
    };
    const requestBody = {
        campId: input.campId || defaultPermissionSettingCampId,
        roleName,
        description: input.description?.trim() || '',
    };
    return {
        provider: 'mock',
        endpoint: permissionRoleCreateEndpoint,
        traceId: 'mock-shezhi--qiye-shezhi--quanxian-shezhi-create-001',
        timestamp: mockTimestamp,
        requestBody,
        requestSummary: [
            'action=create',
            'provider=mock',
            `path=${permissionRoleCreateEndpoint}`,
            `campId=${requestBody.campId}`,
            `roleName=${roleName}`,
        ],
        role: adaptRoleSummary(role),
    };
}
export async function renamePermissionSettingRole(input, signal) {
    const provider = resolveProvider();
    if (provider === 'api') {
        throw new Error('角色编辑服务暂不可用，请稍后重试');
    }
    await waitForMockLatency(signal);
    const roleName = input.roleName.trim();
    if (!roleName) {
        throw new Error('请输入角色名称');
    }
    const currentRole = mockRoles.find((role) => role.id === input.roleId);
    if (!currentRole) {
        throw new Error('当前角色不存在，请刷新后重试');
    }
    if (mockRoles.some((role) => role.id !== input.roleId && role.name === roleName)) {
        throw new Error(`角色“${roleName}”已存在，请更换名称`);
    }
    mockRoles = mockRoles.map((role) => role.id === input.roleId
        ? {
            ...role,
            name: roleName,
            description: input.description?.trim() || role.description,
            updatedAt: '2026-05-20 00:33:00',
        }
        : role);
    const updatedRole = mockRoles.find((role) => role.id === input.roleId);
    const detail = mockDetails[input.roleId];
    if (detail) {
        mockDetails[input.roleId] = {
            ...detail,
            roleName: updatedRole.name,
            description: updatedRole.description,
        };
    }
    const requestBody = {
        campId: input.campId || defaultPermissionSettingCampId,
        roleId: input.roleId,
        roleName,
        description: input.description?.trim() || '',
    };
    return {
        provider: 'mock',
        endpoint: permissionRoleRenameEndpoint,
        traceId: 'mock-shezhi--qiye-shezhi--quanxian-shezhi-update-001',
        timestamp: mockTimestamp,
        requestBody,
        requestSummary: [
            'action=rename',
            'provider=mock',
            `path=${permissionRoleRenameEndpoint}`,
            `campId=${requestBody.campId}`,
            `roleId=${input.roleId}`,
            `roleName=${roleName}`,
        ],
        role: adaptRoleSummary(updatedRole),
    };
}
export async function deletePermissionSettingRole(input, signal) {
    const provider = resolveProvider();
    if (provider === 'api') {
        throw new Error('角色删除服务暂不可用，请稍后重试');
    }
    await waitForMockLatency(signal);
    const currentRole = mockRoles.find((role) => role.id === input.roleId);
    if (!currentRole) {
        throw new Error('当前角色不存在，请刷新后重试');
    }
    if (!currentRole.canDelete) {
        throw new Error('默认管理员角色不允许删除');
    }
    mockRoles = mockRoles.filter((role) => role.id !== input.roleId);
    delete mockDetails[input.roleId];
    const requestBody = {
        campId: input.campId || defaultPermissionSettingCampId,
        roleId: input.roleId,
    };
    return {
        provider: 'mock',
        endpoint: permissionRoleDeleteEndpoint,
        traceId: 'mock-shezhi--qiye-shezhi--quanxian-shezhi-delete-001',
        timestamp: mockTimestamp,
        requestBody,
        requestSummary: [
            'action=delete',
            'provider=mock',
            `path=${permissionRoleDeleteEndpoint}`,
            `campId=${requestBody.campId}`,
            `roleId=${input.roleId}`,
        ],
        role: adaptRoleSummary(currentRole),
    };
}
export function getPermissionSettingProviderName() {
    return resolveProvider();
}
function resolveProvider() {
    const configured = readRuntimeConfig('pms.permissionSettingProvider') || import.meta.env.VITE_PERMISSION_SETTING_PROVIDER;
    return configured === 'api' || configured === 'real' ? 'api' : 'mock';
}
function resolveMockState() {
    const fromUrl = readUrlState(['mockState', 'permissionSettingMockState']);
    if (fromUrl)
        return fromUrl;
    const configured = readRuntimeConfig('pms.permissionSettingMockState') || import.meta.env.VITE_PERMISSION_SETTING_MOCK_STATE;
    if (configured === 'empty' || configured === 'error')
        return configured;
    return 'success';
}
function resolveDetailMockState() {
    const fromUrl = readUrlState(['detailMockState', 'permissionSettingDetailMockState']);
    if (fromUrl)
        return fromUrl;
    return resolveMockState() === 'error' ? 'error' : 'success';
}
function readUrlState(keys) {
    if (typeof window === 'undefined')
        return '';
    const params = new URLSearchParams(window.location.search);
    for (const key of keys) {
        const value = params.get(key);
        if (value === 'success' || value === 'empty' || value === 'error') {
            return value;
        }
    }
    return '';
}
function readRuntimeConfig(key) {
    if (typeof window === 'undefined')
        return '';
    return window.localStorage.getItem(key)?.trim() || '';
}
async function loadRealRoleList(query, signal) {
    const requestBody = createRoleListRequestBody(query);
    const payload = await postHudson(permissionRoleListEndpoint, requestBody, signal);
    return adaptRoleListPayload(payload, requestBody, 'api', 'success', 'api-shezhi--qiye-shezhi--quanxian-shezhi-role-list', new Date().toISOString());
}
async function loadRealRoleDetail(query, signal) {
    const requestBody = createRoleDetailRequestBody(query);
    const payload = await postHudson(permissionRoleDetailEndpoint, requestBody, signal);
    return adaptRoleDetailPayload(payload, requestBody, 'api', 'success', 'api-shezhi--qiye-shezhi--quanxian-shezhi-role-detail', new Date().toISOString());
}
async function postHudson(endpoint, body, signal) {
    const response = await fetch(`${realBaseUrl}${endpoint}`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body),
        signal,
    });
    let payload;
    try {
        payload = (await response.json());
    }
    catch {
        payload = null;
    }
    if (!response.ok || payload?.success === false) {
        throw new Error(payload?.errorMsg ?? payload?.errorDetail ?? payload?.errorCode ?? `${endpoint} 返回 HTTP ${response.status}`);
    }
    if (!payload || payload.data === undefined || payload.data === null) {
        throw new Error(`${endpoint} 响应缺少 data 字段`);
    }
    return payload.data;
}
async function waitForMockLatency(signal) {
    if (signal?.aborted) {
        throw new DOMException('Aborted', 'AbortError');
    }
    await new Promise((resolve, reject) => {
        const timer = globalThis.setTimeout(resolve, mockLatencyMs);
        signal?.addEventListener('abort', () => {
            globalThis.clearTimeout(timer);
            reject(new DOMException('Aborted', 'AbortError'));
        }, { once: true });
    });
}
function createRoleListRequestBody(query) {
    return {
        campId: query.campId || defaultPermissionSettingCampId,
        keyword: query.keyword?.trim() || undefined,
        pageNum: query.pageNum ?? 1,
        pageSize: query.pageSize ?? 50,
    };
}
function createRoleDetailRequestBody(query) {
    return {
        campId: query.campId || defaultPermissionSettingCampId,
        roleId: query.roleId,
    };
}
function buildMockRoleListEnvelope(query) {
    const requestBody = createRoleListRequestBody(query);
    const mockState = resolveMockState();
    if (mockState === 'error') {
        return {
            code: 50301,
            message: '角色列表暂时无法获取，请稍后重试',
            data: null,
            traceId: 'mock-shezhi--qiye-shezhi--quanxian-shezhi-role-list-error-001',
            timestamp: mockTimestamp,
        };
    }
    if (mockState === 'empty') {
        return {
            code: 0,
            message: 'success',
            data: {
                list: [],
                pagination: {
                    page: requestBody.pageNum,
                    pageSize: requestBody.pageSize,
                    total: 0,
                },
            },
            traceId: 'mock-shezhi--qiye-shezhi--quanxian-shezhi-role-list-empty-001',
            timestamp: mockTimestamp,
        };
    }
    const keyword = requestBody.keyword ? String(requestBody.keyword) : '';
    const filteredRoles = keyword ? mockRoles.filter((role) => role.name.includes(keyword)) : mockRoles;
    return {
        code: 0,
        message: 'success',
        data: {
            list: filteredRoles.map((role) => ({
                id: role.id,
                name: role.name,
                description: role.description,
                memberCount: role.memberCount,
                canDelete: role.canDelete,
                updatedAt: role.updatedAt,
            })),
            pagination: {
                page: requestBody.pageNum,
                pageSize: requestBody.pageSize,
                total: filteredRoles.length,
            },
        },
        traceId: 'mock-shezhi--qiye-shezhi--quanxian-shezhi-role-list-success-001',
        timestamp: mockTimestamp,
    };
}
function buildMockRoleDetailEnvelope(query) {
    const mockState = resolveDetailMockState();
    if (mockState === 'error') {
        return {
            code: 50302,
            message: '角色权限详情暂时无法获取，请稍后重试',
            data: null,
            traceId: 'mock-shezhi--qiye-shezhi--quanxian-shezhi-role-detail-error-001',
            timestamp: mockTimestamp,
        };
    }
    const detail = mockDetails[query.roleId];
    if (!detail) {
        return {
            code: 40404,
            message: '未找到对应的角色权限详情',
            data: null,
            traceId: 'mock-shezhi--qiye-shezhi--quanxian-shezhi-role-detail-empty-001',
            timestamp: mockTimestamp,
        };
    }
    return {
        code: 0,
        message: 'success',
        data: {
            roleId: detail.roleId,
            roleName: detail.roleName,
            description: detail.description,
            permissionRows: clonePermissionRows(detail.permissionRows),
        },
        traceId: 'mock-shezhi--qiye-shezhi--quanxian-shezhi-role-detail-success-001',
        timestamp: mockTimestamp,
    };
}
function adaptRoleListEnvelope(envelope, requestBody, provider, mockState) {
    if (envelope.code !== 0 || !envelope.data) {
        throw new Error(envelope.message || '角色列表暂时无法获取，请稍后重试');
    }
    return adaptRoleListPayload(envelope.data, requestBody, provider, mockState, envelope.traceId, envelope.timestamp);
}
function adaptRoleListPayload(payload, requestBody, provider, mockState, traceId, timestamp) {
    const record = asRecord(payload);
    const items = asArray(record.list ?? record.roles).map(adaptRoleItem);
    const pagination = asRecord(record.pagination);
    return {
        provider,
        mockState,
        endpoint: permissionRoleListEndpoint,
        traceId,
        timestamp,
        requestBody,
        requestSummary: [
            `provider=${provider}`,
            `mockState=${mockState}`,
            `traceId=${traceId}`,
            `path=${permissionRoleListEndpoint}`,
            `campId=${String(requestBody.campId ?? defaultPermissionSettingCampId)}`,
            `keyword=${String(requestBody.keyword ?? '')}`,
            `pageNum=${String(requestBody.pageNum ?? 1)}`,
            `pageSize=${String(requestBody.pageSize ?? 50)}`,
        ],
        campId: String(requestBody.campId ?? defaultPermissionSettingCampId),
        roles: items,
        pagination: {
            page: readNumber(pagination.page ?? record.page, Number(requestBody.pageNum ?? 1)),
            pageSize: readNumber(pagination.pageSize ?? record.pageSize, Number(requestBody.pageSize ?? 50)),
            total: readNumber(pagination.total ?? record.total, items.length),
        },
    };
}
function adaptRoleDetailEnvelope(envelope, requestBody, provider, mockState) {
    if (envelope.code !== 0 || !envelope.data) {
        throw new Error(envelope.message || '角色权限详情暂时无法获取，请稍后重试');
    }
    return adaptRoleDetailPayload(envelope.data, requestBody, provider, mockState, envelope.traceId, envelope.timestamp);
}
function adaptRoleDetailPayload(payload, requestBody, provider, mockState, traceId, timestamp) {
    const record = asRecord(payload);
    const roleId = String(record.roleId ?? requestBody.roleId ?? '');
    const matchedSummary = mockRoles.find((role) => role.id === roleId);
    const role = matchedSummary
        ? adaptRoleSummary(matchedSummary)
        : {
            roleId,
            roleName: String(record.roleName ?? record.name ?? ''),
            description: String(record.description ?? record.remark ?? ''),
            memberCount: 0,
            canDelete: true,
            updatedAt: '',
        };
    const permissionRows = asArray(record.permissionRows ?? record.permissions ?? record.authorities).map(adaptPermissionRow);
    return {
        provider,
        mockState,
        endpoint: permissionRoleDetailEndpoint,
        traceId,
        timestamp,
        requestBody,
        requestSummary: [
            `provider=${provider}`,
            `mockState=${mockState}`,
            `traceId=${traceId}`,
            `path=${permissionRoleDetailEndpoint}`,
            `campId=${String(requestBody.campId ?? defaultPermissionSettingCampId)}`,
            `roleId=${String(requestBody.roleId ?? '')}`,
            `roleName=${role.roleName}`,
        ],
        campId: String(requestBody.campId ?? defaultPermissionSettingCampId),
        detail: {
            role,
            subtitle: '请为角色设置权限',
            permissionRows,
        },
    };
}
function adaptRoleItem(value) {
    const record = asRecord(value);
    return {
        roleId: String(record.id ?? record.roleId ?? ''),
        roleName: String(record.name ?? record.roleName ?? ''),
        description: String(record.description ?? record.remark ?? ''),
        memberCount: readNumber(record.memberCount ?? record.userCount, 0),
        canDelete: readBoolean(record.canDelete, true),
        updatedAt: String(record.updatedAt ?? record.updateTime ?? ''),
    };
}
function adaptPermissionRow(value) {
    const record = asRecord(value);
    const permissions = asArray(record.permissions ?? record.authorityList ?? record.actions)
        .map((item) => String(item).trim())
        .filter(Boolean);
    return {
        moduleId: String(record.moduleId ?? record.id ?? record.moduleCode ?? record.moduleName ?? ''),
        moduleName: String(record.moduleName ?? record.name ?? record.pageName ?? ''),
        permissions,
    };
}
function createInitialMockDetails(roles) {
    return Object.fromEntries(roles.map((role) => [
        role.id,
        {
            roleId: role.id,
            roleName: role.name,
            description: role.description,
            permissionRows: buildRolePermissionRows(role.id),
        },
    ]));
}
function buildRolePermissionRows(roleId) {
    if (roleId === 'role-investor') {
        return clonePermissionRows(basePermissionRows.map((row) => ['statistics', 'ledger', 'wallet', 'notify-order', 'benefit'].includes(row.moduleId)
            ? row
            : row.moduleId === 'dashboard' || row.moduleId === 'orders'
                ? { ...row, permissions: ['查看'] }
                : row.moduleId === 'consult'
                    ? { ...row, permissions: [] }
                    : { ...row, permissions: [] })).filter((row) => row.permissions.length);
    }
    if (roleId === 'role-cleaner') {
        return clonePermissionRows([
            { moduleId: 'room-status', moduleName: '房态', permissions: ['查看', '操作'] },
            { moduleId: 'smart-checkin', moduleName: '智能入住', permissions: ['查看'] },
            { moduleId: 'shift', moduleName: '交接班', permissions: ['启用'] },
            { moduleId: 'notify-order', moduleName: '接收系统通知 -订单相关', permissions: ['启用'] },
        ]);
    }
    if (roleId === 'role-owner') {
        return clonePermissionRows([
            { moduleId: 'dashboard', moduleName: '首页', permissions: ['查看'] },
            { moduleId: 'orders', moduleName: '订单', permissions: ['查看'] },
            { moduleId: 'statistics', moduleName: '数据统计', permissions: ['查看'] },
            { moduleId: 'ledger', moduleName: '账本', permissions: ['查看'] },
            { moduleId: 'wallet', moduleName: '我的钱包', permissions: ['查看'] },
        ]);
    }
    if (roleId === 'role-smart') {
        return clonePermissionRows([
            { moduleId: 'dashboard', moduleName: '首页', permissions: ['查看'] },
            { moduleId: 'smart-checkin', moduleName: '智能入住', permissions: ['启用'] },
            { moduleId: 'door-lock', moduleName: '门锁管理', permissions: ['操作'] },
            { moduleId: 'night-audit', moduleName: '夜审', permissions: ['查看夜审数据'] },
            { moduleId: 'shift', moduleName: '交接班', permissions: ['启用'] },
        ]);
    }
    return clonePermissionRows(basePermissionRows);
}
function adaptRoleSummary(role) {
    return {
        roleId: role.id,
        roleName: role.name,
        description: role.description,
        memberCount: role.memberCount,
        canDelete: role.canDelete,
        updatedAt: role.updatedAt,
    };
}
function cloneRoles(roles) {
    return roles.map((role) => ({ ...role }));
}
function clonePermissionRows(rows) {
    return rows.map((row) => ({ ...row, permissions: [...row.permissions] }));
}
function readNumber(value, fallback) {
    const numeric = Number(value);
    return Number.isFinite(numeric) ? numeric : fallback;
}
function readBoolean(value, fallback) {
    return typeof value === 'boolean' ? value : fallback;
}
function asArray(value) {
    return Array.isArray(value) ? value : [];
}
function asRecord(value) {
    return value && typeof value === 'object' ? value : {};
}
