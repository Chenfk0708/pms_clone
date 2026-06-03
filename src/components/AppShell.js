import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { ChatDock } from './ChatDock';
import { channelSideNav, distributionSideNav, globalRadarSideNav, informationSideNav, scrmSideNav } from '../data/discovery';
import { resolveSideNav } from '../data/mock';
import { getCurrentSessionUser } from '../services/session';
const topNav = [
    { label: '首页', path: '/workspace' },
    { label: '房态', path: '/houseManage/months' },
    { label: '房价', path: '/houseManage/houseCale' },
    { label: '订单', path: '/order/house-order/list' },
    { label: '售卖/产品', path: '/setting/localRoomTypeProductionSetting' },
    { label: 'OTA', path: '/channels/ota' },
    { label: '社媒', path: '/channels/social' },
    { label: '私域', path: '/channels/private' },
    { label: '聚合分销', path: '/channels/distribution/distributionSecond', badge: 'HOT' },
    { label: 'SCRM', path: '/scrm/general' },
    { label: 'AI全域雷达', path: '/channels/globalRadar/globalData' },
    { label: '智慧酒店', path: '/smartHotel/smartHome' },
    { label: '报表', path: '/statistics/report' },
    { label: '设置', path: '/InformationMaintenance/informationOverview' },
];
const topbarTools = [
    { id: 'message', label: '消息', icon: 'message' },
    { id: 'payment', label: '收款', icon: 'payment' },
    { id: 'reception', label: '接待', icon: 'reception' },
    { id: 'key', label: '门锁', icon: 'key' },
    { id: 'service', label: '客服', icon: 'service' },
    { id: 'notice', label: '通知', icon: 'notice' },
];
export function AppShell({ path, pageTitle, children }) {
    const navigate = useNavigate();
    const sessionUser = getCurrentSessionUser();
    const [openTopbarPanel, setOpenTopbarPanel] = useState(null);
    const [collapsedSidebarGroups, setCollapsedSidebarGroups] = useState({});
    const isRoomSituation = path === '/statistics/roomSituation';
    const isCleanStatistics = path === '/cleanManage/cleanStatistics';
    const isInformationSettingPath = path === '/setting/customChannel';
    const isNotificationStandalonePath = path === '/setting/notification';
    const usesFlushContent = isRoomSituation || isCleanStatistics || isInformationSettingPath;
    const usesSrOnlyHeading = isRoomSituation || isCleanStatistics;
    const showDefaultPageHeader = false;
    const isHouseTopNav = isRoomSituation || path.startsWith('/cleanManage/');
    const isOrderMallPath = path.startsWith('/mallManagement/orderManagement') ||
        path.startsWith('/mallManagement/verificationManagement') ||
        path.startsWith('/mallManagement/hotelPackageOrder');
    const isProductSettingPath = path.startsWith('/setting/localRoomTypeProductionSetting');
    const isCompanySettingPath = path.startsWith('/CompanySetting/');
    const isInformationMaintenancePath = path.startsWith('/InformationMaintenance/');
    const isSystemSettingPath = isInformationMaintenancePath ||
        isInformationSettingPath ||
        (path.startsWith('/setting/') && !isProductSettingPath && !isNotificationStandalonePath) ||
        isCompanySettingPath;
    const isSalesTopNav = isProductSettingPath ||
        path.startsWith('/mallManagement/goodsManagement') ||
        path.startsWith('/mallManagement/hotelProduct');
    const isFullMarketingPath = path === '/mallManagement/distribution';
    const isCouponPath = path.startsWith('/mallManagement/couponMgt');
    const isCustomerScrmPath = path.startsWith('/customer/');
    const isScrmTopNav = path.startsWith('/scrm/') || isCustomerScrmPath || isFullMarketingPath || isCouponPath;
    const isGlobalRadarTopNav = path.startsWith('/channels/globalRadar/');
    const isDistributionTopNav = path.startsWith('/channels/distribution/');
    const isReportTopNav = path.startsWith('/statistics/') && !isRoomSituation;
    const isPsbSmartHotelPath = path.startsWith('/psb/');
    const isSmartHotelTopNav = path.startsWith('/smartHotel/') || isPsbSmartHotelPath;
    const isOrderTopNav = path.startsWith('/order/') || isOrderMallPath;
    const isScrmSidebarFullscreenPath = path === '/scrm/sidebarPreview' || path === '/scrm/sidebar/preview';
    const showChatDock = !isNotificationStandalonePath && !isScrmSidebarFullscreenPath;
    const sideGroups = isNotificationStandalonePath || isScrmSidebarFullscreenPath
        ? []
        : path.startsWith('/channels/globalRadar/')
            ? globalRadarSideNav
            : path.startsWith('/channels/distribution/')
                ? distributionSideNav
                : path.startsWith('/channels/')
                    ? channelSideNav
                    : isScrmTopNav
                        ? scrmSideNav
                        : isInformationMaintenancePath || isSystemSettingPath
                            ? informationSideNav
                            : isRoomSituation
                                ? resolveSideNav('/houseManage/houseStatus')
                                : isPsbSmartHotelPath
                                    ? resolveSideNav('/smartHotel/smartHome')
                                    : resolveSideNav(path);
    const usesHouseManagementSidebar = path.startsWith('/houseManage/') || path.startsWith('/cleanManage/') || isRoomSituation;
    function handleTopbarTool(tool) {
        setOpenTopbarPanel(null);
        if (tool === 'message') {
            navigate('/scrm/sidebarPreview');
            return;
        }
        if (tool === 'payment') {
            setOpenTopbarPanel('payment');
            return;
        }
        if (tool === 'reception') {
            navigate('/statistics/shift/record');
            return;
        }
        if (tool === 'key') {
            navigate('/smartHotel/smartHardware/smartLook');
            return;
        }
        if (tool === 'service') {
            setOpenTopbarPanel('service');
            return;
        }
        navigate('/setting/notification');
    }
    function isSidebarGroupActive(group) {
        return group.items.some((item) => path === item.path || path.startsWith(`${item.path}/`) || (isRoomSituation && item.path === '/houseManage/houseStatus'));
    }
    function getSidebarGroupKey(group) {
        return group.title || group.items[0]?.path || pageTitle;
    }
    function getSidebarGroupTitle(group) {
        if (group.title)
            return group.title;
        const firstPath = group.items[0]?.path ?? '';
        if (firstPath.startsWith('/scrm/') || firstPath.startsWith('/customer/'))
            return 'SCRM';
        if (firstPath.startsWith('/channels/globalRadar/'))
            return 'AI全域雷达';
        return group.items[0]?.label ?? pageTitle;
    }
    function isLeafSidebarGroup(group) {
        return group.items.length === 1 && group.items[0].label === getSidebarGroupTitle(group);
    }
    function isSidebarGroupExpanded(group) {
        if (isLeafSidebarGroup(group))
            return false;
        const key = getSidebarGroupKey(group);
        const userCollapsedState = collapsedSidebarGroups[key];
        if (typeof userCollapsedState === 'boolean')
            return !userCollapsedState;
        return isSidebarGroupActive(group);
    }
    function toggleSidebarGroup(groupTitle, isCurrentlyExpanded) {
        setCollapsedSidebarGroups((current) => ({
            ...current,
            [groupTitle]: isCurrentlyExpanded,
        }));
    }
    if (isScrmSidebarFullscreenPath) {
        return _jsx("div", { className: "app-shell app-shell--conversation-fullscreen", children: children });
    }
    return (_jsxs("div", { className: "app-shell", children: [_jsxs("header", { className: "topbar", children: [_jsxs("div", { className: "brand-block", children: [_jsx("img", { className: "brand-mark", src: "/brand-yinsu.png", alt: "\u94F6\u5BBF" }), _jsxs("div", { className: "brand-store", children: [_jsx("strong", { children: "\u94F6\u5BBF" }), _jsx("span", { children: "\u7545\u4EAB\u7248" })] })] }), _jsx("nav", { className: "topnav", "aria-label": "\u9876\u90E8\u5BFC\u822A", children: topNav.map((item) => (_jsxs(NavLink, { to: item.path, "aria-label": item.label, className: ({ isActive }) => `topnav-link${isActive ||
                                (isHouseTopNav && item.path === '/houseManage/months') ||
                                (isOrderTopNav && item.path === '/order/house-order/list') ||
                                (isSalesTopNav && item.path === '/setting/localRoomTypeProductionSetting') ||
                                (!isNotificationStandalonePath && isSystemSettingPath && item.path === '/InformationMaintenance/informationOverview') ||
                                (isScrmTopNav && item.path === '/scrm/general') ||
                                (isGlobalRadarTopNav && item.path === '/channels/globalRadar/globalData') ||
                                (isDistributionTopNav && item.path === '/channels/distribution/distributionSecond') ||
                                (isReportTopNav && item.path === '/statistics/report') ||
                                (isSmartHotelTopNav && item.path === '/smartHotel/smartHome')
                                ? ' is-active'
                                : ''}`, children: [item.label, item.badge ? _jsx("em", { children: item.badge }) : null] }, item.path))) }), _jsxs("div", { className: "topbar-actions", "aria-label": "\u9876\u90E8\u5DE5\u5177\u680F", children: [_jsxs(Link, { className: "topbar-app-entry", to: "/version/applicationPayment", "aria-label": "\u5E94\u7528\u8BA2\u9605", children: [_jsx("span", { className: "topbar-grid-icon", "aria-hidden": "true", children: _jsx("i", {}) }), _jsx("span", { children: "\u5E94\u7528\u8BA2\u9605" }), _jsx("em", { children: "\u9650\u65F6\u8BD5\u7528" })] }), topbarTools.map((tool) => (_jsx("button", { type: "button", className: `topbar-tool-button topbar-tool-button--${tool.icon}`, "aria-label": tool.label, "aria-expanded": (tool.id === 'payment' && openTopbarPanel === 'payment') || (tool.id === 'service' && openTopbarPanel === 'service'), onClick: () => handleTopbarTool(tool.id), children: _jsx(TopbarIcon, { type: tool.icon }) }, tool.id))), _jsxs("button", { type: "button", className: "topbar-user-menu", "aria-label": "\u7528\u6237\u83DC\u5355", "aria-expanded": openTopbarPanel === 'user', onClick: () => setOpenTopbarPanel(openTopbarPanel === 'user' ? null : 'user'), children: [_jsx("span", { className: "topbar-user-avatar", "aria-hidden": "true", children: _jsx(TopbarIcon, { type: "user" }) }), _jsx(TopbarIcon, { type: "chevron" })] }), openTopbarPanel === 'user' ? (_jsxs("div", { className: "topbar-user-popover", role: "dialog", "aria-label": "\u7528\u6237\u83DC\u5355\u9762\u677F", children: [_jsx("strong", { children: sessionUser?.name ?? '银宿' }), sessionUser ? _jsx("span", { children: sessionUser.roleLabel }) : null, _jsx(Link, { to: "/InformationMaintenance/campInfo", onClick: () => setOpenTopbarPanel(null), children: "\u95E8\u5E97\u4FE1\u606F" }), _jsx(Link, { to: "/setting/member", onClick: () => setOpenTopbarPanel(null), children: "\u6210\u5458\u8BBE\u7F6E" }), _jsx(Link, { to: "/CompanySetting/Apikeys", onClick: () => setOpenTopbarPanel(null), children: "API keys" })] })) : null] })] }), _jsxs("div", { className: "page-body", children: [sideGroups.length > 0 ? (_jsx("aside", { className: "sidebar", "aria-label": `${pageTitle}侧边导航`, children: sideGroups.map((group) => {
                            const isExpanded = isSidebarGroupExpanded(group);
                            const isActiveGroup = isSidebarGroupActive(group);
                            const isLeafGroup = isLeafSidebarGroup(group);
                            const groupKey = getSidebarGroupKey(group);
                            const groupTitle = getSidebarGroupTitle(group);
                            return (_jsxs("section", { className: `sidebar-group sidebar-group--module${isExpanded ? ' is-expanded' : ' is-collapsed'}${usesHouseManagementSidebar ? ' sidebar-group--house' : ''}${isActiveGroup ? ' is-active-group' : ''}${isLeafGroup ? ' sidebar-group--leaf' : ''}`, children: [isLeafGroup ? (_jsxs(NavLink, { to: group.items[0].path, "aria-label": groupTitle, className: ({ isActive }) => `sidebar-group-title sidebar-group-title--link sidebar-link${isActive || isActiveGroup ? ' is-active' : ''}`, children: [_jsx(SidebarGroupIcon, { group: group }), _jsx("span", { className: "sidebar-group-heading", role: "heading", "aria-level": 2, children: groupTitle })] })) : (_jsxs("button", { type: "button", className: `sidebar-group-title${isActiveGroup ? ' is-active' : ''}`, "aria-expanded": isExpanded, onClick: () => toggleSidebarGroup(groupKey, isExpanded), children: [_jsx(SidebarGroupIcon, { group: group }), _jsx("span", { className: "sidebar-group-heading", role: "heading", "aria-level": 2, children: groupTitle }), _jsx(TopbarIcon, { type: "chevron" })] })), isExpanded ? (_jsx("div", { className: "sidebar-items", children: group.items.map((item) => (_jsx(NavLink, { to: item.path, "aria-label": item.label, className: ({ isActive }) => `sidebar-link${isActive || (isRoomSituation && item.path === '/houseManage/houseStatus') ? ' is-active' : ''}`, children: item.label }, item.path))) })) : null] }, groupKey));
                        }) })) : null, _jsxs("main", { className: `page-content${usesFlushContent ? ' page-content--room-situation' : ''}`, children: [usesSrOnlyHeading ? (_jsx("h1", { className: "sr-only-heading", children: pageTitle })) : usesFlushContent || !showDefaultPageHeader ? null : (_jsxs("div", { className: "page-header", children: [_jsxs("div", { children: [_jsx("p", { className: "eyebrow", children: "PMS Clone Prototype" }), _jsx("h1", { children: pageTitle })] }), _jsx("div", { className: "page-meta", children: "\u91C7\u96C6\u57FA\u7EBF\uFF1AChrome 1440x900 / \u8D26\u53F7\u5DF2\u6388\u6743\u767B\u5F55" })] })), children] })] }), showChatDock ? _jsx(ChatDock, {}) : null, openTopbarPanel === 'payment' ? _jsx(TopbarPaymentDialog, { onClose: () => setOpenTopbarPanel(null) }) : null, openTopbarPanel === 'service' ? _jsx(TopbarServicePanel, { onClose: () => setOpenTopbarPanel(null) }) : null] }));
}
function SidebarGroupIcon({ group }) {
    const firstPath = group.items[0]?.path ?? '';
    if (firstPath.startsWith('/houseManage/houseCale') || firstPath.startsWith('/houseManage/channelPrice')) {
        return (_jsxs("svg", { viewBox: "0 0 24 24", "aria-hidden": "true", children: [_jsx("path", { d: "M4.5 9.5 12 5l7.5 4.5v9.8H4.5z" }), _jsx("path", { d: "M9 10.2h6M9 13h6M12 8.5v6.2" })] }));
    }
    if (firstPath.startsWith('/houseManage/houseStatus')) {
        return (_jsxs("svg", { viewBox: "0 0 24 24", "aria-hidden": "true", children: [_jsx("rect", { x: "6", y: "4.5", width: "12", height: "16", rx: "1.5" }), _jsx("path", { d: "M9.2 4.5h5.6l.7 2.3h-7zM9 11h6M9 15h6" })] }));
    }
    if (firstPath.startsWith('/cleanManage/')) {
        return (_jsxs("svg", { viewBox: "0 0 24 24", "aria-hidden": "true", children: [_jsx("path", { d: "M4.5 20.5V9.2M7.2 20.5V8.5M10 20.5V10" }), _jsx("path", { d: "M3.3 20.5h8" }), _jsx("path", { d: "M12.5 7.5h7v13h-7z" }), _jsx("path", { d: "M15 7.5V4h2.8v3.5M15.2 11.3c1.6.6 2.8.3 3.6-.8" })] }));
    }
    if (firstPath.startsWith('/order/') || firstPath.startsWith('/mallManagement/')) {
        return (_jsxs("svg", { viewBox: "0 0 24 24", "aria-hidden": "true", children: [_jsx("rect", { x: "5", y: "4.5", width: "14", height: "16", rx: "2" }), _jsx("path", { d: "M8.5 8h7M8.5 12h7M8.5 16h4" })] }));
    }
    if (firstPath.startsWith('/channels/distribution/')) {
        return (_jsxs("svg", { viewBox: "0 0 24 24", "aria-hidden": "true", children: [_jsx("circle", { cx: "7", cy: "7", r: "2.4" }), _jsx("circle", { cx: "17", cy: "7", r: "2.4" }), _jsx("circle", { cx: "12", cy: "17", r: "2.4" }), _jsx("path", { d: "m9 8.5 2 5M15 8.5l-2 5" })] }));
    }
    if (firstPath.startsWith('/channels/globalRadar/')) {
        return (_jsxs("svg", { viewBox: "0 0 24 24", "aria-hidden": "true", children: [_jsx("path", { d: "M12 20a8 8 0 1 0 0-16 8 8 0 0 0 0 16Z" }), _jsx("path", { d: "M12 8v4l3 2M4 12h2M18 12h2M12 4v2M12 18v2" })] }));
    }
    if (firstPath.startsWith('/channels/')) {
        return (_jsxs("svg", { viewBox: "0 0 24 24", "aria-hidden": "true", children: [_jsx("path", { d: "M5 8.5h14M7 5h10l2 3.5v9.8H5V8.5z" }), _jsx("path", { d: "M8.5 13h7M8.5 16h5" })] }));
    }
    if (firstPath.startsWith('/scrm/') || firstPath.startsWith('/customer/')) {
        return (_jsxs("svg", { viewBox: "0 0 24 24", "aria-hidden": "true", children: [_jsx("circle", { cx: "9", cy: "8", r: "3" }), _jsx("path", { d: "M4.5 19a5.2 5.2 0 0 1 9 0" }), _jsx("path", { d: "M15 7.5h4M15 11h5M16.5 15h2" })] }));
    }
    if (firstPath.startsWith('/smartHotel/') || firstPath.startsWith('/psb/')) {
        return (_jsxs("svg", { viewBox: "0 0 24 24", "aria-hidden": "true", children: [_jsx("path", { d: "M5 20V8l7-4 7 4v12" }), _jsx("path", { d: "M9 20v-6h6v6M9 10h6" })] }));
    }
    if (firstPath.startsWith('/statistics/')) {
        return (_jsxs("svg", { viewBox: "0 0 24 24", "aria-hidden": "true", children: [_jsx("path", { d: "M5 19V5M5 19h14" }), _jsx("path", { d: "M9 16v-5M13 16V8M17 16v-7" })] }));
    }
    if (firstPath.startsWith('/InformationMaintenance/') || firstPath.startsWith('/CompanySetting/') || firstPath.startsWith('/setting/')) {
        return (_jsxs("svg", { viewBox: "0 0 24 24", "aria-hidden": "true", children: [_jsx("path", { d: "M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z" }), _jsx("path", { d: "m19 12 2-1.2-2-3.4-2.2.8a7 7 0 0 0-1.4-.8L15 5h-6l-.4 2.4a7 7 0 0 0-1.4.8L5 7.4l-2 3.4L5 12l-2 1.2 2 3.4 2.2-.8a7 7 0 0 0 1.4.8L9 19h6l.4-2.4a7 7 0 0 0 1.4-.8l2.2.8 2-3.4Z" })] }));
    }
    return (_jsxs("svg", { viewBox: "0 0 24 24", "aria-hidden": "true", children: [_jsx("path", { d: "m4 10 8-5.5 8 5.5v9.5H4z" }), _jsx("path", { d: "M9.5 19.5v-6h5v6" })] }));
}
function TopbarPaymentDialog({ onClose }) {
    return (_jsx("div", { className: "topbar-payment-mask", role: "presentation", onMouseDown: onClose, children: _jsxs("section", { className: "topbar-payment-dialog", role: "dialog", "aria-modal": "true", "aria-label": "\u6536\u6B3E", onMouseDown: (event) => event.stopPropagation(), children: [_jsxs("header", { children: [_jsx("strong", { children: "\u6536\u6B3E" }), _jsx("button", { type: "button", "aria-label": "\u5173\u95ED\u6536\u6B3E", onClick: onClose, children: "\u00D7" })] }), _jsxs("div", { className: "topbar-payment-form", children: [_jsxs("label", { children: [_jsx("span", { children: "\u6536\u6B3E\u65B9\u5F0F" }), _jsx("button", { type: "button", children: "\u8BF7\u9009\u62E9\u6536\u6B3E\u65B9\u5F0F" })] }), _jsxs("label", { children: [_jsx("span", { children: "\u91D1\u989D" }), _jsxs("div", { className: "topbar-payment-inline", children: [_jsx("input", { "aria-label": "\u91D1\u989D" }), _jsx("button", { type: "button", children: "\u4EBA\u6C11\u5E01 | CNY" })] })] }), _jsxs("label", { children: [_jsx("span", { children: "\u623F\u578B/\u623F\u95F4" }), _jsx("button", { type: "button", children: "\u8BF7\u9009\u62E9\u623F\u578B/\u623F\u95F4" })] }), _jsxs("label", { children: [_jsx("span", { children: "\u65F6\u95F4" }), _jsx("input", { "aria-label": "\u65F6\u95F4", defaultValue: "2026-05-15 12:00" })] })] }), _jsxs("footer", { children: [_jsx(Link, { to: "/statistics/ledger", onClick: onClose, children: "\u8BB0\u4E00\u7B14\u660E\u7EC6" }), _jsx("button", { type: "button", onClick: onClose, children: "\u53D6\u6D88" }), _jsx("button", { type: "button", className: "is-primary", onClick: onClose, children: "\u786E\u5B9A" })] })] }) }));
}
function TopbarServicePanel({ onClose }) {
    return (_jsxs("aside", { className: "topbar-service-panel", role: "dialog", "aria-label": "\u8DEF\u5BA2\u4E91AI\u5BA2\u670D", children: [_jsxs("header", { children: [_jsx("strong", { children: "\u8DEF\u5BA2\u4E91AI\u5BA2\u670D" }), _jsx("button", { type: "button", "aria-label": "\u5173\u95ED\u5BA2\u670D", onClick: onClose, children: "\u00D7" })] }), _jsx("div", { className: "topbar-service-message", children: "\u60A8\u597D\uFF0C\u6211\u662F\u8DEF\u5BA2\u4E91AI\u5BA2\u670D\uFF0C\u5F88\u9AD8\u5174\u4E3A\u60A8\u670D\u52A1" }), _jsxs("div", { className: "topbar-service-questions", children: [_jsx("span", { children: "\u60A8\u53EF\u4EE5\u4E0B\u65B9\u8F93\u5165\u60A8\u8981\u54A8\u8BE2\u7684\u5185\u5BB9!" }), _jsx("button", { type: "button", children: "\u5982\u4F55\u8C03\u6574\u623F\u4EF7?" }), _jsx("button", { type: "button", children: "\u5982\u4F55\u8C03\u6574\u623F\u6001?" }), _jsx("button", { type: "button", children: "\u5982\u4F55\u76F4\u8FDE\u6E20\u9053?" })] }), _jsxs("div", { className: "topbar-service-input", children: [_jsx(Link, { to: "/scrm/wechatService/manage", onClick: onClose, children: "\u4EBA\u5DE5\u5BA2\u670D" }), _jsx("button", { type: "button", children: "\u53D1 \u9001" })] })] }));
}
function TopbarIcon({ type }) {
    switch (type) {
        case 'message':
            return (_jsxs("svg", { viewBox: "0 0 24 24", "aria-hidden": "true", children: [_jsx("path", { d: "M5 6.5h14v9H9.5L6 18.5v-3H5z" }), _jsx("path", { d: "M8.5 10.5h.01M12 10.5h.01M15.5 10.5h.01" })] }));
        case 'payment':
            return (_jsxs("svg", { viewBox: "0 0 24 24", "aria-hidden": "true", children: [_jsx("path", { d: "M5 5h14v14H5z" }), _jsx("path", { d: "M8 9h8M9 13h6M12 8v8" })] }));
        case 'reception':
            return (_jsxs("svg", { viewBox: "0 0 24 24", "aria-hidden": "true", children: [_jsx("path", { d: "M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z" }), _jsx("path", { d: "M4 21c.8-4 3.5-6 8-6h2.5" }), _jsx("path", { d: "M16 16h5M18.5 13.5 21 16l-2.5 2.5" })] }));
        case 'key':
            return (_jsxs("svg", { viewBox: "0 0 24 24", "aria-hidden": "true", children: [_jsx("path", { d: "M8.5 14a4.5 4.5 0 1 1 3.8-2.1L21 3.2" }), _jsx("path", { d: "M16.5 7.7 19 10.2M14.4 9.8l2 2" }), _jsx("circle", { cx: "8.5", cy: "14", r: "1" })] }));
        case 'service':
            return (_jsxs("svg", { viewBox: "0 0 24 24", "aria-hidden": "true", children: [_jsx("path", { d: "M5 13v-2a7 7 0 0 1 14 0v2" }), _jsx("path", { d: "M5 13h3v5H5zM16 13h3v5h-3z" }), _jsx("path", { d: "M16 18c-.7 2-2 3-4 3" })] }));
        case 'notice':
            return (_jsxs("svg", { viewBox: "0 0 24 24", "aria-hidden": "true", children: [_jsx("path", { d: "M6 17h12l-1.4-2.1V11a4.6 4.6 0 0 0-9.2 0v3.9z" }), _jsx("path", { d: "M10 20h4" })] }));
        case 'user':
            return (_jsxs("svg", { viewBox: "0 0 24 24", "aria-hidden": "true", children: [_jsx("circle", { cx: "12", cy: "8", r: "4" }), _jsx("path", { d: "M4.5 21a7.8 7.8 0 0 1 15 0" })] }));
        case 'chevron':
            return (_jsx("svg", { viewBox: "0 0 24 24", "aria-hidden": "true", children: _jsx("path", { d: "m7 9 5 5 5-5" }) }));
        default:
            return null;
    }
}
