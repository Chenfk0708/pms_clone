import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useCallback, useEffect, useMemo, useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { calculateVersionSubscriptionTotal, createDefaultVersionSubscriptionFilters, fetchVersionSubscriptionDashboard, submitVersionSubscriptionOrder, } from '../services/versionSubscription';
import './VersionSubscriptionPage.css';
const sideLinks = [
    { label: '我的权益', path: '/version/myBenefit' },
    { label: '置换权益', path: '/version/displacementBenefit' },
    { label: '版本订阅', path: '/version/subscriptionCenter' },
    { label: '应用订阅', path: '/version/applicationPayment' },
    { label: '路客商城', path: '/version/localsMall' },
];
export function VersionSubscriptionPage() {
    const location = useLocation();
    const navigate = useNavigate();
    const initialFilters = useMemo(() => createDefaultVersionSubscriptionFilters(new URLSearchParams(location.search)), [location.search]);
    const [filters, setFilters] = useState(initialFilters);
    const [dashboard, setDashboard] = useState(null);
    const [selectedPlanId, setSelectedPlanId] = useState('delight');
    const [durationId, setDurationId] = useState('1y');
    const [agreed, setAgreed] = useState(true);
    const [compareOpen, setCompareOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [feedback, setFeedback] = useState('版本订阅数据加载中');
    useEffect(() => {
        const timer = window.setTimeout(() => {
            setFilters(initialFilters);
        }, 0);
        return () => window.clearTimeout(timer);
    }, [initialFilters]);
    const loadDashboard = useCallback(async (nextFilters, reason) => {
        setIsLoading(true);
        setError('');
        if (reason === 'retry') {
            setFeedback('正在重新加载版本订阅数据');
        }
        else if (reason === 'refresh') {
            setFeedback('正在刷新版本订阅数据');
        }
        else {
            setFeedback('版本订阅数据加载中');
        }
        try {
            const nextDashboard = await fetchVersionSubscriptionDashboard(nextFilters);
            setDashboard(nextDashboard);
            setSelectedPlanId((current) => nextDashboard.plans.some((item) => item.id === current) ? current : nextDashboard.currentPlanId);
            setFeedback(nextDashboard.state === 'empty' ? '当前暂无可订阅版本' : '版本订阅数据已更新');
        }
        catch (loadError) {
            const message = loadError instanceof Error ? loadError.message : '版本订阅加载失败，请稍后重试';
            setDashboard(null);
            setError(message);
            setFeedback(message);
        }
        finally {
            setIsLoading(false);
        }
    }, []);
    useEffect(() => {
        const timer = window.setTimeout(() => {
            void loadDashboard(filters, 'initial');
        }, 0);
        return () => window.clearTimeout(timer);
    }, [filters, loadDashboard]);
    const selectedPlan = dashboard?.plans.find((item) => item.id === selectedPlanId) ?? null;
    const total = dashboard ? calculateVersionSubscriptionTotal(dashboard, selectedPlanId, durationId) : 0;
    const canSubmit = Boolean(dashboard && selectedPlan) && !isLoading && !isSubmitting && dashboard?.state !== 'empty';
    async function handlePurchase() {
        if (!dashboard)
            return;
        setIsSubmitting(true);
        setError('');
        try {
            const result = await submitVersionSubscriptionOrder(filters, dashboard, selectedPlanId, durationId, agreed);
            setFeedback(result.message);
            navigate(result.redirectTo);
        }
        catch (submitError) {
            const message = submitError instanceof Error ? submitError.message : '版本订阅操作失败，请稍后重试';
            setFeedback(message);
            setError(message);
        }
        finally {
            setIsSubmitting(false);
        }
    }
    function handlePlanSelect(planId) {
        setSelectedPlanId(planId);
        setFeedback('已更新续费版本');
    }
    function handleDurationSelect(nextDurationId) {
        setDurationId(nextDurationId);
        setFeedback('已更新购买时长');
    }
    function handleRetry() {
        if (filters.mockState === 'error') {
            setFilters({ ...filters, mockState: 'success' });
            return;
        }
        void loadDashboard(filters, 'retry');
    }
    return (_jsxs("div", { className: "version-subscription-page", "data-provider": dashboard?.provider ?? 'mock', "data-response-state": error ? 'error' : dashboard?.state ?? 'loading', "data-selected-plan": selectedPlanId, "data-request-camp-id": filters.campId, children: [_jsxs("aside", { className: "version-subscription-sidebar", "aria-label": "\u8BA2\u9605\u4E2D\u5FC3\u4FA7\u680F", children: [_jsx("div", { className: "version-subscription-sidebar__root", children: "\u8BA2\u9605\u4E2D\u5FC3" }), _jsx("nav", { "aria-label": "\u8BA2\u9605\u4E2D\u5FC3\u5BFC\u822A", children: sideLinks.map((item) => (_jsx(NavLink, { to: item.path, className: ({ isActive }) => `version-subscription-link${isActive ? ' is-active' : ''}`, children: item.label }, item.path))) }), _jsxs("span", { className: "version-subscription-build", children: ["\u7248\u672C\u53F7\uFF1A", dashboard?.buildVersion ?? 'v4.10.7'] })] }), _jsxs("section", { className: "version-subscription-main", "aria-label": "\u7248\u672C\u8BA2\u9605\u9875\u9762", children: [_jsxs("section", { className: "version-subscription-hero", "aria-label": "\u5F53\u524D\u7248\u672C\u4FE1\u606F", children: [_jsxs("div", { children: [_jsx("h1", { children: "\u7248\u672C\u8BA2\u9605" }), _jsxs("p", { children: [_jsx("span", { children: "\u5F53\u524D\u7248\u672C\uFF1A" }), _jsx("strong", { children: dashboard?.currentPlanName ?? '加载中' })] }), _jsxs("p", { children: ["\u6709\u6548\u671F\u5230\uFF1A", dashboard?.expirationDate ?? '--'] }), _jsx("span", { className: "version-subscription-camp", children: dashboard?.campName ?? '正在读取门店信息' })] }), _jsx("div", { className: "version-subscription-hero-actions", children: _jsx("button", { type: "button", className: "version-subscription-compare", disabled: !dashboard || dashboard.plans.length === 0, onClick: () => setCompareOpen(true), children: "\u7248\u672C\u5BF9\u6BD4" }) })] }), _jsxs("div", { className: "version-subscription-statebar", children: [_jsx("span", { role: "status", "aria-label": "\u7248\u672C\u8BA2\u9605\u64CD\u4F5C\u53CD\u9988", children: feedback }), dashboard ? _jsx("span", { children: dashboard.requestedAt }) : null] }), isLoading ? (_jsx("div", { className: "version-subscription-loading", "aria-label": "\u7248\u672C\u8BA2\u9605\u52A0\u8F7D\u72B6\u6001", children: "\u7248\u672C\u8BA2\u9605\u6570\u636E\u52A0\u8F7D\u4E2D" })) : null, error ? (_jsxs("div", { className: "version-subscription-error", role: "alert", "aria-label": "\u7248\u672C\u8BA2\u9605\u6570\u636E\u9519\u8BEF", children: [_jsx("strong", { children: "\u7248\u672C\u8BA2\u9605\u52A0\u8F7D\u5931\u8D25\uFF0C\u8BF7\u7A0D\u540E\u91CD\u8BD5" }), _jsx("span", { children: error }), _jsx("button", { type: "button", onClick: handleRetry, children: "\u91CD\u65B0\u52A0\u8F7D" })] })) : null, !error && dashboard?.state === 'empty' ? (_jsxs("section", { className: "version-subscription-empty", "aria-label": "\u7248\u672C\u8BA2\u9605\u7A7A\u6001", children: [_jsx("strong", { children: "\u5F53\u524D\u7248\u672C\u8D44\u6E90\u6682\u672A\u5F00\u653E" }), _jsx("span", { children: "\u8BF7\u8054\u7CFB\u4E1A\u52A1\u7ECF\u7406\u786E\u8BA4\u5F00\u901A\u72B6\u6001\uFF0C\u6216\u7A0D\u540E\u91CD\u65B0\u52A0\u8F7D\u3002" })] })) : null, _jsx("ul", { className: "version-subscription-plans", "aria-label": "\u7248\u672C\u5957\u9910", children: (dashboard?.plans ?? []).map((plan) => (_jsx("li", { children: _jsxs("button", { type: "button", "aria-label": `选择 ${plan.name}`, className: `version-subscription-plan version-subscription-plan--${plan.tone}${selectedPlanId === plan.id ? ' is-active' : ''}`, onClick: () => handlePlanSelect(plan.id), children: [_jsx("span", { className: "version-subscription-badge", children: plan.badge }), _jsx("h2", { children: plan.name }), _jsx("strong", { children: plan.priceLabel }), plan.originalPriceLabel ? _jsx("em", { children: plan.originalPriceLabel }) : null, _jsx("p", { children: plan.summary })] }) }, plan.id))) }), _jsxs("section", { className: "version-subscription-matrix", "aria-label": "\u7248\u672C\u80FD\u529B\u77E9\u9635", children: [_jsxs("div", { className: "version-subscription-limits", children: [_jsx("h2", { children: "\u7248\u672C\u8BA2\u9605" }), (dashboard?.quotas ?? []).map((quota) => (_jsxs("span", { children: [quota.name, "(", quota.total, quota.unit, ")"] }, quota.id)))] }), _jsxs("div", { className: "version-subscription-features", children: [_jsx("h2", { children: "\u529F\u80FD\u8BA2\u9605" }), _jsx("div", { className: "version-subscription-feature-grid", children: (dashboard?.featureGroups ?? []).map((group) => (_jsxs("section", { className: "version-subscription-feature-group", children: [_jsx("h3", { children: group.title }), group.items.map((item) => (_jsx("p", { className: item.enabled ? 'is-enabled' : 'is-disabled', children: item.name }, item.name)))] }, group.title))) })] }), _jsxs("div", { className: "version-subscription-service", children: [_jsx("h2", { children: "\u670D\u52A1\u7279\u6743" }), (dashboard?.featureGroups.find((item) => item.title === '服务特权')?.items ?? []).map((item) => (_jsx("p", { className: item.enabled ? 'is-enabled' : 'is-disabled', children: item.name }, item.name)))] })] }), _jsxs("section", { className: "version-subscription-checkout", "aria-label": "\u7EED\u8D39\u5347\u7EA7", children: [_jsx("strong", { children: "\u7EED\u8D39\u5347\u7EA7" }), _jsx("span", { children: selectedPlan?.name ?? '待选择' }), _jsxs("div", { className: "version-subscription-duration", role: "group", "aria-label": "\u8D2D\u4E70\u65F6\u957F", children: [_jsx("span", { children: "\u8D2D\u4E70\u65F6\u957F:" }), (dashboard?.durations ?? []).map((duration) => (_jsx("button", { type: "button", className: durationId === duration.id ? 'is-active' : '', disabled: !dashboard || dashboard.state === 'empty', onClick: () => handleDurationSelect(duration.id), children: duration.label }, duration.id)))] }), _jsxs("div", { className: "version-subscription-total", children: [_jsx("span", { children: "\u603B\u8D39\u7528" }), _jsxs("strong", { children: ["\u00A5 ", total] })] }), _jsxs("label", { className: "version-subscription-agreement", children: [_jsx("input", { type: "checkbox", checked: agreed, "aria-label": "\u6211\u5DF2\u7ECF\u9605\u8BFB\u5E76\u540C\u610F\u300A\u7545\u4EAB\u7248\u8D2D\u4E70\u534F\u8BAE\u300B", onChange: (event) => setAgreed(event.target.checked) }), "\u6211\u5DF2\u7ECF\u9605\u8BFB\u5E76\u540C\u610F\u300A\u7545\u4EAB\u7248\u8D2D\u4E70\u534F\u8BAE\u300B", _jsx("span", { children: "\u786E\u8BA4\u4E0B\u5355\u5373\u8868\u793A\u60A8\u5DF2\u77E5\u6653\u300A\u8DEF\u5BA2\u4E91\u4EA7\u54C1\u670D\u52A1\u8D2D\u4E70\u534F\u8BAE\u300B\u3002" })] }), _jsx("button", { type: "button", className: "version-subscription-buy", disabled: !canSubmit, onClick: () => void handlePurchase(), children: "\u7ACB\u5373\u8D2D\u4E70" }), _jsx("button", { type: "button", className: "version-subscription-tail", onClick: () => navigate('/version/displacementBenefit'), children: "\u5C3E\u623F\u7F6E\u6362" })] })] }), compareOpen && dashboard ? (_jsx("div", { className: "version-subscription-modal", role: "presentation", children: _jsxs("div", { className: "version-subscription-dialog", role: "dialog", "aria-modal": "true", "aria-label": "\u7248\u672C\u5BF9\u6BD4", children: [_jsx("button", { type: "button", "aria-label": "\u5173\u95ED\u7248\u672C\u5BF9\u6BD4", onClick: () => setCompareOpen(false), children: "\u00D7" }), _jsx("h2", { children: "\u7248\u672C\u5BF9\u6BD4" }), _jsx("p", { children: dashboard.compareSummary }), _jsx("div", { className: "version-subscription-compare-grid", children: dashboard.plans.map((plan) => (_jsxs("article", { children: [_jsx("strong", { children: plan.name }), _jsx("span", { children: plan.priceLabel }), _jsx("p", { children: plan.summary })] }, plan.id))) })] }) })) : null] }));
}
