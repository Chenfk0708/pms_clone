const realBaseUrl = '/api';
const roomTypeListEndpoint = '/roomCategories/page/get';
const roomTypeStoreEndpoint = '/select/poi/page/get';
const roomTypeGroupEndpoint = '/roomCategoryGroups/get';
const roomTypeRoomEndpoint = '/rooms/get';
const roomTypeDetailEndpoint = '/roomCategory/detail/get';
const roomTypeLinkageGetEndpoint = '/roomCategory/linkage/get';
const roomTypeLinkageSaveEndpoint = '/roomCategory/linkage/save';
const roomTypeDeleteEndpoint = '/roomCategory/delete';
const roomTypeSaveEndpoint = '/roomCategory/save';
const roomTypePhotoUploadEndpoint = '/roomCategory/photo/upload';
const mockTimestamp = '2026-05-19T19:45:00+08:00';
const mockLatencyMs = 120;
const defaultCampId = '1796067693589061634';
const defaultStoreId = '1796425098638573570';
const storeOptions = [
    { id: defaultStoreId, label: '天落会宿公寓(前海壹方城宝安中心店)' },
];
const groupOptions = [
    { id: 'group-main', label: '天落会宿公寓(前海壹方城宝安中心店)' },
];
const mockRows = [
    {
        id: 'room-type-001',
        name: '顶层套房（浴缸巨幕电竞麻将）',
        storeId: defaultStoreId,
        storeName: storeOptions[0].label,
        roomCount: 1,
        roomNames: ['房间1'],
        linkedRoomTypeIds: [],
        linkedRoomTypeNames: [],
        groupId: 'group-main',
        groupName: '',
    },
    {
        id: 'room-type-002',
        name: '总裁套间（桑拿浴缸露台电竞麻将）',
        storeId: defaultStoreId,
        storeName: storeOptions[0].label,
        roomCount: 1,
        roomNames: ['房间1'],
        linkedRoomTypeIds: [],
        linkedRoomTypeNames: [],
        groupId: 'group-main',
        groupName: '',
    },
    {
        id: 'room-type-003',
        name: '天落大床电竞套间',
        storeId: defaultStoreId,
        storeName: storeOptions[0].label,
        roomCount: 1,
        roomNames: ['1'],
        linkedRoomTypeIds: [],
        linkedRoomTypeNames: [],
        groupId: 'group-main',
        groupName: '',
    },
    {
        id: 'room-type-004',
        name: '观影大床房',
        storeId: defaultStoreId,
        storeName: storeOptions[0].label,
        roomCount: 1,
        roomNames: ['房间1'],
        linkedRoomTypeIds: [],
        linkedRoomTypeNames: [],
        groupId: 'group-main',
        groupName: '',
    },
];
const mockTags = [
    { id: 'tag-001', name: '电竞', roomTypeCount: 3, detail: '覆盖电竞房、巨幕房和投影房。' },
    { id: 'tag-002', name: '观影', roomTypeCount: 2, detail: '用于影院房型的站内标签露出。' },
    { id: 'tag-003', name: '麻将', roomTypeCount: 2, detail: '用于整租和聚会类场景。' },
];
const mockTagGroups = [];
const mockFloorGroups = [];
const mockFloors = [
    { id: 'floor-001', name: '顶层露台', roomCount: 1, detail: '包含顶层套房房间1。' },
    { id: 'floor-002', name: '行政区', roomCount: 2, detail: '包含总裁套间与观影大床房。' },
    { id: 'floor-003', name: '电竞区', roomCount: 1, detail: '包含天落大床电竞套间。' },
];
const roomTypeSteps = ['基础信息', '位置信息', '房型设施', '详细介绍', '照片信息'];
export async function loadRoomTypeInfoDashboard(query, signal) {
    if (resolveProvider() === 'api') {
        return loadRealRoomTypeInfoDashboard(query, signal);
    }
    await waitForMockLatency(signal);
    const mockState = resolveMockState();
    if (mockState === 'error') {
        throw new Error('房型信息加载失败');
    }
    const requestBody = createRequestBody(query);
    const rows = filterMockRows(query);
    const payloadRows = mockState === 'empty' ? [] : rows;
    const envelope = buildEnvelope({
        stores: storeOptions,
        groups: groupOptions,
        list: payloadRows,
        pagination: {
            total: payloadRows.length,
            pageNum: 1,
            pageSize: 20,
            current: 1,
            pages: 1,
            hasNextPage: false,
        },
        stockSummary: {
            used: 4,
            total: 10,
            startDate: '2025.09.28',
            endDate: '2027.09.28',
        },
        tagSnapshots: mockTags,
        floorSnapshots: mockFloors,
    }, 'dashboard');
    return adaptMockDashboardEnvelope(envelope, requestBody, query, mockState);
}
export async function loadRoomTypeTagPage(signal) {
    await waitForMockLatency(signal);
    if (resolveMockState() === 'error') {
        throw new Error('房型标签加载失败');
    }
    return {
        provider: resolveProvider(),
        endpoint: '/roomType/tag/get',
        traceId: buildTraceId('tag-page'),
        timestamp: mockTimestamp,
        rows: mockTagGroups.map((item) => ({ ...item, roomTypeIds: [...item.roomTypeIds], roomTypeNames: [...item.roomTypeNames] })),
        roomTypeOptions: mockRows.map((item) => ({ id: item.id, label: item.name })),
    };
}
export async function loadRoomTypeFloorPage(signal) {
    await waitForMockLatency(signal);
    if (resolveMockState() === 'error') {
        throw new Error('楼层信息加载失败');
    }
    return {
        provider: resolveProvider(),
        endpoint: '/roomType/floor/get',
        traceId: buildTraceId('floor-page'),
        timestamp: mockTimestamp,
        rows: mockFloorGroups.map((item) => ({ ...item, roomTypeIds: [...item.roomTypeIds], roomTypeNames: [...item.roomTypeNames] })),
        roomTypeOptions: mockRows.map((item) => ({ id: item.id, label: item.name })),
    };
}
export async function createRoomTypeTag(input, signal) {
    await waitForMockLatency(signal);
    const name = input.name.trim();
    if (!name)
        throw new Error('请先填写分组名称');
    if (!input.roomTypeId)
        throw new Error('请选择关联房型');
    const roomType = findRowOrThrow(input.roomTypeId);
    mockTagGroups.unshift({
        id: `tag-group-${Date.now()}`,
        name,
        roomTypeIds: [roomType.id],
        roomTypeNames: [roomType.name],
    });
    return {
        message: '房型标签已创建',
        traceId: buildTraceId('create-tag'),
    };
}
export async function createRoomTypeFloor(input, signal) {
    await waitForMockLatency(signal);
    const name = input.name.trim();
    if (!name)
        throw new Error('请先填写楼层名称');
    if (!input.roomTypeId)
        throw new Error('请选择关联房间');
    const roomType = findRowOrThrow(input.roomTypeId);
    mockFloorGroups.unshift({
        id: `floor-group-${Date.now()}`,
        name,
        roomTypeIds: [roomType.id],
        roomTypeNames: [roomType.name],
    });
    return {
        message: '楼层信息已创建',
        traceId: buildTraceId('create-floor'),
    };
}
export async function loadRoomTypeInfoDraft(mode, roomTypeId, signal) {
    if (resolveProvider() === 'api') {
        return loadRealRoomTypeInfoDraft(mode, roomTypeId, signal);
    }
    await waitForMockLatency(signal);
    const row = roomTypeId ? findRowOrThrow(roomTypeId) : null;
    return {
        provider: resolveProvider(),
        traceId: buildTraceId(mode === 'create' ? 'draft-create' : 'draft-detail'),
        timestamp: mockTimestamp,
        mode,
        title: mode === 'create' ? '新增房型' : '房型详情',
        steps: roomTypeSteps,
        form: {
            roomTypeId: row?.id ?? '',
            roomTypeName: row?.name ?? '',
            storeId: row?.storeId ?? defaultStoreId,
            groupId: row?.groupId ?? groupOptions[0].id,
            roomCount: String(row?.roomCount ?? 1),
            roomNos: row?.roomNames.length ? [...row.roomNames] : ['房间1'],
            weekdayPrice: row ? '388' : '',
            weekendPrice: row ? '468' : '',
            holidayPrice: row ? '588' : '',
            locationMode: 'same-store',
            locationProvinceCode: '',
            locationProvinceName: '',
            locationCityCode: '',
            locationCityName: '',
            locationDistrictCode: '',
            locationDistrictName: '',
            streetAddress: '',
            communityName: '',
            buildingUnit: '',
            doorNumber: '',
            locationLatitude: '',
            locationLongitude: '',
            rentalType: 'entire',
            propertyType: 'apartment',
            suiteArea: row ? '68' : '',
            guestCount: row ? '2' : '',
            bedroomCount: row ? '1' : '',
            livingRoomCount: row ? '1' : '',
            kitchenCount: row ? '1' : '',
            bathroomCount: row ? '1' : '',
            bathroomType: 'private',
            selectedFacilityIds: row
                ? ['dining-table', 'disposable-cup', 'range-hood', 'self-checkin', 'free-parking', 'luggage-storage', 'cleaning-tools', 'white-bedding']
                : [],
            bedSheetChangePolicy: '',
            decorationStyle: '',
            displayName: row?.name ?? '',
            earliestCheckIn: '12',
            latestCheckOut: '14',
            latestCheckIn: '24',
            highlightDescription: row ? `${row.name}，适合观影、电竞与聚会场景。` : '',
            nearbyDescription: row ? '近商圈、地铁站与夜间餐饮区域，步行可达。' : '',
            articleDescription: row ? `${row.name} 图文介绍示例。` : '',
            photos: [],
            photoCounts: {
                cover: 0,
                livingRoom: 0,
                kitchen: 0,
                other: 0,
                bathroom: 0,
                building: 0,
                entertainment: 0,
                uncategorized: 0,
            },
        },
    };
}
export async function loadRoomTypeRooms(roomTypeId, signal) {
    if (resolveProvider() === 'api') {
        return loadRealRoomTypeRooms(roomTypeId, signal);
    }
    await waitForMockLatency(signal);
    const row = findRowOrThrow(roomTypeId);
    return {
        traceId: buildTraceId('rooms'),
        timestamp: mockTimestamp,
        roomTypeId,
        roomTypeName: row.name,
        rooms: row.roomNames.map((roomName, index) => ({
            id: `${roomTypeId}-room-${index + 1}`,
            roomName,
            roomTypeName: row.name,
            lockStatus: '未绑定',
            floorName: '去设置',
        })),
    };
}
export async function loadRoomTypeLinkage(roomTypeId, signal) {
    if (resolveProvider() === 'api') {
        return loadRealRoomTypeLinkage(roomTypeId, signal);
    }
    await waitForMockLatency(signal);
    const row = findRowOrThrow(roomTypeId);
    const candidates = mockRows
        .filter((item) => item.id !== roomTypeId)
        .map((item) => ({
        id: item.id,
        name: item.name,
        selected: row.linkedRoomTypeIds.includes(item.id),
    }));
    return {
        traceId: buildTraceId('linkage'),
        timestamp: mockTimestamp,
        roomTypeId,
        roomTypeName: row.name,
        description: '设置联动关房后，当前房型关房将联动关联的房型全部关房，关联的房型任一关房，将联动当前房型关房。适用于整租/包栋场景；',
        candidates,
    };
}
export async function loadRoomTypeUtilityDialog(kind, signal) {
    await waitForMockLatency(signal);
    return {
        traceId: buildTraceId(kind),
        timestamp: mockTimestamp,
        title: kind === 'tags' ? '标签管理' : '楼层管理',
        items: kind === 'tags'
            ? mockTags.map((item) => ({ id: item.id, name: item.name, count: item.roomTypeCount, detail: item.detail }))
            : mockFloors.map((item) => ({ id: item.id, name: item.name, count: item.roomCount, detail: item.detail })),
    };
}
export async function saveRoomTypeLinkage(roomTypeId, selectedIds, signal) {
    if (resolveProvider() === 'api') {
        return saveRealRoomTypeLinkage(roomTypeId, selectedIds, signal);
    }
    await waitForMockLatency(signal);
    const row = findRowOrThrow(roomTypeId);
    row.linkedRoomTypeIds = [...selectedIds];
    row.linkedRoomTypeNames = mockRows.filter((item) => selectedIds.includes(item.id)).map((item) => item.name);
    return { message: '联动关房已更新', traceId: buildTraceId('save-linkage') };
}
export async function deleteRoomType(roomTypeId, signal) {
    if (resolveProvider() === 'api') {
        return deleteRealRoomType(roomTypeId, signal);
    }
    await waitForMockLatency(signal);
    const rowIndex = mockRows.findIndex((item) => item.id === roomTypeId);
    if (rowIndex < 0)
        throw new Error('未找到需要删除的房型');
    mockRows.splice(rowIndex, 1);
    return { message: '房型已删除', traceId: buildTraceId('delete') };
}
export async function saveRoomTypeDraft(draft, signal) {
    await waitForMockLatency(signal);
    if (!draft.roomTypeName.trim()) {
        throw new Error('请先填写房型名称');
    }
    if (resolveProvider() === 'api') {
        return saveRealRoomTypeDraft(draft, signal);
    }
    return {
        message: draft.roomTypeId ? '房型信息已保存' : '房型已创建',
        traceId: buildTraceId('save-draft'),
    };
}
export async function uploadRoomTypePhoto(input, signal) {
    if (!input.file.type.startsWith('image/')) {
        throw new Error('只能上传图片文件');
    }
    const formData = new FormData();
    formData.set('campId', resolveCampId());
    formData.set('sectionKey', input.sectionKey);
    if (input.roomTypeId) {
        formData.set('roomCategoryId', input.roomTypeId);
    }
    formData.set('file', input.file);
    const response = await fetchMultipart(`${realBaseUrl}${roomTypePhotoUploadEndpoint}`, {
        method: 'POST',
        body: formData,
        signal,
    });
    const payload = unwrapHudsonEnvelope(response);
    return adaptUploadedRoomTypePhoto(payload, input.file, input.sectionKey);
}
export function createQuickRoomNoSuggestion(roomCount) {
    const count = Math.max(1, Number.parseInt(roomCount, 10) || 1);
    return Array.from({ length: count }, (_, index) => `房间${index + 1}`);
}
export function getRoomTypeInfoProviderName() {
    return resolveProvider();
}
function resolveProvider() {
    const configured = readRuntimeConfig('pms.roomTypeInfoProvider') || import.meta.env.VITE_ROOM_TYPE_INFO_PROVIDER;
    return configured === 'api' || configured === 'real' ? 'api' : 'mock';
}
function resolveMockState() {
    const fromUrl = readUrlMockState();
    if (fromUrl)
        return fromUrl;
    const configured = readRuntimeConfig('pms.roomTypeInfoMockState') || import.meta.env.VITE_ROOM_TYPE_INFO_MOCK_STATE;
    if (configured === 'empty' || configured === 'error')
        return configured;
    return 'success';
}
function readUrlMockState() {
    if (typeof window === 'undefined')
        return '';
    const params = new URLSearchParams(window.location.search);
    const configured = params.get('roomTypeInfoMockState') || params.get('mockState');
    return configured === 'success' || configured === 'empty' || configured === 'error' ? configured : '';
}
function readRuntimeConfig(key) {
    if (typeof window === 'undefined')
        return '';
    return window.localStorage.getItem(key)?.trim() || '';
}
async function waitForMockLatency(signal) {
    if (signal?.aborted)
        throw new DOMException('Aborted', 'AbortError');
    await new Promise((resolve, reject) => {
        const timer = window.setTimeout(resolve, mockLatencyMs);
        signal?.addEventListener('abort', () => {
            window.clearTimeout(timer);
            reject(new DOMException('Aborted', 'AbortError'));
        }, { once: true });
    });
}
function createRequestBody(query) {
    return {
        campId: resolveCampId(),
        poiId: query.storeId || '',
        roomCategoryGroupId: query.groupId || '',
        roomCategoryName: query.keyword?.trim() || '',
        pageNum: query.pageNum ?? 1,
        pageSize: query.pageSize ?? 20,
        current: query.current ?? query.pageNum ?? 1,
    };
}
function buildEnvelope(data, suffix) {
    return {
        code: 0,
        message: 'success',
        data,
        traceId: buildTraceId(suffix),
        timestamp: mockTimestamp,
    };
}
function adaptMockDashboardEnvelope(envelope, requestBody, query, mockState) {
    return {
        provider: 'mock',
        mockState,
        endpoint: roomTypeListEndpoint,
        traceId: envelope.traceId,
        timestamp: envelope.timestamp,
        requestBody,
        requestSummary: buildRequestSummary(query, envelope.data.list.length),
        stores: envelope.data.stores,
        groups: envelope.data.groups,
        rows: envelope.data.list,
        pagination: envelope.data.pagination,
        stockSummary: envelope.data.stockSummary,
        tagSnapshots: envelope.data.tagSnapshots,
        floorSnapshots: envelope.data.floorSnapshots,
    };
}
async function loadRealRoomTypeInfoDashboard(query, signal) {
    const requestBody = createRequestBody(query);
    const [storesResponse, groupsResponse, pageResponse] = await Promise.all([
        fetchJson(`${realBaseUrl}${roomTypeStoreEndpoint}`, {
            method: 'POST',
            body: JSON.stringify({ campId: resolveCampId(), pageNum: 1, pageSize: 100 }),
            signal,
        }),
        fetchJson(`${realBaseUrl}${roomTypeGroupEndpoint}`, {
            method: 'POST',
            body: JSON.stringify({ campId: resolveCampId() }),
            signal,
        }),
        fetchJson(`${realBaseUrl}${roomTypeListEndpoint}`, {
            method: 'POST',
            body: JSON.stringify(requestBody),
            signal,
        }),
    ]);
    const stores = adaptStoreOptions(storesResponse);
    const groups = adaptGroupOptions(groupsResponse);
    const payload = unwrapHudsonEnvelope(pageResponse);
    const rows = adaptRoomTypeRows(payload.list);
    const total = readNumber(payload.total, rows.length);
    const pageNum = readNumber(payload.pageNum, 1);
    const pageSize = readNumber(payload.size, requestBody.pageSize);
    const pages = readNumber(payload.pages, total > 0 ? 1 : 0);
    const current = readNumber(payload.current, pageNum);
    return {
        provider: 'api',
        mockState: 'success',
        endpoint: roomTypeListEndpoint,
        traceId: buildTraceId('api-dashboard'),
        timestamp: new Date().toISOString(),
        requestBody,
        requestSummary: buildRequestSummary(query, rows.length),
        stores,
        groups,
        rows,
        pagination: {
            total,
            pageNum,
            pageSize,
            current,
            pages,
            hasNextPage: Boolean(payload.hasNextPage),
        },
        stockSummary: {
            used: rows.length,
            total: Math.max(10, rows.length),
            startDate: '2025.09.28',
            endDate: '2027.09.28',
        },
        tagSnapshots: mockTags,
        floorSnapshots: mockFloors,
    };
}
async function loadRealRoomTypeRooms(roomTypeId, signal) {
    const response = await fetchJson(`${realBaseUrl}${roomTypeRoomEndpoint}`, {
        method: 'POST',
        body: JSON.stringify({
            campId: resolveCampId(),
            roomCategoryIds: [roomTypeId],
            pageNum: 1,
            pageSize: 50,
        }),
        signal,
    });
    const payload = unwrapHudsonEnvelope(response);
    const rooms = Array.isArray(payload)
        ? payload.map((item, index) => {
            const room = asRecord(item);
            const roomTypeName = readString(room.roomTypeName ?? room.roomCategoryName, '');
            return {
                id: readString(room.id ?? room.roomId, `${roomTypeId}-room-${index + 1}`),
                roomName: readString(room.name ?? room.roomName, `房间${index + 1}`),
                roomTypeName,
                lockStatus: readString(room.lockStatus, '未绑定'),
                floorName: readString(room.floorName, '去设置'),
            };
        })
        : [];
    return {
        traceId: buildTraceId('api-rooms'),
        timestamp: new Date().toISOString(),
        roomTypeId,
        roomTypeName: rooms[0]?.roomTypeName ?? '',
        rooms,
    };
}
async function loadRealRoomTypeInfoDraft(mode, roomTypeId, signal) {
    const response = await fetchJson(`${realBaseUrl}${roomTypeDetailEndpoint}`, {
        method: 'POST',
        body: JSON.stringify({
            campId: resolveCampId(),
            roomCategoryId: roomTypeId || '',
            mode,
        }),
        signal,
    });
    const payload = unwrapHudsonEnvelope(response);
    return adaptRoomTypeDraft(payload, mode, response.traceId, response.timestamp);
}
async function loadRealRoomTypeLinkage(roomTypeId, signal) {
    const response = await fetchJson(`${realBaseUrl}${roomTypeLinkageGetEndpoint}`, {
        method: 'POST',
        body: JSON.stringify({
            campId: resolveCampId(),
            roomCategoryId: roomTypeId,
        }),
        signal,
    });
    const payload = unwrapHudsonEnvelope(response);
    return adaptRoomTypeLinkage(payload, roomTypeId, response.traceId, response.timestamp);
}
async function saveRealRoomTypeLinkage(roomTypeId, selectedIds, signal) {
    const response = await fetchJson(`${realBaseUrl}${roomTypeLinkageSaveEndpoint}`, {
        method: 'POST',
        body: JSON.stringify({
            campId: resolveCampId(),
            roomCategoryId: roomTypeId,
            linkedRoomCategoryIds: selectedIds,
        }),
        signal,
    });
    const payload = unwrapHudsonEnvelope(response);
    return {
        message: readResponseMessage(payload, response.message, '联动关房已更新'),
        traceId: readString(response.traceId, buildTraceId('api-save-linkage')),
    };
}
async function deleteRealRoomType(roomTypeId, signal) {
    const response = await fetchJson(`${realBaseUrl}${roomTypeDeleteEndpoint}`, {
        method: 'POST',
        body: JSON.stringify({
            campId: resolveCampId(),
            roomCategoryId: roomTypeId,
        }),
        signal,
    });
    const payload = unwrapHudsonEnvelope(response);
    return {
        message: readResponseMessage(payload, response.message, '房型已删除'),
        traceId: readString(response.traceId, buildTraceId('api-delete')),
    };
}
async function saveRealRoomTypeDraft(draft, signal) {
    const response = await fetchJson(`${realBaseUrl}${roomTypeSaveEndpoint}`, {
        method: 'POST',
        body: JSON.stringify({
            campId: resolveCampId(),
            form: draft,
        }),
        signal,
    });
    const payload = unwrapHudsonEnvelope(response);
    return {
        message: readResponseMessage(payload, response.message, draft.roomTypeId ? '房型信息已保存' : '房型已创建'),
        traceId: readString(response.traceId, buildTraceId('api-save-draft')),
    };
}
async function fetchJson(url, init) {
    const headers = new Headers({ 'content-type': 'application/json' });
    const token = readRuntimeConfig('pms_token');
    if (token)
        headers.set('Authorization', `Bearer ${token}`);
    if (init.headers) {
        new Headers(init.headers).forEach((value, key) => headers.set(key, value));
    }
    const response = await fetch(url, {
        ...init,
        credentials: 'include',
        headers: {
            ...Object.fromEntries(headers.entries()),
        },
    });
    let payload;
    try {
        payload = (await response.json());
    }
    catch {
        throw new Error(`请求失败：${response.status}`);
    }
    if (!response.ok) {
        throw new Error(readHudsonErrorMessage(payload) || `请求失败：${response.status}`);
    }
    return payload;
}
async function fetchMultipart(url, init) {
    const headers = new Headers();
    const token = readRuntimeConfig('pms_token');
    if (token)
        headers.set('Authorization', `Bearer ${token}`);
    if (init.headers) {
        new Headers(init.headers).forEach((value, key) => headers.set(key, value));
    }
    const response = await fetch(url, {
        ...init,
        credentials: 'include',
        headers: {
            ...Object.fromEntries(headers.entries()),
        },
    });
    let payload;
    try {
        payload = (await response.json());
    }
    catch {
        throw new Error('照片上传接口未返回 JSON');
    }
    if (!response.ok) {
        throw new Error(`照片上传失败：${response.status}`);
    }
    return payload;
}
function unwrapHudsonEnvelope(response) {
    if (response.success === false || (response.code !== undefined && response.code !== 0)) {
        throw new Error(readHudsonErrorMessage(response) || '接口返回失败');
    }
    if (response.data === undefined) {
        throw new Error('接口未返回 data 字段');
    }
    return response.data;
}
function readHudsonErrorMessage(payload) {
    const record = asRecord(payload);
    return readString(record.errorMsg ?? record.errorDetail ?? record.message ?? record.errorCode, '');
}
function adaptStoreOptions(response) {
    const payload = unwrapHudsonEnvelope(response);
    if (!Array.isArray(payload))
        return storeOptions;
    const stores = payload.map((item) => {
        const record = asRecord(item);
        return {
            id: readString(record.id, ''),
            label: readString(record.name, ''),
        };
    });
    return stores.filter((item) => item.id && item.label);
}
function adaptGroupOptions(response) {
    const payload = unwrapHudsonEnvelope(response);
    if (!Array.isArray(payload))
        return groupOptions;
    const groups = payload.map((item) => {
        const record = asRecord(item);
        return {
            id: readString(record.id, ''),
            label: readString(record.name, ''),
        };
    });
    return groups.filter((item) => item.id && item.label);
}
function adaptRoomTypeRows(input) {
    if (!Array.isArray(input))
        return [];
    return input.map((item, index) => {
        const record = asRecord(item);
        const linkRcs = Array.isArray(record.linkRcs) ? record.linkRcs : [];
        const linkedRoomTypeIds = linkRcs
            .map((link) => readString(asRecord(link).roomCategoryId ?? asRecord(link).linkedRoomCategoryId ?? asRecord(link).id, ''))
            .filter(Boolean);
        const linkedRoomTypeNames = linkRcs.length
            ? linkRcs
                .map((link) => readString(asRecord(link).roomCategoryName ?? asRecord(link).linkedRoomCategoryName ?? asRecord(link).name, ''))
                .filter(Boolean)
            : splitRoomNames(record.linkRoomCategoryNames ?? record.linkedRoomTypeNames);
        return {
            id: readString(record.id, `room-type-api-${index + 1}`),
            name: readString(record.name ?? record.roomCategoryName, `房型${index + 1}`),
            storeId: readString(record.poiId, defaultStoreId),
            storeName: readString(record.poiName, storeOptions[0].label),
            roomCount: readNumber(record.roomNum ?? record.roomCount, 0),
            roomNames: splitRoomNames(record.roomNames ?? record.roomNo),
            linkedRoomTypeIds,
            linkedRoomTypeNames,
            groupId: readString(record.roomCategoryGroupId, ''),
            groupName: readString(record.roomCategoryGroupName, ''),
        };
    });
}
function adaptRoomTypeDraft(input, fallbackMode, traceId, timestamp) {
    const record = asRecord(input);
    const form = asRecord(record.form || record);
    const mode = readString(record.mode, fallbackMode) === 'create' ? 'create' : fallbackMode;
    const roomNosInput = form.roomNos ?? form.roomNames ?? form.roomNo;
    const roomNos = Array.isArray(roomNosInput)
        ? roomNosInput.map((item) => readString(item, '')).filter(Boolean)
        : splitRoomNames(roomNosInput);
    const stepsInput = record.steps;
    const steps = Array.isArray(stepsInput) ? stepsInput.map((item) => readString(item, '')).filter(Boolean) : roomTypeSteps;
    const photos = readRoomTypePhotos(form.photos ?? form.photoList ?? form.roomCategoryPhotos ?? form.images);
    const photoCountsRecord = asRecord(form.photoCounts);
    const photoCounts = Object.keys(photoCountsRecord).length ? readPhotoCounts(photoCountsRecord) : countRoomTypePhotos(photos);
    return {
        provider: 'api',
        traceId: readString(traceId, buildTraceId('api-detail')),
        timestamp: readString(timestamp, new Date().toISOString()),
        mode,
        title: readString(record.title, mode === 'create' ? '新增房型' : '房型详情'),
        steps: steps.length ? steps : roomTypeSteps,
        form: {
            roomTypeId: readString(form.roomTypeId ?? form.roomCategoryId, ''),
            roomTypeName: readString(form.roomTypeName ?? form.roomCategoryName ?? form.name, ''),
            storeId: readString(form.storeId ?? form.poiId, defaultStoreId),
            groupId: readString(form.groupId ?? form.roomCategoryGroupId, groupOptions[0].id),
            roomCount: readString(form.roomCount ?? form.roomNum, String(roomNos.length || 1)),
            roomNos: roomNos.length ? roomNos : ['房间1'],
            weekdayPrice: readString(form.weekdayPrice ?? form.basePrice ?? form.weekdayPriceCent, ''),
            weekendPrice: readString(form.weekendPrice ?? form.weekendPriceCent, ''),
            holidayPrice: readString(form.holidayPrice ?? form.holidayPriceCent, ''),
            locationMode: readLocationMode(form.locationMode),
            locationProvinceCode: readString(form.locationProvinceCode ?? form.provinceCode, ''),
            locationProvinceName: readString(form.locationProvinceName ?? form.provinceName, ''),
            locationCityCode: readString(form.locationCityCode ?? form.cityCode, ''),
            locationCityName: readString(form.locationCityName ?? form.cityName, ''),
            locationDistrictCode: readString(form.locationDistrictCode ?? form.districtCode, ''),
            locationDistrictName: readString(form.locationDistrictName ?? form.districtName, ''),
            streetAddress: readString(form.streetAddress ?? form.address, ''),
            communityName: readString(form.communityName ?? form.community, ''),
            buildingUnit: readString(form.buildingUnit ?? form.unitDoorNo, ''),
            doorNumber: readString(form.doorNumber ?? form.houseNumber, ''),
            locationLatitude: readString(form.locationLatitude ?? form.latitude, ''),
            locationLongitude: readString(form.locationLongitude ?? form.longitude, ''),
            rentalType: readString(form.rentalType, 'entire'),
            propertyType: readString(form.propertyType, 'apartment'),
            suiteArea: readString(form.suiteArea, ''),
            guestCount: readString(form.guestCount, ''),
            bedroomCount: readString(form.bedroomCount, ''),
            livingRoomCount: readString(form.livingRoomCount, ''),
            kitchenCount: readString(form.kitchenCount, ''),
            bathroomCount: readString(form.bathroomCount, ''),
            bathroomType: readBathroomType(form.bathroomType),
            selectedFacilityIds: readStringList(form.selectedFacilityIds ?? form.facilityIds ?? form.facilities),
            bedSheetChangePolicy: readString(form.bedSheetChangePolicy ?? form.beddingChangePolicy, ''),
            decorationStyle: readString(form.decorationStyle, ''),
            displayName: readString(form.displayName, ''),
            earliestCheckIn: readString(form.earliestCheckIn ?? form.earliestCheckInTime, '12'),
            latestCheckOut: readString(form.latestCheckOut ?? form.latestCheckOutTime, '14'),
            latestCheckIn: readString(form.latestCheckIn ?? form.latestCheckInTime, '24'),
            highlightDescription: readString(form.highlightDescription, ''),
            nearbyDescription: readString(form.nearbyDescription, ''),
            articleDescription: readString(form.articleDescription, ''),
            photos,
            photoCounts,
        },
    };
}
function adaptRoomTypeLinkage(input, fallbackRoomTypeId, traceId, timestamp) {
    const record = asRecord(input);
    const candidatesInput = record.candidates ?? record.list ?? record.roomCategories;
    const candidates = Array.isArray(candidatesInput)
        ? candidatesInput.map((item, index) => {
            const candidate = asRecord(item);
            return {
                id: readString(candidate.id ?? candidate.roomCategoryId, `linkage-${index + 1}`),
                name: readString(candidate.name ?? candidate.roomCategoryName, `房型${index + 1}`),
                selected: Boolean(candidate.selected ?? candidate.checked ?? candidate.linked),
            };
        })
        : [];
    return {
        traceId: readString(traceId, buildTraceId('api-linkage')),
        timestamp: readString(timestamp, new Date().toISOString()),
        roomTypeId: readString(record.roomTypeId ?? record.roomCategoryId, fallbackRoomTypeId),
        roomTypeName: readString(record.roomTypeName ?? record.roomCategoryName, ''),
        description: readString(record.description, '设置联动关房后，当前房型关房将联动关联的房型全部关房，关联的房型任一关房，将联动当前房型关房。适用于整租/包栋场景；'),
        candidates,
    };
}
function readResponseMessage(payload, envelopeMessage, fallback) {
    const record = asRecord(payload);
    return readString(record.message ?? envelopeMessage, fallback);
}
function buildRequestSummary(query, rowCount) {
    return [
        `门店：${query.storeId || '全部'}`,
        `分组：${query.groupId || '全部'}`,
        `房型名称：${query.keyword?.trim() || '全部'}`,
        `结果：${rowCount} 条`,
    ];
}
function filterMockRows(query) {
    const keyword = query.keyword?.trim();
    return mockRows.filter((row) => {
        if (query.storeId && row.storeId !== query.storeId)
            return false;
        if (query.groupId && row.groupId !== query.groupId)
            return false;
        if (keyword && !row.name.includes(keyword))
            return false;
        return true;
    });
}
function findRowOrThrow(roomTypeId) {
    const row = mockRows.find((item) => item.id === roomTypeId);
    if (!row)
        throw new Error('未找到对应房型');
    return row;
}
function splitRoomNames(input) {
    const text = readString(input, '');
    if (!text)
        return [];
    return text
        .split(/[、,，\s]+/)
        .map((item) => item.trim())
        .filter(Boolean);
}
function readString(value, fallback) {
    return typeof value === 'string' && value.trim() ? value.trim() : fallback;
}
function readStringList(value) {
    if (Array.isArray(value)) {
        return value.map((item) => readString(item, '')).filter(Boolean);
    }
    if (typeof value === 'string') {
        return value
            .split(/[,，\s]+/)
            .map((item) => item.trim())
            .filter(Boolean);
    }
    return [];
}
function readNumber(value, fallback) {
    return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}
function asRecord(value) {
    return value && typeof value === 'object' ? value : {};
}
function resolveCampId() {
    return (readRuntimeConfig('pmsCampId') ||
        readRuntimeConfig('pms.currentCampId') ||
        readCampIdFromStoredObject('pms.currentCamp') ||
        readCampIdFromStoredObject('pms.camp') ||
        import.meta.env.VITE_PMS_CAMP_ID?.trim() ||
        defaultCampId);
}
function readCampIdFromStoredObject(key) {
    const text = readRuntimeConfig(key);
    if (!text)
        return '';
    try {
        const value = JSON.parse(text);
        return readString(value.campId ?? value.id, '');
    }
    catch {
        return '';
    }
}
function readLocationMode(value) {
    return value === 'independent' ? 'independent' : 'same-store';
}
function readBathroomType(value) {
    return value === 'shared' ? 'shared' : 'private';
}
function readPhotoCounts(value) {
    const record = asRecord(value);
    return Object.fromEntries(roomTypePhotoKeys.map((key) => [key, readNumber(record[key], 0)]));
}
function readRoomTypePhotos(value) {
    const input = Array.isArray(value) ? value : [];
    return input
        .map((item, index) => {
        const record = asRecord(item);
        const url = readString(record.url ?? record.fileUrl ?? record.imageUrl ?? record.path ?? record.src, '');
        if (!url)
            return null;
        return {
            id: readString(record.id ?? record.photoId ?? record.fileId, url),
            sectionKey: readPhotoSectionKey(record.sectionKey ?? record.type ?? record.category),
            name: readString(record.name ?? record.fileName ?? record.originalName, `照片${index + 1}`),
            url,
            size: readNumber(record.size ?? record.fileSize, 0),
            mimeType: readString(record.mimeType ?? record.contentType, 'image/*'),
            sortOrder: readNumber(record.sortOrder ?? record.sort, index + 1),
        };
    })
        .filter((item) => Boolean(item));
}
function adaptUploadedRoomTypePhoto(input, file, fallbackSectionKey) {
    const directUrl = typeof input === 'string' ? input : '';
    const record = directUrl ? { url: directUrl } : asRecord(input);
    const nested = asRecord(record.file ?? record.photo ?? record.asset);
    const source = Object.keys(nested).length ? { ...record, ...nested } : record;
    const url = readString(source.url ?? source.fileUrl ?? source.imageUrl ?? source.path ?? source.src, '');
    if (!url) {
        throw new Error('照片上传接口未返回图片 URL');
    }
    return {
        id: readString(source.id ?? source.photoId ?? source.fileId, url),
        sectionKey: readPhotoSectionKey(source.sectionKey ?? source.type ?? source.category ?? fallbackSectionKey),
        name: readString(source.name ?? source.fileName ?? source.originalName, file.name),
        url,
        size: readNumber(source.size ?? source.fileSize, file.size),
        mimeType: readString(source.mimeType ?? source.contentType, file.type || 'image/*'),
        sortOrder: readNumber(source.sortOrder ?? source.sort, 0),
    };
}
function countRoomTypePhotos(photos) {
    const counts = Object.fromEntries(roomTypePhotoKeys.map((key) => [key, 0]));
    for (const photo of photos) {
        counts[photo.sectionKey] += 1;
    }
    return counts;
}
function readPhotoSectionKey(value) {
    return roomTypePhotoKeys.includes(value) ? value : 'uncategorized';
}
const roomTypePhotoKeys = ['cover', 'livingRoom', 'kitchen', 'other', 'bathroom', 'building', 'entertainment', 'uncategorized'];
function buildTraceId(suffix) {
    return `room-type-info-${suffix}-001`;
}
