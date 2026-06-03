import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { fetchScrmSidebarDashboard, } from '../services/scrmSidebarPreview';
import { resolveCurrentCampId } from '../utils/camp';
import './ScrmSidebarPreviewPage.css';
const DEFAULT_FILTERS = {
    poiId: 'ALL',
    date: '2026-05-18',
    channel: 'ALL',
    keyword: '',
    page: 1,
    pageSize: 20,
};
const TAB_CONFIG = [
    { key: 'all', label: '全部' },
    { key: 'waiting', label: '未回复' },
    { key: 'consulting', label: '咨询中' },
    { key: 'converted', label: '已转订单' },
    { key: 'followup', label: '待跟进' },
];
export function ScrmSidebarPreviewPage() {
    const location = useLocation();
    const navigate = useNavigate();
    const searchParams = useMemo(() => new URLSearchParams(location.search), [location.search]);
    const scenario = normalizeScenario(searchParams.get('mockState'));
    const queryConversationId = searchParams.get('conversationId') ?? '';
    const campId = useMemo(() => searchParams.get('campId') || resolveCurrentCampId(), [searchParams]);
    const [dashboard, setDashboard] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [activeTab, setActiveTab] = useState('all');
    const [selectedConversationId, setSelectedConversationId] = useState('');
    const [draft, setDraft] = useState('');
    const [messages, setMessages] = useState({});
    const [refreshTick, setRefreshTick] = useState(0);
    useEffect(() => {
        let cancelled = false;
        async function load() {
            setIsLoading(true);
            setError('');
            try {
                const nextDashboard = await fetchScrmSidebarDashboard({
                    ...DEFAULT_FILTERS,
                    campId,
                    scenario,
                });
                if (cancelled)
                    return;
                setDashboard(nextDashboard);
                setMessages((current) => ensureMessages(current, nextDashboard.conversations));
                if (queryConversationId && nextDashboard.conversations.some((item) => item.id === queryConversationId)) {
                    setSelectedConversationId(queryConversationId);
                }
                else if (scenario === 'empty') {
                    setSelectedConversationId('');
                }
            }
            catch (nextError) {
                if (cancelled)
                    return;
                setError(nextError instanceof Error ? nextError.message : '聊天工具栏数据加载失败，请稍后重试');
            }
            finally {
                if (!cancelled) {
                    setIsLoading(false);
                }
            }
        }
        void load();
        return () => {
            cancelled = true;
        };
    }, [campId, queryConversationId, refreshTick, scenario]);
    const counts = useMemo(() => createTabCounts(dashboard?.conversations ?? []), [dashboard?.conversations]);
    const filteredConversations = useMemo(() => filterConversationsByTab(dashboard?.conversations ?? [], activeTab), [activeTab, dashboard?.conversations]);
    const selectedConversation = filteredConversations.find((item) => item.id === selectedConversationId) ??
        dashboard?.conversations.find((item) => item.id === selectedConversationId) ??
        null;
    const selectedMessages = selectedConversation ? messages[selectedConversation.id] ?? [] : [];
    function handleSelectConversation(conversationId) {
        setSelectedConversationId(conversationId);
    }
    function handleSendMessage() {
        if (!selectedConversation || !draft.trim())
            return;
        const nextMessage = {
            id: `${selectedConversation.id}-staff-${Date.now()}`,
            conversationId: selectedConversation.id,
            author: 'staff',
            authorName: '房东账号',
            tone: conversationToneForIndex(3),
            content: draft.trim(),
            time: '刚刚',
        };
        setMessages((current) => ({
            ...current,
            [selectedConversation.id]: [...(current[selectedConversation.id] ?? []), nextMessage],
        }));
        setDraft('');
    }
    function handleUseTemplate(template) {
        setDraft(template.content);
    }
    return (_jsxs("div", { className: "conversation-full-page", children: [_jsx("div", { hidden: true, "data-testid": "scrm-sidebar-service-contract", "data-provider": dashboard?.providerMode ?? 'mock', "data-endpoint": dashboard?.endpoint ?? '', "data-request-body": JSON.stringify(dashboard?.requestBody ?? {}) }), _jsxs("aside", { className: "conversation-full-page__sidebar", children: [_jsxs("header", { className: "conversation-full-page__header", children: [_jsx("strong", { children: "\u5168\u90E8\u4F1A\u8BDD" }), _jsxs("div", { className: "conversation-full-page__tools", children: [_jsx("button", { type: "button", "aria-label": "\u540C\u6B65\u4F1A\u8BDD\u5217\u8868", onClick: () => setRefreshTick((value) => value + 1), children: _jsx(MenuIcon, {}) }), _jsx("button", { type: "button", "aria-label": "\u4F1A\u8BDD\u8BBE\u7F6E", onClick: () => navigate('/setting/imSetting'), children: _jsx(GearIcon, {}) })] })] }), _jsx("div", { className: "conversation-full-page__tabs", role: "tablist", "aria-label": "\u5168\u90E8\u4F1A\u8BDD\u5206\u7C7B", children: TAB_CONFIG.map((tab) => {
                            const count = counts[tab.key];
                            return (_jsxs("button", { type: "button", role: "tab", "aria-selected": activeTab === tab.key, className: activeTab === tab.key ? 'is-active' : '', onClick: () => setActiveTab(tab.key), children: [_jsx("span", { children: tab.label }), count > 0 ? _jsx("em", { children: count }) : null] }, tab.key));
                        }) }), _jsx("div", { className: "conversation-full-page__list", children: isLoading ? (_jsx("div", { className: "conversation-full-page__state", children: "\u6B63\u5728\u540C\u6B65\u4F1A\u8BDD\u5217\u8868..." })) : error ? (_jsxs("section", { className: "conversation-full-page__state conversation-full-page__state--error", role: "alert", children: [_jsx("div", { children: error }), _jsx("button", { type: "button", onClick: () => setRefreshTick((value) => value + 1), children: "\u91CD\u8BD5" })] })) : filteredConversations.length > 0 ? (filteredConversations.map((conversation, index) => (_jsxs("button", { type: "button", className: `conversation-card${selectedConversationId === conversation.id ? ' is-active' : ''}`, onClick: () => handleSelectConversation(conversation.id), children: [_jsx("span", { className: `conversation-card__avatar ${conversationToneForIndex(index)}`, "aria-hidden": "true", children: avatarEmojiForIndex(index) }), _jsxs("div", { className: "conversation-card__body", children: [_jsxs("div", { className: "conversation-card__topline", children: [_jsx("strong", { children: conversation.guestName }), _jsx("b", { children: conversation.status })] }), _jsxs("div", { className: "conversation-card__meta", children: [_jsx("em", { children: channelBadgeLabel(conversation.channel) }), _jsx("span", { children: conversation.roomName })] }), _jsx("p", { children: conversation.lastMessage }), _jsx("small", { children: conversation.lastMessageAt })] })] }, conversation.id)))) : (_jsx("div", { className: "conversation-full-page__state", children: "\u5F53\u524D\u5206\u7C7B\u4E0B\u6682\u65E0\u4F1A\u8BDD" })) })] }), _jsx("section", { className: "conversation-full-page__content", children: selectedConversation ? (_jsxs("div", { className: "conversation-workbench", children: [_jsxs("header", { className: "conversation-workbench__head", children: [_jsxs("div", { className: "conversation-workbench__title", children: [_jsxs("strong", { children: [selectedConversation.guestName, " ", _jsx("span", { children: selectedConversation.status })] }), _jsx("p", { children: selectedConversation.roomName }), _jsxs("small", { children: ["\u8BA2\u5355\u53F7 ", selectedConversation.orderNo, " \u00B7 ", selectedConversation.stayRange] })] }), _jsxs("div", { className: "conversation-workbench__meta", children: [_jsx("button", { type: "button", children: "\u623F\u4E1C\u8D26\u53F7" }), _jsxs("span", { children: ["\u54CD\u5E94\u65F6\u6548 ", selectedConversation.responseSla] }), _jsxs("span", { children: ["\u8BA2\u5355\u91D1\u989D \u00A5", selectedConversation.orderAmount] })] })] }), _jsxs("div", { className: "conversation-workbench__toolbar", children: [_jsxs("button", { type: "button", className: "conversation-workbench__quick-entry", children: [_jsx(FlashIcon, {}), _jsx("span", { children: "\u5FEB\u6377\u56DE\u590D" })] }), _jsxs("div", { className: "conversation-workbench__pager", children: [_jsx("button", { type: "button", children: "\u4E0A\u4E00\u4F4D" }), _jsx("button", { type: "button", children: "\u4E0B\u4E00\u4F4D" })] }), _jsx("span", { className: "conversation-workbench__history", children: "\u5386\u53F2\u8BA2\u5355 / \u623F\u6001\u8054\u52A8" })] }), _jsx("div", { className: "conversation-workbench__timeline", children: selectedMessages.map((message) => (_jsxs("article", { className: `chat-message${message.author === 'staff' ? ' chat-message--staff' : ''}`, children: [_jsx("span", { className: `chat-message__avatar ${message.author === 'staff' ? 'chat-message__avatar--staff' : message.tone}`, "aria-hidden": "true", children: message.author === 'staff' ? '店' : avatarEmojiForTone(message.tone) }), _jsxs("div", { className: "chat-message__content", children: [_jsxs("small", { children: [message.authorName, " \u00B7 ", message.time] }), _jsx("p", { children: message.content })] })] }, message.id))) }), _jsxs("div", { className: "conversation-workbench__composer", children: [_jsx("div", { className: "conversation-workbench__reply-chips", children: (dashboard?.replyTemplates ?? []).map((template) => (_jsx("button", { type: "button", onClick: () => handleUseTemplate(template), children: template.title }, template.id))) }), _jsx("textarea", { "aria-label": "\u53D1\u9001\u6D88\u606F\u8F93\u5165\u6846", placeholder: "\u8BF7\u8F93\u5165\u56DE\u590D\u5185\u5BB9", value: draft, onChange: (event) => setDraft(event.target.value) }), _jsxs("div", { className: "conversation-workbench__composer-footer", children: [_jsx("span", { children: selectedConversation.preference }), _jsx("button", { type: "button", disabled: !draft.trim(), onClick: handleSendMessage, children: "\u53D1\u9001" })] })] })] })) : (_jsx("div", { className: "conversation-empty-state", children: "\u60A8\u8FD8\u672A\u9009\u4E2D\u6216\u53D1\u8D77\u804A\u5929" })) })] }));
}
function normalizeScenario(value) {
    if (value === 'empty' || value === 'error')
        return value;
    return 'success';
}
function createTabCounts(conversations) {
    const waiting = conversations.filter((item) => item.status === '待回复').length;
    const converted = conversations.filter((item) => item.status === '已转订单').length;
    const consulting = conversations.filter((item) => item.status === '咨询中').length;
    const followup = conversations.filter((item) => item.tags.some((tag) => tag.includes('续住') || tag.includes('复购'))).length;
    return {
        all: conversations.length,
        waiting,
        consulting,
        converted,
        followup,
    };
}
function filterConversationsByTab(conversations, activeTab) {
    if (activeTab === 'all')
        return conversations;
    if (activeTab === 'waiting')
        return conversations.filter((item) => item.status === '待回复');
    if (activeTab === 'consulting')
        return conversations.filter((item) => item.status === '咨询中');
    if (activeTab === 'converted')
        return conversations.filter((item) => item.status === '已转订单');
    return conversations.filter((item) => item.tags.some((tag) => tag.includes('续住') || tag.includes('复购')));
}
function ensureMessages(current, conversations) {
    const nextMessages = { ...current };
    for (let index = 0; index < conversations.length; index += 1) {
        const conversation = conversations[index];
        if (nextMessages[conversation.id])
            continue;
        const tone = conversationToneForIndex(index);
        nextMessages[conversation.id] = [
            {
                id: `${conversation.id}-guest-001`,
                conversationId: conversation.id,
                author: 'guest',
                authorName: conversation.guestName,
                tone,
                content: guestOpeningMessage(conversation),
                time: conversation.lastMessageAt,
            },
            {
                id: `${conversation.id}-staff-001`,
                conversationId: conversation.id,
                author: 'staff',
                authorName: '房东账号',
                tone,
                content: staffFollowupMessage(conversation),
                time: conversation.lastMessageAt,
            },
        ];
    }
    return nextMessages;
}
function guestOpeningMessage(conversation) {
    if (conversation.status === '待回复')
        return '今天还有同房型可以续住吗？';
    if (conversation.status === '已转订单')
        return '已经下单成功，想确认下入住指引。';
    return '房了加了';
}
function staffFollowupMessage(conversation) {
    if (conversation.status === '待回复')
        return '有的，我先帮您确认同房续住价格，稍后把方案发您。';
    if (conversation.status === '已转订单')
        return '好的，稍后把门锁密码、停车位置和入住指引一并发您。';
    return '加了绿色号，稍后发送入住指引。';
}
function conversationToneForIndex(index) {
    return ['is-blue', 'is-sky', 'is-gold', 'is-coral'][index % 4];
}
function avatarEmojiForIndex(index) {
    return ['🐻', '🐼', '🐱', '🐰'][index % 4];
}
function avatarEmojiForTone(tone) {
    switch (tone) {
        case 'is-sky':
            return '🐼';
        case 'is-gold':
            return '🐱';
        case 'is-coral':
            return '🐰';
        default:
            return '🐻';
    }
}
function channelBadgeLabel(channel) {
    switch (channel) {
        case 'ctrip':
            return '携程';
        case 'meituan':
            return '美团';
        case 'xiaozhu':
            return '小猪';
        default:
            return '途家';
    }
}
function MenuIcon() {
    return (_jsx("svg", { viewBox: "0 0 24 24", "aria-hidden": "true", children: _jsx("path", { d: "M5 7.5h14M9 12h10M13 16.5h6" }) }));
}
function GearIcon() {
    return (_jsxs("svg", { viewBox: "0 0 24 24", "aria-hidden": "true", children: [_jsx("path", { d: "M12 3.5a1 1 0 0 1 .96.71l.38 1.2c.5.13.98.33 1.42.59l1.16-.62a1 1 0 0 1 1.17.18l1.36 1.36a1 1 0 0 1 .18 1.17l-.62 1.16c.26.44.46.92.59 1.42l1.2.38a1 1 0 0 1 .71.96v1.98a1 1 0 0 1-.71.96l-1.2.38c-.13.5-.33.98-.59 1.42l.62 1.16a1 1 0 0 1-.18 1.17l-1.36 1.36a1 1 0 0 1-1.17.18l-1.16-.62c-.44.26-.92.46-1.42.59l-.38 1.2a1 1 0 0 1-.96.71h-1.98a1 1 0 0 1-.96-.71l-.38-1.2a6.7 6.7 0 0 1-1.42-.59l-1.16.62a1 1 0 0 1-1.17-.18L4.9 18.83a1 1 0 0 1-.18-1.17l.62-1.16A6.7 6.7 0 0 1 4.75 15l-1.2-.38a1 1 0 0 1-.71-.96v-1.98a1 1 0 0 1 .71-.96l1.2-.38c.13-.5.33-.98.59-1.42l-.62-1.16a1 1 0 0 1 .18-1.17L6.26 4.5a1 1 0 0 1 1.17-.18l1.16.62c.44-.26.92-.46 1.42-.59l.38-1.2a1 1 0 0 1 .96-.71H12Z" }), _jsx("circle", { cx: "12", cy: "12", r: "2.8" })] }));
}
function FlashIcon() {
    return (_jsx("svg", { viewBox: "0 0 24 24", "aria-hidden": "true", children: _jsx("path", { d: "m13 2-7 11h5l-1 9 8-12h-5z" }) }));
}
