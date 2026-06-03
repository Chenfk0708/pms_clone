import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { fetchCustomerDetail } from '../services/customerDetail';
import './CustomerDetailPage.css';
const tabs = [
    { key: 'profile', label: '客户概况' },
    { key: 'member', label: '会员信息' },
    { key: 'orders', label: '交易订单' },
    { key: 'coupons', label: '优惠券明细' },
];
export function CustomerDetailPage() {
    const [searchParams] = useSearchParams();
    const [detail, setDetail] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [activeTab, setActiveTab] = useState('profile');
    const [followDialogOpen, setFollowDialogOpen] = useState(false);
    const [followContent, setFollowContent] = useState('');
    const customerId = searchParams.get('id') ?? '';
    useEffect(() => {
        const controller = new AbortController();
        async function load() {
            setLoading(true);
            setError('');
            try {
                const nextDetail = await fetchCustomerDetail(customerId, controller.signal);
                setDetail(nextDetail);
            }
            catch (reason) {
                if (reason instanceof DOMException && reason.name === 'AbortError')
                    return;
                setError(reason instanceof Error ? reason.message : '客户详情加载失败');
            }
            finally {
                if (!controller.signal.aborted)
                    setLoading(false);
            }
        }
        void load();
        return () => controller.abort();
    }, [customerId]);
    const tabContent = useMemo(() => {
        if (activeTab === 'profile') {
            return _jsx(ProfileTab, { detail: detail, onOpenFollowDialog: () => setFollowDialogOpen(true) });
        }
        const currentLabel = tabs.find((item) => item.key === activeTab)?.label ?? '详情';
        return (_jsxs("section", { className: "customer-detail-placeholder", "aria-label": `${currentLabel}内容`, children: [_jsx("strong", { children: currentLabel }), _jsx("p", { children: "\u8BE5\u9875\u7B7E\u5185\u5BB9\u5148\u6309\u76EE\u6807\u7AD9\u5E03\u5C40\u9884\u7559\uFF0C\u540E\u7EED\u6309\u540C\u6837\u98CE\u683C\u7EE7\u7EED\u8865\u9F50\u3002" })] }));
    }, [activeTab, detail]);
    return (_jsxs("div", { className: "customer-detail-page", children: [_jsxs("div", { className: "customer-detail-breadcrumb", children: [_jsx(Link, { to: "/customer/list", children: "\u5BA2\u6237\u5217\u8868" }), _jsx("span", { children: "/" }), _jsx("strong", { children: "\u5BA2\u6237\u8BE6\u60C5" })] }), _jsxs("section", { className: "customer-detail-shell", children: [_jsx("pre", { hidden: true, "data-testid": "customer-detail-contract", "data-provider": detail?.provider ?? 'mock', "data-endpoint": detail?.endpoint ?? 'static-customer-detail', children: detail ? JSON.stringify(detail.requestBody) : '{}' }), _jsx("nav", { className: "customer-detail-tabs", "aria-label": "\u5BA2\u6237\u8BE6\u60C5\u6807\u7B7E", children: tabs.map((tab) => (_jsx("button", { type: "button", className: activeTab === tab.key ? 'is-active' : '', onClick: () => setActiveTab(tab.key), children: tab.label }, tab.key))) }), loading ? (_jsx("section", { className: "customer-detail-state", "aria-label": "\u5BA2\u6237\u8BE6\u60C5\u52A0\u8F7D\u72B6\u6001", children: _jsx("strong", { children: "\u6B63\u5728\u52A0\u8F7D\u5BA2\u6237\u8BE6\u60C5" }) })) : null, error ? (_jsxs("section", { className: "customer-detail-state customer-detail-state--error", role: "alert", "aria-label": "\u5BA2\u6237\u8BE6\u60C5\u9519\u8BEF", children: [_jsx("strong", { children: "\u5BA2\u6237\u8BE6\u60C5\u52A0\u8F7D\u5931\u8D25" }), _jsx("p", { children: error })] })) : null, !loading && !error ? tabContent : null] }), followDialogOpen ? (_jsx("div", { className: "customer-detail-modal-backdrop", children: _jsxs("section", { className: "customer-detail-modal", role: "dialog", "aria-modal": "true", "aria-label": "\u6DFB\u52A0\u8DDF\u8FDB", children: [_jsxs("header", { children: [_jsx("strong", { children: "\u6DFB\u52A0\u8DDF\u8FDB" }), _jsx("button", { type: "button", "aria-label": "\u00D7", onClick: () => setFollowDialogOpen(false), children: "\u00D7" })] }), _jsx("div", { className: "customer-detail-modal__body", children: _jsxs("label", { className: "customer-detail-modal-field", children: [_jsxs("span", { children: [_jsx("b", { "aria-hidden": "true", children: "*" }), "\u8DDF\u8FDB\u8BB0\u5F55"] }), _jsx("textarea", { placeholder: "\u8BF7\u8F93\u5165\u8DDF\u8FDB\u8BB0\u5F55", value: followContent, onChange: (event) => setFollowContent(event.target.value) })] }) }), _jsxs("footer", { children: [_jsx("button", { type: "button", onClick: () => setFollowDialogOpen(false), children: "\u53D6\u6D88" }), _jsx("button", { type: "button", className: "is-primary", onClick: () => setFollowDialogOpen(false), children: "\u786E\u5B9A" })] })] }) })) : null] }));
}
function ProfileTab({ detail, onOpenFollowDialog }) {
    if (!detail)
        return null;
    return (_jsxs("div", { className: "customer-detail-overview", children: [_jsxs("section", { className: "customer-detail-summary", "aria-label": "\u5BA2\u6237\u6458\u8981", children: [_jsxs("div", { className: "customer-detail-summary__main", children: [_jsx("div", { className: "customer-detail-avatar", "aria-hidden": "true", children: detail.avatarText }), _jsxs("div", { className: "customer-detail-identity", children: [_jsxs("div", { className: "customer-detail-name-row", children: [_jsx("strong", { children: detail.name }), _jsx("span", { children: detail.mobile })] }), _jsxs("div", { className: "customer-detail-badges", children: [_jsx("span", { children: "\u5BA2\u6237" }), _jsxs("span", { children: ["\u4F1A\u5458\uFF1A", detail.memberLevel] })] }), _jsxs("div", { className: "customer-detail-meta", children: [_jsxs("span", { children: ["\u5BA2\u6237\u7F16\u53F7\uFF1A", detail.customerNo] }), _jsxs("span", { children: ["\u6210\u4E3A\u5BA2\u6237\u65F6\u95F4\uFF1A", detail.becomeCustomerTime] }), _jsxs("span", { children: ["\u5BA2\u6237\u72B6\u6001\uFF1A", detail.customerStatus] }), _jsxs("span", { children: ["\u5173\u6CE8\u516C\u4F17\u53F7\u65F6\u95F4\uFF1A", detail.followPublicAccountTime] })] }), _jsx("div", { className: "customer-detail-meta", children: _jsxs("span", { children: ["\u5BA2\u6237\u6E20\u9053\uFF1A", detail.channelText] }) }), _jsxs("div", { className: "customer-detail-tags", children: [_jsx("span", { children: "\u5BA2\u6237\u6807\u7B7E\uFF1A" }), detail.tags.length ? detail.tags.map((tag) => _jsx("em", { children: tag }, tag)) : _jsx("i", { children: "-" })] })] })] }), _jsxs("div", { className: "customer-detail-actions", children: [_jsx("button", { type: "button", children: "\u9001\u4F18\u60E0\u5238" }), _jsx("button", { type: "button", children: "\u4FEE\u6539\u4F1A\u5458\u7B49\u7EA7" }), _jsx("button", { type: "button", children: "\u4FEE\u6539\u6807\u7B7E" })] })] }), _jsxs("section", { className: "customer-detail-block", "aria-label": "\u57FA\u7840\u4FE1\u606F", children: [_jsxs("header", { children: [_jsx("strong", { children: "\u57FA\u7840\u4FE1\u606F" }), _jsx("button", { type: "button", className: "is-primary", onClick: onOpenFollowDialog, children: "\u7F16\u8F91" })] }), _jsx("div", { className: "customer-detail-basic-grid", children: detail.basicInfo.map((item) => (_jsxs("div", { className: "customer-detail-basic-item", children: [_jsxs("span", { children: [item.label, "\uFF1A"] }), _jsx("strong", { children: item.value })] }, item.label))) })] }), _jsxs("section", { className: "customer-detail-block", "aria-label": "\u8DDF\u8FDB\u8BB0\u5F55", children: [_jsxs("header", { children: [_jsx("strong", { children: "\u8DDF\u8FDB\u8BB0\u5F55" }), _jsx("button", { type: "button", className: "customer-detail-link-button", onClick: onOpenFollowDialog, children: "\u6DFB\u52A0\u8DDF\u8FDB" })] }), _jsxs("div", { className: "customer-detail-follow-table", children: [_jsxs("div", { className: "customer-detail-follow-head", children: [_jsx("span", { children: "\u8DDF\u8FDB\u4EBA" }), _jsx("span", { children: "\u8DDF\u8FDB\u65F6\u95F4" }), _jsx("span", { children: "\u8DDF\u8FDB\u8BB0\u5F55" })] }), detail.followRecords.length ? (detail.followRecords.map((record) => (_jsxs("div", { className: "customer-detail-follow-row", children: [_jsx("span", { children: record.owner }), _jsx("span", { children: record.time }), _jsx("span", { children: record.content })] }, record.id)))) : (_jsx("div", { className: "customer-detail-follow-empty", children: "\u6682\u65E0\u6570\u636E" }))] })] }), _jsxs("section", { className: "customer-detail-block", "aria-label": "\u8D44\u4EA7\u4FE1\u606F", children: [_jsx("header", { children: _jsx("strong", { children: "\u8D44\u4EA7\u4FE1\u606F" }) }), _jsx("div", { className: "customer-detail-assets", children: detail.assetCards.map((card) => (_jsxs("article", { className: "customer-detail-asset-card", children: [_jsx("strong", { children: card.title }), card.lines.length ? (_jsx("div", { className: "customer-detail-asset-lines", children: card.lines.map((line) => (_jsx("span", { children: line }, line))) })) : (_jsx("div", { className: "customer-detail-asset-placeholder", children: card.placeholder })), card.action ? _jsx("button", { type: "button", children: card.action }) : null] }, card.title))) })] }), _jsxs("section", { className: "customer-detail-block", "aria-label": "\u4EA4\u6613\u4FE1\u606F", children: [_jsx("header", { children: _jsx("strong", { children: "\u4EA4\u6613\u4FE1\u606F" }) }), _jsx("div", { className: "customer-detail-trade-grid", children: detail.tradeInfo.map((item) => (_jsxs("div", { className: "customer-detail-trade-item", children: [_jsxs("span", { children: [item.label, "\uFF1A"] }), _jsx("strong", { children: item.value })] }, item.label))) })] })] }));
}
