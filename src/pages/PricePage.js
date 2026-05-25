import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import ctripIcon from '../assets/channel-icons/ctrip.png';
import meituanHomestayIcon from '../assets/channel-icons/meituan-homestay.png';
import feizhuIcon from '../assets/channel-icons/feizhu.png';
import meituanHotelIcon from '../assets/channel-icons/meituan-hotel.png';
import tujiaIcon from '../assets/channel-icons/tujia.png';
import muniaoIcon from '../assets/channel-icons/muniao.png';
import xiaozhuIcon from '../assets/channel-icons/xiaozhu.png';
import localsIcon from '../assets/channel-icons/locals.png';
import { priceDates, priceRows } from '../data/mock';
import { fetchChannelPriceRows } from '../services/channelPrice';
import { fetchCentralPrices, getCentralPriceRequestDate, } from '../services/centralPrice';
import { loadOtherPriceData } from '../services/otherPrice';
import { loadPriceBoardData } from '../services/priceBoard';
import { loadPriceComparisonDashboard, normalizePriceComparisonMockState, } from '../services/priceComparison';
import { loadRetailPriceData } from '../services/retailPrice';
import './PricePage.css';
const priceTabs = [
    { label: '中央价', path: '/houseManage/houseCale' },
    { label: '渠道RP价', path: '/houseManage/channelPrice' },
    { label: '竞争圈比价', path: '/houseManage/priceComparison' },
    { label: '门市价', path: '/houseManage/retailPrice' },
    { label: '其他价格', path: '/houseManage/otherPrice' },
    { label: '电子房价牌', path: '/houseManage/priceBoard' },
];
const primaryPriceTabs = priceTabs.slice(0, 3);
const priceBoardAssets = {
    logo: '/price-board-assets/brand-price-board-logo.png',
    overview: [
        '/price-board-assets/brand-promotion-price-card.png',
        '/price-board-assets/brand-promotion-price-card-2.png',
        '/price-board-assets/brand-promotion-price-card-3.png',
    ],
    detail: '/price-board-assets/brand-promotion-price-card-4.png',
    payQr: '/price-board-assets/price-board-buy.png',
};
const roomTypes = [
    { name: '顶层套房（浴缸巨幕电竞麻将）', base: 730, stock: '余 2 间' },
    { name: '总裁套间（桑拿浴缸露台电竞麻将）', base: 930, stock: '余 1 间' },
    { name: '天落大床电竞套间', base: 398, stock: '余 1 间' },
    { name: '观影大床房', base: 198, stock: '余 3 间' },
];
const CHANNEL_BADGE_ICON_MAP = {
    ctrip: ctripIcon,
    meituanHomestay: meituanHomestayIcon,
    feizhu: feizhuIcon,
    meituanHotel: meituanHotelIcon,
    tujia: tujiaIcon,
    muniao: muniaoIcon,
    xiaozhu: xiaozhuIcon,
    locals: localsIcon,
};
const weekdays = ['日', '一', '二', '三', '四', '五', '六'];
const channelOptions = ['全部渠道', '携程', '美团', '同程', '途家'];
const retailWeekdays = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];
const channelRpRows = [
    {
        channel: '顶层套房（浴缸巨幕电竞麻将）',
        coefficient: '0.93',
        basePrice: '869',
        prices: ['848.16', '848.16', '848.16', '848.16', '1,080.66', '1,080.66', '848.16', '848.16'],
        comparePrices: ['869', '869', '869', '869', '1,089', '1,089', '869', '869'],
        product: '顶层套间（独享浴缸麻将巨屏观影电动吊床+欧式大床）<无早>',
    },
    {
        channel: '总裁套间（桑拿浴缸露台电竞麻将）',
        coefficient: '0.93',
        basePrice: '1,089',
        prices: ['1,080.66', '1,080.66', '1,080.66', '1,080.66', '1,280.66', '1,280.66', '1,080.66', '1,080.66'],
        comparePrices: ['1,089', '1,089', '1,089', '1,089', '1,289', '1,289', '1,089', '1,089'],
        product: '总裁套间（桑拿浴缸露台电竞麻将）<无早>',
    },
    {
        channel: '观影大床房',
        coefficient: '0.93',
        basePrice: '198',
        prices: ['198', '198', '198', '198', '238', '238', '198', '198'],
        comparePrices: ['60', '60', '60', '60', '60', '60', '60', '60'],
        product: '观影大床房<无早>',
    },
];
const channelSettingRows = [
    ['美团酒店', '100'],
    ['携程酒店', '100'],
    ['飞猪酒店', '100'],
    ['美团民宿', '100'],
    ['途家(EHPq0597)', '95'],
    ['木鸟民宿', '90'],
];
const channelPlanRows = [
    ['顶层套房（浴缸巨幕电竞麻将）', '顶层套间（独享浴缸麻将巨屏观影电动吊床+欧式大床）<无早>', '848.16', '1,080.66', '设置'],
    ['', '顶层套房-独享麻将电竞浴缸-天落大床-欧式大床-不含早', '869', '1,089', '设置'],
    ['总裁套间（桑拿浴缸露台电竞麻将）', '总裁套间（桑拿浴缸露台电竞麻将）<无早>', '811.89', '995.1', '设置'],
];
const centralPriceSettings = [
    { channel: '美团酒店', percent: '100' },
    { channel: '携程酒店', percent: '100' },
    { channel: '飞猪酒店', percent: '100' },
    { channel: '美团民宿', percent: '100' },
    { channel: '途家民宿', percent: '95' },
    { channel: '木鸟民宿', percent: '90' },
];
const basePricePlannerColumns = [
    { key: 'title', label: '房型' },
    { key: 'weekday', label: '平日价' },
    { key: 'weekend', label: '周末价(五/六)' },
    { key: 'holiday', label: '节假日价' },
];
void basePricePlannerColumns;
function buildCentralPlanningRows(context) {
    return [
        {
            id: `${context.roomName}-plan`,
            title: context.roomName,
            weekday: context.actualPrice,
            weekend: context.comparePrice,
            holiday: String(Math.round((Number(context.comparePrice.replace(/,/g, '')) || 0) * 1.028) || context.comparePrice),
        },
    ];
}
function buildChannelPlanningRows(context) {
    return [
        {
            id: `${context.roomName}-ctrip`,
            title: context.roomName,
            subtitle: context.roomSubtitle,
            badgeId: 'ctrip',
            weekday: context.actualPrice,
            weekend: context.comparePrice,
            holiday: '859.14',
            secondaryWeekday: context.actualPrice,
            secondaryWeekend: context.comparePrice,
            secondaryHoliday: '859.14',
        },
        {
            id: `${context.roomName}-meituanHotel`,
            title: '总裁套间 台球电竞豪华房',
            subtitle: '电竞 艺企刚 钢铁侠之家',
            badgeId: 'meituanHotel',
            weekday: '673.89',
            weekend: '826.11',
            holiday: '849.15',
            secondaryWeekday: '673.89',
            secondaryWeekend: '826.11',
            secondaryHoliday: '849.15',
        },
        {
            id: `${context.roomName}-tujia`,
            title: '总裁套间 独享浴缸豪华房',
            subtitle: '台合球麻将 <无早>',
            badgeId: 'tujia',
            weekday: '811.89',
            weekend: '995.1',
            holiday: '1,391.28',
            secondaryWeekday: '811.89',
            secondaryWeekend: '995.1',
            secondaryHoliday: '1,391.28',
        },
        {
            id: `${context.roomName}-meituanHomestay`,
            title: '总裁套间 独享台球电竞套',
            subtitle: '浴缸氛围房台麻将 不含早',
            badgeId: 'meituanHomestay',
            weekday: '920',
            weekend: '920',
            holiday: '设置',
            secondaryWeekday: '920',
            secondaryWeekend: '920',
        },
        {
            id: `${context.roomName}-feizhu`,
            title: '总裁套间（桑拿浴缸露台电竞麻将）',
            badgeId: 'feizhu',
            weekday: '850',
            weekend: '850',
            holiday: '850',
            secondaryWeekday: '850',
            secondaryWeekend: '850',
            secondaryHoliday: '850',
        },
    ];
}
function makePriceDates(offset, startDay = 12) {
    return Array.from({ length: 30 }, (_, index) => {
        const date = new Date(2026, 4, startDay + offset + index);
        const dateLabel = `${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}`;
        return {
            label: index === 0 && offset === 0 ? '今日' : dateLabel,
            dateLabel,
            isToday: index === 0 && offset === 0,
            weekday: weekdays[date.getDay()],
            key: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`,
        };
    });
}
const calendarWeekLabels = ['一', '二', '三', '四', '五', '六', '日'];
function parseDateValue(value) {
    const [yearText, monthText, dayText] = value.split('-');
    const year = Number(yearText);
    const month = Number(monthText);
    const day = Number(dayText);
    if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day)) {
        return new Date(2026, 4, 20);
    }
    return new Date(year, month - 1, day);
}
function formatHeaderDateValue(date) {
    return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}`;
}
function ChannelBadgeIcon({ badgeId, label }) {
    const iconUrl = badgeId ? CHANNEL_BADGE_ICON_MAP[badgeId] : undefined;
    const fallbackLabel = label.trim().charAt(0) || '?';
    return (_jsxs("span", { className: "price-channel-badge", "aria-hidden": "true", children: [iconUrl ? (_jsx("img", { src: iconUrl, alt: "", loading: "lazy", onError: (event) => {
                    event.currentTarget.style.display = 'none';
                    const fallback = event.currentTarget.nextElementSibling;
                    if (fallback instanceof HTMLElement)
                        fallback.style.display = 'inline-grid';
                } })) : null, _jsx("span", { className: "price-channel-badge__fallback", style: { display: iconUrl ? 'none' : 'inline-grid' }, children: fallbackLabel })] }));
}
function buildCalendarCells(anchor) {
    const year = anchor.getFullYear();
    const month = anchor.getMonth();
    const monthStart = new Date(year, month, 1);
    const leadingDays = (monthStart.getDay() + 6) % 7;
    const gridStart = new Date(year, month, 1 - leadingDays);
    return Array.from({ length: 42 }, (_, index) => {
        const cellDate = new Date(gridStart.getFullYear(), gridStart.getMonth(), gridStart.getDate() + index);
        return {
            key: `${cellDate.getFullYear()}-${String(cellDate.getMonth() + 1).padStart(2, '0')}-${String(cellDate.getDate()).padStart(2, '0')}`,
            day: cellDate.getDate(),
            isMuted: cellDate.getMonth() !== month,
        };
    });
}
function PriceTabs({ active }) {
    const navigate = useNavigate();
    const displayTabs = primaryPriceTabs.some((tab) => tab.label === active) ? primaryPriceTabs : priceTabs;
    return (_jsx("div", { className: "segmented wrap price-tabs", "aria-label": "\u623F\u4EF7\u7BA1\u7406\u7C7B\u578B", children: displayTabs.map((tab) => (_jsx("button", { type: "button", "aria-label": tab.label === '渠道RP价' ? 'RP价页签' : undefined, className: tab.label === active ? 'is-active' : '', onClick: () => navigate(tab.path), children: tab.label }, tab.path))) }));
}
function ChannelDrawer({ title, label, onClose, children, }) {
    const dialogLabel = label ?? title;
    return (_jsx("div", { className: "channel-drawer-shell", role: "presentation", children: _jsxs("section", { className: "channel-drawer", role: "dialog", "aria-modal": "true", "aria-label": dialogLabel, children: [_jsxs("header", { children: [_jsx("h2", { children: title }), _jsx("button", { type: "button", "aria-label": `关闭${dialogLabel}`, onClick: onClose, children: "\u00D7" })] }), children] }) }));
}
function BasePricePlanningDrawer({ context, onClose, onSave, }) {
    const [settingOpen, setSettingOpen] = useState(false);
    const [planningDraftRows, setPlanningDraftRows] = useState([{ id: 1 }, { id: 2 }]);
    const isChannelRp = context.variant === 'channel-rp';
    const columns = [
        { key: 'title', label: '房型' },
        { key: 'weekday', label: '平日价' },
        { key: 'weekend', label: '周末价(五/六)' },
        { key: 'holiday', label: '节假日价' },
    ];
    const planningRows = context.planningRows.map((row) => {
        const cleanedCopy = row.badgeId === 'meituanHotel'
            ? { title: '桑拿浴缸露台球桌天落床俯瞰天轮深圳湾', subtitle: '电竞主题 双床房型' }
            : row.badgeId === 'tujia'
                ? { title: '独享浴缸桑拿露台台球麻将房', subtitle: '无早' }
                : row.badgeId === 'meituanHomestay'
                    ? { title: '独享台球电竞露台浴缸套房', subtitle: '不含早' }
                    : row.badgeId === 'feizhu'
                        ? { title: '桑拿浴缸露台电竞麻将房', subtitle: '标准售卖房型' }
                        : { title: row.title, subtitle: row.subtitle };
        return {
            ...row,
            ...cleanedCopy,
            holiday: row.holiday === '璁剧疆' ? '设置' : row.holiday,
        };
    });
    function appendPlanningDraftRow() {
        setPlanningDraftRows((current) => [...current, { id: Date.now() + current.length }]);
    }
    function removePlanningDraftRow(id) {
        setPlanningDraftRows((current) => (current.length > 1 ? current.filter((item) => item.id !== id) : current));
    }
    return (_jsxs(_Fragment, { children: [_jsx("div", { className: "price-base-planning-backdrop" }), _jsxs("section", { className: "price-base-planning-drawer", role: "dialog", "aria-modal": "false", "aria-label": "\u4EF7\u683C\u89C4\u5212", children: [_jsxs("header", { className: "price-base-planning-drawer__header", children: [_jsx("strong", { children: "\u4EF7\u683C\u89C4\u5212" }), _jsx("button", { type: "button", "aria-label": "\u5173\u95ED\u4EF7\u683C\u89C4\u5212", onClick: onClose, children: "\u00D7" })] }), _jsxs("div", { className: "price-base-planning-drawer__body", children: [_jsxs("div", { className: "price-base-planning-filters", children: [_jsx("button", { type: "button", className: "price-base-planning-filter is-active", children: "\u5168\u90E8\u95E8\u5E97" }), _jsx("button", { type: "button", className: "price-base-planning-filter", children: "\u5929\u843D\u6D74\u7F38\u7535\u7ADE\u516C\u5BD3" }), _jsx("button", { type: "button", className: "price-base-planning-filter", children: "\u6E20\u9053" }), _jsx("button", { type: "button", className: "price-base-planning-filter price-base-planning-filter--selected", children: context.roomName }), _jsx("button", { type: "button", className: "price-base-planning-filter", children: "\u623F\u578B\u6807\u7B7E" }), _jsx("label", { className: "price-base-planning-search", children: _jsx("input", { type: "text", placeholder: "\u623F\u6E90\u7F16\u7801/\u7B80\u79F0/\u6807\u9898" }) }), _jsx("button", { type: "button", className: "price-base-planning-toolbar__add", onClick: () => setSettingOpen(true), children: "+\u65B0\u589E\u89C4\u5212" })] }), _jsxs("div", { className: "price-base-planning-layout", children: [_jsxs("div", { className: "price-base-planning-table", role: "table", "aria-label": "\u4EF7\u683C\u89C4\u5212\u5217\u8868", children: [_jsx("div", { className: "price-base-planning-table__head", role: "row", children: columns.map((column) => (_jsx("div", { role: "columnheader", children: column.label }, column.key))) }), planningRows.map((row, index) => (_jsxs("div", { className: `price-base-planning-table__row${index === 0 ? ' is-group' : ''}`, role: "row", children: [_jsxs("div", { className: "price-base-planning-table__title", role: "cell", children: [_jsxs("div", { className: "price-base-planning-table__name", children: [row.badgeId ? _jsx(ChannelBadgeIcon, { badgeId: row.badgeId, label: row.title }) : null, _jsx("strong", { children: row.title })] }), row.subtitle ? _jsx("span", { children: row.subtitle }) : null] }), _jsxs("div", { role: "cell", children: [_jsx("strong", { children: row.weekday }), row.secondaryWeekday ? _jsx("span", { children: row.secondaryWeekday }) : null] }), _jsxs("div", { role: "cell", children: [_jsx("strong", { children: row.weekend }), row.secondaryWeekend ? _jsx("span", { children: row.secondaryWeekend }) : null] }), _jsxs("div", { role: "cell", className: row.holiday === '设置' ? 'is-link' : '', children: [_jsx("strong", { children: row.holiday }), row.secondaryHoliday ? _jsx("span", { children: row.secondaryHoliday }) : null] })] }, row.id)))] }), _jsx("div", { className: "price-base-planning-preview" })] })] })] }), settingOpen ? (_jsxs("section", { className: "price-base-planning-setting-drawer", role: "dialog", "aria-modal": "false", "aria-label": "\u4EF7\u683C\u89C4\u5212\u8BBE\u7F6E", children: [_jsxs("header", { className: "price-base-planning-drawer__header", children: [_jsx("strong", { children: "\u4EF7\u683C\u89C4\u5212\u8BBE\u7F6E" }), _jsx("button", { type: "button", "aria-label": "\u5173\u95ED\u4EF7\u683C\u89C4\u5212\u8BBE\u7F6E", onClick: () => setSettingOpen(false), children: "\u00D7" })] }), _jsxs("div", { className: "price-base-planning-setting-drawer__body", children: [_jsxs("div", { className: "price-base-planning-setting-grid price-base-planning-setting-grid--head", children: [_jsx("span", { children: "\u540D\u79F0" }), _jsx("span", { children: "\u5F00\u59CB\u65F6\u95F4" }), _jsx("span", { children: "\u7ED3\u675F\u65F6\u95F4" })] }), _jsxs("div", { className: "price-base-planning-setting-grid", children: [_jsx("input", { defaultValue: `${context.roomName} 周末计划` }), _jsx("input", { defaultValue: "2026-05-23" }), _jsx("input", { defaultValue: "2026-06-23" })] }), _jsx("div", { className: "price-base-planning-setting-list", children: planningDraftRows.map((item, index) => (_jsxs("div", { className: "price-base-planning-setting-row", children: [_jsxs("div", { className: "price-base-planning-setting-grid", children: [_jsx("input", { defaultValue: index === 0 ? '' : `${context.roomName} 周末计划`, placeholder: "\u8BF7\u8F93\u5165" }), _jsx("input", { defaultValue: "26.05.23" }), _jsx("input", { defaultValue: "26.05.23" })] }), _jsx("button", { type: "button", className: "price-base-planning-setting-remove", "aria-label": "\u5220\u9664\u4E00\u884C", onClick: () => removePlanningDraftRow(item.id), children: "\u00D7" })] }, item.id))) }), _jsx("button", { type: "button", className: "price-base-planning-setting-add", onClick: appendPlanningDraftRow, children: "\u6DFB\u52A0" })] }), _jsxs("footer", { className: "price-base-planning-drawer__footer", children: [_jsx("button", { type: "button", onClick: () => setSettingOpen(false), children: "\u53D6\u6D88" }), _jsx("button", { type: "button", className: "is-primary", onClick: () => {
                                    setSettingOpen(false);
                                    onSave(isChannelRp ? '渠道PR价价格规划已保存' : '中央价价格规划已保存');
                                }, children: "\u4FDD\u5B58" })] })] })) : null] }));
}
export function ChannelPriceSettings({ onClose }) {
    const [tab, setTab] = useState('setting');
    return (_jsxs(ChannelDrawer, { title: tab === 'setting' ? '价格设置' : '更新价格设置', onClose: onClose, children: [_jsxs("div", { className: "channel-drawer-tabs", children: [_jsx("button", { type: "button", className: tab === 'setting' ? 'is-active' : '', onClick: () => setTab('setting'), children: "\u4EF7\u683C\u8BBE\u7F6E" }), _jsx("button", { type: "button", className: tab === 'update' ? 'is-active' : '', onClick: () => setTab('update'), children: "\u66F4\u65B0\u4EF7\u683C\u8BBE\u7F6E" })] }), tab === 'setting' ? (_jsxs(_Fragment, { children: [_jsxs("section", { className: "channel-price-settings-section", children: [_jsx("h3", { children: "\u9875\u9762\u4EF7\u683C\u8BBE\u7F6E" }), _jsxs("div", { className: "channel-price-settings-current", children: [_jsx("span", { children: "\u5F53\u524D\u6B63\u4F7F\u7528\uFF1A" }), _jsx("strong", { children: "\u201C\u5B9E\u9645\u5356\u4EF7\u201D" }), _jsx("span", { children: "\u8C03\u4EF7" }), _jsx("button", { type: "button", children: "\u5207\u6362\u4E3A\u5212\u7EBF\u4EF7" })] })] }), _jsxs("section", { className: "channel-price-settings-section", children: [_jsx("h3", { children: "\u5212\u7EBF\u4EF7\u4E0E\u5B9E\u9645\u5356\u4EF7\u5173\u7CFB\u8BBE\u7F6E" }), _jsxs("div", { className: "channel-price-settings-hero", children: [_jsxs("article", { className: "channel-price-settings-room-card", children: [_jsx("div", { className: "channel-price-settings-room-card__media" }), _jsxs("div", { className: "channel-price-settings-room-card__copy", children: [_jsx("strong", { children: "\u5546\u52A1\u53CC\u5E8A\u623F" }), _jsx("span", { children: "2\u5F201.2\u7C73\u5355\u4EBA\u5E8A 2\u4EBA\u5165\u4F4F 28-32\u33A1" }), _jsx("span", { children: "\u65E0\u65E9\u9910 \u4EBA\u4F4F\u5F53\u592918:00\u524D\u53EF\u514D\u8D39\u53D6\u6D88" })] })] }), _jsxs("div", { className: "channel-price-settings-price-box", children: [_jsx("span", { children: "\u5212\u7EBF\u4EF7" }), _jsx("em", { children: "\u00A5522" }), _jsx("strong", { children: "\u5B9E\u9645\u5356\u4EF7" }), _jsx("b", { children: "\u00A5308" })] }), _jsxs("div", { className: "channel-price-settings-ratio-box", children: [_jsx("span", { children: "\u4F18\u60E0\u6BD4\u4F8B" }), _jsx("strong", { children: "\u5B9E\u9645\u5356\u4EF7/\u5212\u7EBF\u4EF7" }), _jsx("b", { children: "308/522" })] })] }), _jsx("div", { className: "channel-price-settings-grid", children: channelSettingRows.map(([name, value]) => (_jsxs("article", { className: "channel-price-settings-card", children: [_jsx("strong", { children: name }), _jsxs("label", { children: [_jsx("span", { children: "\u5212\u7EBF\u4EF7 = \u5B9E\u9645\u5356\u4EF7 /" }), _jsxs("div", { children: [_jsx("input", { "aria-label": `${name} 优惠比例`, defaultValue: value }), _jsx("em", { children: "%" })] })] })] }, name))) })] }), _jsxs("footer", { className: "channel-price-settings-footer", children: [_jsx("p", { children: "\u4FDD\u5B58\u4F18\u60E0\u6BD4\u4F8B\u540E\u8BF7\u68C0\u67E5\u4EF7\u683C\u51C6\u786E\uFF0C\u518D\u64CD\u4F5C\u63A8\u9001\u81F3\u6E20\u9053" }), _jsxs("div", { children: [_jsx("button", { type: "button", className: "is-primary", onClick: onClose, children: "\u4FDD\u5B58" }), _jsx("button", { type: "button", onClick: onClose, children: "\u53D6\u6D88" })] })] })] })) : (_jsxs(_Fragment, { children: [_jsxs("section", { className: "channel-price-settings-section channel-price-settings-section--update", children: [_jsxs("div", { className: "channel-price-settings-update-head", children: [_jsxs("div", { children: [_jsx("strong", { children: "\u81EA\u52A8\u66F4\u65B0\u4EF7\u683C" }), _jsx("span", { children: "\u6CE8\u610F\uFF1A\u6682\u652F\u6301\u7F8E\u56E2\u6C11\u5BBF\u548C\u9014\u5BB6" })] }), _jsx("button", { type: "button", className: "channel-price-settings-switch", "aria-pressed": "false", children: _jsx("i", {}) })] }), _jsx("p", { children: "\u5F00\u542F\u540E\uFF0C\u82E5\u6E20\u9053\u5E73\u53F0\u4EF7\u683C\u6709\u53D8\u5316\uFF0C\u5219\u81EA\u52A8\u66F4\u65B0\u81F3\u8DEF\u5BA2\u4E91\u7684\u6E20\u9053\u4E2D\u4EF7" })] }), _jsx("footer", { className: "channel-price-settings-footer channel-price-settings-footer--single", children: _jsx("div", { children: _jsx("button", { type: "button", className: "is-primary", onClick: onClose, children: "\u4FDD\u5B58" }) }) })] }))] }));
}
export function ChannelPricePlan({ onClose }) {
    return (_jsxs(ChannelDrawer, { title: "\u4EF7\u683C\u89C4\u5212", onClose: onClose, children: [_jsxs("div", { className: "channel-drawer-filterbar", children: [_jsx("button", { type: "button", className: "chip is-active", children: "\u5168\u90E8\u95E8\u5E97" }), _jsx("button", { type: "button", className: "chip", children: "\u5929\u843D\u4F1A\u5BBF\u516C\u5BD3(\u524D\u6D77\u58F9\u65B9\u57CE\u5B9D\u5B89\u4E2D\u5FC3\u5E97)" }), _jsx("button", { type: "button", className: "chip", children: "\u6E20\u9053" }), _jsx("button", { type: "button", className: "chip", children: "\u623F\u578B" }), _jsx("button", { type: "button", className: "chip", children: "\u623F\u578B\u6807\u7B7E" }), _jsx("input", { type: "text", placeholder: "\u623F\u6E90\u7F16\u7801/\u7B80\u79F0/\u6807\u9898" }), _jsx("button", { type: "button", className: "price-plan-add", children: "+\u65B0\u589E\u89C4\u5212" })] }), _jsxs("div", { className: "channel-plan-table", "aria-label": "\u4EF7\u683C\u89C4\u5212\u8868\u683C", children: [_jsxs("div", { className: "channel-plan-table__head", children: [_jsx("div", { children: "\u623F\u578B" }), _jsx("div", { children: "\u5E73\u65E5\u4EF7" }), _jsx("div", { children: "\u5468\u672B\u4EF7(\u4E94/\u516D)" }), _jsx("div", { children: "\u8282\u5047\u65E5\u4EF7" })] }), channelPlanRows.map(([room, product, weekday, weekend, holiday], index) => (_jsxs("div", { className: room ? 'is-room-start' : '', children: [_jsxs("div", { children: [room ? _jsx("strong", { children: room }) : null, _jsx("span", { children: product })] }), _jsx("div", { children: weekday }), _jsx("div", { children: weekend }), _jsx("div", { className: holiday === '设置' ? 'is-link' : '', children: holiday })] }, `${product}-${index}`)))] })] }));
}
export function ChannelBatchDrawer({ onClose }) {
    return (_jsxs(ChannelDrawer, { title: "\u6279\u91CF\u4FEE\u6539", onClose: onClose, children: [_jsxs("div", { className: "channel-batch-body", children: [_jsxs("section", { className: "channel-drawer-section", children: [_jsx("h3", { children: "\u4FEE\u6539\u7C7B\u578B" }), _jsxs("label", { children: [_jsx("input", { type: "radio", name: "channel-batch-type", defaultChecked: true }), " \u4EF7\u683C"] }), _jsxs("label", { children: [_jsx("input", { type: "radio", name: "channel-batch-type" }), " \u8C03\u6574\u4EA7\u54C1\u6BD4\u4F8B"] })] }), _jsxs("section", { className: "channel-drawer-section channel-pick-row", children: [_jsx("h3", { children: "\u9009\u62E9\u4EA7\u54C1" }), _jsx("button", { type: "button", children: "\u6DFB\u52A0\u4EA7\u54C1" }), _jsx("span", { children: "\u5DF2\u90090\u4E2A\u4EA7\u54C1" })] }), _jsxs("section", { className: "channel-drawer-section", children: [_jsx("h3", { children: "\u9009\u62E9\u65E5\u671F" }), _jsxs("div", { className: "channel-mode-switch", children: [_jsx("button", { type: "button", className: "is-active", children: "\u591A\u6BB5\u6A21\u5F0F" }), _jsx("button", { type: "button", children: "\u65E5\u5386\u6A21\u5F0F" })] }), _jsxs("div", { className: "channel-date-range", children: ["2026-05-13 ", _jsx("span", { children: "\u2192" }), " 2026-05-13"] }), _jsx("button", { type: "button", className: "channel-link-button", children: "\u6DFB\u52A0\u65F6\u95F4\u6BB5" }), _jsx("button", { type: "button", className: "channel-link-button", children: "\u4FEE\u6539\u8282\u5047\u65E5\u4EF7\u683C" })] }), _jsxs("section", { className: "channel-drawer-section channel-weekdays", children: [_jsx("h3", { children: "\u9009\u62E9\u661F\u671F" }), ['周一', '周二', '周三', '周四', '周五', '周六', '周日'].map((day) => (_jsxs("label", { children: [_jsx("input", { type: "checkbox", defaultChecked: true }), " ", day] }, day))), _jsxs("label", { children: [_jsx("input", { type: "checkbox" }), " \u5168\u9009"] })] }), _jsxs("section", { className: "channel-drawer-section", children: [_jsx("h3", { children: "\u4EF7\u683C" }), _jsxs("label", { children: [_jsx("input", { type: "radio", name: "channel-price-mode", defaultChecked: true }), " \u7EDD\u5BF9\u503C\u6539\u4EF7"] }), _jsxs("label", { children: [_jsx("input", { type: "radio", name: "channel-price-mode" }), " \u5DEE\u503C\u6539\u4EF7"] }), _jsxs("label", { children: [_jsx("input", { type: "radio", name: "channel-price-mode" }), " \u767E\u5206\u6BD4\u6539\u4EF7"] }), _jsx("input", { type: "text", placeholder: "\u8BF7\u8F93\u5165" })] })] }), _jsxs("footer", { className: "channel-drawer-footer", children: [_jsx("button", { type: "button", onClick: onClose, children: "\u4FDD\u5B58" }), _jsx("button", { type: "button", onClick: onClose, children: "\u53D6\u6D88" })] })] }));
}
export function ChannelPreviewModal({ onClose }) {
    const previewRows = [
        ['顶层套房（浴缸巨幕电竞麻将）', '*0.93', '848.16', '848.16', '1,080.66', '1,080.66'],
        ['顶层套房（浴缸巨幕电竞麻将）', '-', '730', '—', '930', '930'],
        ['桑拿浴缸百平露台台球桌天落床', '*0.9', '657', '657', '837', '837'],
    ];
    return (_jsx("div", { className: "channel-preview-backdrop", role: "presentation", onClick: onClose, children: _jsxs("section", { className: "channel-preview-modal", role: "dialog", "aria-modal": "true", "aria-label": "\u623F\u4EF7\u4FEE\u6539\u9884\u89C8", onClick: (event) => event.stopPropagation(), children: [_jsxs("header", { children: [_jsx("h2", { children: "\u623F\u4EF7\u4FEE\u6539\u9884\u89C8" }), _jsxs("div", { children: [_jsx("button", { type: "button", children: "\u4E00\u952E\u8986\u76D6" }), _jsx("button", { type: "button", onClick: onClose, children: "\u53D6\u6D88" }), _jsx("button", { type: "button", "aria-label": "\u5173\u95ED\u623F\u4EF7\u4FEE\u6539\u9884\u89C8", onClick: onClose, children: "\u00D7" })] })] }), _jsxs("div", { className: "channel-preview-grid", children: [_jsxs("div", { className: "channel-preview-grid__head", children: [_jsx("div", { children: "2026.05.13" }), _jsx("div", { children: "\u4EA7\u54C1\u7CFB\u6570" }), _jsx("div", { children: "05.13" }), _jsx("div", { children: "05.14" }), _jsx("div", { children: "05.15" }), _jsx("div", { children: "05.16" })] }), previewRows.map((row) => (_jsx("div", { children: row.map((cell) => (_jsx("div", { className: cell === '730' || cell === '930' ? 'is-diff' : '', children: cell }, cell))) }, row.join('-'))))] })] }) }));
}
export function ChannelConfirmModal({ onClose, onConfirm }) {
    return (_jsx("div", { className: "channel-confirm-backdrop", role: "presentation", onClick: onClose, children: _jsxs("section", { className: "channel-confirm-modal", role: "dialog", "aria-modal": "true", "aria-label": "\u786E\u8BA4\u4E0D\u8986\u76D6\u6E20\u9053\u4EF7\u683C", onClick: (event) => event.stopPropagation(), children: [_jsx("strong", { children: "\u662F\u5426\u786E\u8BA4\u4E0D\u4F7F\u7528\u4E2D\u592E\u4EF7\u8986\u76D6\u6E20\u9053\u623F\u578B\u4EF7\u683C\uFF1F" }), _jsx("p", { children: "\u786E\u8BA4\u4E0D\u8986\u76D6\u540E\u4E2D\u592E\u4EF7\u548C\u6E20\u9053\u4EF7\u683C\u4E4B\u95F4\u4F1A\u5B58\u5728\u90E8\u5206\u5DEE\u5F02\u3002" }), _jsxs("footer", { children: [_jsx("button", { type: "button", onClick: onClose, children: "\u53D6\u6D88" }), _jsx("button", { type: "button", onClick: onConfirm, children: "\u786E\u5B9A" })] })] }) }));
}
export function ChannelGuideOverlay({ step, onNext, onClose }) {
    return (_jsxs("div", { className: "channel-guide-layer", role: "presentation", onClick: onClose, children: [_jsxs("section", { className: "channel-guide-card", role: "dialog", "aria-modal": "true", "aria-label": "\u65B0\u624B\u6307\u5F15", onClick: (event) => event.stopPropagation(), children: [_jsx("p", { children: step === 1
                            ? '此处可设置渠道实际卖价和划线价的关系，设置好了之后将可以在路客云同时查看划线价和实际卖价。'
                            : '继续查看价格规划、批量改价和同步渠道的操作入口。' }), _jsxs("footer", { children: [_jsxs("span", { children: [step, "/5"] }), _jsx("button", { type: "button", onClick: onNext, children: "\u4E0B\u4E00\u6B65" })] })] }), _jsxs("aside", { className: "channel-guide-demo", "aria-hidden": "true", children: [_jsx("h3", { children: "\u5212\u7EBF\u4EF7\u4E0E\u552E\u5356\u4EF7\u5173\u7CFB\u8BBE\u7F6E" }), ['美团酒店', '携程酒店', '飞猪酒店', '美团民宿', '途家民宿', '木鸟民宿'].map((name) => (_jsxs("label", { children: [name, "\u5B9E\u9645\u552E\u5356\u4EF7=\u5212\u7EBF\u4EF7* ", _jsx("span", { children: "100 %" })] }, name))), _jsxs("footer", { children: [_jsx("button", { type: "button", children: "\u4FDD\u5B58" }), _jsx("button", { type: "button", children: "\u53D6\u6D88" })] })] })] }));
}
const GUIDE_STEP_CONFIG = {
    central: [
        { title: '划线价与售卖价关系设置', description: '这里先确认划线价和实际售卖价之间的换算比例，再继续后面的价格规划。', highlightClassName: 'channel-guide-highlight--settings', cardClassName: 'channel-guide-card--settings' },
        { title: '渠道系数区域', description: '这里集中展示渠道系数，方便在调整中央价前先核对各渠道的差异。', highlightClassName: 'channel-guide-highlight--coefficient', cardClassName: 'channel-guide-card--coefficient' },
        { title: '切换到渠道RP价', description: '这里可以切换到渠道RP价页面，继续查看产品系数和渠道房型价格。', highlightClassName: 'channel-guide-highlight--tab', cardClassName: 'channel-guide-card--tab' },
        { title: '中央价整行价格规划', description: '这里展示从今日开始的中央价日期价格，支持连续选择多个格子后统一改价。', highlightClassName: 'channel-guide-highlight--timeline', cardClassName: 'channel-guide-card--timeline' },
        { title: '按房型进行价格规划', description: '先在这里选择房型和日期，再通过右侧改价抽屉做批量调价。', highlightClassName: 'channel-guide-highlight--room', cardClassName: 'channel-guide-card--room' },
    ],
    'channel-rp': [
        { title: '划线价与售卖价关系设置', description: '这里设置渠道RP价使用的划线价和售卖价关系，保存后会按这个比例展示。', highlightClassName: 'channel-guide-highlight--settings', cardClassName: 'channel-guide-card--settings' },
        { title: '渠道系数区域', description: '这里展示当前渠道或产品系数，调价前可以先快速确认影响范围。', highlightClassName: 'channel-guide-highlight--coefficient', cardClassName: 'channel-guide-card--coefficient' },
        { title: '渠道RP价与产品系数', description: '这里是渠道RP价页签与产品系数入口，后续价格规划都从这里开始。', highlightClassName: 'channel-guide-highlight--tab', cardClassName: 'channel-guide-card--tab' },
        { title: '渠道RP价整行价格规划', description: '这里可以查看每天的售卖价和划线价，也支持多选后统一改价。', highlightClassName: 'channel-guide-highlight--timeline', cardClassName: 'channel-guide-card--timeline' },
        { title: '按渠道房型进行价格规划', description: '这里先选中房型对应日期，再到右侧改价抽屉中完成批量调价。', highlightClassName: 'channel-guide-highlight--room', cardClassName: 'channel-guide-card--room' },
    ],
};
function PriceGuideOverlay({ step, variant, onPrev, onNext, onClose, }) {
    const steps = GUIDE_STEP_CONFIG[variant];
    const currentStep = steps[step - 1];
    if (!currentStep)
        return null;
    const relationRows = ['美团酒店', '携程酒店', '飞猪酒店', '美团民宿', '途家民宿', '木鸟民宿'];
    const coefficientRows = [
        ['美团酒店', 'x 0.9'],
        ['木鸟', 'x 0.8'],
        ['美团民宿', 'x 0.7'],
        ['途家', 'x 1'],
        ['携程酒店', 'x 1'],
    ];
    const productRows = [
        ['舒适大床房-有早', '+40', '18点前可免费取消'],
        ['舒适大床房-无早', '+20', '18点前可免费取消'],
        ['舒适大床房-有早', '+20', '不可取消'],
        ['舒适大床房-有早', '+0', '不可取消'],
    ];
    const timelineValues = ['100', '100', '100', '100', '120', '120', '100', '100', '100', '100', '100', '120', '120', '100', '120', '100', '120', '100', '120', '120'];
    return (_jsxs("div", { className: "channel-guide-layer", role: "presentation", onClick: onClose, children: [_jsx("div", { className: "channel-guide-fog", "aria-hidden": "true" }), _jsx("div", { className: `channel-guide-highlight ${currentStep.highlightClassName}`, "aria-hidden": "true" }), step === 1 ? (_jsxs("aside", { className: "channel-guide-settings-demo", "aria-hidden": "true", children: [_jsxs("header", { children: [_jsx("strong", { children: "\u5212\u7EBF\u4EF7\u4E0E\u552E\u5356\u4EF7\u5173\u7CFB\u8BBE\u7F6E" }), _jsx("span", { children: "\u5982\u4F55\u77E5\u9053\u6E20\u9053\u4F18\u60E0\u6BD4\u4F8B" })] }), _jsx("div", { className: "channel-guide-settings-demo__list", children: relationRows.map((name) => (_jsxs("label", { className: "channel-guide-settings-demo__row", children: [_jsxs("span", { children: [name, "\u5B9E\u9645\u552E\u5356\u4EF7/\u5212\u7EBF\u4EF7*"] }), _jsxs("b", { children: [_jsx("em", { children: "100" }), _jsx("i", { children: "%" })] })] }, name))) }), _jsxs("footer", { children: [_jsx("button", { type: "button", children: "\u4FDD\u5B58" }), _jsx("button", { type: "button", className: "is-ghost", children: "\u53D6\u6D88" })] })] })) : null, step === 2 ? (_jsx("aside", { className: "channel-guide-inline-demo channel-guide-inline-demo--coefficient", "aria-hidden": "true", children: coefficientRows.map(([name, value]) => (_jsxs("div", { className: "channel-guide-inline-demo__item channel-guide-inline-demo__item--coefficient", children: [_jsx("strong", { children: name }), _jsx("span", { children: value })] }, name))) })) : null, step === 3 ? (_jsx("aside", { className: "channel-guide-inline-demo channel-guide-inline-demo--product", "aria-hidden": "true", children: productRows.map(([name, value, note]) => (_jsxs("div", { className: "channel-guide-inline-demo__item channel-guide-inline-demo__item--product", children: [_jsxs("div", { children: [_jsx("strong", { children: name }), _jsx("p", { children: note })] }), _jsx("span", { children: value })] }, `${name}-${value}-${note}`))) })) : null, step === 4 ? (_jsxs("aside", { className: "channel-guide-inline-demo channel-guide-inline-demo--timeline", "aria-hidden": "true", children: [_jsx("strong", { children: "\u4E2D\u592E\u4EF7" }), timelineValues.map((value, index) => (_jsx("span", { children: value }, `${value}-${index}`)))] })) : null, step === 5 ? (_jsxs("aside", { className: "channel-guide-inline-demo channel-guide-inline-demo--room", "aria-hidden": "true", children: [_jsx("strong", { children: "\u9AD8\u7EA7\u5927\u5E8A\u623F" }), _jsx("span", { children: "\u4E2D\u592E\u4EF7" }), _jsxs("p", { children: ["\u8BF7\u8FDB\u884C\u623F\u578B\u7684 ", _jsx("em", { children: "\u4EF7\u683C\u89C4\u5212" })] })] })) : null, _jsxs("section", { className: `channel-guide-card ${currentStep.cardClassName}`, role: "dialog", "aria-modal": "true", "aria-label": "\u65B0\u624B\u6307\u5F15", onClick: (event) => event.stopPropagation(), children: [_jsx("span", { className: "channel-guide-card__eyebrow", children: "\u65B0\u624B\u6307\u5F15" }), _jsx("h3", { children: currentStep.title }), _jsx("p", { children: currentStep.description }), _jsxs("footer", { children: [_jsxs("span", { children: [step, "/5"] }), _jsxs("div", { className: "channel-guide-card__actions", children: [step > 1 ? (_jsx("button", { type: "button", className: "is-ghost", onClick: onPrev, children: "\u4E0A\u4E00\u6B65" })) : null, _jsx("button", { type: "button", onClick: step === steps.length ? onClose : onNext, children: step === steps.length ? '知道了' : '下一步' })] })] })] })] }));
}
function SharedToolbar({ active, renderAsCentral = false, selectedStore = '全部门店', selectedChannel: controlledSelectedChannel, selectedRoom = '全部房型', selectedTag = '房型标签', onStoreChange = () => { }, onChannelChange, onRoomChange = () => { }, onTagChange = () => { }, onActionBlocked = () => { }, }) {
    const navigate = useNavigate();
    const [localSelectedChannel, setLocalSelectedChannel] = useState('渠道');
    const [toast, setToast] = useState('');
    const [batchOpen, setBatchOpen] = useState(false);
    const [settingsOpen, setSettingsOpen] = useState(false);
    const [planningOpen, setPlanningOpen] = useState(false);
    const [planningFormOpen, setPlanningFormOpen] = useState(false);
    const [smartOpen, setSmartOpen] = useState(false);
    const [previewOpen, setPreviewOpen] = useState(false);
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [guideStep, setGuideStep] = useState(0);
    const [openFilter, setOpenFilter] = useState('');
    const isCentral = renderAsCentral || active === '\u4e2d\u592e\u4ef7';
    const isChannelRp = !renderAsCentral && active === '\u6e20\u9053RP\u4ef7';
    const selectedChannel = controlledSelectedChannel ?? localSelectedChannel;
    useEffect(() => {
        if (guideStep === 1) {
            setSettingsOpen(true);
            return;
        }
        setSettingsOpen(false);
    }, [guideStep]);
    function showToast(message) {
        setToast(message);
        window.setTimeout(() => setToast(''), 1600);
    }
    function updateSelectedChannel(channel) {
        setLocalSelectedChannel(channel);
        onChannelChange?.(channel);
    }
    function showActionFeedback(message) {
        if (isCentral) {
            onActionBlocked(message);
            return;
        }
        showToast(message);
    }
    return (_jsxs("section", { className: "toolbar-card", children: [_jsxs("div", { className: "toolbar-row", children: [_jsx(PriceTabs, { active: active }), isCentral || isChannelRp ? (_jsxs("div", { className: "channel-price-mode", children: [_jsx("span", { children: "\u5F53\u524D\u901A\u8FC7" }), _jsx("strong", { children: "\"\u5B9E\u9645\u5356\u4EF7\"" }), _jsx("span", { children: "\u8FDB\u884C\u4EF7\u683C\u8C03\u63A7" })] })) : null, _jsxs("div", { className: "toolbar-actions", children: [isChannelRp ? (_jsxs(_Fragment, { children: [_jsx("button", { type: "button", onClick: () => setPreviewOpen(true), children: "\u9884\u89C8\u4E0E\u8986\u76D6" }), _jsx("button", { type: "button", onClick: () => setConfirmOpen(true), children: "\u6682\u4E0D\u5904\u7406" })] })) : null, _jsx("button", { type: "button", onClick: () => showActionFeedback(isCentral ? '同步任务已创建，渠道价格将按当前中央价更新' : '已发起同步至渠道'), children: isCentral || isChannelRp ? '同步至渠道' : '同步价格' }), isChannelRp ? (_jsxs(_Fragment, { children: [_jsx("button", { type: "button", onClick: () => navigate('/setting/localRoomTypeProductionSetting'), children: "RP\u8BBE\u7F6E" }), _jsx("button", { type: "button", onClick: () => setSettingsOpen(true), children: "\u4EF7\u683C\u8BBE\u7F6E" }), _jsx("button", { type: "button", onClick: () => setPlanningOpen(true), children: "\u4EF7\u683C\u89C4\u5212" })] })) : null, isCentral ? (_jsxs(_Fragment, { children: [_jsx("button", { type: "button", onClick: () => setSettingsOpen(true), children: "\u4EF7\u683C\u8BBE\u7F6E" }), _jsx("button", { type: "button", onClick: () => setPlanningOpen(true), children: "\u4EF7\u683C\u89C4\u5212" })] })) : null, _jsx("button", { type: "button", onClick: () => setBatchOpen(true), children: "\u6279\u91CF\u6539\u4EF7" }), isCentral ? (_jsx("button", { type: "button", onClick: () => setSmartOpen(true), children: "\u667A\u80FD\u8C03\u4EF7" })) : (_jsx("button", { type: "button", onClick: () => (isChannelRp ? setGuideStep(1) : undefined), children: isChannelRp ? '新手指引' : '操作日志' }))] })] }), isChannelRp ? _jsx("p", { className: "channel-price-alert", children: "\u6E20\u9053rp\u4EF7\u4E0E\u623F\u578B\u4EF7\u683C\u5B58\u5728\u5DEE\u5F02" }) : null, _jsxs("div", { className: "toolbar-row toolbar-filters", children: [['全部门店', '天落会宿公寓(前海壹方城宝安中心店)'].map((store) => (_jsx("button", { type: "button", className: `chip${selectedStore === store ? ' is-active' : ''}`, onClick: () => onStoreChange(store), children: store }, store))), _jsxs("div", { className: "price-filter-field", children: [_jsxs("button", { type: "button", className: `price-filter-select${openFilter === 'channel' ? ' is-active' : ''}`, onClick: () => setOpenFilter(openFilter === 'channel' ? '' : 'channel'), children: [_jsx("span", { children: selectedChannel }), _jsx("i", { "aria-hidden": "true" })] }), openFilter === 'channel' ? (_jsx("div", { className: "price-filter-popover", role: "listbox", "aria-label": "\u6E20\u9053\u7B5B\u9009", children: channelOptions.map((item) => (_jsx("button", { type: "button", role: "option", "aria-selected": selectedChannel === item, onClick: () => {
                                        updateSelectedChannel(item === '全部渠道' ? '渠道' : item);
                                        setOpenFilter('');
                                    }, children: item }, item))) })) : null] }), _jsxs("div", { className: "price-filter-field", children: [_jsxs("button", { type: "button", className: `price-filter-select${openFilter === 'room' ? ' is-active' : ''}`, onClick: () => setOpenFilter(openFilter === 'room' ? '' : 'room'), children: [_jsx("span", { children: selectedRoom }), _jsx("i", { "aria-hidden": "true" })] }), openFilter === 'room' ? (_jsx("div", { className: "price-filter-popover", "aria-label": "\u623F\u578B\u7B5B\u9009", children: roomTypes.map((item) => (_jsx("button", { type: "button", onClick: () => {
                                        onRoomChange(item.name);
                                        setOpenFilter('');
                                    }, children: item.name }, item.name))) })) : null] }), _jsxs("div", { className: "price-filter-field", children: [_jsxs("button", { type: "button", className: `price-filter-select${openFilter === 'tag' ? ' is-active' : ''}`, onClick: () => setOpenFilter(openFilter === 'tag' ? '' : 'tag'), children: [_jsx("span", { children: selectedTag }), _jsx("i", { "aria-hidden": "true" })] }), openFilter === 'tag' ? (_jsx("div", { className: "price-filter-popover", "aria-label": "\u623F\u578B\u6807\u7B7E\u7B5B\u9009", children: ['全部标签', '热卖', '电竞', '观影', '周末高价'].map((item) => (_jsx("button", { type: "button", onClick: () => {
                                        onTagChange(item === '全部标签' ? '房型标签' : item);
                                        setOpenFilter('');
                                    }, children: item }, item))) })) : null] }), _jsx("label", { className: "price-filter-search", children: _jsx("input", { type: "text", placeholder: "\u623F\u6E90\u7F16\u7801/\u7B80\u79F0/\u6807\u9898" }) }), isCentral ? (_jsx("button", { type: "button", className: "price-guide-button", onClick: () => setGuideStep(1), children: "\u65B0\u624B\u6307\u5F15" })) : null] }), false ? (_jsxs("div", { className: "price-filter-popover", role: openFilter === 'channel' ? 'listbox' : undefined, "aria-label": openFilter === 'channel' ? '渠道筛选' : undefined, children: [openFilter === 'channel'
                        ? channelOptions.map((item) => (_jsx("button", { type: "button", role: "option", "aria-selected": selectedChannel === item, onClick: () => {
                                updateSelectedChannel(item === '全部渠道' ? '渠道' : item);
                                setOpenFilter('');
                            }, children: item }, item)))
                        : null, openFilter === 'room'
                        ? roomTypes.map((item) => (_jsx("button", { type: "button", onClick: () => {
                                onRoomChange(item.name);
                                setOpenFilter('');
                            }, children: item.name }, item.name)))
                        : null, openFilter === 'tag'
                        ? ['全部标签', '热卖', '电竞', '观影', '周末高价'].map((item) => (_jsx("button", { type: "button", onClick: () => {
                                onTagChange(item === '全部标签' ? '房型标签' : item);
                                setOpenFilter('');
                            }, children: item }, item)))
                        : null] })) : null, toast ? _jsx("div", { className: "price-toast", role: "status", children: toast }) : null, settingsOpen && isChannelRp ? _jsx(ChannelPriceSettings, { onClose: () => setSettingsOpen(false) }) : null, settingsOpen && !isChannelRp ? (_jsx("div", { className: `price-modal-backdrop${isCentral ? ' price-modal-backdrop--drawer' : ''}`, role: "presentation", onClick: () => setSettingsOpen(false), children: _jsx("section", { className: `price-modal ${isCentral ? 'price-drawer price-settings-drawer' : 'price-mode-modal'}`, role: "dialog", "aria-modal": "true", "aria-label": isCentral ? '中央价价格设置' : '价格设置', onClick: (event) => event.stopPropagation(), children: isCentral ? (_jsxs(_Fragment, { children: [_jsxs("header", { children: [_jsxs("div", { className: "price-drawer-tabs", children: [_jsx("strong", { children: "\u4EF7\u683C\u8BBE\u7F6E" }), _jsx("span", { children: "\u66F4\u65B0\u4EF7\u683C\u8BBE\u7F6E" })] }), _jsx("button", { type: "button", "aria-label": "\u5173\u95ED", onClick: () => setSettingsOpen(false), children: "\u00D7" })] }), _jsxs("div", { className: "price-settings-drawer__body", children: [_jsxs("section", { className: "price-settings-current", children: [_jsx("h3", { children: "\u9875\u9762\u4EF7\u683C\u8BBE\u7F6E" }), _jsxs("p", { children: ["\u5F53\u524D\u6B63\u4F7F\u7528\uFF1A", _jsx("strong", { children: "\u201C\u5B9E\u9645\u5356\u4EF7\u201D" }), " \u8C03\u4EF7", _jsx("span", { children: "\u552E\u5356\u4EF7\u6A21\u5F0F" }), _jsx("button", { type: "button", children: "\u5207\u6362\u4E3A\u5212\u7EBF\u4EF7" })] })] }), _jsx("h3", { className: "price-drawer-subtitle", children: "\u5212\u7EBF\u4EF7\u4E0E\u5B9E\u9645\u5356\u4EF7\u5173\u7CFB\u8BBE\u7F6E" }), _jsxs("div", { className: "price-settings-example", children: [_jsxs("div", { children: [_jsx("strong", { children: "\u5546\u52A1\u53CC\u5E8A\u623F" }), _jsx("span", { children: "2\u5F201.2\u7C73\u5355\u4EBA\u5E8A 2\u4EBA\u5165\u4F4F 28-32\u33A1" }), _jsx("em", { children: "\u00A5308" })] }), _jsx("div", { children: "\u5212\u7EBF\u4EF7 \u00A5522" }), _jsx("div", { children: "\u5B9E\u9645\u5356\u4EF7 \u00A5308" }), _jsx("div", { children: "308/522" })] }), _jsx("div", { className: "price-settings-channel-grid", children: centralPriceSettings.map((item) => (_jsxs("label", { className: "price-settings-channel", children: [_jsx("span", { children: item.channel }), _jsxs("div", { children: ["\u5212\u7EBF\u4EF7 = \u5B9E\u9645\u5356\u4EF7 /", _jsx("input", { "aria-label": `${item.channel} 优惠比例`, defaultValue: item.percent }), _jsx("b", { children: "%" })] })] }, item.channel))) })] }), _jsxs("footer", { children: [_jsx("p", { children: "\u4FDD\u5B58\u4F18\u60E0\u6BD4\u4F8B\u540E\u8BF7\u68C0\u67E5\u4EF7\u683C\u51C6\u786E\uFF0C\u518D\u64CD\u4F5C\u63A8\u9001\u81F3\u6E20\u9053" }), _jsx("button", { type: "button", onClick: () => {
                                            setSettingsOpen(false);
                                            showActionFeedback('价格设置已保存，后续推送将按当前比例执行');
                                        }, children: "\u4FDD\u5B58" }), _jsx("button", { type: "button", onClick: () => setSettingsOpen(false), children: "\u53D6\u6D88" })] })] })) : (_jsxs(_Fragment, { children: [_jsxs("header", { children: [_jsxs("div", { children: [_jsx("p", { children: "\u4EF7\u683C\u8BBE\u7F6E" }), _jsx("h2", { children: isChannelRp ? '选择渠道价控价模式' : '选择中央价控价模式' })] }), _jsx("button", { type: "button", "aria-label": "\u5173\u95ED", onClick: () => setSettingsOpen(false), children: "\u00D7" })] }), _jsxs("div", { className: "price-mode-options", children: [_jsxs("button", { type: "button", className: "is-active", children: [_jsx("strong", { children: "\u552E\u5356\u4EF7\u6A21\u5F0F" }), _jsx("span", { children: "\u901A\u8FC7\u5B9E\u9645\u552E\u5356\u4EF7/\u7528\u6237\u652F\u4ED8\u4EF7\u6765\u8FDB\u884C\u4EF7\u683C\u7BA1\u63A7\uFF0C\u76EE\u6807\u9875\u63A8\u8350\u6B64\u6A21\u5F0F\u3002" })] }), _jsxs("button", { type: "button", children: [_jsx("strong", { children: "\u5212\u7EBF\u4EF7\u6A21\u5F0F" }), _jsx("span", { children: "\u901A\u8FC7\u5212\u7EBF\u4EF7\u6765\u8FDB\u884C\u4EF7\u683C\u7BA1\u63A7\uFF0C\u9002\u5408\u7EDF\u4E00\u5C55\u793A\u6298\u6263\u524D\u4EF7\u683C\u3002" })] })] }), _jsxs("footer", { children: [_jsx("button", { type: "button", onClick: () => setSettingsOpen(false), children: "\u53D6\u6D88" }), _jsx("button", { type: "button", onClick: () => setSettingsOpen(false), children: "\u786E\u5B9A" })] })] })) }) })) : null, planningOpen && isChannelRp ? _jsx(ChannelPricePlan, { onClose: () => setPlanningOpen(false) }) : null, planningOpen && !isChannelRp ? (_jsx("div", { className: `price-modal-backdrop${isCentral ? ' price-modal-backdrop--drawer' : ''}`, role: "presentation", onClick: () => setPlanningOpen(false), children: _jsxs("section", { className: `price-modal ${isCentral ? 'price-drawer price-plan-drawer' : 'price-plan-modal'}`, role: "dialog", "aria-modal": "true", "aria-label": "\u4EF7\u683C\u89C4\u5212", onClick: (event) => event.stopPropagation(), children: [_jsxs("header", { children: [_jsxs("div", { children: [isCentral ? null : _jsx("p", { children: "\u4EF7\u683C\u89C4\u5212" }), _jsx("h2", { children: "\u4EF7\u683C\u89C4\u5212" })] }), _jsx("button", { type: "button", "aria-label": "\u5173\u95ED", onClick: () => setPlanningOpen(false), children: "\u00D7" })] }), _jsxs("div", { className: "price-plan-filters", children: [_jsx("button", { type: "button", className: "chip is-active", children: "\u5168\u90E8\u95E8\u5E97" }), _jsx("button", { type: "button", className: "chip", children: "\u5929\u843D\u4F1A\u5BBF\u516C\u5BD3(\u524D\u6D77\u58F9\u65B9\u57CE\u5B9D\u5B89\u4E2D\u5FC3\u5E97)" }), _jsx("button", { type: "button", className: "chip", children: "\u9876\u5C42\u5957\u623F\uFF08\u6D74\u7F38\u5DE8\u5E55\u7535\u7ADE\u9EBB\u5C06\uFF09" }), _jsx("button", { type: "button", className: "chip", children: "\u623F\u578B\u6807\u7B7E" }), _jsx("button", { type: "button", className: "price-plan-add", onClick: () => setPlanningFormOpen(true), children: "+\u65B0\u589E\u89C4\u5212" })] }), planningFormOpen ? (_jsxs("div", { className: "price-plan-create", children: [_jsxs("label", { children: ["\u89C4\u5212\u540D\u79F0", _jsx("input", { type: "text", defaultValue: "\u5468\u672B\u9AD8\u5CF0\u4EF7" })] }), _jsxs("label", { children: ["\u9002\u7528\u65E5\u671F", _jsx("input", { type: "text", defaultValue: "2026.05.16 - 2026.06.11" })] }), _jsxs("label", { children: ["\u8C03\u4EF7\u65B9\u5F0F", _jsxs("select", { defaultValue: "weekend", children: [_jsx("option", { value: "weekend", children: "\u5468\u672B\u4E0A\u6D6E" }), _jsx("option", { value: "daily", children: "\u6BCF\u65E5\u56FA\u5B9A\u4EF7" })] })] }), _jsxs("label", { children: ["\u4E0A\u6D6E\u91D1\u989D", _jsx("input", { type: "number", defaultValue: "200" })] }), _jsxs("div", { className: "price-plan-create__actions", children: [_jsx("button", { type: "button", onClick: () => setPlanningFormOpen(false), children: "\u53D6\u6D88\u65B0\u589E" }), _jsx("button", { type: "button", onClick: () => {
                                                setPlanningFormOpen(false);
                                                setPlanningOpen(false);
                                                showActionFeedback(isCentral ? '价格规划已保存，已应用到当前筛选范围' : '价格规划已新增');
                                            }, children: "\u4FDD\u5B58\u89C4\u5212" })] })] })) : (_jsx("div", { className: "price-plan-empty", children: "\u6CA1\u6709\u76F8\u5173\u6570\u636E\u54E6\uFF01" }))] }) })) : null, smartOpen ? (_jsx("div", { className: "price-modal-backdrop", role: "presentation", onClick: () => setSmartOpen(false), children: _jsxs("section", { className: "price-modal", role: "dialog", "aria-modal": "true", "aria-label": "\u667A\u80FD\u8C03\u4EF7", onClick: (event) => event.stopPropagation(), children: [_jsxs("header", { children: [_jsxs("div", { children: [_jsx("p", { children: "\u667A\u80FD\u8C03\u4EF7" }), _jsx("h2", { children: "\u5165\u4F4F\u7387\u4F4E\u4E8E 60%" })] }), _jsx("button", { type: "button", "aria-label": "\u5173\u95ED", onClick: () => setSmartOpen(false), children: "\u00D7" })] }), _jsx("div", { className: "price-plan-empty", children: "\u5EFA\u8BAE\u4FDD\u7559\u5DE5\u4F5C\u65E5 730\uFF0C\u5468\u672B 930\uFF0C\u5E76\u540C\u6B65\u81F3\u5DF2\u5173\u8054\u6E20\u9053\u3002" }), _jsxs("footer", { children: [_jsx("button", { type: "button", onClick: () => setSmartOpen(false), children: "\u5FFD\u7565" }), _jsx("button", { type: "button", onClick: () => {
                                        setSmartOpen(false);
                                        setBatchOpen(true);
                                    }, children: "\u7ACB\u5373\u8C03\u4EF7" })] })] }) })) : null, batchOpen && isChannelRp ? _jsx(ChannelBatchDrawer, { onClose: () => setBatchOpen(false) }) : null, batchOpen && !isChannelRp ? (_jsx("div", { className: "price-modal-backdrop", role: "presentation", onClick: () => setBatchOpen(false), children: _jsxs("section", { className: "price-modal", role: "dialog", "aria-modal": "true", "aria-label": "\u6279\u91CF\u6539\u4EF7", onClick: (event) => event.stopPropagation(), children: [_jsxs("header", { children: [_jsxs("div", { children: [_jsx("p", { children: "\u6279\u91CF\u6539\u4EF7" }), _jsx("h2", { children: active })] }), _jsx("button", { type: "button", "aria-label": "\u5173\u95ED", onClick: () => setBatchOpen(false), children: "\u00D7" })] }), _jsxs("div", { className: "price-modal__form", children: [_jsxs("label", { children: ["\u751F\u6548\u8303\u56F4", _jsxs("select", { defaultValue: "current", children: [_jsx("option", { value: "current", children: "\u5F53\u524D\u7B5B\u9009\u623F\u578B\u4E0E\u6E20\u9053" }), _jsx("option", { value: "all", children: "\u5168\u90E8\u95E8\u5E97" })] })] }), _jsxs("label", { children: ["\u8C03\u4EF7\u65B9\u5F0F", _jsxs("select", { defaultValue: "fixed", children: [_jsx("option", { value: "fixed", children: "\u56FA\u5B9A\u4EF7\u683C" }), _jsx("option", { value: "increase", children: "\u4E0A\u8C03\u91D1\u989D" })] })] }), _jsxs("label", { children: [isChannelRp ? '调整后卖价' : '新价格', _jsx("input", { "aria-label": isChannelRp ? '调整后卖价' : undefined, type: "text", defaultValue: isChannelRp ? '848.16' : '730' })] }), _jsxs("label", { children: ["\u751F\u6548\u65E5\u671F", _jsx("input", { type: "text", defaultValue: "2026.05.13 - 2026.06.11" })] })] }), _jsxs("footer", { children: [_jsx("button", { type: "button", onClick: () => setBatchOpen(false), children: "\u53D6\u6D88" }), _jsx("button", { type: "button", onClick: () => {
                                        setBatchOpen(false);
                                        showActionFeedback(isCentral ? '批量改价任务已提交，当前日期范围已更新' : '批量改价已保存');
                                    }, children: "\u786E\u5B9A" })] })] }) })) : null, isChannelRp && previewOpen ? _jsx(ChannelPreviewModal, { onClose: () => setPreviewOpen(false) }) : null, isChannelRp && confirmOpen ? (_jsx(ChannelConfirmModal, { onClose: () => setConfirmOpen(false), onConfirm: () => {
                    setConfirmOpen(false);
                    showToast('已保留渠道价格');
                } })) : null, (isCentral || isChannelRp) && guideStep > 0 ? (_jsx(PriceGuideOverlay, { step: guideStep, variant: isChannelRp ? 'channel-rp' : 'central', onPrev: () => setGuideStep((current) => Math.max(1, current - 1)), onNext: () => setGuideStep((current) => Math.min(5, current + 1)), onClose: () => setGuideStep(0) })) : null] }));
}
function PriceMatrix({ mode, renderAsCentral = false, channelRows, channelState, channelDate, centralRequestDate, onCentralDateChange, onRetryChannelRequest, centralData, centralState, onRetryCentralRequest, onActionBlocked, }) {
    const centralHeaderScrollRef = useRef(null);
    const [selectedCells, setSelectedCells] = useState([]);
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [basePriceDrawerContext, setBasePriceDrawerContext] = useState(null);
    const [editMode, setEditMode] = useState('fixed');
    const [editValue, setEditValue] = useState('');
    const [collapsed, setCollapsed] = useState(false);
    const [collapsedRooms, setCollapsedRooms] = useState({});
    const [summarySwitchStates, setSummarySwitchStates] = useState({});
    const [isCentralCalendarOpen, setIsCentralCalendarOpen] = useState(false);
    const [centralCalendarMonth, setCentralCalendarMonth] = useState(() => parseDateValue(centralRequestDate ?? getCentralPriceRequestDate()));
    const [dateOffset, setDateOffset] = useState(0);
    const isChannelRp = !renderAsCentral && mode === '\u6e20\u9053RP\u4ef7';
    const isCentral = renderAsCentral || mode === '\u4e2d\u592e\u4ef7';
    const isChannelRpCentralReuse = renderAsCentral && mode === '\u6e20\u9053RP\u4ef7';
    const rows = isChannelRp
        ? (channelRows ?? channelRpRows)
        : mode === '门市价' || mode === '其他价格'
            ? roomTypes.map((room) => ({
                channel: room.name,
                coefficient: mode === '门市价' ? '门市价' : '其他价',
                basePrice: String(room.base),
                prices: priceDates.map((_, index) => String(room.base + (index > 3 ? 20 : 0))),
                comparePrices: priceDates.map(() => room.stock),
            }))
            : priceRows;
    const calendarStartDay = isChannelRp ? Number(channelDate?.slice(8, 10) ?? 16) : isCentral ? 13 : 12;
    const visibleDates = isCentral
        ? (centralData?.dates ?? makePriceDates(dateOffset, calendarStartDay))
        : isChannelRp
            ? makePriceDates(dateOffset, calendarStartDay)
            : priceDates.map((item) => ({ ...item, label: item.date, key: item.date }));
    const gridTemplateColumns = `${mode === '中央价' || isChannelRp ? '170px' : '150px'} 76px 76px repeat(${visibleDates.length}, 88px)`;
    const minWidth = 322 + visibleDates.length * 88;
    const centralFrozenPaneTemplate = '154px 48px 79px';
    const centralDateColumnWidth = 88;
    const centralGridTemplateColumns = `${centralFrozenPaneTemplate} repeat(${visibleDates.length}, ${centralDateColumnWidth}px)`;
    const centralMinWidth = 281 + visibleDates.length * centralDateColumnWidth;
    const formatDateLabel = (key) => key.slice(5).replace('-', '.');
    const centralRoomGroups = centralData?.rooms ?? [];
    const centralHeaderDateLabel = formatHeaderDateValue(parseDateValue(centralRequestDate ?? getCentralPriceRequestDate()));
    const centralCalendarCells = buildCalendarCells(centralCalendarMonth);
    const todayDateValue = getCentralPriceRequestDate();
    useEffect(() => {
        if (!isCentral || !centralRequestDate)
            return;
        setCentralCalendarMonth(parseDateValue(centralRequestDate));
    }, [centralRequestDate, isCentral]);
    useEffect(() => {
        if (!drawerOpen || selectedCells.length === 0)
            return;
        setEditMode('fixed');
        setEditValue(selectedCells[selectedCells.length - 1]?.price ?? '');
    }, [drawerOpen, selectedCells]);
    function closePriceEditor() {
        setDrawerOpen(false);
        setSelectedCells([]);
    }
    function closeBasePriceDrawer() {
        setBasePriceDrawerContext(null);
    }
    function openBasePriceDrawer(context) {
        setBasePriceDrawerContext(context);
    }
    function isCellSelected(cellKey) {
        return selectedCells.some((cell) => cell.key === cellKey);
    }
    function toggleSelectedCell(cell) {
        setSelectedCells((current) => {
            const exists = current.some((item) => item.key === cell.key);
            const next = exists ? current.filter((item) => item.key !== cell.key) : [...current, cell];
            setDrawerOpen(next.length > 0);
            return next;
        });
    }
    function toggleRoomCollapsed(roomId) {
        setCollapsedRooms((current) => ({
            ...current,
            [roomId]: !current[roomId],
        }));
    }
    function isRoomCollapsed(roomId) {
        return Boolean(collapsedRooms[roomId]);
    }
    function toggleAllCentralRooms() {
        setCollapsed((current) => {
            const next = !current;
            setCollapsedRooms(next ? Object.fromEntries(centralRoomGroups.map((room) => [room.id, true])) : {});
            return next;
        });
    }
    function getCentralBaseComparePrice(row) {
        return row.comparePrices.find((value) => value && value !== '-') ?? row.basePrice;
    }
    function handleCentralDatePicked(dateValue) {
        onCentralDateChange?.(dateValue);
        setIsCentralCalendarOpen(false);
    }
    function isSummarySwitchOn(cellKey) {
        return summarySwitchStates[cellKey] !== false;
    }
    function toggleSummarySwitch(cellKey) {
        setSummarySwitchStates((current) => ({
            ...current,
            [cellKey]: current[cellKey] === false,
        }));
    }
    function renderCentralDateMetric({ key, roomName, dateLabel, price, stock, }) {
        const switchOn = isSummarySwitchOn(key);
        return (_jsxs("div", { "data-testid": "central-summary-date-cell", className: `price-cell price-cell-button price-cell-button--summary ${isCellSelected(key) ? 'is-selected' : ''} ${switchOn ? '' : 'is-switch-off'}`, children: [_jsxs("button", { type: "button", "data-testid": "central-summary-stock-switch", className: `central-price-grid__metric-stock ${switchOn ? 'is-on' : 'is-off'}`, "aria-label": `${dateLabel}库存开关`, "aria-pressed": switchOn, onClick: () => toggleSummarySwitch(key), children: [_jsx("i", { "aria-hidden": "true" }), _jsx("em", { children: stock })] }), _jsx("button", { type: "button", className: "central-price-grid__metric-price-button", "aria-label": `${price} ${dateLabel}`, onClick: () => {
                        toggleSelectedCell({ key, title: `${roomName} / ${dateLabel}`, price, date: dateLabel });
                    }, children: _jsx("strong", { className: "central-price-grid__metric-price", children: price }) })] }, key));
    }
    function renderCentralStockOnlyMetric(key, stock) {
        return (_jsx("div", { "data-testid": "channel-rp-summary-stock-cell", className: "price-cell central-price-grid__stock-only-cell", children: _jsx("em", { children: stock }) }, key));
    }
    function renderCentralBasePriceCell(priceOrContext, comparePriceArg, testIdArg) {
        const actualPrice = typeof priceOrContext === 'string' ? priceOrContext : priceOrContext.actualPrice;
        const comparePrice = typeof priceOrContext === 'string' ? comparePriceArg ?? priceOrContext : priceOrContext.comparePrice;
        const testId = typeof priceOrContext === 'string' ? testIdArg : priceOrContext.testId;
        const onClick = typeof priceOrContext === 'string' ? undefined : priceOrContext.onClick;
        const content = (_jsxs(_Fragment, { children: [_jsxs("span", { className: "central-price-grid__tag-price", children: [_jsx("i", { className: "central-price-grid__tag", children: '\u5b9e' }), _jsx("strong", { children: actualPrice })] }), _jsxs("span", { className: "central-price-grid__tag-price central-price-grid__tag-price--muted", children: [_jsx("i", { className: "central-price-grid__tag", children: '\u5212' }), _jsx("em", { children: comparePrice })] })] }));
        if (onClick) {
            return (_jsx("button", { type: "button", className: "central-price-grid__base-price central-price-grid__base-price--button", "data-testid": testId, "aria-label": `base-price ${actualPrice} ${comparePrice}`, onClick: onClick, children: content }));
        }
        return (_jsx("div", { className: "central-price-grid__base-price", "data-testid": testId, children: content }));
    }
    function renderCentralSummaryBasePriceCell({ price, testId, onClick }) {
        if (onClick) {
            return (_jsx("button", { type: "button", className: "central-price-grid__summary-base-price", "data-testid": testId, "aria-label": `central-summary-base-price ${price}`, onClick: onClick, children: _jsxs("span", { className: "central-price-grid__tag-price central-price-grid__tag-price--summary", children: [_jsx("i", { className: "central-price-grid__tag central-price-grid__tag--central", children: '中' }), _jsx("strong", { children: price })] }) }));
        }
        return (_jsx("div", { className: "central-price-grid__summary-base-price", "data-testid": testId, children: _jsxs("span", { className: "central-price-grid__tag-price central-price-grid__tag-price--summary", children: [_jsx("i", { className: "central-price-grid__tag central-price-grid__tag--central", children: '中' }), _jsx("strong", { children: price })] }) }));
    }
    function renderCentralChannelDateCell({ key, row, dateLabel, price, comparePrice, }) {
        return (_jsxs("button", { type: "button", className: `price-cell price-cell-button ${isCellSelected(key) ? 'is-selected' : ''}`, "aria-label": `${price} ${dateLabel}`, onClick: () => {
                toggleSelectedCell({ key, title: `${row.channel} / ${dateLabel}`, price, date: dateLabel });
            }, children: [_jsx("strong", { children: price }), _jsx("span", { children: comparePrice })] }, key));
    }
    function renderCentralGroupRow(room) {
        const roomCollapsed = collapsed || isRoomCollapsed(room.id);
        const summaryComparePrice = room.prices.find((item) => item.price && item.price !== '-')?.price ?? room.basePrice;
        return (_jsxs("div", { className: "price-grid__row price-grid__row--central price-grid__group-row", style: { gridTemplateColumns: centralGridTemplateColumns, minWidth: centralMinWidth }, children: [_jsx("div", { className: "central-price-grid__frozen-cell central-price-grid__frozen-cell--group", "data-testid": "central-price-matrix-row-header", children: _jsx("div", { className: "central-price-grid__frozen-inner", style: { gridTemplateColumns: centralFrozenPaneTemplate }, children: _jsxs("button", { type: "button", className: "central-price-grid__group-toggle", "aria-expanded": !roomCollapsed, onClick: () => toggleRoomCollapsed(room.id), children: [_jsx("span", { className: "central-price-grid__group-copy", children: _jsx("strong", { children: room.name }) }), _jsx("i", { className: roomCollapsed ? 'is-collapsed' : '', "aria-hidden": "true" })] }) }) }), _jsx("div", { className: "central-price-grid__summary-gap", "aria-hidden": "true" }), _jsx("div", { children: isChannelRpCentralReuse
                        ? '-'
                        : renderCentralSummaryBasePriceCell({
                            price: room.basePrice,
                            testId: 'central-room-base-price',
                            onClick: () => openBasePriceDrawer({
                                variant: 'central',
                                roomName: room.name,
                                roomSubtitle: room.stock,
                                actualPrice: room.basePrice,
                                comparePrice: summaryComparePrice,
                                basePrice: room.basePrice,
                                planningRows: buildCentralPlanningRows({
                                    roomName: room.name,
                                    actualPrice: room.basePrice,
                                    comparePrice: summaryComparePrice,
                                }),
                            }),
                        }) }), visibleDates.map((dateItem, index) => {
                    const status = room.prices[index] ?? { price: '-', stock: '-' };
                    const dateLabel = 'dateLabel' in dateItem ? dateItem.dateLabel : formatDateLabel(dateItem.key);
                    const key = `${room.id}-summary-${dateItem.key}`;
                    return isChannelRpCentralReuse
                        ? renderCentralStockOnlyMetric(key, status.stock)
                        : renderCentralDateMetric({
                            key,
                            roomName: room.name,
                            dateLabel,
                            price: status.price,
                            stock: status.stock,
                        });
                })] }, `${room.name}-summary`));
    }
    function renderPriceRow(row, keyPrefix = '', roomContext) {
        const rowClassName = isCentral ? 'price-grid__row price-grid__row--central' : 'price-grid__row';
        if (isCentral) {
            const compareBasePrice = getCentralBaseComparePrice(row);
            return (_jsxs("div", { "data-testid": "central-channel-row", className: rowClassName, style: { gridTemplateColumns: centralGridTemplateColumns, minWidth: centralMinWidth }, children: [_jsx("div", { className: "price-room-header price-room-header--central", "data-testid": "central-price-matrix-row-header", children: _jsx("strong", { children: row.channel }) }), _jsx("div", { children: _jsx("span", { className: "central-price-grid__pill", children: row.coefficient || '-' }) }), _jsx("div", { children: renderCentralBasePriceCell({
                            actualPrice: row.basePrice,
                            comparePrice: compareBasePrice,
                            testId: 'central-channel-base-price',
                            onClick: () => openBasePriceDrawer({
                                variant: 'central',
                                roomName: roomContext?.name ?? row.channel,
                                roomSubtitle: row.product ?? roomContext?.stock ?? '当前房型价格设置',
                                channelName: row.channel,
                                coefficient: row.coefficient,
                                actualPrice: row.basePrice,
                                comparePrice: compareBasePrice,
                                basePrice: row.basePrice,
                                planningRows: buildCentralPlanningRows({
                                    roomName: roomContext?.name ?? row.channel,
                                    actualPrice: row.basePrice,
                                    comparePrice: compareBasePrice,
                                }),
                            }),
                        }) }), visibleDates.map((dateItem, index) => {
                        const price = row.prices[index % row.prices.length];
                        const comparePrice = row.comparePrices[index % row.comparePrices.length];
                        const key = `${keyPrefix}${row.channel}-${dateItem.key}`;
                        const dateLabel = 'dateLabel' in dateItem ? dateItem.dateLabel : formatDateLabel(dateItem.key);
                        return renderCentralChannelDateCell({ key, row, dateLabel, price, comparePrice });
                    })] }, `${keyPrefix}${row.channel}`));
        }
        return (_jsxs("div", { className: rowClassName, style: { gridTemplateColumns, minWidth }, children: [_jsxs("div", { className: "price-room-header", "data-testid": isCentral ? 'central-price-matrix-row-header' : undefined, children: [_jsx("strong", { children: row.channel }), row.product ? _jsx("span", { children: row.product }) : null] }), _jsx("div", { children: row.coefficient }), _jsx("div", { children: row.basePrice }), visibleDates.map((dateItem, index) => {
                    const price = row.prices[index % row.prices.length];
                    const comparePrice = row.comparePrices[index % row.comparePrices.length];
                    const key = `${keyPrefix}${row.channel}-${dateItem.key}`;
                    const dateLabel = 'dateLabel' in dateItem ? dateItem.dateLabel : formatDateLabel(dateItem.key);
                    return (_jsxs("button", { type: "button", className: `price-cell price-cell-button ${isCellSelected(key) ? 'is-selected' : ''}`, "aria-label": `${price} ${dateLabel}`, onClick: () => {
                            toggleSelectedCell({ key, title: `${row.channel} / ${dateLabel}`, price, date: dateLabel });
                        }, children: [_jsx("strong", { children: price }), _jsx("span", { children: comparePrice })] }, key));
                })] }, `${keyPrefix}${row.channel}`));
    }
    function renderCentralHeaderLeft() {
        return (_jsxs("div", { className: "central-price-grid__head-static", style: { gridTemplateColumns: centralFrozenPaneTemplate }, children: [_jsxs("div", { className: "central-price-grid__date-head", children: [_jsxs("button", { type: "button", "data-testid": "central-date-trigger", className: "central-price-grid__date-trigger", onClick: () => setIsCentralCalendarOpen((current) => !current), children: [_jsx("strong", { children: centralHeaderDateLabel }), _jsx("i", { "aria-hidden": "true" })] }), _jsx("button", { type: "button", className: "price-grid__collapse-button", onClick: toggleAllCentralRooms, children: _jsx("span", { children: collapsed ? '\u5168\u90e8\u5c55\u5f00' : '\u5168\u90e8\u6536\u8d77' }) }), isCentralCalendarOpen ? (_jsxs("div", { className: "central-price-grid__calendar-popover", role: "dialog", "aria-label": "\u4E2D\u592E\u4EF7\u65E5\u671F\u9009\u62E9", children: [_jsxs("header", { className: "central-price-grid__calendar-header", children: [_jsx("button", { type: "button", "aria-label": "\u4E0A\u4E2A\u6708", onClick: () => setCentralCalendarMonth((current) => new Date(current.getFullYear(), current.getMonth() - 1, 1)), children: "\u2039" }), _jsx("strong", { children: `${centralCalendarMonth.getFullYear()}年 ${centralCalendarMonth.getMonth() + 1}月` }), _jsx("button", { type: "button", "aria-label": "\u4E0B\u4E2A\u6708", onClick: () => setCentralCalendarMonth((current) => new Date(current.getFullYear(), current.getMonth() + 1, 1)), children: "\u203A" })] }), _jsx("div", { className: "central-price-grid__calendar-weekdays", children: calendarWeekLabels.map((label) => (_jsx("span", { children: label }, label))) }), _jsx("div", { className: "central-price-grid__calendar-days", children: centralCalendarCells.map((item) => (_jsx("button", { type: "button", "aria-label": item.key, className: [
                                            item.isMuted ? 'is-muted' : '',
                                            item.key === (centralRequestDate ?? todayDateValue) ? 'is-picked' : '',
                                        ]
                                            .filter(Boolean)
                                            .join(' '), onClick: () => handleCentralDatePicked(item.key), children: item.day }, item.key))) }), _jsx("footer", { className: "central-price-grid__calendar-footer", children: _jsx("button", { type: "button", onClick: () => {
                                            const nextToday = getCentralPriceRequestDate();
                                            setCentralCalendarMonth(parseDateValue(nextToday));
                                            handleCentralDatePicked(nextToday);
                                        }, children: "\u4ECA\u5929" }) })] })) : null] }), _jsx("div", { children: '\u6e20\u9053\u7cfb\u6570' }), _jsx("div", { children: '\u57fa\u7840\u4ef7' })] }));
    }
    function renderCentralHeaderDates() {
        return (_jsx("div", { className: "central-price-grid__head-scroll-track", children: visibleDates.map((item) => {
                const day = new Date(item.key).getDay();
                const className = [day === 0 || day === 6 ? 'is-weekend' : '', 'isToday' in item && item.isToday ? 'is-today' : '']
                    .filter(Boolean)
                    .join(' ');
                return (_jsxs("div", { className: className, children: [_jsx("strong", { children: formatDateLabel(item.key) }), 'isToday' in item && item.isToday ? _jsx("em", { children: item.label }) : null, _jsx("span", { children: item.weekday })] }, `${item.key}-${item.weekday}`));
            }) }));
    }
    function renderCentralMatrix() {
        return (_jsxs("div", { className: "central-price-grid", children: [_jsxs("div", { className: "central-price-grid__head-shell", "data-testid": "central-price-matrix-header", children: [renderCentralHeaderLeft(), _jsxs("div", { className: "central-price-grid__today-marker", "aria-hidden": "true", children: ["\u4ECA", '\n', "\u65E5"] }), _jsx("div", { ref: centralHeaderScrollRef, className: "central-price-grid__head-scroll", children: renderCentralHeaderDates() })] }), _jsx("div", { className: "central-price-grid__scroll", "data-testid": "central-price-matrix-scroll", onScroll: (event) => {
                        if (centralHeaderScrollRef.current) {
                            centralHeaderScrollRef.current.scrollLeft = event.currentTarget.scrollLeft;
                        }
                    }, children: centralState?.kind === 'success'
                        ? centralRoomGroups.map((room) => (_jsxs("div", { className: "price-grid__section", children: [renderCentralGroupRow(room), !collapsed && !isRoomCollapsed(room.id)
                                    ? room.channelRows.map((row) => renderPriceRow(row, `${room.id}-`, { name: room.name, stock: room.stock }))
                                    : null] }, room.id)))
                        : null })] }));
    }
    return (_jsxs(_Fragment, { children: [isChannelRp && channelState?.kind === 'loading' ? (_jsx("section", { className: "price-request-state", role: "status", "aria-label": "\u6E20\u9053RP\u4EF7\u52A0\u8F7D\u72B6\u6001", children: "\u6B63\u5728\u8BF7\u6C42\u6E20\u9053RP\u4EF7\u6570\u636E..." })) : null, isChannelRp && channelState?.kind === 'error' ? (_jsxs("section", { className: "price-request-state price-request-state--error", role: "alert", children: [_jsx("strong", { children: "\u6E20\u9053\u4EF7\u683C\u52A0\u8F7D\u5931\u8D25" }), _jsx("span", { children: channelState.message }), _jsx("button", { type: "button", onClick: onRetryChannelRequest, children: "\u91CD\u65B0\u52A0\u8F7D" })] })) : null, isChannelRp && channelState?.kind === 'empty' ? (_jsx("section", { className: "price-request-state", role: "status", "aria-label": "\u6E20\u9053RP\u4EF7\u7A7A\u6001", children: "\u6682\u65E0\u7B26\u5408\u5F53\u524D\u7B5B\u9009\u6761\u4EF6\u7684\u6E20\u9053RP\u4EF7\u6570\u636E\u3002" })) : null, isCentral && centralState?.kind === 'loading' ? (_jsx("section", { className: "price-loading-state", role: "status", "aria-label": "\u4E2D\u592E\u4EF7\u52A0\u8F7D\u72B6\u6001", children: "\u6B63\u5728\u52A0\u8F7D\u4E2D\u592E\u4EF7\u6570\u636E..." })) : null, isCentral && centralState?.kind === 'error' ? (_jsxs("section", { className: "price-error-state", role: "alert", "aria-label": "\u4E2D\u592E\u4EF7\u6570\u636E\u52A0\u8F7D\u5931\u8D25", children: [_jsx("strong", { children: "\u4E2D\u592E\u4EF7\u683C\u6570\u636E\u52A0\u8F7D\u5931\u8D25" }), _jsx("span", { children: centralState.message }), _jsx("button", { type: "button", onClick: onRetryCentralRequest, children: "\u91CD\u65B0\u52A0\u8F7D" })] })) : null, isCentral && centralState?.kind === 'empty' ? (_jsx("section", { className: "price-empty-state", role: "status", "aria-label": "\u4E2D\u592E\u4EF7\u7A7A\u72B6\u6001", children: "\u6682\u65E0\u4E2D\u592E\u4EF7\u6570\u636E" })) : null, _jsxs("section", { className: "table-card", children: [!isCentral ? (_jsxs("div", { className: "price-calendar-toolbar", children: [_jsxs("div", { children: [_jsx("button", { type: "button", onClick: () => setDateOffset((value) => value - 7), children: "\u4E0A\u4E00\u5468" }), _jsxs("strong", { children: ["2026.05.", String(calendarStartDay + dateOffset).padStart(2, '0'), " \u8D77"] }), _jsx("button", { type: "button", onClick: () => setDateOffset((value) => value + 7), children: "\u4E0B\u4E00\u5468" }), _jsx("button", { type: "button", onClick: () => setDateOffset(0), children: "\u4ECA\u65E5" }), _jsx("button", { type: "button", onClick: () => setCollapsed((value) => !value), children: collapsed ? '全部展开' : '全部收起' })] }), _jsx("span", { children: "\u70B9\u51FB\u4EF7\u683C\u5355\u5143\u683C\u53EF\u6253\u5F00\u6539\u4EF7\u5F39\u5C42" })] })) : null, isCentral ? (renderCentralMatrix()) : (_jsxs("div", { className: "price-grid", children: [_jsxs("div", { className: "price-grid__head", style: { gridTemplateColumns, minWidth }, children: [_jsx("div", { children: isChannelRp ? '\u5168\u90e8\u6536\u8d77' : '\u623f\u578b' }), _jsx("div", { children: isChannelRp ? '\u4ea7\u54c1\u7cfb\u6570' : '\u7cfb\u6570' }), _jsx("div", { children: isChannelRp ? '\u57fa\u7840\u4ef7' : '\u5e95\u4ef7' }), visibleDates.map((item) => (_jsxs("div", { className: ['\u516d', '\u65e5'].includes(item.weekday) ? 'is-weekend' : '', children: [_jsx("strong", { children: item.label }), _jsx("span", { children: item.weekday })] }, `${item.key}-${item.weekday}`)))] }), !collapsed && channelState?.kind !== 'error' && channelState?.kind !== 'empty'
                                ? rows.map((row) => renderPriceRow(row))
                                : null] }))] }), basePriceDrawerContext ? (_jsx(BasePricePlanningDrawer, { context: basePriceDrawerContext, onClose: closeBasePriceDrawer, onSave: (message) => {
                    closeBasePriceDrawer();
                    onActionBlocked?.(message);
                } })) : null, false ? (_jsx("div", { className: "price-base-settings-drawer-backdrop", children: _jsxs("section", { className: "price-base-settings-drawer", role: "dialog", "aria-modal": "false", "aria-label": '本房型设置', "data-testid": "central-base-price-drawer", children: [_jsxs("header", { children: [_jsx("strong", { children: '本房型设置' }), _jsx("button", { type: "button", "aria-label": '关闭本房型设置', onClick: closeBasePriceDrawer, children: '×' })] }), _jsxs("div", { className: "price-base-settings-drawer__body", children: [_jsxs("section", { className: "price-settings-current price-base-settings-current", children: [_jsx("h3", { children: '当前价格设置' }), _jsxs("p", { children: ['当前正在使用：', _jsx("strong", { children: '“实际售价”' }), ' 调价', _jsx("span", { children: '售卖价模式' }), _jsx("button", { type: "button", children: '切换为划线价' })] }), basePriceDrawerContext?.channelName ? (_jsxs("div", { className: "price-base-settings-current__meta", children: [_jsx("span", { children: basePriceDrawerContext?.channelName }), basePriceDrawerContext?.coefficient ? _jsx("em", { children: `渠道系数 ${basePriceDrawerContext?.coefficient}` }) : null] })) : null] }), _jsx("h3", { className: "price-drawer-subtitle", children: '渠道价格设置' }), _jsxs("div", { className: "price-settings-example price-settings-example--contextual", children: [_jsxs("div", { children: [_jsx("strong", { children: basePriceDrawerContext?.roomName }), _jsx("span", { children: basePriceDrawerContext?.roomSubtitle }), basePriceDrawerContext?.channelName ? _jsx("em", { children: basePriceDrawerContext?.channelName }) : null] }), _jsx("div", { children: `划线价 ￥${basePriceDrawerContext?.comparePrice ?? ''}` }), _jsx("div", { children: `实际售价 ￥${basePriceDrawerContext?.actualPrice ?? ''}` }), _jsx("div", { children: `${basePriceDrawerContext?.actualPrice ?? ''}/${basePriceDrawerContext?.comparePrice ?? ''}` })] }), _jsx("div", { className: "price-settings-channel-grid price-settings-channel-grid--contextual", children: centralPriceSettings.map((item) => (_jsxs("label", { className: `price-settings-channel${basePriceDrawerContext?.channelName === item.channel ? ' is-current' : ''}`, children: [_jsx("span", { children: item.channel }), _jsxs("div", { children: ['划线价 = 实际售价 /', _jsx("input", { "aria-label": `${item.channel} 优惠比例`, defaultValue: item.percent }), _jsx("b", { children: "%" })] })] }, item.channel))) })] }), _jsxs("footer", { children: [_jsx("p", { children: '保存优惠比例后请检查价格准确，再操作推送至渠道' }), _jsx("button", { type: "button", onClick: () => {
                                        closeBasePriceDrawer();
                                        onActionBlocked?.('本房型设置已保存，后续推送将按当前比例执行');
                                    }, children: '保存' }), _jsx("button", { type: "button", onClick: closeBasePriceDrawer, children: '取消' })] })] }) })) : null, false && basePriceDrawerContext ? (_jsx(BasePricePlanningDrawer, { context: basePriceDrawerContext, onClose: closeBasePriceDrawer, onSave: (message) => {
                    closeBasePriceDrawer();
                    onActionBlocked?.(message);
                } })) : null, false && basePriceDrawerContext ? (_jsx(BasePricePlanningDrawer, { context: basePriceDrawerContext, onClose: closeBasePriceDrawer, onSave: (message) => {
                    closeBasePriceDrawer();
                    onActionBlocked?.(message);
                } })) : null, basePriceDrawerContext ? (_jsx(BasePricePlanningDrawer, { context: basePriceDrawerContext, onClose: closeBasePriceDrawer, onSave: (message) => {
                    closeBasePriceDrawer();
                    onActionBlocked?.(message);
                } })) : null, drawerOpen && selectedCells.length > 0 && (_jsx("div", { className: "price-edit-drawer-backdrop", children: _jsxs("section", { className: "price-edit-drawer", role: "dialog", "aria-modal": "false", "aria-label": '\u6539\u4ef7', children: [_jsxs("header", { children: [_jsx("strong", { children: '\u6539\u4ef7' }), _jsx("button", { type: "button", "aria-label": '\u5173\u95ed\u6539\u4ef7', onClick: closePriceEditor, children: '\u00d7' })] }), _jsxs("div", { className: "price-edit-drawer__body", children: [_jsx("p", { className: "price-edit-drawer__selection", children: `\u5df2\u9009${selectedCells.length}\u9879` }), _jsxs("section", { className: "price-edit-card", children: [_jsx("div", { className: "price-edit-card__title", children: '\u4ef7\u683c' }), _jsx("div", { className: "price-edit-options", role: "radiogroup", "aria-label": '\u6539\u4ef7\u65b9\u5f0f', children: [
                                                { value: 'fixed', label: '\u7edd\u5bf9\u503c\u6539\u4ef7' },
                                                { value: 'increase', label: '\u5dee\u503c\u6539\u4ef7' },
                                                { value: 'percent', label: '\u767e\u5206\u6bd4\u6539\u4ef7' },
                                            ].map((option) => (_jsxs("button", { type: "button", role: "radio", "aria-checked": editMode === option.value, className: `price-edit-option${editMode === option.value ? ' is-active' : ''}`, onClick: () => setEditMode(option.value), children: [_jsx("i", { "aria-hidden": "true" }), _jsx("span", { children: option.label })] }, option.value))) }), _jsxs("label", { className: "price-edit-input", children: [_jsx("span", { className: "sr-only-heading", children: '\u6539\u4ef7\u503c' }), _jsx("input", { type: "text", "aria-label": '\u6539\u4ef7\u503c', placeholder: '\u8bf7\u8f93\u5165', value: editValue, onChange: (event) => setEditValue(event.target.value), autoFocus: true })] })] })] }), _jsxs("footer", { children: [_jsx("button", { type: "button", className: "is-primary", onClick: () => {
                                        closePriceEditor();
                                        if (isCentral)
                                            onActionBlocked?.('\u4ef7\u683c\u8c03\u6574\u5df2\u4fdd\u5b58\uff0c\u5f53\u524d\u4ef7\u683c\u77e9\u9635\u5df2\u66f4\u65b0');
                                    }, children: '\u4fdd\u5b58' }), _jsx("button", { type: "button", onClick: closePriceEditor, children: '\u53d6\u6d88' })] })] }) }))] }));
}
function ChannelRpPriceMatrix({ centralRequestDate, onCentralDateChange, centralData, centralState, onRetryCentralRequest, onActionBlocked, }) {
    const centralHeaderScrollRef = useRef(null);
    const [selectedCells, setSelectedCells] = useState([]);
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [basePriceDrawerContext, setBasePriceDrawerContext] = useState(null);
    const [editMode, setEditMode] = useState('fixed');
    const [editValue, setEditValue] = useState('');
    const [collapsed, setCollapsed] = useState(false);
    const [collapsedRooms, setCollapsedRooms] = useState({});
    const [isCentralCalendarOpen, setIsCentralCalendarOpen] = useState(false);
    const [centralCalendarMonth, setCentralCalendarMonth] = useState(() => parseDateValue(centralRequestDate ?? getCentralPriceRequestDate()));
    const visibleDates = centralData?.dates ?? makePriceDates(0, 13);
    const centralFrozenPaneTemplate = '154px 48px 79px';
    const centralDateColumnWidth = 88;
    const centralGridTemplateColumns = `${centralFrozenPaneTemplate} repeat(${visibleDates.length}, ${centralDateColumnWidth}px)`;
    const centralMinWidth = 281 + visibleDates.length * centralDateColumnWidth;
    const centralRoomGroups = centralData?.rooms ?? [];
    const centralHeaderDateLabel = formatHeaderDateValue(parseDateValue(centralRequestDate ?? getCentralPriceRequestDate()));
    const centralCalendarCells = buildCalendarCells(centralCalendarMonth);
    const todayDateValue = getCentralPriceRequestDate();
    useEffect(() => {
        if (!centralRequestDate)
            return;
        setCentralCalendarMonth(parseDateValue(centralRequestDate));
    }, [centralRequestDate]);
    useEffect(() => {
        if (!drawerOpen || selectedCells.length === 0)
            return;
        setEditMode('fixed');
        setEditValue(selectedCells[selectedCells.length - 1]?.price ?? '');
    }, [drawerOpen, selectedCells]);
    function formatDateLabel(key) {
        return key.slice(5).replace('-', '.');
    }
    function closePriceEditor() {
        setDrawerOpen(false);
        setSelectedCells([]);
    }
    function closeBasePriceDrawer() {
        setBasePriceDrawerContext(null);
    }
    function isCellSelected(cellKey) {
        return selectedCells.some((cell) => cell.key === cellKey);
    }
    function toggleSelectedCell(cell) {
        setSelectedCells((current) => {
            const exists = current.some((item) => item.key === cell.key);
            const next = exists ? current.filter((item) => item.key !== cell.key) : [...current, cell];
            setDrawerOpen(next.length > 0);
            return next;
        });
    }
    function toggleRoomCollapsed(roomId) {
        setCollapsedRooms((current) => ({
            ...current,
            [roomId]: !current[roomId],
        }));
    }
    function isRoomCollapsed(roomId) {
        return Boolean(collapsedRooms[roomId]);
    }
    function toggleAllCentralRooms() {
        setCollapsed((current) => {
            const next = !current;
            setCollapsedRooms(next ? Object.fromEntries(centralRoomGroups.map((room) => [room.id, true])) : {});
            return next;
        });
    }
    function handleCentralDatePicked(dateValue) {
        onCentralDateChange?.(dateValue);
        setIsCentralCalendarOpen(false);
    }
    function getCentralBaseComparePrice(row) {
        return row.comparePrices.find((value) => value && value !== '-') ?? row.basePrice;
    }
    function renderCentralStockOnlyMetric(key, stock) {
        return (_jsx("div", { "data-testid": "channel-rp-summary-stock-cell", className: "price-cell central-price-grid__stock-only-cell", children: _jsx("em", { children: stock }) }, key));
    }
    function renderCentralBasePriceCell(actualPrice, comparePrice, testId, onClick) {
        const content = (_jsxs(_Fragment, { children: [_jsxs("span", { className: "central-price-grid__tag-price", children: [_jsx("i", { className: "central-price-grid__tag", children: '\u5b9e' }), _jsx("strong", { children: actualPrice })] }), _jsxs("span", { className: "central-price-grid__tag-price central-price-grid__tag-price--muted", children: [_jsx("i", { className: "central-price-grid__tag", children: '\u5212' }), _jsx("em", { children: comparePrice })] })] }));
        if (onClick) {
            return (_jsx("button", { type: "button", className: "central-price-grid__base-price central-price-grid__base-price--button", "data-testid": testId, "aria-label": `base-price ${actualPrice} ${comparePrice}`, onClick: onClick, children: content }));
        }
        return (_jsx("div", { className: "central-price-grid__base-price", "data-testid": testId, children: content }));
    }
    function renderCentralSummaryBasePriceCell({ price, testId }) {
        return (_jsx("div", { className: "central-price-grid__summary-base-price", "data-testid": testId, children: _jsxs("span", { className: "central-price-grid__tag-price central-price-grid__tag-price--summary", children: [_jsx("i", { className: "central-price-grid__tag central-price-grid__tag--central", children: '中' }), _jsx("strong", { children: price })] }) }));
    }
    function renderChannelDateCell({ key, row, dateLabel, price, comparePrice, }) {
        return (_jsxs("button", { type: "button", className: `price-cell price-cell-button ${isCellSelected(key) ? 'is-selected' : ''}`, "aria-label": `${price} ${dateLabel}`, onClick: () => toggleSelectedCell({ key, title: `${row.channel} / ${dateLabel}`, price, date: dateLabel }), children: [_jsx("strong", { children: price }), _jsx("span", { children: comparePrice })] }, key));
    }
    function renderPriceRow(row, keyPrefix = '') {
        const compareBasePrice = getCentralBaseComparePrice(row);
        return (_jsxs("div", { "data-testid": "central-channel-row", className: "price-grid__row price-grid__row--central", style: { gridTemplateColumns: centralGridTemplateColumns, minWidth: centralMinWidth }, children: [_jsxs("div", { className: "price-room-header price-room-header--central price-room-header--channel-rp", "data-testid": "central-price-matrix-row-header", children: [_jsx(ChannelBadgeIcon, { badgeId: row.channelBadgeId, label: row.channel }), _jsx("strong", { children: row.product ?? row.channel })] }), _jsx("div", { children: _jsx("span", { className: "central-price-grid__pill", children: row.coefficient || '-' }) }), _jsx("div", { children: renderCentralBasePriceCell(row.basePrice, compareBasePrice, 'central-channel-base-price', () => setBasePriceDrawerContext({
                        variant: 'channel-rp',
                        roomName: row.channel,
                        roomSubtitle: row.product ?? '当前渠道房型',
                        channelName: row.channel,
                        coefficient: row.coefficient,
                        actualPrice: row.basePrice,
                        comparePrice: compareBasePrice,
                        basePrice: row.basePrice,
                        planningRows: buildChannelPlanningRows({
                            roomName: row.channel,
                            roomSubtitle: row.product ?? '当前渠道房型',
                            actualPrice: row.basePrice,
                            comparePrice: compareBasePrice,
                        }),
                    })) }), visibleDates.map((dateItem, index) => {
                    const price = row.prices[index % row.prices.length];
                    const comparePrice = row.comparePrices[index % row.comparePrices.length];
                    const dateKey = dateItem.key;
                    const key = `${keyPrefix}${row.channel}-${dateKey}`;
                    const dateLabel = 'dateLabel' in dateItem ? dateItem.dateLabel : formatDateLabel(dateKey);
                    return renderChannelDateCell({ key, row, dateLabel, price, comparePrice });
                })] }, `${keyPrefix}${row.channel}`));
    }
    function renderCentralGroupRow(room) {
        const roomCollapsed = collapsed || isRoomCollapsed(room.id);
        return (_jsxs("div", { className: "price-grid__row price-grid__row--central price-grid__group-row", style: { gridTemplateColumns: centralGridTemplateColumns, minWidth: centralMinWidth }, children: [_jsx("div", { className: "central-price-grid__frozen-cell central-price-grid__frozen-cell--group", "data-testid": "central-price-matrix-row-header", children: _jsx("div", { className: "central-price-grid__frozen-inner", style: { gridTemplateColumns: centralFrozenPaneTemplate }, children: _jsxs("button", { type: "button", className: "central-price-grid__group-toggle", "aria-expanded": !roomCollapsed, onClick: () => toggleRoomCollapsed(room.id), children: [_jsx("span", { className: "central-price-grid__group-copy", children: _jsx("strong", { children: room.name }) }), _jsx("i", { className: roomCollapsed ? 'is-collapsed' : '', "aria-hidden": "true" })] }) }) }), _jsx("div", { className: "central-price-grid__summary-gap", "aria-hidden": "true" }), _jsx("div", { children: renderCentralSummaryBasePriceCell({ price: room.basePrice, testId: 'central-room-base-price' }) }), visibleDates.map((dateItem, index) => {
                    const status = room.prices[index] ?? { price: '-', stock: '-' };
                    const key = `${room.id}-summary-${dateItem.key}`;
                    return renderCentralStockOnlyMetric(key, status.stock);
                })] }, `${room.name}-summary`));
    }
    function renderCentralHeaderLeft() {
        return (_jsxs("div", { className: "central-price-grid__head-static", style: { gridTemplateColumns: centralFrozenPaneTemplate }, children: [_jsxs("div", { className: "central-price-grid__date-head", children: [_jsxs("button", { type: "button", "data-testid": "central-date-trigger", className: "central-price-grid__date-trigger", onClick: () => setIsCentralCalendarOpen((current) => !current), children: [_jsx("strong", { children: centralHeaderDateLabel }), _jsx("i", { "aria-hidden": "true" })] }), _jsx("button", { type: "button", className: "price-grid__collapse-button", onClick: toggleAllCentralRooms, children: _jsx("span", { children: collapsed ? '\u5168\u90e8\u5c55\u5f00' : '\u5168\u90e8\u6536\u8d77' }) }), isCentralCalendarOpen ? (_jsxs("div", { className: "central-price-grid__calendar-popover", role: "dialog", "aria-label": '\u4e2d\u592e\u4ef7\u65e5\u671f\u9009\u62e9', children: [_jsxs("header", { className: "central-price-grid__calendar-header", children: [_jsx("button", { type: "button", "aria-label": '\u4e0a\u4e2a\u6708', onClick: () => setCentralCalendarMonth((current) => new Date(current.getFullYear(), current.getMonth() - 1, 1)), children: '\u2039' }), _jsx("strong", { children: `${centralCalendarMonth.getFullYear()}\u5e74 ${centralCalendarMonth.getMonth() + 1}\u6708` }), _jsx("button", { type: "button", "aria-label": '\u4e0b\u4e2a\u6708', onClick: () => setCentralCalendarMonth((current) => new Date(current.getFullYear(), current.getMonth() + 1, 1)), children: '\u203a' })] }), _jsx("div", { className: "central-price-grid__calendar-weekdays", children: calendarWeekLabels.map((label) => (_jsx("span", { children: label }, label))) }), _jsx("div", { className: "central-price-grid__calendar-days", children: centralCalendarCells.map((item) => (_jsx("button", { type: "button", "aria-label": item.key, className: [
                                            item.isMuted ? 'is-muted' : '',
                                            item.key === (centralRequestDate ?? todayDateValue) ? 'is-picked' : '',
                                        ]
                                            .filter(Boolean)
                                            .join(' '), onClick: () => handleCentralDatePicked(item.key), children: item.day }, item.key))) }), _jsx("footer", { className: "central-price-grid__calendar-footer", children: _jsx("button", { type: "button", onClick: () => {
                                            const nextToday = getCentralPriceRequestDate();
                                            setCentralCalendarMonth(parseDateValue(nextToday));
                                            handleCentralDatePicked(nextToday);
                                        }, children: '\u4eca\u5929' }) })] })) : null] }), _jsx("div", { children: '\u6e20\u9053\u7cfb\u6570' }), _jsx("div", { children: '\u57fa\u7840\u4ef7' })] }));
    }
    function renderCentralHeaderDates() {
        return (_jsx("div", { className: "central-price-grid__head-scroll-track", children: visibleDates.map((item) => {
                const day = new Date(item.key).getDay();
                const className = [day === 0 || day === 6 ? 'is-weekend' : '', 'isToday' in item && item.isToday ? 'is-today' : '']
                    .filter(Boolean)
                    .join(' ');
                return (_jsxs("div", { className: className, children: [_jsx("strong", { children: formatDateLabel(item.key) }), _jsx("span", { children: item.weekday })] }, `${item.key}-${item.weekday}`));
            }) }));
    }
    function renderMatrix() {
        return (_jsxs("div", { className: "central-price-grid", children: [_jsxs("div", { className: "central-price-grid__head-shell", "data-testid": "central-price-matrix-header", children: [renderCentralHeaderLeft(), _jsxs("div", { className: "central-price-grid__today-marker", "aria-hidden": "true", children: ["\u4ECA", '\n', "\u65E5"] }), _jsx("div", { ref: centralHeaderScrollRef, className: "central-price-grid__head-scroll", children: renderCentralHeaderDates() })] }), _jsx("div", { className: "central-price-grid__scroll", "data-testid": "central-price-matrix-scroll", onScroll: (event) => {
                        if (centralHeaderScrollRef.current) {
                            centralHeaderScrollRef.current.scrollLeft = event.currentTarget.scrollLeft;
                        }
                    }, children: centralState?.kind === 'success'
                        ? centralRoomGroups.map((room) => (_jsxs("div", { className: "price-grid__section", children: [renderCentralGroupRow(room), !collapsed && !isRoomCollapsed(room.id) ? room.channelRows.map((row) => renderPriceRow(row, `${room.id}-`)) : null] }, room.id)))
                        : null })] }));
    }
    return (_jsxs(_Fragment, { children: [centralState?.kind === 'loading' ? (_jsx("section", { className: "price-loading-state", role: "status", "aria-label": "\u6D93\uE15E\u304E\u6D60\u5CF0\u59DE\u675E\u754C\u59F8\u93AC?>", children: "\u59DD\uFF45\u6E6A\u9354\u72BA\u6D47\u6D93\uE15E\u304E\u6D60\u950B\u669F\u93B9?.." })) : null, centralState?.kind === 'error' ? (_jsxs("section", { className: "price-error-state", role: "alert", "aria-label": "\u6D93\uE15E\u304E\u6D60\u950B\u669F\u93B9\uE1BC\u59DE\u675E\u85C9\u3051\u7490?>", children: [_jsx("strong", { children: "\u6D93\uE15E\u304E\u6D60\u950B\u7278\u93C1\u7248\u5D41\u9354\u72BA\u6D47\u6FB6\u8FAB\u89E6" }), _jsx("span", { children: centralState.message }), _jsx("button", { type: "button", onClick: onRetryCentralRequest, children: "\u95B2\u5D86\u67CA\u9354\u72BA\u6D47" })] })) : null, centralState?.kind === 'empty' ? (_jsx("section", { className: "price-empty-state", role: "status", "aria-label": "\u6D93\uE15E\u304E\u6D60\u98CE\u2516\u9418\u8235\u20AC?>", children: "\u93C6\u509B\u68E4\u6D93\uE15E\u304E\u6D60\u950B\u669F\u93B9?" })) : null, _jsx("section", { className: "table-card", children: renderMatrix() }), basePriceDrawerContext ? (_jsx(BasePricePlanningDrawer, { context: basePriceDrawerContext, onClose: closeBasePriceDrawer, onSave: (message) => {
                    closeBasePriceDrawer();
                    onActionBlocked?.(message);
                } })) : null, drawerOpen && selectedCells.length > 0 && (_jsx("div", { className: "price-edit-drawer-backdrop", children: _jsxs("section", { className: "price-edit-drawer", role: "dialog", "aria-modal": "false", "aria-label": '\u6539\u4ef7', children: [_jsxs("header", { children: [_jsx("strong", { children: '\u6539\u4ef7' }), _jsx("button", { type: "button", "aria-label": '\u5173\u95ed\u6539\u4ef7', onClick: closePriceEditor, children: '\u00d7' })] }), _jsxs("div", { className: "price-edit-drawer__body", children: [_jsx("p", { className: "price-edit-drawer__selection", children: `\u5df2\u9009${selectedCells.length}\u9879` }), _jsxs("section", { className: "price-edit-card", children: [_jsx("div", { className: "price-edit-card__title", children: '\u4ef7\u683c' }), _jsx("div", { className: "price-edit-options", role: "radiogroup", "aria-label": '\u6539\u4ef7\u65b9\u5f0f', children: [
                                                { value: 'fixed', label: '\u7edd\u5bf9\u503c\u6539\u4ef7' },
                                                { value: 'increase', label: '\u5dee\u503c\u6539\u4ef7' },
                                                { value: 'percent', label: '\u767e\u5206\u6bd4\u6539\u4ef7' },
                                            ].map((option) => (_jsxs("button", { type: "button", role: "radio", "aria-checked": editMode === option.value, className: `price-edit-option${editMode === option.value ? ' is-active' : ''}`, onClick: () => setEditMode(option.value), children: [_jsx("i", { "aria-hidden": "true" }), _jsx("span", { children: option.label })] }, option.value))) }), _jsxs("label", { className: "price-edit-input", children: [_jsx("span", { className: "sr-only-heading", children: '\u6539\u4ef7\u503c' }), _jsx("input", { type: "text", "aria-label": '\u6539\u4ef7\u503c', placeholder: '\u8bf7\u8f93\u5165', value: editValue, onChange: (event) => setEditValue(event.target.value), autoFocus: true })] })] })] }), _jsxs("footer", { children: [_jsx("button", { type: "button", className: "is-primary", onClick: () => {
                                        closePriceEditor();
                                        onActionBlocked?.('\u4ef7\u683c\u8c03\u6574\u5df2\u4fdd\u5b58\uff0c\u5f53\u524d\u4ef7\u683c\u77e9\u9635\u5df2\u66f4\u65b0');
                                    }, children: '\u4fdd\u5b58' }), _jsx("button", { type: "button", onClick: closePriceEditor, children: '\u53d6\u6d88' })] })] }) }))] }));
}
function RegularPricePage({ active }) {
    const location = useLocation();
    const reuseCentralLayout = location.pathname.includes('channelPrice');
    const isCentral = active === '\u4e2d\u592e\u4ef7' || reuseCentralLayout;
    const isChannelRp = active === '\u6e20\u9053RP\u4ef7' && !reuseCentralLayout;
    const [selectedStore, setSelectedStore] = useState('全部门店');
    const [selectedChannel, setSelectedChannel] = useState('渠道');
    const [selectedRoom, setSelectedRoom] = useState('全部房型');
    const [selectedTag, setSelectedTag] = useState('房型标签');
    const [centralRequestDate, setCentralRequestDate] = useState(() => getCentralPriceRequestDate());
    const [reloadKey, setReloadKey] = useState(0);
    const [centralReloadKey, setCentralReloadKey] = useState(0);
    const [, setActionFeedback] = useState('');
    const [centralData, setCentralData] = useState();
    const [centralRequestState, setCentralRequestState] = useState({
        kind: 'idle',
        message: '等待请求中央价数据',
    });
    const [channelRequestState, setChannelRequestState] = useState({
        kind: 'loading',
        message: '等待加载渠道RP价数据',
        rows: [],
    });
    const campId = useMemo(() => new URLSearchParams(location.search).get('campId') || 'default-camp', [location.search]);
    const channelPriceProvider = useMemo(() => {
        const configured = new URLSearchParams(location.search).get('channelPriceProvider');
        return configured === 'real' ? 'real' : 'mock';
    }, [location.search]);
    const channelDate = useMemo(() => currentBusinessDate(), []);
    const centralFilters = useMemo(() => ({
        selectedStore,
        selectedChannel,
        selectedRoom,
        selectedTag,
        date: centralRequestDate,
        pageNum: 1,
        pageSize: 15,
    }), [centralRequestDate, selectedChannel, selectedRoom, selectedStore, selectedTag]);
    function normalizeChannelPriceErrorMessage(error) {
        const rawMessage = error instanceof Error ? error.message : String(error);
        if (/mock|traceId|provider/i.test(rawMessage)) {
            return '渠道RP价服务暂不可用，请稍后重试';
        }
        return rawMessage || '渠道价格加载失败，请稍后重试';
    }
    useEffect(() => {
        if (!isChannelRp)
            return;
        const controller = new AbortController();
        queueMicrotask(() => {
            if (controller.signal.aborted)
                return;
            setChannelRequestState((current) => ({
                kind: 'loading',
                message: '正在加载渠道RP价数据',
                rows: current.rows,
            }));
        });
        fetchChannelPriceRows({
            campId,
            channel: selectedChannel,
            date: channelDate,
            provider: channelPriceProvider,
        }, controller.signal)
            .then((result) => {
            const rows = result.rows;
            setChannelRequestState({
                kind: rows.length > 0 ? 'success' : 'empty',
                message: rows.length > 0 ? '渠道RP价数据已更新' : '暂无渠道RP价数据',
                rows,
            });
        })
            .catch((error) => {
            if (controller.signal.aborted)
                return;
            setChannelRequestState({
                kind: 'error',
                message: normalizeChannelPriceErrorMessage(error),
                rows: [],
            });
        });
        return () => controller.abort();
    }, [campId, channelDate, channelPriceProvider, isChannelRp, reloadKey, selectedChannel]);
    useEffect(() => {
        if (!isCentral)
            return;
        const controller = new AbortController();
        queueMicrotask(() => {
            if (!controller.signal.aborted) {
                setCentralRequestState({ kind: 'loading', message: '正在加载中央价数据' });
            }
        });
        fetchCentralPrices(centralFilters, controller.signal)
            .then((result) => {
            if (!result.ok) {
                setCentralData(undefined);
                setCentralRequestState({ kind: 'error', message: toCentralBusinessErrorMessage(result.message) });
                return;
            }
            setCentralData(result.data);
            setCentralRequestState({
                kind: result.data.rooms.length > 0 ? 'success' : 'empty',
                message: result.data.rooms.length > 0 ? '中央价数据已更新' : '暂无中央价数据',
            });
        })
            .catch((error) => {
            if (controller.signal.aborted)
                return;
            setCentralData(undefined);
            setCentralRequestState({
                kind: 'error',
                message: toCentralBusinessErrorMessage(error instanceof Error ? error.message : String(error)),
            });
        });
        return () => controller.abort();
    }, [centralFilters, centralReloadKey, isCentral]);
    return (_jsxs("div", { className: `page-stack price-page${isCentral ? ' price-page--central' : ''}`, children: [_jsx(SharedToolbar, { active: active, renderAsCentral: reuseCentralLayout, selectedStore: selectedStore, selectedChannel: selectedChannel, selectedRoom: selectedRoom, selectedTag: selectedTag, onStoreChange: setSelectedStore, onChannelChange: setSelectedChannel, onRoomChange: setSelectedRoom, onTagChange: setSelectedTag, onActionBlocked: setActionFeedback }), reuseCentralLayout ? (_jsx(ChannelRpPriceMatrix, { centralRequestDate: centralRequestDate, onCentralDateChange: setCentralRequestDate, centralData: centralData, centralState: isCentral ? centralRequestState : undefined, onRetryCentralRequest: () => setCentralReloadKey((value) => value + 1), onActionBlocked: setActionFeedback })) : (_jsx(PriceMatrix, { mode: active, channelRows: channelRequestState.rows, channelState: isChannelRp ? channelRequestState : undefined, channelDate: channelDate, centralRequestDate: centralRequestDate, onCentralDateChange: setCentralRequestDate, onRetryChannelRequest: () => setReloadKey((value) => value + 1), centralData: centralData, centralState: isCentral ? centralRequestState : undefined, onRetryCentralRequest: () => setCentralReloadKey((value) => value + 1), onActionBlocked: setActionFeedback }))] }));
}
function toCentralBusinessErrorMessage(message) {
    const normalized = message
        .replace(/mock/gi, '')
        .replace(/provider/gi, '')
        .replace(/后端/g, '数据服务')
        .replace(/接口/g, '数据')
        .replace(/阻塞/g, '失败')
        .replace(/traceId:[^)）]+[)）]?/gi, '')
        .replace(/[（）]/g, '')
        .replace(/\s+/g, ' ')
        .trim();
    return normalized || '中央价格数据加载失败，请稍后重试';
}
function currentBusinessDate() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}
function RetailFilterButton({ label, wide = false, onClick, }) {
    return (_jsxs("button", { type: "button", className: `retail-filter-button${wide ? ' retail-filter-button--wide' : ''}`, onClick: onClick, children: [_jsx("span", { children: label }), _jsx("em", { children: "\u2304" })] }));
}
function RetailEmptyState({ onSetup, note }) {
    return (_jsxs("section", { className: "retail-empty-state", "aria-label": "\u95E8\u5E02\u4EF7\u672A\u8BBE\u7F6E", children: [_jsx("div", { className: "retail-empty-illustration", "aria-hidden": "true", children: _jsx("div", {}) }), _jsx("p", { children: "\u8BF7\u5148\u5B8C\u6210\u95E8\u5E02\u4EF7\u8BBE\u7F6E" }), note ? _jsx("span", { children: note }) : null, _jsx("button", { type: "button", onClick: onSetup, children: "\u53BB\u8BBE\u7F6E" })] }));
}
function RetailSettingDrawer({ type, onClose, }) {
    if (type === 'retail') {
        return (_jsx("div", { className: "retail-drawer-backdrop", role: "presentation", children: _jsxs("section", { className: "retail-drawer", role: "dialog", "aria-modal": "true", "aria-label": "\u95E8\u5E02\u4EF7\u8BBE\u7F6E", children: [_jsxs("header", { children: [_jsx("strong", { children: "\u95E8\u5E02\u4EF7\u8BBE\u7F6E" }), _jsx("button", { type: "button", "aria-label": "\u5173\u95ED\u95E8\u5E02\u4EF7\u8BBE\u7F6E", onClick: onClose, children: "\u00D7" })] }), _jsxs("div", { className: "retail-drawer__body", children: [_jsx("div", { className: "retail-info-bar", children: "\u8BF7\u8BBE\u7F6E\u95E8\u5E02\u4EF7\u4E0E\u8DEF\u5BA2\u4E91\u4E2D\u592E\u4EF7\u7684\u5173\u7CFB" }), _jsxs("label", { className: "retail-radio-row", children: [_jsx("input", { type: "radio", name: "retail-mode", defaultChecked: true }), _jsx("span", { children: "\u95E8\u5E02\u4EF7\u7B49\u4E8E\u4E2D\u592E\u4EF7" })] }), _jsxs("label", { className: "retail-radio-row", children: [_jsx("input", { type: "radio", name: "retail-mode" }), _jsx("span", { children: "\u95E8\u5E02\u4EF7\u5173\u8054\u4E2D\u592E\u4EF7" })] }), _jsxs("div", { className: "retail-relation-row", children: [_jsx("span", { children: "\u95E8\u5E02\u4EF7=\u4E2D\u592E\u4EF7" }), _jsxs("select", { defaultValue: "+", children: [_jsx("option", { value: "+", children: "+" }), _jsx("option", { value: "-", children: "-" })] }), _jsx("input", { type: "text", "aria-label": "\u95E8\u5E02\u4EF7\u5173\u8054\u4E2D\u592E\u4EF7\u91D1\u989D", placeholder: "\u8BF7\u8F93\u5165" })] }), _jsxs("label", { className: "retail-radio-row", children: [_jsx("input", { type: "radio", name: "retail-mode" }), _jsx("span", { children: "\u95E8\u5E02\u4EF7\u4E0E\u4E2D\u592E\u4EF7\u76F8\u4E92\u72EC\u7ACB" })] })] }), _jsxs("footer", { children: [_jsx("button", { type: "button", className: "is-primary", onClick: onClose, children: "\u4FDD\u5B58" }), _jsx("button", { type: "button", onClick: onClose, children: "\u53D6\u6D88" })] })] }) }));
    }
    if (type === 'plan') {
        return (_jsx("div", { className: "retail-drawer-backdrop", role: "presentation", children: _jsxs("section", { className: "retail-drawer", role: "dialog", "aria-modal": "true", "aria-label": "\u4EF7\u683C\u89C4\u5212", children: [_jsxs("header", { children: [_jsx("strong", { children: "\u4EF7\u683C\u89C4\u5212" }), _jsx("button", { type: "button", "aria-label": "\u5173\u95ED\u4EF7\u683C\u89C4\u5212", onClick: onClose, children: "\u00D7" })] }), _jsxs("div", { className: "retail-drawer__body retail-plan-drawer", children: [_jsxs("div", { className: "retail-drawer-filters", children: [_jsx("button", { type: "button", className: "is-active", children: "\u5168\u90E8\u95E8\u5E97" }), _jsx("button", { type: "button", children: "\u5929\u843D\u4F1A\u5BBF\u516C\u5BD3(\u524D\u6D77\u58F9\u65B9\u57CE\u5B9D\u5B89\u4E2D\u5FC3\u5E97)" }), _jsx("button", { type: "button", children: "\u623F\u578B" }), _jsx("button", { type: "button", children: "\u623F\u578B\u6807\u7B7E" }), _jsx("button", { type: "button", className: "retail-add-button", children: "+\u65B0\u589E\u89C4\u5212" })] }), _jsx("div", { className: "retail-plan-empty", children: "\u6CA1\u6709\u76F8\u5173\u6570\u636E\u54E6\uFF01" })] })] }) }));
    }
    return (_jsx("div", { className: "retail-drawer-backdrop", role: "presentation", children: _jsxs("section", { className: "retail-drawer", role: "dialog", "aria-modal": "true", "aria-label": "\u6279\u91CF\u4FEE\u6539", children: [_jsxs("header", { children: [_jsx("strong", { children: "\u6279\u91CF\u4FEE\u6539" }), _jsx("button", { type: "button", "aria-label": "\u5173\u95ED\u6279\u91CF\u4FEE\u6539", onClick: onClose, children: "\u00D7" })] }), _jsxs("div", { className: "retail-drawer__body retail-batch-drawer", children: [_jsxs("section", { className: "retail-batch-section", children: [_jsx("h3", { children: "\u4FEE\u6539\u7C7B\u578B" }), _jsxs("label", { className: "retail-radio-row", children: [_jsx("input", { type: "radio", name: "batch-type", defaultChecked: true }), _jsx("span", { children: "\u4EF7\u683C" })] })] }), _jsxs("section", { className: "retail-batch-section", children: [_jsx("h3", { children: "\u9009\u62E9\u623F\u578B" }), _jsx("button", { type: "button", className: "retail-add-button", children: "\u6DFB\u52A0\u623F\u578B" }), _jsx("span", { className: "retail-selected-count", children: "\u5DF2\u90090\u4E2A\u623F\u578B" })] }), _jsxs("section", { className: "retail-batch-section", children: [_jsx("h3", { children: "\u9009\u62E9\u65E5\u671F" }), _jsxs("div", { className: "retail-mode-switch", children: [_jsx("button", { type: "button", className: "is-active", children: "\u591A\u6BB5\u6A21\u5F0F" }), _jsx("button", { type: "button", children: "\u65E5\u5386\u6A21\u5F0F" })] }), _jsxs("div", { className: "retail-date-range", children: [_jsx("span", { children: "2026-05-13" }), _jsx("em", { children: "\u2192" }), _jsx("span", { children: "2026-05-13" })] }), _jsx("button", { type: "button", className: "retail-add-button", children: "\u6DFB\u52A0\u65F6\u95F4\u6BB5" }), _jsx("button", { type: "button", className: "retail-link-button", children: "\u4FEE\u6539\u8282\u5047\u65E5\u4EF7\u683C" })] }), _jsxs("section", { className: "retail-batch-section", children: [_jsx("h3", { children: "\u9009\u62E9\u661F\u671F" }), _jsxs("div", { className: "retail-weekdays", children: [retailWeekdays.map((weekday) => (_jsxs("label", { children: [_jsx("input", { type: "checkbox", "aria-label": weekday, defaultChecked: true }), _jsx("span", { children: weekday })] }, weekday))), _jsxs("label", { children: [_jsx("input", { type: "checkbox", "aria-label": "\u5168\u9009", defaultChecked: true }), _jsx("span", { children: "\u5168\u9009" })] })] })] }), _jsxs("section", { className: "retail-batch-section", children: [_jsx("h3", { children: "\u4EF7\u683C" }), _jsxs("label", { className: "retail-radio-row", children: [_jsx("input", { type: "radio", name: "batch-price-type", defaultChecked: true }), _jsx("span", { children: "\u7EDD\u5BF9\u503C\u6539\u4EF7" })] }), _jsx("input", { type: "text", placeholder: "\u8BF7\u8F93\u5165" })] })] }), _jsxs("footer", { children: [_jsx("button", { type: "button", className: "is-primary", onClick: onClose, children: "\u4FDD\u5B58" }), _jsx("button", { type: "button", onClick: onClose, children: "\u53D6\u6D88" })] })] }) }));
}
function HourRoomSettingsPage({ onBack }) {
    return (_jsx("div", { className: "retail-hour-page", children: _jsxs("section", { className: "retail-hour-card", children: [_jsxs("div", { className: "retail-breadcrumb", children: [_jsx("button", { type: "button", onClick: onBack, children: "\u95E8\u5E02\u4EF7" }), _jsx("span", { children: "/" }), _jsx("strong", { children: "\u949F\u70B9\u623F\u8BBE\u7F6E" })] }), _jsxs("div", { className: "retail-hour-form", children: [_jsxs("div", { className: "retail-form-row", children: [_jsx("span", { className: "retail-required", children: "\u9009\u62E9\u623F\u578B\uFF1A" }), _jsx("button", { type: "button", className: "retail-add-button", children: "+\u623F\u578B" })] }), _jsxs("label", { className: "retail-form-row", children: [_jsx("span", { className: "retail-required", children: "\u4EA7\u54C1\u540D\u79F0\uFF1A" }), _jsx("input", { type: "text", "aria-label": "\u4EA7\u54C1\u540D\u79F0" })] }), _jsxs("div", { className: "retail-form-row", children: [_jsx("span", { className: "retail-required", children: "\u5165\u4F4F\u65F6\u957F\u9650\u5236\uFF1A" }), _jsxs("label", { className: "retail-inline-radio", children: [_jsx("input", { type: "radio", name: "hour-limit", "aria-label": "\u9650\u5236", defaultChecked: true }), "\u9650\u5236"] }), _jsxs("label", { className: "retail-inline-radio", children: [_jsx("input", { type: "radio", name: "hour-limit", "aria-label": "\u4E0D\u9650\u5236" }), "\u4E0D\u9650\u5236"] }), _jsx("span", { className: "retail-help-dot", children: "?" })] }), _jsxs("div", { className: "retail-form-row", children: [_jsx("span", { className: "retail-required", children: "\u5165\u4F4F\u65F6\u957F\uFF1A" }), _jsxs("button", { type: "button", className: "retail-select-field", children: ["3 \u5C0F\u65F6 ", _jsx("em", { children: "\u2304" })] })] }), _jsxs("div", { className: "retail-form-row", children: [_jsx("span", { className: "retail-required", children: "\u53EF\u5165\u4F4F\u65F6\u6BB5\uFF1A" }), _jsxs("label", { className: "retail-inline-radio", children: [_jsx("input", { type: "radio", name: "hour-range", "aria-label": "\u5168\u5929", defaultChecked: true }), "\u5168\u5929"] }), _jsxs("label", { className: "retail-inline-radio", children: [_jsx("input", { type: "radio", name: "hour-range", "aria-label": "\u81EA\u5B9A\u4E49" }), "\u81EA\u5B9A\u4E49"] }), _jsxs("button", { type: "button", className: "retail-select-field retail-select-field--small", disabled: true, children: ["10 \u70B9 ", _jsx("em", { children: "\u2304" })] }), _jsx("span", { children: "\u5230" }), _jsxs("button", { type: "button", className: "retail-select-field retail-select-field--small", disabled: true, children: ["22 \u70B9 ", _jsx("em", { children: "\u2304" })] })] }), _jsxs("div", { className: "retail-form-row", children: [_jsx("span", {}), _jsx("button", { type: "button", className: "retail-submit-button", children: "\u786E \u5B9A" })] })] })] }) }));
}
function RetailPricePage() {
    const location = useLocation();
    const navigate = useNavigate();
    const [drawer, setDrawer] = useState(null);
    const [filterOpen, setFilterOpen] = useState(null);
    const [keyword, setKeyword] = useState('');
    const [queryKeyword, setQueryKeyword] = useState('');
    const [retailData, setRetailData] = useState(null);
    const [requestError, setRequestError] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [requestRevision, setRequestRevision] = useState(0);
    const [selectedStoreId, setSelectedStoreId] = useState('');
    const [selectedRoomCategoryIds, setSelectedRoomCategoryIds] = useState([]);
    const [actionMessage, setActionMessage] = useState('');
    const [detailOpen, setDetailOpen] = useState(false);
    const [moreOpen, setMoreOpen] = useState(false);
    const requestedAt = retailData ? new Date(retailData.requestedAt).toLocaleTimeString('zh-CN', { hour12: false }) : '';
    const roomOptions = retailData?.rooms ?? [];
    const stores = retailData?.stores ?? [];
    const needsSetup = retailData?.salePriceSetting.isInitPriceDisplay === 1;
    const configuredProvider = typeof window !== 'undefined' && window.localStorage.getItem('pmsRetailPriceProvider') === 'real' ? 'real' : 'mock';
    const currentProvider = retailData?.providerName ?? configuredProvider;
    useEffect(() => {
        const controller = new AbortController();
        loadRetailPriceData({
            keyword: queryKeyword,
            poiIds: selectedStoreId ? [selectedStoreId] : [],
            roomCategoryIds: selectedRoomCategoryIds,
        }, controller.signal)
            .then((data) => {
            setRetailData(data);
        })
            .catch((error) => {
            if (controller.signal.aborted)
                return;
            const message = error instanceof Error ? error.message : '门市价数据加载失败';
            setRequestError(message.replace(/（traceId: [^）]+）/g, ''));
        })
            .finally(() => {
            if (!controller.signal.aborted)
                setIsLoading(false);
        });
        return () => controller.abort();
    }, [queryKeyword, requestRevision, selectedStoreId, selectedRoomCategoryIds]);
    function beginRetailRequest() {
        setIsLoading(true);
        setRequestError('');
    }
    function submitSearch(event) {
        event.preventDefault();
        beginRetailRequest();
        setQueryKeyword(keyword.trim());
    }
    function refreshRetailData() {
        beginRetailRequest();
        setActionMessage('正在刷新门市价数据');
        setRequestRevision((current) => current + 1);
    }
    function selectStore(poiId) {
        setSelectedStoreId(poiId);
        setActionMessage(`已选择门店：${stores.find((store) => store.poiId === poiId)?.poiName ?? poiId}`);
    }
    function selectRoom(roomCategoryId) {
        setSelectedRoomCategoryIds([roomCategoryId]);
        setFilterOpen(null);
        setActionMessage(`已选择房型：${roomOptions.find((room) => room.roomCategoryId === roomCategoryId)?.roomCategoryName ?? roomCategoryId}`);
    }
    function resetRetailFilters() {
        setKeyword('');
        setQueryKeyword('');
        setSelectedStoreId('');
        setSelectedRoomCategoryIds([]);
        setFilterOpen(null);
        setActionMessage('已重置门市价筛选条件');
    }
    function exportRetailPrice() {
        setActionMessage(`门市价导出任务已创建：${stores.length} 个门店，${roomOptions.length} 个房型`);
    }
    if (location.pathname.endsWith('/hourSetting')) {
        return _jsx(HourRoomSettingsPage, { onBack: () => navigate('/houseManage/retailPrice') });
    }
    return (_jsxs("div", { className: "retail-price-page", children: [_jsxs("section", { className: "retail-main-panel", children: [_jsxs("div", { className: "retail-toolbar", children: [_jsx("h1", { className: "retail-page-pill", children: "\u95E8\u5E02\u4EF7" }), _jsxs("div", { className: "retail-toolbar-actions", children: [_jsx("button", { type: "button", onClick: () => navigate('/houseManage/retailPrice/hourSetting'), children: "\u949F\u70B9\u623F\u8BBE\u7F6E" }), _jsx("button", { type: "button", onClick: () => setDrawer('retail'), children: "\u95E8\u5E02\u4EF7\u8BBE\u7F6E" }), _jsx("button", { type: "button", onClick: () => setDrawer('plan'), children: "\u4EF7\u683C\u89C4\u5212" }), _jsx("button", { type: "button", onClick: () => setDrawer('batch'), children: "\u6279\u91CF\u6539\u4EF7" }), _jsx("button", { type: "button", onClick: refreshRetailData, disabled: isLoading, children: "\u5237\u65B0" }), _jsx("button", { type: "button", onClick: resetRetailFilters, children: "\u91CD\u7F6E" }), _jsx("button", { type: "button", onClick: exportRetailPrice, children: "\u5BFC\u51FA" }), _jsx("button", { type: "button", onClick: () => setDetailOpen(true), children: "\u67E5\u770B\u8BE6\u60C5" }), _jsx("button", { type: "button", onClick: () => setMoreOpen((open) => !open), children: "\u66F4\u591A" })] })] }), moreOpen ? (_jsxs("div", { className: "retail-more-popover", role: "menu", "aria-label": "\u95E8\u5E02\u4EF7\u66F4\u591A\u64CD\u4F5C", children: [_jsx("button", { type: "button", role: "menuitem", onClick: () => navigate('/houseManage/logs/price'), children: "\u67E5\u770B\u8C03\u4EF7\u65E5\u5FD7" }), _jsx("button", { type: "button", role: "menuitem", onClick: () => setActionMessage('门市价同步任务已创建'), children: "\u540C\u6B65\u623F\u4EF7" })] })) : null, _jsxs("div", { className: `retail-request-status${requestError ? ' is-error' : ''}`, role: "status", "aria-label": "\u95E8\u5E02\u4EF7\u6570\u636E\u670D\u52A1\u72B6\u6001", children: [_jsx("div", { hidden: true, "data-testid": "retail-price-service-contract", "data-provider": currentProvider, "data-mode": retailData?.mockMode ?? '', "data-trace-id": retailData?.traceIds[0] ?? '', "data-request-summary": retailData?.requestSummary.join('|') ?? '' }), requestError ? (_jsxs(_Fragment, { children: [_jsx("strong", { children: "\u6570\u636E\u52A0\u8F7D\u5931\u8D25" }), _jsx("span", { children: requestError }), _jsx("button", { type: "button", onClick: () => {
                                            beginRetailRequest();
                                            setRequestRevision((current) => current + 1);
                                        }, children: "\u91CD\u65B0\u52A0\u8F7D" })] })) : (_jsxs(_Fragment, { children: [_jsx("strong", { children: isLoading ? '正在加载门市价数据' : '门市价数据已更新' }), _jsx("span", { children: retailData
                                            ? `门店 ${stores.length} 个，房型 ${roomOptions.length} 个，${needsSetup ? '当前需完成门市价设置' : '门市价配置已返回'}`
                                            : '等待数据返回' }), requestedAt ? _jsxs("em", { children: ["\u5237\u65B0\u4E8E ", requestedAt] }) : null] }))] }), actionMessage ? (_jsx("div", { className: "retail-action-feedback", role: "status", "aria-label": "\u95E8\u5E02\u4EF7\u64CD\u4F5C\u53CD\u9988", children: actionMessage })) : null, _jsxs("div", { className: "retail-filter-row", children: [_jsx("button", { type: "button", className: `retail-store-chip${selectedStoreId === '' ? ' is-active' : ''}`, onClick: () => {
                                    setSelectedStoreId('');
                                    setActionMessage('已切换到全部门店');
                                }, children: "\u5168\u90E8\u95E8\u5E97" }), stores.length ? stores.map((store) => (_jsx("button", { type: "button", className: `retail-store-chip retail-store-chip--wide${selectedStoreId === store.poiId ? ' is-active' : ''}`, onClick: () => selectStore(store.poiId), children: store.poiName }, store.poiId))) : (_jsx("button", { type: "button", className: "retail-store-chip retail-store-chip--wide", disabled: true, children: isLoading ? '加载门店中' : '暂无门店数据' })), _jsx("button", { type: "button", className: "retail-gear-button", "aria-label": "\u95E8\u5E97\u8BBE\u7F6E", onClick: () => setActionMessage('已打开门店设置入口，请在设置中心维护门店信息'), children: "\u2699" }), _jsx(RetailFilterButton, { label: "\u623F\u578B", onClick: () => setFilterOpen(filterOpen === 'room' ? null : 'room') }), _jsx(RetailFilterButton, { label: "\u623F\u578B\u6807\u7B7E", onClick: () => setFilterOpen(filterOpen === 'tag' ? null : 'tag') }), _jsxs("form", { className: "retail-search", onSubmit: submitSearch, children: [_jsx("input", { type: "search", placeholder: "\u623F\u6E90\u7F16\u7801/\u7B80\u79F0/\u6807\u9898", value: keyword, onChange: (event) => setKeyword(event.target.value) }), _jsx("button", { type: "submit", "aria-label": "\u641C\u7D22", children: "\u2315" }), _jsx("button", { type: "submit", className: "retail-search-submit", children: "\u641C\u7D22" })] })] }), filterOpen ? (_jsx("div", { className: "retail-filter-popover", role: "listbox", "aria-label": filterOpen === 'room' ? '房型筛选' : '房型标签筛选', children: filterOpen === 'room'
                            ? roomOptions.length
                                ? roomOptions.map((item) => (_jsxs("button", { type: "button", role: "option", onClick: () => selectRoom(item.roomCategoryId), children: [item.roomCategoryId, _jsx("span", { children: item.roomCategoryName })] }, item.roomCategoryId)))
                                : _jsx("span", { className: "retail-filter-empty", children: isLoading ? '加载房型中' : '暂无房型数据' })
                            : _jsx("span", { className: "retail-filter-empty", children: "\u6682\u65E0\u6570\u636E" }) })) : null, _jsx(RetailEmptyState, { onSetup: () => setDrawer('retail'), note: !isLoading && roomOptions.length === 0 ? '暂无房型数据' : undefined })] }), drawer ? _jsx(RetailSettingDrawer, { type: drawer, onClose: () => setDrawer(null) }) : null, detailOpen ? (_jsx(RetailPriceDetailDialog, { stores: stores, rooms: roomOptions, onClose: () => setDetailOpen(false) })) : null] }));
}
function RetailPriceDetailDialog({ stores, rooms, onClose, }) {
    const primaryStore = stores[0]?.poiName ?? '全部门店';
    const primaryRoom = rooms[0]?.roomCategoryName ?? '全部房型';
    return (_jsx("div", { className: "retail-drawer-backdrop", role: "presentation", children: _jsxs("section", { className: "retail-detail-dialog", role: "dialog", "aria-modal": "true", "aria-label": "\u95E8\u5E02\u4EF7\u8BE6\u60C5", children: [_jsxs("header", { children: [_jsx("strong", { children: "\u95E8\u5E02\u4EF7\u8BE6\u60C5" }), _jsx("button", { type: "button", "aria-label": "\u5173\u95ED\u95E8\u5E02\u4EF7\u8BE6\u60C5", onClick: onClose, children: "\u00D7" })] }), _jsxs("div", { className: "retail-detail-grid", children: [_jsxs("div", { children: [_jsx("span", { children: "\u95E8\u5E97\u8303\u56F4" }), _jsx("strong", { children: primaryStore })] }), _jsxs("div", { children: [_jsx("span", { children: "\u623F\u578B\u8303\u56F4" }), _jsx("strong", { children: primaryRoom })] }), _jsxs("div", { children: [_jsx("span", { children: "\u95E8\u5E97\u6570\u91CF" }), _jsx("strong", { children: stores.length })] }), _jsxs("div", { children: [_jsx("span", { children: "\u623F\u578B\u6570\u91CF" }), _jsx("strong", { children: rooms.length })] })] }), _jsx("footer", { children: _jsx("button", { type: "button", className: "is-primary", onClick: onClose, children: "\u77E5\u9053\u4E86" }) })] }) }));
}
function PriceComparisonPage() {
    const navigate = useNavigate();
    const location = useLocation();
    const [requestRevision, setRequestRevision] = useState(0);
    const [filters, setFilters] = useState({
        date: '2026-05-18',
        storeId: 'qianhai',
        roomTypeId: 'all',
        channelId: 'all',
    });
    const [appliedFilters, setAppliedFilters] = useState(filters);
    const [feedback, setFeedback] = useState('数据已更新');
    const [detailId, setDetailId] = useState('');
    const [showMore, setShowMore] = useState(false);
    const [requestState, setRequestState] = useState({
        kind: 'loading',
        message: '正在加载竞争圈比价数据',
    });
    useEffect(() => {
        let alive = true;
        const params = new URLSearchParams(location.search);
        const mockState = normalizePriceComparisonMockState(params.get('mockState'));
        Promise.resolve()
            .then(() => {
            if (!alive)
                return null;
            setRequestState({ kind: 'loading', message: '正在加载竞争圈比价数据' });
            return loadPriceComparisonDashboard({ ...appliedFilters, mockState });
        })
            .then((data) => {
            if (!alive || !data)
                return;
            setRequestState(data.rooms.list.length === 0 ? { kind: 'empty', data } : { kind: 'success', data });
        })
            .catch((error) => {
            if (!alive)
                return;
            setRequestState({
                kind: 'error',
                message: error instanceof Error ? error.message : '竞争圈比价数据服务返回未知错误',
            });
        });
        return () => {
            alive = false;
        };
    }, [appliedFilters, location.search, requestRevision]);
    const isReady = requestState.kind === 'success' || requestState.kind === 'empty';
    const dashboard = isReady ? requestState.data : null;
    const detailRoom = dashboard?.rooms.list.find((room) => room.id === detailId);
    function updateFilter(key, value) {
        setFilters((current) => ({ ...current, [key]: value }));
    }
    function submitFilters(event) {
        event.preventDefault();
        setAppliedFilters(filters);
        setFeedback('已按筛选条件更新');
    }
    function resetFilters() {
        const nextFilters = {
            date: '2026-05-18',
            storeId: 'qianhai',
            roomTypeId: 'all',
            channelId: 'all',
        };
        setFilters(nextFilters);
        setAppliedFilters(nextFilters);
        setFeedback('已恢复默认条件');
    }
    function refreshData() {
        setRequestRevision((current) => current + 1);
        setFeedback('数据已刷新');
    }
    function exportData() {
        setFeedback('导出任务已创建，可在消息中心查看进度');
    }
    return (_jsxs("div", { className: "page-stack price-comparison-page", children: [_jsx(SharedToolbar, { active: "\u7ADE\u4E89\u5708\u6BD4\u4EF7" }), _jsxs("section", { className: "price-comparison-panel", children: [_jsxs("div", { className: "price-comparison-header", children: [_jsxs("div", { children: [_jsx("h2", { children: "\u7ADE\u4E89\u5708\u6BD4\u4EF7" }), _jsx("p", { children: "\u8DDF\u8E2A\u540C\u5546\u5708\u7ADE\u54C1\u4EF7\u683C\uFF0C\u7ED3\u5408\u5165\u4F4F\u7387\u548C\u6E20\u9053\u8868\u73B0\u7ED9\u51FA\u8C03\u4EF7\u5EFA\u8BAE\u3002" })] }), _jsxs("div", { className: "price-comparison-actions", children: [_jsx("button", { type: "button", onClick: refreshData, disabled: requestState.kind === 'loading', children: "\u5237\u65B0" }), _jsx("button", { type: "button", onClick: exportData, disabled: !dashboard, children: "\u5BFC\u51FA" }), _jsx("button", { type: "button", onClick: () => setShowMore((current) => !current), children: "\u66F4\u591A" })] })] }), _jsxs("form", { className: "price-comparison-toolbar", "aria-label": "\u7ADE\u4E89\u5708\u6BD4\u4EF7\u7B5B\u9009", onSubmit: submitFilters, children: [_jsxs("label", { children: [_jsx("span", { children: "\u6BD4\u4EF7\u65E5\u671F" }), _jsx("input", { "aria-label": "\u6BD4\u4EF7\u65E5\u671F", type: "date", value: filters.date, onChange: (event) => updateFilter('date', event.target.value) })] }), _jsxs("label", { children: [_jsx("span", { children: "\u95E8\u5E97" }), _jsx("select", { "aria-label": "\u95E8\u5E97", value: filters.storeId, onChange: (event) => updateFilter('storeId', event.target.value), children: (dashboard?.filterOptions.stores ?? []).map((item) => (_jsx("option", { value: item.value, children: item.label }, item.value))) })] }), _jsxs("label", { children: [_jsx("span", { children: "\u623F\u578B" }), _jsx("select", { "aria-label": "\u623F\u578B", value: filters.roomTypeId, onChange: (event) => updateFilter('roomTypeId', event.target.value), children: (dashboard?.filterOptions.roomTypes ?? []).map((item) => (_jsx("option", { value: item.value, children: item.label }, item.value))) })] }), _jsxs("label", { children: [_jsx("span", { children: "\u6E20\u9053" }), _jsx("select", { "aria-label": "\u6E20\u9053", value: filters.channelId, onChange: (event) => updateFilter('channelId', event.target.value), children: (dashboard?.filterOptions.channels ?? []).map((item) => (_jsx("option", { value: item.value, children: item.label }, item.value))) })] }), _jsx("button", { type: "submit", children: "\u67E5\u8BE2" }), _jsx("button", { type: "button", onClick: resetFilters, children: "\u91CD\u7F6E" })] }), _jsx("div", { className: "price-comparison-feedback", role: "status", "aria-label": "\u7ADE\u4E89\u5708\u6BD4\u4EF7\u64CD\u4F5C\u53CD\u9988", children: requestState.kind === 'loading' ? requestState.message : feedback }), requestState.kind === 'error' ? (_jsxs("div", { className: "price-comparison-error", role: "alert", "aria-label": "\u7ADE\u4E89\u5708\u6BD4\u4EF7\u6570\u636E\u9519\u8BEF", children: [_jsx("strong", { children: "\u6570\u636E\u52A0\u8F7D\u5931\u8D25" }), _jsx("span", { children: requestState.message }), _jsx("button", { type: "button", onClick: refreshData, children: "\u91CD\u8BD5" })] })) : null, dashboard ? (_jsxs(_Fragment, { children: [_jsx("section", { className: "comparison-summary", "aria-label": "\u7ADE\u4E89\u5708\u6BD4\u4EF7\u6838\u5FC3\u6307\u6807", children: dashboard.metrics.map((metric) => (_jsxs("article", { className: `comparison-card comparison-card--${metric.tone}`, children: [_jsxs("div", { children: [_jsx("strong", { children: metric.label }), _jsx("span", { children: metric.delta })] }), _jsx("dl", { children: _jsxs("div", { children: [_jsx("dt", { children: "\u5F53\u524D\u503C" }), _jsx("dd", { children: metric.value })] }) })] }, metric.id))) }), _jsxs("section", { className: "price-comparison-chart", "aria-label": "\u7ADE\u4E89\u5708\u6BD4\u4EF7\u8D8B\u52BF\u56FE", children: [_jsxs("div", { className: "section-header", children: [_jsx("h3", { children: "\u4EF7\u683C\u8D8B\u52BF" }), _jsxs("div", { children: [_jsx("span", { children: "\u672C\u5E97\u4EF7" }), _jsx("span", { children: "\u7ADE\u54C1\u4EF7" }), _jsx("span", { children: "\u5E02\u573A\u5747\u4EF7" })] })] }), _jsx("div", { className: "price-comparison-chart__grid", children: dashboard.trend.map((item) => (_jsxs("div", { children: [_jsx("span", { children: item.dateLabel }), _jsx("strong", { style: { height: `${Math.max(20, item.ownPrice / 10)}px` }, children: item.ownPrice }), _jsx("em", { style: { height: `${Math.max(20, item.competitorPrice / 10)}px` }, children: item.competitorPrice }), _jsx("i", { style: { height: `${Math.max(20, item.marketAverage / 10)}px` }, children: item.marketAverage })] }, item.dateLabel))) })] }), _jsxs("section", { className: "comparison-table", "aria-label": "\u7ADE\u4E89\u5708\u6BD4\u4EF7\u5217\u8868", children: [_jsxs("div", { className: "comparison-table__head", children: [_jsx("div", { children: "\u623F\u578B" }), _jsx("div", { children: "\u6E20\u9053" }), _jsx("div", { children: "\u672C\u5E97\u4EF7" }), _jsx("div", { children: "\u7ADE\u54C1\u4EF7" }), _jsx("div", { children: "\u4EF7\u5DEE" }), _jsx("div", { children: "\u5165\u4F4F\u7387" }), _jsx("div", { children: "\u5EFA\u8BAE" }), _jsx("div", { children: "\u64CD\u4F5C" })] }), _jsx("div", { className: "comparison-matrix", children: dashboard.rooms.list.length ? dashboard.rooms.list.map((room) => (_jsxs("div", { className: "comparison-matrix__row", children: [_jsxs("div", { children: [_jsx("span", { children: "\u623F\u578B" }), _jsx("strong", { children: room.roomType })] }), _jsxs("div", { children: [_jsx("span", { children: "\u6E20\u9053" }), _jsx("strong", { children: room.channel })] }), _jsxs("div", { children: [_jsx("span", { children: "\u672C\u5E97\u4EF7" }), _jsxs("strong", { children: ["\u00A5", room.ownPrice] })] }), _jsxs("div", { children: [_jsx("span", { children: "\u7ADE\u54C1\u4EF7" }), _jsxs("strong", { children: ["\u00A5", room.competitorPrice] })] }), _jsxs("div", { children: [_jsx("span", { children: "\u4EF7\u5DEE" }), _jsxs("strong", { children: [room.priceDiff > 0 ? '+' : '', room.priceDiff] })] }), _jsxs("div", { children: [_jsx("span", { children: "\u5165\u4F4F\u7387" }), _jsx("strong", { children: room.occupancy })] }), _jsxs("div", { children: [_jsx("span", { children: "\u5EFA\u8BAE" }), _jsx("strong", { children: room.suggestion })] }), _jsx("div", { children: _jsx("button", { type: "button", onClick: () => setDetailId(room.id), "aria-label": `查看详情 ${room.roomType}`, children: "\u67E5\u770B\u8BE6\u60C5" }) })] }, room.id))) : _jsx("div", { className: "price-comparison-empty-line", children: "\u5F53\u524D\u6761\u4EF6\u6682\u65E0\u6BD4\u4EF7\u7ED3\u679C\uFF0C\u8BF7\u8C03\u6574\u7B5B\u9009\u6761\u4EF6\u3002" }) })] }), _jsxs("section", { className: "price-comparison-lower", children: [_jsxs("div", { "aria-label": "\u7ADE\u4E89\u5708\u6BD4\u4EF7\u5F85\u529E", children: [_jsx("h3", { children: "\u5F85\u529E\u63D0\u9192" }), dashboard.todos.length ? dashboard.todos.map((todo) => (_jsxs("button", { type: "button", onClick: () => setFeedback(`${todo.title} 已标记跟进`), children: [_jsx("strong", { children: todo.title }), _jsxs("span", { children: [todo.priority, "\u4F18\u5148\u7EA7 \u00B7 ", todo.due] })] }, todo.id))) : _jsx("p", { children: "\u5F53\u524D\u6CA1\u6709\u5F85\u529E\u63D0\u9192\u3002" })] }), _jsxs("div", { "aria-label": "\u7ADE\u4E89\u5708\u6BD4\u4EF7\u5FEB\u6377\u5165\u53E3", children: [_jsx("h3", { children: "\u5FEB\u6377\u5165\u53E3" }), dashboard.quickLinks.map((link) => (_jsx("button", { type: "button", onClick: () => navigate(link.route), children: link.label }, link.id)))] })] })] })) : null, showMore ? (_jsxs("div", { className: "price-comparison-popover", role: "dialog", "aria-label": "\u66F4\u591A\u64CD\u4F5C", children: [_jsx("button", { type: "button", onClick: () => setFeedback('已复制当前比价链接'), children: "\u590D\u5236\u94FE\u63A5" }), _jsx("button", { type: "button", onClick: () => setFeedback('已生成调价复核任务'), children: "\u751F\u6210\u590D\u6838\u4EFB\u52A1" })] })) : null] }), detailRoom ? (_jsx("div", { className: "price-modal", role: "dialog", "aria-modal": "true", "aria-label": "\u6BD4\u4EF7\u8BE6\u60C5", children: _jsxs("section", { className: "price-modal__panel", children: [_jsx("button", { type: "button", "aria-label": "\u5173\u95ED\u8BE6\u60C5", onClick: () => setDetailId(''), children: "\u00D7" }), _jsx("h3", { children: detailRoom.roomType }), _jsx("p", { children: "\u7ADE\u54C1\u4EF7\u660E\u7EC6" }), _jsxs("dl", { children: [_jsxs("div", { children: [_jsx("dt", { children: "\u6E20\u9053" }), _jsx("dd", { children: detailRoom.channel })] }), _jsxs("div", { children: [_jsx("dt", { children: "\u672C\u5E97\u4EF7" }), _jsxs("dd", { children: ["\u00A5", detailRoom.ownPrice] })] }), _jsxs("div", { children: [_jsx("dt", { children: "\u7ADE\u54C1\u4EF7" }), _jsxs("dd", { children: ["\u00A5", detailRoom.competitorPrice] })] }), _jsxs("div", { children: [_jsx("dt", { children: "\u5E02\u573A\u5747\u4EF7" }), _jsxs("dd", { children: ["\u00A5", detailRoom.marketAverage] })] })] }), _jsx("strong", { children: detailRoom.suggestion })] }) })) : null] }));
}
function PriceBoardPage() {
    const [detailOpen, setDetailOpen] = useState(false);
    const [agreed, setAgreed] = useState(true);
    const [purchaseMessage, setPurchaseMessage] = useState('');
    const [paymentOpen, setPaymentOpen] = useState(false);
    const [requestRevision, setRequestRevision] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [requestError, setRequestError] = useState('');
    const [priceBoardData, setPriceBoardData] = useState(null);
    const [selectedDurationId, setSelectedDurationId] = useState('');
    useEffect(() => {
        const controller = new AbortController();
        queueMicrotask(() => {
            if (controller.signal.aborted)
                return;
            setIsLoading(true);
            setRequestError('');
        });
        loadPriceBoardData(controller.signal)
            .then((data) => {
            setPriceBoardData(data);
            setSelectedDurationId((current) => current || data.durationOptions[0]?.id || '');
        })
            .catch((error) => {
            if (error instanceof DOMException && error.name === 'AbortError')
                return;
            setPriceBoardData(null);
            setRequestError(error instanceof Error ? error.message : String(error));
        })
            .finally(() => {
            if (!controller.signal.aborted)
                setIsLoading(false);
        });
        return () => controller.abort();
    }, [requestRevision]);
    const selectedDuration = priceBoardData?.durationOptions.find((item) => item.id === selectedDurationId) ??
        priceBoardData?.durationOptions[0] ??
        null;
    const productName = priceBoardData?.productName ?? '电子房价牌';
    const productDescription = priceBoardData?.description ?? '可直连路客云系统房价，展示于门店的电子展示牌上面，一目了然';
    function openDetail() {
        setAgreed(true);
        setPurchaseMessage('');
        setPaymentOpen(false);
        setDetailOpen(true);
    }
    function submitPurchase() {
        if (!agreed) {
            setPurchaseMessage('请先阅读并同意《路客云产品服务购买协议》');
            return;
        }
        if (!selectedDuration || requestError) {
            setPurchaseMessage('请选择可购买时长后再创建订单');
            return;
        }
        setPurchaseMessage('');
        setPaymentOpen(true);
    }
    function retryPriceBoardRequest() {
        setPaymentOpen(false);
        setPurchaseMessage('');
        setRequestRevision((current) => current + 1);
    }
    const safeRequestError = requestError
        .replace(/（traceId: [^）]+）/g, '')
        .replace(/\/[A-Za-z0-9/?=&._-]+/g, '数据服务')
        .replace(/真实接口/g, '数据')
        .replace(/接口/g, '数据')
        .replace(/mock/gi, '')
        .replace(/provider/gi, '')
        .replace(/阻塞/g, '失败')
        .replace(/\s+/g, ' ')
        .trim() || '数据加载失败，请稍后重试';
    const requestStatus = (_jsx("div", { className: `price-board-request-status${requestError ? ' is-error' : ''}`, role: "status", "aria-label": "\u7535\u5B50\u623F\u4EF7\u724C\u6570\u636E\u63A5\u5165\u72B6\u6001", "data-provider": priceBoardData?.provider ?? '', "data-source-label": priceBoardData?.sourceLabel ?? '', "data-response-state": priceBoardData?.responseState ?? (requestError ? 'error' : 'loading'), "data-trace-id": priceBoardData?.traceId ?? '', "data-timestamp": priceBoardData?.timestamp ?? '', children: requestError ? (_jsxs(_Fragment, { children: [_jsx("strong", { children: "\u6570\u636E\u52A0\u8F7D\u5931\u8D25" }), _jsx("span", { children: safeRequestError }), _jsx("button", { type: "button", onClick: retryPriceBoardRequest, children: "\u91CD\u8BD5\u6570\u636E\u670D\u52A1" })] })) : (_jsxs(_Fragment, { children: [_jsx("strong", { children: isLoading ? '正在加载商品信息' : priceBoardData?.responseState === 'empty' ? '暂无可购买商品' : '商品信息已更新' }), _jsx("span", { children: priceBoardData ? `门店：${priceBoardData.campName}；可选时长：${priceBoardData.durationOptions.length} 项` : '正在读取当前门店商品配置' }), priceBoardData ? _jsxs("em", { children: ["\u95E8\u5E97\uFF1A", priceBoardData.campName, "\uFF1B\u5546\u54C1\u603B\u6570\uFF1A", priceBoardData.totalProductCount] }) : null] })) }));
    if (detailOpen) {
        return (_jsxs("div", { className: "page-stack price-board-page price-board-detail-page", children: [requestStatus, _jsxs("div", { className: "price-board-subscribe-layout", children: [_jsxs("main", { className: "price-board-detail-main", children: [_jsxs("section", { className: "price-board-product-card price-board-product-card--detail", children: [_jsx("img", { src: priceBoardAssets.logo, alt: "", className: "price-board-logo" }), _jsxs("div", { children: [_jsx("h2", { children: productName }), _jsx("p", { children: productDescription })] })] }), _jsxs("section", { className: "price-board-detail-card", children: [_jsx("h2", { className: "price-board-section-title", children: "\u5546\u54C1\u8BE6\u60C5" }), _jsx("img", { src: priceBoardAssets.detail, alt: "\u7535\u5B50\u623F\u4EF7\u724C\u8D2D\u4E70\u8BE6\u60C5\u56FE", className: "price-board-detail-image" })] })] }), _jsxs("aside", { className: "price-board-purchase-panel", "aria-label": "\u8D2D\u4E70\u4FE1\u606F", children: [_jsx("h2", { children: "\u8D2D\u4E70\u4FE1\u606F" }), _jsxs("article", { className: "price-board-purchase-row", children: [_jsx("span", { children: "\u5546\u54C1\u4EF7\u683C" }), _jsx("strong", { children: selectedDuration ? formatPriceBoardMoney(selectedDuration.price) : '-' }), selectedDuration ? _jsxs("em", { children: [formatPriceBoardMoney(selectedDuration.originalPrice), " / ", selectedDuration.label] }) : null] }), _jsxs("article", { className: "price-board-purchase-row price-board-duration-row", children: [_jsx("span", { children: "\u8D2D\u4E70\u65F6\u957F" }), priceBoardData?.durationOptions.map((option) => (_jsx(PriceBoardDurationLabel, { option: option, selected: selectedDuration?.id === option.id, onSelect: () => {
                                                setSelectedDurationId(option.id);
                                                setPurchaseMessage('');
                                            } }, option.id))) ?? _jsx("span", { className: "price-board-duration-empty", children: "\u6682\u65E0\u53EF\u9009\u8D2D\u4E70\u65F6\u957F" })] }), _jsxs("article", { className: "price-board-purchase-row", children: [_jsx("span", { children: "\u8BA2\u5355\u91D1\u989D" }), _jsx("strong", { children: selectedDuration ? formatPriceBoardMoney(selectedDuration.price) : '-' }), _jsx("em", { children: "\u660E\u7EC6" })] }), _jsxs("label", { className: "price-board-agreement", children: [_jsx("input", { type: "checkbox", checked: agreed, onChange: (event) => setAgreed(event.target.checked) }), "\u6211\u5DF2\u9605\u8BFB\u5E76\u540C\u610F\u300A\u8DEF\u5BA2\u4E91\u4EA7\u54C1\u670D\u52A1\u8D2D\u4E70\u534F\u8BAE\u300B"] }), purchaseMessage && _jsx("div", { className: "notice-bar", children: purchaseMessage }), _jsx("button", { type: "button", className: "price-board-buy-button", onClick: submitPurchase, children: "\u7ACB\u5373\u8D2D\u4E70" })] })] }), paymentOpen ? (_jsxs("div", { className: "price-board-pay-modal", role: "presentation", children: [_jsx("div", { className: "price-board-pay-modal__mask" }), _jsxs("section", { className: "price-board-pay-modal__dialog", role: "dialog", "aria-modal": "true", "aria-label": "\u5FAE\u4FE1\u652F\u4ED8", children: [_jsx("button", { type: "button", className: "price-board-pay-modal__close", "aria-label": "\u5173\u95ED\u652F\u4ED8\u5F39\u5C42", onClick: () => setPaymentOpen(false), children: "\u00D7" }), _jsx("div", { className: "price-board-pay-modal__qr", children: _jsx("img", { src: priceBoardAssets.payQr, alt: "\u5FAE\u4FE1\u652F\u4ED8\u4E8C\u7EF4\u7801" }) }), _jsxs("div", { className: "price-board-pay-modal__info", children: [_jsx("p", { children: "\u8BF7\u4F7F\u7528\u5FAE\u4FE1\u626B\u7801\u652F\u4ED8" }), _jsx("strong", { children: selectedDuration ? formatPriceBoardPaymentMoney(selectedDuration.price) : '-' }), _jsx("div", { className: "price-board-pay-modal__method", children: _jsx("span", { children: priceBoardData?.paymentTypeNames[0] ?? '微信支付' }) }), _jsx("div", { className: "price-board-pay-modal__blocker", children: "\u8BA2\u5355\u5DF2\u521B\u5EFA\uFF0C\u8BF7\u5728\u6709\u6548\u671F\u5185\u5B8C\u6210\u652F\u4ED8" }), _jsxs("div", { className: "price-board-pay-modal__countdown", children: [_jsx("span", { children: "\u652F\u4ED8\u65F6\u95F4\uFF1A" }), _jsx("b", { children: "00" }), _jsx("em", { children: ":" }), _jsx("b", { children: "14" }), _jsx("em", { children: ":" }), _jsx("b", { children: "58" })] })] })] })] })) : null] }));
    }
    return (_jsxs("div", { className: "page-stack price-board-page", children: [requestStatus, _jsxs("section", { className: "price-board-product-card", children: [_jsx("img", { src: priceBoardAssets.logo, alt: "", className: "price-board-logo" }), _jsxs("div", { children: [_jsx("h2", { children: productName }), _jsx("p", { children: "\u53EF\u76F4\u8FDE\u8DEF\u5BA2\u4E91\u7CFB\u7EDF\u623F\u4EF7\uFF0C\u5C55\u793A\u4E8E\u95E8\u5E97\u7684\u7535\u5B50\u5C55\u793A\u724C\u4E0A\u9762\uFF0C\u4E00\u76EE\u4E86\u7136" }), priceBoardData ? _jsx("span", { className: "price-board-product-card__api-desc", children: productDescription }) : null] }), _jsx("button", { type: "button", onClick: openDetail, disabled: isLoading || Boolean(requestError) || !selectedDuration, children: "\u53BB\u5F00\u901A" })] }), _jsxs("section", { className: "price-board-detail-card", children: [_jsx("h2", { children: "\u5546\u54C1\u8BE6\u60C5" }), _jsx("div", { className: "price-board-promo-frame", children: priceBoardAssets.overview.map((src, index) => (_jsx("img", { src: src, alt: `电子房价牌宣传图 ${index + 1}` }, src))) })] })] }));
}
function PriceBoardDurationLabel({ option, selected, onSelect, }) {
    return (_jsxs("label", { className: selected ? 'is-active' : '', children: [_jsx("input", { type: "radio", name: "price-board-duration", "aria-label": option.label, checked: selected, onChange: onSelect }), option.label] }));
}
function formatPriceBoardMoney(cents) {
    const amount = cents / 100;
    const normalized = Number.isInteger(amount) ? String(amount) : amount.toFixed(2).replace(/\.?0+$/, '');
    return `¥${normalized}`;
}
function formatPriceBoardPaymentMoney(cents) {
    return `¥ ${(cents / 100).toFixed(2)}`;
}
function OtherPriceSelect({ label, value, options, onChange, }) {
    const [open, setOpen] = useState(false);
    return (_jsxs("div", { className: "other-price-select", children: [_jsxs("button", { type: "button", "aria-expanded": open, onClick: () => setOpen((current) => !current), children: [value === options[0] ? label : value, _jsx("span", { children: "\u2304" })] }), open && (_jsx("div", { className: "other-price-select__menu", role: "listbox", children: options.map((option) => (_jsx("button", { type: "button", role: "option", "aria-selected": option === value, className: option === value ? 'is-active' : '', onClick: () => {
                        onChange(option);
                        setOpen(false);
                    }, children: option }, option))) }))] }));
}
function toOtherPriceBusinessErrorMessage(error) {
    const raw = error instanceof Error ? error.message : String(error);
    const normalized = raw
        .replace(/mock/gi, '')
        .replace(/provider/gi, '')
        .replace(/traceId:[^)）]+[)）]?/gi, '')
        .replace(/后端/g, '数据')
        .replace(/接口/g, '数据')
        .replace(/阻塞/g, '失败')
        .replace(/[（）]/g, '')
        .replace(/\s+/g, ' ')
        .trim();
    if (!normalized || /其他价格.*模拟失败/.test(normalized))
        return '其他价格数据加载失败，请稍后重试';
    return normalized;
}
function OtherPricePage() {
    const [tab, setTab] = useState('杂费设置');
    const [channel, setChannel] = useState('全部平台');
    const [room, setRoom] = useState('全部房型');
    const [otherPriceData, setOtherPriceData] = useState(null);
    const [requestState, setRequestState] = useState({
        kind: 'loading',
        message: '正在加载其他价格数据',
    });
    const [reloadToken, setReloadToken] = useState(0);
    const [operationFeedback, setOperationFeedback] = useState('');
    const [editing, setEditing] = useState(null);
    const [activityEditing, setActivityEditing] = useState(null);
    const [draftValue, setDraftValue] = useState('');
    const isActivityCreate = activityEditing?.column === '新增设置';
    const isLoading = requestState.kind === 'loading';
    const selectedChannelId = useMemo(() => {
        if (channel === '全部平台')
            return undefined;
        return otherPriceData?.channels.find((item) => item.name === channel)?.id;
    }, [channel, otherPriceData?.channels]);
    const selectedRoomId = useMemo(() => {
        if (room === '全部房型')
            return undefined;
        return otherPriceData?.rooms.find((item) => item.name === room)?.id;
    }, [room, otherPriceData?.rooms]);
    useEffect(() => {
        const controller = new AbortController();
        queueMicrotask(() => {
            if (!controller.signal.aborted) {
                setRequestState({ kind: 'loading', message: '正在加载其他价格数据' });
            }
        });
        loadOtherPriceData({ channelId: selectedChannelId, roomCategoryId: selectedRoomId }, controller.signal)
            .then((data) => {
            setOtherPriceData(data);
            const totalRows = data.feeRows.reduce((sum, group) => sum + group.channels.length, 0);
            setRequestState({
                kind: totalRows > 0 ? 'success' : 'empty',
                message: totalRows > 0
                    ? `数据已更新：${data.campName}，房型 ${data.rooms.length} 个，杂费行 ${totalRows} 条`
                    : '当前筛选下暂无其他价格记录',
            });
        })
            .catch((error) => {
            if (error instanceof DOMException && error.name === 'AbortError')
                return;
            setOtherPriceData(null);
            setRequestState({
                kind: 'error',
                message: toOtherPriceBusinessErrorMessage(error),
            });
        });
        return () => controller.abort();
    }, [selectedChannelId, selectedRoomId, reloadToken]);
    const channelOptions = ['全部平台', ...(otherPriceData?.channels.map((item) => item.name) ?? [])];
    const roomOptions = ['全部房型', ...(otherPriceData?.rooms.map((item) => item.name) ?? [])];
    const feeColumns = otherPriceData?.feeColumns ?? [];
    const currentActivityColumns = otherPriceData?.activityColumns ?? [];
    const filteredRows = otherPriceData?.feeRows ?? [];
    const filteredActivityRows = otherPriceData?.activityRows ?? [];
    const showOperationFeedback = (message) => {
        setOperationFeedback(message);
        setEditing(null);
        setActivityEditing(null);
    };
    function refreshOtherPriceData() {
        setReloadToken((current) => current + 1);
        setOperationFeedback('正在刷新当前筛选数据');
    }
    function resetOtherPriceFilters() {
        setChannel('全部平台');
        setRoom('全部房型');
        setReloadToken((current) => current + 1);
        setOperationFeedback('筛选条件已重置');
    }
    function exportOtherPriceData() {
        setOperationFeedback('导出任务已创建，可在消息中心查看进度');
    }
    return (_jsxs("div", { className: "other-price-page", children: [_jsxs("section", { className: "other-price-panel", children: [_jsx("div", { className: "other-price-tabs-row", children: _jsx("div", { className: "other-price-tabs", role: "tablist", "aria-label": "\u5176\u4ED6\u4EF7\u683C\u8BBE\u7F6E\u7C7B\u578B", children: ['杂费设置', '活动设置'].map((item) => (_jsx("button", { type: "button", role: "tab", "aria-selected": tab === item, className: tab === item ? 'is-active' : '', onClick: () => setTab(item), children: item }, item))) }) }), _jsxs("div", { className: "other-price-filters", children: [_jsx(OtherPriceSelect, { label: "\u6E20\u9053", value: channel, options: channelOptions, onChange: setChannel }), _jsx(OtherPriceSelect, { label: "\u623F\u578B", value: room, options: roomOptions, onChange: setRoom }), _jsxs("div", { className: "other-price-utility-actions", "aria-label": "\u5176\u4ED6\u4EF7\u683C\u8F85\u52A9\u64CD\u4F5C", children: [_jsx("button", { type: "button", onClick: refreshOtherPriceData, disabled: isLoading, children: "\u5237\u65B0" }), _jsx("button", { type: "button", onClick: resetOtherPriceFilters, disabled: isLoading, children: "\u91CD\u7F6E" }), _jsx("button", { type: "button", onClick: exportOtherPriceData, disabled: isLoading || !otherPriceData, children: "\u5BFC\u51FA" })] })] }), _jsx("div", { hidden: true, "data-testid": "other-price-service-contract", "data-provider": otherPriceData?.provider ?? '', "data-source": otherPriceData?.sourceLabel ?? '', "data-request-summary": otherPriceData?.requestSummary.join('|') ?? '', "data-endpoints": otherPriceData?.endpoints.join('|') ?? '' }), requestState.kind === 'error' ? (_jsxs("div", { className: "other-price-state other-price-state--error", role: "alert", "aria-label": "\u5176\u4ED6\u4EF7\u683C\u6570\u636E\u52A0\u8F7D\u5931\u8D25", children: [_jsx("strong", { children: requestState.message }), _jsx("button", { type: "button", onClick: refreshOtherPriceData, children: "\u91CD\u8BD5" })] })) : (_jsx("div", { className: "other-price-state other-price-state--quiet", role: "status", "aria-label": "\u5176\u4ED6\u4EF7\u683C\u6570\u636E\u72B6\u6001", children: requestState.message })), operationFeedback && (_jsx("div", { className: "other-price-state", role: "status", "aria-label": "\u5176\u4ED6\u4EF7\u683C\u64CD\u4F5C\u53CD\u9988", children: operationFeedback })), tab === '活动设置' ? (_jsxs("div", { className: "other-price-table other-price-table--activity", "aria-label": "\u6D3B\u52A8\u8BBE\u7F6E\u8868\u683C", children: [_jsx("div", { className: "other-price-action-row", children: _jsx("button", { type: "button", onClick: () => {
                                        setActivityEditing({ channel: '全部渠道', column: '新增设置' });
                                        setDraftValue('');
                                    }, children: "+\u65B0\u589E\u8BBE\u7F6E" }) }), _jsxs("div", { className: "other-price-table__head", children: [_jsx("div", {}), currentActivityColumns.map((column) => (_jsx("div", { children: column }, column)))] }), requestState.kind === 'loading' ? _jsx("div", { className: "other-price-empty", children: "\u6B63\u5728\u52A0\u8F7D\u6D3B\u52A8\u914D\u7F6E..." }) : null, filteredActivityRows.length === 0 && requestState.kind !== 'loading' ? _jsx("div", { className: "other-price-empty", children: "\u6682\u65E0\u6D3B\u52A8\u8BBE\u7F6E\u6570\u636E" }) : null, filteredActivityRows.map((group) => (_jsxs("div", { className: "other-price-group", children: [_jsx("div", { className: "other-price-room", children: group.roomType }), group.channels.map((row, rowIndex) => (_jsxs("div", { className: "other-price-row", children: [_jsx("div", { children: row[0] }), row.slice(1).map((cell, index) => {
                                                const column = currentActivityColumns[index];
                                                return (_jsx("div", { children: cell === '设置' ? (_jsx("button", { type: "button", className: "other-price-link", onClick: () => {
                                                            setActivityEditing({ channel: row[0], column });
                                                            setDraftValue('');
                                                        }, children: "\u8BBE\u7F6E" })) : (_jsx("span", { className: cell === '暂不支持' ? 'is-disabled-value' : '', children: cell })) }, `${column}-${index}`));
                                            })] }, `${group.roomType}-${row[0]}-${rowIndex}`)))] }, group.roomType)))] })) : (_jsxs("div", { className: "other-price-table", "aria-label": "\u6742\u8D39\u8BBE\u7F6E\u8868\u683C", children: [_jsxs("div", { className: "other-price-table__head", children: [_jsx("div", {}), feeColumns.map((column) => (_jsx("div", { children: column }, column)))] }), requestState.kind === 'loading' ? _jsx("div", { className: "other-price-empty", children: "\u6B63\u5728\u52A0\u8F7D\u8D39\u7528\u914D\u7F6E..." }) : null, filteredRows.length === 0 && requestState.kind !== 'loading' ? _jsx("div", { className: "other-price-empty", children: "\u6682\u65E0\u6742\u8D39\u8BBE\u7F6E\u6570\u636E" }) : null, filteredRows.map((group) => (_jsxs("div", { className: "other-price-group", children: [_jsx("div", { className: "other-price-room", children: group.roomType }), group.channels.map((row, rowIndex) => (_jsxs("div", { className: "other-price-row", children: [_jsx("div", { children: row[0] }), row.slice(1).map((cell, index) => {
                                                const column = feeColumns[index];
                                                return (_jsx("div", { children: cell === '设置' ? (_jsx("button", { type: "button", className: "other-price-link", onClick: () => {
                                                            setEditing({ channel: row[0], column });
                                                            setDraftValue('');
                                                        }, children: "\u8BBE\u7F6E" })) : (_jsx("span", { children: cell })) }, `${column}-${index}`));
                                            })] }, `${group.roomType}-${row[0]}-${rowIndex}`)))] }, group.roomType)))] }))] }), editing && (_jsx("div", { className: "other-price-drawer-backdrop", role: "presentation", children: _jsxs("section", { className: "other-price-drawer", role: "dialog", "aria-modal": "true", "aria-label": "\u6539\u4EF7", children: [_jsxs("header", { children: [_jsx("strong", { children: "\u6539\u4EF7" }), _jsx("button", { type: "button", "aria-label": "\u5173\u95ED", onClick: () => setEditing(null), children: "\u00D7" })] }), _jsxs("div", { className: "other-price-drawer__form", children: [_jsxs("label", { children: [_jsx("span", { children: "\u4E00\u952E\u6539\u4EF7" }), _jsxs("div", { className: "other-price-money-input", children: [_jsx("em", { children: "\uFFE5" }), _jsx("input", { value: draftValue, placeholder: "\u8BF7\u8F93\u5165\u4EF7\u683C", onChange: (event) => setDraftValue(event.target.value), autoFocus: true })] })] }), _jsxs("p", { children: ["\u5F53\u524D\u5355\u5143\u683C\uFF1A", editing.channel, " / ", editing.column] })] }), _jsxs("footer", { children: [_jsx("button", { type: "button", className: "is-primary", onClick: () => showOperationFeedback(`杂费设置已保存：${editing.channel} / ${editing.column}`), children: "\u4FDD\u5B58" }), _jsx("button", { type: "button", onClick: () => setEditing(null), children: "\u53D6\u6D88" })] })] }) })), activityEditing && (_jsx("div", { className: "other-price-drawer-backdrop", role: "presentation", children: _jsxs("section", { className: "other-price-drawer", role: "dialog", "aria-modal": "true", "aria-label": isActivityCreate ? '活动设置' : '改折扣', children: [_jsxs("header", { children: [_jsx("strong", { children: isActivityCreate ? '活动设置' : '改折扣' }), _jsx("button", { type: "button", "aria-label": "\u5173\u95ED", onClick: () => setActivityEditing(null), children: "\u00D7" })] }), isActivityCreate ? (_jsxs("div", { className: "other-price-drawer__form other-price-activity-create", children: [_jsx("strong", { children: "\u8BBE\u7F6E\u8FDE\u4F4F\u5929\u6570" }), _jsx("p", { children: "\u6709\u54EA\u4E9B\u65F6\u6BB5\uFF0C\u60A8\u5E0C\u671B\u7279\u522B\u8C03\u6574\u4EF7\u683C\uFF1F" }), _jsx("p", { children: "\u6807\u6CE8*\u8005\u6240\u6709\u5E73\u53F0\u90FD\u652F\u6301\uFF0C\u5EFA\u8BAE\u4F7F\u7528" }), _jsx("button", { type: "button", onClick: () => setOperationFeedback('连住活动时段已添加'), children: "\u6DFB \u52A0" })] })) : (_jsxs("div", { className: "other-price-drawer__form other-price-discount-form", children: [_jsx("p", { children: "\u5DF2\u90091\u9879" }), ['第一阶段', '第二阶段'].map((stage) => (_jsxs("div", { className: "other-price-discount-stage", children: [_jsx("strong", { children: stage }), _jsxs("label", { children: [_jsx("span", { children: "\u65F6\u95F4" }), _jsx("input", { placeholder: "\u8BF7\u9009\u62E9\u65F6\u95F4" })] }), _jsxs("label", { children: [_jsx("span", { children: "\u6298\u6263" }), _jsx("input", { value: stage === '第一阶段' ? draftValue : '', placeholder: "\u793A\u4F8B\uFF1A\u8F93\u51659.0\u5373\u62539\u6298", onChange: (event) => stage === '第一阶段' && setDraftValue(event.target.value), autoFocus: stage === '第一阶段' })] })] }, stage)))] })), _jsxs("footer", { children: [_jsx("button", { type: "button", className: "is-primary", onClick: () => showOperationFeedback(isActivityCreate ? '活动设置已保存' : '活动折扣已保存'), children: "\u4FDD\u5B58" }), _jsx("button", { type: "button", onClick: () => setActivityEditing(null), children: "\u53D6\u6D88" })] })] }) }))] }));
}
export function PricePage() {
    const location = useLocation();
    const active = useMemo(() => {
        if (location.pathname.includes('channelPrice'))
            return '渠道RP价';
        if (location.pathname.includes('priceComparison'))
            return '竞争圈比价';
        if (location.pathname.includes('retailPrice'))
            return '门市价';
        if (location.pathname.includes('otherPrice'))
            return '其他价格';
        if (location.pathname.includes('priceBoard'))
            return '电子房价牌';
        return '中央价';
    }, [location.pathname]);
    if (active === '电子房价牌')
        return _jsx(PriceBoardPage, {});
    if (active === '竞争圈比价')
        return _jsx(PriceComparisonPage, {});
    if (active === '门市价')
        return _jsx(RetailPricePage, {});
    if (active === '其他价格')
        return _jsx(OtherPricePage, {});
    return _jsx(RegularPricePage, { active: active });
}
