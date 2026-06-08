import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { createRoomTypeFloor, createRoomTypeTag, createQuickRoomNoSuggestion, deleteRoomType, getRoomTypeInfoProviderName, loadRoomTypeFloorPage, loadRoomTypeInfoDashboard, loadRoomTypeInfoDraft, loadRoomTypeLinkage, loadRoomTypeRooms, loadRoomTypeTagPage, saveRoomTypeDraft, saveRoomTypeLinkage, uploadRoomTypePhoto, } from '../services/roomTypeInfo';
import { fetchStoreOptions } from '../services/storeOptions';
import { RoomTypeLocationSection } from '../components/RoomTypeLocationSection';
import { StoreSelectControl } from '../components/StoreSelect';
import { useStoreOptions } from '../hooks/useStoreOptions';
import './RoomTypeInfoPage.css';
const emptyQuery = {
    storeId: 'all',
    groupId: '',
    keyword: '',
    pageNum: 1,
    pageSize: 20,
    current: 1,
};
const roomTypeEditStoreOptions = [{ id: '1796425098638573570', label: '天落会宿公寓(前海壹方城宝安中心店)' }];
const roomTypeRentalTypeOptions = [
    { value: '', label: '请选择出租类型' },
    { value: 'entire', label: '整套出租' },
    { value: 'independent', label: '独立单间' },
];
const roomTypePropertyTypeOptions = [
    { value: '', label: '请选择房源类型' },
    { value: 'apartment', label: '公寓' },
    { value: 'homestay', label: '民宿' },
];
const roomTypeTimeOptions = [
    { value: '', label: '请选择' },
    ...Array.from({ length: 24 }, (_, index) => {
        const hour = String(index + 1);
        return { value: hour, label: `${hour} 点` };
    }),
];
const roomTypeCountOptions = Array.from({ length: 11 }, (_, index) => ({ value: String(index), label: String(index) }));
const roomTypeBedSheetChangeOptions = [
    { value: '', label: '请选择' },
    { value: 'one-guest-one-change', label: '一客一换' },
    { value: 'daily', label: '每天更换' },
    { value: 'two-days', label: '每两天更换' },
    { value: 'weekly', label: '每周更换' },
];
const roomTypeDecorationStyleOptions = [
    { value: '', label: '请选择' },
    { value: 'modern', label: '现代简约' },
    { value: 'nordic', label: '北欧' },
    { value: 'chinese', label: '新中式' },
    { value: 'japanese', label: '日式' },
    { value: 'luxury', label: '轻奢' },
];
const roomTypeFacilityGroups = [
    {
        title: '核心设施（必填）',
        options: [
            { id: 'air-conditioner', label: '空调' },
            { id: 'tv', label: '电视' },
            { id: 'fridge', label: '冰箱' },
            { id: 'washer', label: '洗衣机' },
            { id: 'water-heater', label: '热水器' },
            { id: 'wifi', label: '无线网络' },
            { id: 'kitchen', label: '厨房' },
            { id: 'dining-table', label: '餐桌' },
            { id: 'disposable-cup', label: '一次性杯子' },
            { id: 'range-hood', label: '抽油烟机' },
        ],
    },
    {
        title: '入住服务',
        options: [
            { id: 'self-checkin', label: '自助入住' },
            { id: 'free-parking', label: '免费停车' },
            { id: 'paid-parking', label: '付费停车' },
            { id: 'luggage-storage', label: '行李寄存' },
            { id: 'airport-transfer', label: '接送机' },
            { id: 'breakfast', label: '早餐' },
            { id: 'car-rental', label: '租车服务' },
            { id: 'ev-charger', label: '充电车位' },
            { id: 'free-water', label: '免费瓶装水' },
            { id: 'team-building', label: '支持团建会议' },
            { id: 'long-rent', label: '可长租' },
            { id: 'butler', label: '管家式服务' },
        ],
    },
    {
        title: '儿童',
        options: [
            { id: 'kids-books', label: '儿童书籍' },
            { id: 'kids-toys', label: '儿童玩具' },
            { id: 'kids-tableware', label: '儿童餐具' },
            { id: 'kids-chair', label: '儿童专用椅' },
            { id: 'kids-bath', label: '儿童洗浴设施' },
            { id: 'corner-protection', label: '桌角防护' },
            { id: 'stroller', label: '儿童推车' },
            { id: 'kids-guardrail', label: '儿童护栏' },
            { id: 'learning-machine', label: '智能学习机' },
            { id: 'storybook-machine', label: '绘本故事机' },
            { id: 'kids-tent', label: '儿童帐篷' },
            { id: 'kids-slide', label: '儿童秋千滑梯' },
            { id: 'kids-robot', label: '儿童智能机器人' },
            { id: 'diaper-table', label: '婴儿尿布台' },
        ],
    },
    {
        title: '卫生',
        control: 'bedSheetChange',
        options: [
            { id: 'cleaning-tools', label: '打扫工具' },
            { id: 'hand-sanitizer', label: '消毒洗手液' },
            { id: 'home-disinfectant', label: '家用消毒液' },
            { id: 'disposable-gloves', label: '一次性手套' },
            { id: 'disinfectant', label: '除菌液' },
            { id: 'air-purifier', label: '空气净化器' },
            { id: 'fresh-air', label: '新风系统' },
            { id: 'disposable-toilet-cover', label: '一次性马桶套' },
            { id: 'disposable-bathtub-cover', label: '一次性浴缸套' },
            { id: 'disposable-towel', label: '一次性毛巾' },
            { id: 'odor-proof-drain', label: '防臭地漏' },
            { id: 'air-freshener', label: '空气清新剂' },
            { id: 'mosquito-coil', label: '蚊香' },
            { id: 'insecticide', label: '杀虫剂' },
            { id: 'white-bedding', label: '白色床品' },
        ],
    },
    {
        title: '周边500米',
        options: [
            { id: 'market', label: '菜市场' },
            { id: 'park', label: '公园' },
            { id: 'supermarket', label: '超市' },
            { id: 'restaurant', label: '餐厅' },
            { id: 'pharmacy', label: '药店' },
            { id: 'atm', label: '提款机' },
            { id: 'garden', label: '公共花园' },
            { id: 'playground', label: '儿童乐园' },
            { id: 'gym', label: '健身房' },
            { id: 'pool', label: '泳池' },
        ],
    },
    {
        title: '质量',
        control: 'decorationStyle',
        options: [],
    },
];
const roomTypePhotoSections = [
    { key: 'cover', label: '封面', limit: 1 },
    { key: 'livingRoom', label: '客厅', limit: 10 },
    { key: 'kitchen', label: '厨房', limit: 10 },
    { key: 'other', label: '其它', limit: 1000 },
    { key: 'bathroom', label: '卫浴', limit: 10 },
    { key: 'building', label: '建筑', limit: 10 },
    { key: 'entertainment', label: '娱乐', limit: 10 },
    { key: 'uncategorized', label: '未分类', limit: 100 },
];
export function RoomTypeInfoPage() {
    const location = useLocation();
    if (location.pathname.includes('/setting/roomTypeInfo/tag') ||
        location.pathname.endsWith('/setting/roomTypeInfo/tags') ||
        location.pathname.endsWith('/setting/roomTypeInfo/tagManage')) {
        return _jsx(RoomTypeTagPage, {});
    }
    if (location.pathname.includes('/setting/roomTypeInfo/floor') ||
        location.pathname.endsWith('/setting/roomTypeInfo/floors') ||
        location.pathname.endsWith('/setting/roomTypeInfo/floorManage')) {
        return _jsx(RoomTypeFloorPage, {});
    }
    if (location.pathname.endsWith('/edit')) {
        return _jsx(RoomTypeEditPage, {});
    }
    return _jsx(RoomTypeListPage, {});
}
function RoomTypeTagPage() {
    const navigate = useNavigate();
    const [pageData, setPageData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [statusMessage, setStatusMessage] = useState('');
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [draftName, setDraftName] = useState('');
    const [draftRoomTypeId, setDraftRoomTypeId] = useState('');
    const [saving, setSaving] = useState(false);
    const [reloadSeed, setReloadSeed] = useState(0);
    useEffect(() => {
        const controller = new AbortController();
        async function loadPage() {
            setLoading(true);
            setError('');
            try {
                const nextPageData = await loadRoomTypeTagPage(controller.signal);
                setPageData(nextPageData);
            }
            catch (loadError) {
                if (controller.signal.aborted)
                    return;
                setPageData(null);
                setError(loadError instanceof Error ? loadError.message : '房型标签加载失败');
            }
            finally {
                if (!controller.signal.aborted)
                    setLoading(false);
            }
        }
        loadPage();
        return () => controller.abort();
    }, [reloadSeed]);
    useEffect(() => {
        if (!statusMessage)
            return;
        const timer = window.setTimeout(() => setStatusMessage(''), 2400);
        return () => window.clearTimeout(timer);
    }, [statusMessage]);
    async function handleCreateTag() {
        setSaving(true);
        try {
            const result = await createRoomTypeTag({ name: draftName, roomTypeId: draftRoomTypeId });
            setShowCreateModal(false);
            setDraftName('');
            setDraftRoomTypeId('');
            setStatusMessage(result.message);
            setReloadSeed((value) => value + 1);
        }
        catch (saveError) {
            setStatusMessage(saveError instanceof Error ? saveError.message : '房型标签创建失败');
        }
        finally {
            setSaving(false);
        }
    }
    return (_jsxs("div", { className: "room-type-tags-page", children: [_jsxs("div", { className: "room-type-tags-page__breadcrumb", children: [_jsx("button", { type: "button", onClick: () => navigate('/setting/roomTypeInfo'), children: "\u623F\u578B\u8BBE\u7F6E" }), _jsx("span", { children: "/" }), _jsx("strong", { children: "\u623F\u578B\u6807\u7B7E" })] }), _jsxs("section", { className: "room-type-tags-page__card", children: [_jsx("div", { className: "room-type-tags-page__toolbar", children: _jsx("button", { type: "button", className: "is-primary", onClick: () => setShowCreateModal(true), children: "\u65B0\u589E\u6807\u7B7E" }) }), loading ? _jsx(StatePanel, { title: "\u623F\u578B\u6807\u7B7E\u52A0\u8F7D\u4E2D", detail: "\u6B63\u5728\u540C\u6B65\u623F\u578B\u6807\u7B7E\u5217\u8868\uFF0C\u8BF7\u7A0D\u5019\u3002" }) : null, !loading && error ? (_jsx(StatePanel, { title: "\u623F\u578B\u6807\u7B7E\u52A0\u8F7D\u5931\u8D25", detail: error, action: _jsx("button", { onClick: () => setReloadSeed((value) => value + 1), children: "\u91CD\u65B0\u52A0\u8F7D" }) })) : null, !loading && !error ? (_jsxs("div", { className: "room-type-tags-table", role: "table", "aria-label": "\u623F\u578B\u6807\u7B7E\u5217\u8868", children: [_jsxs("div", { className: "room-type-tags-table__head", role: "row", children: [_jsx("div", { role: "columnheader", children: "\u5206\u7EC4\u540D\u79F0" }), _jsx("div", { role: "columnheader", children: "\u623F\u578B" }), _jsx("div", { role: "columnheader", children: "\u64CD\u4F5C" })] }), pageData?.rows.length ? (_jsx("div", { className: "room-type-tags-table__body", children: pageData.rows.map((row) => (_jsxs("div", { className: "room-type-tags-table__row", role: "row", children: [_jsx("div", { role: "cell", children: row.name }), _jsx("div", { role: "cell", children: row.roomTypeNames.join('、') }), _jsx("div", { role: "cell", className: "room-type-tags-table__actions", children: _jsx("button", { type: "button", onClick: () => setStatusMessage(`已查看 ${row.name} 标签`), children: "\u8BE6\u60C5" }) })] }, row.id))) })) : (_jsxs("div", { className: "room-type-tags-table__empty", role: "status", "aria-label": "\u623F\u578B\u6807\u7B7E\u7A7A\u6001", children: [_jsx("div", { className: "room-type-tags-table__empty-icon", "aria-hidden": "true" }), _jsx("span", { children: "\u6682\u65E0\u6570\u636E" })] }))] })) : null] }), showCreateModal ? (_jsx("div", { className: "room-type-info-modal-backdrop room-type-tags-modal-backdrop", children: _jsxs("div", { className: "room-type-tags-modal", role: "dialog", "aria-label": "\u6DFB\u52A0\u623F\u578B\u6807\u7B7E", "aria-modal": "true", children: [_jsxs("div", { className: "room-type-tags-modal__header", children: [_jsx("h2", { children: "\u6DFB\u52A0\u623F\u578B\u6807\u7B7E" }), _jsx("button", { type: "button", "aria-label": "\u5173\u95ED\u6DFB\u52A0\u623F\u578B\u6807\u7B7E", onClick: () => setShowCreateModal(false), children: "\u00D7" })] }), _jsxs("div", { className: "room-type-tags-modal__body", children: [_jsxs("label", { className: "room-type-tags-modal__field", children: [_jsxs("span", { children: [_jsx("b", { children: "*" }), " \u5206\u7EC4\u540D\u79F0:"] }), _jsx("input", { value: draftName, placeholder: "\u8BF7\u8F93\u5165", onChange: (event) => setDraftName(event.target.value) })] }), _jsxs("label", { className: "room-type-tags-modal__field", children: [_jsx("span", { children: "\u5173\u8054\u623F\u578B:" }), _jsxs("select", { value: draftRoomTypeId, onChange: (event) => setDraftRoomTypeId(event.target.value), children: [_jsx("option", { value: "", children: "\u9009\u62E9\u5173\u8054\u623F\u578B" }), pageData?.roomTypeOptions.map((option) => (_jsx("option", { value: option.id, children: option.label }, option.id)))] })] })] }), _jsxs("div", { className: "room-type-tags-modal__actions", children: [_jsx("button", { type: "button", onClick: () => setShowCreateModal(false), children: "\u53D6 \u6D88" }), _jsx("button", { type: "button", className: "is-primary", disabled: saving, onClick: () => void handleCreateTag(), children: "\u786E \u5B9A" })] })] }) })) : null, statusMessage ? (_jsx("div", { className: "room-type-info-status", role: "status", "aria-live": "polite", children: statusMessage })) : null] }));
}
function RoomTypeFloorPage() {
    const navigate = useNavigate();
    const [pageData, setPageData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [statusMessage, setStatusMessage] = useState('');
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [draftName, setDraftName] = useState('');
    const [draftRoomTypeId, setDraftRoomTypeId] = useState('');
    const [saving, setSaving] = useState(false);
    const [reloadSeed, setReloadSeed] = useState(0);
    useEffect(() => {
        const controller = new AbortController();
        async function loadPage() {
            setLoading(true);
            setError('');
            try {
                const nextPageData = await loadRoomTypeFloorPage(controller.signal);
                setPageData(nextPageData);
            }
            catch (loadError) {
                if (controller.signal.aborted)
                    return;
                setPageData(null);
                setError(loadError instanceof Error ? loadError.message : '楼层信息加载失败');
            }
            finally {
                if (!controller.signal.aborted)
                    setLoading(false);
            }
        }
        loadPage();
        return () => controller.abort();
    }, [reloadSeed]);
    useEffect(() => {
        if (!statusMessage)
            return;
        const timer = window.setTimeout(() => setStatusMessage(''), 2400);
        return () => window.clearTimeout(timer);
    }, [statusMessage]);
    async function handleCreateFloor() {
        setSaving(true);
        try {
            const result = await createRoomTypeFloor({ name: draftName, roomTypeId: draftRoomTypeId });
            setShowCreateModal(false);
            setDraftName('');
            setDraftRoomTypeId('');
            setStatusMessage(result.message);
            setReloadSeed((value) => value + 1);
        }
        catch (saveError) {
            setStatusMessage(saveError instanceof Error ? saveError.message : '楼层信息创建失败');
        }
        finally {
            setSaving(false);
        }
    }
    return (_jsxs("div", { className: "room-type-tags-page room-type-floors-page", children: [_jsxs("div", { className: "room-type-tags-page__breadcrumb", children: [_jsx("button", { type: "button", onClick: () => navigate('/setting/roomTypeInfo'), children: "\u623F\u578B\u8BBE\u7F6E" }), _jsx("span", { children: "/" }), _jsx("strong", { children: "\u697C\u5C42\u7BA1\u7406" })] }), _jsxs("section", { className: "room-type-tags-page__card", children: [_jsx("div", { className: "room-type-tags-page__toolbar", children: _jsx("button", { type: "button", className: "is-primary", onClick: () => setShowCreateModal(true), children: "\u6DFB\u52A0\u697C\u5C42" }) }), loading ? _jsx(StatePanel, { title: "\u697C\u5C42\u4FE1\u606F\u52A0\u8F7D\u4E2D", detail: "\u6B63\u5728\u540C\u6B65\u697C\u5C42\u5217\u8868\uFF0C\u8BF7\u7A0D\u5019\u3002" }) : null, !loading && error ? (_jsx(StatePanel, { title: "\u697C\u5C42\u4FE1\u606F\u52A0\u8F7D\u5931\u8D25", detail: error, action: _jsx("button", { onClick: () => setReloadSeed((value) => value + 1), children: "\u91CD\u65B0\u52A0\u8F7D" }) })) : null, !loading && !error ? (_jsxs("div", { className: "room-type-tags-table", role: "table", "aria-label": "\u697C\u5C42\u4FE1\u606F\u5217\u8868", children: [_jsxs("div", { className: "room-type-tags-table__head", role: "row", children: [_jsx("div", { role: "columnheader", children: "\u697C\u5C42\u540D" }), _jsx("div", { role: "columnheader", children: "\u623F\u95F4" }), _jsx("div", { role: "columnheader", children: "\u64CD\u4F5C" })] }), pageData?.rows.length ? (_jsx("div", { className: "room-type-tags-table__body", children: pageData.rows.map((row) => (_jsxs("div", { className: "room-type-tags-table__row", role: "row", children: [_jsx("div", { role: "cell", children: row.name }), _jsx("div", { role: "cell", children: row.roomTypeNames.join('、') }), _jsx("div", { role: "cell", className: "room-type-tags-table__actions", children: _jsx("button", { type: "button", onClick: () => setStatusMessage(`已查看${row.name}楼层`), children: "\u8BE6\u60C5" }) })] }, row.id))) })) : (_jsxs("div", { className: "room-type-tags-table__empty", role: "status", "aria-label": "\u697C\u5C42\u4FE1\u606F\u7A7A\u72B6\u6001", children: [_jsx("div", { className: "room-type-tags-table__empty-icon", "aria-hidden": "true" }), _jsx("span", { children: "\u6682\u65E0\u6570\u636E" })] }))] })) : null] }), showCreateModal ? (_jsx("div", { className: "room-type-info-modal-backdrop room-type-tags-modal-backdrop", children: _jsxs("div", { className: "room-type-tags-modal room-type-floors-modal", role: "dialog", "aria-label": "\u6DFB\u52A0\u697C\u5C42", "aria-modal": "true", children: [_jsxs("div", { className: "room-type-tags-modal__header", children: [_jsx("h2", { children: "\u6DFB\u52A0\u697C\u5C42" }), _jsx("button", { type: "button", "aria-label": "\u5173\u95ED\u6DFB\u52A0\u697C\u5C42", onClick: () => setShowCreateModal(false), children: "\u00D7" })] }), _jsxs("div", { className: "room-type-tags-modal__body", children: [_jsxs("label", { className: "room-type-tags-modal__field", children: [_jsxs("span", { children: [_jsx("b", { children: "*" }), " \u697C\u5C42\u540D\u79F0:"] }), _jsx("input", { value: draftName, placeholder: "\u8BF7\u8F93\u5165", onChange: (event) => setDraftName(event.target.value) })] }), _jsxs("label", { className: "room-type-tags-modal__field", children: [_jsx("span", { children: "\u5173\u8054\u623F\u95F4:" }), _jsxs("select", { value: draftRoomTypeId, onChange: (event) => setDraftRoomTypeId(event.target.value), children: [_jsx("option", { value: "", children: "\u8BF7\u9009\u62E9" }), pageData?.roomTypeOptions.map((option) => (_jsx("option", { value: option.id, children: option.label }, option.id)))] })] })] }), _jsxs("div", { className: "room-type-tags-modal__actions", children: [_jsx("button", { type: "button", onClick: () => setShowCreateModal(false), children: "\u53D6 \u6D88" }), _jsx("button", { type: "button", className: "is-primary", disabled: saving, onClick: () => void handleCreateFloor(), children: "\u786E \u5B9A" })] })] }) })) : null, statusMessage ? (_jsx("div", { className: "room-type-info-status", role: "status", "aria-live": "polite", children: statusMessage })) : null] }));
}
function RoomTypeListPage() {
    const location = useLocation();
    const navigate = useNavigate();
    const [queryDraft, setQueryDraft] = useState(emptyQuery);
    const [submittedQuery, setSubmittedQuery] = useState(emptyQuery);
    const [dashboard, setDashboard] = useState(null);
    const [loading, setLoading] = useState(true);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');
    const [openSelect, setOpenSelect] = useState(null);
    const [dialog, setDialog] = useState(null);
    const [statusMessage, setStatusMessage] = useState('');
    const { storeOptions, storeLoading } = useStoreOptions({
        fallbackOptions: dashboard?.stores ?? [{ id: 'all', label: '全部门店' }],
    });
    useEffect(() => {
        const controller = new AbortController();
        async function loadDashboard() {
            setLoading(true);
            setError('');
            try {
                const nextDashboard = await loadRoomTypeInfoDashboard(submittedQuery, controller.signal);
                setDashboard(nextDashboard);
            }
            catch (loadError) {
                if (controller.signal.aborted)
                    return;
                setDashboard(null);
                setError(loadError instanceof Error ? loadError.message : '房型信息加载失败');
            }
            finally {
                if (!controller.signal.aborted)
                    setLoading(false);
            }
        }
        loadDashboard();
        return () => controller.abort();
    }, [submittedQuery, location.search]);
    useEffect(() => {
        if (!statusMessage)
            return;
        const timer = window.setTimeout(() => setStatusMessage(''), 2400);
        return () => window.clearTimeout(timer);
    }, [statusMessage]);
    const hasRows = (dashboard?.rows.length ?? 0) > 0;
    async function openRoomsDialog(row) {
        setBusy(true);
        try {
            const data = await loadRoomTypeRooms(row.id);
            setDialog({ kind: 'rooms', data });
        }
        catch (openError) {
            setStatusMessage(openError instanceof Error ? openError.message : '房间列表加载失败');
        }
        finally {
            setBusy(false);
        }
    }
    async function openLinkageDialog(row) {
        setBusy(true);
        try {
            const data = await loadRoomTypeLinkage(row.id);
            setDialog({
                kind: 'linkage',
                data,
                keyword: '',
                appliedKeyword: '',
                selectedIds: data.candidates.filter((item) => item.selected).map((item) => item.id),
            });
        }
        catch (openError) {
            setStatusMessage(openError instanceof Error ? openError.message : '联动关房加载失败');
        }
        finally {
            setBusy(false);
        }
    }
    async function confirmDelete() {
        if (!dialog || dialog.kind !== 'delete')
            return;
        setDialog({ ...dialog, busy: true });
        try {
            const result = await deleteRoomType(dialog.row.id);
            setDialog(null);
            setStatusMessage(result.message);
            setSubmittedQuery({ ...submittedQuery });
        }
        catch (deleteError) {
            setDialog({ ...dialog, busy: false });
            setStatusMessage(deleteError instanceof Error ? deleteError.message : '删除失败');
        }
    }
    async function confirmLinkage() {
        if (!dialog || dialog.kind !== 'linkage')
            return;
        try {
            const result = await saveRoomTypeLinkage(dialog.data.roomTypeId, dialog.selectedIds);
            setDialog(null);
            setStatusMessage(result.message);
            setSubmittedQuery({ ...submittedQuery });
        }
        catch (saveError) {
            setStatusMessage(saveError instanceof Error ? saveError.message : '联动关房保存失败');
        }
    }
    const linkageCandidates = dialog && dialog.kind === 'linkage'
        ? dialog.data.candidates.filter((item) => item.name.includes(dialog.appliedKeyword.trim()))
        : [];
    return (_jsxs("div", { className: "room-type-info-page", children: [_jsx("h1", { className: "sr-only-heading", children: "\u623F\u578B\u4FE1\u606F" }), dashboard ? (_jsx("div", { "data-testid": "room-type-info-contract", "data-provider": dashboard.provider, "data-endpoint": dashboard.endpoint, "data-trace-id": dashboard.traceId, "data-request-summary": dashboard.requestSummary.join(' | '), hidden: true })) : null, _jsxs("section", { className: "room-type-info-query", "aria-label": "\u623F\u578B\u4FE1\u606F\u7B5B\u9009", children: [_jsx(StoreSelectControl, { className: "room-type-info-store-select", label: "\u95E8\u5E97", options: storeOptions.map((store) => ({ id: store.id, name: store.label })), value: queryDraft.storeId, disabled: storeLoading, onChange: (storeId) => {
                            setQueryDraft({ ...queryDraft, storeId });
                            setOpenSelect(null);
                        } }), _jsx(FilterSelector, { label: "\u5206\u7EC4", open: openSelect === 'group', value: dashboard?.groups.find((item) => item.id === queryDraft.groupId)?.label || '', placeholder: "\u5206\u7EC4 \u8BF7\u9009\u62E9", options: dashboard?.groups ?? [], onToggle: () => setOpenSelect(openSelect === 'group' ? null : 'group'), onSelect: (value) => {
                            setQueryDraft({ ...queryDraft, groupId: value });
                            setOpenSelect(null);
                        } }), _jsxs("label", { className: "room-type-info-filter room-type-info-filter--keyword", children: [_jsx("span", { children: "\u623F\u578B\u540D\u79F0" }), _jsx("input", { "aria-label": "\u623F\u578B\u540D\u79F0", value: queryDraft.keyword || '', onChange: (event) => setQueryDraft({ ...queryDraft, keyword: event.target.value }), placeholder: "\u8BF7\u8F93\u5165\u623F\u578B\u540D\u79F0" })] }), _jsxs("div", { className: "room-type-info-actions", children: [_jsx("button", { type: "button", onClick: () => {
                                    setOpenSelect(null);
                                    setQueryDraft(emptyQuery);
                                    setSubmittedQuery(emptyQuery);
                                }, children: "\u91CD \u7F6E" }), _jsx("button", { type: "button", className: "is-primary", onClick: () => {
                                    setOpenSelect(null);
                                    setSubmittedQuery({ ...queryDraft });
                                }, children: "\u67E5 \u8BE2" })] })] }), _jsxs("section", { className: "room-type-info-panel", children: [_jsxs("div", { className: "room-type-info-toolbar", children: [_jsxs("div", { className: "room-type-info-stock", children: [_jsx("span", { children: "\u5F53\u524D\u7CFB\u7EDF\u5E93\u5B58\uFF1A" }), _jsxs("strong", { children: [dashboard?.stockSummary.used ?? 0, "/", dashboard?.stockSummary.total ?? 0] }), _jsxs("em", { children: ["\uFF08", dashboard?.stockSummary.startDate ?? '--', " \u81F3 ", dashboard?.stockSummary.endDate ?? '--', "\uFF09"] })] }), _jsxs("div", { className: "room-type-info-tools", "aria-label": "\u623F\u578B\u4FE1\u606F\u5DE5\u5177\u680F", children: [_jsx("button", { type: "button", onClick: () => navigate('/setting/roomTypeInfo/edit?mode=create', { state: { mode: 'create' } }), children: "\u6DFB\u52A0\u623F\u578B" }), _jsx("button", { type: "button", onClick: () => navigate('/setting/roomTypeInfo/tag'), children: "\u6807\u7B7E\u7BA1\u7406" }), _jsx("button", { type: "button", onClick: () => navigate('/setting/roomTypeInfo/floor'), children: "\u697C\u5C42\u7BA1\u7406" })] })] }), loading ? (_jsx(StatePanel, { title: "\u623F\u578B\u4FE1\u606F\u52A0\u8F7D\u4E2D", detail: "\u6B63\u5728\u540C\u6B65\u623F\u578B\u5217\u8868\u548C\u7B5B\u9009\u9879\uFF0C\u8BF7\u7A0D\u5019\u3002" })) : null, !loading && error ? (_jsx(StatePanel, { title: "\u623F\u578B\u4FE1\u606F\u52A0\u8F7D\u5931\u8D25", detail: error, action: _jsx("button", { onClick: () => setSubmittedQuery({ ...submittedQuery }), children: "\u91CD\u65B0\u52A0\u8F7D" }) })) : null, !loading && !error && !hasRows ? (_jsx(StatePanel, { title: "\u6682\u65E0\u623F\u578B\u6570\u636E", detail: "\u5F53\u524D\u7B5B\u9009\u6761\u4EF6\u4E0B\u6CA1\u6709\u53EF\u5C55\u793A\u7684\u623F\u578B\uFF0C\u8BF7\u8C03\u6574\u95E8\u5E97\u3001\u5206\u7EC4\u6216\u623F\u578B\u540D\u79F0\u3002" })) : null, !loading && !error && hasRows && dashboard ? (_jsxs(_Fragment, { children: [_jsxs("div", { className: "room-type-info-table", role: "table", "aria-label": "\u623F\u578B\u4FE1\u606F\u5217\u8868", children: [_jsx("div", { className: "room-type-info-table__head", role: "row", children: ['房型名称', '门店', '房间数量', '房间号', '联动房型', '分组', '操作'].map((column) => (_jsx("div", { role: "columnheader", children: column }, column))) }), _jsx("div", { className: "room-type-info-table__body", children: dashboard.rows.map((row) => (_jsxs("div", { className: "room-type-info-table__row", role: "row", "data-testid": "room-type-info-row", children: [_jsxs("div", { role: "cell", className: "room-type-info-room-name", children: [row.coverImageUrl ? (_jsx("img", { className: "room-type-info-room-name__thumb", src: row.coverImageUrl, alt: `${row.name}照片` })) : (_jsx("span", { className: "room-type-info-room-name__placeholder", "aria-hidden": "true" })), _jsx("span", { className: "room-type-info-room-name__text", title: row.name, children: row.name })] }), _jsx("div", { role: "cell", children: row.storeName }), _jsx("div", { role: "cell", children: row.roomCount }), _jsx("div", { role: "cell", children: row.roomNames.join('、') }), _jsx("div", { role: "cell", children: row.linkedRoomTypeNames.join('、') }), _jsx("div", { role: "cell", children: row.groupName }), _jsxs("div", { role: "cell", className: "room-type-info-row-actions", children: [_jsx("button", { type: "button", onClick: () => navigate(`/setting/roomTypeInfo/edit?mode=detail&id=${row.id}`, {
                                                                state: { mode: 'detail', roomTypeId: row.id },
                                                            }), children: "\u8BE6\u60C5" }), _jsx("button", { type: "button", onClick: () => void openRoomsDialog(row), children: "\u623F\u95F4" }), _jsx("button", { type: "button", onClick: () => void openLinkageDialog(row), children: "\u8054\u52A8\u5173\u623F" }), _jsx("button", { type: "button", className: "is-danger", onClick: () => setDialog({ kind: 'delete', row, busy: false }), children: "\u5220\u9664" })] })] }, row.id))) })] }), _jsxs("div", { className: "room-type-info-pagination", children: [_jsxs("span", { children: ["\u7B2C 1-", dashboard.rows.length, " \u6761/\u603B\u5171 ", dashboard.pagination.total, " \u6761"] }), _jsx("button", { type: "button", "aria-current": "page", children: "1" }), _jsx("button", { type: "button", children: "20 \u6761/\u9875" })] })] })) : null] }), busy ? _jsx("div", { className: "room-type-info-busy", children: "\u5904\u7406\u4E2D..." }) : null, dialog?.kind === 'rooms' ? (_jsx(Dialog, { title: "\u623F\u95F4\u5217\u8868", onClose: () => setDialog(null), children: _jsxs("div", { className: "room-type-info-room-table", children: [_jsxs("div", { className: "room-type-info-room-table__head", children: [_jsx("span", { children: "\u623F\u95F4\u540D\u79F0" }), _jsx("span", { children: "\u623F\u578B\u540D\u79F0" }), _jsx("span", { children: "\u95E8\u9501\u60C5\u51B5" }), _jsx("span", { children: "\u697C\u5C42\u540D\u79F0" })] }), dialog.data.rooms.map((room) => (_jsxs("div", { className: "room-type-info-room-table__row", children: [_jsx("span", { children: room.roomName }), _jsx("span", { children: room.roomTypeName }), _jsx("span", { children: room.lockStatus }), _jsx("span", { children: room.floorName })] }, room.id)))] }) })) : null, dialog?.kind === 'linkage' ? (_jsxs(Dialog, { title: "\u8054\u52A8\u5173\u623F", onClose: () => setDialog(null), children: [_jsx("p", { className: "room-type-info-modal__copy", children: dialog.data.description }), _jsxs("div", { className: "room-type-info-linkage-search", children: [_jsx("input", { "aria-label": "\u8054\u52A8\u623F\u578B\u641C\u7D22", placeholder: "\u8BF7\u8F93\u5165\u540D\u79F0", value: dialog.keyword, onChange: (event) => setDialog({ ...dialog, keyword: event.target.value }) }), _jsx("button", { type: "button", onClick: () => setDialog({ ...dialog, keyword: '', appliedKeyword: '', selectedIds: [] }), children: "\u91CD \u7F6E" }), _jsx("button", { type: "button", className: "is-primary", onClick: () => setDialog({ ...dialog, appliedKeyword: dialog.keyword }), children: "\u641C \u7D22" })] }), _jsxs("div", { className: "room-type-info-linkage-toolbar", children: [_jsxs("span", { children: ["\u5DF2\u9009\u4E2D ", dialog.selectedIds.length, " \u9879"] }), _jsx("button", { type: "button", onClick: () => setDialog({
                                    ...dialog,
                                    selectedIds: linkageCandidates.map((item) => item.id),
                                }), children: "\u5168 \u9009" })] }), _jsx("div", { className: "room-type-info-linkage-list", children: linkageCandidates.map((item) => (_jsxs("label", { className: "room-type-info-linkage-item", children: [_jsx("input", { type: "checkbox", checked: dialog.selectedIds.includes(item.id), onChange: (event) => {
                                        const nextSelectedIds = event.target.checked
                                            ? [...dialog.selectedIds, item.id]
                                            : dialog.selectedIds.filter((currentId) => currentId !== item.id);
                                        setDialog({ ...dialog, selectedIds: nextSelectedIds });
                                    } }), _jsx("span", { children: item.name })] }, item.id))) }), _jsx("div", { className: "room-type-info-modal__actions", children: _jsx("button", { type: "button", className: "is-primary", onClick: () => void confirmLinkage(), children: "\u786E \u5B9A" }) })] })) : null, dialog?.kind === 'delete' ? (_jsxs(Dialog, { title: "\u786E\u8BA4\u5220\u9664\u623F\u578B", onClose: () => setDialog(null), children: [_jsx("p", { className: "room-type-info-modal__copy", children: "\u5220\u9664\u623F\u578B\u540E\u5C06\u65E0\u6CD5\u6062\u590D\u3002\u5F53\u524D\u6216\u672A\u6765\u5DF2\u6709\u8BA2\u5355\u65F6\u4E0D\u80FD\u5220\u9664\uFF1B\u786E\u8BA4\u65E0\u76F8\u5173\u8BA2\u5355\u540E\uFF0C\u623F\u95F4\u548C\u672A\u5B8C\u6210\u4FDD\u6D01\u4EFB\u52A1\u5C06\u540C\u6B65\u5220\u9664\u3002" }), _jsxs("div", { className: "room-type-info-modal__actions", children: [_jsx("button", { type: "button", onClick: () => setDialog(null), children: "\u53D6 \u6D88" }), _jsx("button", { type: "button", className: "is-danger-solid", disabled: dialog.busy, onClick: () => void confirmDelete(), children: "\u5220 \u9664" })] })] })) : null, statusMessage ? (_jsx("div", { className: "room-type-info-status", role: "status", "aria-live": "polite", children: statusMessage })) : null] }));
}
function RoomTypeEditPage() {
    const location = useLocation();
    const navigate = useNavigate();
    const routeState = (location.state ?? {});
    const params = new URLSearchParams(location.search);
    const mode = (routeState.mode || params.get('mode') || 'create');
    const roomTypeId = routeState.roomTypeId || params.get('id') || '';
    const [draft, setDraft] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [statusMessage, setStatusMessage] = useState('');
    const [activeStep, setActiveStep] = useState(0);
    const [saving, setSaving] = useState(false);
    const [uploadingPhotoSections, setUploadingPhotoSections] = useState({});
    const [storeOptions, setStoreOptions] = useState(roomTypeEditStoreOptions);
    useEffect(() => {
        const controller = new AbortController();
        async function loadDraft() {
            setLoading(true);
            setError('');
            try {
                const [nextDraft, nextStoreOptions] = await Promise.all([
                    loadRoomTypeInfoDraft(mode, roomTypeId, controller.signal),
                    getRoomTypeInfoProviderName() === 'api'
                        ? fetchStoreOptions({ signal: controller.signal, includeAll: false })
                        : Promise.resolve(roomTypeEditStoreOptions),
                ]);
                setStoreOptions(nextStoreOptions.length ? nextStoreOptions : roomTypeEditStoreOptions);
                setDraft(nextDraft);
            }
            catch (loadError) {
                if (controller.signal.aborted)
                    return;
                setDraft(null);
                setError(loadError instanceof Error ? loadError.message : '房型详情加载失败');
            }
            finally {
                if (!controller.signal.aborted)
                    setLoading(false);
            }
        }
        loadDraft();
        return () => controller.abort();
    }, [mode, roomTypeId]);
    useEffect(() => {
        if (!statusMessage)
            return;
        const timer = window.setTimeout(() => setStatusMessage(''), 2400);
        return () => window.clearTimeout(timer);
    }, [statusMessage]);
    async function handleSave() {
        if (!draft)
            return;
        setSaving(true);
        try {
            const result = await saveRoomTypeDraft(draft.form);
            setStatusMessage(result.message);
            navigate('/setting/roomTypeInfo');
        }
        catch (saveError) {
            setStatusMessage(saveError instanceof Error ? saveError.message : '房型保存失败');
        }
        finally {
            setSaving(false);
        }
    }
    function updateForm(key, value) {
        if (!draft)
            return;
        setDraft({ ...draft, form: { ...draft.form, [key]: value } });
    }
    function updateFormPatch(patch) {
        if (!draft)
            return;
        setDraft({ ...draft, form: { ...draft.form, ...patch } });
    }
    function toggleFacilityOption(optionId) {
        if (!draft)
            return;
        const selectedFacilityIds = draft.form.selectedFacilityIds.includes(optionId)
            ? draft.form.selectedFacilityIds.filter((item) => item !== optionId)
            : [...draft.form.selectedFacilityIds, optionId];
        updateForm('selectedFacilityIds', selectedFacilityIds);
    }
    function syncRoomCount(nextCountText) {
        if (!draft)
            return;
        const safeCount = Math.max(1, Number.parseInt(nextCountText, 10) || 1);
        const currentRoomNos = draft.form.roomNos.length ? [...draft.form.roomNos] : ['房间1'];
        const currentRoomIds = draft.form.roomIds.length ? [...draft.form.roomIds] : [];
        const nextRoomNos = currentRoomNos.length >= safeCount
            ? currentRoomNos.slice(0, safeCount)
            : [
                ...currentRoomNos,
                ...Array.from({ length: safeCount - currentRoomNos.length }, (_, index) => `房间${currentRoomNos.length + index + 1}`),
            ];
        const nextRoomIds = currentRoomIds.length >= safeCount
            ? currentRoomIds.slice(0, safeCount)
            : [...currentRoomIds, ...Array.from({ length: safeCount - currentRoomIds.length }, () => '')];
        setDraft({
            ...draft,
            form: {
                ...draft.form,
                roomCount: String(safeCount),
                roomIds: nextRoomIds,
                roomNos: nextRoomNos,
            },
        });
    }
    function updateRoomNo(index, value) {
        if (!draft)
            return;
        const nextRoomNos = draft.form.roomNos.map((item, currentIndex) => (currentIndex === index ? value : item));
        updateForm('roomNos', nextRoomNos);
    }
    function addRoomNo() {
        if (!draft)
            return;
        const nextRoomNos = [...draft.form.roomNos, `房间${draft.form.roomNos.length + 1}`];
        const nextRoomIds = [...draft.form.roomIds, ''];
        setDraft({
            ...draft,
            form: {
                ...draft.form,
                roomIds: nextRoomIds,
                roomNos: nextRoomNos,
                roomCount: String(nextRoomNos.length),
            },
        });
    }
    function removeRoomNo(index) {
        if (!draft || draft.form.roomNos.length <= 1)
            return;
        const nextRoomNos = draft.form.roomNos.filter((_, currentIndex) => currentIndex !== index);
        const nextRoomIds = draft.form.roomIds.filter((_, currentIndex) => currentIndex !== index);
        setDraft({
            ...draft,
            form: {
                ...draft.form,
                roomIds: nextRoomIds,
                roomNos: nextRoomNos,
                roomCount: String(nextRoomNos.length),
            },
        });
    }
    async function handlePhotoFiles(section, fileList) {
        if (!draft || !fileList?.length)
            return;
        const existingCount = draft.form.photos.filter((photo) => photo.sectionKey === section.key).length;
        const remaining = section.limit - existingCount;
        const files = Array.from(fileList).slice(0, Math.max(0, remaining));
        if (!files.length) {
            setStatusMessage(`${section.label}最多上传 ${section.limit} 张`);
            return;
        }
        setUploadingPhotoSections((value) => ({ ...value, [section.key]: true }));
        try {
            for (const file of files) {
                const uploadedPhoto = await uploadRoomTypePhoto({
                    file,
                    sectionKey: section.key,
                    roomTypeId: draft.form.roomTypeId,
                });
                appendRoomTypePhoto(section.key, uploadedPhoto);
            }
            setStatusMessage('照片上传成功');
        }
        catch (uploadError) {
            setStatusMessage(uploadError instanceof Error ? uploadError.message : '照片上传失败');
        }
        finally {
            setUploadingPhotoSections((value) => ({ ...value, [section.key]: false }));
        }
    }
    function appendRoomTypePhoto(sectionKey, photo) {
        setDraft((currentDraft) => {
            if (!currentDraft)
                return currentDraft;
            const sectionPhotoCount = currentDraft.form.photos.filter((item) => item.sectionKey === sectionKey).length;
            const nextPhotos = [
                ...currentDraft.form.photos,
                {
                    ...photo,
                    sectionKey,
                    sortOrder: photo.sortOrder || sectionPhotoCount + 1,
                },
            ];
            return {
                ...currentDraft,
                form: {
                    ...currentDraft.form,
                    photos: nextPhotos,
                    photoCounts: buildPhotoCounts(nextPhotos),
                },
            };
        });
    }
    function removeRoomTypePhoto(photoId) {
        setDraft((currentDraft) => {
            if (!currentDraft)
                return currentDraft;
            const nextPhotos = currentDraft.form.photos.filter((photo) => photo.id !== photoId);
            return {
                ...currentDraft,
                form: {
                    ...currentDraft.form,
                    photos: nextPhotos,
                    photoCounts: buildPhotoCounts(nextPhotos),
                },
            };
        });
    }
    if (loading) {
        return (_jsx("div", { className: "room-type-edit-page", children: _jsx(StatePanel, { title: "\u623F\u578B\u8BE6\u60C5\u52A0\u8F7D\u4E2D", detail: "\u6B63\u5728\u51C6\u5907\u623F\u578B\u8349\u6848\uFF0C\u8BF7\u7A0D\u5019\u3002" }) }));
    }
    if (error || !draft) {
        return (_jsx("div", { className: "room-type-edit-page", children: _jsx(StatePanel, { title: "\u623F\u578B\u8BE6\u60C5\u52A0\u8F7D\u5931\u8D25", detail: error || '当前房型不可用' }) }));
    }
    const isCreateMode = draft.mode === 'create';
    return (_jsxs("div", { className: "room-type-edit-page", children: [_jsxs("div", { className: "room-type-edit-page__breadcrumb", children: [_jsx("button", { type: "button", onClick: () => navigate('/setting/roomTypeInfo'), children: "\u623F\u578B\u8BBE\u7F6E" }), _jsx("span", { children: "/" }), _jsx("strong", { children: draft.title })] }), _jsxs("section", { className: "room-type-edit-page__shell", children: [_jsx("div", { className: "room-type-edit-page__tabs", "aria-label": "\u623F\u578B\u8BBE\u7F6E\u6B65\u9AA4", children: draft.steps.map((step, index) => (_jsx("button", { type: "button", className: index === activeStep ? 'is-active' : '', "aria-current": index === activeStep ? 'step' : undefined, onClick: () => setActiveStep(index), children: step }, step))) }), _jsxs("div", { className: "room-type-edit-page__panel", children: [activeStep === 0 ? (_jsxs("section", { className: "room-type-edit-page__section", children: [_jsx("h2", { children: "\u57FA\u7840\u4FE1\u606F" }), _jsxs("div", { className: "room-type-edit-page__field-list", children: [_jsxs("label", { className: "room-type-edit-page__field", children: [_jsx("span", { children: "\u6240\u5C5E\u95E8\u5E97:" }), _jsx("select", { "aria-label": "\u6240\u5C5E\u95E8\u5E97", value: draft.form.storeId, onChange: (event) => updateForm('storeId', event.target.value), children: storeOptions.map((option) => (_jsx("option", { value: option.id, children: option.label }, option.id))) })] }), _jsxs("label", { className: "room-type-edit-page__field", children: [_jsx("span", { children: "\u623F\u578B\u540D\u79F0:" }), _jsxs("div", { className: "room-type-edit-page__field-stack", children: [_jsx("input", { "aria-label": "\u623F\u578B\u540D\u79F0", value: draft.form.roomTypeName, placeholder: "\u8BF7\u8F93\u5165\u623F\u578B\u540D\u79F0", onChange: (event) => updateForm('roomTypeName', event.target.value) }), _jsx("small", { children: "\u5185\u90E8\u81EA\u7528\uFF0C\u4E0D\u5BF9\u5916\u5C55\u793A" })] })] }), _jsxs("label", { className: "room-type-edit-page__field", children: [_jsx("span", { children: "\u623F\u95F4\u6570\u91CF:" }), _jsxs("div", { className: "room-type-edit-page__suffix-input", children: [_jsx("input", { "aria-label": "\u623F\u95F4\u6570\u91CF", inputMode: "numeric", value: draft.form.roomCount, onChange: (event) => syncRoomCount(event.target.value) }), _jsx("em", { children: "\u95F4" })] })] }), _jsxs("div", { className: "room-type-edit-page__field", children: [_jsx("span", { children: "\u623F\u95F4\u53F7:" }), _jsx("div", { className: "room-type-edit-page__room-list", children: draft.form.roomNos.map((roomNo, index) => (_jsxs("div", { className: "room-type-edit-page__room-row", children: [_jsx("input", { "aria-label": `房间号${index + 1}`, value: roomNo, onChange: (event) => updateRoomNo(index, event.target.value) }), _jsx("button", { type: "button", className: "room-type-edit-page__room-remove", "aria-label": `删除房间号${index + 1}`, onClick: () => removeRoomNo(index), children: "\u2296" }), index === 0 ? (_jsx("button", { type: "button", className: "is-primary room-type-edit-page__room-add", onClick: () => addRoomNo(), children: "\uFF0B \u6DFB\u52A0\u623F\u95F4" })) : null] }, `${index}-${roomNo}`))) })] }), _jsxs("label", { className: "room-type-edit-page__field", children: [_jsx("span", { children: "\u5E73\u65E5\u4EF7:" }), _jsxs("div", { className: "room-type-edit-page__suffix-input", children: [_jsx("input", { "aria-label": "\u5E73\u65E5\u4EF7", inputMode: "decimal", value: draft.form.weekdayPrice, placeholder: "\u8BF7\u8F93\u5165\u5E73\u65E5\u4EF7", onChange: (event) => updateForm('weekdayPrice', event.target.value) }), _jsx("em", { children: "\u5143" })] })] }), _jsxs("label", { className: "room-type-edit-page__field", children: [_jsx("span", { children: "\u5468\u672B\u4EF7:" }), _jsxs("div", { className: "room-type-edit-page__suffix-input", children: [_jsx("input", { "aria-label": "\u5468\u672B\u4EF7", inputMode: "decimal", value: draft.form.weekendPrice, placeholder: "\u8BF7\u8F93\u5165\u5468\u672B\u4EF7", onChange: (event) => updateForm('weekendPrice', event.target.value) }), _jsx("em", { children: "\u5143" })] })] }), _jsxs("label", { className: "room-type-edit-page__field", children: [_jsx("span", { children: "\u8282\u5047\u65E5\u4EF7:" }), _jsxs("div", { className: "room-type-edit-page__suffix-input", children: [_jsx("input", { "aria-label": "\u8282\u5047\u65E5\u4EF7", inputMode: "decimal", value: draft.form.holidayPrice, placeholder: "\u8BF7\u8F93\u5165\u8282\u5047\u65E5\u4EF7", onChange: (event) => updateForm('holidayPrice', event.target.value) }), _jsx("em", { children: "\u5143" })] })] }), _jsxs("p", { className: "room-type-edit-page__tip", children: ["\u521B\u5EFA\u5B8C\u6210\u623F\u6E90\u540E\uFF0C\u4EF7\u683C\u8BF7\u524D\u5F80", _jsx("span", { children: "\u623F\u6001\u623F\u4EF7-\u623F\u4EF7\u7BA1\u7406" }), "\u5904\u67E5\u770B\u4E0E\u7BA1\u7406"] })] })] })) : null, activeStep === 1 ? (_jsxs("section", { className: "room-type-edit-page__section", children: [_jsx("h2", { children: "\u4F4D\u7F6E\u4FE1\u606F" }), _jsx(RoomTypeLocationSection, { form: draft.form, onChange: updateFormPatch })] })) : null, activeStep === 2 ? (_jsxs("section", { className: "room-type-edit-page__section", children: [_jsx("h2", { children: "\u623F\u578B\u8BBE\u65BD" }), _jsxs("div", { className: "room-type-edit-page__field-list", children: [_jsxs("label", { className: "room-type-edit-page__field", children: [_jsx("span", { children: "\u51FA\u79DF\u7C7B\u578B:" }), _jsx("select", { "aria-label": "\u51FA\u79DF\u7C7B\u578B", value: draft.form.rentalType, onChange: (event) => updateForm('rentalType', event.target.value), children: roomTypeRentalTypeOptions.map((option) => (_jsx("option", { value: option.value, children: option.label }, option.value))) })] }), _jsxs("label", { className: "room-type-edit-page__field", children: [_jsx("span", { children: "\u623F\u6E90\u7C7B\u578B:" }), _jsx("select", { "aria-label": "\u623F\u6E90\u7C7B\u578B", value: draft.form.propertyType, onChange: (event) => updateForm('propertyType', event.target.value), children: roomTypePropertyTypeOptions.map((option) => (_jsx("option", { value: option.value, children: option.label }, option.value))) })] }), _jsxs("label", { className: "room-type-edit-page__field", children: [_jsx("span", { children: "\u6574\u5957\u9762\u79EF:" }), _jsxs("div", { className: "room-type-edit-page__suffix-input", children: [_jsx("input", { "aria-label": "\u6574\u5957\u9762\u79EF", inputMode: "decimal", value: draft.form.suiteArea, onChange: (event) => updateForm('suiteArea', event.target.value) }), _jsx("em", { children: "\u33A1" })] })] }), _jsxs("label", { className: "room-type-edit-page__field", children: [_jsx("span", { children: "\u53EF\u4F4F\u4EBA\u6570:" }), _jsxs("div", { className: "room-type-edit-page__suffix-input", children: [_jsx("input", { "aria-label": "\u53EF\u4F4F\u4EBA\u6570", inputMode: "numeric", value: draft.form.guestCount, onChange: (event) => updateForm('guestCount', event.target.value) }), _jsx("em", { children: "\u4EBA" })] })] }), _jsxs("div", { className: "room-type-edit-page__field", children: [_jsx("span", { children: "\u6574\u5957\u6237\u578B:" }), _jsxs("div", { className: "room-type-edit-page__suite-grid", children: [_jsx("select", { "aria-label": "\u5BA4", value: draft.form.bedroomCount, onChange: (event) => updateForm('bedroomCount', event.target.value), children: roomTypeCountOptions.map((option) => (_jsx("option", { value: option.value, children: option.label }, `bedroom-${option.value}`))) }), _jsx("b", { children: "\u5BA4" }), _jsx("select", { "aria-label": "\u5385", value: draft.form.livingRoomCount, onChange: (event) => updateForm('livingRoomCount', event.target.value), children: roomTypeCountOptions.map((option) => (_jsx("option", { value: option.value, children: option.label }, `living-${option.value}`))) }), _jsx("b", { children: "\u5385" }), _jsx("select", { "aria-label": "\u53A8", value: draft.form.kitchenCount, onChange: (event) => updateForm('kitchenCount', event.target.value), children: roomTypeCountOptions.map((option) => (_jsx("option", { value: option.value, children: option.label }, `kitchen-${option.value}`))) }), _jsx("b", { children: "\u53A8" }), _jsx("select", { "aria-label": "\u536B", value: draft.form.bathroomCount, onChange: (event) => updateForm('bathroomCount', event.target.value), children: roomTypeCountOptions.map((option) => (_jsx("option", { value: option.value, children: option.label }, `bathroom-${option.value}`))) }), _jsx("b", { children: "\u536B" })] })] }), _jsxs("div", { className: "room-type-edit-page__field", children: [_jsx("span", { children: "\u536B\u751F\u95F4\u7C7B\u578B:" }), _jsxs("div", { className: "room-type-edit-page__radio-row", children: [_jsxs("label", { children: [_jsx("input", { type: "radio", name: "bathroom-type", checked: draft.form.bathroomType === 'private', onChange: () => updateForm('bathroomType', 'private') }), "\u72EC\u536B"] }), _jsxs("label", { children: [_jsx("input", { type: "radio", name: "bathroom-type", checked: draft.form.bathroomType === 'shared', onChange: () => updateForm('bathroomType', 'shared') }), "\u516C\u536B"] })] })] })] }), _jsx("div", { className: "room-type-facility-section", children: roomTypeFacilityGroups.map((group) => (_jsxs("section", { className: "room-type-facility-section__group", children: [_jsx("h3", { children: group.title }), 'control' in group && group.control === 'bedSheetChange' ? (_jsxs("label", { className: "room-type-facility-section__inline-field", children: [_jsx("span", { children: "\u5E8A\u54C1\u66F4\u6362:" }), _jsx("select", { "aria-label": "\u5E8A\u54C1\u66F4\u6362", value: draft.form.bedSheetChangePolicy, onChange: (event) => updateForm('bedSheetChangePolicy', event.target.value), children: roomTypeBedSheetChangeOptions.map((option) => (_jsx("option", { value: option.value, children: option.label }, option.value || 'empty-bed-sheet-policy'))) })] })) : null, 'control' in group && group.control === 'decorationStyle' ? (_jsxs("label", { className: "room-type-facility-section__inline-field", children: [_jsx("span", { children: "\u88C5\u4FEE\u98CE\u683C:" }), _jsx("select", { "aria-label": "\u88C5\u4FEE\u98CE\u683C", value: draft.form.decorationStyle, onChange: (event) => updateForm('decorationStyle', event.target.value), children: roomTypeDecorationStyleOptions.map((option) => (_jsx("option", { value: option.value, children: option.label }, option.value || 'empty-decoration-style'))) })] })) : null, group.options.length ? (_jsx("div", { className: "room-type-facility-section__options", children: group.options.map((option) => {
                                                        const isSelected = draft.form.selectedFacilityIds.includes(option.id);
                                                        return (_jsx("button", { type: "button", className: isSelected ? 'is-selected' : '', "aria-pressed": isSelected, onClick: () => toggleFacilityOption(option.id), children: option.label }, option.id));
                                                    }) })) : null] }, group.title))) })] })) : null, activeStep === 3 ? (_jsxs("section", { className: "room-type-edit-page__section", children: [_jsx("h2", { children: "\u8BE6\u7EC6\u4ECB\u7ECD" }), _jsxs("div", { className: "room-type-edit-page__field-list", children: [_jsxs("label", { className: "room-type-edit-page__field", children: [_jsx("span", { children: "\u5BF9\u5916\u5C55\u793A\u540D\u79F0:" }), _jsx("input", { "aria-label": "\u5BF9\u5916\u5C55\u793A\u540D\u79F0", value: draft.form.displayName, placeholder: "\u8BF7\u8F93\u5165", onChange: (event) => updateForm('displayName', event.target.value) })] }), _jsxs("label", { className: "room-type-edit-page__field", children: [_jsx("span", { children: "\u6700\u65E9\u5165\u4F4F\u65F6\u95F4:" }), _jsx("select", { "aria-label": "\u6700\u65E9\u5165\u4F4F\u65F6\u95F4", value: draft.form.earliestCheckIn, onChange: (event) => updateForm('earliestCheckIn', event.target.value), children: roomTypeTimeOptions.map((option) => (_jsx("option", { value: option.value, children: option.label }, `earliest-${option.value}`))) })] }), _jsxs("label", { className: "room-type-edit-page__field", children: [_jsx("span", { children: "\u6700\u665A\u79BB\u5E97\u65F6\u95F4:" }), _jsx("select", { "aria-label": "\u6700\u665A\u79BB\u5E97\u65F6\u95F4", value: draft.form.latestCheckOut, onChange: (event) => updateForm('latestCheckOut', event.target.value), children: roomTypeTimeOptions.map((option) => (_jsx("option", { value: option.value, children: option.label }, `checkout-${option.value}`))) })] }), _jsxs("label", { className: "room-type-edit-page__field", children: [_jsx("span", { children: "\u6700\u665A\u5165\u4F4F\u65F6\u95F4:" }), _jsx("select", { "aria-label": "\u6700\u665A\u5165\u4F4F\u65F6\u95F4", value: draft.form.latestCheckIn, onChange: (event) => updateForm('latestCheckIn', event.target.value), children: roomTypeTimeOptions.map((option) => (_jsx("option", { value: option.value, children: option.label }, `checkin-${option.value}`))) })] }), _jsxs("label", { className: "room-type-edit-page__field is-textarea", children: [_jsx("span", { children: "\u4EAE\u70B9\u4ECB\u7ECD:" }), _jsx("textarea", { "aria-label": "\u4EAE\u70B9\u4ECB\u7ECD", value: draft.form.highlightDescription, onChange: (event) => updateForm('highlightDescription', event.target.value) })] }), _jsxs("label", { className: "room-type-edit-page__field is-textarea", children: [_jsx("span", { children: "\u5468\u8FB9\u4ECB\u7ECD:" }), _jsx("textarea", { "aria-label": "\u5468\u8FB9\u4ECB\u7ECD", value: draft.form.nearbyDescription, onChange: (event) => updateForm('nearbyDescription', event.target.value) })] }), _jsxs("div", { className: "room-type-edit-page__field is-editor", children: [_jsx("span", { children: "\u56FE\u6587\u4ECB\u7ECD:" }), _jsxs("div", { className: "room-type-edit-page__editor", children: [_jsxs("div", { className: "room-type-edit-page__editor-toolbar", "aria-hidden": "true", children: [_jsx("button", { type: "button", children: "H" }), _jsx("button", { type: "button", children: "B" }), _jsx("button", { type: "button", children: "I" }), _jsx("button", { type: "button", children: "U" }), _jsx("button", { type: "button", children: "S" }), _jsx("span", { children: "\u5B57\u53F7" }), _jsx("span", { children: "\u884C\u9AD8" }), _jsx("button", { type: "button", children: "Pen" }), _jsx("button", { type: "button", children: "Bg" }), _jsx("button", { type: "button", children: "Link" }), _jsx("button", { type: "button", children: "UL" }), _jsx("button", { type: "button", children: "OL" }), _jsx("button", { type: "button", children: "Q" }), _jsx("button", { type: "button", children: "Face" }), _jsx("button", { type: "button", children: "Table" }), _jsx("button", { type: "button", children: "Undo" }), _jsx("button", { type: "button", children: "Redo" }), _jsx("button", { type: "button", children: "Img" }), _jsx("span", { children: "\u9884\u89C8" })] }), _jsx("textarea", { "aria-label": "\u56FE\u6587\u4ECB\u7ECD\u6B63\u6587", value: draft.form.articleDescription, placeholder: "\u8BF7\u8F93\u5165\u6B63\u6587", onChange: (event) => updateForm('articleDescription', event.target.value) })] })] })] })] })) : null, activeStep === 4 ? (_jsxs("section", { className: "room-type-edit-page__section", children: [_jsx("h2", { children: "\u7167\u7247\u4FE1\u606F" }), _jsx("div", { className: "room-type-edit-page__photo-list", children: roomTypePhotoSections.map((section) => {
                                            const sectionPhotos = draft.form.photos.filter((photo) => photo.sectionKey === section.key);
                                            const isUploading = Boolean(uploadingPhotoSections[section.key]);
                                            const canUploadMore = sectionPhotos.length < section.limit;
                                            return (_jsxs("div", { className: "room-type-edit-page__photo-row", children: [_jsxs("span", { children: [section.label, "(", sectionPhotos.length, "/", section.limit, "):"] }), _jsxs("div", { className: "room-type-edit-page__photo-items", children: [sectionPhotos.map((photo) => (_jsxs("figure", { className: "room-type-edit-page__photo-thumb", children: [_jsx("img", { src: photo.url, alt: photo.name }), _jsx("figcaption", { title: photo.name, children: photo.name }), _jsx("button", { type: "button", "aria-label": `删除${photo.name}`, onClick: () => removeRoomTypePhoto(photo.id), children: "\u5220\u9664" })] }, photo.id))), canUploadMore ? (_jsxs("label", { className: isUploading ? 'room-type-edit-page__upload-card is-disabled' : 'room-type-edit-page__upload-card', children: [_jsx("input", { className: "room-type-edit-page__photo-input", type: "file", accept: "image/*", multiple: section.limit > 1, "aria-label": `上传${section.label}`, disabled: isUploading, onChange: (event) => {
                                                                            void handlePhotoFiles(section, event.target.files);
                                                                            event.currentTarget.value = '';
                                                                        } }), _jsx("b", { children: "\uFF0B" }), _jsx("em", { children: isUploading ? '上传中' : '上传' })] })) : null] })] }, section.key));
                                        }) })] })) : null] })] }), _jsxs("div", { className: "room-type-edit-page__actions", children: [activeStep < draft.steps.length - 1 ? (_jsx("button", { type: "button", className: "is-primary-ghost", onClick: () => setActiveStep(Math.min(activeStep + 1, draft.steps.length - 1)), children: "\u4E0B\u4E00\u6B65" })) : null, activeStep === 0 && isCreateMode ? (_jsx("button", { type: "button", className: "is-primary", onClick: () => {
                            updateFormPatch({
                                roomIds: [],
                                roomNos: createQuickRoomNoSuggestion(draft.form.roomCount),
                            });
                            setStatusMessage('已生成房间号草案');
                        }, children: "\u5FEB\u6377\u521B\u5EFA" })) : null, (activeStep > 0 || !isCreateMode) ? (_jsx("button", { type: "button", className: "is-primary", disabled: saving, onClick: () => void handleSave(), children: "\u4FDD\u5B58\u5E76\u9000\u51FA" })) : null] }), statusMessage ? (_jsx("div", { className: "room-type-info-status", role: "status", "aria-live": "polite", children: statusMessage })) : null] }));
}
function buildPhotoCounts(photos) {
    return Object.fromEntries(roomTypePhotoSections.map((section) => [section.key, photos.filter((photo) => photo.sectionKey === section.key).length]));
}
function FilterSelector(props) {
    const buttonLabel = props.value ? `${props.label} ${props.value}` : props.placeholder;
    return (_jsxs("div", { className: "room-type-info-filter", children: [_jsx("span", { children: props.label }), _jsx("button", { type: "button", onClick: props.onToggle, children: buttonLabel }), props.open ? (_jsx("div", { className: "room-type-info-dropdown", role: "listbox", "aria-label": `${props.label}选项`, children: props.options.map((option) => (_jsx("button", { type: "button", role: "option", onClick: () => props.onSelect(option.id), children: option.label }, option.id))) })) : null] }));
}
function Dialog(props) {
    useEffect(() => {
        function handleKeyDown(event) {
            if (event.key === 'Escape')
                props.onClose();
        }
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [props]);
    return (_jsx("div", { className: "room-type-info-modal-backdrop", children: _jsxs("div", { className: "room-type-info-modal", role: "dialog", "aria-label": props.title, "aria-modal": "true", children: [_jsxs("div", { className: "room-type-info-modal__header", children: [_jsx("h2", { children: props.title }), _jsx("button", { type: "button", onClick: props.onClose, children: "\u5173\u95ED" })] }), props.children] }) }));
}
function StatePanel(props) {
    return (_jsxs("div", { className: "room-type-info-state", children: [_jsx("strong", { children: props.title }), _jsx("p", { children: props.detail }), props.action] }));
}
