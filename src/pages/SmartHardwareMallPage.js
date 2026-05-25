import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { createDefaultSmartHardwareMallQuery, fetchSmartHardwareApplicableRooms, fetchSmartHardwareMallDetail, fetchSmartHardwareMallOverview, fetchSmartHardwarePaymentGroups, } from '../services/smartHardwareMall';
import './SmartHardwareMallPage.css';
export function SmartHardwareMallPage() {
    const location = useLocation();
    const navigate = useNavigate();
    const pageMode = location.pathname.endsWith('/detail') ? 'detail' : 'mall';
    const [overview, setOverview] = useState(null);
    const [detail, setDetail] = useState(null);
    const [roomGroups, setRoomGroups] = useState([]);
    const [paymentGroups, setPaymentGroups] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState('');
    const [feedback, setFeedback] = useState('智能硬件商城数据加载中');
    const [contactProduct, setContactProduct] = useState(null);
    const [isRoomDialogOpen, setIsRoomDialogOpen] = useState(false);
    const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
    const [isAgreementChecked, setIsAgreementChecked] = useState(false);
    const [isSubmitDialogOpen, setIsSubmitDialogOpen] = useState(false);
    function getCurrentQuery() {
        return createDefaultSmartHardwareMallQuery(new URLSearchParams(location.search), pageMode);
    }
    useEffect(() => {
        const controller = new AbortController();
        const query = getCurrentQuery();
        setOverview(null);
        setDetail(null);
        setRoomGroups([]);
        setPaymentGroups([]);
        setContactProduct(null);
        setIsRoomDialogOpen(false);
        setIsPaymentDialogOpen(false);
        setIsAgreementChecked(false);
        setIsSubmitDialogOpen(false);
        setErrorMessage('');
        setIsLoading(true);
        setFeedback(pageMode === 'mall' ? '智能硬件商城数据加载中' : '智能硬件详情加载中');
        const handleError = (error) => {
            if (error instanceof DOMException && error.name === 'AbortError')
                return;
            const message = error instanceof Error
                ? error.message
                : pageMode === 'mall'
                    ? '智能硬件商城数据加载失败，请稍后重试'
                    : '智能硬件商城详情加载失败，请稍后重试';
            setErrorMessage(message);
            setFeedback(message);
        };
        if (pageMode === 'mall') {
            void fetchSmartHardwareMallOverview(query, controller.signal)
                .then((result) => {
                setOverview(result);
                setFeedback(result.emptyState ? '当前门店暂无可采购的智能硬件商品' : '智能硬件商城数据已就绪');
            })
                .catch(handleError)
                .finally(() => {
                if (!controller.signal.aborted) {
                    setIsLoading(false);
                }
            });
        }
        else {
            void fetchSmartHardwareMallDetail(query, controller.signal)
                .then((result) => {
                setDetail(result);
                setFeedback('智能硬件详情已就绪');
            })
                .catch(handleError)
                .finally(() => {
                if (!controller.signal.aborted) {
                    setIsLoading(false);
                }
            });
        }
        return () => controller.abort();
    }, [location.pathname, location.search, pageMode]);
    async function openRoomDialog() {
        if (isRoomDialogOpen || isLoading)
            return;
        try {
            const groups = await fetchSmartHardwareApplicableRooms(getCurrentQuery());
            setRoomGroups(groups);
            setIsRoomDialogOpen(true);
            setFeedback('已展开适用房型');
        }
        catch (error) {
            setFeedback(error instanceof Error ? error.message : '适用房型加载失败，请稍后重试');
        }
    }
    async function openPaymentDialog() {
        if (isPaymentDialogOpen || isLoading)
            return;
        try {
            const groups = await fetchSmartHardwarePaymentGroups(getCurrentQuery());
            setPaymentGroups(groups);
            setIsPaymentDialogOpen(true);
            setFeedback('已展开支付方式');
        }
        catch (error) {
            setFeedback(error instanceof Error ? error.message : '支付方式加载失败，请稍后重试');
        }
    }
    function openContactDialog(product) {
        setContactProduct(product);
        setFeedback(`已选择 ${product.name} 咨询方案`);
    }
    function confirmContactTask() {
        if (!contactProduct)
            return;
        setFeedback(`咨询任务已创建：${contactProduct.name}`);
        setContactProduct(null);
    }
    function handlePurchaseEntry(product) {
        navigate(`/smartHotel/smartHardware/mall/detail?productId=${product.id}`);
    }
    function handleRetry() {
        navigate(location.pathname, { replace: true });
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
    const viewState = errorMessage ? 'error' : overview?.emptyState ? 'empty' : isLoading ? 'loading' : 'ready';
    return (_jsxs("div", { className: "smart-hardware-mall-page", "data-provider": provider, "data-page": pageMode, "data-state": viewState, children: [pageMode === 'mall' ? (_jsx(MallView, { overview: overview, isLoading: isLoading, errorMessage: errorMessage, feedback: feedback, onRetry: handleRetry, onContact: openContactDialog, onBuy: handlePurchaseEntry, onNavigate: navigate })) : (_jsx(DetailView, { detail: detail, isLoading: isLoading, errorMessage: errorMessage, feedback: feedback, isAgreementChecked: isAgreementChecked, onAgreementChange: setIsAgreementChecked, onOpenRooms: openRoomDialog, onOpenPayments: openPaymentDialog, onBack: () => navigate('/smartHotel/smartHardware/mall'), onRetry: handleRetry, onSubmit: handleSubmitPurchase })), _jsx(StatusToast, { message: feedback }), contactProduct ? (_jsx(ContactDialog, { product: contactProduct, onClose: () => setContactProduct(null), onConfirm: confirmContactTask })) : null, isRoomDialogOpen ? (_jsx(DetailDialog, { title: "\u9002\u7528\u623F\u578B", closeLabel: "\u5173\u95ED\u9002\u7528\u623F\u578B", onClose: () => setIsRoomDialogOpen(false), children: _jsx("div", { className: "smart-hardware-dialog-list", children: roomGroups.map((group) => (_jsxs("section", { className: "smart-hardware-room-group", children: [_jsx("h3", { children: group.roomCategoryName }), _jsx("p", { children: group.rooms.join('、') })] }, group.roomCategoryId))) }) })) : null, isPaymentDialogOpen ? (_jsx(DetailDialog, { title: "\u652F\u4ED8\u65B9\u5F0F", closeLabel: "\u5173\u95ED\u652F\u4ED8\u65B9\u5F0F", onClose: () => setIsPaymentDialogOpen(false), children: _jsx("div", { className: "smart-hardware-dialog-list", children: paymentGroups.map((group) => (_jsxs("section", { className: "smart-hardware-payment-group", children: [_jsx("h3", { children: group.groupTypeName }), _jsx("p", { children: group.paymentTypes.join('、') })] }, group.groupType))) }) })) : null, isSubmitDialogOpen && detail ? (_jsx(SubmitDialog, { productName: detail.productName, onClose: () => setIsSubmitDialogOpen(false), onNavigate: () => navigate(detail.routeAfterSubmit) })) : null] }));
}
function MallView({ overview, isLoading, errorMessage, feedback, onRetry, onContact, onBuy, onNavigate, }) {
    return (_jsxs(_Fragment, { children: [_jsx("section", { className: "smart-hardware-hero", children: _jsxs("div", { className: "smart-hardware-hero__copy", children: [_jsx("p", { className: "smart-hardware-hero__eyebrow", children: "\u6700\u8FD1\u540C\u6B65" }), _jsx("h1", { children: overview?.heroTitle ?? '智慧酒店一站式部署' }), _jsx("span", { children: overview?.requestedAtLabel ?? '最近同步：2026-05-19 16:03' }), _jsx("strong", { children: overview?.heroDescription ?? '助力酒店高效运营' })] }) }), _jsxs("section", { className: "smart-hardware-card-shell", children: [_jsxs("header", { className: "smart-hardware-section-head", children: [_jsxs("div", { children: [_jsx("h2", { children: "\u786C\u4EF6\u5546\u54C1" }), _jsx("p", { children: "\u5F53\u524D\u6309\u771F\u5B9E\u53D6\u8BC1\u5951\u7EA6\u62C6\u5206\u4E3A\u5B98\u65B9\u786C\u4EF6\u4E0E\u7B2C\u4E09\u65B9\u54A8\u8BE2\u786C\u4EF6\uFF0C\u540E\u7EED\u53EF\u76F4\u63A5\u5207\u6362\u5230 API provider\u3002" })] }), _jsx("span", { className: "smart-hardware-feedback-inline", children: feedback })] }), isLoading ? _jsx("div", { className: "smart-hardware-loading", children: "\u667A\u80FD\u786C\u4EF6\u5546\u57CE\u6570\u636E\u52A0\u8F7D\u4E2D" }) : null, errorMessage ? (_jsxs("div", { className: "smart-hardware-alert", role: "alert", "aria-label": "\u667A\u80FD\u786C\u4EF6\u5546\u57CE\u52A0\u8F7D\u5931\u8D25", children: [_jsx("strong", { children: "\u667A\u80FD\u786C\u4EF6\u5546\u57CE\u52A0\u8F7D\u5931\u8D25" }), _jsx("span", { children: errorMessage }), _jsx("button", { type: "button", onClick: onRetry, children: "\u91CD\u65B0\u52A0\u8F7D" })] })) : null, !isLoading && !errorMessage && overview?.emptyState ? (_jsxs("section", { className: "smart-hardware-empty", "aria-label": "\u667A\u80FD\u786C\u4EF6\u5546\u57CE\u7A7A\u72B6\u6001", children: [_jsx("strong", { children: overview.emptyState.title }), _jsx("p", { children: overview.emptyState.description }), _jsx("button", { type: "button", onClick: () => onNavigate(overview.emptyState.actionPath), children: overview.emptyState.actionLabel })] })) : null, !isLoading && !errorMessage && overview && !overview.emptyState ? (_jsx("section", { className: "smart-hardware-products", "aria-label": "\u667A\u80FD\u786C\u4EF6\u5546\u57CE\u5546\u54C1\u5217\u8868", children: overview.products.map((product) => (_jsxs("article", { className: "smart-hardware-product-card", children: [_jsx("div", { className: "smart-hardware-product-card__tag", children: product.tag }), _jsxs("div", { className: "smart-hardware-product-card__content", children: [_jsx("div", { className: "smart-hardware-product-card__image", children: _jsx("img", { src: product.image, alt: product.name }) }), _jsxs("div", { className: "smart-hardware-product-card__info", children: [_jsx("strong", { children: product.name }), _jsx("p", { children: product.description }), _jsx("span", { children: product.priceLabel })] })] }), _jsx("button", { type: "button", onClick: () => (product.action === 'buy' ? onBuy(product) : onContact(product)), children: product.action === 'buy' ? '立即购买' : '联系客服' })] }, product.id))) })) : null] }), _jsxs("section", { className: "smart-hardware-shortcuts", children: [_jsx("header", { className: "smart-hardware-section-head", children: _jsxs("div", { children: [_jsx("h2", { children: "\u5FEB\u6377\u5165\u53E3" }), _jsx("p", { children: "\u4ECE\u5546\u57CE\u76F4\u63A5\u627F\u63A5\u5230\u667A\u6167\u9152\u5E97\u5DF2\u6709\u9875\u9762\uFF0C\u907F\u514D\u505C\u7559\u5728\u65E0\u54CD\u5E94\u6309\u94AE\u3002" })] }) }), _jsx("div", { className: "smart-hardware-shortcuts__grid", children: (overview?.quickEntries ?? []).map((entry) => (_jsxs("button", { type: "button", className: "smart-hardware-shortcut", onClick: () => onNavigate(entry.path), children: [_jsx("strong", { children: entry.label }), _jsx("span", { children: entry.description })] }, entry.id))) })] })] }));
}
function DetailView({ detail, isLoading, errorMessage, feedback, isAgreementChecked, onAgreementChange, onOpenRooms, onOpenPayments, onBack, onRetry, onSubmit, }) {
    return (_jsxs("section", { className: "smart-hardware-detail-shell", children: [_jsxs("header", { className: "smart-hardware-detail-head", children: [_jsx("button", { type: "button", className: "smart-hardware-back-button", onClick: onBack, children: "\u8FD4\u56DE\u5546\u57CE" }), _jsxs("div", { children: [_jsx("span", { children: detail?.requestedAtLabel ?? '最近同步：2026-05-19 16:03' }), _jsx("h1", { children: detail?.productName ?? '门卡管理系统' }), _jsx("p", { children: detail?.productDescription ?? '已按真实取证契约同步适用房型与支付方式，可直接发起购买申请。' })] })] }), isLoading ? _jsx("div", { className: "smart-hardware-loading", children: "\u667A\u80FD\u786C\u4EF6\u8BE6\u60C5\u52A0\u8F7D\u4E2D" }) : null, errorMessage ? (_jsxs("div", { className: "smart-hardware-alert", role: "alert", "aria-label": "\u667A\u80FD\u786C\u4EF6\u5546\u57CE\u52A0\u8F7D\u5931\u8D25", children: [_jsx("strong", { children: "\u667A\u80FD\u786C\u4EF6\u5546\u57CE\u52A0\u8F7D\u5931\u8D25" }), _jsx("span", { children: errorMessage }), _jsx("button", { type: "button", onClick: onRetry, children: "\u91CD\u65B0\u52A0\u8F7D" })] })) : null, !isLoading && !errorMessage && detail ? (_jsxs("div", { className: "smart-hardware-detail-layout", children: [_jsxs("section", { className: "smart-hardware-detail-card", children: [_jsxs("div", { className: "smart-hardware-detail-row", children: [_jsx("span", { children: "\u8D2D\u4E70\u65F6\u957F" }), _jsx("strong", { children: detail.purchaseTermLabel })] }), _jsxs("div", { className: "smart-hardware-detail-row", children: [_jsx("span", { children: "\u8D2D\u4E70\u65B9" }), _jsx("strong", { children: detail.buyerName })] }), _jsxs("div", { className: "smart-hardware-detail-row", children: [_jsx("span", { children: "\u9002\u7528\u623F\u578B" }), _jsxs("div", { className: "smart-hardware-detail-row__content", children: [_jsx("strong", { children: detail.roomSummary }), _jsx("button", { type: "button", onClick: onOpenRooms, children: "\u67E5\u770B\u9002\u7528\u623F\u578B" })] })] }), _jsxs("div", { className: "smart-hardware-detail-row", children: [_jsx("span", { children: "\u652F\u4ED8\u65B9\u5F0F" }), _jsxs("div", { className: "smart-hardware-detail-row__content", children: [_jsx("strong", { children: detail.paymentSummary }), _jsx("button", { type: "button", onClick: onOpenPayments, children: "\u67E5\u770B\u652F\u4ED8\u65B9\u5F0F" })] })] }), _jsxs("div", { className: "smart-hardware-detail-row smart-hardware-detail-row--total", children: [_jsx("span", { children: "\u603B\u8D39\u7528" }), _jsx("strong", { children: detail.totalAmountLabel })] }), _jsxs("label", { className: "smart-hardware-agreement-row", children: [_jsx("input", { type: "checkbox", "aria-label": "\u8D2D\u4E70\u534F\u8BAE", checked: isAgreementChecked, onChange: (event) => onAgreementChange(event.target.checked) }), _jsx("span", { children: detail.agreementLabel })] }), _jsx("p", { className: "smart-hardware-detail-notice", children: detail.purchaseNotice }), _jsx("div", { className: "smart-hardware-detail-actions", children: _jsx("button", { type: "button", className: "smart-hardware-primary-button", onClick: onSubmit, children: "\u63D0\u4EA4\u8D2D\u4E70\u7533\u8BF7" }) })] }), _jsxs("aside", { className: "smart-hardware-detail-aside", children: [_jsx("h2", { children: "\u63D0\u4EA4\u6D41\u7A0B" }), _jsxs("ol", { children: [_jsx("li", { children: "\u786E\u8BA4\u9002\u7528\u623F\u578B\u4E0E\u91C7\u8D2D\u5468\u671F\u3002" }), _jsx("li", { children: "\u6838\u5BF9\u652F\u4ED8\u65B9\u5F0F\u4E0E\u91D1\u989D\u5F52\u5C5E\u3002" }), _jsx("li", { children: "\u63D0\u4EA4\u540E\u7531\u667A\u6167\u9152\u5E97\u4E13\u5BB6\u63A5\u7EED\u95E8\u9501\u4E0E\u623F\u5361\u914D\u7F6E\u3002" })] }), _jsx("div", { className: "smart-hardware-feedback-inline", children: feedback })] })] })) : null] }));
}
function ContactDialog({ product, onClose, onConfirm, }) {
    return (_jsx(DetailDialog, { title: "\u8054\u7CFB\u5BA2\u670D", closeLabel: "\u5173\u95ED\u8054\u7CFB\u5BA2\u670D", onClose: onClose, children: _jsxs("div", { className: "smart-hardware-contact-body", children: [_jsx("h3", { children: product.name }), _jsx("p", { children: "\u5C06\u4E3A\u5F53\u524D\u95E8\u5E97\u521B\u5EFA\u786C\u4EF6\u54A8\u8BE2\u4EFB\u52A1\uFF0C\u5E76\u540C\u6B65\u5230\u667A\u6167\u9152\u5E97\u4E13\u5BB6\u8DDF\u8FDB\u3002" }), _jsxs("div", { className: "smart-hardware-contact-actions", children: [_jsx("button", { type: "button", onClick: onClose, children: "\u53D6\u6D88" }), _jsx("button", { type: "button", className: "smart-hardware-primary-button", onClick: onConfirm, children: "\u521B\u5EFA\u54A8\u8BE2\u4EFB\u52A1" })] })] }) }));
}
function SubmitDialog({ productName, onClose, onNavigate, }) {
    return (_jsx(DetailDialog, { title: "\u8D2D\u4E70\u7533\u8BF7\u5DF2\u63D0\u4EA4", closeLabel: "\u5173\u95ED\u8D2D\u4E70\u7ED3\u679C", onClose: onClose, children: _jsxs("div", { className: "smart-hardware-contact-body", children: [_jsx("h3", { children: productName }), _jsx("p", { children: "\u91C7\u8D2D\u4EFB\u52A1\u5DF2\u8FDB\u5165\u667A\u6167\u9152\u5E97\u8DDF\u8FDB\u961F\u5217\uFF0C\u53EF\u7EE7\u7EED\u524D\u5F80\u667A\u80FD\u95E8\u9501\u9875\u9762\u5B8C\u6210\u540E\u7EED\u914D\u7F6E\u3002" }), _jsxs("div", { className: "smart-hardware-contact-actions", children: [_jsx("button", { type: "button", onClick: onClose, children: "\u7559\u5728\u5F53\u524D\u9875" }), _jsx("button", { type: "button", className: "smart-hardware-primary-button", onClick: onNavigate, children: "\u524D\u5F80\u667A\u80FD\u95E8\u9501" })] })] }) }));
}
function DetailDialog({ title, closeLabel, onClose, children, }) {
    return (_jsx("div", { className: "smart-hardware-dialog-backdrop", children: _jsxs("section", { className: "smart-hardware-dialog", role: "dialog", "aria-modal": "true", "aria-label": title, children: [_jsxs("header", { className: "smart-hardware-dialog__header", children: [_jsx("h2", { children: title }), _jsx("button", { type: "button", "aria-label": closeLabel, onClick: onClose, children: "\u00D7" })] }), children] }) }));
}
function StatusToast({ message }) {
    return (_jsx("div", { className: "smart-hardware-status", role: "status", "aria-live": "polite", "aria-label": "\u667A\u80FD\u786C\u4EF6\u5546\u57CE\u64CD\u4F5C\u53CD\u9988", children: message }));
}
