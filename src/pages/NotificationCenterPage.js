import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './NotificationCenterPage.css';
const PAGE_SIZE = 20;
const CATEGORIES = [
    { key: 'order', label: '订单通知' },
    { key: 'alert', label: '门店预警' },
    { key: 'activity', label: '门店动态' },
];
const CATEGORY_DATA = {
    order: {
        totalCount: 2154,
        items: [
            {
                id: 'order-001',
                category: 'order',
                title: '新订单提醒',
                content: '您有1笔新的飞猪酒店店订单，请及时接待！（杨大胜 +8619806533611） 点击处理>>',
                time: '2026-05-23 12:53:28',
                status: 'unread',
                highlight: true,
            },
            {
                id: 'order-002',
                category: 'order',
                title: '订单费用变更提醒',
                content: '您有一笔飞猪酒店订单费用发生变更，请及时跟进处理（杨大胜） 点击处理>>',
                time: '2026-05-23 12:53:28',
                status: 'unread',
                highlight: true,
            },
            {
                id: 'order-003',
                category: 'order',
                title: '新订单提醒',
                content: '您有1笔新的飞猪酒店店订单，请及时接待！（黄国辉 +8617328513805） 点击处理>>',
                time: '2026-05-22 22:18:40',
                status: 'read',
            },
            {
                id: 'order-004',
                category: 'order',
                title: '订单费用变更提醒',
                content: '您有一笔飞猪酒店订单费用发生变更，请及时跟进处理（黄国辉） 点击处理>>',
                time: '2026-05-22 22:18:40',
                status: 'read',
            },
            {
                id: 'order-005',
                category: 'order',
                title: '新订单提醒',
                content: '您有1笔新的携程订单，请及时接待！（杨大胜） 点击处理>>',
                time: '2026-05-22 19:41:14',
                status: 'read',
            },
            {
                id: 'order-006',
                category: 'order',
                title: '新订单提醒',
                content: '您有1笔新的飞猪酒店订单，请及时接待！（吴卫兵） 点击处理>>',
                time: '2026-05-22 17:23:50',
                status: 'read',
            },
            {
                id: 'order-007',
                category: 'order',
                title: '订单费用变更提醒',
                content: '您有一笔飞猪酒店订单费用发生变更，请及时跟进处理（吴卫兵） 点击处理>>',
                time: '2026-05-22 17:23:50',
                status: 'read',
            },
            {
                id: 'order-008',
                category: 'order',
                title: '待接单提醒',
                content: '您有1笔路客云聚合订单，请及时跟进处理！（朱小波 051286660337178370） 点击处理>>',
                time: '2026-05-19 15:42:16',
                status: 'read',
            },
            {
                id: 'order-009',
                category: 'order',
                title: '住宿订单取消预订提醒',
                content: '您有1笔携程订单取消，请及时查看！（葛菲流） 点击处理>>',
                time: '2026-05-19 01:48:56',
                status: 'read',
            },
            {
                id: 'order-010',
                category: 'order',
                title: '新订单提醒',
                content: '您有1笔新的携程订单，请及时接待！（葛菲流） 点击处理>>',
                time: '2026-05-19 01:25:39',
                status: 'read',
            },
            {
                id: 'order-011',
                category: 'order',
                title: '订单费用变更提醒',
                content: '您有一笔路客云聚合订单费用发生变更，请及时跟进处理（朱小波） 点击处理>>',
                time: '2026-05-19 15:42:16',
                status: 'read',
            },
            {
                id: 'order-012',
                category: 'order',
                title: '新订单提醒',
                content: '您有1笔新的路客云聚合订单，请及时接待！（朱小波 051286660337178370） 点击处理>>',
                time: '2026-05-19 15:42:18',
                status: 'read',
            },
        ],
    },
    alert: {
        totalCount: 57,
        items: [
            {
                id: 'alert-001',
                category: 'alert',
                title: '未排房提醒',
                content: '您有一笔住宿订单待排房，请及时跟进处理！（黄国辉）',
                time: '2026-05-05 15:01:43',
                status: 'read',
            },
            {
                id: 'alert-002',
                category: 'alert',
                title: '房态同步渠道失败提醒',
                content: '观影大床房房态同步美团酒店渠道失败 失败原因:渠道同步异常，请查看操作日志或联系客服！',
                time: '2026-04-30 17:50:42',
                status: 'read',
            },
            {
                id: 'alert-003',
                category: 'alert',
                title: '未排房提醒',
                content: '您有一笔住宿订单待排房，请及时跟进处理！（黄国辉 +8613163754834）',
                time: '2026-04-11 15:00:49',
                status: 'read',
            },
            {
                id: 'alert-004',
                category: 'alert',
                title: '未排房订单提醒',
                content: '您有1笔新的美团酒店订单未排房，请及时排房并接待！（黄国辉 +8613163754834）',
                time: '2026-04-11 11:30:02',
                status: 'read',
            },
            {
                id: 'alert-005',
                category: 'alert',
                title: '房价同步渠道失败提醒',
                content: '90寸4K影院丨珍藏河流桌丨深圳湾欢乐海岸宝安中心壹方城前海机场会展中心房价同步途家渠道失败提醒 失败原因:渠道同步异常，请查看操作日志或联系客服！',
                time: '2026-03-22 10:27:15',
                status: 'read',
            },
            {
                id: 'alert-006',
                category: 'alert',
                title: '未排房订单提醒',
                content: '您有1笔新的美团酒店订单未排房，请及时排房并接待！（马瑞思 +8613168074520）',
                time: '2026-03-02 21:51:11',
                status: 'read',
            },
            {
                id: 'alert-007',
                category: 'alert',
                title: '未排房订单提醒',
                content: '您有1笔新的美团酒店订单未排房，请及时排房并接待！（黄国辉 +8613163754927）',
                time: '2026-01-31 17:21:38',
                status: 'read',
            },
            {
                id: 'alert-008',
                category: 'alert',
                title: '房态同步渠道失败提醒',
                content: '天落大床房（电竞升降电脑）房态同步美团酒店渠道失败 失败原因:超时重试达到最大限制',
                time: '2025-12-24 14:05:00',
                status: 'read',
            },
            {
                id: 'alert-009',
                category: 'alert',
                title: '未排房订单提醒',
                content: '您有1笔新的途家订单未排房，请及时排房并接待！（马卓）',
                time: '2025-12-23 04:18:45',
                status: 'read',
            },
            {
                id: 'alert-010',
                category: 'alert',
                title: '未排房订单提醒',
                content: '您有1笔新的美团酒店订单未排房，请及时排房并接待！（刘系亮 +8613246628439）',
                time: '2025-12-21 23:47:33',
                status: 'read',
            },
            {
                id: 'alert-011',
                category: 'alert',
                title: '未排房提醒',
                content: '您有一笔住宿订单待排房，请及时跟进处理！（刘系亮 +8613246628439） 点击排房>>',
                time: '2025-12-21 22:13:10',
                status: 'read',
            },
            {
                id: 'alert-012',
                category: 'alert',
                title: '超售订单提醒',
                content: '您有1笔美团酒店超售订单，请及时跟进处理！（刘系亮 +8613246628439） 释放库存>> 排房>>',
                time: '2025-12-21 22:13:10',
                status: 'read',
            },
            {
                id: 'alert-013',
                category: 'alert',
                title: '未排房订单提醒',
                content: '您有1笔新的途家订单未排房，请及时排房并接待！（黄宁）',
                time: '2025-11-30 23:51:43',
                status: 'read',
            },
            {
                id: 'alert-014',
                category: 'alert',
                title: '重单提醒',
                content: '您有多笔住宿订单重单，请及时跟进处理！（刘永超 +8613164720489） 点击排房>>',
                time: '2025-10-04 19:04:40',
                status: 'read',
            },
        ],
    },
    activity: {
        totalCount: 10,
        items: [
            {
                id: 'activity-001',
                category: 'activity',
                title: '聚合分销提醒',
                content: '您的房型观影大床房，已15天无房态/房价变更，请及时维护好您的房态房价、分销状态，以免影响您的收益 查看详情>>',
                time: '2026-04-07 07:05:47',
                status: 'read',
            },
            {
                id: 'activity-002',
                category: 'activity',
                title: '聚合分销提醒',
                content: '您的房型观影大床房，已15天无房态/房价变更，请及时维护好您的房态房价、分销状态，以免影响您的收益 查看详情>>',
                time: '2026-02-04 06:51:55',
                status: 'read',
            },
            {
                id: 'activity-003',
                category: 'activity',
                title: '聚合分销提醒',
                content: '您的房型天落大床电竞套间等，已15天无房态/房价变更，请及时维护好您的房态房价、分销状态，以免影响您的收益 查看详情>>',
                time: '2025-09-26 08:28:10',
                status: 'read',
            },
            {
                id: 'activity-004',
                category: 'activity',
                title: '路客云监测到更低价',
                content: '聚合分销监测到渠道售卖有更低价，建议一键追价，最高降幅不超过20元 查看详情>>',
                time: '2025-06-20 16:17:45',
                status: 'read',
            },
            {
                id: 'activity-005',
                category: 'activity',
                title: '路客云监测到更低价',
                content: '聚合分销监测到渠道售卖有更低价，建议一键追价，最高降幅不超过20元 查看详情>>',
                time: '2025-06-20 14:15:49',
                status: 'read',
            },
            {
                id: 'activity-006',
                category: 'activity',
                title: '路客云监测到更低价',
                content: '聚合分销监测到渠道售卖有更低价，建议一键追价，最高降幅不超过20元 查看详情>>',
                time: '2025-06-18 14:15:36',
                status: 'read',
            },
            {
                id: 'activity-007',
                category: 'activity',
                title: '路客云监测到更低价',
                content: '聚合分销监测到渠道售卖有更低价，建议一键追价，最高降幅不超过20元 查看详情>>',
                time: '2025-06-17 14:16:44',
                status: 'read',
            },
            {
                id: 'activity-008',
                category: 'activity',
                title: '路客云监测到更低价',
                content: '聚合分销监测到渠道售卖有更低价，建议一键追价，最高降幅不超过20元 查看详情>>',
                time: '2025-06-16 14:15:55',
                status: 'read',
            },
            {
                id: 'activity-009',
                category: 'activity',
                title: '路客云监测到更低价',
                content: '聚合分销监测到渠道售卖有更低价，建议一键追价，最高降幅不超过20元 查看详情>>',
                time: '2025-06-14 14:22:45',
                status: 'read',
            },
            {
                id: 'activity-010',
                category: 'activity',
                title: '路客云监测到更低价',
                content: '聚合分销监测到渠道售卖有更低价，建议一键追价，最高降幅不超过20元 查看详情>>',
                time: '2025-06-13 14:15:45',
                status: 'read',
            },
        ],
    },
};
const INITIAL_ITEMS = Object.values(CATEGORY_DATA).flatMap((category) => category.items);
export function NotificationCenterPage() {
    const navigate = useNavigate();
    const [selectedCategory, setSelectedCategory] = useState('order');
    const [selectedTab, setSelectedTab] = useState('all');
    const [page, setPage] = useState(1);
    const [items, setItems] = useState(INITIAL_ITEMS);
    const categoryUnreadCounts = useMemo(() => CATEGORIES.reduce((result, category) => {
        result[category.key] = items.filter((item) => item.category === category.key && item.status === 'unread').length;
        return result;
    }, { order: 0, alert: 0, activity: 0 }), [items]);
    const unreadCount = categoryUnreadCounts[selectedCategory];
    const totalCount = CATEGORY_DATA[selectedCategory].totalCount;
    const filteredItems = useMemo(() => {
        return items.filter((item) => {
            if (item.category !== selectedCategory) {
                return false;
            }
            if (selectedTab === 'unread') {
                return item.status === 'unread';
            }
            if (selectedTab === 'read') {
                return item.status === 'read';
            }
            return true;
        });
    }, [items, selectedCategory, selectedTab]);
    useEffect(() => {
        const maxPage = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
        if (page > maxPage) {
            setPage(1);
        }
    }, [page, totalCount]);
    const pageItems = filteredItems.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
    const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
    const pageStart = totalCount === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
    const pageEnd = totalCount === 0 ? 0 : Math.min(page * PAGE_SIZE, totalCount);
    const pageNumbers = totalPages <= 5 ? Array.from({ length: totalPages }, (_, index) => index + 1) : [1, 2, 3, 4, 5];
    function handleCategoryChange(category) {
        setSelectedCategory(category);
        setSelectedTab('all');
        setPage(1);
    }
    function handleTabChange(tab) {
        setSelectedTab(tab);
        setPage(1);
    }
    function handleMarkAllRead() {
        setItems((current) => current.map((item) => ({ ...item, status: 'read', highlight: false })));
        setSelectedTab('all');
        setPage(1);
    }
    return (_jsx("div", { className: "notification-center-page", children: _jsxs("div", { className: "notification-center-page__layout", children: [_jsx("aside", { className: "notification-center-page__sidebar", "aria-label": "\u901A\u77E5\u5206\u7C7B", children: CATEGORIES.map((category) => {
                        const badge = categoryUnreadCounts[category.key];
                        return (_jsxs("button", { type: "button", className: `notification-center-page__category${selectedCategory === category.key ? ' is-active' : ''}`, "aria-pressed": selectedCategory === category.key, "aria-label": badge > 0 ? `${category.label} ${badge}` : category.label, onClick: () => handleCategoryChange(category.key), children: [_jsx("span", { children: category.label }), badge > 0 ? _jsx("em", { children: badge }) : null] }, category.key));
                    }) }), _jsxs("section", { className: "notification-center-page__panel", "aria-label": "\u901A\u77E5\u4E2D\u5FC3", children: [_jsxs("header", { className: "notification-center-page__toolbar", children: [_jsxs("div", { className: "notification-center-page__tabs", role: "tablist", "aria-label": "\u901A\u77E5\u7B5B\u9009", children: [_jsx(NotificationTab, { label: "\u5168\u90E8", ariaLabel: "\u5168\u90E8", active: selectedTab === 'all', onClick: () => handleTabChange('all') }), _jsx(NotificationTab, { label: "\u672A\u8BFB", badge: unreadCount, ariaLabel: unreadCount > 0 ? `未读 ${unreadCount}` : '未读', active: selectedTab === 'unread', onClick: () => handleTabChange('unread') }), _jsx(NotificationTab, { label: "\u5DF2\u8BFB", ariaLabel: "\u5DF2\u8BFB", active: selectedTab === 'read', onClick: () => handleTabChange('read') })] }), _jsxs("div", { className: "notification-center-page__toolbar-actions", children: [_jsx("button", { type: "button", className: "notification-center-page__primary-action", onClick: handleMarkAllRead, children: "\u4E00\u952E\u5DF2\u8BFB" }), _jsx("button", { type: "button", className: "notification-center-page__icon-action", "aria-label": "\u901A\u77E5\u8BBE\u7F6E", onClick: () => navigate('/setting/wechatPushSetting'), children: _jsx("svg", { viewBox: "0 0 24 24", "aria-hidden": "true", children: _jsx("path", { d: "M12 3.5a1 1 0 0 1 .96.71l.44 1.41a6.96 6.96 0 0 1 1.5.61l1.34-.71a1 1 0 0 1 1.16.17l1.43 1.43a1 1 0 0 1 .18 1.16l-.72 1.34c.28.47.49.97.62 1.5l1.4.44a1 1 0 0 1 .71.96v2.02a1 1 0 0 1-.71.96l-1.4.44c-.13.53-.34 1.03-.62 1.5l.72 1.34a1 1 0 0 1-.18 1.16l-1.43 1.43a1 1 0 0 1-1.16.18l-1.34-.72c-.47.28-.97.49-1.5.62l-.44 1.4a1 1 0 0 1-.96.71H10a1 1 0 0 1-.96-.71l-.44-1.4a6.96 6.96 0 0 1-1.5-.62l-1.34.72a1 1 0 0 1-1.16-.18L3.17 18.7a1 1 0 0 1-.17-1.16l.71-1.34a6.96 6.96 0 0 1-.61-1.5l-1.41-.44A1 1 0 0 1 1 13.3v-2.02a1 1 0 0 1 .71-.96l1.41-.44c.12-.53.33-1.03.61-1.5l-.71-1.34a1 1 0 0 1 .17-1.16l1.43-1.43a1 1 0 0 1 1.16-.17l1.34.71c.47-.28.97-.49 1.5-.61l.44-1.41A1 1 0 0 1 10 3.5h2Zm-1 5.25a3.25 3.25 0 1 0 0 6.5 3.25 3.25 0 0 0 0-6.5Z" }) }) })] })] }), _jsxs("div", { className: "notification-center-page__table", role: "table", "aria-label": "\u901A\u77E5\u5217\u8868", children: [_jsxs("div", { className: "notification-center-page__thead", role: "row", children: [_jsx("div", { role: "columnheader", children: "\u6807\u9898" }), _jsx("div", { role: "columnheader", children: "\u5185\u5BB9" }), _jsx("div", { role: "columnheader", children: "\u65F6\u95F4" })] }), _jsx("div", { className: "notification-center-page__tbody", children: pageItems.length > 0 ? (pageItems.map((item) => (_jsxs("div", { className: "notification-center-page__row", role: "row", children: [_jsx("div", { className: "notification-center-page__title-cell", role: "cell", children: _jsx("span", { children: item.title }) }), _jsxs("div", { className: "notification-center-page__content-cell", role: "cell", children: [item.highlight ? _jsx("i", { "aria-hidden": "true" }) : null, _jsx("span", { children: item.content })] }), _jsx("div", { className: "notification-center-page__time-cell", role: "cell", children: item.time })] }, item.id)))) : (_jsx("div", { className: "notification-center-page__empty", children: "\u8BE5\u5206\u7C7B\u6D88\u606F\u5747\u5DF2\u8BFB" })) })] }), _jsxs("footer", { className: "notification-center-page__pagination", "aria-label": "\u5206\u9875", children: [_jsx("span", { children: `第 ${pageStart}-${pageEnd} 条/总共 ${totalCount} 条` }), _jsxs("div", { className: "notification-center-page__pagination-controls", children: [_jsx("button", { type: "button", className: "notification-center-page__page-arrow", "aria-label": "\u4E0A\u4E00\u9875", disabled: page === 1, onClick: () => setPage((current) => Math.max(1, current - 1)), children: "\u2039" }), pageNumbers.map((pageNumber) => (_jsx("button", { type: "button", className: `notification-center-page__page-number${page === pageNumber ? ' is-active' : ''}`, "aria-current": page === pageNumber ? 'page' : undefined, onClick: () => setPage(pageNumber), children: pageNumber }, pageNumber))), totalPages > 5 ? _jsx("span", { className: "notification-center-page__ellipsis", children: "\u2026" }) : null, totalPages > 5 ? (_jsx("button", { type: "button", className: "notification-center-page__page-number", onClick: () => setPage(totalPages), children: totalPages })) : null, _jsx("button", { type: "button", className: "notification-center-page__page-arrow", "aria-label": "\u4E0B\u4E00\u9875", disabled: page === totalPages, onClick: () => setPage((current) => Math.min(totalPages, current + 1)), children: "\u203A" }), _jsx("button", { type: "button", className: "notification-center-page__page-size", "aria-label": "20 \u6761/\u9875", children: "20 \u6761/\u9875" })] })] })] })] }) }));
}
function NotificationTab({ label, badge, ariaLabel, active, onClick, }) {
    return (_jsxs("button", { type: "button", role: "tab", className: `notification-center-page__tab${active ? ' is-active' : ''}`, "aria-selected": active, "aria-label": ariaLabel, onClick: onClick, children: [_jsx("span", { children: label }), badge ? _jsx("em", { children: badge }) : null] }));
}
