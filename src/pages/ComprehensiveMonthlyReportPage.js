import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { comprehensiveMonthlyDetailColumns, createDefaultComprehensiveMonthlyReportQuery, findComprehensiveMonthlyReportRow, loadComprehensiveMonthlyReportList, readComprehensiveMonthlySelection, resolveComprehensiveMonthlyRuntimeConfig, runComprehensiveMonthlyReportAction, } from '../services/comprehensiveMonthlyReport';
import './ComprehensiveMonthlyReportPage.css';
export function ComprehensiveMonthlyReportPage() {
    const location = useLocation();
    if (location.pathname.endsWith('/Monthly')) {
        return _jsx(ComprehensiveMonthlyDetailPage, {}, `${location.pathname}${location.search}`);
    }
    return _jsx(ComprehensiveMonthlyListPage, {}, `${location.pathname}${location.search}`);
}
function ComprehensiveMonthlyListPage() {
    const location = useLocation();
    const navigate = useNavigate();
    const runtime = resolveComprehensiveMonthlyRuntimeConfig(location.search);
    const [pageSize, setPageSize] = useState(20);
    const [reloadKey, setReloadKey] = useState(0);
    const [view, setView] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [toast, setToast] = useState(null);
    const requestQuery = createDefaultComprehensiveMonthlyReportQuery({
        pageSize,
        provider: runtime.provider,
        mockState: runtime.mockState,
    });
    useEffect(() => {
        const controller = new AbortController();
        const nextQuery = createDefaultComprehensiveMonthlyReportQuery({
            pageSize,
            provider: runtime.provider,
            mockState: runtime.mockState,
        });
        loadComprehensiveMonthlyReportList(nextQuery, controller.signal)
            .then((nextView) => {
            setView(nextView);
        })
            .catch((nextError) => {
            if (controller.signal.aborted)
                return;
            setView(null);
            setError(nextError instanceof Error ? nextError.message : '综合月报加载失败，请稍后重试');
        })
            .finally(() => {
            if (!controller.signal.aborted) {
                setLoading(false);
            }
        });
        return () => controller.abort();
    }, [location.search, pageSize, reloadKey, runtime.mockState, runtime.provider]);
    function showToast(text) {
        const id = window.setTimeout(() => setToast(null), 2200);
        setToast({ id, text });
    }
    function retry() {
        setLoading(true);
        setError('');
        setView(null);
        setReloadKey((current) => current + 1);
    }
    function togglePageSize() {
        const nextPageSize = pageSize === 20 ? 50 : 20;
        setLoading(true);
        setError('');
        setPageSize(nextPageSize);
        showToast(`每页条数已切换为 ${nextPageSize}`);
    }
    return (_jsxs("div", { className: "comprehensive-monthly-page", children: [_jsx(ComprehensiveMonthlyDiagnostics, { view: view, requestBody: requestQuery, responseState: view?.state ?? runtime.mockState }), toast ? (_jsx("div", { className: "comprehensive-toast", role: "status", children: toast.text }, toast.id)) : null, _jsxs("section", { className: "comprehensive-card", children: [_jsx("header", { className: "comprehensive-card-title", children: _jsx("h1", { children: "\u7EFC\u5408\u6708\u62A5" }) }), error ? (_jsxs("div", { className: "comprehensive-alert", role: "alert", children: [_jsx("strong", { children: "\u7EFC\u5408\u6708\u62A5\u52A0\u8F7D\u5931\u8D25" }), _jsx("span", { children: error }), _jsx("button", { "data-testid": "comprehensive-monthly-retry", type: "button", onClick: retry, children: "\u91CD\u8BD5" })] })) : null, _jsx("div", { className: "comprehensive-table-shell", children: _jsxs("table", { className: "comprehensive-report-table", "aria-label": "\u7EFC\u5408\u6708\u62A5\u5217\u8868", "aria-busy": loading, "data-testid": "comprehensive-monthly-report-table", children: [_jsx("thead", { children: _jsxs("tr", { children: [_jsx("th", { children: "\u65F6\u6BB5" }), _jsx("th", { children: "\u7EDF\u8BA1\u5468\u671F" }), _jsx("th", { children: "\u8425\u4E1A\u6536\u5165" }), _jsx("th", { children: "\u5165\u4F4F\u7387OCC" }), _jsx("th", { children: "\u5E73\u5747\u623F\u4EF7ADR" }), _jsx("th", { children: "\u5E73\u5747\u5BA2\u623F\u6536\u76CAREVPAR" }), _jsx("th", { children: "\u751F\u6210\u65F6\u95F4" }), _jsx("th", { children: "\u751F\u6210\u4EBA" }), _jsx("th", { children: "\u64CD\u4F5C" })] }) }), _jsx("tbody", { children: loading ? (_jsx("tr", { children: _jsx("td", { colSpan: 9, children: _jsx("div", { className: "comprehensive-loading", children: "\u6570\u636E\u52A0\u8F7D\u4E2D..." }) }) })) : view && view.rows.length > 0 ? (view.rows.map((row) => (_jsxs("tr", { children: [_jsx("td", { children: row.monthLabel }), _jsx("td", { children: row.rangeLabel }), _jsx("td", { children: row.revenueText }), _jsx("td", { children: row.occText }), _jsx("td", { children: row.adrText }), _jsx("td", { children: row.revParText }), _jsx("td", { className: "comprehensive-report-table__time", children: row.generatedAtText.replace('\n', ' ') }), _jsx("td", { children: row.creatorText }), _jsx("td", { children: _jsx("button", { "data-testid": "comprehensive-monthly-view-report", type: "button", className: "comprehensive-link-button", onClick: () => navigate(`/statistics/Comprehensive/Monthly?startDate=${row.startDate}&endDate=${row.endDate}`), children: "\u67E5\u770B\u62A5\u8868" }) })] }, row.id)))) : (_jsx("tr", { children: _jsx("td", { colSpan: 9, children: _jsxs("div", { className: "comprehensive-empty-state", "data-testid": "comprehensive-monthly-empty", children: [_jsx("div", { "aria-hidden": "true" }), _jsx("strong", { children: "\u6682\u65E0\u6708\u62A5\u6570\u636E" })] }) }) })) })] }) }), _jsxs("nav", { className: "comprehensive-pagination", "aria-label": "\u5206\u9875", children: [_jsxs("span", { "data-testid": "comprehensive-monthly-pagination-summary", children: ["\u7B2C ", view?.rows.length ? 1 : 0, "-", view?.rows.length ?? 0, " \u6761 / \u603B\u5171 ", view?.pagination.total ?? 0, " \u6761"] }), _jsx("button", { type: "button", "aria-label": "\u4E0A\u4E00\u9875", disabled: true, children: "\u2039" }), _jsx("button", { type: "button", className: "is-current", children: "1" }), _jsx("button", { type: "button", "aria-label": "\u4E0B\u4E00\u9875", disabled: true, children: "\u203A" }), _jsxs("button", { "data-testid": "comprehensive-monthly-page-size-toggle", type: "button", onClick: togglePageSize, children: [pageSize, " \u6761/\u9875"] })] })] })] }));
}
function ComprehensiveMonthlyDetailPage() {
    const location = useLocation();
    const navigate = useNavigate();
    const runtime = resolveComprehensiveMonthlyRuntimeConfig(location.search);
    const selection = readComprehensiveMonthlySelection(location.search);
    const [reloadKey, setReloadKey] = useState(0);
    const [view, setView] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [toast, setToast] = useState(null);
    const [actionLoading, setActionLoading] = useState(null);
    const [refreshConfirmOpen, setRefreshConfirmOpen] = useState(false);
    const requestQuery = createDefaultComprehensiveMonthlyReportQuery({
        provider: runtime.provider,
        mockState: runtime.mockState,
    });
    useEffect(() => {
        const controller = new AbortController();
        const nextQuery = createDefaultComprehensiveMonthlyReportQuery({
            provider: runtime.provider,
            mockState: runtime.mockState,
        });
        loadComprehensiveMonthlyReportList(nextQuery, controller.signal)
            .then((nextView) => {
            setView(nextView);
        })
            .catch((nextError) => {
            if (controller.signal.aborted)
                return;
            setView(null);
            setError(nextError instanceof Error ? nextError.message : '综合月报加载失败，请稍后重试');
        })
            .finally(() => {
            if (!controller.signal.aborted) {
                setLoading(false);
            }
        });
        return () => controller.abort();
    }, [location.search, reloadKey, runtime.mockState, runtime.provider]);
    const currentRow = findComprehensiveMonthlyReportRow(view?.rows ?? [], selection);
    function showToast(text) {
        const id = window.setTimeout(() => setToast(null), 2200);
        setToast({ id, text });
    }
    function retry() {
        setLoading(true);
        setError('');
        setView(null);
        setReloadKey((current) => current + 1);
    }
    function runAction(action) {
        if (!view)
            return;
        setActionLoading(action);
        runComprehensiveMonthlyReportAction(action, view.provider)
            .then((result) => {
            showToast(result.message);
        })
            .catch((nextError) => {
            showToast(nextError instanceof Error ? nextError.message : '操作执行失败，请稍后重试');
        })
            .finally(() => {
            setActionLoading(null);
        });
    }
    function backToList() {
        navigate('/statistics/Comprehensive');
    }
    return (_jsxs("div", { className: "comprehensive-monthly-page comprehensive-monthly-detail-page", children: [_jsx(ComprehensiveMonthlyDiagnostics, { view: view, requestBody: requestQuery, responseState: view?.state ?? runtime.mockState }), toast ? (_jsx("div", { className: "comprehensive-toast", role: "status", children: toast.text }, toast.id)) : null, _jsxs("section", { className: "comprehensive-card", children: [_jsxs("header", { className: "comprehensive-detail-bar", children: [_jsxs("div", { className: "comprehensive-breadcrumb", children: [_jsx("button", { type: "button", className: "comprehensive-breadcrumb-link", onClick: backToList, children: "\u7EFC\u5408\u6708\u62A5" }), _jsx("span", { children: "/" }), _jsx("strong", { children: "\u7EFC\u5408\u6708\u62A5\u8868\uFF08\u4F4F\u5BBF\uFF09" })] }), _jsxs("div", { className: "comprehensive-detail-actions", children: [_jsx("button", { "data-testid": "comprehensive-monthly-refresh-action", type: "button", disabled: loading || actionLoading !== null, onClick: () => setRefreshConfirmOpen(true), children: actionLoading === 'refresh' ? '更新中...' : '更新报表' }), _jsx("button", { "data-testid": "comprehensive-monthly-print-action", type: "button", disabled: loading || actionLoading !== null, onClick: () => runAction('print'), children: actionLoading === 'print' ? '创建中...' : '打印' })] })] }), _jsxs("section", { className: "comprehensive-detail", "aria-label": "\u7EFC\u5408\u6708\u62A5\u8868\u56FA\u5316\u8BE6\u60C5", "data-testid": "comprehensive-monthly-detail", children: [_jsx("h1", { children: "\u7EFC\u5408\u6708\u62A5\u8868\uFF08\u56FA\u5316\uFF09" }), error ? (_jsxs("div", { className: "comprehensive-alert", role: "alert", children: [_jsx("strong", { children: "\u7EFC\u5408\u6708\u62A5\u52A0\u8F7D\u5931\u8D25" }), _jsx("span", { children: error }), _jsx("button", { "data-testid": "comprehensive-monthly-retry", type: "button", onClick: retry, children: "\u91CD\u8BD5" })] })) : null, loading ? (_jsx("div", { className: "comprehensive-loading comprehensive-loading--detail", children: "\u62A5\u8868\u52A0\u8F7D\u4E2D..." })) : currentRow ? (_jsxs(_Fragment, { children: [_jsxs("div", { className: "comprehensive-meta-row", children: [_jsx("span", { children: "\u4F01\u4E1A/\u95E8\u5E97\uFF1A" }), _jsxs("span", { children: ["\u8425\u4E1A\u6708\u4EFD\uFF1A", _jsx("strong", { children: currentRow.monthLabel })] }), _jsxs("span", { children: ["\u7EDF\u8BA1\u5468\u671F\uFF1A", _jsxs("strong", { children: [currentRow.startDate, "~", currentRow.endDate] })] }), _jsxs("span", { children: ["\u751F\u6210\u65F6\u95F4\uFF1A", _jsx("strong", { children: currentRow.generatedAtText.replace('\n', ' ') })] })] }), _jsxs("table", { className: "comprehensive-summary-table", children: [_jsx("thead", { children: _jsxs("tr", { children: [_jsx("th", { colSpan: 2, children: "\u8425\u4E1A\u6570\u636E" }), _jsx("th", { colSpan: 2, children: "\u7ECF\u8425\u6307\u6807" })] }) }), _jsx("tbody", { children: currentRow.summaryPairs.map((pair) => (_jsxs("tr", { children: [_jsx("td", { children: pair.leftLabel }), _jsx("td", { children: pair.leftValue }), _jsx("td", { children: pair.rightLabel }), _jsx("td", { children: pair.rightValue })] }, `${pair.leftLabel}-${pair.rightLabel}`))) })] }), _jsx("div", { className: "comprehensive-detail-table-wrap", children: _jsxs("table", { className: "comprehensive-detail-table", children: [_jsx("thead", { children: _jsx("tr", { children: comprehensiveMonthlyDetailColumns.map((column) => (_jsx("th", { children: column }, column))) }) }), _jsx("tbody", { children: currentRow.detailRows.map((row) => (_jsx("tr", { children: row.cells.map((cell, index) => (_jsx("td", { children: cell }, `${row.id}-${index}`))) }, row.id))) })] }) })] })) : (_jsxs("div", { className: "comprehensive-empty-state", "data-testid": "comprehensive-monthly-empty", children: [_jsx("div", { "aria-hidden": "true" }), _jsx("strong", { children: "\u6682\u65E0\u6708\u62A5\u8BE6\u60C5" })] }))] })] }), refreshConfirmOpen ? (_jsx("div", { className: "comprehensive-confirm-backdrop", role: "presentation", onMouseDown: () => setRefreshConfirmOpen(false), children: _jsxs("section", { className: "comprehensive-confirm-dialog", role: "dialog", "aria-modal": "true", "aria-label": "\u786E\u8BA4\u66F4\u65B0\u62A5\u8868", onMouseDown: (event) => event.stopPropagation(), children: [_jsx("div", { className: "comprehensive-confirm-dialog__icon", "aria-hidden": "true", children: "!" }), _jsxs("div", { className: "comprehensive-confirm-dialog__content", children: [_jsx("p", { children: "\u66F4\u65B0\u62A5\u8868\u540E\u5C06\u4F1A\u6309\u7167\u5F53\u524D\u6570\u636E\u91CD\u65B0\u751F\u6210\u62A5\u8868\u6570\u636E\uFF0C\u662F\u5426\u786E\u8BA4\u66F4\u65B0" }), _jsxs("footer", { children: [_jsx("button", { type: "button", onClick: () => setRefreshConfirmOpen(false), children: "\u53D6\u6D88" }), _jsx("button", { type: "button", className: "is-primary", onClick: () => {
                                                setRefreshConfirmOpen(false);
                                                runAction('refresh');
                                            }, children: "\u786E\u8BA4" })] })] })] }) })) : null] }));
}
function ComprehensiveMonthlyDiagnostics({ view, requestBody, responseState, }) {
    return (_jsx("span", { className: "comprehensive-monthly-service-state", "data-testid": "comprehensive-monthly-service-state", "data-provider": view?.provider ?? 'mock', "data-endpoint": view?.endpoint ?? '/api/report/monthly/page/get', "data-request-body": JSON.stringify(view?.requestBody ?? requestBody), "data-trace-id": view?.traceId ?? '', "data-response-state": responseState }));
}
