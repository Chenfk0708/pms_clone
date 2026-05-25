import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useCallback, useEffect, useMemo, useState } from 'react';
import { NavLink, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { APPLICATION_PAYMENT_ROOMS_PATH, APPLICATION_PAYMENT_TYPES_V2_PATH, APPLICATION_PAYMENT_WEI_ROOM_CATEGORY_PATH, createDefaultApplicationPaymentDetailRequest, fetchApplicationPaymentDetail, } from '../services/applicationPayment';
import './ApplicationPaymentDetailPage.css';
const sideLinks = [
    { label: '我的权益', path: '/version/myBenefit' },
    { label: '置换权益', path: '/version/displacementBenefit' },
    { label: '版本订阅', path: '/version/subscriptionCenter' },
    { label: '应用订阅', path: '/version/applicationPayment' },
    { label: '路客商城', path: '/version/localsMall' },
];
export function ApplicationPaymentDetailPage() {
    const location = useLocation();
    const [searchParams] = useSearchParams();
    const routeState = location.state;
    const initialRequest = useMemo(() => createDefaultApplicationPaymentDetailRequest(searchParams, routeState), [searchParams, routeState]);
    return _jsx(ApplicationPaymentDetailBoard, { initialRequest: initialRequest }, `${searchParams.toString()}-${routeState?.product ?? 'default'}`);
}
function ApplicationPaymentDetailBoard({ initialRequest }) {
    const navigate = useNavigate();
    const [request] = useState(initialRequest);
    const [detail, setDetail] = useState(null);
    const [feedback, setFeedback] = useState('应用订阅详情加载中');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [agreed, setAgreed] = useState(false);
    const loadDetail = useCallback(async () => {
        setIsLoading(true);
        setError('');
        setFeedback('应用订阅详情加载中');
        try {
            const nextDetail = await fetchApplicationPaymentDetail(request);
            setDetail(nextDetail);
            setFeedback(nextDetail.feedback);
        }
        catch (loadError) {
            const message = loadError instanceof Error ? loadError.message : '应用订阅详情加载失败，请稍后重试';
            setDetail(null);
            setError(message);
            setFeedback(message);
        }
        finally {
            setIsLoading(false);
        }
    }, [request]);
    useEffect(() => {
        const timer = window.setTimeout(() => {
            void loadDetail();
        }, 0);
        return () => window.clearTimeout(timer);
    }, [loadDetail]);
    const provider = detail?.provider ?? 'mock';
    const contract = {
        provider,
        productId: request.productId,
        campId: request.campId,
        paths: {
            paymentTypesV2: APPLICATION_PAYMENT_TYPES_V2_PATH,
            weiRoomCategories: APPLICATION_PAYMENT_WEI_ROOM_CATEGORY_PATH,
            rooms: APPLICATION_PAYMENT_ROOMS_PATH,
        },
        audit: detail?.audit ?? [],
    };
    return (_jsxs("div", { className: "application-payment-detail-page", "data-provider": provider, "data-product-id": request.productId, "data-request-mock-state": request.mockState, children: [_jsxs("aside", { className: "application-payment-detail-sidebar", "aria-label": "\u8BA2\u9605\u4E2D\u5FC3\u4FA7\u680F", children: [_jsx("div", { className: "application-payment-detail-sidebar__root", children: "\u8BA2\u9605\u4E2D\u5FC3" }), _jsx("nav", { "aria-label": "\u8BA2\u9605\u4E2D\u5FC3\u4FA7\u680F", children: sideLinks.map((item) => (_jsx(NavLink, { to: item.path, className: ({ isActive }) => `application-payment-detail-link${isActive || item.path === '/version/applicationPayment' ? ' is-active' : ''}`, children: item.label }, item.path))) }), _jsx("span", { className: "application-payment-detail-build", children: "\u7248\u672C\u53F7\uFF1Av4.10.7" })] }), _jsxs("main", { className: "application-payment-detail-main", children: [_jsx("section", { className: "application-payment-detail-contract", "aria-label": "\u5E94\u7528\u8BA2\u9605\u8BE6\u60C5\u6570\u636E\u670D\u52A1", children: _jsx("pre", { children: JSON.stringify(contract, null, 2) }) }), _jsx("div", { className: "application-payment-detail-feedback", role: "status", "aria-live": "polite", "aria-label": "\u5E94\u7528\u8BA2\u9605\u8BE6\u60C5\u64CD\u4F5C\u53CD\u9988", children: feedback }), isLoading ? (_jsxs("section", { className: "application-payment-detail-state application-payment-detail-state--loading", "aria-label": "\u5E94\u7528\u8BA2\u9605\u8BE6\u60C5\u52A0\u8F7D\u72B6\u6001", children: [_jsx("strong", { children: "\u6B63\u5728\u540C\u6B65\u8D2D\u4E70\u8BE6\u60C5" }), _jsx("p", { children: "\u6B63\u5728\u5237\u65B0\u5546\u54C1\u8BE6\u60C5\u4E0E\u8D2D\u4E70\u4FE1\u606F\uFF0C\u8BF7\u7A0D\u5019\u3002" })] })) : null, error ? (_jsxs("section", { className: "application-payment-detail-state application-payment-detail-state--error", role: "alert", "aria-label": "\u5E94\u7528\u8BA2\u9605\u8BE6\u60C5\u6570\u636E\u9519\u8BEF", children: [_jsx("strong", { children: "\u5E94\u7528\u8BA2\u9605\u8BE6\u60C5\u52A0\u8F7D\u5931\u8D25" }), _jsx("p", { children: error }), _jsx("button", { type: "button", onClick: () => void loadDetail(), children: "\u91CD\u8BD5" })] })) : null, !isLoading && !error && detail ? (_jsxs("div", { className: "application-payment-detail-layout", children: [_jsxs("section", { className: "application-payment-detail-product", children: [_jsxs("section", { className: `application-payment-detail-hero application-payment-detail-hero--${detail.product.iconTone}`, children: [_jsx("div", { className: `application-payment-detail-icon application-payment-detail-icon--${detail.product.iconTone}`, "aria-hidden": "true", children: detail.product.iconText }), _jsxs("div", { children: [_jsx("h1", { children: detail.product.name }), _jsx("p", { children: detail.product.description })] })] }), _jsxs("section", { className: "application-payment-detail-card", "aria-label": "\u5546\u54C1\u8BE6\u60C5", children: [_jsx("h2", { children: detail.product.detailTitle }), _jsxs("div", { className: "application-payment-detail-summary", children: [_jsx("strong", { children: detail.product.name }), detail.product.detailLines.map((line) => (_jsx("p", { children: line }, line)))] })] })] }), _jsxs("aside", { className: "application-payment-detail-purchase", "aria-label": "\u8D2D\u4E70\u4FE1\u606F", children: [_jsx("h2", { children: "\u8D2D\u4E70\u4FE1\u606F" }), _jsxs("div", { className: "application-payment-detail-row", children: [_jsx("span", { children: "\u5546\u54C1\u4EF7\u683C" }), _jsx("strong", { children: detail.purchaseInfo.priceLabel }), detail.purchaseInfo.originalPriceLabel ? _jsx("em", { children: detail.purchaseInfo.originalPriceLabel }) : null] }), _jsxs("div", { className: "application-payment-detail-row application-payment-detail-row--duration", children: [_jsx("span", { children: "\u8D2D\u4E70\u65F6\u957F" }), _jsx("strong", { children: detail.purchaseInfo.durationMeta }), _jsx("em", { children: detail.purchaseInfo.durationLabel })] }), _jsxs("div", { className: "application-payment-detail-row", children: [_jsx("span", { children: "\u8BA2\u5355\u91D1\u989D" }), _jsx("strong", { children: detail.purchaseInfo.orderAmountLabel }), _jsx("em", { children: "\u660E\u7EC6" })] }), _jsxs("label", { className: "application-payment-detail-agreement", children: [_jsx("input", { type: "checkbox", "aria-label": detail.agreementLabel, checked: agreed, onChange: (event) => setAgreed(event.target.checked) }), _jsx("span", { children: detail.agreementLabel })] }), _jsxs("div", { className: "application-payment-detail-actions", children: [_jsx("button", { type: "button", className: "is-secondary", onClick: () => navigate('/version/applicationPayment'), children: "\u8FD4\u56DE\u76EE\u5F55" }), _jsx("button", { type: "button", disabled: !agreed, children: "\u7ACB\u5373\u8D2D\u4E70" })] })] })] })) : null] })] }));
}
