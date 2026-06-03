export const houseDaysDataSource = {
    capturedAt: '2026-05-16 11:45 +08:00',
    evidenceBatch: '20260516-audit',
    networkEndpoints: [
        'POST /api/roomStatusesToday/get',
        'POST /api/rooms/get',
        'POST /api/roomCategories/page/get',
        'POST /api/cleanTask/status/count',
    ],
    blocker: '本地 SPA 目前没有可复用的已认证 PMS API 代理或统一请求层，实时接口无法安全接入；当前数据为固定 Chrome 目标站取证快照，未静默伪装为实时成功。',
};
export const statusGroups = [
    {
        title: '入离',
        items: [
            { label: '预抵', value: 1, color: '#5c8df6' },
            { label: '预离', value: 2, color: '#ff9d2e' },
            { label: '在住', value: 2, color: '#48bf62' },
            { label: '重单', value: 0, color: '#f06363' },
        ],
    },
    {
        title: '房态',
        items: [
            { label: '空净', value: 2 },
            { label: '空脏', value: 0 },
            { label: '住净', value: 1 },
            { label: '住脏', value: 1 },
            { label: '关房', value: 0 },
        ],
    },
    {
        title: '保洁状态',
        items: [
            { label: '未开始', value: 0 },
            { label: '进行中', value: 0 },
            { label: '已完成', value: 0 },
            { label: '已过期', value: 0 },
        ],
    },
    {
        title: '其他标签',
        items: [
            { label: '钟点房', value: 0 },
            { label: '长租房', value: 0 },
            { label: '欠费', value: 0 },
            { label: '续住', value: 0 },
            { label: '备注', value: 3 },
        ],
    },
];
export const roomCards = [
    {
        roomType: '顶层套房（浴缸巨幕电竞麻将）',
        roomName: '房间1',
    },
    {
        roomType: '总裁套间（桑拿浴缸露台电竞麻将）',
        roomName: '房间1',
    },
    {
        roomType: '天落大床电竞套间',
        roomName: '1',
        booking: {
            guest: '张祯',
            channel: '携程',
            price: '¥136.62',
            tone: 'blue',
        },
    },
    {
        roomType: '观影大床房',
        roomName: '房间1',
        hasTag: true,
        booking: {
            guest: '胡志深',
            channel: '美团酒店',
            price: '¥112.9',
            tone: 'orange',
        },
    },
];
export const viewModes = ['按房型', '按房间号', '按楼层'];
