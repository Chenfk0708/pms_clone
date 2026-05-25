import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { defaultScrmGeneralFilters, loadScrmGeneralData, } from '../services/scrmGeneral';
import './ScrmGeneralPage.css';
export function ScrmGeneralPage() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [filters, setFilters] = useState(defaultScrmGeneralFilters);
    const [scenario, setScenario] = useState(searchParams.get('scenario') === 'empty' || searchParams.get('scenario') === 'error'
        ? searchParams.get('scenario')
        : 'success');
    const [dashboard, setDashboard] = useState(null);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(true);
    const [feedback, setFeedback] = useState('');
    const [showAuthAlert, setShowAuthAlert] = useState(true);
    useEffect(() => {
        let alive = true;
        loadScrmGeneralData(filters, scenario)
            .then((data) => {
            if (!alive)
                return;
            setDashboard(data);
        })
            .catch((reason) => {
            if (!alive)
                return;
            setDashboard(null);
            setError(reason.message);
        })
            .finally(() => {
            if (alive)
                setLoading(false);
        });
        return () => {
            alive = false;
        };
    }, [filters, scenario]);
    const requestEcho = useMemo(() => dashboard?.requestEcho ?? '', [dashboard]);
    function updateDateFilter(key, value) {
        setLoading(true);
        setError('');
        setScenario('success');
        setFilters((current) => ({ ...current, [key]: value }));
        setFeedback('已更新客户增长趋势日期');
    }
    function handleRetry() {
        setLoading(true);
        setError('');
        setScenario('success');
        setFeedback('已重新加载客户概况');
    }
    return (_jsxs("div", { className: "scrm-page scrm-page--general", children: [_jsx("h1", { className: "scrm-visually-hidden", children: "\u5BA2\u6237\u6982\u51B5" }), _jsx("output", { "data-testid": "scrm-general-request-state", hidden: true, "aria-label": "\u5BA2\u6237\u6982\u51B5\u8BF7\u6C42\u72B6\u6001", children: requestEcho }), _jsx("output", { className: "scrm-general-feedback", role: "status", "aria-label": "\u5BA2\u6237\u6982\u51B5\u64CD\u4F5C\u53CD\u9988", children: feedback }), showAuthAlert ? (_jsxs("section", { className: "scrm-auth-alert", "aria-label": "\u4F01\u4E1A\u5FAE\u4FE1\u6388\u6743\u63D0\u9192", children: [_jsx("span", { className: "scrm-auth-alert__icon", "aria-hidden": "true" }), _jsx("span", { className: "scrm-auth-alert__text", children: "\u4F01\u4E1A\u5FAE\u4FE1\u672A\u6388\u6743\uFF0C\u53EF\u80FD\u5BFC\u81F4\u90E8\u5206\u529F\u80FD\u65E0\u6CD5\u4F7F\u7528\uFF0C\u8BF7\u5C3D\u5FEB\u524D\u5F80\u6388\u6743\u3002" }), _jsx("button", { type: "button", onClick: () => navigate('/channels/private/setting/weComSetting'), children: "\u524D\u5F80\u4F01\u4E1A\u5FAE\u4FE1\u6388\u6743" }), _jsx("button", { type: "button", onClick: () => setShowAuthAlert(false), children: "\u77E5\u9053\u4E86" })] })) : null, loading ? _jsx("div", { className: "scrm-general-loading", children: "\u5BA2\u6237\u6982\u51B5\u52A0\u8F7D\u4E2D" }) : null, error ? (_jsxs("section", { className: "scrm-general-error", role: "alert", "aria-label": "\u5BA2\u6237\u6982\u51B5\u6570\u636E\u9519\u8BEF", children: [_jsx("strong", { children: error }), _jsx("button", { type: "button", onClick: handleRetry, children: "\u91CD\u8BD5" })] })) : null, dashboard ? (_jsxs(_Fragment, { children: [_jsxs("section", { className: "scrm-section", "aria-label": "\u5BA2\u6237\u8D44\u4EA7\u76D8\u70B9", children: [_jsx("h2", { children: "\u5BA2\u6237\u8D44\u4EA7\u76D8\u70B9" }), _jsx("div", { className: "scrm-asset-grid", children: dashboard.metrics.map((metric) => (_jsxs("article", { className: "scrm-asset-card", children: [_jsx("div", { className: `scrm-asset-card__badge tone-${metric.tone}`, "aria-hidden": "true", children: _jsx("span", { className: "scrm-asset-card__glyph" }) }), _jsxs("div", { className: "scrm-asset-card__content", children: [_jsx("span", { className: "scrm-asset-card__label", children: metric.label }), _jsxs("strong", { children: [metric.value, metric.unit ? _jsx("em", { children: metric.unit }) : null] }), metric.actionLabel && metric.actionRoute ? (_jsx(Link, { to: metric.actionRoute, className: "scrm-asset-card__link", children: metric.actionLabel })) : (_jsx("small", { children: metric.trend }))] })] }, metric.id))) })] }), _jsxs("section", { className: "scrm-section scrm-section--trend", "aria-label": "\u5BA2\u6237\u589E\u957F\u8D8B\u52BF\u56FE", children: [_jsx("h2", { children: "\u5BA2\u6237\u589E\u957F\u8D8B\u52BF\u56FE" }), _jsxs("div", { className: "scrm-trend-panel", children: [_jsxs("div", { className: "scrm-trend-panel__header", children: [_jsxs("div", { className: "scrm-trend-panel__range", children: [_jsx("label", { className: "scrm-trend-panel__field", children: _jsx("input", { "aria-label": "\u8D8B\u52BF\u5F00\u59CB\u65E5\u671F", type: "date", value: filters.startDate, onChange: (event) => updateDateFilter('startDate', event.target.value) }) }), _jsx("span", { className: "scrm-trend-panel__divider", "aria-hidden": "true", children: "\u2192" }), _jsx("label", { className: "scrm-trend-panel__field", children: _jsx("input", { "aria-label": "\u8D8B\u52BF\u7ED3\u675F\u65E5\u671F", type: "date", value: filters.endDate, onChange: (event) => updateDateFilter('endDate', event.target.value) }) })] }), _jsx("div", { className: "scrm-trend-legend", children: dashboard.trends.map((series) => (_jsxs("span", { children: [_jsx("i", { className: `tone-${series.tone}`, "aria-hidden": "true" }), series.label] }, series.label))) })] }), _jsx("div", { className: "scrm-mini-charts", children: dashboard.trends.map((series) => (_jsxs("article", { className: `scrm-mini-chart tone-${series.tone}`, children: [_jsx("div", { className: "scrm-mini-chart__canvas", "aria-hidden": "true", children: _jsx("div", { className: "scrm-mini-chart__baseline" }) }), _jsx("div", { className: "scrm-mini-chart__axis", children: series.points.map((point) => (_jsx("strong", { children: point.date }, point.date))) })] }, series.label))) })] })] }), _jsxs("section", { className: "scrm-section scrm-section--scenes", "aria-label": "\u63A8\u8350\u573A\u666F", children: [_jsx("h2", { children: "\u63A8\u8350\u573A\u666F" }), _jsx("div", { className: "scrm-scene-grid", children: dashboard.scenes.map((scene) => (_jsxs("article", { className: "scrm-scene-card", children: [_jsx("div", { className: `scrm-scene-card__icon tone-${scene.tone}`, "aria-hidden": "true", children: _jsx("span", { className: "scrm-scene-card__glyph" }) }), _jsx("strong", { children: scene.title }), _jsx("p", { children: scene.description }), _jsx(Link, { to: scene.route, className: "scrm-scene-card__action", children: "\u7ACB\u5373\u4F53\u9A8C" })] }, scene.id))) })] })] })) : null] }));
}
