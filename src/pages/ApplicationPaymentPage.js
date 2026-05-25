import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useCallback, useEffect, useMemo, useState } from 'react';
import { NavLink, useNavigate, useSearchParams } from 'react-router-dom';
import { APPLICATION_PAYMENT_RESOURCE_PATH, APPLICATION_PAYMENT_ROOM_CATEGORY_PATH, APPLICATION_PAYMENT_STORE_PATH, APPLICATION_PAYMENT_TYPES_PATH, APPLICATION_PAYMENT_WAYS_PATH, buildApplicationPaymentRequest, createDefaultApplicationPaymentFilters, fetchApplicationPaymentDashboard, } from '../services/applicationPayment';
import './ApplicationPaymentPage.css';
const sideLinks = [
    { label: '我的权益', path: '/version/myBenefit' },
    { label: '置换权益', path: '/version/displacementBenefit' },
    { label: '版本订阅', path: '/version/subscriptionCenter' },
    { label: '应用订阅', path: '/version/applicationPayment' },
    { label: '路客商城', path: '/version/localsMall' },
];
const tabs = [
    { label: '全部', value: 'all' },
    { label: '渠道直连', value: 'channel' },
    { label: '功能订阅', value: 'feature' },
];
export function ApplicationPaymentPage() {
    const [searchParams, setSearchParams] = useSearchParams();
    const initialFilters = useMemo(() => createDefaultApplicationPaymentFilters(searchParams), [searchParams]);
    function updateSearchParamCategory(category) {
        const next = new URLSearchParams(searchParams);
        if (category === 'all') {
            next.delete('applicationPaymentCategory');
        }
        else {
            next.set('applicationPaymentCategory', category);
        }
        setSearchParams(next, { replace: true });
    }
    return (_jsx(ApplicationPaymentBoard, { initialFilters: initialFilters, onChangeCategory: updateSearchParamCategory }, searchParams.toString()));
}
function ApplicationPaymentBoard({ initialFilters, onChangeCategory, }) {
    const navigate = useNavigate();
    const [filters, setFilters] = useState(initialFilters);
    const [dashboard, setDashboard] = useState(null);
    const [feedback, setFeedback] = useState('应用订阅数据加载中');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const loadDashboard = useCallback(async (nextFilters, reason) => {
        setIsLoading(true);
        setError('');
        setFeedback(reason === 'tab' ? '正在切换应用订阅目录' : '应用订阅数据加载中');
        try {
            const nextDashboard = await fetchApplicationPaymentDashboard(nextFilters);
            setDashboard(nextDashboard);
            setFeedback(nextDashboard.sections.length === 0
                ? '暂无可展示的应用订阅商品'
                : reason === 'tab'
                    ? '已按目录切换应用订阅商品'
                    : nextDashboard.feedback);
        }
        catch (loadError) {
            const message = loadError instanceof Error ? loadError.message : '应用订阅数据加载失败，请稍后重试';
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
    function handleTabChange(category) {
        const nextFilters = { ...filters, category };
        setFilters(nextFilters);
        onChangeCategory(category);
        void loadDashboard(nextFilters, 'tab');
    }
    function handleRetry() {
        void loadDashboard(filters, 'retry');
    }
    function handleCardAction(card) {
        if (card.action.type === 'use') {
            navigate(card.action.routeTarget);
            return;
        }
        if (card.action.type === 'subscribe') {
            navigate(`/version/applicationPayment/detail${card.action.detailSearch ?? ''}`, {
                state: card.action.detailState,
            });
            return;
        }
        setFeedback(card.action.feedback);
    }
    const provider = dashboard?.provider ?? 'mock';
    const contract = {
        provider,
        request: buildApplicationPaymentRequest(filters),
        paths: {
            resource: APPLICATION_PAYMENT_RESOURCE_PATH,
            paymentTypes: APPLICATION_PAYMENT_TYPES_PATH,
            stores: APPLICATION_PAYMENT_STORE_PATH,
            roomCategories: APPLICATION_PAYMENT_ROOM_CATEGORY_PATH,
            paymentWays: APPLICATION_PAYMENT_WAYS_PATH,
        },
        audit: dashboard?.audit ?? [],
    };
    return (_jsxs("div", { className: "application-payment-page", "data-provider": provider, "data-request-category": filters.category, "data-request-mock-state": filters.mockState, children: [_jsx("section", { className: "application-payment-contract", "aria-label": "\u5E94\u7528\u8BA2\u9605\u6570\u636E\u670D\u52A1", children: _jsx("pre", { children: JSON.stringify(contract, null, 2) }) }), _jsxs("aside", { className: "application-payment-sidebar", "aria-label": "\u5E94\u7528\u8BA2\u9605\u4FA7\u680F", children: [_jsx("div", { className: "application-payment-sidebar__root", children: "\u8BA2\u9605\u4E2D\u5FC3" }), _jsx("nav", { "aria-label": "\u5E94\u7528\u8BA2\u9605\u4FA7\u680F", children: sideLinks.map((item) => (_jsx(NavLink, { to: item.path, className: ({ isActive }) => `application-payment-side-link${isActive ? ' is-active' : ''}`, children: item.label }, item.path))) }), _jsx("span", { className: "application-payment-build", children: "\u7248\u672C\u53F7\uFF1Av4.10.7" })] }), _jsxs("main", { className: "application-payment-main", "aria-label": "\u5E94\u7528\u8BA2\u9605\u9875\u9762", children: [_jsxs("header", { className: "application-payment-toolbar", children: [_jsx("div", { className: "application-payment-tabs", role: "tablist", "aria-label": "\u5E94\u7528\u8BA2\u9605\u5206\u7C7B", children: tabs.map((tab) => (_jsx("button", { type: "button", role: "tab", "aria-selected": filters.category === tab.value, onClick: () => handleTabChange(tab.value), children: tab.label }, tab.value))) }), _jsx("div", { className: "application-payment-feedback", role: "status", "aria-live": "polite", "aria-label": "\u5E94\u7528\u8BA2\u9605\u64CD\u4F5C\u53CD\u9988", children: feedback })] }), isLoading ? (_jsxs("section", { className: "application-payment-state application-payment-state--loading", "aria-label": "\u5E94\u7528\u8BA2\u9605\u52A0\u8F7D\u72B6\u6001", children: [_jsx("strong", { children: "\u6B63\u5728\u540C\u6B65\u5E94\u7528\u8BA2\u9605\u76EE\u5F55" }), _jsx("p", { children: "\u6B63\u5728\u5237\u65B0\u6E20\u9053\u76F4\u8FDE\u4E0E\u529F\u80FD\u8BA2\u9605\u5546\u54C1\uFF0C\u8BF7\u7A0D\u5019\u3002" })] })) : null, error ? (_jsxs("section", { className: "application-payment-state application-payment-state--error", role: "alert", "aria-label": "\u5E94\u7528\u8BA2\u9605\u6570\u636E\u9519\u8BEF", children: [_jsx("strong", { children: "\u5E94\u7528\u8BA2\u9605\u6570\u636E\u52A0\u8F7D\u5931\u8D25" }), _jsx("p", { children: error }), _jsx("button", { type: "button", onClick: handleRetry, children: "\u91CD\u8BD5" })] })) : null, !isLoading && !error && dashboard && dashboard.sections.length === 0 ? (_jsxs("section", { className: "application-payment-state application-payment-state--empty", "aria-label": "\u5E94\u7528\u8BA2\u9605\u7A7A\u72B6\u6001", children: [_jsx("strong", { children: "\u5F53\u524D\u6761\u4EF6\u4E0B\u6682\u65E0\u5E94\u7528\u8BA2\u9605\u5546\u54C1" }), _jsx("p", { children: "\u53EF\u4EE5\u5207\u6362\u76EE\u5F55\u6216\u786E\u8BA4\u5F53\u524D\u95E8\u5E97\u8BA2\u9605\u72B6\u6001\u540E\u518D\u67E5\u770B\u3002" })] })) : null, !isLoading && !error && dashboard
                        ? dashboard.sections.map((section) => (_jsxs("section", { className: "application-payment-section", "aria-label": section.title, children: [_jsx("h2", { children: section.title }), _jsx("div", { className: "application-payment-grid", children: section.cards.map((card) => (_jsxs("article", { className: "application-payment-card", children: [_jsx("div", { className: `application-payment-icon application-payment-icon--${card.iconTone}`, "aria-hidden": "true", children: card.iconText }), _jsxs("div", { className: "application-payment-card__body", children: [_jsxs("header", { children: [_jsx("h3", { children: card.name }), card.badge ? _jsx("span", { className: "application-payment-status", children: card.badge }) : null] }), _jsxs("p", { className: "application-payment-price", children: [_jsx("strong", { children: card.priceLabel }), card.originalPriceLabel ? _jsx("del", { children: card.originalPriceLabel }) : null] }), _jsx("p", { className: "application-payment-desc", children: card.description })] }), _jsxs("footer", { children: [_jsx("span", { className: `application-payment-tag application-payment-tag--${card.category}`, children: card.tag }), _jsx("button", { type: "button", className: card.action.type === 'use' ? 'is-secondary' : '', disabled: card.action.type === 'disabled', "aria-label": `${card.action.label} ${card.name}`, onClick: () => handleCardAction(card), children: card.action.label })] })] }, card.id))) })] }, section.id)))
                        : null] })] }));
}
