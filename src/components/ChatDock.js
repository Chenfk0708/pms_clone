import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
const defaultConversations = [
    {
        id: 'conv-001',
        routeConversationId: 'conv-001',
        name: '携程民宿 - [M335275070]',
        source: '途家',
        room: '顶层套房（浴缸巨幕电竞麻将房）',
        preview: '房了加了',
        tone: '',
        avatar: '🐻',
    },
    {
        id: 'conv-002',
        routeConversationId: 'conv-002',
        name: '携程民宿 - [M566739056]',
        source: '途家',
        room: '总裁套间（榻榻米露台电竞麻将房）',
        preview: '房已办理退房',
        tone: 'is-sky',
        avatar: '🐼',
    },
    {
        id: 'conv-003',
        routeConversationId: 'conv-003',
        name: '去哪民宿 - [去哪儿用户]',
        source: '途家',
        room: '总裁套间（榻榻米露台电竞麻将房）',
        preview: '房人有的',
        tone: 'is-amber',
        avatar: '🐱',
    },
    {
        id: 'conv-004',
        routeConversationId: 'conv-001',
        name: 'CqBv9667',
        source: '途家',
        room: '顶层套房（浴缸巨幕电竞麻将房）',
        preview: '房不客气哈~',
        tone: 'is-pink',
        avatar: '🐰',
    },
];
export function ChatDock({ openSignal = 0 }) {
    const navigate = useNavigate();
    const [isOpen, setIsOpen] = useState(false);
    const [refreshTick, setRefreshTick] = useState(0);
    useEffect(() => {
        if (openSignal > 0) {
            setIsOpen(true);
        }
    }, [openSignal]);
    const conversations = useMemo(() => {
        if (refreshTick % 2 === 0) {
            return defaultConversations;
        }
        return [...defaultConversations.slice(1), defaultConversations[0]];
    }, [refreshTick]);
    if (!isOpen) {
        return (_jsx("button", { type: "button", className: "chat-dock-launcher", "aria-label": "\u6253\u5F00\u5168\u90E8\u4F1A\u8BDD", onClick: () => setIsOpen(true), children: _jsx(ChatLauncherIcon, {}) }));
    }
    const focusConversationId = conversations[0]?.routeConversationId ?? '';
    return (_jsxs("aside", { className: "chat-dock", "aria-label": "\u5168\u90E8\u4F1A\u8BDD", "data-open-signal": openSignal, children: [_jsxs("header", { className: "chat-dock__header", children: [_jsx("strong", { children: "\u5168\u90E8\u4F1A\u8BDD" }), _jsxs("div", { className: "chat-dock__actions", children: [_jsx("button", { type: "button", "aria-label": "\u540C\u6B65\u4F1A\u8BDD\u5217\u8868", onClick: () => setRefreshTick((value) => value + 1), children: _jsx(MenuIcon, {}) }), _jsx("button", { type: "button", "aria-label": "\u4F1A\u8BDD\u8BBE\u7F6E", onClick: () => navigate('/setting/imSetting'), children: _jsx(GearIcon, {}) }), _jsx("button", { type: "button", "aria-label": "\u653E\u5927\u4F1A\u8BDD\u9875", onClick: () => navigate(`/scrm/sidebarPreview${focusConversationId ? `?conversationId=${focusConversationId}` : ''}`), children: _jsx(ExpandIcon, {}) })] })] }), _jsx("div", { className: "chat-dock__list", children: conversations.map((item) => (_jsxs("button", { type: "button", className: "chat-item chat-item--button", "aria-label": `打开会话 ${item.name}`, onClick: () => navigate(`/scrm/sidebarPreview?conversationId=${item.routeConversationId}`), children: [_jsx("span", { className: `chat-item__avatar ${item.tone}`, "aria-hidden": "true", children: item.avatar }), _jsxs("div", { className: "chat-item__body", children: [_jsxs("div", { className: "chat-item__title", children: [_jsx("strong", { children: item.name }), _jsx("span", { children: "\u54A8\u8BE2\u4E2D" })] }), _jsxs("p", { children: [_jsx("em", { children: item.source }), item.room] }), _jsx("small", { children: item.preview })] })] }, item.id))) }), _jsx("div", { className: "chat-dock__footer", children: _jsx("button", { type: "button", className: "chat-dock__collapse", "aria-label": "\u6536\u8D77\u4F1A\u8BDD", onClick: () => setIsOpen(false), children: "\u6536\u8D77" }) })] }));
}
function ChatLauncherIcon() {
    return (_jsxs("svg", { viewBox: "0 0 24 24", "aria-hidden": "true", children: [_jsx("path", { d: "M6 6.5h12a2 2 0 0 1 2 2v6.2a2 2 0 0 1-2 2H11l-3.6 2.8v-2.8H6a2 2 0 0 1-2-2V8.5a2 2 0 0 1 2-2Z" }), _jsx("path", { d: "M9 10.4h6M9 13.6h4.4" })] }));
}
function MenuIcon() {
    return (_jsx("svg", { viewBox: "0 0 24 24", "aria-hidden": "true", children: _jsx("path", { d: "M5 7.5h14M9 12h10M13 16.5h6" }) }));
}
function GearIcon() {
    return (_jsxs("svg", { viewBox: "0 0 24 24", "aria-hidden": "true", children: [_jsx("path", { d: "M12 3.5a1 1 0 0 1 .96.71l.38 1.2c.5.13.98.33 1.42.59l1.16-.62a1 1 0 0 1 1.17.18l1.36 1.36a1 1 0 0 1 .18 1.17l-.62 1.16c.26.44.46.92.59 1.42l1.2.38a1 1 0 0 1 .71.96v1.98a1 1 0 0 1-.71.96l-1.2.38c-.13.5-.33.98-.59 1.42l.62 1.16a1 1 0 0 1-.18 1.17l-1.36 1.36a1 1 0 0 1-1.17.18l-1.16-.62c-.44.26-.92.46-1.42.59l-.38 1.2a1 1 0 0 1-.96.71h-1.98a1 1 0 0 1-.96-.71l-.38-1.2a6.7 6.7 0 0 1-1.42-.59l-1.16.62a1 1 0 0 1-1.17-.18L4.9 18.83a1 1 0 0 1-.18-1.17l.62-1.16A6.7 6.7 0 0 1 4.75 15l-1.2-.38a1 1 0 0 1-.71-.96v-1.98a1 1 0 0 1 .71-.96l1.2-.38c.13-.5.33-.98.59-1.42l-.62-1.16a1 1 0 0 1 .18-1.17L6.26 4.5a1 1 0 0 1 1.17-.18l1.16.62c.44-.26.92-.46 1.42-.59l.38-1.2a1 1 0 0 1 .96-.71H12Z" }), _jsx("circle", { cx: "12", cy: "12", r: "2.8" })] }));
}
function ExpandIcon() {
    return (_jsxs("svg", { viewBox: "0 0 24 24", "aria-hidden": "true", children: [_jsx("path", { d: "M8 4.5H4.5V8M15.5 4.5h4V8M8 19.5H4.5V16M19.5 16v3.5h-4" }), _jsx("path", { d: "M9 9 4.5 4.5M15 9l4.5-4.5M9 15l-4.5 4.5M15 15l4.5 4.5" })] }));
}
