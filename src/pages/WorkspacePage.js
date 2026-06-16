import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createWorkspaceMemo, fetchWorkspaceDashboard, fetchWorkspaceLists, fetchWorkspaceMemos, fetchWorkspaceAnalysis, handleWorkspaceMemo, resolveWorkspaceCampId, } from '../services/workspace';
import './WorkspacePage.css';
const emptyDashboard = {
    summary: {
        metrics: [
            { label: '预抵', value: '--', testId: 'workspace-metric-arrivals' },
            { label: '在住', value: '--', testId: 'workspace-metric-staying', route: '/statistics/roomSituation' },
            { label: '预离', value: '--' },
            { label: '可售', value: '--' },
            { label: '维修房', value: '--' },
            { label: '脏房', value: '--' },
            { label: '异常', value: '--', accent: 'rose' },
            { label: '总营业收入', value: '--', testId: 'workspace-metric-revenue', accent: 'orange' },
        ],
    },
    analysis: {
        revenueMetrics: [
            { label: '营业收入', value: '--', detailLeft: '预计总收入 --', detailRight: '记一笔 --　其他收入/支出 --', accent: 'amber' },
            { label: '入住率OCC', value: '--', detailLeft: '已售房间数 --', detailRight: '总房数 --', accent: 'mint' },
            { label: '平均客房收益RevPAR', value: '--', detailLeft: '全日房 --', detailRight: '钟点房 --', accent: 'peach' },
            { label: '平均房费ADR', value: '--', detailLeft: '入住率OCC --', detailRight: '平均房费ADR --', accent: 'sky' },
        ],
        chartDates: [],
        chartSeries: [],
        donutSlices: [],
    },
    lists: {
        orders: [],
        memoCount: 0,
        memoItems: [],
        todoItems: [],
        productItems: [],
    },
    traffic: {
        level: '--',
        suggestions: [],
        connectedChannels: [],
        pendingChannels: [],
    },
};
const metricGroups = {
    availability: [0, 1, 2, 3],
    housekeeping: [4, 5],
    exception: [6],
    revenue: [7],
};
const chartMetricConfigs = [
    { label: '营业收入', key: 'businessIncome', valueType: 'currency' },
    { label: '入住率OCC', key: 'occ', valueType: 'percent' },
    { label: '平均房费ADR', key: 'adr', valueType: 'currency' },
    { label: '平均客房收益RevPAR', key: 'revPar', valueType: 'currency' },
    { label: '已售房间数', key: 'openRoomCount', valueType: 'roomCount' },
];
const trendChartBounds = {
    left: 2,
    right: 98,
    top: 1.19,
    bottom: 58.33,
};
const trendChartLayout = {
    axisWidth: 44,
    svgTop: 6,
    svgHeight: 168,
};
export function WorkspacePage() {
    const navigate = useNavigate();
    const [dashboard, setDashboard] = useState(emptyDashboard);
    const [revenuePeriod, setRevenuePeriod] = useState('yesterday');
    const [chartRange, setChartRange] = useState('week');
    const [activeChartMetric, setActiveChartMetric] = useState('营业收入');
    const [orderTab, setOrderTab] = useState('arrivals');
    const [orderKeyword, setOrderKeyword] = useState('');
    const [todoTab, setTodoTab] = useState('todo');
    const [memoTab, setMemoTab] = useState('todo');
    const [memoText, setMemoText] = useState('');
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [hoveredTrendIndex, setHoveredTrendIndex] = useState(null);
    const [hoveredDonutIndex, setHoveredDonutIndex] = useState(null);
    const [statusMessage, setStatusMessage] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const campId = useMemo(() => {
        try {
            return resolveWorkspaceCampId();
        }
        catch (error) {
            return error instanceof Error ? error.message : '';
        }
    }, []);
    const hasCampContext = !campId.startsWith('缺少 campId');
    useEffect(() => {
        void loadDashboard();
        // Initial load is intentionally tied to the first visible state only.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
    async function loadDashboard() {
        if (!hasCampContext) {
            setErrorMessage('');
            return;
        }
        setIsLoading(true);
        setErrorMessage('');
        try {
            const nextDashboard = await fetchWorkspaceDashboard(campId, revenuePeriod, chartRange, orderTab, orderKeyword);
            setDashboard(nextDashboard);
            setStatusMessage('首页数据已刷新');
        }
        catch (error) {
            setErrorMessage(formatBusinessError('首页数据加载失败', error));
        }
        finally {
            setIsLoading(false);
        }
    }
    async function refreshRevenue(nextPeriod) {
        setRevenuePeriod(nextPeriod);
        if (!hasCampContext)
            return;
        setIsLoading(true);
        setErrorMessage('');
        try {
            const analysis = await fetchWorkspaceAnalysis(campId, nextPeriod);
            setDashboard((current) => ({ ...current, analysis: { ...current.analysis, revenueMetrics: analysis.revenueMetrics } }));
            setStatusMessage(`${nextPeriod === 'month' ? '本月' : '昨日'}营收已刷新`);
        }
        catch (error) {
            setErrorMessage(formatBusinessError('营收数据加载失败', error));
        }
        finally {
            setIsLoading(false);
        }
    }
    async function refreshChart(nextRange) {
        setChartRange(nextRange);
        if (!hasCampContext)
            return;
        setIsLoading(true);
        setErrorMessage('');
        try {
            const analysis = await fetchWorkspaceAnalysis(campId, nextRange);
            setDashboard((current) => ({
                ...current,
                analysis: { ...current.analysis, chartDates: analysis.chartDates, chartSeries: analysis.chartSeries, donutSlices: analysis.donutSlices },
            }));
            setHoveredTrendIndex(null);
            setHoveredDonutIndex(null);
            setStatusMessage(`${nextRange === 'lastWeek' ? '上周' : '本周'}趋势已刷新`);
        }
        catch (error) {
            setErrorMessage(formatBusinessError('趋势数据加载失败', error));
        }
        finally {
            setIsLoading(false);
        }
    }
    async function refreshOrders(nextTab = orderTab, keyword = orderKeyword) {
        setOrderTab(nextTab);
        if (!hasCampContext)
            return;
        setIsLoading(true);
        setErrorMessage('');
        try {
            const lists = await fetchWorkspaceLists(campId, nextTab, keyword, memoTab === 'done' ? 1 : 0);
            setDashboard((current) => ({ ...current, lists }));
            setStatusMessage('订单列表已刷新');
        }
        catch (error) {
            setErrorMessage(formatBusinessError('订单列表加载失败', error));
        }
        finally {
            setIsLoading(false);
        }
    }
    function showStatus(message) {
        setStatusMessage(message);
    }
    async function refreshMemos(nextTab = memoTab) {
        setMemoTab(nextTab);
        if (!hasCampContext)
            return;
        setIsLoading(true);
        setErrorMessage('');
        try {
            const memoState = await fetchWorkspaceMemos(campId, nextTab === 'done' ? 1 : 0);
            setDashboard((current) => ({ ...current, lists: { ...current.lists, ...memoState } }));
            setStatusMessage('备忘录已刷新');
        }
        catch (error) {
            setErrorMessage(formatBusinessError('备忘录加载失败', error));
        }
        finally {
            setIsLoading(false);
        }
    }
    async function submitMemo() {
        if (!memoText.trim()) {
            showStatus('请输入新的备忘录');
            return;
        }
        if (!hasCampContext)
            return;
        setIsLoading(true);
        setErrorMessage('');
        try {
            await createWorkspaceMemo(campId, memoText.trim());
            setMemoText('');
            await refreshMemos('todo');
            setStatusMessage('备忘录已提交');
        }
        catch (error) {
            setErrorMessage(formatBusinessError('备忘录提交失败', error));
        }
        finally {
            setIsLoading(false);
        }
    }
    async function markMemoHandled(memoId) {
        if (!hasCampContext)
            return;
        setIsLoading(true);
        setErrorMessage('');
        try {
            await handleWorkspaceMemo(campId, memoId, 1);
            await refreshMemos(memoTab);
            setStatusMessage('备忘录已处理');
        }
        catch (error) {
            setErrorMessage(formatBusinessError('备忘录处理失败', error));
        }
        finally {
            setIsLoading(false);
        }
    }
    const metrics = dashboard.summary.metrics;
    const revenueMetrics = dashboard.analysis.revenueMetrics;
    const activeChartConfig = chartMetricConfigs.find((item) => item.label === activeChartMetric) ?? chartMetricConfigs[0];
    const trendChart = useMemo(() => buildTrendChart(dashboard.analysis.chartSeries, activeChartConfig), [dashboard.analysis.chartSeries, activeChartConfig]);
    const chartDates = trendChart.points.length > 0
        ? trendChart.points.map((point) => point.label)
        : dashboard.analysis.chartDates.length > 0
            ? dashboard.analysis.chartDates
            : ['--', '--', '--', '--', '--', '--', '--'];
    const donutSlices = dashboard.analysis.donutSlices;
    const donutBackground = useMemo(() => buildDonutBackground(donutSlices), [donutSlices]);
    const hoveredTrendPoint = hoveredTrendIndex === null ? null : trendChart.points[hoveredTrendIndex] ?? null;
    const hoveredDonutSlice = hoveredDonutIndex === null ? null : donutSlices[hoveredDonutIndex] ?? null;
    const visibleTodoItems = todoTab === 'todo' ? dashboard.lists.todoItems : dashboard.lists.productItems;
    return (_jsxs("div", { className: "workspace-grid workspace-home", "aria-busy": isLoading, children: [errorMessage ? (_jsxs("div", { className: "workspace-feedback workspace-feedback--error", role: "alert", children: [_jsx("span", { children: errorMessage }), _jsx("button", { type: "button", onClick: loadDashboard, children: "\u91CD\u8BD5" })] })) : null, statusMessage ? _jsx("div", { className: "workspace-feedback workspace-feedback--status", role: "status", children: statusMessage }) : null, _jsxs("section", { className: "workspace-top-strip", "aria-label": "\u9996\u9875\u6838\u5FC3\u6982\u89C8", children: [_jsx(MetricGroup, { className: "metrics-strip workspace-stat-group--availability", label: "\u623F\u6001\u6982\u89C8", indexes: metricGroups.availability, metrics: metrics, onNavigate: navigate }), _jsx(MetricGroup, { className: "workspace-stat-group--housekeeping", label: "\u623F\u52A1\u6982\u89C8", indexes: metricGroups.housekeeping, metrics: metrics, onNavigate: navigate }), _jsx(MetricGroup, { className: "workspace-stat-group--exception", label: "\u5F02\u5E38\u6982\u89C8", indexes: metricGroups.exception, metrics: metrics, onNavigate: navigate }), _jsx(MetricGroup, { className: "workspace-stat-group--revenue", label: "\u8425\u6536\u6982\u89C8", indexes: metricGroups.revenue, metrics: metrics, onNavigate: navigate }), _jsxs("button", { type: "button", className: "workspace-quick-card workspace-quick-card--shift", onClick: () => navigate('/statistics/shift/record'), children: [_jsx("span", { children: "\u73ED" }), _jsx("strong", { children: "\u4EA4\u63A5\u73ED" })] }), _jsxs("article", { className: "workspace-quick-card workspace-quick-card--night", children: [_jsx("span", { children: "\u591C" }), _jsxs("div", { children: [_jsx("strong", { children: "\u591C\u5BA1" }), _jsx("button", { type: "button", onClick: () => showStatus('夜审检查已发起，请稍后查看结果'), children: "\u7ACB\u5373\u5F00\u542F\u591C\u5BA1" })] })] }), _jsxs("section", { className: "workspace-quick-strip", "aria-label": "\u9996\u9875\u5FEB\u6377\u5165\u53E3", children: [_jsxs(Link, { className: "workspace-quick-card workspace-quick-card--report", to: "/statistics/roomSituation", children: [_jsx("span", { children: "\u623F" }), _jsx("strong", { children: "\u623F\u60C5\u8868" })] }), _jsxs(Link, { className: "workspace-quick-card workspace-quick-card--report", to: "/statistics/stay", children: [_jsx("span", { children: "\u6536" }), _jsx("strong", { children: "\u6536\u5165\u62A5\u8868" })] }), _jsxs(Link, { className: "workspace-quick-card workspace-quick-card--report", to: "/statistics/profitReport", children: [_jsx("span", { children: "\u5229" }), _jsx("strong", { children: "\u5229\u6DA6\u62A5\u8868" })] })] })] }), _jsxs("section", { className: "workspace-panel workspace-revenue", children: [_jsxs("div", { className: "panel-toolbar", children: [_jsxs("div", { className: "segmented", children: [_jsx("button", { type: "button", className: revenuePeriod === 'yesterday' ? 'is-active' : '', onClick: () => void refreshRevenue('yesterday'), disabled: isLoading, children: "\u6628\u65E5" }), _jsx("button", { type: "button", className: revenuePeriod === 'month' ? 'is-active' : '', onClick: () => void refreshRevenue('month'), disabled: isLoading, children: "\u672C\u6708" })] }), _jsx(Link, { to: "/statistics/report", children: "\u67E5\u770B\u8BE6\u60C5" })] }), _jsx("div", { className: "revenue-cards", children: revenueMetrics.map((metric) => (_jsxs("article", { className: `revenue-card revenue-${metric.accent}`, "data-testid": metric.label === '营业收入' ? 'workspace-revenue-card' : metric.label === '入住率OCC' ? 'workspace-occ-card' : undefined, children: [_jsx("header", { children: metric.label }), _jsx("strong", { children: metric.value }), _jsxs("footer", { children: [_jsx("span", { children: metric.detailLeft }), _jsx("span", { children: metric.detailRight })] })] }, metric.label))) })] }), _jsxs("section", { className: "workspace-panel chart-panel", children: [_jsxs("div", { className: "panel-toolbar", children: [_jsxs("div", { className: "segmented", children: [_jsx("button", { type: "button", className: chartRange === 'week' ? 'is-active' : '', onClick: () => void refreshChart('week'), disabled: isLoading, children: "\u672C\u5468" }), _jsx("button", { type: "button", className: chartRange === 'lastWeek' ? 'is-active' : '', onClick: () => void refreshChart('lastWeek'), disabled: isLoading, children: "\u4E0A\u5468" })] }), _jsx(Link, { to: "/statistics/report", children: "\u67E5\u770B\u8BE6\u60C5" })] }), _jsx("div", { className: "chart-tabs", children: chartMetricConfigs.map((metric) => (_jsx("button", { type: "button", className: activeChartMetric === metric.label ? 'is-active' : '', onClick: () => {
                                setActiveChartMetric(metric.label);
                                setHoveredTrendIndex(null);
                            }, children: metric.label }, metric.label))) }), _jsxs("div", { className: "chart-stage", children: [_jsxs("div", { className: "chart-grid", onMouseLeave: () => setHoveredTrendIndex(null), children: [trendChart.axisLabels.map((value) => (_jsxs("div", { className: "chart-grid__row", children: [_jsx("span", { children: value }), _jsx("div", {})] }, value))), trendChart.points.length > 0 ? (_jsxs("svg", { className: "workspace-trend-svg", "data-testid": "workspace-trend-chart", viewBox: "0 0 100 100", preserveAspectRatio: "none", "aria-label": `${activeChartConfig.label}趋势`, children: [_jsx("path", { className: "workspace-trend-line", "data-testid": "workspace-trend-line", d: trendChart.path }), trendChart.points.map((point, index) => (_jsxs("g", { children: [_jsx("circle", { className: "workspace-trend-point-dot", cx: point.x, cy: point.y, r: "2.25" }), _jsx("circle", { className: "workspace-trend-point-hit", "data-testid": "workspace-trend-point", cx: point.x, cy: point.y, r: "7.5", onMouseEnter: () => setHoveredTrendIndex(index), onFocus: () => setHoveredTrendIndex(index), tabIndex: 0 })] }, `${point.date}-${index}`)))] })) : null, hoveredTrendPoint ? (_jsxs("div", { className: "workspace-chart-tooltip", "data-testid": "workspace-chart-tooltip", style: {
                                            left: `calc(${trendChartLayout.axisWidth}px + ${hoveredTrendPoint.x}% - ${(hoveredTrendPoint.x * trendChartLayout.axisWidth) / 100}px)`,
                                            top: `${trendChartLayout.svgTop + (hoveredTrendPoint.y / 100) * trendChartLayout.svgHeight}px`,
                                        }, children: [_jsx("strong", { children: hoveredTrendPoint.label }), _jsx("span", { children: activeChartConfig.label }), _jsx("em", { children: formatTrendValue(hoveredTrendPoint.value, activeChartConfig.valueType) })] })) : null, _jsx("div", { className: "chart-grid__dates", "data-testid": "workspace-chart-dates", children: chartDates.map((date, index) => {
                                            const x = trendChart.points[index]?.x ?? (chartDates.length <= 1 ? 50 : (100 / (chartDates.length - 1)) * index);
                                            return (_jsx("span", { style: {
                                                    left: `calc(${trendChartLayout.axisWidth}px + ${x}% - ${(x * trendChartLayout.axisWidth) / 100}px)`,
                                                }, children: date }, `${date}-${index}`));
                                        }) })] }), _jsxs("div", { className: "donut", children: [_jsx("div", { className: "donut-ring", "data-testid": "workspace-donut-ring", style: { background: donutBackground }, onMouseMove: (event) => setHoveredDonutIndex(resolveDonutSliceIndex(event.currentTarget.getBoundingClientRect(), event.clientX, event.clientY, donutSlices)), onMouseLeave: () => setHoveredDonutIndex(null) }), hoveredDonutSlice ? (_jsxs("div", { className: "workspace-donut-tooltip", "data-testid": "workspace-donut-tooltip", children: [_jsx("strong", { children: hoveredDonutSlice.label }), _jsx("span", { children: formatDonutCount(hoveredDonutSlice) }), _jsx("em", { children: formatDonutPercent(hoveredDonutSlice) })] })) : null, _jsx("ul", { "data-testid": "workspace-donut-legend", onMouseLeave: () => setHoveredDonutIndex(null), children: donutSlices.length > 0 ? (donutSlices.map((slice, index) => (_jsxs("li", { className: hoveredDonutIndex === index ? 'is-active' : '', onMouseEnter: () => setHoveredDonutIndex(index), onFocus: () => setHoveredDonutIndex(index), tabIndex: 0, children: [_jsx("i", { style: { background: slice.color } }), _jsx("span", { children: slice.label }), _jsx("strong", { children: slice.value })] }, slice.label)))) : (_jsx("li", { children: "\u6682\u65E0\u6E20\u9053\u5360\u6BD4" })) })] })] })] }), _jsxs("section", { className: "workspace-panel workspace-orders-panel", children: [_jsxs("div", { className: "panel-toolbar workspace-orders-toolbar", children: [_jsxs("div", { className: "segmented", children: [_jsx("button", { type: "button", className: orderTab === 'arrivals' ? 'is-active' : '', onClick: () => void refreshOrders('arrivals'), disabled: isLoading, children: "\u9884\u62B5" }), _jsx("button", { type: "button", className: orderTab === 'staying' ? 'is-active' : '', onClick: () => void refreshOrders('staying'), disabled: isLoading, children: "\u5728\u4F4F" }), _jsx("button", { type: "button", className: orderTab === 'departing' ? 'is-active' : '', onClick: () => void refreshOrders('departing'), disabled: isLoading, children: "\u9884\u79BB" })] }), _jsx("label", { className: "table-search", children: _jsx("input", { type: "text", placeholder: "\u8BF7\u8F93\u5165\u59D3\u540D/\u624B\u673A\u53F7", value: orderKeyword, onChange: (event) => setOrderKeyword(event.target.value), onKeyDown: (event) => {
                                        if (event.key === 'Enter')
                                            void refreshOrders(orderTab, orderKeyword);
                                    } }) }), _jsx(Link, { to: "/order/house-order/list", children: "\u67E5\u770B\u5168\u90E8\u8BA2\u5355" })] }), _jsxs("table", { className: "workspace-order-table", children: [_jsx("thead", { children: _jsx("tr", { children: ['来源', '姓名', '手机号', '房型', '房间', '入离时间', '房晚', '状态', '操作'].map((head) => (_jsx("th", { children: head }, head))) }) }), _jsx("tbody", { children: dashboard.lists.orders.length > 0 ? (dashboard.lists.orders.map((order) => (_jsxs("tr", { "data-testid": "workspace-order-row", children: [_jsx("td", { children: order.source }), _jsx("td", { children: order.name }), _jsx("td", { children: order.phone }), _jsx("td", { children: order.roomType }), _jsx("td", { children: order.room }), _jsx("td", { children: order.stayRange }), _jsx("td", { children: order.nights }), _jsx("td", { children: _jsx("span", { className: "workspace-status", children: order.status }) }), _jsxs("td", { className: "workspace-order-actions", children: [_jsx("button", { type: "button", "aria-label": "\u6392\u623F", onClick: () => navigate('/houseManage/months'), title: "\u6392\u623F", children: "\u6392" }), _jsx("button", { type: "button", "aria-label": "\u4F4F\u5BA2\u8D44\u6599", onClick: () => {
                                                        setSelectedOrder(order);
                                                        showStatus('住客资料已打开');
                                                    }, title: "\u4F4F\u5BA2\u8D44\u6599", children: "\u5BA2" }), _jsx("button", { type: "button", "aria-label": "\u67E5\u770B\u8BA2\u5355", onClick: () => setSelectedOrder(order), title: "\u67E5\u770B\u8BA2\u5355", children: "\u770B" })] })] }, `${order.source}-${order.name}-${order.stayRange}`)))) : (_jsx("tr", { children: _jsx("td", { colSpan: 9, children: _jsx("div", { className: "empty-state", children: "\u6682\u65E0\u6570\u636E" }) }) })) })] })] }), _jsxs("section", { className: "workspace-panel empty-panel", "data-testid": "workspace-todo-panel", children: [_jsx("div", { className: "panel-toolbar", children: _jsxs("div", { className: "segmented", children: [_jsx("button", { type: "button", className: todoTab === 'todo' ? 'is-active' : '', onClick: () => setTodoTab('todo'), children: "\u5F85\u529E\u4E8B\u9879" }), _jsx("button", { type: "button", className: todoTab === 'product' ? 'is-active' : '', onClick: () => setTodoTab('product'), children: "\u4EA7\u54C1\u52A8\u6001" })] }) }), visibleTodoItems.length > 0 ? (_jsx("ul", { className: "workspace-news-list", children: visibleTodoItems.map((item) => (_jsxs("li", { children: [_jsx("strong", { children: item.title }), _jsx("span", { children: item.detail })] }, item.title))) })) : (_jsx("div", { className: "empty-state", children: "\u6682\u65E0\u6570\u636E" }))] }), _jsxs("section", { className: "workspace-panel memo-panel", children: [_jsx("div", { className: "panel-toolbar", children: _jsxs("div", { className: "segmented", children: [_jsx("button", { type: "button", className: memoTab === 'todo' ? 'is-active' : '', onClick: () => void refreshMemos('todo'), disabled: isLoading, children: "\u5F85\u5904\u7406" }), _jsx("button", { type: "button", className: memoTab === 'done' ? 'is-active' : '', onClick: () => void refreshMemos('done'), disabled: isLoading, children: "\u5DF2\u5904\u7406" })] }) }), dashboard.lists.memoItems.length > 0 ? (_jsx("ul", { className: "workspace-memo-list", children: dashboard.lists.memoItems.map((memo) => (_jsxs("li", { children: [_jsx("span", { children: memo.content }), memo.isHandle === 0 ? (_jsx("button", { type: "button", onClick: () => void markMemoHandled(memo.memoId), disabled: isLoading, children: "\u5904\u7406" })) : (_jsx("strong", { children: "\u5DF2\u5904\u7406" }))] }, memo.memoId))) })) : (_jsx("div", { className: "empty-state", children: dashboard.lists.memoCount > 0 ? `共有 ${dashboard.lists.memoCount} 条备忘录` : '暂无数据' })), _jsxs("div", { className: "memo-input", children: [_jsx("input", { type: "text", placeholder: "\u8BF7\u8F93\u5165\u65B0\u7684\u5907\u5FD8\u5F55", value: memoText, onChange: (event) => setMemoText(event.target.value) }), _jsx("button", { type: "button", onClick: () => void submitMemo(), disabled: isLoading, children: "\u63D0\u4EA4" })] })] }), _jsxs("aside", { className: "workspace-traffic-panel", children: [_jsxs("section", { className: "workspace-traffic-banner", children: [_jsxs("strong", { children: ["\u5E2E\u60A8\u5B9E\u73B0", _jsx("br", {}), "\u5168\u7F51\u540C\u4EF7"] }), _jsx("button", { type: "button", onClick: () => navigate('/setting/customChannel'), children: "\u70B9\u6211\u8BBE\u7F6E" })] }), _jsxs("section", { className: "workspace-panel workspace-traffic-card", children: [_jsxs("header", { children: [_jsxs("p", { children: ["\u95E8\u5E97\u6D41\u91CF\u83B7\u53D6\u80FD\u529B ", _jsx("strong", { children: dashboard.traffic.level })] }), _jsx("button", { type: "button", onClick: () => navigate('/channels/ota'), children: "\u4E00\u952E\u4E0A\u6E20\u9053" })] }), _jsx(TrafficGroup, { title: "OTA\u6D41\u91CF", items: dashboard.traffic.connectedChannels, emptyText: "\u6682\u65E0\u5DF2\u5F00\u901A\u6E20\u9053" }), _jsx(TrafficGroup, { title: "\u5F85\u5F00\u901A\u6E20\u9053", items: dashboard.traffic.pendingChannels, mutedFrom: 0, emptyText: "\u6682\u65E0\u5F85\u5F00\u901A\u6E20\u9053" }), _jsxs("p", { children: ["\u5EFA\u8BAE\uFF1A", dashboard.traffic.suggestions[0] ?? '暂无建议'] })] })] }), selectedOrder ? (_jsx("div", { className: "workspace-order-dialog-mask", role: "presentation", onMouseDown: () => setSelectedOrder(null), children: _jsxs("section", { className: "workspace-order-dialog", role: "dialog", "aria-modal": "true", "aria-label": "\u8BA2\u5355\u8BE6\u60C5", onMouseDown: (event) => event.stopPropagation(), children: [_jsxs("header", { children: [_jsx("strong", { children: "\u8BA2\u5355\u8BE6\u60C5" }), _jsx("button", { type: "button", "aria-label": "\u5173\u95ED\u8BA2\u5355\u8BE6\u60C5", onClick: () => setSelectedOrder(null), children: "\u00D7" })] }), _jsxs("dl", { children: [_jsx("dt", { children: "\u5BA2\u4EBA" }), _jsx("dd", { children: selectedOrder.name }), _jsx("dt", { children: "\u6E20\u9053" }), _jsx("dd", { children: selectedOrder.source }), _jsx("dt", { children: "\u623F\u578B" }), _jsx("dd", { children: selectedOrder.roomType }), _jsx("dt", { children: "\u5165\u79BB\u65F6\u95F4" }), _jsx("dd", { children: selectedOrder.stayRange })] })] }) })) : null] }));
}
function buildTrendChart(series, metric) {
    const values = series.map((point) => toFiniteNumber(point[metric.key]));
    const ceiling = getTrendAxisCeiling(Math.max(...values, 0), metric.valueType);
    const points = series.map((point, index) => {
        const value = toFiniteNumber(point[metric.key]);
        const x = series.length <= 1
            ? 50
            : trendChartBounds.left + ((trendChartBounds.right - trendChartBounds.left) / (series.length - 1)) * index;
        const y = trendChartBounds.bottom - (value / ceiling) * (trendChartBounds.bottom - trendChartBounds.top);
        return { ...point, x, y, value };
    });
    return {
        axisLabels: buildTrendAxisLabels(ceiling, metric.valueType),
        path: buildSmoothTrendPath(points),
        points,
    };
}
function buildSmoothTrendPath(points) {
    if (points.length === 0)
        return '';
    if (points.length === 1)
        return `M ${points[0].x} ${points[0].y}`;
    return points.slice(1).reduce((path, point, index) => {
        const previous = points[index];
        const midX = (previous.x + point.x) / 2;
        return `${path} C ${midX} ${previous.y}, ${midX} ${point.y}, ${point.x} ${point.y}`;
    }, `M ${points[0].x} ${points[0].y}`);
}
function buildTrendAxisLabels(ceiling, valueType) {
    return [ceiling, ceiling * 0.75, ceiling * 0.5, ceiling * 0.25, 0].map((value) => formatTrendAxisValue(value, valueType));
}
function getTrendAxisCeiling(maxValue, valueType) {
    if (valueType === 'percent')
        return Math.max(100, Math.ceil(maxValue / 25) * 25);
    if (valueType === 'roomCount')
        return Math.max(4, Math.ceil(maxValue));
    if (maxValue <= 0)
        return 100;
    const magnitude = 10 ** Math.floor(Math.log10(maxValue));
    const normalized = maxValue / magnitude;
    const nice = normalized <= 1 ? 1 : normalized <= 2 ? 2 : normalized <= 3 ? 3 : normalized <= 5 ? 5 : 10;
    return nice * magnitude;
}
function formatTrendAxisValue(value, valueType) {
    if (valueType === 'percent')
        return `${formatPlainNumber(value, 0)}%`;
    if (valueType === 'roomCount')
        return formatPlainNumber(value, 0);
    if (value >= 10000)
        return `${formatPlainNumber(value / 10000, 1)}万`;
    return formatPlainNumber(value, 0);
}
function formatTrendValue(value, valueType) {
    if (valueType === 'currency')
        return `￥${formatPlainNumber(value)}`;
    if (valueType === 'percent')
        return `${formatPlainNumber(value)}%`;
    return `${formatPlainNumber(value, 0)}间`;
}
function buildDonutBackground(slices) {
    const innerMask = 'radial-gradient(circle at center, #fff 43%, transparent 44%)';
    if (slices.length === 0)
        return `${innerMask}, conic-gradient(#e6ebf3 0% 100%)`;
    let cursor = 0;
    const segments = slices.flatMap((slice) => {
        const percent = clampPercent(slice.percent ?? Number.parseFloat(slice.value));
        if (percent <= 0)
            return [];
        const start = cursor;
        const end = Math.min(100, cursor + percent);
        cursor = end;
        return `${slice.color} ${start}% ${end}%`;
    });
    if (cursor < 100)
        segments.push(`#e6ebf3 ${cursor}% 100%`);
    return `${innerMask}, conic-gradient(${segments.join(', ')})`;
}
function resolveDonutSliceIndex(rect, clientX, clientY, slices) {
    if (slices.length === 0)
        return null;
    const x = clientX - rect.left - rect.width / 2;
    const y = clientY - rect.top - rect.height / 2;
    const distance = Math.sqrt(x * x + y * y);
    if (distance < rect.width * 0.22 || distance > rect.width * 0.52)
        return null;
    const angle = (Math.atan2(y, x) * 180) / Math.PI;
    const percentAtPointer = ((angle + 450) % 360) / 3.6;
    let cursor = 0;
    for (let index = 0; index < slices.length; index += 1) {
        cursor += clampPercent(slices[index].percent ?? Number.parseFloat(slices[index].value));
        if (percentAtPointer <= cursor)
            return index;
    }
    return null;
}
function formatDonutCount(slice) {
    return `${formatPlainNumber(toFiniteNumber(slice.count), 0)}单`;
}
function formatDonutPercent(slice) {
    return `${formatPlainNumber(clampPercent(slice.percent ?? Number.parseFloat(slice.value)), 2)}%`;
}
function formatPlainNumber(value, fractionDigits = 2) {
    const normalized = Number.isInteger(value) || fractionDigits === 0
        ? value.toFixed(0)
        : value.toFixed(fractionDigits).replace(/\.?0+$/, '');
    return normalized;
}
function clampPercent(value) {
    if (!Number.isFinite(value))
        return 0;
    return Math.min(Math.max(value, 0), 100);
}
function toFiniteNumber(value) {
    const number = Number(value ?? 0);
    return Number.isFinite(number) ? number : 0;
}
function MetricGroup({ className, label, indexes, metrics, onNavigate, }) {
    return (_jsx("section", { className: `workspace-stat-group ${className}`, "aria-label": label, children: indexes.map((index) => {
            const metric = metrics[index] ?? emptyDashboard.summary.metrics[index];
            return (_jsxs("button", { type: "button", className: `metric-card metric-${metric.accent ?? 'blue'}`, "data-testid": metric.testId, onClick: () => {
                    if (metric.route)
                        onNavigate(metric.route);
                }, children: [_jsx("span", { children: metric.label }), _jsx("strong", { children: metric.value })] }, metric.label));
        }) }));
}
function TrafficGroup({ title, items, mutedFrom, emptyText }) {
    return (_jsxs("div", { className: "workspace-traffic-group", children: [_jsx("h3", { children: title }), _jsx("div", { children: items.length > 0 ? (items.map((item, index) => (_jsx("span", { className: mutedFrom !== undefined && index >= mutedFrom ? 'is-muted' : '', children: item }, `${item}-${index}`)))) : (_jsx("em", { children: emptyText })) })] }));
}
function formatBusinessError(prefix, error) {
    const message = error instanceof Error ? error.message : String(error);
    const hasTechnicalDetail = /mock|provider|接口|契约|后端|阻塞|未接入|campId/i.test(message);
    return hasTechnicalDetail ? `${prefix}，请稍后重试` : `${prefix}：${message}`;
}
