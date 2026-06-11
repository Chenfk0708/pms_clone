import { jsxs as _jsxs, jsx as _jsx, Fragment as _Fragment } from "react/jsx-runtime";
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { cancelHouseMonthOrder, changeHouseMonthOrderRoom, checkInHouseMonthOrder, checkOutHouseMonthOrder, closeHouseMonthRoom, fetchHouseMonthChangeRoomOptions, fetchHouseMonthsDefaultCampId, fetchHouseMonthsSnapshot, markNoShowHouseMonthOrder, openHouseMonthRoom, saveHouseMonthOrderGuests, skipStockHouseMonthOrder, } from '../services/houseMonths';
import { StoreSelectControl } from '../components/StoreSelect';
import { useStoreOptions } from '../hooks/useStoreOptions';
import { fetchOrderRoomCategoryPrice } from '../services/orderRoomSelector';
import { OrderRefreshPopover } from './HouseStatusSharingPage';
import { OrderEntryDrawerHost } from './OrdersPage';
import { validateCredentialNumber, validateOptionalMainlandMobile, validatePersonName, } from '../utils/inputValidation';
import './HouseMonthsPage.css';
export const DEFAULT_ROOM_STATUS_DISPLAY_SETTINGS = {
    colorMode: 'order',
    showListPrice: false,
    showOrders: true,
    showOrderPrice: true,
    showRoomCode: false,
    showOrderTags: true,
    showRoomStatus: true,
};
const ORDER_GUEST_DOCUMENT_TYPES = ['居民身份证', '港澳通行证', '港澳回乡证', '台胞证', 'Passport'];
const ORDER_TAG_GROUP_LABEL = '默认标签';
const ORDER_TAG_OPTIONS = ['促销', '重单', '保留房', '钟点房'];
const weekdays = ['日', '一', '二', '三', '四', '五', '六'];
const DAY_MS = 24 * 60 * 60 * 1000;
const WINDOW_START_OFFSET_DAYS = -3;
const monthDates = Array.from({ length: 33 }, (_, index) => {
    const today = new Date();
    const localMidnight = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const date = new Date(localMidnight.getTime() + (WINDOW_START_OFFSET_DAYS + index) * DAY_MS);
    const isoDate = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    return {
        fullDate: `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}`,
        isoDate,
        date: `${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}`,
        weekday: weekdays[date.getDay()],
        remain: '余0间',
        hot: date.getDay() === 5 || date.getDay() === 6,
    };
});
const monthPickerWeekdays = ['\u4e00', '\u4e8c', '\u4e09', '\u56db', '\u4e94', '\u516d', '\u65e5'];
const MONTH_WINDOW_DAYS = 33;
const DEFAULT_SELECTED_DATE_INDEX = 3;
function toLocalDate(date) {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}
function shiftDate(date, days) {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);
}
function formatIsoDate(date) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}
function formatFullDate(date) {
    return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}`;
}
function formatMonthDay(date) {
    return `${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}`;
}
function parseIsoDate(isoDate) {
    const [year, month, day] = isoDate.split('-').map(Number);
    return new Date(year, (month || 1) - 1, day || 1);
}
function parsePlainAmount(value) {
    if (!value)
        return undefined;
    const amount = Number.parseFloat(value.replace(/[^\d.-]/g, ''));
    return Number.isFinite(amount) ? amount : undefined;
}
function formatPlainAmount(value) {
    if (!Number.isFinite(value))
        return '0';
    return Number.isInteger(value) ? String(value) : String(Number(value.toFixed(2)));
}
function sumSelectedCellPrices(cells) {
    const prices = cells.map((cell) => parsePlainAmount(cell.price));
    if (prices.some((price) => price === undefined))
        return undefined;
    return prices.reduce((sum, price) => sum + (price ?? 0), 0);
}
function getStayNightCount(stayRange) {
    const [startPart, endPart] = stayRange.split('-');
    if (!startPart || !endPart)
        return 2;
    const [startYear, startMonth, startDay] = startPart.split('.').map(Number);
    const endParts = endPart.split('.').map(Number);
    if (!startYear || !startMonth || !startDay || endParts.length < 2)
        return 2;
    const [endMonth, endDay] = endParts.length === 3 ? [endParts[1], endParts[2]] : [endParts[0], endParts[1]];
    const endYear = endParts.length === 3 ? endParts[0] : endMonth < startMonth ? startYear + 1 : startYear;
    if (!endMonth || !endDay)
        return 2;
    const startDate = new Date(startYear, startMonth - 1, startDay);
    const endDate = new Date(endYear, endMonth - 1, endDay);
    const diffDays = Math.round((toLocalDate(endDate).getTime() - toLocalDate(startDate).getTime()) / DAY_MS);
    return diffDays > 0 ? diffDays : 2;
}
function getStayRangeDetails(stayRange) {
    const [startPart, endPart] = stayRange.split('-');
    if (!startPart || !endPart) {
        return {
            checkinDate: '2026-05-20',
            checkoutDate: '2026-05-21',
            nights: 1,
        };
    }
    const [startYear, startMonth, startDay] = startPart.split('.').map(Number);
    const endParts = endPart.split('.').map(Number);
    if (!startYear || !startMonth || !startDay || endParts.length < 2) {
        return {
            checkinDate: startPart.replace(/\./g, '-'),
            checkoutDate: endPart.replace(/\./g, '-'),
            nights: getStayNightCount(stayRange),
        };
    }
    const [endMonth, endDay] = endParts.length === 3 ? [endParts[1], endParts[2]] : [endParts[0], endParts[1]];
    const endYear = endParts.length === 3 ? endParts[0] : endMonth < startMonth ? startYear + 1 : startYear;
    return {
        checkinDate: `${String(startYear).padStart(4, '0')}-${String(startMonth).padStart(2, '0')}-${String(startDay).padStart(2, '0')}`,
        checkoutDate: `${String(endYear).padStart(4, '0')}-${String(endMonth).padStart(2, '0')}-${String(endDay).padStart(2, '0')}`,
        nights: getStayNightCount(stayRange),
    };
}
function copyText(text) {
    if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
        return navigator.clipboard.writeText(text);
    }
    if (typeof document !== 'undefined') {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.setAttribute('readonly', 'true');
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        textarea.style.pointerEvents = 'none';
        document.body.appendChild(textarea);
        textarea.select();
        try {
            document.execCommand('copy');
        }
        finally {
            document.body.removeChild(textarea);
        }
    }
    return Promise.resolve();
}
function createMonthDateColumns(startDate) {
    return Array.from({ length: MONTH_WINDOW_DAYS }, (_, index) => {
        const date = shiftDate(startDate, index);
        return {
            fullDate: formatFullDate(date),
            isoDate: formatIsoDate(date),
            date: formatMonthDay(date),
            weekday: weekdays[date.getDay()],
            remain: monthDates[0]?.remain ?? '',
            hot: date.getDay() === 5 || date.getDay() === 6,
        };
    });
}
function createMonthPickerCells(cursorMonth, selectedDate) {
    const monthStart = new Date(cursorMonth.getFullYear(), cursorMonth.getMonth(), 1);
    const firstGridDate = shiftDate(monthStart, -((monthStart.getDay() + 6) % 7));
    const selectedIsoDate = formatIsoDate(selectedDate);
    return Array.from({ length: 42 }, (_, index) => {
        const date = shiftDate(firstGridDate, index);
        return {
            isoDate: formatIsoDate(date),
            label: String(date.getDate()),
            inViewMonth: date.getMonth() === cursorMonth.getMonth(),
            isSelected: formatIsoDate(date) === selectedIsoDate,
        };
    });
}
export function createHoveredBooking(rect, cell, roomType, roomLabel) {
    const popoverWidth = 300;
    const popoverHeight = 232;
    const left = Math.min(rect.right + 18, window.innerWidth - popoverWidth - 12);
    const top = Math.max(8, Math.min(Math.round(rect.top + rect.height / 2 - popoverHeight / 2), window.innerHeight - popoverHeight - 12));
    return {
        cell,
        roomType,
        roomLabel,
        left: Math.round(left),
        top,
    };
}
function createSelectedMonthCell(key, row, column, status) {
    return {
        key,
        storeId: row.storeId,
        storeName: row.storeName,
        roomType: row.label,
        roomCategoryId: row.roomCategoryId || row.id,
        roomId: row.roomId,
        roomLabel: row.roomLabel,
        date: column.isoDate,
        price: row.price,
        monthlyRent: row.monthlyRent,
        status,
    };
}
function resolveRoomCategoryLabel(roomCategoryFilter, rows) {
    const match = rows.find((row) => (row.roomCategoryId || row.label) === roomCategoryFilter);
    return match?.label || roomCategoryFilter;
}
function sortSelectedMonthCells(cells) {
    return [...cells].sort((left, right) => left.date.localeCompare(right.date));
}
function areSelectedCellsContinuous(cells) {
    const sortedCells = sortSelectedMonthCells(cells);
    return sortedCells.every((cell, index) => {
        if (index === 0)
            return true;
        const previousDate = parseIsoDate(sortedCells[index - 1].date);
        return formatIsoDate(shiftDate(previousDate, 1)) === cell.date;
    });
}
function getBookingMergeKey(cell) {
    if (!cell.tone.startsWith('booking'))
        return '';
    return cell.orderId || `${cell.title}|${cell.subtitle ?? ''}|${cell.stayRange ?? ''}|${cell.phone ?? ''}`;
}
function createRenderedRoomCells(cells) {
    const renderedCells = [];
    let cellIndex = 0;
    while (cellIndex < cells.length) {
        const cell = cells[cellIndex];
        const mergeKey = getBookingMergeKey(cell);
        let span = 1;
        if (mergeKey) {
            while (cellIndex + span < cells.length && getBookingMergeKey(cells[cellIndex + span]) === mergeKey) {
                span += 1;
            }
        }
        renderedCells.push({ cell, cellIndex, span });
        cellIndex += span;
    }
    return renderedCells;
}
export function MonthOrderPopover({ hoveredBooking }) {
    return (_jsxs("section", { className: "month-order-popover", style: { left: hoveredBooking.left, top: hoveredBooking.top }, "aria-label": "\u8BA2\u5355\u60AC\u6D6E\u4FE1\u606F", children: [_jsxs("header", { children: [hoveredBooking.roomType, "-", hoveredBooking.roomLabel] }), _jsxs("div", { className: "month-order-popover__content", children: [_jsxs("div", { children: ["\u9884\u8BA2\u4EBA: ", hoveredBooking.cell.title] }), _jsxs("div", { children: ["\u624B\u673A\u53F7: ", hoveredBooking.cell.phone ?? '-'] }), _jsxs("div", { children: ["\u5165\u79BB\u65F6\u95F4: ", hoveredBooking.cell.stayRange ?? '2026-05-18-05-20'] }), _jsxs("div", { children: ["\u6E20\u9053\u6765\u6E90: ", _jsx("span", { children: hoveredBooking.cell.subtitle ?? '-' })] }), _jsxs("div", { className: "month-order-popover__price", children: [_jsxs("span", { children: ["\u623F\u8D39(\u51CF\u4F63): ", _jsx("em", { children: hoveredBooking.cell.amount ?? '-' })] }), _jsxs("span", { children: ["\u8BA2\u5355\u603B\u6536\u5165: ", _jsx("em", { children: hoveredBooking.cell.totalIncome ?? hoveredBooking.cell.amount ?? '-' })] })] }), _jsxs("div", { children: ["\u5907\u6CE8: ", hoveredBooking.cell.remark ?? '-'] })] })] }));
}
const batchConfig = {
    dirty: { title: '批量设脏', enter: '已进入批量设脏模式', apply: '设为脏房', result: '脏房' },
    clean: { title: '批量设净', enter: '已进入批量设净模式', apply: '设为净房', result: '净房' },
    close: { title: '批量关房', enter: '已进入批量关房模式', apply: '设为关闭房', result: '关闭房' },
    open: { title: '批量开房', enter: '已进入批量开房模式', apply: '设为开放房', result: '开放房' },
};
function createBatchDialogInitialState(mode) {
    return {
        roomText: '',
        dateStart: '',
        dateEnd: '',
        channel: 'all',
        closeType: 'disabled',
        remark: '',
        mode,
    };
}
export function BatchOperationDialog({ mode, state, onChange, onClose, onConfirm, }) {
    const isDirtyLike = mode === 'dirty' || mode === 'clean';
    const isClose = mode === 'close';
    const isOpen = mode === 'open';
    const title = batchConfig[mode].title;
    return (_jsx("div", { className: "month-order-dialog-scrim month-batch-dialog-scrim", role: "presentation", onClick: onClose, children: _jsxs("section", { className: `month-order-dialog month-order-dialog--medium month-batch-dialog${isClose || isOpen ? ' month-batch-dialog--wide' : ''}`, role: "dialog", "aria-modal": "true", "aria-label": title, onClick: (event) => event.stopPropagation(), children: [_jsxs("header", { className: "month-order-dialog__header month-batch-dialog__header", children: [_jsx("strong", { children: title }), _jsx("button", { type: "button", "aria-label": `关闭${title}`, onClick: onClose, children: '\u00d7' })] }), _jsxs("div", { className: "month-order-dialog__body month-batch-dialog__body", children: [_jsxs("div", { className: "month-batch-dialog__field", children: [_jsx("span", { children: '\u623f\u95f4:' }), _jsxs("div", { className: "month-batch-dialog__room-picker", children: [_jsx("input", { className: "month-order-dialog__input", "aria-label": '\u6279\u91cf\u623f\u95f4', placeholder: '\u8bf7\u6dfb\u52a0\u623f\u95f4', value: state.roomText, onChange: (event) => onChange({ roomText: event.target.value }) }), _jsx("button", { type: "button", className: "month-batch-dialog__link", onClick: () => onChange({ roomText: '\u623f\u95f41' }), children: '+\u6dfb\u52a0' })] })] }), isDirtyLike ? null : (_jsxs(_Fragment, { children: [_jsxs("div", { className: "month-batch-dialog__field", children: [_jsx("span", { children: '\u65e5\u671f:' }), _jsxs("div", { className: "month-batch-dialog__date-range", children: [_jsx("input", { className: "month-order-dialog__input", "aria-label": '\u5f00\u59cb\u65e5\u671f', type: "date", value: state.dateStart, onChange: (event) => onChange({ dateStart: event.target.value }) }), _jsx("em", { children: '→' }), _jsx("input", { className: "month-order-dialog__input", "aria-label": '\u7ed3\u675f\u65e5\u671f', type: "date", value: state.dateEnd, onChange: (event) => onChange({ dateEnd: event.target.value }) })] })] }), _jsxs("div", { className: "month-batch-dialog__field", children: [_jsx("span", { children: '\u6e20\u9053:' }), _jsxs("select", { className: "month-order-dialog__select month-batch-dialog__select", "aria-label": '\u5168\u90e8\u6e20\u9053', value: state.channel, onChange: (event) => onChange({ channel: event.target.value }), children: [_jsx("option", { value: "all", children: '\u5168\u90e8\u6e20\u9053' }), _jsx("option", { value: "ctrip", children: '\u643a\u7a0b' }), _jsx("option", { value: "meituan-hotel", children: '\u7f8e\u56e2\u9152\u5e97' }), _jsx("option", { value: "feizhu-hotel", children: '\u98de\u732a\u6dd8\u9152\u5e97' }), _jsx("option", { value: "meituan-homestay", children: '\u7f8e\u56e2\u6c11\u5bbf' }), _jsx("option", { value: "tujia", children: '\u9014\u5bb6' }), _jsx("option", { value: "muniao", children: '\u6728\u9e1f' }), _jsx("option", { value: "xiaozhu", children: '\u5c0f\u732a' }), _jsx("option", { value: "locals", children: '\u8def\u5ba2\u4e91\u805a\u5408' })] })] })] })), isClose ? (_jsxs(_Fragment, { children: [_jsxs("div", { className: "month-batch-dialog__field month-batch-dialog__field--radios", children: [_jsx("span", { children: '\u5173\u623f\u7c7b\u578b:' }), _jsxs("div", { className: "month-order-dialog__radio-group month-batch-dialog__radio-group", children: [_jsxs("label", { children: [_jsx("input", { type: "radio", name: "batch-close-type", checked: state.closeType === 'disabled', onChange: () => onChange({ closeType: 'disabled' }) }), _jsx("span", { children: '\u505c\u7528\u623f' })] }), _jsxs("label", { children: [_jsx("input", { type: "radio", name: "batch-close-type", checked: state.closeType === 'repair', onChange: () => onChange({ closeType: 'repair' }) }), _jsx("span", { children: '\u7ef4\u4fee\u623f' })] }), _jsxs("label", { children: [_jsx("input", { type: "radio", name: "batch-close-type", checked: state.closeType === 'reserved', onChange: () => onChange({ closeType: 'reserved' }) }), _jsx("span", { children: '\u4fdd\u7559\u623f' })] })] })] }), _jsxs("div", { className: "month-batch-dialog__field month-batch-dialog__field--textarea", children: [_jsx("span", { children: '\u5907\u6ce8:' }), _jsxs("label", { className: "month-batch-dialog__textarea-wrap", children: [_jsx("textarea", { className: "month-order-dialog__textarea", "aria-label": '\u8bf7\u8f93\u5165\u5907\u6ce8', maxLength: 200, placeholder: '\u8bf7\u8f93\u5165\u5907\u6ce8', value: state.remark, onChange: (event) => onChange({ remark: event.target.value }) }), _jsxs("b", { children: [state.remark.length, " / 200"] })] })] }), _jsxs("p", { className: "month-batch-dialog__hint", children: ['\u6b64\u7c7b\u578b\u5173\u623f\u4ecd\u8bb0\u4e3a\u53ef\u552e\u8ba1\u5165\u5165\u4f4f\u7387\uff0c', _jsx("button", { type: "button", children: '\u53ef\u524d\u5f80\u8bbe\u7f6e' })] })] })) : null, isOpen ? (_jsx("p", { className: "month-batch-dialog__hint month-batch-dialog__hint--inline", children: '\u6b64\u7c7b\u578b\u5173\u623f\u4ecd\u8bb0\u4e3a\u53ef\u552e\u8ba1\u5165\u5165\u4f4f\u7387\uff0c\u53ef\u524d\u5f80\u8bbe\u7f6e' })) : null] }), _jsxs("footer", { className: "month-order-dialog__footer month-batch-dialog__footer", children: [_jsx("button", { type: "button", onClick: onClose, children: '\u53d6\u6d88' }), _jsx("button", { type: "button", className: "is-primary", onClick: onConfirm, children: '\u786e\u5b9a' })] })] }) }));
}
const legendSections = [
    {
        title: '房间信息',
        layout: 'rooms',
        items: [
            { label: '空房', kind: 'room', tone: 'empty' },
            { label: '关房', kind: 'room', tone: 'closed' },
            { label: '各平台房态不一致', kind: 'room', tone: 'mismatch' },
        ],
    },
    {
        title: '订单颜色',
        layout: 'colors',
        items: [
            { label: '待入住', kind: 'color', tone: 'pending' },
            { label: '入住中', kind: 'color', tone: 'live' },
            { label: '已退房', kind: 'color', tone: 'checkout' },
            { label: '重单', kind: 'color', tone: 'duplicate' },
        ],
    },
    {
        title: '房间状态',
        layout: 'icons',
        items: [
            { label: '脏房', kind: 'status', tone: 'orange', icon: 'dirty' },
            { label: '停用房', kind: 'status', tone: 'red', icon: 'disabled' },
            { label: '维修房', kind: 'status', tone: 'blue', icon: 'repair' },
            { label: '保留房', kind: 'status', tone: 'purple', icon: 'reserve' },
        ],
    },
    {
        title: '订单标签',
        layout: 'icons',
        items: [
            { label: '重单', kind: 'tag', tone: 'red', marker: '重', fill: true },
            { label: '订单备注', kind: 'tag', tone: 'orange', marker: '备' },
            { label: '订单欠款', kind: 'tag', tone: 'red', marker: '欠' },
            { label: '提前退房', kind: 'tag', tone: 'blue', marker: '退' },
            { label: '邀请续住中', kind: 'tag', tone: 'orange', marker: '邀' },
            { label: '续住订单', kind: 'tag', tone: 'blue', marker: '续' },
        ],
    },
    {
        title: '入住类型',
        layout: 'icons',
        items: [
            { label: '钟点房', kind: 'tag', tone: 'blue', marker: '钟' },
            { label: '长租', kind: 'tag', tone: 'purple', marker: '长' },
        ],
    },
];
const legendNotices = [
    '若格子出现“小红点”，为房态不一致，请点格子进行调整，统一当天房态避免重单！',
    '请避免在平台调整房态、房价等信息，统一在路客云维护，以免发生信息错乱、修改失败之情况！',
    '请关闭在平台的 iCal/日历同步功能，以免影响房态同步。',
];
function LegendStatusMark({ icon }) {
    switch (icon) {
        case 'dirty':
            return (_jsxs("svg", { viewBox: "0 0 24 24", "aria-hidden": "true", children: [_jsx("path", { d: "M6.5 6.5h8l3 3v6.5a3 3 0 0 1-3 3h-5a3 3 0 0 1-3-3z" }), _jsx("path", { d: "m9 12 2.2 2.2 4-4.4" })] }));
        case 'disabled':
            return (_jsxs("svg", { viewBox: "0 0 24 24", "aria-hidden": "true", children: [_jsx("path", { d: "M12 5.5 19 18H5z" }), _jsx("path", { d: "M12 10v4.2" }), _jsx("circle", { cx: "12", cy: "16.8", r: "0.9", fill: "currentColor", stroke: "none" })] }));
        case 'repair':
            return (_jsxs("svg", { viewBox: "0 0 24 24", "aria-hidden": "true", children: [_jsx("path", { d: "m14.6 6.4 2.9-2.1 1.2 1.2-2.1 2.9-.2 1.8-4.7 4.7a2.1 2.1 0 1 1-3-3l4.7-4.7z" }), _jsx("path", { d: "m8.4 10.8-2.9-.5L4.3 9l2.1-2.9" })] }));
        case 'reserve':
            return (_jsxs("svg", { viewBox: "0 0 24 24", "aria-hidden": "true", children: [_jsx("rect", { x: "7", y: "11", width: "10", height: "7.5", rx: "1.6" }), _jsx("path", { d: "M9 11V8.9A3 3 0 0 1 12 6a3 3 0 0 1 3 2.9V11" })] }));
    }
}
function RoomStatusLegendTile({ item, }) {
    return (_jsxs("div", { className: "room-status-legend__item", children: [_jsxs("span", { className: `room-status-legend__tile is-${item.kind} tone-${item.tone}`, "aria-hidden": "true", children: [item.kind === 'status' && item.icon ? (_jsx("span", { className: `room-status-legend__status-mark tone-${item.tone}`, children: _jsx(LegendStatusMark, { icon: item.icon }) })) : null, item.kind === 'tag' && item.marker ? (_jsx("span", { className: `room-status-legend__tag-mark tone-${item.tone}${item.fill ? ' is-filled' : ''}`, children: item.marker })) : null] }), _jsx("span", { className: "room-status-legend__label", children: item.label })] }));
}
export function RoomStatusLegendDrawer({ onClose }) {
    return (_jsxs("aside", { className: "room-status-side-drawer", role: "dialog", "aria-modal": "true", "aria-label": "\u56FE\u4F8B\u8BF4\u660E", children: [_jsxs("header", { className: "room-status-side-drawer__header", children: [_jsx("strong", { children: "\u56FE\u4F8B\u8BF4\u660E" }), _jsx("button", { type: "button", "aria-label": "\u5173\u95ED\u56FE\u4F8B\u8BF4\u660E", onClick: onClose, children: "\u00D7" })] }), _jsxs("div", { className: "room-status-side-drawer__body room-status-legend", children: [legendSections.map((section) => (_jsxs("section", { className: "room-status-legend__section", children: [_jsx("h3", { children: section.title }), _jsx("div", { className: `room-status-legend__items is-${section.layout}`, children: section.items.map((item) => (_jsx(RoomStatusLegendTile, { item: item }, item.label))) })] }, section.title))), _jsxs("section", { className: "room-status-legend__notice", children: [_jsx("h3", { children: "\u6CE8\u610F\u4E8B\u9879" }), _jsx("ol", { children: legendNotices.map((notice) => (_jsx("li", { children: notice }, notice))) })] })] })] }));
}
function DrawerSwitch({ label, checked, onChange, }) {
    return (_jsxs("button", { type: "button", role: "switch", "aria-checked": checked, "aria-label": label, className: "room-status-setting-switch", onClick: () => onChange(!checked), children: [_jsx("span", { children: label }), _jsx("i", { "aria-hidden": "true" })] }));
}
export function RoomStatusDisplaySettingsDrawer({ settings, onClose, onChange, }) {
    const patchSettings = (patch) => {
        onChange({ ...settings, ...patch });
    };
    return (_jsxs("aside", { className: "room-status-side-drawer room-status-side-drawer--settings", role: "dialog", "aria-modal": "true", "aria-label": "\u623F\u6001\u663E\u793A\u8BBE\u7F6E", children: [_jsxs("header", { className: "room-status-side-drawer__header", children: [_jsx("strong", { children: "\u623F\u6001\u663E\u793A\u8BBE\u7F6E" }), _jsx("button", { type: "button", "aria-label": "\u5173\u95ED\u623F\u6001\u663E\u793A\u8BBE\u7F6E", onClick: onClose, children: "\u00D7" })] }), _jsxs("div", { className: "room-status-side-drawer__body room-status-settings-panel", children: [_jsxs("section", { className: "room-status-settings-panel__section", children: [_jsx("h3", { children: "\u623F\u6001\u9875\uFF08\u53EF\u5DE6\u53F3\u62D6\u52A8\u6392\u5E8F\uFF09" }), _jsx("div", { className: "room-status-settings-panel__drag-list", "aria-label": "\u623F\u6001\u9875\u6392\u5E8F", children: ['月房态', '日房态'].map((label) => (_jsxs("button", { type: "button", className: "room-status-settings-panel__drag-item", children: [_jsx("span", { className: "room-status-settings-panel__eye", "aria-hidden": "true" }), _jsx("span", { children: label }), _jsx("span", { className: "room-status-settings-panel__handle", "aria-hidden": "true" })] }, label))) })] }), _jsxs("section", { className: "room-status-settings-panel__section", children: [_jsx("h3", { children: "\u65E5\u623F\u6001\u89C6\u56FE\uFF08\u53EF\u5DE6\u53F3\u62D6\u52A8\u6392\u5E8F\uFF09" }), _jsx("div", { className: "room-status-settings-panel__drag-list", "aria-label": "\u65E5\u623F\u6001\u89C6\u56FE\u6392\u5E8F", children: ['按房型', '按房间号', '按楼层'].map((label) => (_jsxs("button", { type: "button", className: "room-status-settings-panel__drag-item", children: [_jsx("span", { className: "room-status-settings-panel__eye", "aria-hidden": "true" }), _jsx("span", { children: label }), _jsx("span", { className: "room-status-settings-panel__handle", "aria-hidden": "true" })] }, label))) })] }), _jsxs("section", { className: "room-status-settings-panel__section", children: [_jsx("h3", { children: "\u8BA2\u5355\u989C\u8272" }), _jsxs("div", { className: "room-status-setting-radio-group", children: [_jsxs("label", { children: [_jsx("input", { type: "radio", name: "room-status-color-mode", checked: settings.colorMode === 'channel', onChange: () => patchSettings({ colorMode: 'channel' }) }), _jsx("span", { children: "\u6E20\u9053\u4E3A\u4E3B\u8272" })] }), _jsxs("label", { children: [_jsx("input", { type: "radio", name: "room-status-color-mode", checked: settings.colorMode === 'order', onChange: () => patchSettings({ colorMode: 'order' }) }), _jsx("span", { children: "\u8BA2\u5355\u72B6\u6001\u4E3A\u4E3B\u8272" })] })] })] }), _jsxs("section", { className: "room-status-settings-panel__section", children: [_jsx("h3", { children: "\u663E\u793A\u5185\u5BB9" }), _jsxs("div", { className: "room-status-settings-panel__switches", children: [_jsx(DrawerSwitch, { label: "\u663E\u793A\u95E8\u5E02\u4EF7", checked: settings.showListPrice, onChange: (checked) => patchSettings({ showListPrice: checked }) }), _jsx(DrawerSwitch, { label: "\u663E\u793A\u623F\u6E90\u7F16\u7801", checked: settings.showRoomCode, onChange: (checked) => patchSettings({ showRoomCode: checked }) })] })] })] })] }));
}
export function HouseMonthsPage() {
    const navigate = useNavigate();
    const location = useLocation();
    const monthBoardRef = useRef(null);
    const toastTimerRef = useRef(null);
    const today = useMemo(() => toLocalDate(new Date()), []);
    const [collapsed, setCollapsed] = useState(false);
    const [settingsOpen, setSettingsOpen] = useState(false);
    const [datePickerOpen, setDatePickerOpen] = useState(false);
    const [selectedDate, setSelectedDate] = useState(today);
    const [windowStartDate, setWindowStartDate] = useState(() => shiftDate(today, WINDOW_START_OFFSET_DAYS));
    const [pickerMonth, setPickerMonth] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1));
    const [toastMessage, setToastMessage] = useState('');
    const [activeChip, setActiveChip] = useState('all');
    const [query, setQuery] = useState('');
    const [roomType, setRoomType] = useState('');
    const [batchMenu, setBatchMenu] = useState(null);
    const [batchDialogMode, setBatchDialogMode] = useState(null);
    const [batchDialogState, setBatchDialogState] = useState(() => createBatchDialogInitialState('dirty'));
    const [filterMenu, setFilterMenu] = useState(null);
    const [batchResult, setBatchResult] = useState(null);
    const [selectedKeys, setSelectedKeys] = useState([]);
    const [selectedCells, setSelectedCells] = useState([]);
    const [selectedCell, setSelectedCell] = useState(null);
    const [selectionAnchor, setSelectionAnchor] = useState(null);
    const [selectedBooking, setSelectedBooking] = useState(null);
    const [hoveredBooking, setHoveredBooking] = useState(null);
    const [orderEntryInitialRoom, setOrderEntryInitialRoom] = useState(null);
    const [statusDrawer, setStatusDrawer] = useState(null);
    const [displaySettings, setDisplaySettings] = useState(DEFAULT_ROOM_STATUS_DISPLAY_SETTINGS);
    const [loadState, setLoadState] = useState('idle');
    const [loadError, setLoadError] = useState('');
    const [refreshPopoverOpen, setRefreshPopoverOpen] = useState(false);
    const [roomGroups, setRoomGroups] = useState([]);
    const [dateColumns, setDateColumns] = useState(() => createMonthDateColumns(shiftDate(today, WINDOW_START_OFFSET_DAYS)));
    const initialCampId = useMemo(() => {
        const queryCampId = new URLSearchParams(location.search).get('campId')?.trim();
        if (queryCampId)
            return queryCampId;
        return window.localStorage.getItem('pms.currentCampId')?.trim() || '';
    }, [location.search]);
    const resolvedCampIdRef = useRef('');
    const selectedDateIso = useMemo(() => formatIsoDate(selectedDate), [selectedDate]);
    const selectedDateIndex = useMemo(() => dateColumns.findIndex((column) => column.isoDate === selectedDateIso), [dateColumns, selectedDateIso]);
    const activeSelectedDateIndex = selectedDateIndex >= 0 ? selectedDateIndex : DEFAULT_SELECTED_DATE_INDEX;
    const monthPickerCells = useMemo(() => createMonthPickerCells(pickerMonth, selectedDate), [pickerMonth, selectedDate]);
    const pickerMonthLabel = `${pickerMonth.getFullYear()}\u5e74 ${pickerMonth.getMonth() + 1}\u6708`;
    const activeStoreCampId = useMemo(() => initialCampId || resolvedCampIdRef.current, [initialCampId]);
    const roomTypeLabel = useMemo(() => resolveRoomCategoryLabel(roomType, roomGroups), [roomGroups, roomType]);
    useEffect(() => {
        if (!toastMessage)
            return undefined;
        if (toastTimerRef.current)
            window.clearTimeout(toastTimerRef.current);
        toastTimerRef.current = window.setTimeout(() => {
            setToastMessage('');
            toastTimerRef.current = null;
        }, 2400);
        return () => {
            if (toastTimerRef.current) {
                window.clearTimeout(toastTimerRef.current);
                toastTimerRef.current = null;
            }
        };
    }, [toastMessage]);
    useEffect(() => {
        setDateColumns(createMonthDateColumns(windowStartDate));
        if (monthBoardRef.current)
            monthBoardRef.current.scrollLeft = 184;
    }, [windowStartDate]);
    const loadSnapshot = useCallback(async (nextRoomType = roomType, nextQuery = query) => {
        setLoadState('loading');
        setLoadError('');
        try {
            const requestColumns = createMonthDateColumns(windowStartDate);
            let activeCampId = activeStoreCampId || resolvedCampIdRef.current;
            if (!activeCampId) {
                activeCampId = await fetchHouseMonthsDefaultCampId();
                window.localStorage.setItem('pms.currentCampId', activeCampId);
                resolvedCampIdRef.current = activeCampId;
            }
            const snapshot = await fetchHouseMonthsSnapshot({
                campId: activeCampId,
                startDate: requestColumns[0].isoDate,
                days: requestColumns.length,
                roomCategoryId: nextRoomType || undefined,
                queryCode: nextQuery.trim() || undefined,
            }, requestColumns);
            setRoomGroups(snapshot.rows);
            setDateColumns(snapshot.columns);
            setLoadState('ready');
            setToastMessage('月房态已刷新，营业日历已同步');
        }
        catch (error) {
            setRoomGroups([]);
            setLoadState('error');
            setLoadError(error instanceof Error ? error.message : String(error));
        }
    }, [activeStoreCampId, query, roomType, windowStartDate]);
    useEffect(() => {
        let cancelled = false;
        queueMicrotask(() => {
            if (!cancelled)
                void loadSnapshot();
        });
        return () => {
            cancelled = true;
        };
    }, [loadSnapshot]);
    useEffect(() => {
        const closeByKey = (event) => {
            if (event.key !== 'Escape')
                return;
            setSettingsOpen(false);
            setFilterMenu(null);
            setBatchMenu(null);
            setDatePickerOpen(false);
            setSelectedBooking(null);
            setBatchDialogMode(null);
            setSelectedCells([]);
            setSelectedCell(null);
            setSelectionAnchor(null);
            setStatusDrawer(null);
        };
        const closeByPointer = (event) => {
            const target = event.target;
            if (!(target instanceof Element))
                return;
            if (!target.closest('.month-settings'))
                setSettingsOpen(false);
            if (!target.closest('.month-filter-menu'))
                setFilterMenu(null);
            if (!target.closest('.month-batch-action'))
                setBatchMenu(null);
            if (!target.closest('.month-toolbar__refresh-group'))
                setRefreshPopoverOpen(false);
            if (!target.closest('.month-calendar-title') && !target.closest('.month-date-picker'))
                setDatePickerOpen(false);
            if (!target.closest('.month-order-drawer') && !target.closest('.month-cell[class*="tone-booking-"]')) {
                setSelectedBooking(null);
            }
        };
        window.addEventListener('keydown', closeByKey);
        window.addEventListener('click', closeByPointer);
        return () => {
            window.removeEventListener('keydown', closeByKey);
            window.removeEventListener('click', closeByPointer);
        };
    }, []);
    const roomGroupStoreFallbackOptions = useMemo(() => roomGroups
        .filter((group) => group.storeId && group.storeId !== 'all')
        .map((group) => ({
        id: group.storeId,
        label: group.storeName || `门店 ${group.storeId}`,
    })), [roomGroups]);
    const { storeOptions: backendStoreOptions } = useStoreOptions({
        fallbackOptions: roomGroupStoreFallbackOptions,
    });
    const storeOptions = useMemo(() => {
        const stores = new Map();
        for (const store of backendStoreOptions) {
            if (store.id && store.id !== 'all')
                stores.set(store.id, { id: store.id, name: store.label });
        }
        for (const group of roomGroups) {
            if (group.storeId && group.storeId !== 'all') {
                stores.set(group.storeId, { id: group.storeId, name: group.storeName || `门店 ${stores.size + 1}` });
            }
        }
        return [{ id: 'all', name: '全部门店' }, ...stores.values()];
    }, [backendStoreOptions, roomGroups]);
    useEffect(() => {
        if (activeChip === 'all')
            return;
        if (storeOptions.some((store) => store.id === activeChip))
            return;
        setActiveChip('all');
    }, [activeChip, storeOptions]);
    const filteredRows = useMemo(() => {
        const keyword = query.trim();
        return roomGroups.filter((group) => {
            if (activeChip !== 'all' && group.storeId !== activeChip)
                return false;
            const searchable = [
                group.label,
                group.roomLabel,
                ...group.typeCells.map((cell) => cell.title),
                ...group.roomCells.map((cell) => `${cell.title} ${cell.subtitle ?? ''} ${cell.amount ?? ''}`),
            ].join(' ');
            if (keyword && !searchable.includes(keyword))
                return false;
            if (roomType && (group.roomCategoryId || group.label) !== roomType)
                return false;
            return true;
        });
    }, [activeChip, query, roomGroups, roomType]);
    const setDateFromPicker = (date) => {
        const nextDate = toLocalDate(date);
        setSelectedDate(nextDate);
        setWindowStartDate(shiftDate(nextDate, WINDOW_START_OFFSET_DAYS));
        setPickerMonth(new Date(nextDate.getFullYear(), nextDate.getMonth(), 1));
        setDatePickerOpen(false);
    };
    const toggleDatePicker = () => {
        setPickerMonth(new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1));
        setDatePickerOpen((open) => !open);
    };
    const shiftPickerMonth = (months) => {
        setPickerMonth((current) => new Date(current.getFullYear(), current.getMonth() + months, 1));
    };
    const startBatch = (mode) => {
        setBatchMenu(null);
        setBatchResult(null);
        setBatchDialogState(createBatchDialogInitialState(mode));
        setBatchDialogMode(mode);
    };
    const applyBatch = (mode) => {
        setBatchDialogMode(null);
        setBatchResult(mode);
        setSelectedKeys([]);
        setSelectedCells([]);
        setSelectedCell(null);
        setSelectionAnchor(null);
        setToastMessage(`${batchConfig[mode].title}已完成：已设为${batchConfig[mode].result}`);
    };
    const showActionResult = (action) => {
        setToastMessage(action === '复制成功' ? action : `${action}已处理`);
    };
    const selectMonthCell = (key, row, cellIndex, rect, status) => {
        const column = dateColumns[cellIndex];
        if (!column)
            return;
        if (selectedKeys.includes(key)) {
            const nextCells = selectedCells.filter((cell) => cell.key !== key);
            setSelectedCells(nextCells);
            setSelectedKeys(nextCells.map((cell) => cell.key));
            setSelectedCell(nextCells.at(-1) ?? null);
            if (nextCells.length === 0) {
                setSelectionAnchor(null);
            }
            else {
                updateSelectionAnchor(rect);
            }
            return;
        }
        const nextCell = createSelectedMonthCell(key, row, column, status);
        const nextCells = [...selectedCells, nextCell];
        setSelectedCells(nextCells);
        setSelectedKeys(nextCells.map((cell) => cell.key));
        setSelectedCell(nextCell);
        updateSelectionAnchor(rect);
    };
    const openOrderEntryForSelectedCell = async () => {
        const cells = selectedCells.length ? selectedCells : selectedCell ? [selectedCell] : [];
        if (!cells.length)
            return;
        const firstCell = cells[0];
        const sameRoom = cells.every((cell) => cell.roomCategoryId === firstCell.roomCategoryId && cell.roomId === firstCell.roomId);
        if (!sameRoom || !areSelectedCellsContinuous(cells)) {
            setToastMessage('多选录单请连续选择同一房间日期');
            return;
        }
        const sortedCells = sortSelectedMonthCells(cells);
        const startDate = sortedCells[0].date;
        const endDate = formatIsoDate(shiftDate(parseIsoDate(sortedCells[sortedCells.length - 1].date), 1));
        const days = sortedCells.length;
        const closedCells = sortedCells.filter((cell) => cell.status === 'closed');
        if (closedCells.length > 0) {
            const campId = activeStoreCampId || resolvedCampIdRef.current;
            if (!campId) {
                setToastMessage('缺少当前门店，无法开房录单');
                return;
            }
            try {
                await Promise.all(closedCells.map((cell) => openHouseMonthRoom({
                    campId,
                    roomCategoryId: cell.roomCategoryId,
                    roomId: cell.roomId,
                    date: cell.date,
                    reason: '月房态录单自动开房',
                })));
                await loadSnapshot(roomType, query);
            }
            catch (error) {
                setToastMessage(`开房失败：${error instanceof Error ? error.message : String(error)}`);
                return;
            }
        }
        const inlinePriceTotal = sumSelectedCellPrices(sortedCells);
        let price = inlinePriceTotal !== undefined ? formatPlainAmount(inlinePriceTotal) : undefined;
        let unitPrice = inlinePriceTotal !== undefined ? formatPlainAmount(inlinePriceTotal / days) : firstCell.price;
        if (!price) {
            const campId = activeStoreCampId || resolvedCampIdRef.current;
            if (!campId) {
                setToastMessage('Missing campId, cannot load room price');
                return;
            }
            try {
                const categoryPrice = await fetchOrderRoomCategoryPrice({
                    campId,
                    poiId: firstCell.storeId,
                    roomCategoryId: firstCell.roomCategoryId,
                    startDate,
                    days,
                    stayType: 'daily_room',
                });
                price = categoryPrice?.price;
                unitPrice = categoryPrice?.unitPrice;
            }
            catch (error) {
                setToastMessage(`Load room price failed: ${error instanceof Error ? error.message : String(error)}`);
                return;
            }
        }
        clearSelectedCells();
        setOrderEntryInitialRoom({
            poiId: firstCell.storeId,
            poiName: firstCell.storeName,
            roomCategoryId: firstCell.roomCategoryId,
            roomCategoryName: firstCell.roomType,
            roomId: firstCell.roomId,
            roomName: firstCell.roomLabel,
            startDate,
            endDate,
            price,
            unitPrice,
            monthlyRent: firstCell.monthlyRent,
        });
        setToastMessage(closedCells.length > 0 ? '已开房，录入订单面板已打开' : '录入订单面板已打开，可继续补充联系人和费用信息');
    };
    const closeSelectedMonthCellRoom = async () => {
        const targetCells = (selectedCells.length ? selectedCells : selectedCell ? [selectedCell] : []).filter((cell) => cell.status === 'blank');
        if (!targetCells.length)
            return;
        const campId = activeStoreCampId || resolvedCampIdRef.current;
        if (!campId) {
            setToastMessage('缺少当前门店，无法关房');
            return;
        }
        try {
            const results = await Promise.all(targetCells.map((cell) => closeHouseMonthRoom({
                campId,
                roomCategoryId: cell.roomCategoryId,
                roomId: cell.roomId,
                date: cell.date,
                reason: '月房态手动关房',
            })));
            clearSelectedCells();
            await loadSnapshot(roomType, query);
            setToastMessage(targetCells.length === 1 ? results[0]?.message || '关房成功' : `已关房${targetCells.length}个房态`);
        }
        catch (error) {
            setToastMessage(`关房失败：${error instanceof Error ? error.message : String(error)}`);
        }
    };
    const openSelectedMonthCellRoom = async () => {
        const targetCells = (selectedCells.length ? selectedCells : selectedCell ? [selectedCell] : []).filter((cell) => cell.status === 'closed');
        if (!targetCells.length)
            return;
        const campId = activeStoreCampId || resolvedCampIdRef.current;
        if (!campId) {
            setToastMessage('缺少当前门店，无法开房');
            return;
        }
        try {
            const results = await Promise.all(targetCells.map((cell) => openHouseMonthRoom({
                campId,
                roomCategoryId: cell.roomCategoryId,
                roomId: cell.roomId,
                date: cell.date,
                reason: '月房态手动开房',
            })));
            clearSelectedCells();
            await loadSnapshot(roomType, query);
            setToastMessage(targetCells.length === 1 ? results[0]?.message || '开房成功' : `已开房${targetCells.length}个房态`);
        }
        catch (error) {
            setToastMessage(`开房失败：${error instanceof Error ? error.message : String(error)}`);
        }
    };
    const clearSelectedCells = () => {
        setSelectedKeys([]);
        setSelectedCells([]);
        setSelectedCell(null);
        setSelectionAnchor(null);
    };
    const clearFilters = () => {
        setQuery('');
        setRoomType('');
        void loadSnapshot('', '');
    };
    const handleStoreSwitch = (storeId) => {
        const nextStore = storeOptions.find((store) => store.id === storeId);
        const nextCampId = activeStoreCampId.trim();
        setActiveChip(storeId);
        if (nextCampId) {
            window.localStorage.setItem('pms.currentCampId', nextCampId);
            resolvedCampIdRef.current = nextCampId;
        }
        setToastMessage(storeId === 'all'
            ? '\u5df2\u5207\u6362\u5230\u5168\u90e8\u95e8\u5e97'
            : `\u5df2\u5207\u6362\u5230${nextStore?.name ?? '\u5f53\u524d\u95e8\u5e97'}`);
    };
    const clearRoomTypeFilter = () => {
        setRoomType('');
        setFilterMenu(null);
        void loadSnapshot('', query);
    };
    const hasFilters = Boolean(query || roomType);
    const showBookingPopover = (event, cell, row) => {
        const rect = event.currentTarget.getBoundingClientRect();
        setHoveredBooking(createHoveredBooking(rect, cell, row.label, row.roomLabel));
    };
    const openOrderDrawer = (cell, row) => {
        setHoveredBooking(null);
        setSelectedBooking({
            cell,
            roomType: row.label,
            roomLabel: row.roomLabel,
        });
    };
    const isSelectableCell = (cell) => cell.tone === 'blank' || cell.tone === 'disabled';
    const updateSelectionAnchor = (rect) => {
        const panelWidth = 138;
        const left = Math.min(window.innerWidth - panelWidth - 12, Math.max(12, Math.round(rect.left + rect.width / 2 - panelWidth / 2)));
        const top = Math.min(window.innerHeight - 120, Math.round(rect.bottom + 8));
        setSelectionAnchor({ left, top });
    };
    return (_jsxs("div", { className: "page-stack month-status-page", children: [_jsx("h1", { className: "month-route-heading", children: "\u6708\u623F\u6001" }), _jsxs("section", { className: "month-toolbar", "aria-label": "\u6708\u623F\u6001\u7B5B\u9009", children: [_jsxs("div", { className: "month-toolbar__primary", children: [_jsxs("div", { className: "segmented", children: [_jsx("button", { type: "button", className: "is-active", children: "\u6708\u623F\u6001" }), _jsx("button", { type: "button", onClick: () => navigate('/houseManage/days'), children: "\u65E5\u623F\u6001" })] }), _jsxs("div", { className: "month-toolbar__actions", children: [_jsx("input", { type: "text", value: query, placeholder: "\u8F93\u5165\u5BA2\u6237\u59D3\u540D/\u624B\u673A/\u623F\u95F4/\u6E20\u9053\u5355/\u5907\u6CE8", onChange: (event) => setQuery(event.target.value) }), _jsx("button", { type: "button", onClick: () => showActionResult('读卡'), children: "\u8BFB \u5361" }), _jsx("button", { type: "button", onClick: () => navigate('/houseManage/houseCale'), children: "\u623F\u4EF7\u7BA1\u7406" }), _jsxs("div", { className: "month-settings", children: [_jsx("button", { type: "button", "aria-label": "\u66F4\u591A\u8BBE\u7F6E", onClick: () => setSettingsOpen((open) => !open), children: "\u66F4\u591A\u8BBE\u7F6E" }), settingsOpen ? (_jsxs("div", { className: "month-settings__menu", role: "menu", "aria-label": "\u66F4\u591A\u8BBE\u7F6E", children: [_jsx("button", { type: "button", role: "menuitem", onClick: () => {
                                                            setSettingsOpen(false);
                                                            setStatusDrawer('legend');
                                                        }, children: "\u56FE\u4F8B\u8BF4\u660E" }), _jsx("button", { type: "button", role: "menuitem", onClick: () => {
                                                            setSettingsOpen(false);
                                                            setStatusDrawer('display');
                                                        }, children: "\u623F\u6001\u8BBE\u7F6E" })] })) : null] })] })] }), _jsxs("div", { className: "month-toolbar__filters", children: [_jsx(StoreSelectControl, { label: "\u95E8\u5E97\u8303\u56F4", options: storeOptions, value: activeChip, onChange: (storeId) => handleStoreSwitch(storeId), settingsLabel: "\u95E8\u5E97\u8BBE\u7F6E", onSettingsClick: () => navigate('/InformationMaintenance/campInfo') }), _jsxs("div", { className: `month-filter-menu month-filter-menu--room${roomType ? ' has-value' : ''}`, children: [_jsx("button", { type: "button", className: "chip month-room-filter-trigger", "aria-expanded": filterMenu === 'room', "data-testid": "month-room-filter-trigger", onClick: () => setFilterMenu(filterMenu === 'room' ? null : 'room'), children: roomType ? (_jsx("span", { className: "month-room-filter-trigger__value", "data-testid": "month-room-filter-value", title: roomTypeLabel, children: roomTypeLabel })) : (_jsx("span", { className: "month-room-filter-trigger__placeholder", children: "\u623F\u578B" })) }), roomType ? (_jsx("button", { type: "button", className: "month-room-filter-clear", "aria-label": "\u6E05\u9664\u623F\u578B\u7B5B\u9009", "data-testid": "month-room-filter-clear", onClick: clearRoomTypeFilter, children: "\u00D7" })) : null, filterMenu === 'room' ? (_jsx("div", { className: "month-filter-menu__panel", role: "listbox", "aria-label": "\u623F\u578B\u7B5B\u9009", children: Array.from(new Map(roomGroups.map((row) => [row.roomCategoryId || row.label, row])).values()).map((row) => (_jsx("button", { type: "button", role: "option", "aria-selected": roomType === (row.roomCategoryId || row.label), onClick: () => {
                                                const roomCategoryFilter = row.roomCategoryId || row.label;
                                                setRoomType(roomCategoryFilter);
                                                setFilterMenu(null);
                                                void loadSnapshot(roomCategoryFilter, query);
                                            }, children: row.label }, row.roomCategoryId || row.label))) })) : null] }), _jsxs("div", { className: "month-filter-menu", children: [_jsx("button", { type: "button", className: "chip", onClick: () => setFilterMenu(filterMenu === 'tag' ? null : 'tag'), children: "\u623F\u578B\u6807\u7B7E" }), filterMenu === 'tag' ? (_jsx("div", { className: "month-filter-menu__panel", role: "listbox", "aria-label": "\u623F\u578B\u6807\u7B7E\u7B5B\u9009", children: _jsx("div", { className: "month-empty-option", children: "\u6682\u65E0\u6570\u636E" }) })) : null] }), _jsxs("div", { className: "month-filter-search-wrap", children: [_jsx("input", { className: "month-filter-search", value: query, placeholder: "\u623F\u6E90\u7F16\u7801/\u7B80\u79F0/\u6807\u9898", onChange: (event) => setQuery(event.target.value) }), _jsx("button", { type: "button", className: "month-filter-search-button", "aria-label": "\u641C\u7D22\u623F\u6E90", onClick: () => void loadSnapshot(roomType, query), children: _jsx("span", { "aria-hidden": "true", children: "\u2315" }) })] }), hasFilters ? (_jsx("button", { type: "button", className: "month-clear-filter", onClick: clearFilters, children: "\u6E05\u9664\u7B5B\u9009" })) : null, _jsxs("div", { className: "month-batch-action month-batch-action--first", children: [_jsx("button", { type: "button", className: "month-outline-action", "aria-expanded": batchMenu === 'dirty-clean', onClick: () => setBatchMenu((current) => (current === 'dirty-clean' ? null : 'dirty-clean')), children: "\u6279\u91CF\u8BBE\u810F/\u51C0" }), batchMenu === 'dirty-clean' ? (_jsxs("div", { className: "month-batch-menu", role: "menu", "aria-label": "\u6279\u91CF\u8BBE\u810F/\u51C0", children: [_jsx("button", { type: "button", role: "menuitem", onClick: () => startBatch('dirty'), children: "\u6279\u91CF\u8BBE\u810F" }), _jsx("button", { type: "button", role: "menuitem", onClick: () => startBatch('clean'), children: "\u6279\u91CF\u8BBE\u51C0" })] })) : null] }), _jsxs("div", { className: "month-batch-action", children: [_jsx("button", { type: "button", className: "month-outline-action", "aria-expanded": batchMenu === 'open-close', onClick: () => setBatchMenu((current) => (current === 'open-close' ? null : 'open-close')), children: "\u6279\u91CF\u5F00/\u5173\u623F" }), batchMenu === 'open-close' ? (_jsxs("div", { className: "month-batch-menu", role: "menu", "aria-label": "\u6279\u91CF\u5F00/\u5173\u623F", children: [_jsx("button", { type: "button", role: "menuitem", onClick: () => startBatch('close'), children: "\u6279\u91CF\u5173\u623F" }), _jsx("button", { type: "button", role: "menuitem", onClick: () => startBatch('open'), children: "\u6279\u91CF\u5F00\u623F" })] })) : null] }), _jsxs("div", { className: "month-toolbar__refresh-group", children: [_jsx("button", { type: "button", className: "month-refresh-action", "aria-label": "\u5206\u4EAB\u623F\u6001", onClick: () => navigate('/houseManage/months/sharingRoomStatus'), children: "\u21BA" }), _jsx("button", { type: "button", className: "month-refresh-action", "aria-label": "\u8BA2\u5355\u5237\u65B0", disabled: loadState === 'loading', onClick: () => setRefreshPopoverOpen((current) => !current), children: "\u27F3" }), _jsx(OrderRefreshPopover, { open: refreshPopoverOpen, onRefresh: () => {
                                            setRefreshPopoverOpen(false);
                                            setToastMessage('美团酒店订单已刷新');
                                        } })] })] }), loadState === 'loading' ? (_jsx("div", { className: "month-status-loading", role: "status", children: "\u6B63\u5728\u52A0\u8F7D\u6708\u623F\u6001\u6570\u636E..." })) : null, loadState === 'error' ? (_jsxs("div", { className: "month-status-error", role: "alert", children: [_jsx("strong", { children: "\u6708\u623F\u6001\u6570\u636E\u52A0\u8F7D\u5931\u8D25" }), _jsx("span", { children: loadError }), _jsx("button", { type: "button", onClick: () => void loadSnapshot(), children: "\u91CD\u8BD5\u8BF7\u6C42" })] })) : null, toastMessage ? (_jsx("div", { className: `month-status-toast${toastMessage === '复制成功' ? ' month-status-toast--top' : ''}`, role: "status", "data-batch-result": batchResult ?? undefined, children: toastMessage })) : null] }), _jsxs("section", { ref: monthBoardRef, className: "timeline-board month-board", "aria-label": "\u6708\u623F\u6001\u65E5\u5386\u77E9\u9635", "data-testid": "month-grid", children: [_jsxs("div", { className: "month-grid-row month-board__head", children: [_jsxs("div", { className: "month-calendar-title", children: [_jsxs("button", { type: "button", className: "month-calendar-date", "aria-haspopup": "dialog", "aria-expanded": datePickerOpen, onClick: toggleDatePicker, children: [_jsx("strong", { children: dateColumns[activeSelectedDateIndex]?.fullDate }), _jsx("span", { className: "month-calendar-date__icon", "aria-hidden": "true" })] }), datePickerOpen ? (_jsxs("div", { className: "month-date-picker", role: "dialog", "aria-label": "\u65E5\u671F\u9009\u62E9", children: [_jsxs("div", { className: "month-date-picker__header", children: [_jsxs("div", { className: "month-date-picker__nav", children: [_jsx("button", { type: "button", "aria-label": "\u4E0A\u4E00\u5E74", onClick: () => shiftPickerMonth(-12), children: '<<' }), _jsx("button", { type: "button", "aria-label": "\u4E0A\u4E00\u6708", onClick: () => shiftPickerMonth(-1), children: '<' })] }), _jsx("strong", { children: pickerMonthLabel }), _jsxs("div", { className: "month-date-picker__nav", children: [_jsx("button", { type: "button", "aria-label": "\u4E0B\u4E00\u6708", onClick: () => shiftPickerMonth(1), children: '>' }), _jsx("button", { type: "button", "aria-label": "\u4E0B\u4E00\u5E74", onClick: () => shiftPickerMonth(12), children: '>>' })] })] }), _jsx("div", { className: "month-date-picker__weekdays", children: monthPickerWeekdays.map((weekday) => (_jsx("span", { children: weekday }, weekday))) }), _jsx("div", { className: "month-date-picker__grid", children: monthPickerCells.map((cell) => (_jsx("button", { type: "button", "data-date": cell.isoDate, className: `month-date-picker__cell${cell.inViewMonth ? ' is-in-view' : ''}${cell.isSelected ? ' is-selected' : ''}`, onClick: () => setDateFromPicker(parseIsoDate(cell.isoDate)), children: _jsx("span", { children: cell.label }) }, cell.isoDate))) }), _jsx("button", { type: "button", className: "month-date-picker__today", onClick: () => setDateFromPicker(today), children: "\u4ECA\u5929" })] })) : null, _jsx("button", { type: "button", className: "month-calendar-toggle", onClick: () => {
                                            setDatePickerOpen(false);
                                            setCollapsed((value) => !value);
                                        }, children: collapsed ? '全部展开' : '全部收起' })] }), dateColumns.map((date, index) => (_jsxs("button", { type: "button", "data-testid": "month-date-column", className: `timeline-date${index === activeSelectedDateIndex ? ' is-highlight' : ''}${date.hot ? ' is-hot' : ''}`, "aria-current": index === activeSelectedDateIndex ? 'date' : undefined, onClick: () => {
                                    setSelectedDate(parseIsoDate(date.isoDate));
                                    setDatePickerOpen(false);
                                }, children: [index === activeSelectedDateIndex ? _jsx("i", { "aria-hidden": "true" }) : null, _jsx("strong", { children: date.date }), _jsx("span", { children: date.weekday }), _jsx("em", { children: date.remain })] }, date.date)))] }), loadState === 'ready' && filteredRows.length === 0 ? (_jsx("div", { className: "month-empty-state", role: "status", children: "\u6682\u65E0\u6708\u623F\u6001\u6570\u636E" })) : null, filteredRows.map((row, rowIndex) => (_jsxs("div", { className: "month-room-group", children: [_jsxs("div", { className: "month-grid-row month-board__row is-type", "data-row-kind": "type", "data-testid": "month-type-row", children: [_jsxs("div", { className: "timeline-room month-board__room", children: [_jsx("strong", { children: row.label }), _jsx("span", { className: "month-room-collapse", children: "\u6536\u8D77" })] }), row.typeCells.map((cell, cellIndex) => (_jsx("button", { type: "button", className: `month-cell tone-${cell.tone}`, children: _jsx("strong", { children: cell.title }) }, `${row.label}-type-${cellIndex}`)))] }), !collapsed ? (_jsxs("div", { className: "month-grid-row month-board__row is-room", "data-row-kind": "room", "data-testid": "month-room-row", children: [_jsx("div", { className: "timeline-room month-board__room", children: _jsx("strong", { children: row.roomLabel }) }), createRenderedRoomCells(row.roomCells).map(({ cell, cellIndex, span }) => {
                                        const key = `${rowIndex}-${cellIndex}`;
                                        const selected = selectedKeys.includes(key);
                                        const selectable = isSelectableCell(cell);
                                        const cellStatus = cell.tone === 'disabled' ? 'closed' : 'blank';
                                        const renderTone = displaySettings.colorMode === 'channel' && cell.tone !== 'booking-duplicate'
                                            ? cell.channelTone ?? cell.tone
                                            : cell.tone;
                                        const isBookingCell = cell.tone.startsWith('booking');
                                        const showRoomStatusLabel = !isBookingCell && displaySettings.showRoomStatus;
                                        return (_jsxs("button", { type: "button", "data-testid": cell.tone === 'blank' ? 'month-selectable-cell' : undefined, "data-order-span": span > 1 ? String(span) : undefined, "aria-selected": selectable ? selected : undefined, "data-selectable": selectable ? 'true' : undefined, className: `month-cell tone-${renderTone}${selected ? ' is-selected' : ''}${selectable ? ' is-selectable' : ''}`, style: span > 1 ? { gridColumn: `span ${span}` } : undefined, onMouseEnter: (event) => {
                                                if (cell.tone.startsWith('booking'))
                                                    showBookingPopover(event, cell, row);
                                            }, onMouseLeave: () => setHoveredBooking(null), onClick: (event) => {
                                                if (selectable) {
                                                    selectMonthCell(key, row, cellIndex, event.currentTarget.getBoundingClientRect(), cellStatus);
                                                    return;
                                                }
                                                if (cell.tone.startsWith('booking'))
                                                    openOrderDrawer(cell, row);
                                            }, children: [isBookingCell || showRoomStatusLabel ? _jsx("strong", { children: cell.title }) : null, isBookingCell && cell.subtitle ? _jsx("span", { children: cell.subtitle }) : null, isBookingCell && cell.amount ? _jsx("em", { children: cell.amount }) : null, isBookingCell && cell.badge ? _jsx("b", { children: cell.badge }) : null, selected ? _jsx("i", { className: "month-cell__check", "aria-hidden": "true", children: "\u2713" }) : null] }, key));
                                    })] })) : null] }, row.id)))] }), selectedCells.length > 0 && selectedCell && selectionAnchor ? (_jsxs("div", { className: "month-selection-actions", role: "menu", "aria-label": "\u623F\u6001\u64CD\u4F5C\u83DC\u5355", style: { left: selectionAnchor.left, top: selectionAnchor.top }, children: [_jsx("button", { type: "button", role: "menuitem", onClick: () => void openOrderEntryForSelectedCell(), children: '\u5f55\u5355' }), _jsx("button", { type: "button", role: "menuitem", onClick: () => void (selectedCells.every((cell) => cell.status === 'closed') ? openSelectedMonthCellRoom() : closeSelectedMonthCellRoom()), children: selectedCells.every((cell) => cell.status === 'closed') ? '\u5f00\u623f' : '\u5173\u623f' })] })) : null, batchDialogMode ? (_jsx(BatchOperationDialog, { mode: batchDialogMode, state: batchDialogState, onChange: (patch) => setBatchDialogState((current) => ({ ...current, ...patch })), onClose: () => setBatchDialogMode(null), onConfirm: () => applyBatch(batchDialogMode) })) : null, selectedBooking ? (_jsx(MonthOrderDrawer, { selectedBooking: selectedBooking, campId: activeStoreCampId || resolvedCampIdRef.current, onClose: () => setSelectedBooking(null), onAction: showActionResult, onOrderChanged: () => loadSnapshot(roomType, query) })) : null, _jsx(OrderEntryDrawerHost, { isOpen: Boolean(orderEntryInitialRoom), initialRoom: orderEntryInitialRoom, onClose: () => setOrderEntryInitialRoom(null), onCreated: () => {
                    setOrderEntryInitialRoom(null);
                    void loadSnapshot(roomType, query);
                }, onActionMessage: setToastMessage }), hoveredBooking ? (_jsxs("section", { className: "month-order-popover", style: { left: hoveredBooking.left, top: hoveredBooking.top }, "aria-label": "\u8BA2\u5355\u60AC\u6D6E\u4FE1\u606F", children: [_jsxs("header", { children: [hoveredBooking.roomType, "-", hoveredBooking.roomLabel] }), _jsxs("div", { className: "month-order-popover__content", children: [_jsxs("div", { children: ["\u9884\u8BA2\u4EBA: ", hoveredBooking.cell.title] }), _jsxs("div", { children: ["\u624B\u673A\u53F7: ", hoveredBooking.cell.phone ?? '-'] }), _jsxs("div", { children: ["\u5165\u79BB\u65F6\u95F4: ", hoveredBooking.cell.stayRange ?? '2026.05.18-05.20'] }), _jsxs("div", { children: ["\u6E20\u9053\u6765\u6E90: ", _jsx("span", { children: hoveredBooking.cell.subtitle ?? '-' })] }), _jsxs("div", { className: "month-order-popover__price", children: [_jsxs("span", { children: ["\u623F\u8D39(\u51CF\u4F63): ", _jsx("em", { children: hoveredBooking.cell.amount ?? '-' })] }), _jsxs("span", { children: ["\u8BA2\u5355\u603B\u6536\u5165: ", _jsx("em", { children: hoveredBooking.cell.totalIncome ?? hoveredBooking.cell.amount ?? '-' })] })] }), _jsxs("div", { children: ["\u5907\u6CE8: ", hoveredBooking.cell.remark ?? '-'] })] })] })) : null, statusDrawer === 'legend' ? _jsx(RoomStatusLegendDrawer, { onClose: () => setStatusDrawer(null) }) : null, statusDrawer === 'display' ? (_jsx(RoomStatusDisplaySettingsDrawer, { settings: displaySettings, onClose: () => setStatusDrawer(null), onChange: setDisplaySettings })) : null] }));
}
export function MonthOrderDrawer({ selectedBooking, campId = '', onClose, onAction, onOrderChanged }) {
    const [activeTab, setActiveTab] = useState('order');
    const [openDialog, setOpenDialog] = useState(null);
    const [collectDialogOpen, setCollectDialogOpen] = useState(false);
    const [moreMenuOpen, setMoreMenuOpen] = useState(false);
    const [extraIncomeExpanded, setExtraIncomeExpanded] = useState(false);
    const [guestEditorOpen, setGuestEditorOpen] = useState(false);
    const [paymentEditorOpen, setPaymentEditorOpen] = useState(false);
    const [invoiceEditorOpen, setInvoiceEditorOpen] = useState(false);
    const [depositEditorOpen, setDepositEditorOpen] = useState(false);
    const [remarkEditorOpen, setRemarkEditorOpen] = useState(false);
    const [tagDialogOpen, setTagDialogOpen] = useState(false);
    const [tagDialogKeyword, setTagDialogKeyword] = useState('');
    const [tagDraftSelection, setTagDraftSelection] = useState([]);
    const [uploadedAttachments, setUploadedAttachments] = useState([]);
    const [overlayPanel, setOverlayPanel] = useState(null);
    const [actionFlow, setActionFlow] = useState(null);
    const [editOrderRoomMode, setEditOrderRoomMode] = useState('all-day');
    const [checkoutType, setCheckoutType] = useState('normal');
    const [localLiveStatus, setLocalLiveStatus] = useState(selectedBooking.cell.liveStatus ?? '');
    const [guestRegistered, setGuestRegistered] = useState(() => Boolean(selectedBooking.cell.guestRegisteredAt));
    const [checkInBlockedDialogOpen, setCheckInBlockedDialogOpen] = useState(false);
    const [guestForm, setGuestForm] = useState(() => createMonthOrderGuestForm(selectedBooking.cell.title, selectedBooking.cell.phone));
    const [guestFormErrors, setGuestFormErrors] = useState({});
    const [operationMessage, setOperationMessage] = useState('');
    const [submittingAction, setSubmittingAction] = useState(null);
    const [changeRoomOptions, setChangeRoomOptions] = useState([]);
    const [changeRoomOptionsLoading, setChangeRoomOptionsLoading] = useState(false);
    const [changeRoomOptionsError, setChangeRoomOptionsError] = useState('');
    const [selectedChangeRoomId, setSelectedChangeRoomId] = useState('');
    const [changeRoomReason, setChangeRoomReason] = useState('');
    const orderState = resolveMonthOrderState(localLiveStatus || selectedBooking.cell.liveStatus);
    const statusLabel = orderState === 'checked-in'
        ? '入住中'
        : orderState === 'checked-out'
            ? '已退房'
            : orderState === 'cancelled'
                ? '已取消'
                : orderState === 'no-show'
                    ? '未到店'
                    : '待入住';
    const roomFee = formatCurrency(selectedBooking.cell.amount, '¥597.60');
    const totalIncome = formatCurrency(selectedBooking.cell.totalIncome, '¥664.00');
    const commission = formatCurrencyFromNumber(parseCurrencyNumber(totalIncome) * 0.1, '¥66.40');
    const roomFeeAmount = parseCurrencyNumber(roomFee);
    const commissionAmount = parseCurrencyNumber(commission);
    const totalIncomeAmount = parseCurrencyNumber(totalIncome);
    const nightlyAmount = formatCurrencyFromNumber(parseCurrencyNumber(roomFee) / 2, '¥298.80');
    const stayRange = selectedBooking.cell.stayRange ?? '2026.05.18-05.20';
    const { checkinDate, checkoutDate, nights: stayNights } = getStayRangeDetails(stayRange);
    const channelName = selectedBooking.cell.subtitle ?? '飞猪酒店';
    const orderId = selectedBooking.cell.orderId ?? '';
    const channelOrderNo = '5116035240226051843';
    const phone = selectedBooking.cell.phone ?? '-';
    const remark = selectedBooking.cell.remark ?? '-';
    const [selectedOrderTags, setSelectedOrderTags] = useState([]);
    const roomLogLabel = `${selectedBooking.roomType}(${selectedBooking.roomLabel})`;
    const [operationLogs, setOperationLogs] = useState(() => createMonthOrderInitialLogs(selectedBooking, roomLogLabel));
    const collectedAmount = 387;
    const outstandingRoomFee = 0;
    const depositAmount = 0;
    const recommendedInvoiceAmount = 387;
    const quickActions = useMemo(() => {
        const commonActions = [
            { key: 'change-room', label: '换房', icon: '换', testId: 'month-order-action-change-room' },
            { key: 'cancel-arrange', label: '取消排房', icon: '排', testId: 'month-order-action-cancel-arrange' },
            { key: 'skip-stock', label: '不占库存', icon: '库', testId: 'month-order-action-skip-stock' },
            { key: 'skip-report', label: '不计入统计', icon: '统', testId: 'month-order-action-skip-report' },
            { key: 'continue', label: '设为续住单', icon: '续', testId: 'month-order-action-continue' },
            { key: 'cancel-order', label: '取消房单', icon: '消', testId: 'month-order-action-cancel-order' },
            { key: 'clean', label: '保洁', icon: '洁', testId: 'month-order-action-clean' },
            { key: 'print', label: '打印', icon: '打', testId: 'month-order-action-print' },
        ];
        if (orderState === 'checked-in') {
            return [
                { key: 'invite-renew', label: '邀请续住', icon: '邀', testId: 'month-order-action-invite-renew' },
                { key: 'guest', label: '入住人', icon: '住', testId: 'month-order-action-guest' },
                { key: 'late-checkout', label: '延迟退房', icon: '延', testId: 'month-order-action-late-checkout' },
                ...commonActions,
            ];
        }
        if (orderState === 'checked-out') {
            return commonActions;
        }
        return [
            { key: 'invite', label: '邀请登记', icon: '邀', testId: 'month-order-action-invite' },
            { key: 'guest', label: '入住人', icon: '住', testId: 'month-order-action-guest' },
            { key: 'early-checkin', label: '提前入住', icon: '提', testId: 'month-order-action-early-checkin' },
            { key: 'noshow', label: '置为noshow', icon: 'N', testId: 'month-order-action-noshow' },
            ...commonActions,
        ];
    }, [orderState]);
    const roomDisplayName = `${selectedBooking.roomType} ${selectedBooking.roomLabel}`;
    const orderKey = `${selectedBooking.cell.orderId ?? selectedBooking.cell.title}-${selectedBooking.roomLabel}`;
    const channelBlocks = [
        {
            key: 'basic',
            title: '基础信息',
            testId: 'month-channel-section-basic',
            items: [
                { label: '渠道单号', value: channelOrderNo, noWrap: true, wide: true },
                { label: '入住人', value: '-' },
                { label: '渠道订单状态', value: '-' },
                { label: '手机号', value: '-' },
                { label: '入住人数', value: '-' },
                { label: '房间数量', value: '1间', noWrap: true },
                { label: '预计到店时间', value: '-' },
                { label: '预定入离日期', value: `${checkinDate}至${checkoutDate}，共${stayNights}晚`, noWrap: true },
                { label: '预定房型', value: roomDisplayName },
            ],
        },
        {
            key: 'fee',
            title: '费用信息',
            testId: 'month-channel-section-fee',
            items: [
                { label: '订单总收入', value: totalIncomeAmount > 0 ? totalIncome : '¥0', noWrap: true },
                { label: '房费(减佣)', value: roomFee, noWrap: true },
                { label: '折扣信息', value: '-' },
                { label: '支付方式', value: '-' },
                { label: '发票要求', value: '-' },
            ],
        },
        {
            key: 'other',
            title: '其他信息',
            testId: 'month-channel-section-other',
            items: [
                { label: '预定人', value: selectedBooking.cell.title },
                { label: '预定人手机号', value: phone },
                { label: '预定时间', value: '2026-05-19 21:33:51', noWrap: true },
                { label: '渠道备注信息', value: remark || '-' },
            ],
        },
    ];
    const footerActions = orderState === 'checked-out'
        ? [
            { key: 'collect', label: '收款', className: 'is-primary', testId: 'month-order-footer-collect' },
            { key: 'more', label: '更多操作', className: '', testId: 'month-order-footer-more' },
        ]
        : orderState === 'checked-in'
            ? [
                { key: 'more', label: '更多操作', className: '', testId: 'month-order-footer-more' },
                { key: 'collect', label: '收款', className: 'is-primary', testId: 'month-order-footer-collect' },
                { key: 'renew', label: '续住', className: '', testId: 'month-order-footer-renew' },
                { key: 'checkin', label: '入住', className: 'is-primary', testId: 'month-order-footer-checkin' },
                { key: 'checkout', label: '退房', className: '', testId: 'month-order-footer-checkout' },
            ]
            : [
                { key: 'more', label: '更多操作', className: '', testId: 'month-order-footer-more' },
                { key: 'collect', label: '收款', className: 'is-primary', testId: 'month-order-footer-collect' },
                { key: 'credit-checkout', label: '信用住结账', className: '', testId: 'month-order-footer-credit-checkout' },
                { key: 'checkin', label: '入住', className: 'is-primary', testId: 'month-order-footer-checkin' },
                { key: 'checkout', label: '退房', className: '', testId: 'month-order-footer-checkout' },
            ];
    useEffect(() => {
        setActiveTab('order');
        setOpenDialog(null);
        setCollectDialogOpen(false);
        setMoreMenuOpen(false);
        setExtraIncomeExpanded(false);
        setGuestEditorOpen(false);
        setPaymentEditorOpen(false);
        setInvoiceEditorOpen(false);
        setDepositEditorOpen(false);
        setRemarkEditorOpen(false);
        setTagDialogOpen(false);
        setTagDialogKeyword('');
        setTagDraftSelection([]);
        setSelectedOrderTags([]);
        setUploadedAttachments([]);
        setActionFlow(null);
        setOverlayPanel(null);
        setEditOrderRoomMode('all-day');
        setCheckoutType('normal');
        setLocalLiveStatus(selectedBooking.cell.liveStatus ?? '');
        setGuestRegistered(Boolean(selectedBooking.cell.guestRegisteredAt));
        setCheckInBlockedDialogOpen(false);
        setGuestForm(createMonthOrderGuestForm(selectedBooking.cell.title, selectedBooking.cell.phone));
        setGuestFormErrors({});
        setOperationLogs(createMonthOrderInitialLogs(selectedBooking, `${selectedBooking.roomType}(${selectedBooking.roomLabel})`));
        setOperationMessage('');
        setSubmittingAction(null);
        setChangeRoomOptions([]);
        setChangeRoomOptionsLoading(false);
        setChangeRoomOptionsError('');
        setSelectedChangeRoomId('');
        setChangeRoomReason('');
    }, [orderKey]);
    useEffect(() => {
        const closeMoreMenu = (event) => {
            const target = event.target;
            if (!(target instanceof Element))
                return;
            if (target.closest('[data-testid="month-order-footer-more"]') || target.closest('[data-testid="month-order-footer-more-menu"]'))
                return;
            setMoreMenuOpen(false);
        };
        window.addEventListener('click', closeMoreMenu);
        return () => window.removeEventListener('click', closeMoreMenu);
    }, []);
    useEffect(() => {
        if (actionFlow !== 'change-room')
            return;
        const resolvedCampId = campId.trim();
        const resolvedOrderId = orderId.trim();
        if (!resolvedCampId || !resolvedOrderId) {
            setChangeRoomOptions([]);
            setSelectedChangeRoomId('');
            setChangeRoomOptionsError(!resolvedCampId ? '缺少当前门店，无法加载可换房间' : '缺少订单号，无法加载可换房间');
            return;
        }
        let ignored = false;
        setChangeRoomOptionsLoading(true);
        setChangeRoomOptionsError('');
        setChangeRoomOptions([]);
        setSelectedChangeRoomId('');
        void fetchHouseMonthChangeRoomOptions({ campId: resolvedCampId, orderId: resolvedOrderId })
            .then((response) => {
            if (ignored)
                return;
            setChangeRoomOptions(response.rooms);
            setSelectedChangeRoomId(response.rooms[0]?.roomId ?? '');
        })
            .catch((error) => {
            if (ignored)
                return;
            setChangeRoomOptionsError(`加载可换房间失败：${error instanceof Error ? error.message : String(error)}`);
        })
            .finally(() => {
            if (!ignored)
                setChangeRoomOptionsLoading(false);
        });
        return () => {
            ignored = true;
        };
    }, [actionFlow, campId, orderId]);
    const requireOrderActionContext = () => {
        const resolvedCampId = campId.trim();
        const resolvedOrderId = orderId.trim();
        if (!resolvedCampId) {
            setOperationMessage('缺少当前门店，无法操作订单');
            return null;
        }
        if (!resolvedOrderId) {
            setOperationMessage('缺少订单号，无法操作订单');
            return null;
        }
        return { campId: resolvedCampId, orderId: resolvedOrderId };
    };
    const refreshOrderSnapshot = () => {
        if (!onOrderChanged)
            return;
        void Promise.resolve(onOrderChanged()).catch((error) => {
            setOperationMessage(`订单已更新，但刷新月房态失败：${error instanceof Error ? error.message : String(error)}`);
        });
    };
    const addOperationLog = (title, detail, occurredAtText) => {
        const occurredAt = parseMonthOrderLogTimestamp(occurredAtText) ?? Date.now();
        setOperationLogs((current) => [createMonthOrderActionLog(title, detail, occurredAt), ...current]);
    };
    const handleSaveGuest = async () => {
        const normalizedGuestName = guestForm.guestName.trim() || selectedBooking.cell.title;
        const nextErrors = {};
        const guestNameError = validatePersonName(normalizedGuestName);
        const guestMobileError = validateOptionalMainlandMobile(guestForm.guestMobile);
        const guestIdCardError = validateCredentialNumber(guestForm.guestIdCardType, guestForm.guestIdCard);
        if (guestNameError)
            nextErrors.guestName = guestNameError;
        if (guestMobileError)
            nextErrors.guestMobile = guestMobileError;
        if (guestIdCardError)
            nextErrors.guestIdCard = guestIdCardError;
        if (Object.keys(nextErrors).length > 0) {
            setGuestFormErrors(nextErrors);
            setOperationMessage('请先修正红色提示的输入内容');
            return;
        }
        const context = requireOrderActionContext();
        if (!context)
            return;
        setSubmittingAction('guest');
        setOperationMessage('');
        try {
            const response = await saveHouseMonthOrderGuests({
                ...context,
                guests: [
                    {
                        guestName: normalizedGuestName,
                        guestMobile: guestForm.guestMobile.trim(),
                        guestIdCardType: guestForm.guestIdCardType,
                        guestIdCard: guestForm.guestIdCard.trim(),
                        guestType: 'adult',
                    },
                ],
            });
            const message = response.message || '入住人保存成功';
            setGuestEditorOpen(false);
            setGuestRegistered(true);
            setGuestFormErrors({});
            setOperationMessage(message);
            addOperationLog('登记入住人', `入住人：${normalizedGuestName}`, response.guestRegisteredAt);
            onAction(message);
            refreshOrderSnapshot();
        }
        catch (error) {
            setOperationMessage(`保存入住人失败：${error instanceof Error ? error.message : String(error)}`);
        }
        finally {
            setSubmittingAction(null);
        }
    };
    const handleCheckInOrder = async () => {
        const context = requireOrderActionContext();
        if (!context)
            return;
        if (!guestRegistered) {
            setActionFlow(null);
            setCheckInBlockedDialogOpen(true);
            setOperationMessage('请先登记入住人');
            return;
        }
        setSubmittingAction('checkin');
        setOperationMessage('');
        try {
            const response = await checkInHouseMonthOrder(context);
            const nextLiveStatus = resolveOrderActionLiveStatus(response.status, '入住中');
            setLocalLiveStatus(nextLiveStatus);
            const message = response.message || '办理入住成功';
            setOperationMessage(message);
            addOperationLog('办理入住', `入住房间：${roomLogLabel}`, response.guestRegisteredAt);
            onAction(message);
            refreshOrderSnapshot();
        }
        catch (error) {
            setOperationMessage(`办理入住失败：${error instanceof Error ? error.message : String(error)}`);
        }
        finally {
            setSubmittingAction(null);
        }
    };
    const handleCheckOutOrder = async () => {
        const context = requireOrderActionContext();
        if (!context)
            return;
        setSubmittingAction('checkout');
        setOperationMessage('');
        try {
            const response = await checkOutHouseMonthOrder(context);
            const nextLiveStatus = resolveOrderActionLiveStatus(response.status, '已退房');
            setLocalLiveStatus(nextLiveStatus);
            const message = response.message || '办理退房成功';
            setOperationMessage(message);
            addOperationLog('办理退房', `退房房间：${roomLogLabel}`, response.checkedOutAt);
            onAction(message);
            refreshOrderSnapshot();
        }
        catch (error) {
            setOperationMessage(`办理退房失败：${error instanceof Error ? error.message : String(error)}`);
        }
        finally {
            setSubmittingAction(null);
        }
    };
    const handleChangeRoomOrder = async () => {
        const context = requireOrderActionContext();
        if (!context)
            return;
        if (!selectedChangeRoomId) {
            setChangeRoomOptionsError('请选择要调整到的房间');
            return;
        }
        const selectedRoom = changeRoomOptions.find((room) => room.roomId === selectedChangeRoomId);
        setSubmittingAction('change-room');
        setOperationMessage('');
        setChangeRoomOptionsError('');
        try {
            const response = await changeHouseMonthOrderRoom({
                ...context,
                roomId: selectedChangeRoomId,
                reason: changeRoomReason.trim(),
            });
            const roomName = response.roomName || selectedRoom?.roomName || selectedChangeRoomId;
            const roomCategoryName = response.roomCategoryName || selectedRoom?.roomCategoryName || selectedBooking.roomType;
            const message = response.message || '换房成功';
            setActionFlow(null);
            setOperationMessage(message);
            addOperationLog('换房', `从 ${roomDisplayName} 调整至 ${roomCategoryName} ${roomName}`);
            onAction(message);
            refreshOrderSnapshot();
        }
        catch (error) {
            setChangeRoomOptionsError(`换房失败：${error instanceof Error ? error.message : String(error)}`);
        }
        finally {
            setSubmittingAction(null);
        }
    };
    const handleCancelOrder = async () => {
        const context = requireOrderActionContext();
        if (!context)
            return;
        setSubmittingAction('cancel');
        setOperationMessage('');
        try {
            const response = await cancelHouseMonthOrder({
                ...context,
                reason: '订单详情取消房单',
            });
            const nextLiveStatus = resolveOrderActionLiveStatus(response.status, '已取消');
            setLocalLiveStatus(nextLiveStatus);
            const message = response.message || '订单取消成功';
            setActionFlow(null);
            setOperationMessage(message);
            addOperationLog('取消房单', `取消房间：${roomLogLabel}`);
            onAction(message);
            refreshOrderSnapshot();
        }
        catch (error) {
            setOperationMessage(`取消房单失败：${error instanceof Error ? error.message : String(error)}`);
        }
        finally {
            setSubmittingAction(null);
        }
    };
    const handleSkipStockOrder = async () => {
        const context = requireOrderActionContext();
        if (!context)
            return;
        setSubmittingAction('skip-stock');
        setOperationMessage('');
        try {
            const response = await skipStockHouseMonthOrder({
                ...context,
                reason: '订单详情不占库存',
            });
            const message = response.message || '订单已释放库存并取消排房';
            setActionFlow(null);
            setOperationMessage(message);
            addOperationLog('不占库存', `释放库存并取消排房：${roomLogLabel}`);
            onAction(message);
            refreshOrderSnapshot();
        }
        catch (error) {
            setOperationMessage(`不占库存失败：${error instanceof Error ? error.message : String(error)}`);
        }
        finally {
            setSubmittingAction(null);
        }
    };
    const handleMarkNoShowOrder = async () => {
        const context = requireOrderActionContext();
        if (!context)
            return;
        setSubmittingAction('no-show');
        setOperationMessage('');
        try {
            const response = await markNoShowHouseMonthOrder({
                ...context,
                reason: '订单详情置为未到店',
            });
            const nextLiveStatus = resolveOrderActionLiveStatus(response.status, '未到店');
            setLocalLiveStatus(nextLiveStatus);
            const message = response.message || '已标记为未到店';
            setOpenDialog(null);
            setOperationMessage(message);
            addOperationLog('置为未到店', `未到店房间：${roomLogLabel}`);
            onAction(message);
            refreshOrderSnapshot();
        }
        catch (error) {
            setOperationMessage(`置为未到店失败：${error instanceof Error ? error.message : String(error)}`);
        }
        finally {
            setSubmittingAction(null);
        }
    };
    const handleDrawerAction = (action) => {
        setMoreMenuOpen(false);
        if (action === '置为noshow') {
            setOpenDialog('noshow');
            return;
        }
        if (action === '收款' || action === '添加收款') {
            setCollectDialogOpen(true);
            return;
        }
        if (action === '订单提醒') {
            setOpenDialog('reminder');
            return;
        }
        if (action === '入住人' || action === '登记入住人') {
            setGuestEditorOpen(true);
            return;
        }
        if (action === '退房') {
            void handleCheckOutOrder();
            return;
        }
        if (action === '邀请登记') {
            setActionFlow('invite');
            return;
        }
        if (action === '提前入住') {
            setActionFlow('early-checkin');
            return;
        }
        if (action === '邀请续住') {
            setActionFlow('invite-renew');
            return;
        }
        if (action === '延迟退房') {
            setActionFlow('late-checkout');
            return;
        }
        if (action === '换房') {
            setActionFlow('change-room');
            return;
        }
        if (action === '取消排房') {
            setActionFlow('cancel-arrange');
            return;
        }
        if (action === '不占库存') {
            setActionFlow('skip-stock');
            return;
        }
        if (action === '不计入统计') {
            setActionFlow('skip-report');
            return;
        }
        if (action === '设为续住单') {
            setActionFlow('continue');
            return;
        }
        if (action === '取消房单') {
            setActionFlow('cancel-order');
            return;
        }
        if (action === '保洁') {
            setActionFlow('clean');
            return;
        }
        if (action === '打印') {
            setActionFlow('print');
            return;
        }
        if (action === '信用住结账') {
            setActionFlow('credit-checkout');
            return;
        }
        if (action === '入住') {
            void handleCheckInOrder();
            return;
        }
        if (action === '续住') {
            setActionFlow('renew');
            return;
        }
        onAction(action);
    };
    const handleMoreMenuAction = (action) => {
        setMoreMenuOpen(false);
        if (action === '编辑订单') {
            setOverlayPanel('edit-order');
            return;
        }
        if (action === '修改费用') {
            setOpenDialog('modify-fee');
            return;
        }
        onAction(action);
    };
    const handleChannelOrderCopy = () => {
        void copyText(channelOrderNo).catch(() => undefined).finally(() => {
            onAction('复制成功');
        });
    };
    const confirmDialog = () => {
        if (openDialog === 'noshow') {
            void handleMarkNoShowOrder();
            return;
        }
        if (openDialog === 'checkout') {
            onAction(checkoutType === 'normal' ? '办理退房' : '提前退房');
        }
        if (openDialog === 'reminder') {
            onAction('添加订单提醒');
        }
        if (openDialog === 'modify-fee') {
            onAction('修改费用');
        }
        setOpenDialog(null);
    };
    const confirmCollectDialog = () => {
        onAction('添加收款记录');
        setCollectDialogOpen(false);
    };
    const confirmActionFlow = () => {
        if (!actionFlow)
            return;
        onAction(resolveMonthOrderActionDialogConfig(actionFlow).actionLabel);
        setActionFlow(null);
    };
    const visibleTagOptions = ORDER_TAG_OPTIONS.filter((tag) => tag.includes(tagDialogKeyword.trim()));
    const allVisibleTagChecked = visibleTagOptions.length > 0 && visibleTagOptions.every((tag) => tagDraftSelection.includes(tag));
    const someVisibleTagChecked = visibleTagOptions.some((tag) => tagDraftSelection.includes(tag));
    const isChangeRoomSubmitting = submittingAction === 'change-room';
    const isCancelSubmitting = submittingAction === 'cancel';
    const isSkipStockSubmitting = submittingAction === 'skip-stock';
    const isNoShowSubmitting = submittingAction === 'no-show';
    const isActionConfirmDisabled = (actionFlow === 'checkin' && submittingAction === 'checkin') ||
        (actionFlow === 'cancel-order' && isCancelSubmitting) ||
        (actionFlow === 'skip-stock' && isSkipStockSubmitting) ||
        (actionFlow === 'change-room' &&
            (isChangeRoomSubmitting || changeRoomOptionsLoading || !selectedChangeRoomId || Boolean(changeRoomOptionsError && !changeRoomOptions.length)));
    const openTagDialog = () => {
        setTagDialogKeyword('');
        setTagDraftSelection(selectedOrderTags);
        setTagDialogOpen(true);
    };
    const closeTagDialog = () => {
        setTagDialogOpen(false);
        setTagDialogKeyword('');
        setTagDraftSelection([]);
    };
    const toggleTagOption = (tag) => {
        setTagDraftSelection((current) => (current.includes(tag) ? current.filter((item) => item !== tag) : [...current, tag]));
    };
    const toggleAllVisibleTags = () => {
        setTagDraftSelection((current) => {
            if (allVisibleTagChecked) {
                return current.filter((tag) => !visibleTagOptions.includes(tag));
            }
            const next = new Set(current);
            visibleTagOptions.forEach((tag) => next.add(tag));
            return Array.from(next);
        });
    };
    const handleAttachmentChange = (event) => {
        const files = Array.from(event.target.files ?? []);
        if (!files.length)
            return;
        setUploadedAttachments((current) => [
            ...current,
            ...files.map((file, index) => ({
                id: `${file.name}-${file.size}-${Date.now()}-${index}`,
                name: file.name,
            })),
        ]);
        event.target.value = '';
    };
    const removeAttachment = (attachmentId) => {
        setUploadedAttachments((current) => current.filter((attachment) => attachment.id !== attachmentId));
    };
    const actionDialogConfig = actionFlow ? resolveMonthOrderActionDialogConfig(actionFlow) : null;
    return (_jsxs("aside", { className: "month-order-drawer", role: "dialog", "aria-label": "\u8BA2\u5355\u8BE6\u60C5", onClick: (event) => event.stopPropagation(), children: [_jsxs("header", { className: "month-order-drawer__header", children: [_jsxs("div", { children: [_jsx("strong", { children: overlayPanel === 'edit-order' ? '编辑订单' : '订单详情' }), _jsx("span", { children: "\u5168\u65E5\u623F" })] }), _jsx("button", { type: "button", "aria-label": overlayPanel === 'edit-order' ? '关闭编辑订单' : '关闭订单详情', onClick: overlayPanel === 'edit-order' ? () => setOverlayPanel(null) : onClose, children: "\u00D7" })] }), overlayPanel === null ? (_jsxs("nav", { className: "month-order-drawer__tabs", "aria-label": "\u8BA2\u5355\u8BE6\u60C5\u6807\u7B7E", children: [_jsx("button", { type: "button", className: activeTab === 'order' ? 'is-active' : '', onClick: () => setActiveTab('order'), children: "\u8BA2\u5355\u4FE1\u606F" }), _jsx("button", { type: "button", className: activeTab === 'channel' ? 'is-active' : '', onClick: () => setActiveTab('channel'), children: "\u6E20\u9053\u4FE1\u606F" }), _jsx("button", { type: "button", className: activeTab === 'log' ? 'is-active' : '', onClick: () => setActiveTab('log'), children: "\u64CD\u4F5C\u65E5\u5FD7" })] })) : null, _jsxs("div", { className: "month-order-drawer__body", "data-testid": "month-order-drawer-body", children: [overlayPanel === 'edit-order' ? (_jsxs("section", { className: "month-order-edit-panel", "data-testid": "month-order-edit-panel", children: [_jsxs("div", { className: "month-order-edit-tabs", role: "tablist", "aria-label": "\u7F16\u8F91\u8BA2\u5355\u623F\u578B", children: [_jsx("button", { type: "button", role: "tab", "aria-selected": editOrderRoomMode === 'all-day', className: editOrderRoomMode === 'all-day' ? 'is-active' : '', onClick: () => setEditOrderRoomMode('all-day'), children: "\u5168\u65E5\u623F" }), _jsx("button", { type: "button", role: "tab", "aria-selected": editOrderRoomMode === 'hourly', className: editOrderRoomMode === 'hourly' ? 'is-active' : '', onClick: () => setEditOrderRoomMode('hourly'), children: "\u949F\u70B9\u623F" }), _jsx("button", { type: "button", role: "tab", "aria-selected": editOrderRoomMode === 'long-stay', className: editOrderRoomMode === 'long-stay' ? 'is-active' : '', onClick: () => setEditOrderRoomMode('long-stay'), children: "\u957F\u79DF\u623F" })] }), _jsxs("section", { className: "month-order-edit-section", children: [_jsx("div", { className: "month-order-edit-section__header", children: _jsx("h3", { children: "\u57FA\u672C\u4FE1\u606F" }) }), _jsxs("div", { className: "month-order-edit-grid", children: [_jsxs("label", { children: [_jsx("span", { children: "*\u59D3\u540D" }), _jsx("input", { className: "month-order-dialog__input", defaultValue: selectedBooking.cell.title })] }), _jsxs("label", { children: [_jsx("span", { children: "\u624B\u673A\u53F7" }), _jsx("input", { className: "month-order-dialog__input", defaultValue: phone === '-' ? '' : phone })] }), _jsxs("label", { children: [_jsx("span", { children: "\u8BA2\u5355\u6765\u6E90" }), _jsx("input", { className: "month-order-dialog__input", defaultValue: channelName })] }), _jsxs("label", { children: [_jsx("span", { children: "\u6E20\u9053\u5355\u53F7" }), _jsx("input", { className: "month-order-dialog__input", defaultValue: channelOrderNo })] })] })] }), _jsxs("section", { className: "month-order-edit-section", children: [_jsxs("div", { className: "month-order-edit-section__header month-order-edit-section__header--summary", children: [_jsx("h3", { children: "\u623F\u95F4/\u8D39\u7528\u4FE1\u606F" }), _jsxs("div", { className: "month-order-edit-section__summary", children: [_jsxs("span", { children: ["\u623F\u8D39\u603B\u8BA1:", totalIncome] }), _jsx("span", { children: "\u51711\u95F4\u623F" })] })] }), _jsxs("div", { className: "month-order-edit-room-row", children: [_jsxs("div", { children: [_jsx("strong", { children: roomDisplayName }), _jsxs("span", { children: [stayRange, " \u00B7 1\u665A \u00B7 1\u4EBA"] })] }), _jsx("button", { type: "button", onClick: () => handleDrawerAction('登记入住人'), children: "\u767B\u8BB0" })] }), _jsxs("div", { className: "month-order-edit-grid month-order-edit-grid--compact", children: [_jsxs("label", { children: [_jsx("span", { children: "\u4F63\u91D1" }), _jsx("input", { className: "month-order-dialog__input", defaultValue: String(commissionAmount || 0) })] }), _jsxs("label", { children: [_jsx("span", { children: "\u62BC\u91D1" }), _jsx("input", { className: "month-order-dialog__input", defaultValue: "0" })] })] })] }), _jsxs("section", { className: "month-order-edit-section", children: [_jsx("div", { className: "month-order-edit-section__header", children: _jsx("h3", { children: "\u5F00\u7968\u4FE1\u606F" }) }), _jsxs("div", { className: "month-order-edit-grid month-order-edit-grid--compact", children: [_jsxs("label", { children: [_jsx("span", { children: "\u5F00\u7968\u65B9" }), _jsx("input", { className: "month-order-dialog__input", placeholder: "\u8BF7\u9009\u62E9\u5F00\u7968\u65B9" })] }), _jsxs("label", { children: [_jsx("span", { children: "\u5F00\u7968\u91D1\u989D" }), _jsx("input", { className: "month-order-dialog__input", defaultValue: String(totalIncomeAmount || 0) })] })] })] }), _jsxs("section", { className: "month-order-edit-section", children: [_jsxs("div", { className: "month-order-edit-inline-row", children: [_jsx("div", { className: "month-order-edit-inline-row__label", children: "\u8BA2\u5355\u63D0\u9192" }), _jsx("button", { type: "button", className: "month-order-mini-action", onClick: () => handleDrawerAction('订单提醒'), children: "+" })] }), _jsxs("div", { className: "month-order-edit-inline-row", children: [_jsx("div", { className: "month-order-edit-inline-row__label", children: "\u8BA2\u5355\u6807\u7B7E" }), _jsx("button", { type: "button", className: "month-order-mini-action", onClick: openTagDialog, children: "+" })] }), _jsxs("label", { className: "month-order-edit-remark", children: [_jsx("span", { children: "\u8BA2\u5355\u5907\u6CE8" }), _jsx("textarea", { className: "month-order-dialog__textarea", defaultValue: remark })] })] }), _jsxs("section", { className: "month-order-edit-section", children: [_jsx("div", { className: "month-order-edit-section__header", children: _jsx("h3", { children: "\u5173\u8054\u8BA2\u5355" }) }), _jsxs("div", { className: "month-order-edit-related-head", children: [_jsx("span", { children: "\u8BA2\u5355\u53F7" }), _jsx("span", { children: "\u623F\u95F4" }), _jsx("span", { children: "\u72B6\u6001" })] })] })] })) : null, overlayPanel === null && activeTab === 'order' ? (_jsxs(_Fragment, { children: [_jsxs("section", { className: "month-order-card", children: [_jsxs("div", { className: "month-order-card__guest", children: [_jsx("strong", { children: selectedBooking.cell.title }), _jsx("span", { children: channelName })] }), _jsxs("p", { children: ["\u624B\u673A\u53F7\uFF1A", phone] }), _jsxs("p", { children: ["\u6E20\u9053\u5355\u53F7\uFF1A", channelOrderNo] })] }), _jsxs("section", { className: "month-room-order-card", children: [_jsxs("div", { className: "month-room-order-card__top", children: [_jsxs("strong", { children: [selectedBooking.roomType, "\uFF08", selectedBooking.roomLabel, "\uFF09"] }), _jsx("span", { children: statusLabel })] }), _jsxs("div", { className: "month-room-order-card__stay", children: [stayRange, " 2\u665A"] }), _jsx("div", { className: "month-room-order-card__amount", children: totalIncome }), _jsxs("div", { className: "month-room-order-card__guest", children: [_jsx("span", { children: "\u5165\u4F4F\u4EBA\uFF080/1\uFF09" }), _jsx("button", { type: "button", "data-testid": "month-order-register-guest", onClick: () => handleDrawerAction('登记入住人'), children: "\u767B\u8BB0\u5165\u4F4F\u4EBA" })] }), guestEditorOpen ? (_jsxs("div", { className: "month-room-order-card__guest-editor", "data-testid": "month-order-guest-editor", children: [_jsxs("div", { className: "month-order-guest-editor__grid", children: [_jsxs("label", { className: `month-order-guest-field ${guestFormErrors.guestName ? 'has-error' : ''}`, children: [_jsx("span", { children: "\u5BA2\u6237\u59D3\u540D" }), _jsx("input", { className: "month-order-dialog__input", placeholder: "\u8BF7\u8F93\u5165\u5BA2\u6237\u59D3\u540D", value: guestForm.guestName, onChange: (event) => {
                                                                    setGuestForm((current) => ({ ...current, guestName: event.target.value }));
                                                                    setGuestFormErrors((current) => ({ ...current, guestName: undefined }));
                                                                } }), guestFormErrors.guestName ? _jsx("em", { children: guestFormErrors.guestName }) : null] }), _jsxs("label", { className: `month-order-guest-field ${guestFormErrors.guestMobile ? 'has-error' : ''}`, children: [_jsx("span", { children: "\u624B\u673A\u53F7" }), _jsx("input", { className: "month-order-dialog__input", placeholder: "\u8BF7\u8F93\u5165\u624B\u673A\u53F7", value: guestForm.guestMobile, onChange: (event) => {
                                                                    setGuestForm((current) => ({ ...current, guestMobile: event.target.value }));
                                                                    setGuestFormErrors((current) => ({ ...current, guestMobile: undefined }));
                                                                } }), guestFormErrors.guestMobile ? _jsx("em", { children: guestFormErrors.guestMobile }) : null] }), _jsxs("label", { className: "month-order-guest-field", children: [_jsx("span", { children: "\u8BC1\u4EF6\u7C7B\u578B" }), _jsx("select", { className: "month-order-dialog__select", value: guestForm.guestIdCardType, onChange: (event) => {
                                                                    setGuestForm((current) => ({ ...current, guestIdCardType: event.target.value }));
                                                                    setGuestFormErrors((current) => ({ ...current, guestIdCard: undefined }));
                                                                }, children: ORDER_GUEST_DOCUMENT_TYPES.map((type) => (_jsx("option", { value: type, children: type }, type))) })] }), _jsxs("label", { className: `month-order-guest-field ${guestFormErrors.guestIdCard ? 'has-error' : ''}`, children: [_jsx("span", { children: "\u8BC1\u4EF6\u53F7" }), _jsx("input", { className: "month-order-dialog__input", placeholder: "\u8BF7\u8F93\u5165\u8BC1\u4EF6\u53F7\u7801", value: guestForm.guestIdCard, onChange: (event) => {
                                                                    setGuestForm((current) => ({ ...current, guestIdCard: event.target.value }));
                                                                    setGuestFormErrors((current) => ({ ...current, guestIdCard: undefined }));
                                                                } }), guestFormErrors.guestIdCard ? _jsx("em", { children: guestFormErrors.guestIdCard }) : null] })] }), _jsxs("div", { className: "month-order-guest-editor__actions", children: [_jsx("button", { type: "button", onClick: () => onAction('读卡'), children: "\u8BFB\u5361" }), _jsx("button", { type: "button", onClick: () => setGuestEditorOpen(false), children: "\u53D6\u6D88" }), _jsx("button", { type: "button", className: "is-primary", disabled: submittingAction === 'guest', onClick: () => void handleSaveGuest(), children: submittingAction === 'guest' ? '保存中' : '保存' })] })] })) : null, operationMessage ? (_jsx("div", { className: "month-order-operation-message", role: "status", children: operationMessage })) : null, _jsx("em", { children: selectedBooking.roomType })] }), _jsxs("section", { className: "month-finance-card", children: [_jsxs("div", { className: "month-finance-summary", children: [_jsxs("span", { children: ["\u623F\u8D39(\u51CF\u4F63):", _jsx("strong", { children: roomFee })] }), _jsxs("span", { children: ["\u8BA2\u5355\u603B\u6536\u5165:", _jsx("strong", { children: totalIncome })] })] }), _jsxs("div", { className: "month-finance-meta", children: [_jsxs("span", { children: ["\u4F63\u91D1:", commission] }), _jsxs("span", { children: ["\u623F\u8D39(\u542B\u4F63):", totalIncome] }), _jsx("span", { children: "\u5176\u4ED6\u6D88\u8D39:\u00A50.00" })] }), _jsxs("table", { children: [_jsx("thead", { children: _jsxs("tr", { children: [_jsx("th", { children: "\u623F\u95F4/\u65E5\u671F" }), _jsx("th", { children: "2026-05-18" }), _jsx("th", { children: "2026-05-19" })] }) }), _jsx("tbody", { children: _jsxs("tr", { children: [_jsxs("td", { children: [selectedBooking.roomType, "(", selectedBooking.roomLabel, ")"] }), _jsx("td", { children: nightlyAmount }), _jsx("td", { children: nightlyAmount })] }) })] })] }), _jsxs("section", { className: "month-info-block month-order-section-row", "data-testid": "month-order-section-payment", children: [_jsxs("div", { className: "month-order-section-header month-order-section-header--summary", children: [_jsx("h3", { children: "\u623F\u8D39\u6536\u6B3E" }), paymentEditorOpen ? (_jsxs("div", { className: "month-order-section-inline-actions", children: [_jsx("button", { type: "button", className: "month-order-mini-action", onClick: () => setPaymentEditorOpen(false), children: "\u53D6\u6D88" }), _jsx("button", { type: "button", className: "month-order-mini-action", onClick: () => {
                                                            setPaymentEditorOpen(false);
                                                            onAction('保存房费收款');
                                                        }, children: "\u4FDD\u5B58" })] })) : (_jsxs(_Fragment, { children: [_jsxs("div", { className: "month-order-section-summary", children: [_jsxs("span", { children: ["\u6536\u6B3E\u91D1\u989D: \u00A5", collectedAmount] }), _jsxs("span", { children: ["\u623F\u8D39\u6B20\u6B3E: \u00A5", outstandingRoomFee] })] }), _jsx("button", { type: "button", className: "month-order-icon-action", "data-testid": "month-order-section-payment-edit", "aria-label": "\u7F16\u8F91\u623F\u8D39\u6536\u6B3E", onClick: () => setPaymentEditorOpen(true), children: "\u270E" })] }))] }), paymentEditorOpen ? (_jsxs("div", { className: "month-order-inline-form month-order-inline-form--payment", "data-testid": "month-order-section-payment-editor", children: [_jsxs("label", { children: [_jsx("span", { children: "\u5DF2\u6536\u623F\u8D39\uFF1A" }), _jsx("input", { className: "month-order-dialog__input", defaultValue: String(collectedAmount) })] }), _jsxs("label", { children: [_jsx("span", { children: "\u6536\u6B3E\u65B9\u5F0F\uFF1A" }), _jsxs("select", { className: "month-order-dialog__select", defaultValue: "\u5E73\u53F0\u4EE3\u6536", children: [_jsx("option", { value: "\u5E73\u53F0\u4EE3\u6536", children: "\u5E73\u53F0\u4EE3\u6536" }), _jsx("option", { value: "\u7EBF\u4E0B\u6536\u6B3E", children: "\u7EBF\u4E0B\u6536\u6B3E" })] })] }), _jsxs("label", { children: [_jsx("span", { children: "\u6536\u6B3E\u65F6\u95F4\uFF1A" }), _jsx("input", { className: "month-order-dialog__input", defaultValue: "2026-05-19 20:00" })] })] })) : null] }), _jsxs("section", { className: "month-info-block month-order-section-row", "data-testid": "month-order-section-invoice", children: [_jsxs("div", { className: "month-order-section-header month-order-section-header--summary", children: [_jsx("h3", { children: "\u5F00\u7968\u4FE1\u606F" }), invoiceEditorOpen ? (_jsxs("div", { className: "month-order-section-inline-actions", children: [_jsx("button", { type: "button", className: "month-order-mini-action", onClick: () => setInvoiceEditorOpen(false), children: "\u53D6\u6D88" }), _jsx("button", { type: "button", className: "month-order-mini-action", onClick: () => {
                                                            setInvoiceEditorOpen(false);
                                                            onAction('保存开票信息');
                                                        }, children: "\u4FDD\u5B58" })] })) : (_jsx("button", { type: "button", className: "month-order-icon-action", "data-testid": "month-order-section-invoice-edit", "aria-label": "\u7F16\u8F91\u5F00\u7968\u4FE1\u606F", onClick: () => setInvoiceEditorOpen(true), children: "\u270E" }))] }), invoiceEditorOpen ? (_jsxs("div", { className: "month-order-inline-form", "data-testid": "month-order-section-invoice-editor", children: [_jsxs("label", { children: [_jsx("span", { children: "\u5F00\u7968\u65B9\uFF1A" }), _jsx("input", { className: "month-order-dialog__input", placeholder: "\u8BF7\u9009\u62E9\u5F00\u7968\u65B9" })] }), _jsxs("label", { children: [_jsx("span", { children: "\u5F00\u7968\u91D1\u989D\uFF1A" }), _jsxs("div", { className: "month-order-inline-money", children: [_jsx("span", { children: "\uFFE5" }), _jsx("input", { className: "month-order-dialog__input", defaultValue: String(totalIncomeAmount || 0) })] })] }), _jsxs("p", { children: ["\u5EFA\u8BAE\u5F00\u7968\u91D1\u989D\uFF1A\u00A5", recommendedInvoiceAmount] })] })) : null] }), _jsxs("section", { className: "month-info-block month-order-section-row", "data-testid": "month-order-section-extra-income", children: [_jsxs("div", { className: "month-order-section-header month-order-section-header--summary", children: [_jsx("button", { type: "button", className: "month-order-collapse-toggle", "data-testid": "month-order-section-extra-income-toggle", "aria-label": extraIncomeExpanded ? '收起其他收入支出' : '展开其他收入支出', "aria-expanded": extraIncomeExpanded, onClick: () => setExtraIncomeExpanded((current) => !current), children: extraIncomeExpanded ? '收起' : '展开' }), _jsx("h3", { children: "\u5176\u4ED6\u6536\u5165/\u652F\u51FA" }), _jsxs("div", { className: "month-order-section-summary", children: [_jsx("span", { children: "0\u9879/" }), _jsx("span", { children: "\u00A50.00" })] }), _jsx("button", { type: "button", className: "month-order-mini-action", "aria-label": "\u65B0\u589E\u5176\u4ED6\u6536\u5165\u652F\u51FA", onClick: () => onAction('其他收入支出'), children: "+" })] }), extraIncomeExpanded ? (_jsx("div", { className: "month-order-empty-table", "data-testid": "month-order-section-extra-income-table", children: "\u6682\u65E0\u5176\u4ED6\u6536\u5165/\u652F\u51FA\u8BB0\u5F55" })) : null] }), _jsxs("section", { className: "month-info-block month-order-section-row", "data-testid": "month-order-section-deposit", children: [_jsxs("div", { className: "month-order-section-header month-order-section-header--summary", children: [_jsx("h3", { children: "\u62BC\u91D1\u4FE1\u606F" }), depositEditorOpen ? (_jsxs("div", { className: "month-order-section-inline-actions", children: [_jsx("button", { type: "button", className: "month-order-mini-action", onClick: () => setDepositEditorOpen(false), children: "\u53D6\u6D88" }), _jsx("button", { type: "button", className: "month-order-mini-action", onClick: () => {
                                                            setDepositEditorOpen(false);
                                                            onAction('保存押金信息');
                                                        }, children: "\u4FDD\u5B58" })] })) : (_jsxs(_Fragment, { children: [_jsx("div", { className: "month-order-section-summary", children: _jsxs("span", { children: ["\u62BC\u91D1\u91D1\u989D: \u00A5", depositAmount] }) }), _jsx("button", { type: "button", className: "month-order-icon-action", "data-testid": "month-order-section-deposit-edit", "aria-label": "\u7F16\u8F91\u62BC\u91D1\u4FE1\u606F", onClick: () => setDepositEditorOpen(true), children: "\u270E" })] }))] }), depositEditorOpen ? (_jsx("div", { className: "month-order-inline-form month-order-inline-form--deposit", "data-testid": "month-order-section-deposit-editor", children: _jsxs("label", { className: "month-order-inline-form__single-line", children: [_jsx("span", { children: "\u4FEE\u6539\u62BC\u91D1\uFF1A" }), _jsxs("div", { className: "month-order-inline-money", children: [_jsx("span", { children: "\u00A5" }), _jsx("input", { className: "month-order-dialog__input", defaultValue: String(depositAmount) })] }), _jsx("button", { type: "button", className: "month-order-inline-link", onClick: () => onAction('一键免押'), children: "\u4E00\u952E\u514D\u62BC" })] }) })) : null] }), _jsxs("section", { className: "month-info-block month-order-section-row", "data-testid": "month-order-section-arrears", children: [_jsx("div", { className: "month-order-section-header", children: _jsx("h3", { children: "\u8BA2\u5355\u6B20\u6B3E" }) }), _jsx("div", { className: "month-order-arrears-shell", "data-testid": "month-order-section-arrears-body", children: _jsx("div", { className: "month-order-arrears-shell__content" }) })] }), _jsxs("section", { className: "month-info-block month-order-section-row", "data-testid": "month-order-section-remark", children: [_jsxs("div", { className: "month-order-section-header", children: [_jsx("h3", { children: "\u8BA2\u5355\u5907\u6CE8" }), remarkEditorOpen ? (_jsxs("div", { className: "month-order-section-inline-actions", children: [_jsx("button", { type: "button", className: "month-order-mini-action", onClick: () => setRemarkEditorOpen(false), children: "\u53D6\u6D88" }), _jsx("button", { type: "button", className: "month-order-mini-action", onClick: () => {
                                                            setRemarkEditorOpen(false);
                                                            onAction('保存订单备注');
                                                        }, children: "\u4FDD\u5B58" })] })) : (_jsx("button", { type: "button", className: "month-order-icon-action", "data-testid": "month-order-section-remark-edit", "aria-label": "\u7F16\u8F91\u8BA2\u5355\u5907\u6CE8", onClick: () => setRemarkEditorOpen(true), children: "\u270E" }))] }), remarkEditorOpen ? (_jsx("div", { className: "month-order-inline-form", "data-testid": "month-order-section-remark-editor", children: _jsx("textarea", { className: "month-order-dialog__textarea", defaultValue: remark }) })) : (_jsx("p", { children: remark }))] }), _jsxs("section", { className: "month-info-block month-order-section-row", "data-testid": "month-order-section-tags", children: [_jsxs("div", { className: "month-order-section-header", children: [_jsx("h3", { children: "\u8BA2\u5355\u6807\u7B7E" }), _jsx("button", { type: "button", className: "month-order-mini-action", "data-testid": "month-order-section-tags-add", "aria-label": "\u65B0\u589E\u8BA2\u5355\u6807\u7B7E", onClick: openTagDialog, children: "+" })] }), selectedOrderTags.length ? (_jsx("div", { children: selectedOrderTags.map((tag) => (_jsx("span", { className: "month-info-tag", children: tag }, tag))) })) : null] }), _jsxs("section", { className: "month-info-block month-order-section-row", "data-testid": "month-order-section-reminder", children: [_jsxs("div", { className: "month-order-section-header", children: [_jsx("h3", { children: "\u8BA2\u5355\u63D0\u9192" }), _jsx("button", { type: "button", className: "month-order-mini-action", "data-testid": "month-order-section-reminder-add", "aria-label": "\u65B0\u589E\u8BA2\u5355\u63D0\u9192", onClick: () => handleDrawerAction('订单提醒'), children: "+" })] }), _jsx("p", { children: "\u5165\u4F4F\u524D30\u5206\u949F\u77ED\u4FE1\u63D0\u9192" })] }), _jsxs("section", { className: "month-info-block month-order-section-row", "data-testid": "month-order-section-attachment", children: [_jsxs("div", { className: "month-order-section-header", children: [_jsx("h3", { children: "\u8BA2\u5355\u9644\u4EF6" }), _jsxs("label", { className: "month-order-upload-trigger", "aria-label": "\u65B0\u589E\u8BA2\u5355\u9644\u4EF6", "data-testid": "month-order-section-attachment-upload", children: [_jsx("input", { type: "file", accept: "*", onChange: handleAttachmentChange }), _jsx("span", { children: "+" })] })] }), _jsx("div", { className: "month-order-upload-list", "data-testid": "month-order-section-attachment-list", children: uploadedAttachments.map((attachment) => (_jsxs("div", { className: "month-order-upload-item", "data-testid": "month-order-section-attachment-item", children: [_jsx("span", { className: "month-order-upload-item__icon", "aria-hidden": "true", children: _jsx("svg", { viewBox: "64 64 896 896", focusable: "false", children: _jsx("path", { d: "M779.3 196.6c-94.2-94.2-247.6-94.2-341.7 0l-261 260.8c-1.7 1.7-2.6 4-2.6 6.4s.9 4.7 2.6 6.4l36.9 36.9a9 9 0 0012.7 0l261-260.8c32.4-32.4 75.5-50.2 121.3-50.2s88.9 17.8 121.2 50.2c32.4 32.4 50.2 75.5 50.2 121.2 0 45.8-17.8 88.8-50.2 121.2l-266 265.9-43.1 43.1c-40.3 40.3-105.8 40.3-146.1 0-19.5-19.5-30.2-45.4-30.2-73s10.7-53.5 30.2-73l263.9-263.8c6.7-6.6 15.5-10.3 24.9-10.3h.1c9.4 0 18.1 3.7 24.7 10.3 6.7 6.7 10.3 15.5 10.3 24.9 0 9.3-3.7 18.1-10.3 24.7L372.4 653c-1.7 1.7-2.6 4-2.6 6.4s.9 4.7 2.6 6.4l36.9 36.9a9 9 0 0012.7 0l215.6-215.6c19.9-19.9 30.8-46.3 30.8-74.4s-11-54.6-30.8-74.4c-41.1-41.1-107.9-41-149 0L463 364 224.8 602.1A172.22 172.22 0 00174 724.8c0 46.3 18.1 89.8 50.8 122.5 33.9 33.8 78.3 50.7 122.7 50.7 44.4 0 88.8-16.9 122.6-50.7l309.2-309C824.8 492.7 850 432 850 367.5c.1-64.6-25.1-125.3-70.7-170.9z" }) }) }), _jsx("span", { className: "month-order-upload-item__name", title: attachment.name, children: attachment.name }), _jsx("button", { type: "button", className: "month-order-upload-item__delete", "aria-label": `删除附件 ${attachment.name}`, "data-testid": "month-order-section-attachment-delete", onClick: () => removeAttachment(attachment.id), children: _jsx("svg", { viewBox: "64 64 896 896", focusable: "false", children: _jsx("path", { d: "M360 184h-8c4.4 0 8-3.6 8-8v8h304v-8c0 4.4 3.6 8 8 8h-8v72h72v-80c0-35.3-28.7-64-64-64H352c-35.3 0-64 28.7-64 64v80h72v-72zm504 72H160c-17.7 0-32 14.3-32 32v32c0 4.4 3.6 8 8 8h60.4l24.7 523c1.6 34.1 29.8 61 63.9 61h454c34.2 0 62.3-26.8 63.9-61l24.7-523H888c4.4 0 8-3.6 8-8v-32c0-17.7-14.3-32-32-32zM731.3 840H292.7l-24.2-512h487l-24.2 512z" }) }) })] }, attachment.id))) })] }), _jsx("section", { className: "month-info-block month-order-section-row", "data-testid": "month-order-section-meta", children: _jsxs("div", { className: "month-order-key-value-list", children: [_jsxs("div", { className: "month-order-key-value-row", children: [_jsx("span", { children: "\u521B\u5EFA\u4EBA" }), _jsx("strong", { children: "\u65E0" })] }), _jsxs("div", { className: "month-order-key-value-row", children: [_jsx("span", { children: "\u8BA2\u5355\u53F7" }), _jsx("strong", { children: orderId })] }), _jsxs("div", { className: "month-order-key-value-row", children: [_jsx("span", { children: "\u9884\u8BA2\u65F6\u95F4" }), _jsx("strong", { children: "2026.05.16 17:41:03" })] })] }) })] })) : null, overlayPanel === null && activeTab === 'channel' ? (_jsx("section", { className: "month-channel-panel", "data-testid": "month-channel-panel", children: channelBlocks.map((section) => (_jsxs("section", { className: "month-channel-section", "data-testid": section.testId, children: [_jsx("div", { className: "month-channel-section__header", children: _jsx("h3", { children: section.title }) }), _jsx("div", { className: `month-channel-grid${section.key === 'fee' ? ' month-channel-grid--compact' : ''}`, children: section.items.map((item, itemIndex) => (_jsxs("div", { className: `month-channel-kv${item.wide || item.label === '预定房型' || item.label === '发票要求' || item.label === '渠道备注信息' ? ' month-channel-kv--wide' : ''}${item.noWrap ? ' month-channel-kv--no-wrap' : ''}${itemIndex === 0 && section.key === 'basic' ? ' month-channel-kv--with-copy' : ''}`, children: [_jsxs("span", { children: [item.label, ":"] }), _jsx("strong", { children: item.value }), itemIndex === 0 && section.key === 'basic' ? (_jsx("button", { type: "button", className: "month-channel-copy", "aria-label": "\u590D\u5236\u6E20\u9053\u8BA2\u5355\u53F7", "data-testid": "month-channel-copy-order-no", onClick: handleChannelOrderCopy, children: _jsx("span", { "aria-hidden": "true" }) })) : null] }, item.label))) })] }, section.key))) })) : null, overlayPanel === null && activeTab === 'log' ? (_jsx("section", { className: "month-order-log-panel", "data-testid": "month-order-log-panel", children: _jsx("ol", { className: "month-order-log-timeline", "data-testid": "month-order-log-timeline", children: operationLogs.map((log) => (_jsxs("li", { className: "month-order-log-item", "data-testid": "month-order-log-item", children: [_jsxs("time", { className: "month-order-log-time", dateTime: new Date(log.occurredAt).toISOString(), children: [_jsx("span", { children: formatMonthOrderLogDate(log.occurredAt) }), _jsx("span", { children: formatMonthOrderLogTime(log.occurredAt) })] }), _jsx("span", { className: "month-order-log-dot", "aria-hidden": "true" }), _jsxs("article", { className: "month-order-log-card", children: [_jsxs("header", { children: [_jsx("strong", { children: log.title }), _jsxs("span", { children: ["\u64CD\u4F5C\u4EBA\uFF1A", log.operator] })] }), _jsx("p", { children: log.detail })] })] }, log.id))) }) })) : null] }), overlayPanel === 'edit-order' ? (_jsx("footer", { className: "month-order-drawer__footer month-order-drawer__footer--edit", "data-testid": "month-order-drawer-footer", children: _jsxs("div", { className: "month-order-edit-footer", children: [_jsxs("div", { className: "month-order-edit-footer__summary", children: [_jsxs("span", { children: ["\u623F\u8D39(\u51CF\u4F63):", roomFee] }), _jsxs("span", { children: ["\u8BA2\u5355\u603B\u6536\u5165:", totalIncome] })] }), _jsx("button", { type: "button", className: "is-primary", "data-testid": "month-order-edit-submit", onClick: () => onAction('提交编辑订单'), children: "\u63D0\u4EA4" })] }) })) : (_jsxs("footer", { className: "month-order-drawer__footer", "data-testid": "month-order-drawer-footer", children: [_jsx("div", { className: "month-order-actions", children: quickActions.map((action) => (_jsxs("button", { type: "button", className: "month-order-action-button", "data-testid": action.testId, onClick: () => handleDrawerAction(action.label), children: [_jsx("span", { className: "month-order-action-icon", "aria-hidden": "true", children: action.icon }), _jsx("span", { children: action.label })] }, action.key))) }), _jsxs("div", { className: "month-order-footer-row", children: [_jsxs("div", { children: [_jsxs("span", { children: ["\u623F\u8D39(\u51CF\u4F63)\uFF1A", roomFee] }), _jsxs("span", { children: ["\u8BA2\u5355\u603B\u6536\u5165\uFF1A", totalIncome] })] }), footerActions.map((action) => (_jsx("button", { type: "button", className: action.className || undefined, "data-testid": action.testId, disabled: (action.key === 'checkin' && submittingAction === 'checkin') ||
                                    (action.key === 'checkout' && submittingAction === 'checkout'), onClick: () => {
                                    if (action.key === 'more') {
                                        setMoreMenuOpen((current) => !current);
                                        return;
                                    }
                                    if (action.key === 'checkin') {
                                        void handleCheckInOrder();
                                        return;
                                    }
                                    if (action.key === 'checkout') {
                                        void handleCheckOutOrder();
                                        return;
                                    }
                                    handleDrawerAction(action.label);
                                }, children: action.key === 'checkin' && submittingAction === 'checkin'
                                    ? '入住中'
                                    : action.key === 'checkout' && submittingAction === 'checkout'
                                        ? '退房中'
                                        : action.label }, action.key))), moreMenuOpen ? (_jsxs("div", { className: "month-order-more-menu", role: "menu", "aria-label": "\u6708\u623F\u6001\u8BA2\u5355\u66F4\u591A\u64CD\u4F5C", "data-testid": "month-order-footer-more-menu", children: [_jsx("button", { type: "button", role: "menuitem", "data-testid": "month-order-more-item-edit-order", onClick: () => handleMoreMenuAction('编辑订单'), children: "\u7F16\u8F91\u8BA2\u5355" }), _jsx("button", { type: "button", role: "menuitem", "data-testid": "month-order-more-item-modify-fee", onClick: () => handleMoreMenuAction('修改费用'), children: "\u4FEE\u6539\u8D39\u7528" })] })) : null] })] })), checkInBlockedDialogOpen ? (_jsx("div", { className: "month-order-dialog-scrim", onClick: () => setCheckInBlockedDialogOpen(false), children: _jsxs("section", { className: "month-order-dialog month-order-dialog--medium", role: "dialog", "aria-modal": "true", "aria-label": "\u5165\u4F4F\u63D0\u793A", "data-testid": "month-order-dialog-checkin-blocked", onClick: (event) => event.stopPropagation(), children: [_jsxs("header", { className: "month-order-dialog__header", children: [_jsx("strong", { children: "\u5165\u4F4F\u63D0\u793A" }), _jsx("button", { type: "button", "aria-label": "\u5173\u95ED\u5165\u4F4F\u63D0\u793A", onClick: () => setCheckInBlockedDialogOpen(false), children: "\u00D7" })] }), _jsx("div", { className: "month-order-dialog__body", children: _jsx("p", { children: "\u8BF7\u5148\u767B\u8BB0\u5165\u4F4F\u4EBA" }) }), _jsxs("footer", { className: "month-order-dialog__footer", children: [_jsx("button", { type: "button", onClick: () => setCheckInBlockedDialogOpen(false), children: "\u77E5\u9053\u4E86" }), _jsx("button", { type: "button", className: "is-primary", onClick: () => {
                                        setCheckInBlockedDialogOpen(false);
                                        setGuestEditorOpen(true);
                                    }, children: "\u53BB\u767B\u8BB0" })] })] }) })) : null, openDialog === 'noshow' ? (_jsx("div", { className: "month-order-dialog-scrim", onClick: () => setOpenDialog(null), children: _jsxs("section", { className: "month-order-dialog month-order-dialog--medium", role: "dialog", "aria-modal": "true", "aria-label": "\u7F6E\u4E3Anoshow\u5931\u7EA6\u5355", "data-testid": "month-order-dialog-noshow", onClick: (event) => event.stopPropagation(), children: [_jsxs("header", { className: "month-order-dialog__header", children: [_jsx("strong", { children: "\u7F6E\u4E3Anoshow\u5931\u7EA6\u5355" }), _jsx("button", { type: "button", "aria-label": "\u5173\u95ED\u7F6E\u4E3Anoshow\u5931\u7EA6\u5355", onClick: () => setOpenDialog(null), children: "\u00D7" })] }), _jsxs("div", { className: "month-order-dialog__body", children: [_jsxs("div", { className: "month-order-dialog__selection", children: [_jsxs("label", { children: [_jsx("input", { type: "checkbox", checked: true, readOnly: true }), _jsx("span", { children: "\u9009\u62E9\u5168\u90E8\u623F\u95F4" })] }), _jsx("span", { children: "\u5DF2\u90091\u95F4 \u51711\u95F4" })] }), _jsxs("div", { className: "month-order-dialog__room", children: [_jsx("label", { className: "month-order-dialog__room-check", children: _jsx("input", { type: "checkbox", checked: true, readOnly: true }) }), _jsxs("div", { className: "month-order-dialog__room-content", children: [_jsxs("div", { className: "month-order-dialog__room-title", children: [_jsx("strong", { children: roomDisplayName }), _jsx("span", { children: statusLabel })] }), _jsxs("div", { className: "month-order-dialog__room-meta", children: [_jsxs("span", { children: [stayRange.replace(/\./g, '.').replace('-', '-'), " (2\u665A)"] }), _jsx("strong", { children: "\u00A51624" })] })] })] }), operationMessage.startsWith('置为未到店失败') ? (_jsx("div", { className: "month-order-dialog__error", role: "alert", children: operationMessage })) : null] }), _jsxs("footer", { className: "month-order-dialog__footer", children: [_jsx("button", { type: "button", onClick: () => setOpenDialog(null), children: "\u53D6\u6D88" }), _jsx("button", { type: "button", className: "is-primary", disabled: isNoShowSubmitting, onClick: confirmDialog, children: isNoShowSubmitting ? '处理中' : '确定' })] })] }) })) : null, openDialog === 'checkout' ? (_jsx("div", { className: "month-order-dialog-scrim", onClick: () => setOpenDialog(null), children: _jsxs("section", { className: "month-order-dialog month-order-dialog--large", role: "dialog", "aria-modal": "true", "aria-label": "\u529E\u7406\u9000\u623F", "data-testid": "month-order-dialog-checkout", onClick: (event) => event.stopPropagation(), children: [_jsxs("header", { className: "month-order-dialog__header", children: [_jsx("strong", { children: "\u529E\u7406\u9000\u623F" }), _jsx("button", { type: "button", "aria-label": "\u5173\u95ED\u529E\u7406\u9000\u623F", onClick: () => setOpenDialog(null), children: "\u00D7" })] }), _jsxs("div", { className: "month-order-dialog__body month-order-dialog__body--scroll", children: [_jsxs("section", { className: "month-order-dialog__group", children: [_jsx("h3", { children: "\u79DF\u5BA2\u4FE1\u606F" }), _jsxs("div", { className: "month-order-dialog__grid", children: [_jsxs("span", { children: ["\u79DF\u5BA2\u59D3\u540D: ", selectedBooking.cell.title] }), _jsxs("span", { children: ["\u624B\u673A\u53F7\u7801: ", phone] })] })] }), _jsxs("section", { className: "month-order-dialog__group", children: [_jsx("h3", { children: "\u79DF\u8D41\u4FE1\u606F" }), _jsxs("div", { className: "month-order-dialog__grid", children: [_jsxs("span", { children: ["\u623F\u95F4\u4FE1\u606F: ", roomDisplayName] }), _jsx("span", { children: "\u5408\u540C\u65F6\u95F4: 2026-05-16 \u81F3 2026-05-16" }), _jsx("span", { children: "\u5408\u540C\u671F\u9650: 2\u665A" }), _jsx("span", { children: "\u6BCF\u6708\u79DF\u91D1: \u00A50" }), _jsx("span", { children: "\u62BC\u91D1: \u00A50" }), _jsx("span", { children: "\u7F34\u8D39\u65B9\u5F0F: \u7EBF\u4E0A\u9884\u4ED8" })] })] }), _jsxs("section", { className: "month-order-dialog__group", children: [_jsx("h3", { children: "\u9000\u623F\u4FE1\u606F" }), _jsxs("div", { className: "month-order-dialog__radio-group", children: [_jsxs("label", { children: [_jsx("input", { type: "radio", name: "month-checkout-type", checked: checkoutType === 'normal', onChange: () => setCheckoutType('normal') }), _jsx("span", { children: "\u6B63\u5E38\u9000\u623F" })] }), _jsxs("label", { children: [_jsx("input", { type: "radio", name: "month-checkout-type", checked: checkoutType === 'early', onChange: () => setCheckoutType('early') }), _jsx("span", { children: "\u63D0\u524D\u9000\u623F" })] })] })] }), _jsx("section", { className: "month-order-dialog__group", children: _jsxs("div", { className: "month-order-dialog__checkout-bar", children: [_jsx("span", { children: "\u8D26\u5355\u4FE1\u606F" }), _jsx("button", { type: "button", className: "is-primary", "data-testid": "month-order-dialog-checkout-add-collect", onClick: () => handleDrawerAction('添加收款'), children: "\u6DFB\u52A0\u6536\u6B3E" })] }) }), _jsx("section", { className: "month-order-dialog__group", children: _jsxs("div", { className: "month-order-dialog__grid month-order-dialog__grid--inputs", children: [_jsxs("label", { children: [_jsx("span", { children: "\u5E94\u9000\u62BC\u91D1" }), _jsx("input", { className: "month-order-dialog__input", value: "0 \u5143", readOnly: true })] }), _jsxs("label", { children: [_jsx("span", { children: "\u9000\u62BC\u91D1" }), _jsx("input", { className: "month-order-dialog__input", value: "0 \u5143", readOnly: true })] }), _jsxs("label", { children: [_jsx("span", { children: "\u6263\u62BC\u91D1" }), _jsx("input", { className: "month-order-dialog__input", value: "0 \u5143", readOnly: true })] })] }) }), _jsx("section", { className: "month-order-dialog__group", children: _jsxs("label", { className: "month-order-dialog__textarea-label", children: [_jsx("span", { children: "\u5907\u6CE8\u4FE1\u606F" }), _jsx("textarea", { className: "month-order-dialog__textarea", placeholder: "\u9650\u5236300\u5B57\u4EE5\u5185", defaultValue: remark })] }) })] }), _jsxs("footer", { className: "month-order-dialog__footer", children: [_jsx("button", { type: "button", onClick: () => setOpenDialog(null), children: "\u53D6\u6D88" }), _jsx("button", { type: "button", className: "is-primary", onClick: confirmDialog, children: "\u529E\u7406\u9000\u623F" })] })] }) })) : null, collectDialogOpen ? (_jsx("div", { className: "month-order-dialog-scrim", onClick: () => setCollectDialogOpen(false), children: _jsxs("section", { className: "month-order-dialog month-order-dialog--medium", role: "dialog", "aria-modal": "true", "aria-label": "\u6DFB\u52A0\u6536\u6B3E\u8BB0\u5F55", "data-testid": "month-order-dialog-collect", onClick: (event) => event.stopPropagation(), children: [_jsxs("header", { className: "month-order-dialog__header", children: [_jsx("strong", { children: "\u6DFB\u52A0\u6536\u6B3E\u8BB0\u5F55" }), _jsx("button", { type: "button", "aria-label": "\u5173\u95ED\u6DFB\u52A0\u6536\u6B3E\u8BB0\u5F55", onClick: () => setCollectDialogOpen(false), children: "\u00D7" })] }), _jsxs("div", { className: "month-order-dialog__body", children: [_jsxs("div", { className: "month-order-dialog__stats", children: [_jsxs("div", { className: "month-order-dialog__stat", children: [_jsx("span", { children: "\u5E94\u6536\u6B3E" }), _jsx("strong", { children: "\u00A51624" })] }), _jsxs("div", { className: "month-order-dialog__stat", children: [_jsx("span", { children: "\u5DF2\u6536\u6B3E" }), _jsx("strong", { children: "\u00A50" })] }), _jsxs("div", { className: "month-order-dialog__stat month-order-dialog__stat--pending", children: [_jsx("span", { children: "\u5F85\u6536\u6B3E" }), _jsx("strong", { children: "\u00A50" })] })] }), _jsxs("div", { className: "month-order-dialog__form-grid", children: [_jsxs("label", { children: [_jsx("span", { children: "\u7C7B\u578B" }), _jsxs("select", { className: "month-order-dialog__select", defaultValue: "", children: [_jsx("option", { value: "", disabled: true, children: "\u8BF7\u9009\u62E9\u7C7B\u578B" }), _jsx("option", { value: "\u623F\u8D39", children: "\u623F\u8D39" })] })] }), _jsxs("label", { children: [_jsx("span", { children: "\u652F\u4ED8\u65B9\u5F0F" }), _jsxs("select", { className: "month-order-dialog__select", defaultValue: "", children: [_jsx("option", { value: "", disabled: true, children: "\u8BF7\u9009\u62E9\u652F\u4ED8\u65B9\u5F0F" }), _jsx("option", { value: "\u7EBF\u4E0A\u9884\u4ED8", children: "\u7EBF\u4E0A\u9884\u4ED8" }), _jsx("option", { value: "\u7EBF\u4E0B\u6536\u6B3E", children: "\u7EBF\u4E0B\u6536\u6B3E" })] })] }), _jsxs("label", { children: [_jsx("span", { children: "\u65E5\u671F" }), _jsx("input", { className: "month-order-dialog__input", placeholder: "\u8BF7\u9009\u62E9\u65E5\u671F", readOnly: true })] }), _jsxs("label", { children: [_jsx("span", { children: "\u91D1\u989D(\u00A5)" }), _jsx("input", { className: "month-order-dialog__input", placeholder: "\u8BF7\u8F93\u5165\u91D1\u989D" })] }), _jsxs("label", { className: "month-order-dialog__form-grid-full", children: [_jsx("span", { children: "\u5907\u6CE8" }), _jsx("textarea", { className: "month-order-dialog__textarea", placeholder: "\u8BF7\u8F93\u5165\u5907\u6CE8" })] })] })] }), _jsxs("footer", { className: "month-order-dialog__footer", children: [_jsx("span", { className: "month-order-dialog__footer-note", children: "\u5728\u7EBF\u6536\u6B3E" }), _jsx("button", { type: "button", className: "is-primary", onClick: confirmCollectDialog, children: "\u63D0\u4EA4" })] })] }) })) : null, tagDialogOpen ? (_jsx("div", { className: "month-order-dialog-scrim", onClick: closeTagDialog, children: _jsxs("section", { className: "month-order-dialog month-order-dialog--tags", role: "dialog", "aria-modal": "true", "aria-label": "\u9009\u62E9\u6807\u7B7E", "data-testid": "month-order-dialog-tags", onClick: (event) => event.stopPropagation(), children: [_jsxs("header", { className: "month-order-dialog__header", children: [_jsx("strong", { children: "\u9009\u62E9\u6807\u7B7E" }), _jsx("button", { type: "button", "aria-label": "\u5173\u95ED\u9009\u62E9\u6807\u7B7E", onClick: closeTagDialog, children: "\u00D7" })] }), _jsxs("div", { className: "month-order-dialog__body", children: [_jsxs("div", { className: "month-order-tag-dialog__toolbar", children: [_jsxs("label", { className: "month-order-tag-dialog__search", children: [_jsx("span", { "aria-hidden": "true", children: "\u2315" }), _jsx("input", { type: "text", placeholder: "\u641C\u7D22", value: tagDialogKeyword, onChange: (event) => setTagDialogKeyword(event.target.value) })] }), _jsx("button", { type: "button", className: "month-order-tag-dialog__create-link", onClick: () => onAction('创建标签'), children: "+\u521B\u5EFA\u6807\u7B7E" })] }), _jsx("div", { className: "month-order-tag-dialog__tabs", children: _jsx("button", { type: "button", className: "is-active", children: "\u8BA2\u5355\u6807\u7B7E" }) }), _jsxs("div", { className: "month-order-tag-tree", "data-testid": "month-order-tag-tree", children: [_jsxs("div", { className: "month-order-tag-tree__group", children: [_jsx("button", { type: "button", className: "month-order-tag-tree__caret", "aria-label": "\u5C55\u5F00\u9ED8\u8BA4\u6807\u7B7E", children: "\u25BE" }), _jsxs("label", { className: "month-order-tag-tree__row month-order-tag-tree__row--group", children: [_jsx("input", { type: "checkbox", checked: allVisibleTagChecked, ref: (node) => {
                                                                if (node) {
                                                                    node.indeterminate = !allVisibleTagChecked && someVisibleTagChecked;
                                                                }
                                                            }, onChange: toggleAllVisibleTags }), _jsx("span", { children: ORDER_TAG_GROUP_LABEL })] })] }), _jsx("div", { className: "month-order-tag-tree__children", children: visibleTagOptions.map((tag) => (_jsxs("label", { className: "month-order-tag-tree__row", children: [_jsx("input", { type: "checkbox", checked: tagDraftSelection.includes(tag), onChange: () => toggleTagOption(tag) }), _jsx("span", { children: tag })] }, tag))) })] })] }), _jsxs("footer", { className: "month-order-dialog__footer", children: [_jsx("button", { type: "button", onClick: closeTagDialog, children: "\u53D6\u6D88" }), _jsx("button", { type: "button", className: "is-primary", onClick: () => {
                                        setSelectedOrderTags(tagDraftSelection);
                                        closeTagDialog();
                                        onAction('保存订单标签');
                                    }, children: "\u786E\u5B9A" })] })] }) })) : null, openDialog === 'modify-fee' ? (_jsx("div", { className: "month-order-dialog-scrim", onClick: () => setOpenDialog(null), children: _jsxs("section", { className: "month-order-dialog month-order-dialog--medium", role: "dialog", "aria-modal": "true", "aria-label": "\u4FEE\u6539\u8D39\u7528", "data-testid": "month-order-dialog-modify-fee", onClick: (event) => event.stopPropagation(), children: [_jsxs("header", { className: "month-order-dialog__header", children: [_jsx("strong", { children: "\u4FEE\u6539\u8D39\u7528" }), _jsx("button", { type: "button", "aria-label": "\u5173\u95ED\u4FEE\u6539\u8D39\u7528", onClick: () => setOpenDialog(null), children: "\u00D7" })] }), _jsx("div", { className: "month-order-dialog__body", children: _jsxs("div", { className: "month-order-dialog__form-grid month-order-dialog__form-grid--single", children: [_jsxs("label", { children: [_jsx("span", { children: "\u623F\u8D39(\u51CF\u4F63)" }), _jsx("input", { className: "month-order-dialog__input", defaultValue: String(roomFeeAmount || 0) })] }), _jsxs("label", { children: [_jsx("span", { children: "\u4F63\u91D1" }), _jsx("input", { className: "month-order-dialog__input", defaultValue: String(commissionAmount || 0) })] }), _jsxs("label", { children: [_jsx("span", { children: "\u623F\u8D39(\u542B\u4F63)" }), _jsx("input", { className: "month-order-dialog__input", defaultValue: String(totalIncomeAmount || 0) })] })] }) }), _jsxs("footer", { className: "month-order-dialog__footer", children: [_jsx("button", { type: "button", onClick: () => setOpenDialog(null), children: "\u53D6\u6D88" }), _jsx("button", { type: "button", className: "is-primary", onClick: confirmDialog, children: "\u4FDD\u5B58" })] })] }) })) : null, openDialog === 'reminder' ? (_jsx("div", { className: "month-order-dialog-scrim", onClick: () => setOpenDialog(null), children: _jsxs("section", { className: "month-order-dialog month-order-dialog--medium", role: "dialog", "aria-modal": "true", "aria-label": "\u6DFB\u52A0\u8BA2\u5355\u63D0\u9192", "data-testid": "month-order-dialog-reminder", onClick: (event) => event.stopPropagation(), children: [_jsxs("header", { className: "month-order-dialog__header", children: [_jsx("strong", { children: "\u6DFB\u52A0\u8BA2\u5355\u63D0\u9192" }), _jsx("button", { type: "button", "aria-label": "\u5173\u95ED\u6DFB\u52A0\u8BA2\u5355\u63D0\u9192", onClick: () => setOpenDialog(null), children: "\u00D7" })] }), _jsx("div", { className: "month-order-dialog__body", children: _jsxs("div", { className: "month-order-dialog__form-grid month-order-dialog__form-grid--single", children: [_jsxs("label", { children: [_jsx("span", { children: "\u63D0\u9192\u65F6\u95F4" }), _jsx("input", { className: "month-order-dialog__input", placeholder: "\u8BF7\u9009\u62E9\u65E5\u671F", readOnly: true })] }), _jsxs("label", { className: "month-order-dialog__form-grid-full", children: [_jsx("span", { children: "\u63D0\u9192\u5185\u5BB9" }), _jsx("textarea", { className: "month-order-dialog__textarea", placeholder: "\u8BF7\u8F93\u5165\u63D0\u9192\u5185\u5BB9" })] })] }) }), _jsxs("footer", { className: "month-order-dialog__footer", children: [_jsx("button", { type: "button", onClick: () => setOpenDialog(null), children: "\u53D6\u6D88" }), _jsx("button", { type: "button", className: "is-primary", onClick: confirmDialog, children: "\u786E\u5B9A" })] })] }) })) : null, actionDialogConfig ? (_jsx("div", { className: "month-order-dialog-scrim", onClick: () => setActionFlow(null), children: _jsxs("section", { className: "month-order-dialog month-order-dialog--medium", role: "dialog", "aria-modal": "true", "aria-label": actionDialogConfig.title, "data-testid": actionDialogConfig.testId, onClick: (event) => event.stopPropagation(), children: [_jsxs("header", { className: "month-order-dialog__header", children: [_jsx("strong", { children: actionDialogConfig.title }), _jsx("button", { type: "button", "aria-label": `关闭${actionDialogConfig.title}`, onClick: () => setActionFlow(null), children: "\u00D7" })] }), _jsxs("div", { className: "month-order-dialog__body", children: [actionFlow === 'invite' || actionFlow === 'invite-renew' ? (_jsxs("div", { className: "month-order-dialog__form-grid month-order-dialog__form-grid--single", children: [_jsxs("label", { children: [_jsx("span", { children: actionFlow === 'invite' ? '邀请方式' : '续住方式' }), _jsxs("select", { className: "month-order-dialog__select", defaultValue: "\u77ED\u4FE1\u94FE\u63A5", children: [_jsx("option", { value: "\u77ED\u4FE1\u94FE\u63A5", children: "\u77ED\u4FE1\u94FE\u63A5" }), _jsx("option", { value: "\u5FAE\u4FE1\u53D1\u9001", children: "\u5FAE\u4FE1\u53D1\u9001" })] })] }), _jsxs("label", { children: [_jsx("span", { children: "\u76EE\u6807\u624B\u673A\u53F7" }), _jsx("input", { className: "month-order-dialog__input", defaultValue: phone === '-' ? '' : phone, placeholder: "\u8BF7\u8F93\u5165\u624B\u673A\u53F7" })] }), _jsxs("label", { className: "month-order-dialog__form-grid-full", children: [_jsx("span", { children: "\u53D1\u9001\u5185\u5BB9" }), _jsx("textarea", { className: "month-order-dialog__textarea", defaultValue: actionFlow === 'invite'
                                                        ? `请完成 ${roomDisplayName} 的入住登记，入住日期 ${stayRange}`
                                                        : `请确认 ${roomDisplayName} 的续住申请，当前入住周期 ${stayRange}` })] })] })) : null, actionFlow === 'early-checkin' || actionFlow === 'late-checkout' || actionFlow === 'renew' || actionFlow === 'continue' ? (_jsxs("div", { className: "month-order-dialog__form-grid month-order-dialog__form-grid--single", children: [_jsxs("label", { children: [_jsx("span", { children: actionFlow === 'late-checkout' ? '延退至' : actionFlow === 'renew' || actionFlow === 'continue' ? '续住至' : '提前入住时间' }), _jsx("input", { className: "month-order-dialog__input", defaultValue: actionFlow === 'late-checkout'
                                                        ? '2026-05-21 14:00'
                                                        : actionFlow === 'renew' || actionFlow === 'continue'
                                                            ? '2026-05-22'
                                                            : '2026-05-20 12:00', readOnly: true })] }), _jsxs("label", { className: "month-order-dialog__form-grid-full", children: [_jsx("span", { children: "\u5907\u6CE8" }), _jsx("textarea", { className: "month-order-dialog__textarea", defaultValue: actionFlow === 'late-checkout'
                                                        ? '客户已确认延迟退房，需要同步房态与清扫时间。'
                                                        : actionFlow === 'renew' || actionFlow === 'continue'
                                                            ? '续住后沿用当前房间与价格策略。'
                                                            : '提前入住后请同步门锁密码和入住提醒。' })] })] })) : null, actionFlow === 'change-room' ? (_jsxs("div", { className: "month-order-dialog__form-grid", children: [_jsxs("label", { children: [_jsx("span", { children: "\u5F53\u524D\u623F\u95F4" }), _jsx("input", { className: "month-order-dialog__input", value: roomDisplayName, readOnly: true })] }), _jsxs("label", { children: [_jsx("span", { children: "\u8C03\u6574\u81F3" }), _jsxs("select", { className: "month-order-dialog__select", value: selectedChangeRoomId, disabled: changeRoomOptionsLoading || !changeRoomOptions.length || submittingAction === 'change-room', onChange: (event) => setSelectedChangeRoomId(event.target.value), children: [changeRoomOptionsLoading ? _jsx("option", { value: "", children: "\u6B63\u5728\u52A0\u8F7D\u53EF\u6362\u623F\u95F4" }) : null, !changeRoomOptionsLoading && !changeRoomOptions.length ? _jsx("option", { value: "", children: "\u5F53\u524D\u623F\u578B\u6682\u65E0\u53EF\u6362\u7A7A\u623F" }) : null, changeRoomOptions.map((room) => (_jsxs("option", { value: room.roomId, children: [room.roomCategoryName || selectedBooking.roomType, " ", room.roomName] }, room.roomId)))] })] }), _jsxs("label", { className: "month-order-dialog__form-grid-full", children: [_jsx("span", { children: "\u6362\u623F\u539F\u56E0" }), _jsx("textarea", { className: "month-order-dialog__textarea", value: changeRoomReason, disabled: submittingAction === 'change-room', onChange: (event) => setChangeRoomReason(event.target.value) })] }), changeRoomOptionsError ? (_jsx("div", { className: "month-order-dialog__form-grid-full month-order-dialog__error", role: "alert", children: changeRoomOptionsError })) : null] })) : null, actionFlow === 'clean' ? (_jsxs("div", { className: "month-order-dialog__form-grid", children: [_jsxs("label", { children: [_jsx("span", { children: "\u4FDD\u6D01\u623F\u95F4" }), _jsx("input", { className: "month-order-dialog__input", value: roomDisplayName, readOnly: true })] }), _jsxs("label", { children: [_jsx("span", { children: "\u4F18\u5148\u7EA7" }), _jsxs("select", { className: "month-order-dialog__select", defaultValue: "\u666E\u901A", children: [_jsx("option", { value: "\u666E\u901A", children: "\u666E\u901A" }), _jsx("option", { value: "\u52A0\u6025", children: "\u52A0\u6025" })] })] }), _jsxs("label", { className: "month-order-dialog__form-grid-full", children: [_jsx("span", { children: "\u4EFB\u52A1\u8BF4\u660E" }), _jsx("textarea", { className: "month-order-dialog__textarea", defaultValue: "\u9000\u623F\u540E\u5B89\u6392\u4FDD\u6D01\uFF0C\u68C0\u67E5\u5E03\u8349\u548C minibar \u6D88\u8017\u3002" })] })] })) : null, actionFlow === 'print' ? (_jsxs("div", { className: "month-order-dialog__form-grid month-order-dialog__form-grid--single", children: [_jsxs("label", { children: [_jsx("span", { children: "\u6253\u5370\u7C7B\u578B" }), _jsxs("select", { className: "month-order-dialog__select", defaultValue: "\u8BA2\u5355\u8BE6\u60C5\u5355", children: [_jsx("option", { value: "\u8BA2\u5355\u8BE6\u60C5\u5355", children: "\u8BA2\u5355\u8BE6\u60C5\u5355" }), _jsx("option", { value: "\u5165\u4F4F\u5355", children: "\u5165\u4F4F\u5355" }), _jsx("option", { value: "\u8D26\u5355", children: "\u8D26\u5355" })] })] }), _jsxs("label", { className: "month-order-dialog__form-grid-full", children: [_jsx("span", { children: "\u6253\u5370\u8BF4\u660E" }), _jsx("textarea", { className: "month-order-dialog__textarea", defaultValue: "\u6253\u5370\u5C06\u6309\u5F53\u524D\u8BA2\u5355\u4FE1\u606F\u751F\u6210\u5355\u636E\uFF0C\u63D0\u4EA4\u540E\u8FDB\u5165\u6253\u5370\u6D41\u7A0B\u3002" })] })] })) : null, actionFlow === 'credit-checkout' ? (_jsxs("div", { className: "month-order-dialog__stats", children: [_jsxs("div", { className: "month-order-dialog__stat", children: [_jsx("span", { children: "\u4FE1\u7528\u4F4F\u623F\u8D39" }), _jsx("strong", { children: roomFee })] }), _jsxs("div", { className: "month-order-dialog__stat", children: [_jsx("span", { children: "\u4F63\u91D1" }), _jsx("strong", { children: commission })] }), _jsxs("div", { className: "month-order-dialog__stat month-order-dialog__stat--pending", children: [_jsx("span", { children: "\u5F85\u7ED3\u91D1\u989D" }), _jsx("strong", { children: totalIncome })] })] })) : null, actionFlow === 'checkin' ? (_jsxs("div", { className: "month-order-dialog__form-grid month-order-dialog__form-grid--single", children: [_jsxs("label", { children: [_jsx("span", { children: "\u5165\u4F4F\u623F\u95F4" }), _jsx("input", { className: "month-order-dialog__input", value: roomDisplayName, readOnly: true })] }), _jsxs("label", { children: [_jsx("span", { children: "\u5165\u4F4F\u4EBA" }), _jsx("input", { className: "month-order-dialog__input", value: selectedBooking.cell.title, readOnly: true })] }), _jsxs("label", { className: "month-order-dialog__form-grid-full", children: [_jsx("span", { children: "\u529E\u7406\u8BF4\u660E" }), _jsx("textarea", { className: "month-order-dialog__textarea", defaultValue: "\u786E\u8BA4\u8BC1\u4EF6\u3001\u623F\u8D39\u4E0E\u62BC\u91D1\u4FE1\u606F\u540E\u5373\u53EF\u529E\u7406\u5165\u4F4F\u3002" })] })] })) : null, actionFlow === 'cancel-order' ? (_jsxs("div", { className: "month-order-cancel-confirm", children: [_jsx("span", { className: "month-order-cancel-confirm__icon", "aria-hidden": "true", children: "!" }), _jsxs("div", { children: [_jsx("strong", { children: "\u786E\u5B9A\u53D6\u6D88\u6B64\u623F\u5355\u5417\uFF1F" }), _jsx("p", { children: "\u53D6\u6D88\u540E\u5C06\u91CA\u653E\u623F\u6001\uFF0C\u4E0D\u53EF\u6062\u590D\uFF0C\u8BF7\u8C28\u614E\u64CD\u4F5C" }), _jsxs("dl", { children: [_jsxs("div", { children: [_jsx("dt", { children: "\u623F\u95F4\u4FE1\u606F" }), _jsx("dd", { children: roomDisplayName })] }), _jsxs("div", { children: [_jsx("dt", { children: "\u8BA2\u5355\u7F16\u53F7" }), _jsx("dd", { children: orderId || '-' })] }), _jsxs("div", { children: [_jsx("dt", { children: "\u5F53\u524D\u72B6\u6001" }), _jsx("dd", { children: statusLabel })] })] })] })] })) : null, actionFlow === 'skip-stock' ? (_jsxs("div", { className: "month-order-cancel-confirm month-order-skip-stock-confirm", children: [_jsx("span", { className: "month-order-cancel-confirm__icon", "aria-hidden": "true", children: "!" }), _jsxs("div", { children: [_jsx("strong", { children: "\u8BA2\u5355\u5C06\u91CA\u653E\u5E93\u5B58\u4F1A\u540C\u65F6\u53D6\u6D88\u6392\u623F\uFF0C\u662F\u5426\u786E\u5B9A\u6B64\u64CD\u4F5C\uFF1F" }), _jsx("p", { children: "\u786E\u8BA4\u540E\u8BE5\u8BA2\u5355\u4E0D\u518D\u5360\u7528\u5F53\u524D\u623F\u95F4\u5E93\u5B58\uFF0C\u5F53\u524D\u6392\u623F\u4E5F\u4F1A\u540C\u6B65\u53D6\u6D88\u3002" }), _jsxs("button", { type: "button", className: "month-order-skip-stock-confirm__tag", onClick: openTagDialog, children: [_jsx("span", { children: "\u6DFB\u52A0\u6807\u7B7E\uFF1A" }), _jsx("strong", { children: "+ \u6DFB\u52A0\u6807\u7B7E" })] }), _jsxs("dl", { children: [_jsxs("div", { children: [_jsx("dt", { children: "\u623F\u95F4\u4FE1\u606F" }), _jsx("dd", { children: roomDisplayName })] }), _jsxs("div", { children: [_jsx("dt", { children: "\u8BA2\u5355\u7F16\u53F7" }), _jsx("dd", { children: orderId || '-' })] }), _jsxs("div", { children: [_jsx("dt", { children: "\u5F53\u524D\u72B6\u6001" }), _jsx("dd", { children: statusLabel })] })] })] })] })) : null, actionFlow === 'cancel-arrange' || actionFlow === 'skip-report' ? (_jsxs("div", { className: "month-order-dialog__grid month-order-dialog__grid--inputs", children: [_jsxs("span", { children: ["\u623F\u95F4\u4FE1\u606F: ", roomDisplayName] }), _jsxs("span", { children: ["\u8BA2\u5355\u7F16\u53F7: ", orderId] }), _jsxs("span", { children: ["\u5F53\u524D\u72B6\u6001: ", statusLabel] }), _jsx("span", { children: actionFlow === 'cancel-arrange'
                                                ? '确认后将移除当前排房记录。'
                                                : actionFlow === 'skip-report'
                                                    ? '确认后该订单将不再计入统计口径。'
                                                    : '' })] })) : null] }), _jsxs("footer", { className: "month-order-dialog__footer", children: [_jsx("button", { type: "button", onClick: () => setActionFlow(null), children: "\u53D6\u6D88" }), _jsx("button", { type: "button", className: "is-primary", disabled: isActionConfirmDisabled, onClick: () => {
                                        if (actionFlow === 'checkin') {
                                            setActionFlow(null);
                                            void handleCheckInOrder();
                                            return;
                                        }
                                        if (actionFlow === 'change-room') {
                                            void handleChangeRoomOrder();
                                            return;
                                        }
                                        if (actionFlow === 'cancel-order') {
                                            void handleCancelOrder();
                                            return;
                                        }
                                        if (actionFlow === 'skip-stock') {
                                            void handleSkipStockOrder();
                                            return;
                                        }
                                        confirmActionFlow();
                                    }, children: actionFlow === 'checkin'
                                        ? (submittingAction === 'checkin' ? '入住中' : '办理入住')
                                        : actionFlow === 'change-room' && isChangeRoomSubmitting
                                            ? '换房中'
                                            : actionFlow === 'cancel-order' && isCancelSubmitting
                                                ? '取消中'
                                                : actionFlow === 'skip-stock' && isSkipStockSubmitting
                                                    ? '处理中'
                                                    : actionDialogConfig.confirmLabel })] })] }) })) : null] }));
}
function parseCurrencyNumber(value) {
    const numeric = Number(value.replace(/[^\d.-]/g, ''));
    return Number.isFinite(numeric) ? numeric : 0;
}
function resolveMonthOrderState(liveStatus) {
    if (liveStatus?.includes('未到店') || liveStatus?.includes('失约') || liveStatus === 'no_show' || liveStatus === 'no-show' || liveStatus === 'noshow')
        return 'no-show';
    if (liveStatus?.includes('已取消') || liveStatus === 'cancelled' || liveStatus === 'canceled')
        return 'cancelled';
    if (liveStatus?.includes('入住中'))
        return 'checked-in';
    if (liveStatus?.includes('已退房'))
        return 'checked-out';
    return 'pending';
}
function createMonthOrderGuestForm(guestName, guestMobile) {
    return {
        guestName,
        guestMobile: guestMobile && guestMobile !== '-' ? guestMobile : '',
        guestIdCardType: '居民身份证',
        guestIdCard: '',
    };
}
function createMonthOrderInitialLogs(selectedBooking, roomLogLabel) {
    const now = Date.now();
    const initialId = selectedBooking.cell.orderId || `${selectedBooking.cell.title}-${roomLogLabel}`;
    const channelTime = parseMonthOrderLogTimestamp(selectedBooking.cell.bookingAt ?? selectedBooking.cell.createdAt) ?? now - 120_000;
    const checkInTime = parseMonthOrderLogTimestamp(selectedBooking.cell.guestRegisteredAt);
    const checkOutTime = parseMonthOrderLogTimestamp(selectedBooking.cell.checkedOutAt);
    const orderState = resolveMonthOrderState(selectedBooking.cell.liveStatus);
    const logs = [
        {
            id: `${initialId}-channel`,
            occurredAt: channelTime,
            title: '渠道来单',
            operator: '系统自动',
            detail: '订单状态:进行中',
        },
    ];
    if ((orderState === 'checked-in' || orderState === 'checked-out') && checkInTime !== undefined) {
        logs.push({
            id: `${initialId}-checkin`,
            occurredAt: checkInTime,
            title: '办理入住',
            operator: '系统自动',
            detail: `入住房间：${roomLogLabel}`,
        });
    }
    if (orderState === 'checked-out' && checkOutTime !== undefined) {
        logs.push({
            id: `${initialId}-checkout`,
            occurredAt: checkOutTime,
            title: '办理退房',
            operator: '系统自动',
            detail: `退房房间：${roomLogLabel}`,
        });
    }
    return logs.sort((left, right) => right.occurredAt - left.occurredAt);
}
function createMonthOrderActionLog(title, detail, occurredAt) {
    return {
        id: `${title}-${occurredAt}-${Date.now()}`,
        occurredAt,
        title,
        operator: '系统自动',
        detail,
    };
}
function formatMonthOrderLogDate(timestamp) {
    const date = new Date(timestamp);
    return `${date.getFullYear()}/${String(date.getMonth() + 1).padStart(2, '0')}/${String(date.getDate()).padStart(2, '0')}`;
}
function formatMonthOrderLogTime(timestamp) {
    const date = new Date(timestamp);
    return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}:${String(date.getSeconds()).padStart(2, '0')}`;
}
function parseMonthOrderLogTimestamp(value) {
    if (!value)
        return undefined;
    const trimmed = value.trim();
    const localMatch = trimmed.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})(?:[ T](\d{1,2}):(\d{1,2})(?::(\d{1,2}))?)?/);
    if (localMatch) {
        const [, year, month, day, hour = '0', minute = '0', second = '0'] = localMatch;
        const timestamp = new Date(Number(year), Number(month) - 1, Number(day), Number(hour), Number(minute), Number(second)).getTime();
        return Number.isFinite(timestamp) ? timestamp : undefined;
    }
    const parsed = Date.parse(trimmed);
    return Number.isFinite(parsed) ? parsed : undefined;
}
function resolveOrderActionLiveStatus(status, fallback) {
    if (!status)
        return fallback;
    const normalized = status.toLowerCase();
    if (normalized === 'checked_in' || normalized === 'checked-in' || normalized.includes('入住中'))
        return '入住中';
    if (normalized === 'completed' || normalized === 'checked_out' || normalized === 'checked-out' || normalized.includes('已退房'))
        return '已退房';
    if (normalized === 'cancelled' || normalized === 'canceled' || normalized.includes('已取消'))
        return '已取消';
    if (normalized === 'no_show' || normalized === 'no-show' || normalized === 'noshow' || normalized.includes('未到店') || normalized.includes('失约'))
        return '未到店';
    if (normalized === 'booked' || normalized.includes('待入住'))
        return '待入住';
    return fallback;
}
function formatCurrency(value, fallback) {
    if (!value)
        return fallback;
    return formatCurrencyFromNumber(parseCurrencyNumber(value), fallback);
}
function formatCurrencyFromNumber(value, fallback) {
    if (!Number.isFinite(value) || value <= 0)
        return fallback;
    return `¥${value.toFixed(2)}`;
}
function resolveMonthOrderActionDialogConfig(action) {
    const mapping = {
        invite: {
            title: '邀请登记',
            confirmLabel: '发送邀请',
            actionLabel: '发送入住登记邀请',
            testId: 'month-order-dialog-invite',
        },
        'early-checkin': {
            title: '提前入住',
            confirmLabel: '确认提前入住',
            actionLabel: '提前入住',
            testId: 'month-order-dialog-early-checkin',
        },
        'invite-renew': {
            title: '邀请续住',
            confirmLabel: '发送续住邀请',
            actionLabel: '邀请续住',
            testId: 'month-order-dialog-invite-renew',
        },
        'late-checkout': {
            title: '延迟退房',
            confirmLabel: '确认延退',
            actionLabel: '延迟退房',
            testId: 'month-order-dialog-late-checkout',
        },
        'change-room': {
            title: '换房',
            confirmLabel: '确认换房',
            actionLabel: '换房',
            testId: 'month-order-dialog-change-room',
        },
        'cancel-arrange': {
            title: '取消排房',
            confirmLabel: '确认取消',
            actionLabel: '取消排房',
            testId: 'month-order-dialog-cancel-arrange',
        },
        'skip-stock': {
            title: '不占库存',
            confirmLabel: '确定',
            actionLabel: '设置不占库存',
            testId: 'month-order-dialog-skip-stock',
        },
        'skip-report': {
            title: '不计入统计',
            confirmLabel: '确认设置',
            actionLabel: '设置不计入统计',
            testId: 'month-order-dialog-skip-report',
        },
        continue: {
            title: '设为续住单',
            confirmLabel: '确认续住',
            actionLabel: '设为续住单',
            testId: 'month-order-dialog-continue',
        },
        'cancel-order': {
            title: '取消房单',
            confirmLabel: '确定',
            actionLabel: '取消房单',
            testId: 'month-order-dialog-cancel-order',
        },
        clean: {
            title: '保洁',
            confirmLabel: '创建保洁任务',
            actionLabel: '创建保洁任务',
            testId: 'month-order-dialog-clean',
        },
        print: {
            title: '打印',
            confirmLabel: '进入打印',
            actionLabel: '打印订单',
            testId: 'month-order-dialog-print',
        },
        'credit-checkout': {
            title: '信用住结账',
            confirmLabel: '确认结账',
            actionLabel: '信用住结账',
            testId: 'month-order-dialog-credit-checkout',
        },
        checkin: {
            title: '办理入住',
            confirmLabel: '办理入住',
            actionLabel: '办理入住',
            testId: 'month-order-dialog-checkin',
        },
        renew: {
            title: '续住',
            confirmLabel: '确认续住',
            actionLabel: '续住',
            testId: 'month-order-dialog-renew',
        },
    };
    return mapping[action];
}
