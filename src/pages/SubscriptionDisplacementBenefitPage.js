import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { NavLink } from 'react-router-dom';
import { useState } from 'react';
import './SubscriptionDisplacementBenefitPage.css';
const sideLinks = [
    { label: '我的权益', path: '/version/myBenefit' },
    { label: '置换权益', path: '/version/displacementBenefit' },
    { label: '版本订阅', path: '/version/subscriptionCenter' },
    { label: '应用订阅', path: '/version/applicationPayment' },
    { label: '路客商城', path: '/version/localsMall' },
];
const detailColumns = [
    '序号',
    '订单号/渠道单号',
    '置换月份',
    '渠道',
    '房型',
    '房间',
    '联系人',
    '手机号',
    '入住状态',
    '结算状态',
    '入离日期',
    '结算日期',
    '结算金额',
    '置换金额',
];
const summaryCards = [
    { label: '待置换金额:', value: '-' },
    { label: '已置换金额:', value: '-' },
];
export function SubscriptionDisplacementBenefitPage() {
    const [showDialog, setShowDialog] = useState(false);
    return (_jsxs("div", { className: "subscription-displacement-page", children: [_jsxs("aside", { className: "subscription-displacement-sidebar", "aria-label": "\u8BA2\u9605\u4E2D\u5FC3\u4FA7\u680F", children: [_jsx("div", { className: "subscription-displacement-sidebar__root", children: "\u8BA2\u9605\u4E2D\u5FC3" }), _jsx("nav", { "aria-label": "\u6743\u76CA\u4E0E\u8BA2\u9605\u4FA7\u680F", children: sideLinks.map((item) => (_jsx(NavLink, { to: item.path, className: ({ isActive }) => `subscription-displacement-link${isActive ? ' is-active' : ''}`, children: item.label }, item.path))) }), _jsx("span", { className: "subscription-displacement-build", children: "\u7248\u672C\u53F7\uFF1Av4.10.7" })] }), _jsx("main", { className: "subscription-displacement-main", children: _jsxs("div", { className: "subscription-displacement-content", children: [_jsx("h1", { className: "sr-only-heading", children: "\u7F6E\u6362\u6743\u76CA" }), _jsxs("section", { className: "subscription-displacement-overview", "aria-label": "\u7F6E\u6362\u6982\u51B5", children: [_jsxs("div", { className: "subscription-displacement-section-title", children: [_jsx("h2", { children: "\u7F6E\u6362\u6982\u51B5" }), _jsx("button", { type: "button", className: "subscription-displacement-primary", onClick: () => setShowDialog(true), children: "\u7533\u8BF7\u5C3E\u623F\u7F6E\u6362" })] }), _jsx("div", { className: "subscription-displacement-summary", children: summaryCards.map((card) => (_jsxs("article", { className: "subscription-displacement-card", children: [_jsx("span", { children: card.label }), _jsx("strong", { children: card.value })] }, card.label))) })] }), _jsxs("section", { className: "subscription-displacement-detail", "aria-label": "\u7F6E\u6362\u660E\u7EC6", children: [_jsxs("div", { className: "subscription-displacement-detail__title", children: [_jsx("h2", { children: "\u7F6E\u6362\u660E\u7EC6" }), _jsx("span", { "aria-hidden": "true", children: "?" })] }), _jsxs("div", { className: "subscription-displacement-filter", role: "group", "aria-label": "\u65E5\u671F\u7B5B\u9009", children: [_jsx("span", { children: "\u65E5\u671F\u7B5B\u9009" }), _jsx("button", { type: "button", className: "is-active", "aria-label": "\u65E5\u671F\u7B5B\u9009 \u5168\u90E8", children: "\u5168\u90E8" }), _jsxs("div", { className: "subscription-displacement-date-range", role: "group", "aria-label": "\u65E5\u671F\u8303\u56F4", children: [_jsx("input", { placeholder: "\u5F00\u59CB\u65E5\u671F", readOnly: true }), _jsx("em", { "aria-hidden": "true", children: "~" }), _jsx("input", { placeholder: "\u7ED3\u675F\u65E5\u671F", readOnly: true })] })] }), _jsxs("div", { className: "subscription-displacement-table", "aria-label": "\u7F6E\u6362\u660E\u7EC6\u8868\u683C", children: [_jsx("div", { className: "subscription-displacement-table__head", children: detailColumns.map((column) => (_jsx("div", { children: column }, column))) }), _jsx("div", { className: "subscription-displacement-table__body", children: _jsxs("div", { className: "subscription-displacement-empty", children: [_jsx("span", { "aria-hidden": "true" }), _jsx("p", { children: "\u6682\u65E0\u6570\u636E" })] }) })] })] })] }) }), showDialog ? (_jsx("div", { className: "subscription-displacement-modal", role: "presentation", children: _jsxs("div", { className: "subscription-displacement-dialog", role: "dialog", "aria-modal": "true", "aria-label": "\u5C3E\u623F\u7F6E\u6362", children: [_jsx("button", { type: "button", className: "subscription-displacement-dialog__close", "aria-label": "\u5173\u95ED\u5C3E\u623F\u7F6E\u6362", onClick: () => setShowDialog(false), children: "\u00D7" }), _jsx("h2", { children: "\u5C3E\u623F\u7F6E\u6362" }), _jsx("div", { className: "subscription-displacement-qr", "aria-label": "\u5C3E\u623F\u7F6E\u6362\u4E8C\u7EF4\u7801", children: _jsx("span", {}) }), _jsx("p", { children: "\u8054\u7CFB\u4E1A\u52A1\u7ECF\u7406\uFF0C\u8FDB\u884C\u5C3E\u623F\u7F6E\u6362" }), _jsx("button", { type: "button", className: "subscription-displacement-primary", onClick: () => setShowDialog(false), children: "\u6211\u77E5\u9053\u4E86" })] }) })) : null] }));
}
