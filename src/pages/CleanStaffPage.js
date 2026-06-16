import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CLEAN_STAFF_LIST_PATH, CLEAN_STAFF_STORES_PATH, createCleanStaffExport, createCleanStaffMember, createDefaultCleanStaffQuery, fetchCleanStaffDashboard, } from '../services/cleanStaff';
import { StoreSelectControl } from '../components/StoreSelect';
import { useStoreOptions } from '../hooks/useStoreOptions';
import './CleanStaffPage.css';
const defaultQuery = createDefaultCleanStaffQuery();
const statusOptions = [
    { label: '全部状态', value: 'all' },
    { label: '在岗', value: 'onDuty' },
    { label: '休息', value: 'offDuty' },
    { label: '请假', value: 'leave' },
];
export function CleanStaffPage() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [query, setQuery] = useState(() => ({
        ...defaultQuery,
        scenario: readScenario(searchParams.get('scenario')),
    }));
    const [draftKeyword, setDraftKeyword] = useState(defaultQuery.keyword);
    const [dashboard, setDashboard] = useState(null);
    const [selectedMember, setSelectedMember] = useState(null);
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [feedback, setFeedback] = useState('保洁人员数据已就绪');
    const [refreshKey, setRefreshKey] = useState(0);
    const loadDashboard = useCallback(async (signal) => {
        setIsLoading(true);
        setError('');
        try {
            const nextDashboard = await fetchCleanStaffDashboard(query, signal);
            setDashboard(nextDashboard);
            setFeedback((current) => isActionFeedback(current) ? current : `已同步 ${nextDashboard.pagination.total} 名保洁人员`);
        }
        catch (loadError) {
            if (loadError instanceof DOMException && loadError.name === 'AbortError')
                return;
            setDashboard(null);
            setError(loadError instanceof Error ? loadError.message : '保洁人员数据加载失败');
        }
        finally {
            setIsLoading(false);
        }
    }, [query]);
    useEffect(() => {
        const controller = new AbortController();
        const timer = window.setTimeout(() => {
            void loadDashboard(controller.signal);
        }, 0);
        return () => {
            window.clearTimeout(timer);
            controller.abort();
        };
    }, [loadDashboard, refreshKey]);
    useEffect(() => {
        const nextScenario = readScenario(searchParams.get('scenario'));
        if (query.scenario === nextScenario)
            return;
        setQuery((current) => ({ ...current, scenario: nextScenario, pageNum: 1 }));
        // Route query changes should refresh scenario-specific states.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchParams]);
    const requestText = useMemo(() => {
        const requestBody = dashboard?.requestBody ?? {
            campId: query.campId,
            poiId: query.poiId,
            keyword: query.keyword,
            status: query.status === 'all' ? '' : query.status,
            serviceDate: query.serviceDate,
            pageNum: query.pageNum,
            pageSize: query.pageSize,
        };
        return [
            `provider=${dashboard?.provider ?? 'mock'}`,
            `path=${CLEAN_STAFF_LIST_PATH}`,
            `storesPath=${CLEAN_STAFF_STORES_PATH}`,
            `campId=${requestBody.campId}`,
            `poiId=${requestBody.poiId}`,
            `keyword=${requestBody.keyword}`,
            `status=${requestBody.status}`,
            `serviceDate=${requestBody.serviceDate}`,
            `pageNum=${requestBody.pageNum}`,
            `pageSize=${requestBody.pageSize}`,
        ].join(';');
    }, [dashboard, query]);
    const { storeOptions, storeLoading } = useStoreOptions({
        fallbackOptions: (dashboard?.stores ?? [{ id: 'all', name: '全部门店' }]).map((store) => ({
            id: store.id,
            label: store.name,
        })),
    });
    const list = dashboard?.list ?? [];
    const summary = dashboard?.summary ?? {
        total: 0,
        onDuty: 0,
        offDuty: 0,
        leave: 0,
        todayTasks: 0,
        completedTasks: 0,
        overdueTasks: 0,
    };
    const applySearch = () => {
        setFeedback('正在查询保洁人员');
        setQuery((current) => ({
            ...current,
            keyword: draftKeyword,
            pageNum: 1,
            scenario: 'success',
        }));
    };
    const resetFilters = () => {
        setDraftKeyword('');
        setQuery({
            ...defaultQuery,
            scenario: 'success',
        });
        setFeedback('筛选条件已重置');
    };
    const refresh = () => {
        setQuery((current) => ({ ...current, scenario: 'success' }));
        setRefreshKey((current) => current + 1);
        setFeedback('已刷新当前保洁人员数据');
    };
    const saveMember = async (payload) => {
        setIsLoading(true);
        try {
            await createCleanStaffMember({
                campId: query.campId,
                poiId: query.poiId === 'all' ? undefined : query.poiId,
                ...payload,
            });
            setIsAddOpen(false);
            setFeedback('已保存成员并同步保洁人员列表');
            setRefreshKey((current) => current + 1);
        }
        catch (saveError) {
            setError(saveError instanceof Error ? saveError.message : '保存成员失败');
        }
        finally {
            setIsLoading(false);
        }
    };
    const exportMembers = async () => {
        setIsLoading(true);
        try {
            await createCleanStaffExport(query);
            setFeedback('导出任务已创建，可在下载中心查看');
        }
        catch (exportError) {
            setError(exportError instanceof Error ? exportError.message : '导出任务创建失败');
        }
        finally {
            setIsLoading(false);
        }
    };
    return (_jsxs("div", { className: "clean-staff-page", children: [_jsxs("section", { className: "clean-staff-panel", "aria-label": "\u4FDD\u6D01\u4EBA\u5458\u7B5B\u9009", children: [_jsx(StoreSelectControl, { className: "clean-store-tabs", label: "\u95E8\u5E97\u7B5B\u9009", options: storeOptions.map((store) => ({ id: store.id, name: store.label })), value: query.poiId, disabled: isLoading || storeLoading, onChange: (storeId) => setQuery((current) => ({ ...current, poiId: storeId, pageNum: 1, scenario: 'success' })) }), _jsxs("div", { className: "clean-staff-filters", children: [_jsxs("label", { children: [_jsx("span", { children: "\u65E5\u671F" }), _jsx("input", { type: "date", value: query.serviceDate, disabled: isLoading, onChange: (event) => setQuery((current) => ({ ...current, serviceDate: event.target.value, pageNum: 1, scenario: 'success' })) })] }), _jsxs("label", { children: [_jsx("span", { children: "\u4FDD\u6D01\u72B6\u6001" }), _jsx("select", { "aria-label": "\u4FDD\u6D01\u72B6\u6001", value: query.status, disabled: isLoading, onChange: (event) => setQuery((current) => ({
                                            ...current,
                                            status: event.target.value,
                                            pageNum: 1,
                                            scenario: 'success',
                                        })), children: statusOptions.map((option) => (_jsx("option", { value: option.value, children: option.label }, option.value))) })] }), _jsxs("label", { children: [_jsx("span", { children: "\u641C\u7D22" }), _jsx("input", { type: "search", placeholder: "\u59D3\u540D/\u624B\u673A\u53F7", value: draftKeyword, disabled: isLoading, onChange: (event) => setDraftKeyword(event.target.value), onKeyDown: (event) => {
                                            if (event.key === 'Enter')
                                                applySearch();
                                        } })] }), _jsxs("div", { className: "clean-staff-actions", children: [_jsx("button", { type: "button", className: "is-primary", onClick: applySearch, disabled: isLoading, children: "\u67E5\u8BE2" }), _jsx("button", { type: "button", onClick: resetFilters, disabled: isLoading, children: "\u91CD\u7F6E" }), _jsx("button", { type: "button", onClick: refresh, disabled: isLoading, children: "\u5237\u65B0" }), _jsx("button", { type: "button", onClick: exportMembers, disabled: isLoading || list.length === 0, children: "\u5BFC\u51FA" }), _jsx("button", { type: "button", className: "is-primary", onClick: () => setIsAddOpen(true), disabled: isLoading, children: "\u65B0\u589E\u4FDD\u6D01\u5458" })] })] }), _jsx("output", { "data-testid": "clean-staff-request", className: "clean-staff-request", "aria-label": "\u4FDD\u6D01\u4EBA\u5458\u8BF7\u6C42\u53C2\u6570", hidden: true, children: requestText })] }), _jsxs("section", { className: "clean-staff-metrics", "aria-label": "\u4FDD\u6D01\u4EBA\u5458\u6838\u5FC3\u6307\u6807", "aria-busy": isLoading, children: [_jsx(MetricCard, { label: "\u5728\u5C97\u4FDD\u6D01\u5458", value: `${summary.onDuty} 人`, detail: `总人数 ${summary.total} 人`, onClick: () => setFeedback('已按在岗保洁员维度聚焦列表') }), _jsx(MetricCard, { label: "\u4ECA\u65E5\u4EFB\u52A1", value: `${summary.todayTasks} 单`, detail: `完成 ${summary.completedTasks} 单`, onClick: () => navigate('/cleanManage/cleanTask') }), _jsx(MetricCard, { label: "\u903E\u671F\u4EFB\u52A1", value: `${summary.overdueTasks} 单`, detail: "\u70B9\u51FB\u67E5\u770B\u5F85\u5904\u7406\u4EFB\u52A1", onClick: () => navigate('/cleanManage/cleanTask') }), _jsx(MetricCard, { label: "\u4F11\u606F/\u8BF7\u5047", value: `${summary.offDuty + summary.leave} 人`, detail: "\u7528\u4E8E\u6392\u73ED\u5BB9\u91CF\u5224\u65AD", onClick: () => setFeedback('已切换到排班容量视图') })] }), _jsxs("section", { className: "clean-staff-table-card", "aria-label": "\u4FDD\u6D01\u4EBA\u5458\u6570\u636E", children: [_jsxs("div", { className: "clean-staff-table-card__head", children: [_jsxs("div", { children: [_jsx("h2", { children: "\u4FDD\u6D01\u4EBA\u5458\u5217\u8868" }), _jsx("span", { children: isLoading ? '正在同步数据' : `共 ${dashboard?.pagination.total ?? 0} 名` })] }), _jsxs("span", { className: "clean-staff-sync", children: ["\u6700\u8FD1\u540C\u6B65\uFF1A", dashboard?.generatedAt ?? '-'] })] }), _jsxs("table", { "aria-label": "\u4FDD\u6D01\u4EBA\u5458\u5217\u8868", className: "clean-staff-table", children: [_jsx("thead", { children: _jsxs("tr", { children: [_jsx("th", { children: "\u59D3\u540D" }), _jsx("th", { children: "\u624B\u673A\u53F7" }), _jsx("th", { children: "\u95E8\u5E97" }), _jsx("th", { children: "\u72B6\u6001" }), _jsx("th", { children: "\u623F\u6E90\u8303\u56F4" }), _jsx("th", { children: "\u4ECA\u65E5\u4EFB\u52A1" }), _jsx("th", { children: "\u5B8C\u6210/\u903E\u671F" }), _jsx("th", { children: "\u670D\u52A1\u8BC4\u5206" }), _jsx("th", { children: "\u6700\u540E\u4EFB\u52A1" }), _jsx("th", { children: "\u64CD\u4F5C" })] }) }), _jsx("tbody", { children: list.map((member) => (_jsxs("tr", { "data-testid": "clean-staff-row", children: [_jsxs("td", { children: [_jsx("strong", { children: member.name }), _jsx("span", { children: member.role })] }), _jsx("td", { children: member.mobile }), _jsx("td", { children: member.storeName }), _jsx("td", { children: _jsx("span", { className: `clean-staff-status clean-staff-status--${member.status}`, children: member.statusText }) }), _jsx("td", { children: member.roomScope.join('、') }), _jsx("td", { children: member.todayTasks }), _jsxs("td", { children: [member.completedTasks, "/", member.overdueTasks] }), _jsx("td", { children: member.rating }), _jsx("td", { children: member.lastTaskAt }), _jsx("td", { children: _jsx("button", { type: "button", onClick: () => setSelectedMember(member), children: "\u67E5\u770B\u8BE6\u60C5" }) })] }, member.id))) })] }), !isLoading && list.length === 0 ? (_jsxs("div", { className: "clean-staff-empty", children: [_jsx("strong", { children: "\u6682\u65E0\u7B26\u5408\u6761\u4EF6\u7684\u4FDD\u6D01\u4EBA\u5458" }), _jsx("span", { children: "\u8C03\u6574\u95E8\u5E97\u3001\u72B6\u6001\u6216\u5173\u952E\u8BCD\u540E\u91CD\u65B0\u67E5\u8BE2\u3002" })] })) : null] }), _jsxs("div", { className: "clean-staff-footer", children: [_jsxs("div", { className: "clean-staff-pagination", "aria-label": "\u4FDD\u6D01\u4EBA\u5458\u5206\u9875", children: [_jsx("button", { type: "button", disabled: isLoading || query.pageNum <= 1, onClick: () => setQuery((current) => ({ ...current, pageNum: Math.max(1, current.pageNum - 1) })), children: "\u4E0A\u4E00\u9875" }), _jsxs("span", { children: ["\u7B2C ", query.pageNum, " \u9875"] }), _jsx("button", { type: "button", disabled: isLoading || list.length < query.pageSize, onClick: () => setQuery((current) => ({ ...current, pageNum: current.pageNum + 1 })), children: "\u4E0B\u4E00\u9875" })] }), _jsx("div", { role: "status", "aria-label": "\u4FDD\u6D01\u4EBA\u5458\u64CD\u4F5C\u53CD\u9988", className: "clean-staff-feedback", children: isLoading ? '正在处理保洁人员数据' : error || feedback })] }), selectedMember ? _jsx(DetailDialog, { member: selectedMember, onClose: () => setSelectedMember(null) }) : null, isAddOpen ? _jsx(AddDialog, { isSaving: isLoading, onCancel: () => setIsAddOpen(false), onSave: saveMember }) : null] }));
}
function MetricCard({ label, value, detail, onClick, }) {
    return (_jsxs("button", { type: "button", className: "clean-staff-metric", onClick: onClick, children: [_jsx("span", { children: label }), _jsx("strong", { children: value }), _jsx("small", { children: detail })] }));
}
function DetailDialog({ member, onClose }) {
    return (_jsx("div", { className: "clean-staff-dialog-backdrop", children: _jsxs("section", { className: "clean-staff-dialog", role: "dialog", "aria-modal": "true", "aria-label": `${member.name} 保洁员详情`, children: [_jsxs("header", { children: [_jsxs("div", { children: [_jsxs("h2", { children: [member.name, " \u4FDD\u6D01\u5458\u8BE6\u60C5"] }), _jsx("span", { children: member.storeName })] }), _jsx("button", { type: "button", onClick: onClose, "aria-label": "\u5173\u95ED\u8BE6\u60C5", children: "\u5173\u95ED\u8BE6\u60C5" })] }), _jsxs("dl", { children: [_jsxs("div", { children: [_jsx("dt", { children: "\u4ECA\u65E5\u4EFB\u52A1" }), _jsxs("dd", { children: [member.todayTasks, " \u5355"] })] }), _jsxs("div", { children: [_jsx("dt", { children: "\u5B8C\u6210\u4EFB\u52A1" }), _jsxs("dd", { children: [member.completedTasks, " \u5355"] })] }), _jsxs("div", { children: [_jsx("dt", { children: "\u903E\u671F\u4EFB\u52A1" }), _jsxs("dd", { children: [member.overdueTasks, " \u5355"] })] }), _jsxs("div", { children: [_jsx("dt", { children: "\u670D\u52A1\u8BC4\u5206" }), _jsx("dd", { children: member.rating })] })] }), _jsxs("p", { children: ["\u8D1F\u8D23\u623F\u6E90\uFF1A", member.roomScope.join('、')] })] }) }));
}
function AddDialog({ isSaving, onCancel, onSave, }) {
    const [name, setName] = useState('周敏');
    const [mobile, setMobile] = useState('18612345678');
    const [roomScopeText, setRoomScopeText] = useState('观影大床房、总裁套间');
    return (_jsx("div", { className: "clean-staff-dialog-backdrop", children: _jsxs("section", { className: "clean-staff-dialog clean-staff-dialog--form", role: "dialog", "aria-modal": "true", "aria-label": "\u65B0\u589E\u4FDD\u6D01\u5458", children: [_jsxs("header", { children: [_jsxs("div", { children: [_jsx("h2", { children: "\u65B0\u589E\u4FDD\u6D01\u5458" }), _jsx("span", { children: "\u4FDD\u5B58\u540E\u540C\u6B65\u5230\u5F53\u524D\u4FDD\u6D01\u4EBA\u5458\u5217\u8868\u3002" })] }), _jsx("button", { type: "button", onClick: onCancel, children: "\u53D6\u6D88" })] }), _jsxs("label", { children: [_jsx("span", { children: "\u59D3\u540D" }), _jsx("input", { value: name, onChange: (event) => setName(event.target.value) })] }), _jsxs("label", { children: [_jsx("span", { children: "\u624B\u673A\u53F7" }), _jsx("input", { value: mobile, onChange: (event) => setMobile(event.target.value) })] }), _jsxs("label", { children: [_jsx("span", { children: "\u8D1F\u8D23\u623F\u6E90" }), _jsx("input", { value: roomScopeText, onChange: (event) => setRoomScopeText(event.target.value) })] }), _jsxs("footer", { children: [_jsx("button", { type: "button", onClick: onCancel, disabled: isSaving, children: "\u53D6\u6D88" }), _jsx("button", { type: "button", className: "is-primary", onClick: () => onSave({ name, mobile, roomScopeText, status: 'onDuty' }), disabled: isSaving, children: "\u4FDD\u5B58\u6210\u5458" })] })] }) }));
}
function readScenario(value) {
    if (value === 'empty' || value === 'error')
        return value;
    return 'success';
}
function isActionFeedback(feedback) {
    return ['已刷新', '已保存', '导出任务', '筛选条件'].some((prefix) => feedback.startsWith(prefix));
}
