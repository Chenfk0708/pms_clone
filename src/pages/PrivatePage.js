import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useLocation, useNavigate } from 'react-router-dom';
import { useMemo, useState } from 'react';
import { loadPrivateChannel } from '../services/privateChannel';
import './PrivatePage.css';
function ChannelLogo({ name }) {
    if (name === '企业微信') {
        return (_jsxs("div", { className: "private-logo private-logo--wecom", "aria-hidden": "true", children: [_jsx("span", {}), _jsx("i", {}), _jsx("b", {})] }));
    }
    if (name === '公众号') {
        return (_jsxs("div", { className: "private-logo private-logo--official", "aria-hidden": "true", children: [_jsx("span", {}), _jsx("i", {})] }));
    }
    return (_jsx("div", { className: "private-logo private-logo--program", "aria-hidden": "true", children: _jsx("strong", { children: "\u5C0F" }) }));
}
function PrivateActionStatus({ message }) {
    return (_jsx("div", { className: "private-action-status", role: "status", "aria-label": "\u79C1\u57DF\u6E20\u9053\u64CD\u4F5C\u53CD\u9988", children: message }));
}
function DefaultPrivatePage({ data, onAction }) {
    const navigate = useNavigate();
    function openChannel(card) {
        if (card.targetPath) {
            navigate(card.targetPath);
            return;
        }
        onAction(card);
    }
    return (_jsxs("div", { className: "private-channel-page", children: [_jsx("h1", { className: "sr-only-heading", children: "\u79C1\u57DF" }), _jsxs("section", { className: "private-channel-panel", children: [_jsx("div", { className: "private-section-title", children: _jsx("h2", { children: "\u672A\u76F4\u8FDE\u6E20\u9053" }) }), data.cards.length === 0 ? (_jsx("section", { className: "private-empty-state", role: "status", "aria-label": "\u79C1\u57DF\u6E20\u9053\u7A7A\u6001", children: "\u6682\u65E0\u7B26\u5408\u5F53\u524D\u6761\u4EF6\u7684\u79C1\u57DF\u6E20\u9053\uFF0C\u8BF7\u8C03\u6574\u7B5B\u9009\u6761\u4EF6\u540E\u5237\u65B0\u3002" })) : (_jsx("div", { className: "private-card-grid", children: data.cards.map((card) => (_jsxs("article", { className: "private-card", "aria-label": card.name, children: [_jsxs("div", { children: [_jsx("h3", { children: card.name }), _jsx("p", { children: card.description }), _jsx("button", { type: "button", className: `private-button ${card.actionCode !== 'subscribe_program' ? 'private-button--primary' : ''}`, onClick: () => openChannel(card), children: card.actionText })] }), _jsx(ChannelLogo, { name: card.name })] }, card.id))) }))] })] }));
}
function EnterpriseDetailPage({ data, onAction }) {
    const navigate = useNavigate();
    const actionCard = data.cards.find((card) => card.actionCode === 'connect_wecom') ?? data.cards[0];
    return (_jsxs("div", { className: "private-channel-page", children: [_jsx("h1", { className: "sr-only-heading", children: "\u79C1\u57DF" }), _jsxs("section", { className: "private-detail-panel", children: [_jsxs("div", { className: "private-breadcrumb", children: [_jsx("button", { type: "button", onClick: () => navigate('/channels/private'), children: "\u79C1\u57DF" }), _jsx("span", { children: "/" }), _jsx("strong", { children: "\u6E20\u9053\u8BE6\u60C5" })] }), _jsxs("header", { className: "private-enterprise-head", children: [_jsx(ChannelLogo, { name: "\u4F01\u4E1A\u5FAE\u4FE1" }), _jsxs("div", { children: [_jsx("h2", { children: data.enterprise.name }), _jsx("span", { children: data.enterprise.trialText }), _jsx("em", { children: data.enterprise.statusText })] }), _jsx("button", { type: "button", className: "private-button private-button--primary", onClick: () => actionCard && onAction(actionCard), children: data.enterprise.actionText })] }), _jsxs("section", { className: "private-detail-copy", children: [_jsx("h3", { children: "\u914D\u7F6E\u4F01\u4E1A\u5FAE\u4FE1\u540E\uFF0C\u60A8\u53EF\u4EE5\u83B7\u5F97" }), _jsx("ol", { children: data.enterprise.benefits.map((item) => (_jsx("li", { children: item }, item))) }), _jsx("p", { children: data.enterprise.description })] })] })] }));
}
function OfficialAuthorizationPage({ data, onAction }) {
    const navigate = useNavigate();
    const actionCard = data.cards.find((card) => card.actionCode === 'authorize_official') ?? data.cards[0];
    return (_jsxs("div", { className: "private-channel-page", children: [_jsx("h1", { className: "sr-only-heading", children: "\u79C1\u57DF" }), _jsxs("section", { className: "private-detail-panel", children: [_jsxs("div", { className: "private-breadcrumb", children: [_jsx("button", { type: "button", onClick: () => navigate('/channels/private'), children: "\u79C1\u57DF" }), _jsx("span", { children: "/" }), _jsx("strong", { children: "\u6E20\u9053\u8BE6\u60C5" })] }), _jsxs("section", { className: "private-official-copy", children: [_jsx("h2", { children: data.officialAccount.title }), _jsx("p", { children: data.officialAccount.description }), _jsx("p", { children: data.officialAccount.helper })] }), _jsx("div", { className: "private-official-options", children: data.officialAccount.options.map((option) => (_jsxs("article", { className: option.primary ? undefined : 'is-muted', children: [_jsxs("div", { className: "private-logo private-logo--official", "aria-hidden": "true", children: [_jsx("span", {}), _jsx("i", {})] }), _jsx("button", { type: "button", className: `private-button ${option.primary ? 'private-button--primary' : ''}`, onClick: () => actionCard && onAction(actionCard), children: option.label })] }, option.id))) })] })] }));
}
function PrivatePageError({ message, onRetry }) {
    return (_jsx("div", { className: "private-channel-page", children: _jsx("section", { className: "private-channel-panel", children: _jsxs("div", { className: "private-error-state", role: "alert", children: [_jsx("strong", { children: "\u79C1\u57DF\u6E20\u9053\u6570\u636E\u52A0\u8F7D\u5931\u8D25" }), _jsx("p", { children: message }), _jsx("button", { type: "button", className: "private-button private-button--primary", onClick: onRetry, children: "\u91CD\u65B0\u52A0\u8F7D" })] }) }) }));
}
export function PrivatePage() {
    const location = useLocation();
    const [notice, setNotice] = useState('私域渠道数据已更新');
    const [retryKey, setRetryKey] = useState(0);
    const result = useMemo(() => {
        void retryKey;
        try {
            return { data: loadPrivateChannel(), error: null };
        }
        catch (error) {
            return {
                data: null,
                error: error instanceof Error ? error.message : '私域渠道数据加载失败，请稍后重试',
            };
        }
    }, [retryKey]);
    function handleAction(card) {
        if (card.actionCode === 'subscribe_program') {
            setNotice(`${card.name}订阅方案已加入开通清单`);
            return;
        }
        if (card.actionCode === 'connect_wecom') {
            setNotice('企业微信配置流程已准备就绪');
            return;
        }
        setNotice('公众号授权流程已准备就绪');
    }
    function retry() {
        window.localStorage.setItem('pmsPrivateChannelScenario', 'success');
        setNotice('已重新加载私域渠道');
        setRetryKey((value) => value + 1);
    }
    if (result.error || !result.data) {
        return (_jsxs(_Fragment, { children: [_jsx(PrivatePageError, { message: result.error ?? '私域渠道数据加载失败，请稍后重试', onRetry: retry }), _jsx(PrivateActionStatus, { message: notice })] }));
    }
    const contract = JSON.stringify(result.data.contract);
    return (_jsxs(_Fragment, { children: [_jsx("pre", { hidden: true, "data-testid": "private-channel-contract", children: contract }), location.pathname.endsWith('/setting/weComSetting') ? (_jsx(EnterpriseDetailPage, { data: result.data, onAction: handleAction })) : location.pathname.endsWith('/setting/authorizationSettings') ? (_jsx(OfficialAuthorizationPage, { data: result.data, onAction: handleAction })) : (_jsx(DefaultPrivatePage, { data: result.data, onAction: handleAction })), _jsx(PrivateActionStatus, { message: notice })] }));
}
