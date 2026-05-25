import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { buildStatisticsReportQueryForPreset, createDefaultStatisticsReportQuery, fetchStatisticsReportDashboard, statisticsReportPresetOptions, } from '../services/statisticsReport';
import './ReportPage.css';
export function ReportPage() {
    const navigate = useNavigate();
    const [query, setQuery] = useState(createInitialQuery);
    const [expanded, setExpanded] = useState(true);
    const [descriptionOpen, setDescriptionOpen] = useState(false);
    const [dashboard, setDashboard] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [notice, setNotice] = useState('统计概览看板已加载');
    const [mode, setMode] = useState('overview');
    const [openFilter, setOpenFilter] = useState(null);
    const [activeTrendKey, setActiveTrendKey] = useState('businessIncome');
    const [isDatePanelOpen, setIsDatePanelOpen] = useState(false);
    const [storeScope, setStoreScope] = useState('current');
    const [calendarMonth, setCalendarMonth] = useState(() => query.startDate.slice(0, 7));
    const [datePickTarget, setDatePickTarget] = useState('start');
    const [datePanelPosition, setDatePanelPosition] = useState({ top: 0, left: 0 });
    const dateRangeRef = useRef(null);
    useEffect(() => {
        const controller = new AbortController();
        fetchStatisticsReportDashboard(query, controller.signal)
            .then((nextDashboard) => {
            setDashboard(nextDashboard);
            setError('');
        })
            .catch((reason) => {
            if (reason instanceof DOMException && reason.name === 'AbortError')
                return;
            setDashboard(null);
            setError(reason instanceof Error ? reason.message : '统计概览加载失败');
        })
            .finally(() => {
            if (!controller.signal.aborted)
                setLoading(false);
        });
        return () => controller.abort();
    }, [query]);
    const trendMetric = dashboard?.trendMetrics.find((item) => item.key === activeTrendKey) ?? dashboard?.trendMetrics[0] ?? null;
    const roomTypeLabel = selectedLabel(dashboard?.roomTypeOptions ?? [], query.roomCategoryIds[0], '全部房型');
    const channelLabel = selectedLabel(dashboard?.channelOptions ?? [], query.channelIds[0], '全部渠道');
    const roomTagLabel = dashboard && dashboard.roomTagOptions.length > 0 ? '全部房型标签' : '暂无房型标签';
    const contractText = useMemo(() => JSON.stringify({
        provider: dashboard?.provider ?? 'mock',
        state: dashboard?.state ?? query.state ?? 'success',
        endpoint: dashboard?.endpoint ?? '/report/accommodation/management/analysis/get',
        requestBody: dashboard?.requestBody ?? null,
        overviewSnapshot: dashboard?.overviewSnapshot ?? null,
        traceId: dashboard?.traceId ?? null,
        timestamp: dashboard?.timestamp ?? null,
    }), [dashboard, query.state]);
    const isEmpty = !loading && !error && dashboard?.state === 'empty';
    const activePreset = findMatchingPreset(query.startDate, query.endDate);
    function switchPreset(preset, label) {
        setLoading(true);
        setError('');
        setOpenFilter(null);
        setIsDatePanelOpen(false);
        setQuery((current) => {
            const next = buildStatisticsReportQueryForPreset(preset, current);
            return {
                ...next,
                roomCategoryIds: current.roomCategoryIds,
                channelIds: current.channelIds,
                roomCategoryGroupIds: current.roomCategoryGroupIds,
                state: current.state,
            };
        });
        setNotice(`已切换到${label}`);
    }
    function updateQuery(next, message) {
        setLoading(true);
        setError('');
        setOpenFilter(null);
        setQuery((current) => ({ ...current, ...next }));
        setNotice(message);
    }
    function openDatePanel(target = 'start') {
        setOpenFilter(null);
        setDatePickTarget(target);
        setCalendarMonth(query.startDate.slice(0, 7));
        const rect = dateRangeRef.current?.getBoundingClientRect();
        if (rect) {
            setDatePanelPosition({
                top: rect.bottom + 8,
                left: Math.max(16, Math.min(rect.left, window.innerWidth - 600)),
            });
        }
        setIsDatePanelOpen(true);
    }
    function applyDateSelection(date) {
        if (datePickTarget === 'start') {
            const nextEndDate = date <= query.endDate ? query.endDate : date;
            updateQuery({ startDate: date, endDate: nextEndDate }, '已更新统计日期');
            setDatePickTarget('end');
            return;
        }
        const nextStartDate = date < query.startDate ? date : query.startDate;
        const nextEndDate = date < query.startDate ? query.startDate : date;
        updateQuery({ startDate: nextStartDate, endDate: nextEndDate }, '已更新统计日期');
        setDatePickTarget('start');
        setIsDatePanelOpen(false);
    }
    function retryDashboard() {
        setLoading(true);
        setError('');
        setOpenFilter(null);
        setQuery(createInitialQuery());
        setNotice('统计概览看板已重新加载');
    }
    function resetFilters() {
        setLoading(true);
        setError('');
        setOpenFilter(null);
        setIsDatePanelOpen(false);
        setQuery(createInitialQuery());
        setStoreScope('current');
        setMode('overview');
        setActiveTrendKey('businessIncome');
        setNotice('已恢复默认筛选');
    }
    function refreshDashboard() {
        setLoading(true);
        setError('');
        setOpenFilter(null);
        setIsDatePanelOpen(false);
        setQuery((current) => ({ ...current }));
        setNotice('统计概览看板已刷新');
    }
    function exportDashboard() {
        setNotice('统计概览导出任务已创建');
    }
    function switchStoreScope(nextScope) {
        setStoreScope(nextScope);
        setNotice(nextScope === 'all' ? '已切换到全部门店视角' : '已切换到当前门店视角');
    }
    function openTagSelect() {
        setOpenFilter(openFilter === 'tag' ? null : 'tag');
        if ((dashboard?.roomTagOptions.length ?? 0) === 0) {
            setNotice('当前门店暂无房型标签可筛选');
        }
    }
    return (_jsxs("div", { className: "statistics-report-page", "data-provider": dashboard?.provider ?? 'mock', "data-state": dashboard?.state ?? query.state ?? 'success', children: [_jsx("pre", { hidden: true, "data-testid": "statistics-report-contract", "data-provider": dashboard?.provider ?? 'mock', "data-endpoint": dashboard?.endpoint ?? '/report/accommodation/management/analysis/get', children: contractText }), _jsxs("section", { className: "statistics-report-panel", children: [_jsxs("section", { className: "statistics-report-query", "aria-label": "\u7EDF\u8BA1\u6982\u89C8\u7B5B\u9009", children: [_jsxs("div", { className: "statistics-report-mode", role: "group", "aria-label": "\u7EDF\u8BA1\u6A21\u5F0F", children: [_jsx("button", { type: "button", className: mode === 'overview' ? 'is-active' : '', onClick: () => {
                                            setMode('overview');
                                            setNotice('已切换到统计总览');
                                        }, children: "\u7EDF\u8BA1\u603B\u89C8" }), _jsx("button", { type: "button", className: mode === 'future' ? 'is-active' : '', onClick: () => {
                                            setMode('future');
                                            setNotice('已切换到远期分析');
                                        }, children: "\u8FDC\u671F\u5206\u6790" })] }), _jsxs("div", { className: "statistics-report-form", children: [_jsx("div", { className: "statistics-report-presets", role: "group", "aria-label": "\u65E5\u671F\u5FEB\u6377\u7B5B\u9009", children: statisticsReportPresetOptions.map((preset) => (_jsx("button", { type: "button", className: activePreset === preset.key ? 'is-active' : '', onClick: () => switchPreset(preset.key, preset.label), children: preset.label }, preset.key))) }), _jsxs("div", { className: "statistics-report-store", children: [_jsx("button", { type: "button", className: `store-scope${storeScope === 'all' ? ' is-active' : ''}`, "aria-pressed": storeScope === 'all', onClick: () => switchStoreScope('all'), children: "\u5168\u90E8\u95E8\u5E97" }), _jsx("button", { type: "button", className: `store-current${storeScope === 'current' ? ' is-active' : ''}`, "aria-pressed": storeScope === 'current', onClick: () => switchStoreScope('current'), children: dashboard?.currentStoreName ?? '天落会宿公寓(前海壹方城宝安中心店)' }), _jsx("button", { type: "button", className: "store-settings-button", "aria-label": "\u6253\u5F00\u95E8\u5E97\u4FE1\u606F\u8BBE\u7F6E", onClick: () => navigate('/InformationMaintenance/campInfo'), children: _jsx("span", { "aria-hidden": "true" }) })] }), expanded ? (_jsxs("div", { className: "statistics-report-filters", children: [_jsxs("label", { className: "statistics-date-field", children: [_jsx("span", { children: "\u5F00\u59CB\u65E5\u671F" }), _jsxs("div", { ref: dateRangeRef, className: "report-date-range", role: "button", tabIndex: 0, "aria-label": "\u7EDF\u8BA1\u65E5\u671F", onClick: () => openDatePanel('start'), onKeyDown: (event) => {
                                                            if (event.key === 'Enter' || event.key === ' ') {
                                                                event.preventDefault();
                                                                openDatePanel('start');
                                                            }
                                                        }, children: [_jsx("input", { "aria-label": "\u5F00\u59CB\u65E5\u671F", value: query.startDate, readOnly: true, onClick: (event) => {
                                                                    event.stopPropagation();
                                                                    openDatePanel('start');
                                                                } }), _jsx("span", { children: "\u81F3" }), _jsx("input", { "aria-label": "\u7ED3\u675F\u65E5\u671F", value: query.endDate, readOnly: true, onClick: (event) => {
                                                                    event.stopPropagation();
                                                                    openDatePanel('end');
                                                                } }), _jsx("i", { "aria-hidden": "true" })] })] }), _jsx(FilterSelect, { label: "\u623F\u578B", value: roomTypeLabel, open: openFilter === 'roomType', options: dashboard?.roomTypeOptions ?? [], onToggle: () => setOpenFilter(openFilter === 'roomType' ? null : 'roomType'), onSelect: (option) => updateQuery({ roomCategoryIds: option ? [option.id] : [], channelIds: query.channelIds }, '已按房型筛选') }), _jsx(FilterSelect, { label: "\u6E20\u9053", value: channelLabel, open: openFilter === 'channel', options: dashboard?.channelOptions ?? [], onToggle: () => setOpenFilter(openFilter === 'channel' ? null : 'channel'), onSelect: (option) => updateQuery({ channelIds: option ? [option.id] : [] }, '已按渠道筛选') }), _jsx(FilterSelect, { label: "\u623F\u578B\u6807\u7B7E", value: roomTagLabel, open: openFilter === 'tag', options: dashboard?.roomTagOptions ?? [], emptyLabel: "\u6682\u65E0\u623F\u578B\u6807\u7B7E", onToggle: openTagSelect, onSelect: () => setOpenFilter(null) })] })) : null] }), _jsxs("div", { className: "statistics-report-actions", children: [_jsx("button", { type: "button", onClick: resetFilters, disabled: loading, children: "\u91CD\u7F6E" }), _jsx("button", { type: "button", className: "is-primary", onClick: refreshDashboard, disabled: loading, children: "\u67E5\u8BE2" }), _jsx("button", { type: "button", onClick: exportDashboard, disabled: loading || Boolean(error), children: "\u5BFC\u51FA" }), _jsx("button", { type: "button", onClick: () => {
                                            setDescriptionOpen(true);
                                            setOpenFilter(null);
                                        }, children: "\u8BF4\u660E" }), _jsx("button", { type: "button", className: "is-link", onClick: () => setExpanded((current) => !current), children: expanded ? '收起' : '展开' })] })] }), isDatePanelOpen ? (_jsx(DatePanel, { month: calendarMonth, startDate: query.startDate, endDate: query.endDate, pickTarget: datePickTarget, position: datePanelPosition, onClose: () => {
                            setIsDatePanelOpen(false);
                            setDatePickTarget('start');
                        }, onPrevious: () => setCalendarMonth((current) => shiftMonth(current, -1)), onNext: () => setCalendarMonth((current) => shiftMonth(current, 1)), onPick: applyDateSelection })) : null, _jsx("div", { className: "statistics-report-feedback sr-only-heading", role: "status", "aria-label": "\u7EDF\u8BA1\u6982\u89C8\u53CD\u9988", children: loading ? '正在刷新统计概览数据' : notice }), error ? (_jsxs("section", { className: "statistics-report-error", role: "alert", "aria-label": "\u7EDF\u8BA1\u6982\u89C8\u9519\u8BEF", children: [_jsx("strong", { children: "\u7EDF\u8BA1\u6982\u89C8\u52A0\u8F7D\u5931\u8D25" }), _jsx("p", { children: error }), _jsx("button", { type: "button", onClick: retryDashboard, children: "\u91CD\u8BD5" })] })) : null, isEmpty ? (_jsxs("section", { className: "statistics-report-empty", "aria-label": "\u7EDF\u8BA1\u6982\u89C8\u7A7A\u72B6\u6001", children: [_jsx("strong", { children: "\u6682\u65E0\u7EDF\u8BA1\u6570\u636E" }), _jsx("p", { children: "\u5F53\u524D\u7B5B\u9009\u6761\u4EF6\u4E0B\u6CA1\u6709\u53EF\u5C55\u793A\u7684\u7ECF\u8425\u6570\u636E\uFF0C\u8BF7\u8C03\u6574\u6761\u4EF6\u540E\u91CD\u8BD5\u3002" }), _jsx("button", { type: "button", onClick: retryDashboard, children: "\u5237\u65B0" })] })) : null, !error && !isEmpty ? (mode === 'overview' ? (_jsx(OverviewContent, { dashboard: dashboard, trendMetric: trendMetric, activeTrendKey: activeTrendKey, onSwitchTrend: (key, label) => {
                            setActiveTrendKey(key);
                            setNotice(`已切换趋势指标：${label}`);
                        } })) : (_jsx(FutureContent, { dashboard: dashboard }))) : null, descriptionOpen ? (_jsx("div", { className: "statistics-modal-backdrop", role: "presentation", onClick: () => setDescriptionOpen(false), children: _jsxs("section", { className: "statistics-dialog", role: "dialog", "aria-modal": "true", "aria-label": "\u7EDF\u8BA1\u6982\u89C8\u5B57\u6BB5\u8BF4\u660E", onClick: (event) => event.stopPropagation(), children: [_jsxs("header", { children: [_jsx("h2", { children: "\u7EDF\u8BA1\u6982\u89C8\u5B57\u6BB5\u8BF4\u660E" }), _jsx("button", { type: "button", "aria-label": "\u5173\u95ED\u7EDF\u8BA1\u6982\u89C8\u5B57\u6BB5\u8BF4\u660E", onClick: () => setDescriptionOpen(false), children: "\u00D7" })] }), _jsxs("div", { className: "statistics-description-list", children: [_jsxs("div", { className: "statistics-description-row", children: [_jsx("strong", { children: "\u603B\u8425\u4E1A\u6536\u5165" }), _jsx("span", { children: "\u5F53\u524D\u7B5B\u9009\u65E5\u671F\u5185\u623F\u8D39\u3001\u5176\u4ED6\u6D88\u8D39\u3001\u8BB0\u4E00\u7B14\u6536\u5165\u7684\u6C47\u603B\u3002" })] }), _jsxs("div", { className: "statistics-description-row", children: [_jsx("strong", { children: "\u5165\u4F4F\u7387 OCC" }), _jsx("span", { children: "\u5DF2\u552E\u623F\u95F4\u6570\u5360\u603B\u623F\u95F4\u6570\u7684\u6BD4\u4F8B\uFF0C\u7528\u4E8E\u89C2\u5BDF\u51FA\u79DF\u6548\u7387\u3002" })] }), _jsxs("div", { className: "statistics-description-row", children: [_jsx("strong", { children: "\u5E73\u5747\u623F\u8D39 ADR" }), _jsx("span", { children: "\u5DF2\u552E\u623F\u95F4\u5BF9\u5E94\u7684\u5E73\u5747\u623F\u8D39\uFF0C\u53CD\u6620\u5BA2\u623F\u552E\u4EF7\u6C34\u5E73\u3002" })] }), _jsxs("div", { className: "statistics-description-row", children: [_jsx("strong", { children: "RevPAR" }), _jsx("span", { children: "\u5E73\u5747\u53EF\u552E\u5BA2\u623F\u6536\u5165\uFF0C\u7EFC\u5408\u53CD\u6620\u623F\u91CF\u548C\u623F\u4EF7\u8868\u73B0\u3002" })] })] })] }) })) : null] })] }));
}
function OverviewContent({ dashboard, trendMetric, activeTrendKey, onSwitchTrend, }) {
    const polylineValues = trendMetric?.series[0]?.values ?? [];
    const yAxisValues = buildYAxis(polylineValues);
    const sourceItems = dashboard?.sourceItems ?? [];
    return (_jsxs(_Fragment, { children: [_jsxs("section", { className: "statistics-section", "aria-label": "\u8425\u6536\u7EDF\u8BA1", children: [_jsx("h2", { children: "\u8425\u6536\u7EDF\u8BA1" }), _jsx("div", { className: "statistics-revenue-grid", children: (dashboard?.revenueCards ?? []).map((card) => (_jsxs("article", { className: "statistics-metric-card", children: [_jsx("span", { children: card.label }), _jsx("strong", { children: card.value })] }, card.label))) })] }), _jsxs("section", { className: "statistics-section", "aria-label": "\u7ECF\u8425\u6307\u6807", children: [_jsx("h2", { children: "\u7ECF\u8425\u6307\u6807" }), _jsx("div", { className: "statistics-operation-grid", children: (dashboard?.metricCards ?? []).map((card) => (_jsxs("article", { className: "statistics-operation-card", children: [_jsxs("header", { children: [_jsx("span", { children: card.label }), _jsx("strong", { children: card.value })] }), _jsx("div", { className: "statistics-operation-details", children: card.details.map((detail) => (_jsxs("div", { children: [_jsx("strong", { children: detail.value }), _jsx("span", { children: detail.label })] }, `${card.label}-${detail.label}`))) })] }, card.label))) })] }), _jsxs("section", { className: "statistics-chart-layout", children: [_jsxs("section", { className: "statistics-chart-card", "aria-label": "\u589E\u957F\u8D8B\u52BF\u5206\u6790", children: [_jsxs("header", { children: [_jsx("h2", { children: "\u589E\u957F\u8D8B\u52BF\u5206\u6790" }), _jsx("div", { className: "statistics-chart-tabs", role: "tablist", "aria-label": "\u589E\u957F\u8D8B\u52BF\u6307\u6807", children: (dashboard?.trendMetrics ?? []).map((tab) => (_jsx("button", { type: "button", className: activeTrendKey === tab.key ? 'is-active' : '', onClick: () => onSwitchTrend(tab.key, tab.label), children: tab.label }, tab.key))) })] }), _jsxs("div", { className: "statistics-line-chart", "aria-label": `${trendMetric?.label ?? '营业收入'}趋势图`, children: [_jsx("div", { className: "statistics-y-axis", children: yAxisValues.map((value) => (_jsx("span", { children: formatAxisValue(value, trendMetric?.valueFormat ?? 'currency') }, value))) }), _jsxs("div", { className: "statistics-plot", children: [_jsx("div", { className: "plot-grid" }), _jsx("svg", { viewBox: "0 0 520 220", role: "img", "aria-label": `${trendMetric?.label ?? '营业收入'} 趋势`, children: (trendMetric?.series ?? []).map((series) => (_jsx("polyline", { points: buildPolylinePoints(series.values), fill: "none", stroke: series.color, strokeWidth: series.key === trendMetric?.series[0]?.key ? '3' : '2', strokeLinecap: "round" }, series.key))) }), _jsx("div", { className: "statistics-x-axis", children: (trendMetric?.xLabels ?? []).map((label) => (_jsx("span", { children: label }, label))) })] }), _jsx("div", { className: "statistics-legend", children: (trendMetric?.series ?? []).map((series) => (_jsxs("span", { children: [_jsx("i", { className: "legend-dot", style: { background: series.color } }), series.label] }, series.key))) })] })] }), _jsxs("section", { className: "statistics-source-card", "aria-label": "\u8BA2\u5355\u6765\u6E90\u5206\u6790", children: [_jsx("h2", { children: "\u8BA2\u5355\u6765\u6E90\u5206\u6790" }), _jsxs("div", { className: "statistics-donut-wrap", children: [_jsx("div", { className: "statistics-donut", "aria-hidden": "true", style: { background: donutBackground(sourceItems) } }), _jsx("ul", { children: sourceItems.length > 0 ? (sourceItems.map((source) => (_jsxs("li", { children: [_jsx("i", { style: { background: source.color } }), _jsx("span", { children: source.label }), _jsx("small", { children: source.countText }), _jsx("strong", { children: source.percentageText })] }, source.id)))) : (_jsx("li", { className: "statistics-source-empty", children: "\u6682\u65E0\u8BA2\u5355\u6765\u6E90\u6570\u636E" })) })] })] })] })] }));
}
function FutureContent({ dashboard }) {
    if (!dashboard?.hasFutureData) {
        return (_jsxs("section", { className: "statistics-future statistics-future--empty", "aria-label": "\u8FDC\u671F\u8D8B\u52BF\u5206\u6790", children: [_jsxs("header", { children: [_jsx("h2", { children: "\u8FDC\u671F\u8D8B\u52BF\u5206\u6790" }), _jsx("span", { children: "\u672C\u6708\u9884\u6D4B" })] }), _jsxs("div", { className: "statistics-future-empty", children: [_jsx("strong", { children: "\u6682\u65E0\u9884\u6D4B\u6570\u636E" }), _jsx("p", { children: "\u5F53\u524D\u6240\u9009\u65E5\u671F\u8303\u56F4\u6CA1\u6709\u76EE\u6807\u7AD9\u8FD4\u56DE\u7684\u9884\u6D4B\u5B57\u6BB5\uFF0C\u8BF7\u5207\u6362\u5230\u672C\u6708\u67E5\u770B\u8FDC\u671F\u5206\u6790\u3002" })] })] }));
    }
    return (_jsxs("section", { className: "statistics-future", "aria-label": "\u8FDC\u671F\u8D8B\u52BF\u5206\u6790", children: [_jsxs("header", { children: [_jsx("h2", { children: "\u8FDC\u671F\u8D8B\u52BF\u5206\u6790" }), _jsx("span", { children: "\u672C\u6708\u9884\u6D4B" })] }), _jsx("div", { className: "statistics-future-grid", children: dashboard.futureCards.map((card) => (_jsxs("article", { children: [_jsx("span", { children: card.label }), _jsx("strong", { children: card.value })] }, card.label))) }), _jsxs("div", { className: "statistics-future-chart", children: [_jsx("span", { children: "\u6708\u521D" }), _jsx("span", { children: "\u7ECF\u8425\u4E2D" }), _jsx("span", { children: "\u9884\u8BA1\u8865\u91CF" }), _jsx("span", { children: "\u9884\u8BA1\u603B\u989D" }), _jsx("span", { children: "\u6708\u5E95" })] })] }));
}
function FilterSelect({ label, value, open, options, emptyLabel = '暂无可选项', onToggle, onSelect, }) {
    return (_jsxs("label", { className: "statistics-select-field", children: [_jsx("span", { children: label }), _jsx("div", { className: "report-filter-select", children: _jsx("button", { type: "button", "aria-haspopup": "listbox", "aria-expanded": open, "aria-label": `${label} ${value}`, onClick: onToggle, children: _jsx("strong", { children: value }) }) }), open ? (_jsx("div", { className: "report-filter-options", role: "listbox", "aria-label": `${label}选项`, children: options.length > 0 ? (_jsxs(_Fragment, { children: [_jsx("button", { type: "button", role: "option", "aria-selected": value.includes('全部'), onClick: () => onSelect(null), children: label === '房型' ? '全部房型' : label === '渠道' ? '全部渠道' : '全部房型标签' }), options.map((option) => (_jsx("button", { type: "button", role: "option", "aria-selected": value === option.label, onClick: () => onSelect(option), children: option.label }, option.id)))] })) : (_jsx("button", { type: "button", role: "option", "aria-selected": "true", disabled: true, children: emptyLabel })) })) : null] }));
}
function DatePanel({ month, startDate, endDate, pickTarget, position, onClose, onPrevious, onNext, onPick, }) {
    const months = [month, shiftMonth(month, 1)];
    return (_jsx("div", { className: "report-date-panel-wrap", role: "presentation", onMouseDown: onClose, children: _jsxs("section", { className: "report-date-panel", role: "dialog", "aria-label": "\u7EDF\u8BA1\u65E5\u671F\u9762\u677F", style: { top: `${position.top}px`, left: `${position.left}px` }, onMouseDown: (event) => event.stopPropagation(), children: [_jsxs("div", { className: "report-date-panel__header", children: [_jsx("strong", { children: pickTarget === 'start' ? '请选择开始日期' : '请选择结束日期' }), _jsx("button", { type: "button", "aria-label": "\u5173\u95ED\u7EDF\u8BA1\u65E5\u671F\u9762\u677F", onClick: onClose, children: "\u00D7" })] }), _jsx("div", { className: "report-date-panel__months", children: months.map((item, index) => (_jsx(CalendarMonth, { month: item, startDate: startDate, endDate: endDate, onPrevious: index === 0 ? onPrevious : undefined, onNext: index === months.length - 1 ? onNext : undefined, onPick: onPick }, item))) })] }) }));
}
function CalendarMonth({ month, startDate, endDate, onPrevious, onNext, onPick, }) {
    const days = buildCalendarDays(month);
    const monthLabel = formatMonthLabel(month);
    return (_jsxs("section", { className: "report-calendar-month", "aria-label": monthLabel, children: [_jsxs("header", { children: [_jsx("button", { type: "button", "aria-label": "\u4E0A\u4E2A\u6708", onClick: onPrevious, disabled: !onPrevious, children: "\u2039" }), _jsx("strong", { children: monthLabel }), _jsx("button", { type: "button", "aria-label": "\u4E0B\u4E2A\u6708", onClick: onNext, disabled: !onNext, children: "\u203A" })] }), _jsx("div", { className: "report-calendar-month__weekdays", children: ['一', '二', '三', '四', '五', '六', '日'].map((day) => (_jsx("span", { children: day }, day))) }), _jsx("div", { className: "report-calendar-month__days", children: days.map((day) => {
                    const inRange = day.date >= startDate && day.date <= endDate;
                    const isSelected = day.date === startDate || day.date === endDate;
                    return (_jsx("button", { type: "button", "aria-label": day.date, className: `${day.isMuted ? 'is-muted' : ''}${inRange ? ' is-in-range' : ''}${isSelected ? ' is-selected' : ''}`, onClick: () => onPick(day.date), children: day.label }, day.date));
                }) })] }));
}
function createInitialQuery() {
    const query = createDefaultStatisticsReportQuery();
    query.state =
        typeof window === 'undefined'
            ? 'success'
            : window.localStorage.getItem('pms.statisticsReport.scenario') === 'empty'
                ? 'empty'
                : window.localStorage.getItem('pms.statisticsReport.scenario') === 'error'
                    ? 'error'
                    : 'success';
    return query;
}
function selectedLabel(options, id, fallback) {
    if (!id)
        return fallback;
    return options.find((item) => item.id === id)?.label ?? fallback;
}
function findMatchingPreset(startDate, endDate) {
    for (const preset of statisticsReportPresetOptions) {
        const presetQuery = buildStatisticsReportQueryForPreset(preset.key);
        if (presetQuery.startDate === startDate && presetQuery.endDate === endDate) {
            return preset.key;
        }
    }
    return null;
}
function shiftMonth(month, offset) {
    const [year, monthIndex] = month.split('-').map(Number);
    const nextDate = new Date(year, monthIndex - 1 + offset, 1);
    return `${nextDate.getFullYear()}-${String(nextDate.getMonth() + 1).padStart(2, '0')}`;
}
function formatMonthLabel(month) {
    const [year, monthValue] = month.split('-');
    return `${year}年${Number(monthValue)}月`;
}
function buildCalendarDays(month) {
    const [year, monthValue] = month.split('-').map(Number);
    const firstDay = new Date(year, monthValue - 1, 1);
    const startOffset = (firstDay.getDay() + 6) % 7;
    const gridStart = new Date(year, monthValue - 1, 1 - startOffset);
    return Array.from({ length: 42 }, (_, index) => {
        const date = new Date(gridStart.getFullYear(), gridStart.getMonth(), gridStart.getDate() + index);
        return {
            date: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`,
            label: String(date.getDate()),
            isMuted: date.getMonth() !== monthValue - 1,
        };
    });
}
function buildYAxis(values) {
    const max = Math.max(...values, 0);
    if (max <= 0)
        return [0, 0, 0, 0, 0];
    const step = max / 4;
    return [step * 4, step * 3, step * 2, step, 0].map((value) => Number(value.toFixed(2)));
}
function formatAxisValue(value, format) {
    if (format === 'percent')
        return `${value.toFixed(0)}%`;
    if (format === 'count')
        return `${Math.round(value)}`;
    return `${Math.round(value)}`;
}
function buildPolylinePoints(values) {
    if (values.length === 0)
        return '18,178';
    const max = Math.max(...values, 1);
    const width = 444;
    const xStart = 18;
    const xStep = values.length === 1 ? 0 : width / (values.length - 1);
    return values
        .map((value, index) => {
        const x = xStart + xStep * index;
        const y = 190 - (value / max) * 156;
        return `${x.toFixed(2)},${y.toFixed(2)}`;
    })
        .join(' ');
}
function donutBackground(items) {
    if (items.length === 0) {
        return 'radial-gradient(circle at center, #fff 0 44%, transparent 45%), conic-gradient(#f0f0f0 0 100%)';
    }
    let offset = 0;
    const segments = items.map((item) => {
        const value = Number(item.percentageText.replace('%', ''));
        const start = offset;
        offset += value;
        return `${item.color} ${start}% ${offset}%`;
    });
    return `radial-gradient(circle at center, #fff 0 44%, transparent 45%), conic-gradient(${segments.join(', ')})`;
}
