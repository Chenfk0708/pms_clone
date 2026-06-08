import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { createMemberPointsExportTask, defaultMemberPointsQuery, fetchMemberPointsDashboard, MemberPointsServiceError, } from '../services/memberPoints';
import { StoreSelectControl } from '../components/StoreSelect';
import { useStoreOptions } from '../hooks/useStoreOptions';
import './MemberPointsPage.css';
export function MemberPointsPage() {
    const initialQuery = useMemo(() => makeInitialQuery(), []);
    const [draft, setDraft] = useState(initialQuery);
    const [query, setQuery] = useState(initialQuery);
    const [dashboard, setDashboard] = useState(null);
    const [serviceError, setServiceError] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [notice, setNotice] = useState('');
    const [selectedMetric, setSelectedMetric] = useState(null);
    const [selectedRecord, setSelectedRecord] = useState(null);
    const [series, setSeries] = useState('issued');
    useEffect(() => {
        document.body.classList.add('member-points-route');
        return () => document.body.classList.remove('member-points-route');
    }, []);
    useEffect(() => {
        const controller = new AbortController();
        async function run() {
            setIsLoading(true);
            setServiceError(null);
            try {
                const nextDashboard = await fetchMemberPointsDashboard(query, controller.signal);
                setDashboard(nextDashboard);
            }
            catch (error) {
                if (error instanceof DOMException && error.name === 'AbortError')
                    return;
                if (error instanceof MemberPointsServiceError) {
                    setServiceError(error);
                    return;
                }
                throw error;
            }
            finally {
                if (!controller.signal.aborted)
                    setIsLoading(false);
            }
        }
        void run();
        return () => controller.abort();
    }, [query]);
    const diagnosticsState = dashboard?.state ?? serviceError?.state ?? query.state ?? 'success';
    const diagnosticsProvider = dashboard?.provider ?? serviceError?.provider ?? 'mock';
    const diagnosticsRequest = dashboard?.request ?? serviceError?.request ?? query;
    const { storeOptions, storeLoading } = useStoreOptions({
        fallbackOptions: (dashboard?.stores ?? [{ id: draft.storeId, name: draft.storeName }]).map((store) => ({
            id: store.id,
            label: store.name,
        })),
    });
    function updateDraft(next) {
        setDraft((current) => ({ ...current, ...next }));
    }
    function applyFilters() {
        setQuery({ ...draft, page: 1 });
        setNotice('筛选条件已应用');
    }
    function resetFilters() {
        const nextQuery = defaultMemberPointsQuery();
        setDraft(nextQuery);
        setQuery(nextQuery);
        setNotice('筛选条件已重置');
    }
    function refresh() {
        setQuery((current) => ({ ...current }));
        setNotice('数据已更新');
    }
    async function exportRecords() {
        setIsLoading(true);
        try {
            await createMemberPointsExportTask(query);
            setNotice('导出任务已创建，可在任务中心查看');
        }
        finally {
            setIsLoading(false);
        }
    }
    function changePage(page) {
        const next = { ...query, page };
        setQuery(next);
        setDraft(next);
        setNotice(`已切换到第 ${page} 页`);
    }
    const maxTrendValue = Math.max(1, ...(dashboard?.trend.map((point) => Math.max(point.issued, point.consumed)) ?? [1]));
    return (_jsxs("div", { className: "member-points-page", children: [_jsx("h1", { className: "sr-only-heading", children: "\u4F1A\u5458\u79EF\u5206" }), _jsx("output", { id: "member-points-diagnostics", hidden: true, "data-provider": diagnosticsProvider, "data-state": diagnosticsState, "data-request": JSON.stringify(diagnosticsRequest) }), _jsxs("section", { className: "member-points-hero", "aria-label": "\u4F1A\u5458\u79EF\u5206\u7B5B\u9009", children: [_jsxs("div", { children: [_jsx("span", { className: "member-points-kicker", children: "SCRM / \u4F1A\u5458\u4E2D\u5FC3" }), _jsx("h2", { children: "\u4F1A\u5458\u79EF\u5206\u8FD0\u8425\u53F0" }), _jsx("p", { children: "\u6309\u95E8\u5E97\u3001\u5468\u671F\u548C\u79EF\u5206\u573A\u666F\u67E5\u770B\u79EF\u5206\u53D1\u653E\u3001\u6D88\u8017\u3001\u6E05\u96F6\u4E0E\u4F1A\u5458\u6D3B\u8DC3\u60C5\u51B5\u3002" })] }), _jsxs("div", { className: "member-points-actions", children: [_jsx("button", { type: "button", onClick: refresh, disabled: isLoading, children: "\u5237\u65B0" }), _jsx("button", { type: "button", onClick: exportRecords, disabled: isLoading || !dashboard?.records.length, children: "\u5BFC\u51FA" })] })] }), _jsxs("section", { className: "member-points-filters", "aria-label": "\u4F1A\u5458\u79EF\u5206\u67E5\u8BE2\u6761\u4EF6", children: [_jsx(StoreSelectControl, { className: "member-points-store-select", label: "\u95E8\u5E97", options: storeOptions.map((store) => ({ id: store.id, name: store.label })), value: draft.storeId, disabled: storeLoading, onChange: (storeId, option) => updateDraft({ storeId, storeName: option.name }) }), _jsxs("label", { children: [_jsx("span", { children: "\u5F00\u59CB\u65E5\u671F" }), _jsx("input", { "aria-label": "\u5F00\u59CB\u65E5\u671F", type: "date", value: draft.startDate, onChange: (event) => updateDraft({ startDate: event.target.value }) })] }), _jsxs("label", { children: [_jsx("span", { children: "\u7ED3\u675F\u65E5\u671F" }), _jsx("input", { "aria-label": "\u7ED3\u675F\u65E5\u671F", type: "date", value: draft.endDate, onChange: (event) => updateDraft({ endDate: event.target.value }) })] }), _jsxs("label", { children: [_jsx("span", { children: "\u79EF\u5206\u573A\u666F" }), _jsx("select", { "aria-label": "\u79EF\u5206\u573A\u666F", value: draft.scene, onChange: (event) => updateDraft({ scene: event.target.value }), children: (dashboard?.scenes ?? [{ value: 'all', label: '全部场景' }]).map((sceneOption) => (_jsx("option", { value: sceneOption.value, children: sceneOption.label }, sceneOption.value))) })] }), _jsxs("label", { className: "member-points-search", children: [_jsx("span", { children: "\u4F1A\u5458\u641C\u7D22" }), _jsx("input", { "aria-label": "\u4F1A\u5458\u641C\u7D22", value: draft.keyword, placeholder: "\u59D3\u540D\u3001\u624B\u673A\u53F7\u5C3E\u53F7\u6216\u6D41\u6C34\u53F7", onChange: (event) => updateDraft({ keyword: event.target.value }) })] }), _jsxs("div", { className: "member-points-filter-actions", children: [_jsx("button", { type: "button", className: "is-primary", onClick: applyFilters, disabled: isLoading, children: "\u67E5\u8BE2" }), _jsx("button", { type: "button", onClick: resetFilters, disabled: isLoading, children: "\u91CD\u7F6E" })] })] }), notice || isLoading ? (_jsx("div", { className: "member-points-toast", role: "status", "aria-live": "polite", children: isLoading ? '数据加载中' : notice })) : null, serviceError ? (_jsxs("section", { className: "member-points-alert", role: "alert", children: [_jsx("strong", { children: "\u4F1A\u5458\u79EF\u5206\u6570\u636E\u52A0\u8F7D\u5931\u8D25" }), _jsx("span", { children: "\u8BF7\u7A0D\u540E\u91CD\u8BD5\uFF0C\u6216\u8C03\u6574\u7B5B\u9009\u6761\u4EF6\u540E\u91CD\u65B0\u52A0\u8F7D\u3002" }), _jsx("button", { type: "button", onClick: refresh, children: "\u91CD\u65B0\u52A0\u8F7D" })] })) : null, _jsx("section", { className: "member-points-metrics", "aria-label": "\u4F1A\u5458\u79EF\u5206\u6838\u5FC3\u6307\u6807", children: (dashboard?.metrics ?? []).map((metric) => (_jsxs("button", { type: "button", className: `member-points-metric is-${metric.tone}`, "aria-label": `查看${metric.title}详情`, onClick: () => setSelectedMetric(metric), children: [_jsx("span", { children: metric.title }), _jsxs("strong", { children: [metric.value.toLocaleString(), _jsx("em", { children: metric.unit })] }), _jsx("small", { children: metric.trend })] }, metric.key))) }), _jsxs("div", { className: "member-points-main", children: [_jsxs("section", { className: "member-points-chart", "aria-label": "\u79EF\u5206\u8D8B\u52BF", children: [_jsxs("header", { children: [_jsx("h2", { children: "\u79EF\u5206\u8D8B\u52BF" }), _jsxs("div", { className: "member-points-legend", role: "group", "aria-label": "\u8D8B\u52BF\u7CFB\u5217", children: [_jsx("button", { type: "button", className: series === 'issued' ? 'is-selected' : '', "aria-pressed": series === 'issued', onClick: () => setSeries('issued'), children: "\u53D1\u653E" }), _jsx("button", { type: "button", className: series === 'consumed' ? 'is-selected' : '', "aria-pressed": series === 'consumed', onClick: () => setSeries('consumed'), children: "\u6D88\u8017" })] })] }), dashboard?.trend.length ? (_jsx("div", { className: "member-points-bars", children: dashboard.trend.map((point) => {
                                    const value = series === 'issued' ? point.issued : point.consumed;
                                    return (_jsxs("div", { className: "member-points-bar", children: [_jsx("i", { style: { height: `${Math.max(8, (value / maxTrendValue) * 132)}px` } }), _jsx("span", { children: point.date }), _jsx("em", { children: value })] }, point.date));
                                }) })) : (_jsx("div", { className: "member-points-empty-block", children: "\u5F53\u524D\u7B5B\u9009\u6761\u4EF6\u4E0B\u6682\u65E0\u8D8B\u52BF\u6570\u636E" }))] }), _jsxs("aside", { className: "member-points-side", "aria-label": "\u4F1A\u5458\u79EF\u5206\u5F85\u529E\u4E0E\u5FEB\u6377\u5165\u53E3", children: [_jsxs("section", { children: [_jsx("h2", { children: "\u5F85\u529E\u63D0\u9192" }), (dashboard?.reminders ?? []).map((item) => (_jsxs(Link, { to: item.route, className: "member-points-reminder", children: [_jsx("span", { children: item.title }), _jsx("strong", { children: item.count })] }, item.id)))] }), _jsxs("section", { children: [_jsx("h2", { children: "\u5FEB\u6377\u5165\u53E3" }), (dashboard?.shortcuts ?? []).map((item) => (_jsxs(Link, { to: item.route, className: "member-points-shortcut", children: [_jsx("span", { children: item.label }), _jsx("small", { children: item.description })] }, item.route)))] })] })] }), _jsxs("section", { className: "member-points-records", children: [_jsxs("header", { children: [_jsx("h2", { children: "\u79EF\u5206\u53D8\u66F4\u8BB0\u5F55" }), _jsxs("span", { children: ["\u66F4\u65B0\u65F6\u95F4\uFF1A", dashboard?.updatedAt ?? '2026-05-18T10:00:00+08:00'] })] }), _jsxs("table", { "aria-label": "\u4F1A\u5458\u79EF\u5206\u53D8\u66F4\u8BB0\u5F55", children: [_jsx("thead", { children: _jsxs("tr", { children: [_jsx("th", { children: "\u4F1A\u5458" }), _jsx("th", { children: "\u573A\u666F" }), _jsx("th", { children: "\u79EF\u5206\u53D8\u52A8" }), _jsx("th", { children: "\u5F53\u524D\u4F59\u989D" }), _jsx("th", { children: "\u6765\u6E90" }), _jsx("th", { children: "\u64CD\u4F5C\u4EBA" }), _jsx("th", { children: "\u53D1\u751F\u65F6\u95F4" }), _jsx("th", { children: "\u72B6\u6001" }), _jsx("th", { children: "\u64CD\u4F5C" })] }) }), _jsx("tbody", { children: dashboard?.records.map((record) => (_jsxs("tr", { children: [_jsxs("td", { children: [_jsx("strong", { children: record.memberName }), _jsxs("span", { children: ["\u5C3E\u53F7 ", record.phoneSuffix] })] }), _jsx("td", { children: record.sceneLabel }), _jsxs("td", { className: record.change >= 0 ? 'is-plus' : 'is-minus', children: [record.change >= 0 ? '+' : '', record.change] }), _jsx("td", { children: record.balance }), _jsx("td", { children: record.source }), _jsx("td", { children: record.operator }), _jsx("td", { children: record.occurredAt }), _jsx("td", { children: statusLabel(record.status) }), _jsx("td", { children: _jsx("button", { type: "button", onClick: () => setSelectedRecord(record), "aria-label": `查看流水详情 ${record.memberName}`, children: "\u8BE6\u60C5" }) })] }, record.id))) })] }), dashboard && dashboard.records.length === 0 ? (_jsx("div", { className: "member-points-empty-block", children: "\u5F53\u524D\u7B5B\u9009\u6761\u4EF6\u4E0B\u6682\u65E0\u79EF\u5206\u6D41\u6C34" })) : null, _jsxs("footer", { className: "member-points-pagination", children: [_jsxs("span", { children: ["\u7B2C ", dashboard?.pagination.page ?? query.page, " \u9875\uFF0C\u5171 ", dashboard?.pagination.total ?? 0, " \u6761"] }), _jsx("button", { type: "button", onClick: () => changePage(Math.max(1, query.page - 1)), disabled: query.page <= 1, children: "\u4E0A\u4E00\u9875" }), _jsx("button", { type: "button", onClick: () => changePage(query.page + 1), disabled: !dashboard || query.page * query.pageSize >= dashboard.pagination.total, children: "\u4E0B\u4E00\u9875" })] })] }), selectedMetric ? _jsx(MetricDialog, { metric: selectedMetric, onClose: () => setSelectedMetric(null) }) : null, selectedRecord ? _jsx(RecordDialog, { record: selectedRecord, onClose: () => setSelectedRecord(null) }) : null] }));
}
function makeInitialQuery() {
    const query = defaultMemberPointsQuery();
    const params = new URLSearchParams(window.location.search);
    const mockState = params.get('mockState');
    if (mockState === 'empty' || mockState === 'error')
        query.state = mockState;
    return query;
}
function statusLabel(status) {
    const labels = {
        completed: '已完成',
        processing: '处理中',
        reversed: '已撤销',
    };
    return labels[status];
}
function MetricDialog({ metric, onClose }) {
    return (_jsx("div", { className: "member-points-dialog-layer", children: _jsxs("section", { className: "member-points-dialog", role: "dialog", "aria-modal": "true", "aria-label": `${metric.title}详情`, children: [_jsxs("header", { children: [_jsxs("h2", { children: [metric.title, "\u8BE6\u60C5"] }), _jsx("button", { type: "button", "aria-label": "\u5173\u95ED\u8BE6\u60C5", onClick: onClose, children: "\u00D7" })] }), _jsx("p", { children: metric.detail }), _jsxs("dl", { children: [_jsxs("div", { children: [_jsx("dt", { children: "\u5F53\u524D\u6570\u503C" }), _jsxs("dd", { children: [metric.value.toLocaleString(), metric.unit] })] }), _jsxs("div", { children: [_jsx("dt", { children: "\u8D8B\u52BF\u8BF4\u660E" }), _jsx("dd", { children: metric.trend })] })] })] }) }));
}
function RecordDialog({ record, onClose }) {
    return (_jsx("div", { className: "member-points-dialog-layer", children: _jsxs("section", { className: "member-points-dialog", role: "dialog", "aria-modal": "true", "aria-label": "\u79EF\u5206\u6D41\u6C34\u8BE6\u60C5", children: [_jsxs("header", { children: [_jsx("h2", { children: "\u79EF\u5206\u6D41\u6C34\u8BE6\u60C5" }), _jsx("button", { type: "button", "aria-label": "\u5173\u95ED\u6D41\u6C34\u8BE6\u60C5", onClick: onClose, children: "\u00D7" })] }), _jsxs("dl", { children: [_jsxs("div", { children: [_jsx("dt", { children: "\u4F1A\u5458" }), _jsx("dd", { children: record.memberName })] }), _jsxs("div", { children: [_jsx("dt", { children: "\u573A\u666F" }), _jsx("dd", { children: record.sceneLabel })] }), _jsxs("div", { children: [_jsx("dt", { children: "\u6765\u6E90" }), _jsx("dd", { children: record.source })] }), _jsxs("div", { children: [_jsx("dt", { children: "\u5907\u6CE8" }), _jsx("dd", { children: record.remark })] })] })] }) }));
}
