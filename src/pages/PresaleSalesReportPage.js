import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { StoreSelectControl } from '../components/StoreSelect';
import { useStoreOptions } from '../hooks/useStoreOptions';
import { createInitialPresaleSalesQuery, createPresaleSalesRequestBodies, fetchPresaleSalesDashboard, } from '../services/presaleSalesReport';
import './PresaleSalesReportPage.css';
export function PresaleSalesReportPage() {
    const navigate = useNavigate();
    const [query, setQuery] = useState(createInitialPresaleSalesQuery);
    const [dashboard, setDashboard] = useState(null);
    const [trendMode, setTrendMode] = useState('amount');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const { storeOptions, storeLoading } = useStoreOptions();
    useEffect(() => {
        const abortController = new AbortController();
        setLoading(true);
        fetchPresaleSalesDashboard(query, abortController.signal)
            .then((nextDashboard) => {
            setDashboard(nextDashboard);
            setError('');
        })
            .catch((reason) => {
            if (reason instanceof DOMException && reason.name === 'AbortError')
                return;
            setError(reason instanceof Error ? reason.message : '预售券销售统计加载失败，请稍后重试');
        })
            .finally(() => {
            setLoading(false);
        });
        return () => abortController.abort();
    }, [query]);
    const contractText = JSON.stringify({
        provider: dashboard?.provider ?? 'mock',
        state: dashboard?.state ?? query.state ?? 'success',
        activeTrendMode: trendMode,
        requests: dashboard?.serviceRequests ?? createPresaleSalesRequestBodies(query),
    });
    const currentChart = dashboard?.trendCharts[trendMode];
    const isEmpty = dashboard?.state === 'empty';
    const detailRoute = dashboard?.detailRoute ?? '/statistics/preSaleCouponMall';
    const controlsDisabled = loading || Boolean(error);
    function handleRetry() {
        setDashboard(null);
        setError('');
        setQuery(createInitialPresaleSalesQuery());
    }
    function handleTrendModeChange(nextMode) {
        setTrendMode(nextMode);
    }
    function switchStore(storeId) {
        setQuery((current) => ({
            ...current,
            storeScope: storeId,
        }));
    }
    return (_jsxs("div", { className: "presale-sales-report-page", "aria-label": "\u9884\u552E\u5238\u9500\u552E\u7EDF\u8BA1", children: [_jsx("h1", { className: "sr-only-heading", children: "\u9884\u552E\u5238\u9500\u552E\u7EDF\u8BA1" }), _jsx("pre", { hidden: true, "data-testid": "presale-sales-service-contract", "data-provider": dashboard?.provider ?? 'mock', "data-state": dashboard?.state ?? query.state ?? 'success', children: contractText }), _jsxs("section", { className: "presale-sales-section presale-sales-kpi-section", children: [_jsxs("header", { className: "presale-sales-section__header", children: [_jsx("h2", { children: "\u7ECF\u8425\u6307\u6807" }), _jsx(StoreSelectControl, { className: "presale-sales-store", label: "\u95C2\u3125\u7C35\u947C\u51A8\u6D3F", options: storeOptions.map((store) => ({ id: store.id, name: store.label })), value: query.storeScope ?? 'all', disabled: storeLoading || loading, onChange: (storeId) => switchStore(storeId) }), _jsx("button", { type: "button", className: "presale-sales-link", disabled: controlsDisabled, onClick: () => navigate(detailRoute), children: "\u67E5\u770B\u660E\u7EC6\u6570\u636E>" })] }), error ? (_jsxs("section", { className: "presale-sales-error", role: "alert", "aria-label": "\u9884\u552E\u5238\u9500\u552E\u7EDF\u8BA1\u9519\u8BEF\u63D0\u793A", children: [_jsx("strong", { children: "\u9884\u552E\u5238\u9500\u552E\u7EDF\u8BA1\u52A0\u8F7D\u5931\u8D25" }), _jsx("p", { children: error }), _jsx("button", { type: "button", onClick: handleRetry, children: "\u91CD\u65B0\u52A0\u8F7D" })] })) : loading ? (_jsx("div", { className: "presale-sales-loading", role: "status", "aria-label": "\u9884\u552E\u5238\u9500\u552E\u7EDF\u8BA1\u52A0\u8F7D\u4E2D", children: "\u6B63\u5728\u52A0\u8F7D\u9884\u552E\u5238\u9500\u552E\u7EDF\u8BA1\u6570\u636E" })) : (_jsxs(_Fragment, { children: [_jsx("div", { className: "presale-sales-metrics", "aria-label": "\u9884\u552E\u5238\u7ECF\u8425\u6307\u6807", children: (dashboard?.metricCards ?? []).map((metric) => (_jsx(MetricCard, { metric: metric }, metric.id))) }), isEmpty ? (_jsx("div", { className: "presale-sales-inline-empty", children: dashboard?.emptyMessage })) : null] }))] }), _jsxs("section", { className: "presale-sales-analysis-grid", children: [_jsxs("article", { className: "presale-sales-section presale-sales-trend", "aria-label": "\u589E\u957F\u8D8B\u52BF\u5206\u6790", children: [_jsxs("header", { className: "presale-sales-chart-header", children: [_jsx("h2", { children: "\u589E\u957F\u8D8B\u52BF\u5206\u6790" }), _jsxs("div", { className: "presale-sales-tabs", role: "tablist", "aria-label": "\u589E\u957F\u8D8B\u52BF\u7EF4\u5EA6", children: [_jsx("button", { type: "button", "aria-pressed": trendMode === 'amount', className: trendMode === 'amount' ? 'is-active' : '', disabled: controlsDisabled, onClick: () => handleTrendModeChange('amount'), children: "\u4EA4\u6613\u989D" }), _jsx("button", { type: "button", "aria-pressed": trendMode === 'orders', className: trendMode === 'orders' ? 'is-active' : '', disabled: controlsDisabled, onClick: () => handleTrendModeChange('orders'), children: "\u8BA2\u5355\u6570" })] }), _jsx("div", { className: "presale-sales-legend", "aria-label": "\u8D8B\u52BF\u56FE\u4F8B", children: (currentChart?.series ?? []).map((item) => (_jsx("span", { className: `is-${item.tone}`, children: item.label }, item.key))) })] }), error ? null : loading ? (_jsx("div", { className: "presale-sales-chart-loading", children: "\u6B63\u5728\u540C\u6B65\u8D8B\u52BF\u6570\u636E" })) : isEmpty ? (_jsx(EmptyPanel, { message: dashboard?.emptyMessage ?? '当前周期暂无预售券成交数据' })) : currentChart ? (_jsx(TrendChart, { chart: currentChart })) : null] }), _jsxs("article", { className: "presale-sales-section presale-sales-source", "aria-label": "\u5C0F\u7A0B\u5E8F\u8BA2\u5355\u6765\u6E90\u5206\u6790", children: [_jsx("header", { className: "presale-sales-chart-header", children: _jsx("h2", { children: "\u5C0F\u7A0B\u5E8F\u8BA2\u5355\u6765\u6E90\u5206\u6790" }) }), error ? null : loading ? (_jsx("div", { className: "presale-sales-chart-loading", children: "\u6B63\u5728\u540C\u6B65\u6765\u6E90\u5206\u6790" })) : (_jsxs(_Fragment, { children: [_jsx("div", { className: "presale-sales-source-summary", children: (dashboard?.sourceSummary ?? []).map((item) => (_jsxs("article", { className: "presale-sales-source-card", children: [_jsx("span", { children: item.label }), _jsx("strong", { children: item.value }), _jsx("small", { children: item.hint })] }, item.label))) }), isEmpty ? (_jsx(EmptyPanel, { message: dashboard?.emptyMessage ?? '当前周期暂无预售券成交数据' })) : (_jsx(SourceTable, { rows: dashboard?.sourceRows ?? [] }))] }))] })] })] }));
}
function MetricCard({ metric }) {
    return (_jsxs("article", { className: "presale-sales-metric", children: [_jsx("span", { children: metric.label }), _jsx("strong", { children: metric.value }), _jsx("dl", { children: metric.details.map((item) => (_jsxs("div", { children: [_jsx("dt", { children: item.label }), _jsx("dd", { children: item.value })] }, item.label))) })] }));
}
function TrendChart({ chart }) {
    const maxValue = chart.points.reduce((current, item) => Math.max(current, item.total), 1);
    return (_jsxs("div", { className: "presale-sales-trend-chart", "aria-label": chart.title, children: [_jsxs("div", { className: "presale-sales-chart-callout", children: [_jsx("strong", { children: chart.title }), _jsx("span", { children: `按近 7 日${chart.unit === '元' ? '交易额' : '订单量'}汇总展示` })] }), _jsx("div", { className: "presale-sales-bars", children: chart.points.map((point) => (_jsxs("div", { className: "presale-sales-bar-row", children: [_jsx("span", { className: "presale-sales-bar-label", children: point.label }), _jsx("div", { className: "presale-sales-bar-track", children: chart.series.map((series) => (_jsx("div", { className: `presale-sales-bar is-${series.tone}`, style: { width: `${Math.max((point[series.key] / maxValue) * 100, 4)}%` }, title: `${series.label} ${point[series.key]}${chart.unit}` }, series.key))) }), _jsx("span", { className: "presale-sales-bar-value", children: `${point.total}${chart.unit}` })] }, point.label))) })] }));
}
function SourceTable({ rows }) {
    return (_jsx("div", { className: "presale-sales-source-table-wrap", children: _jsxs("table", { className: "presale-sales-source-table", children: [_jsx("thead", { children: _jsxs("tr", { children: [_jsx("th", { children: "\u6765\u6E90" }), _jsx("th", { children: "\u6210\u4EA4\u5238\u6570" }), _jsx("th", { children: "\u4EA4\u6613\u91D1\u989D" }), _jsx("th", { children: "\u6210\u4EA4\u7387" }), _jsx("th", { children: "\u6838\u9500\u5238\u6570" }), _jsx("th", { children: "\u6838\u9500\u91D1\u989D" }), _jsx("th", { children: "\u6838\u9500\u7387" }), _jsx("th", { children: "\u9000\u6B3E\u5238\u6570" }), _jsx("th", { children: "\u9000\u6B3E\u91D1\u989D" }), _jsx("th", { children: "\u9000\u6B3E\u7387" })] }) }), _jsx("tbody", { children: rows.map((row) => (_jsxs("tr", { children: [_jsx("td", { children: row.source }), _jsx("td", { children: row.dealCouponCount }), _jsx("td", { children: row.transactionAmount }), _jsx("td", { children: row.transactionRate }), _jsx("td", { children: row.writeOffCouponCount }), _jsx("td", { children: row.writeOffAmount }), _jsx("td", { children: row.writeOffRate }), _jsx("td", { children: row.refundCouponCount }), _jsx("td", { children: row.refundAmount }), _jsx("td", { children: row.refundRate })] }, row.id))) })] }) }));
}
function EmptyPanel({ message }) {
    return (_jsxs("div", { className: "presale-sales-empty", children: [_jsx("span", { "aria-hidden": "true" }), _jsx("strong", { children: message })] }));
}
