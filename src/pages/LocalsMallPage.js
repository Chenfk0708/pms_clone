import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { createDefaultLocalsMallQuery, fetchLocalsMallApplicableRooms, fetchLocalsMallDetail, fetchLocalsMallOverview, fetchLocalsMallPaymentGroups, getLocalsMallContract, } from '../services/localsMall';
import './LocalsMallPage.css';
const sideLinks = [
    { label: '我的权益', path: '/version/myBenefit' },
    { label: '置换权益', path: '/version/displacementBenefit' },
    { label: '版本订阅', path: '/version/subscriptionCenter' },
    { label: '应用订阅', path: '/version/applicationPayment' },
    { label: '路客商城', path: '/version/localsMall' },
];
export function LocalsMallPage() {
    const location = useLocation();
    const pageMode = location.pathname.endsWith('/detail') ? 'detail' : 'mall';
    const query = createDefaultLocalsMallQuery(new URLSearchParams(location.search), pageMode);
    return _jsx(LocalsMallViewShell, { pageMode: pageMode, query: query }, `${location.pathname}${location.search}`);
}
function LocalsMallViewShell({ pageMode, query, }) {
    const location = useLocation();
    const navigate = useNavigate();
    const [overview, setOverview] = useState(null);
    const [detail, setDetail] = useState(null);
    const [roomGroups, setRoomGroups] = useState([]);
    const [paymentGroups, setPaymentGroups] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState('');
    const [feedback, setFeedback] = useState(pageMode === 'mall' ? '路客商城数据加载中' : '路客商城详情加载中');
    const [isAgreementChecked, setIsAgreementChecked] = useState(false);
    const [isRoomsDialogOpen, setIsRoomsDialogOpen] = useState(false);
    const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
    const [isSubmitDialogOpen, setIsSubmitDialogOpen] = useState(false);
    useEffect(() => {
        const controller = new AbortController();
        const handleError = (error) => {
            if (error instanceof DOMException && error.name === 'AbortError')
                return;
            const message = error instanceof Error
                ? error.message
                : pageMode === 'mall'
                    ? '路客商城数据加载失败，请稍后重试'
                    : '路客商城详情加载失败，请稍后重试';
            setErrorMessage(message);
            setFeedback(message);
        };
        if (pageMode === 'mall') {
            void fetchLocalsMallOverview(query, controller.signal)
                .then((result) => {
                setOverview(result);
                setFeedback(result.emptyState ? '当前门店暂无可采购的商品' : '路客商城数据已就绪');
            })
                .catch(handleError)
                .finally(() => {
                if (!controller.signal.aborted) {
                    setIsLoading(false);
                }
            });
            return () => controller.abort();
        }
        void fetchLocalsMallDetail(query, controller.signal)
            .then((result) => {
            setDetail(result);
            setFeedback('路客商城详情已就绪');
        })
            .catch(handleError)
            .finally(() => {
            if (!controller.signal.aborted) {
                setIsLoading(false);
            }
        });
        return () => controller.abort();
    }, [pageMode, query]);
    async function openRoomsDialog() {
        if (isLoading || isRoomsDialogOpen)
            return;
        try {
            const groups = await fetchLocalsMallApplicableRooms(query);
            setRoomGroups(groups);
            setIsRoomsDialogOpen(true);
            setFeedback('已展开适用房型');
        }
        catch (error) {
            setFeedback(error instanceof Error ? error.message : '适用房型加载失败，请稍后重试');
        }
    }
    async function openPaymentDialog() {
        if (isLoading || isPaymentDialogOpen)
            return;
        try {
            const groups = await fetchLocalsMallPaymentGroups(query);
            setPaymentGroups(groups);
            setIsPaymentDialogOpen(true);
            setFeedback('已展开支付方式');
        }
        catch (error) {
            setFeedback(error instanceof Error ? error.message : '支付方式加载失败，请稍后重试');
        }
    }
    function handleRetry() {
        navigate(location.pathname, { replace: true });
    }
    function handleOpenDetail(product) {
        navigate(`/version/localsMall/detail?productId=${product.id}`);
    }
    function handleSubmitPurchase() {
        if (!isAgreementChecked) {
            setFeedback('请先勾选购买协议');
            return;
        }
        setIsSubmitDialogOpen(true);
        setFeedback('购买申请已提交');
    }
    const provider = overview?.provider ?? detail?.provider ?? 'mock';
    const state = errorMessage ? 'error' : overview?.emptyState ? 'empty' : isLoading ? 'loading' : 'ready';
    const traceId = overview?.traceId ?? detail?.traceId ?? '';
    const contractQuery = {
        ...query,
        productId: resolveContractProductId(query, overview, detail),
    };
    const contract = getLocalsMallContract(contractQuery, provider, errorMessage ? 'error' : overview?.emptyState ? 'empty' : isLoading ? 'loading' : 'success', traceId);
    return (_jsxs("div", { className: "locals-mall-page", "data-provider": provider, "data-page": pageMode, "data-state": state, children: [_jsx("pre", { hidden: true, "data-testid": "locals-mall-service-contract", "data-provider": contract.provider, "data-state": contract.state, children: JSON.stringify(contract, null, 2) }), _jsxs("aside", { className: "locals-mall-sidebar", "aria-label": "\u8BA2\u9605\u4E2D\u5FC3\u4FA7\u680F", children: [_jsx("div", { className: "locals-mall-sidebar__root", children: "\u8BA2\u9605\u4E2D\u5FC3" }), _jsx("nav", { "aria-label": "\u6743\u76CA\u4E0E\u8BA2\u9605\u4FA7\u680F", children: sideLinks.map((item) => (_jsx(NavLink, { to: item.path, className: ({ isActive }) => `locals-mall-link${isActive ? ' is-active' : ''}`, children: item.label }, item.path))) }), _jsx("span", { className: "locals-mall-build", children: "\u7248\u672C\u53F7\uFF1Av4.10.7" })] }), pageMode === 'mall' ? (_jsx(MallView, { overview: overview, isLoading: isLoading, errorMessage: errorMessage, feedback: feedback, onRetry: handleRetry, onBuy: handleOpenDetail, onNavigate: navigate })) : (_jsx(DetailView, { detail: detail, isLoading: isLoading, errorMessage: errorMessage, isAgreementChecked: isAgreementChecked, onAgreementChange: setIsAgreementChecked, onOpenRooms: openRoomsDialog, onOpenPayments: openPaymentDialog, onRetry: handleRetry, onBack: () => navigate('/version/localsMall'), onSubmit: handleSubmitPurchase })), _jsx(StatusToast, { message: feedback }), isRoomsDialogOpen ? (_jsx(Dialog, { title: "\u9002\u7528\u623F\u578B", closeLabel: "\u5173\u95ED\u9002\u7528\u623F\u578B", onClose: () => setIsRoomsDialogOpen(false), children: _jsx("div", { className: "locals-mall-dialog-list", children: roomGroups.map((group) => (_jsxs("section", { className: "locals-mall-dialog-group", children: [_jsx("h3", { children: group.roomCategoryName }), _jsx("p", { children: group.rooms.join('、') })] }, group.roomCategoryId))) }) })) : null, isPaymentDialogOpen ? (_jsx(Dialog, { title: "\u652F\u4ED8\u65B9\u5F0F", closeLabel: "\u5173\u95ED\u652F\u4ED8\u65B9\u5F0F", onClose: () => setIsPaymentDialogOpen(false), children: _jsx("div", { className: "locals-mall-dialog-list", children: paymentGroups.map((group) => (_jsxs("section", { className: "locals-mall-dialog-group", children: [_jsx("h3", { children: group.groupTypeName }), _jsx("p", { children: group.paymentTypes.join('、') })] }, group.groupType))) }) })) : null, isSubmitDialogOpen && detail ? (_jsx(Dialog, { title: "\u8D2D\u4E70\u7533\u8BF7\u5DF2\u63D0\u4EA4", closeLabel: "\u5173\u95ED\u8D2D\u4E70\u7ED3\u679C", onClose: () => setIsSubmitDialogOpen(false), children: _jsxs("div", { className: "locals-mall-submit-body", children: [_jsx("h3", { children: detail.productName }), _jsx("p", { children: "\u91C7\u8D2D\u7533\u8BF7\u5DF2\u8FDB\u5165\u5904\u7406\u961F\u5217\uFF0C\u53EF\u7EE7\u7EED\u524D\u5F80\u667A\u80FD\u95E8\u9501\u9875\u9762\u5B8C\u6210\u540E\u7EED\u914D\u7F6E\u3002" }), _jsxs("div", { className: "locals-mall-submit-actions", children: [_jsx("button", { type: "button", onClick: () => setIsSubmitDialogOpen(false), children: "\u7559\u5728\u5F53\u524D\u9875" }), _jsx("button", { type: "button", className: "locals-mall-primary-button", onClick: () => navigate(detail.routeAfterSubmit), children: "\u524D\u5F80\u667A\u80FD\u95E8\u9501" })] })] }) })) : null] }));
}
function MallView({ overview, isLoading, errorMessage, feedback, onRetry, onBuy, onNavigate, }) {
    return (_jsxs("main", { className: "locals-mall-main", children: [_jsxs("header", { className: "locals-mall-summary", children: [_jsxs("div", { children: [_jsx("h1", { children: "\u8DEF\u5BA2\u5546\u57CE" }), _jsx("p", { children: "\u6309\u76EE\u6807\u7AD9\u5546\u54C1\u7ED3\u6784\u6574\u7406\u7CFB\u7EDF\u529F\u80FD\u4E0E\u667A\u80FD\u786C\u4EF6\uFF0C\u5E76\u4FDD\u6301\u8D2D\u4E70\u94FE\u8DEF\u4E0E\u73B0\u6709\u8DEF\u7531\u534F\u8C03\u3002" })] }), _jsx("span", { children: overview?.requestedAtLabel ?? '最近同步：2026-05-19 11:28' })] }), _jsxs("section", { className: "locals-mall-feedback-card", "aria-label": "\u8DEF\u5BA2\u5546\u57CE\u6570\u636E\u6982\u89C8", children: [_jsx("strong", { children: "\u5F53\u524D\u53CD\u9988" }), _jsx("span", { children: feedback })] }), isLoading ? _jsx("div", { className: "locals-mall-loading", children: "\u8DEF\u5BA2\u5546\u57CE\u6570\u636E\u52A0\u8F7D\u4E2D" }) : null, errorMessage ? (_jsxs("section", { className: "locals-mall-alert", role: "alert", "aria-label": "\u8DEF\u5BA2\u5546\u57CE\u52A0\u8F7D\u5931\u8D25", children: [_jsx("strong", { children: "\u8DEF\u5BA2\u5546\u57CE\u52A0\u8F7D\u5931\u8D25" }), _jsx("p", { children: errorMessage }), _jsx("button", { type: "button", onClick: onRetry, children: "\u91CD\u65B0\u52A0\u8F7D" })] })) : null, !isLoading && !errorMessage && overview?.emptyState ? (_jsx(EmptyStateView, { emptyState: overview.emptyState, onNavigate: onNavigate })) : null, !isLoading && !errorMessage && overview && !overview.emptyState
                ? overview.sections.map((section) => (_jsxs("section", { className: "locals-mall-section", "aria-label": section.title, children: [_jsx("h2", { children: section.title }), _jsx("div", { className: `locals-mall-products ${section.id === 'system' ? 'locals-mall-products--single' : 'locals-mall-products--grid'}`, children: section.products.map((product) => (_jsxs("article", { className: "locals-mall-card", children: [_jsx("img", { className: "locals-mall-thumb", src: product.image, alt: product.name }), _jsxs("div", { className: "locals-mall-card__body", children: [_jsx("span", { className: "locals-mall-card__tag", children: product.tag }), _jsx("h3", { children: product.name }), _jsx("p", { children: product.description }), _jsx("strong", { children: product.priceLabel })] }), _jsx("button", { type: "button", onClick: () => onBuy(product), children: "\u7ACB\u5373\u8D2D\u4E70" })] }, product.id))) })] }, section.id)))
                : null, _jsxs("section", { className: "locals-mall-shortcuts", "aria-label": "\u5FEB\u6377\u5165\u53E3", children: [_jsxs("header", { className: "locals-mall-shortcuts__head", children: [_jsx("h2", { children: "\u5FEB\u6377\u5165\u53E3" }), _jsx("p", { children: "\u4ECE\u5546\u57CE\u76F4\u63A5\u8854\u63A5\u5230\u667A\u6167\u9152\u5E97\u73B0\u6709\u9875\u9762\uFF0C\u907F\u514D\u505C\u7559\u5728\u65E0\u54CD\u5E94\u5165\u53E3\u3002" })] }), _jsx("div", { className: "locals-mall-shortcuts__grid", children: (overview?.quickEntries ?? []).map((entry) => (_jsxs("button", { type: "button", className: "locals-mall-shortcut", onClick: () => onNavigate(entry.path), children: [_jsx("strong", { children: entry.label }), _jsx("span", { children: entry.description })] }, entry.id))) })] })] }));
}
function DetailView({ detail, isLoading, errorMessage, isAgreementChecked, onAgreementChange, onOpenRooms, onOpenPayments, onRetry, onBack, onSubmit, }) {
    return (_jsxs("main", { className: "locals-mall-main locals-mall-main--detail", children: [_jsxs("div", { className: "locals-mall-crumb", children: [_jsx("button", { type: "button", onClick: onBack, children: "\u8DEF\u5BA2\u5546\u57CE/" }), _jsx("span", { children: "\u8BE6\u60C5" })] }), isLoading ? _jsx("div", { className: "locals-mall-loading", children: "\u8DEF\u5BA2\u5546\u57CE\u8BE6\u60C5\u52A0\u8F7D\u4E2D" }) : null, errorMessage ? (_jsxs("section", { className: "locals-mall-alert", role: "alert", "aria-label": "\u8DEF\u5BA2\u5546\u57CE\u52A0\u8F7D\u5931\u8D25", children: [_jsx("strong", { children: "\u8DEF\u5BA2\u5546\u57CE\u52A0\u8F7D\u5931\u8D25" }), _jsx("p", { children: errorMessage }), _jsx("button", { type: "button", onClick: onRetry, children: "\u91CD\u65B0\u52A0\u8F7D" })] })) : null, !isLoading && !errorMessage && detail ? (_jsxs("div", { className: "locals-mall-detail-layout", children: [_jsxs("section", { className: "locals-mall-detail-media", children: [_jsx("img", { className: "locals-mall-detail-hero", src: "https://locals-house-prod.oss-cn-shenzhen.aliyuncs.com/hudson/0017687596945558.png", alt: detail.productName }), _jsxs("div", { className: "locals-mall-detail-copy", children: [_jsx("span", { children: detail.requestedAtLabel }), _jsx("h1", { children: detail.productName }), _jsx("p", { children: detail.productDescription })] })] }), _jsxs("section", { className: "locals-mall-purchase", "aria-label": "\u8D2D\u4E70\u4FE1\u606F", children: [_jsxs("div", { className: "locals-mall-purchase-row", children: [_jsx("span", { children: "\u8D2D\u4E70\u65F6\u957F" }), _jsx("strong", { children: detail.purchaseTermLabel })] }), _jsxs("div", { className: "locals-mall-purchase-row", children: [_jsx("span", { children: "\u8D2D\u4E70\u65B9" }), _jsx("strong", { children: detail.buyerName })] }), _jsxs("div", { className: "locals-mall-purchase-row locals-mall-purchase-row--action", children: [_jsx("span", { children: "\u9002\u7528\u623F\u578B" }), _jsxs("div", { children: [_jsx("strong", { children: detail.roomSummary }), _jsx("button", { type: "button", onClick: onOpenRooms, children: "\u67E5\u770B\u9002\u7528\u623F\u578B" })] })] }), _jsxs("div", { className: "locals-mall-purchase-row locals-mall-purchase-row--action", children: [_jsx("span", { children: "\u652F\u4ED8\u65B9\u5F0F" }), _jsxs("div", { children: [_jsx("strong", { children: detail.paymentSummary }), _jsx("button", { type: "button", onClick: onOpenPayments, children: "\u67E5\u770B\u652F\u4ED8\u65B9\u5F0F" })] })] }), _jsxs("div", { className: "locals-mall-purchase-row locals-mall-purchase-row--total", children: [_jsx("span", { children: "\u603B\u8D39\u7528" }), _jsx("strong", { children: detail.totalAmountLabel })] }), _jsx("div", { className: "locals-mall-purchase-line" }), _jsxs("label", { className: "locals-mall-agreement", children: [_jsx("input", { type: "checkbox", "aria-label": "\u8D2D\u4E70\u534F\u8BAE", checked: isAgreementChecked, onChange: (event) => onAgreementChange(event.target.checked) }), _jsx("span", { children: detail.agreementLabel })] }), _jsx("p", { className: "locals-mall-purchase-notice", children: detail.purchaseNotice }), _jsx("button", { type: "button", className: "locals-mall-primary-button locals-mall-buy", onClick: onSubmit, children: "\u63D0\u4EA4\u8D2D\u4E70\u7533\u8BF7" })] })] })) : null] }));
}
function EmptyStateView({ emptyState, onNavigate, }) {
    return (_jsxs("section", { className: "locals-mall-empty", "aria-label": "\u8DEF\u5BA2\u5546\u57CE\u7A7A\u72B6\u6001", children: [_jsx("strong", { children: emptyState.title }), _jsx("p", { children: emptyState.description }), _jsx("button", { type: "button", onClick: () => onNavigate(emptyState.actionPath), children: emptyState.actionLabel })] }));
}
function Dialog({ title, closeLabel, onClose, children, }) {
    return (_jsx("div", { className: "locals-mall-dialog-backdrop", children: _jsxs("section", { className: "locals-mall-dialog", role: "dialog", "aria-modal": "true", "aria-label": title, children: [_jsxs("header", { className: "locals-mall-dialog__header", children: [_jsx("h2", { children: title }), _jsx("button", { type: "button", "aria-label": closeLabel, onClick: onClose, children: "\u00D7" })] }), children] }) }));
}
function StatusToast({ message }) {
    return (_jsx("div", { className: "locals-mall-status", role: "status", "aria-live": "polite", "aria-label": "\u8DEF\u5BA2\u5546\u57CE\u64CD\u4F5C\u53CD\u9988", children: message }));
}
function resolveContractProductId(query, overview, detail) {
    if (detail?.productId)
        return detail.productId;
    for (const section of overview?.sections ?? []) {
        const currentProduct = section.products.find((product) => product.id);
        if (currentProduct)
            return currentProduct.id;
    }
    return query.productId;
}
