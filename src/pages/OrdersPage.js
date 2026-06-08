import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useCallback, useEffect, useMemo, useState } from 'react';
import { cancelHouseOrder, fetchHouseOrders, resolveHouseOrderCampId, skipStockHouseOrder, } from '../services/houseOrders';
import { fetchLongRentalOrders, resolveLongRentalQueryFromLocation, } from '../services/longRentalOrders';
import { createOrder } from '../services/orderCreate';
import { fetchOrderRoomSelectorOptions, } from '../services/orderRoomSelector';
import { StoreSelectControl } from '../components/StoreSelect';
import './OrdersPage.css';
const quickFilters = [
    '全部',
    '今日新单',
    '今日预抵',
    '今日在住',
    '今日预离',
    '明日入住',
    '明日退房',
    '待接单',
    '待退款',
    '异常订单',
];
const houseBaseColumns = [
    '订单号',
    '渠道',
    '订单状态',
    '联系人',
    '手机号',
    '入住类型',
    '房型',
    '房间',
    '门店',
    '入住时间',
    '离开时间',
    '入住状态',
    '售后状态',
    '房费(减佣)',
    '其他消费',
    '房费(含佣)',
    '订单总收入',
    '订单欠款',
    '预订时间',
    '渠道单号',
];
const longRentalBaseColumns = [
    '订单号',
    '渠道',
    '租客姓名',
    '手机号',
    '房型',
    '房间',
    '门店',
    '入住时间',
    '离开时间',
    '入住状态',
    '房费（含佣）',
    '房费（减佣）',
    '其他消费',
    '押金',
    '订单总收入',
    '合同时间',
    '合同期限',
    '缴费方式',
    '缴费时间',
    '预订时间',
];
const collapsedTrailingColumns = ['操作'];
const expandedTrailingColumns = ['操作', '占库存', '已排房', '计入统计'];
const longRentalAdvancedFilters = [
    ['日期类型', '请选择日期类型'],
    ['订单状态', '请选择订单状态'],
    ['订单渠道', '全部'],
    ['订单房型', '全部'],
    ['入住状态', '全部'],
    ['平台账号', '全部'],
    ['订单门店', '全部'],
    ['订单标签', '全部'],
    ['排房情况', '请选择排房情况'],
    ['库存情况', '请选择占库存情况'],
    ['统计情况', '请选择统计情况'],
    ['房型标签', '全部'],
];
const entryOrderSourceOptions = ['自来客', '携程', '飞猪', '美团', '企业客户'];
const entryCollectionStatusOptions = [
    { value: 'received', label: '已收' },
    { value: 'unreceived', label: '未收' },
    { value: 'onsite', label: '现场收' },
];
const entryPayMethodOptions = [
    { value: 'platform', label: '平台代收' },
    { value: 'wechat', label: '微信' },
    { value: 'alipay', label: '支付宝' },
    { value: 'cash', label: '现金' },
];
const longRentalPaymentCycles = ['月付', '季付', '半年付', '一次性付清'];
const longRentalPaymentMonths = ['本月', '下月'];
const longRentalPaymentDays = Array.from({ length: 31 }, (_, index) => `${index + 1}号`);
const hourlyRoomHours = Array.from({ length: 24 }, (_, index) => String(index).padStart(2, '0'));
const hourlyRoomMinutes = Array.from({ length: 60 }, (_, index) => String(index).padStart(2, '0'));
const orderTagGroups = [
    {
        id: 'default',
        label: '默认标签',
        tags: [
            { id: 'promotion', label: '促销' },
            { id: 'duplicate', label: '重单' },
            { id: 'keep', label: '保留房' },
            { id: 'hourly', label: '钟点房' },
        ],
    },
];
let orderEntrySeed = 0;
function nextOrderEntryId(prefix) {
    orderEntrySeed += 1;
    return `${prefix}-${orderEntrySeed}`;
}
function sanitizeAmount(value) {
    const parsed = Number.parseFloat(value.replace(/[^\d.-]/g, ''));
    return Number.isFinite(parsed) ? parsed : 0;
}
function formatMoney(value) {
    return value.toFixed(2);
}
function formatContractDuration(start, end) {
    if (!start || !end)
        return '--';
    const startDate = new Date(start);
    const endDate = new Date(end);
    const diff = Math.round((endDate.getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000));
    if (!Number.isFinite(diff) || diff < 0)
        return '--';
    return `${Math.max(diff, 1)}日`;
}
function formatDateKey(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}
function formatClockTime(date) {
    const hour = String(date.getHours()).padStart(2, '0');
    const minute = String(date.getMinutes()).padStart(2, '0');
    return `${hour}:${minute}`;
}
function getTodayDateKey() {
    return formatDateKey(new Date());
}
function addDaysToDateKey(dateKey, days) {
    const date = new Date(`${dateKey}T00:00:00`);
    date.setDate(date.getDate() + days);
    return formatDateKey(date);
}
function getMonthKey(dateKey) {
    return dateKey.slice(0, 7);
}
function toDisplayDateRange(start, end) {
    return `${start.replace(/-/g, '.')}-${end.replace(/-/g, '.')}`;
}
function toDisplayHourlyStartDateTime(date = new Date()) {
    return `${formatDateKey(date).replace(/-/g, '.')} ${formatClockTime(date)}`;
}
function formatMonthLabel(value) {
    const [year, month] = value.split('-');
    return `${year}-${month}`;
}
function formatMonthDayRange(start, end) {
    const formatDate = (value) => {
        const [, month, day] = value.split('-');
        return `${month}-${day}`;
    };
    if (!start && !end)
        return '';
    if (!end)
        return formatDate(start);
    return `${formatDate(start)}~${formatDate(end)}`;
}
function getNightCount(start, end) {
    if (!start || !end)
        return 0;
    const startDate = new Date(start);
    const endDate = new Date(end);
    const diff = Math.round((endDate.getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000));
    return Math.max(diff, 0);
}
function shiftMonth(month, delta) {
    const [year, monthNumber] = month.split('-').map(Number);
    const date = new Date(year, monthNumber - 1 + delta, 1);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}
function buildCalendarDays(month) {
    const [year, monthNumber] = month.split('-').map(Number);
    const firstDay = new Date(year, monthNumber - 1, 1);
    const dayOffset = (firstDay.getDay() + 6) % 7;
    const gridStart = new Date(year, monthNumber - 1, 1 - dayOffset);
    return Array.from({ length: 42 }, (_, index) => {
        const date = new Date(gridStart);
        date.setDate(gridStart.getDate() + index);
        return {
            key: formatDateKey(date),
            date,
            day: String(date.getDate()),
            isCurrentMonth: date.getMonth() === monthNumber - 1,
        };
    });
}
function resolveCount(value, fallback = 0) {
    const parsed = Number.parseInt(value, 10);
    return Number.isFinite(parsed) ? parsed : fallback;
}
function calculateStayRoomAmount(room) {
    return sanitizeAmount(room.price);
}
function formatPlainAmount(value) {
    if (!Number.isFinite(value))
        return '0';
    return Number.isInteger(value) ? String(value) : String(Number(value.toFixed(2)));
}
function resolveRoomUnitPrice(price, unitPrice, quantity, fallbackQuantity = 1) {
    const normalizedUnitPrice = sanitizeAmount(unitPrice || '');
    if (normalizedUnitPrice > 0)
        return normalizedUnitPrice;
    const count = Math.max(resolveCount(quantity, fallbackQuantity), 1);
    return sanitizeAmount(price) / count;
}
function calculateRoomTotalPrice(unitPrice, quantity) {
    return formatPlainAmount(unitPrice * Math.max(quantity, 1));
}
function updateStayRoomQuantity(room, nextQuantity, fallbackQuantity = 1) {
    const unitPrice = resolveRoomUnitPrice(room.price, room.unitPrice, room.quantity, fallbackQuantity);
    return {
        ...room,
        quantity: String(Math.max(nextQuantity, 1)),
        unitPrice: formatPlainAmount(unitPrice),
        price: calculateRoomTotalPrice(unitPrice, nextQuantity),
    };
}
function looksLikeHourlyDateRange(value) {
    return /\d{4}\.\d{2}\.\d{2}\s+\d{2}:\d{2}/.test(value.trim());
}
function splitRoomTypeAndName(value) {
    const normalized = value.trim();
    if (!normalized) {
        return { roomType: '', roomName: '101' };
    }
    const parts = normalized.split(/[\s（(]+/).filter(Boolean);
    return {
        roomType: normalized,
        roomName: parts.length > 1 ? parts[parts.length - 1].replace(/[）)]/g, '') : '101',
    };
}
function calculateStayFormSummary(form) {
    const roomRevenueGross = form.rooms.reduce((sum, room) => sum + calculateStayRoomAmount(room), 0);
    const commission = sanitizeAmount(form.commission);
    const deposit = sanitizeAmount(form.deposit);
    const roomRevenueNet = Math.max(roomRevenueGross - commission, 0);
    const received = sanitizeAmount(form.roomChargeReceived) + sanitizeAmount(form.depositChargeReceived);
    const totalRevenue = roomRevenueGross + deposit;
    return {
        roomRevenueGross,
        roomRevenueNet,
        commission,
        deposit,
        received,
        totalRevenue,
        unpaid: Math.max(totalRevenue - received, 0),
    };
}
function calculateLongRentalSummary(form) {
    const monthlyRent = form.rooms.reduce((sum, room) => sum + sanitizeAmount(room.monthlyRent), 0);
    const deposit = form.rooms.reduce((sum, room) => sum + sanitizeAmount(room.deposit), 0);
    const commission = sanitizeAmount(form.commission);
    const extras = form.broadband
        ? sanitizeAmount(form.broadband) +
            sanitizeAmount(form.shared) +
            sanitizeAmount(form.sanitation) +
            sanitizeAmount(form.property) +
            sanitizeAmount(form.park)
        : sanitizeAmount(form.shared) +
            sanitizeAmount(form.sanitation) +
            sanitizeAmount(form.property) +
            sanitizeAmount(form.park);
    return {
        monthlyRent,
        deposit,
        commission,
        extras,
        firstPayment: monthlyRent + deposit + extras,
        recurringPayment: monthlyRent + extras,
    };
}
function validateLongRentalEntryStep(form) {
    const errors = {};
    if (!form.tenantName.trim()) {
        errors.tenantName = '请输入租客姓名';
    }
    const normalizedPhone = form.phone.replace(/\D/g, '');
    if (!normalizedPhone) {
        errors.phone = '请输入手机号';
    }
    else if (normalizedPhone.length < 11) {
        errors.phone = '请输入有效手机号';
    }
    return errors;
}
function createStayForm(type = 'fullDay') {
    return {
        useGuestAsCheckin: false,
        guestName: '',
        guestMobile: '',
        orderSource: '自来客',
        channelOrderNo: '',
        rooms: [type === 'hourly' ? createHourlyStayRoom() : createStayRoom()],
        commission: '0',
        deposit: '0',
        roomChargeStatus: 'received',
        roomChargeReceived: '0',
        roomChargeMethod: 'platform',
        depositChargeStatus: 'received',
        depositChargeReceived: '0',
        depositChargeMethod: 'wechat',
        invoiceIssuer: '',
        invoiceAmount: '0',
        reminders: [],
        tags: [],
        remark: '',
    };
}
function createStayRoom() {
    const today = getTodayDateKey();
    const tomorrow = addDaysToDateKey(today, 1);
    return {
        id: nextOrderEntryId('stay-room'),
        roomType: '',
        roomCategoryId: '',
        roomCategoryName: '',
        roomId: '',
        roomName: '',
        poiId: '',
        poiName: '',
        dateRange: toDisplayDateRange(today, tomorrow),
        price: '0',
        unitPrice: '0',
        quantity: '1',
        guests: '1',
        configured: false,
        registeredGuests: [],
        registrationOpen: false,
    };
}
function createHourlyStayRoom() {
    return {
        ...createStayRoom(),
        dateRange: toDisplayHourlyStartDateTime(),
        quantity: '1',
    };
}
function createStayRoomFromInitialRoom(initialRoom, type = 'fullDay') {
    const start = initialRoom.startDate;
    const end = initialRoom.endDate || addDaysToDateKey(start, 1);
    const initialNights = Math.max(getNightCount(start, end), 1);
    const totalPrice = initialRoom.price || '0';
    const unitPrice = initialRoom.unitPrice || formatPlainAmount(sanitizeAmount(totalPrice) / initialNights);
    return {
        ...(type === 'hourly' ? createHourlyStayRoom() : createStayRoom()),
        roomType: `${initialRoom.roomCategoryName}（${initialRoom.roomName}）`,
        roomCategoryId: initialRoom.roomCategoryId,
        roomCategoryName: initialRoom.roomCategoryName,
        roomId: initialRoom.roomId,
        roomName: initialRoom.roomName,
        poiId: initialRoom.poiId || '',
        poiName: initialRoom.poiName || '',
        dateRange: type === 'hourly' ? toDisplayHourlyStartDateTime() : toDisplayDateRange(start, end),
        price: totalPrice,
        unitPrice,
        quantity: type === 'hourly' ? '1' : String(initialNights),
        configured: true,
    };
}
function createStayFormWithInitialRoom(initialRoom, type = 'fullDay') {
    const form = createStayForm(type);
    if (!initialRoom)
        return form;
    return {
        ...form,
        rooms: [createStayRoomFromInitialRoom(initialRoom, type)],
    };
}
function createStayGuest() {
    return {
        id: nextOrderEntryId('stay-guest'),
        name: '',
        mobile: '',
        credentialType: '居民身份证',
        credentialNo: '',
    };
}
function createLongRentalRoom() {
    const today = getTodayDateKey();
    const tomorrow = addDaysToDateKey(today, 1);
    return {
        id: nextOrderEntryId('long-room'),
        roomLabel: '',
        roomCategoryId: '',
        roomCategoryName: '',
        roomId: '',
        roomName: '',
        poiId: '',
        poiName: '',
        contractStart: today,
        contractEnd: tomorrow,
        monthlyRent: '0',
        deposit: '0',
        guests: '1',
    };
}
function createLongRentalRoomFromInitialRoom(initialRoom) {
    return {
        ...createLongRentalRoom(),
        roomLabel: `${initialRoom.roomCategoryName}（${initialRoom.roomName}）`,
        roomCategoryId: initialRoom.roomCategoryId,
        roomCategoryName: initialRoom.roomCategoryName,
        roomId: initialRoom.roomId,
        roomName: initialRoom.roomName,
        poiId: initialRoom.poiId || '',
        poiName: initialRoom.poiName || '',
        contractStart: initialRoom.startDate,
        contractEnd: initialRoom.endDate || addDaysToDateKey(initialRoom.startDate, 1),
        monthlyRent: initialRoom.monthlyRent || initialRoom.price || '0',
    };
}
function createLongRentalEntryForm(initialRoom) {
    return {
        step: 1,
        tenantName: '',
        phone: '',
        emergencyName: '',
        emergencyPhone: '',
        orderSource: '自来客',
        rooms: [initialRoom ? createLongRentalRoomFromInitialRoom(initialRoom) : createLongRentalRoom()],
        commission: '0',
        paymentCycle: '月付',
        paymentMonth: '本月',
        paymentDay: '1号',
        reminderEnabled: '开启',
        contractDueMode: '月付',
        broadband: '',
        shared: '',
        sanitation: '',
        property: '',
        park: '',
        errors: {},
    };
}
function createRoomSelectorModalState(initialRoom) {
    const now = new Date();
    const today = initialRoom?.startDate || formatDateKey(now);
    const tomorrow = initialRoom?.endDate || addDaysToDateKey(today, 1);
    return {
        open: false,
        mode: 'fullDay',
        visibleMonth: getMonthKey(today),
        selectedStart: today,
        selectedEnd: tomorrow,
        selectedHour: String(now.getHours()).padStart(2, '0'),
        selectedMinute: String(now.getMinutes()).padStart(2, '0'),
        selectingEnd: false,
        keyword: '',
        expandedRoomTypes: [],
        selectedRooms: [],
        roomOptions: [],
        isLoading: false,
        error: '',
    };
}
function createReminderModalState() {
    return {
        open: false,
        date: '',
        content: '',
    };
}
function createTagSelectorModalState() {
    return {
        open: false,
        keyword: '',
        expandedGroups: orderTagGroups.map((item) => item.id),
        selectedTagIds: [],
    };
}
function toCent(value) {
    return Math.round(sanitizeAmount(value) * 100);
}
function parseStayDateRange(value) {
    const [startRaw, endRaw] = value.split('-');
    const start = startRaw?.replace(/\./g, '-').trim() || getTodayDateKey();
    const end = endRaw?.replace(/\./g, '-').trim() || start;
    return { start, end };
}
function parseHourlyDateTimeRange(value, hours) {
    const now = new Date();
    const fallbackDateTime = toDisplayHourlyStartDateTime(now);
    const [dateRaw = formatDateKey(now).replace(/-/g, '.'), timeRaw = formatClockTime(now)] = (value.trim() || fallbackDateTime).split(/\s+/);
    const normalizedDateRaw = dateRaw.trim();
    const startDate = normalizedDateRaw.includes('.') ? parseStayDateRange(normalizedDateRaw).start : normalizedDateRaw;
    const [hour = String(now.getHours()), minute = String(now.getMinutes())] = timeRaw.split(':');
    const start = new Date(`${startDate}T${hour.padStart(2, '0')}:${minute.padStart(2, '0')}:00`);
    const duration = Math.max(resolveCount(hours, 1), 1);
    const end = new Date(start);
    end.setHours(end.getHours() + duration);
    return { start, end, duration };
}
function formatHourlyDateTimeRange(dateRange, hours) {
    const { start, end } = parseHourlyDateTimeRange(dateRange, hours);
    const formatDateTime = (value) => {
        const month = String(value.getMonth() + 1).padStart(2, '0');
        const day = String(value.getDate()).padStart(2, '0');
        return `${month}-${day} ${formatClockTime(value)}`;
    };
    const endText = formatDateKey(start) === formatDateKey(end) ? formatClockTime(end) : formatDateTime(end);
    return `${formatDateTime(start)}-${endText}`;
}
function roomSelectionKey(roomCategoryId, roomId) {
    return `${roomCategoryId}:${roomId}`;
}
function findRoomSelection(groups, key) {
    const [roomCategoryId, roomId] = key.split(':');
    if (!roomCategoryId || !roomId)
        return null;
    const group = groups.find((item) => item.roomCategoryId === roomCategoryId);
    const room = group?.rooms.find((item) => item.roomId === roomId);
    if (!group || !room)
        return null;
    return {
        poiId: group.poiId,
        poiName: group.poiName,
        roomCategoryId: group.roomCategoryId,
        roomCategoryName: group.roomCategoryName,
        roomId: room.roomId,
        roomName: room.roomName,
        price: room.price ?? group.price,
        unitPrice: room.unitPrice ?? group.unitPrice,
        monthlyRent: room.monthlyRent ?? group.monthlyRent ?? room.price ?? group.price,
    };
}
function resolveRoomSelectorRange(state) {
    const start = state.selectedStart || getTodayDateKey();
    const end = state.mode === 'hourly' ? start : state.selectedEnd || start;
    return start <= end ? { start, end } : { start: end, end: start };
}
function resolveRoomSelectorStayType(mode) {
    if (mode === 'hourly')
        return 'hourly_room';
    if (mode === 'longRental')
        return 'long_rental';
    return 'daily_room';
}
function applyHourlyRoomToSelectorState(state, room) {
    const { start } = parseHourlyDateTimeRange(room.dateRange, room.quantity);
    const selectedStart = formatDateKey(start);
    const [selectedHour, selectedMinute] = formatClockTime(start).split(':');
    return {
        ...state,
        open: true,
        mode: 'hourly',
        visibleMonth: getMonthKey(selectedStart),
        selectedStart,
        selectedEnd: selectedStart,
        selectedHour,
        selectedMinute,
        selectingEnd: false,
    };
}
function buildRoomSelectorQuery(state, campId) {
    const { start, end } = resolveRoomSelectorRange(state);
    return {
        campId,
        startDate: start,
        days: state.mode === 'hourly' ? 1 : Math.max(getNightCount(start, end), 1),
        stayType: resolveRoomSelectorStayType(state.mode),
        keyword: state.keyword,
    };
}
function applySelectionToStayRoom(room, selection, dateRange) {
    const isHourly = looksLikeHourlyDateRange(dateRange);
    const { start, end } = parseStayDateRange(dateRange);
    const quantity = isHourly ? Math.max(resolveCount(room.quantity, 1), 1) : Math.max(getNightCount(start, end), 1);
    const selectedPrice = selection.price || room.price || '0';
    const unitPrice = selection.unitPrice || formatPlainAmount(sanitizeAmount(selectedPrice) / quantity);
    const price = quantity > 1 && selection.unitPrice && sanitizeAmount(selectedPrice) === sanitizeAmount(selection.unitPrice)
        ? calculateRoomTotalPrice(sanitizeAmount(selection.unitPrice), quantity)
        : selectedPrice;
    return {
        ...room,
        roomType: `${selection.roomCategoryName}（${selection.roomName}）`,
        roomCategoryId: selection.roomCategoryId,
        roomCategoryName: selection.roomCategoryName,
        roomId: selection.roomId,
        roomName: selection.roomName,
        poiId: selection.poiId,
        poiName: selection.poiName,
        dateRange,
        price,
        unitPrice,
        quantity: String(quantity),
        configured: true,
    };
}
function applySelectionToLongRentalRoom(room, selection, start, end) {
    return {
        ...room,
        roomLabel: `${selection.roomCategoryName}（${selection.roomName}）`,
        roomCategoryId: selection.roomCategoryId,
        roomCategoryName: selection.roomCategoryName,
        roomId: selection.roomId,
        roomName: selection.roomName,
        poiId: selection.poiId,
        poiName: selection.poiName,
        contractStart: start || room.contractStart,
        contractEnd: end || room.contractEnd,
        monthlyRent: selection.monthlyRent || room.monthlyRent || '0',
    };
}
function buildStayOrderPayload(type, form, campId) {
    const room = form.rooms[0] ?? createStayRoom();
    const summary = calculateStayFormSummary(form);
    const { start, end } = parseStayDateRange(room.dateRange);
    const hourlyRange = parseHourlyDateTimeRange(room.dateRange, room.quantity);
    const formatBackendDateTime = (value) => {
        const year = value.getFullYear();
        const month = String(value.getMonth() + 1).padStart(2, '0');
        const day = String(value.getDate()).padStart(2, '0');
        const hour = String(value.getHours()).padStart(2, '0');
        const minute = String(value.getMinutes()).padStart(2, '0');
        return `${year}-${month}-${day} ${hour}:${minute}:00`;
    };
    const roomInfo = splitRoomTypeAndName(room.roomType);
    const roomCategoryName = room.roomCategoryName || roomInfo.roomType || '';
    const roomName = room.roomName || roomInfo.roomName;
    const guests = room.registeredGuests
        .filter((item) => item.name.trim() || item.mobile.trim() || item.credentialNo.trim())
        .map((item) => ({
        guestName: item.name.trim() || form.guestName.trim(),
        guestMobile: item.mobile.trim(),
        guestIdCardType: item.credentialType,
        guestIdCard: item.credentialNo.trim(),
        guestType: 'adult',
    }));
    return {
        campId,
        poiId: room.poiId || undefined,
        roomCategoryId: room.roomCategoryId || undefined,
        roomId: room.roomId || undefined,
        orderType: type === 'hourly' ? 'hourly_room' : 'daily_room',
        stayType: type === 'hourly' ? 'hourly_room' : 'daily_room',
        guestName: form.guestName.trim(),
        guestMobile: form.guestMobile.trim(),
        checkInDate: type === 'hourly' ? formatBackendDateTime(hourlyRange.start) : `${start} 14:00:00`,
        checkOutDate: type === 'hourly' ? formatBackendDateTime(hourlyRange.end) : `${end} 12:00:00`,
        totalPrice: Math.round(summary.roomRevenueGross * 100),
        totalPayPrice: Math.round(summary.received * 100),
        commissionPrice: Math.round(summary.commission * 100),
        paymentStatus: summary.unpaid > 0 ? 'partial' : 'paid',
        poiName: room.poiName || undefined,
        roomCategoryName: roomCategoryName || undefined,
        roomName,
        sourceLabel: form.orderSource,
        channelOrderNo: form.channelOrderNo.trim(),
        depositPrice: toCent(form.deposit),
        otherPrice: 0,
        invoiceIssuer: form.invoiceIssuer.trim(),
        invoiceAmount: toCent(form.invoiceAmount),
        roomChargeStatus: form.roomChargeStatus,
        roomChargeReceived: toCent(form.roomChargeReceived),
        roomChargeMethod: form.roomChargeMethod,
        depositChargeStatus: form.depositChargeStatus,
        depositChargeReceived: toCent(form.depositChargeReceived),
        depositChargeMethod: form.depositChargeMethod,
        rooms: [
            {
                roomCategoryId: room.roomCategoryId || undefined,
                roomId: room.roomId || undefined,
                roomType: roomCategoryName || room.roomType,
                roomName,
                dateRange: room.dateRange,
                checkInDate: type === 'hourly' ? formatBackendDateTime(hourlyRange.start) : `${start} 14:00:00`,
                checkOutDate: type === 'hourly' ? formatBackendDateTime(hourlyRange.end) : `${end} 12:00:00`,
                price: toCent(room.price),
                quantity: resolveCount(room.quantity, 1),
                guests: resolveCount(room.guests, 1),
            },
        ],
        tags: form.tags.map((item) => ({ id: item.id, text: item.text })),
        reminders: form.reminders.map((item) => ({ id: item.id, text: item.text })),
        remark: form.remark.trim(),
        guests,
    };
}
function buildLongRentalOrderPayload(form, campId) {
    const room = form.rooms[0] ?? createLongRentalRoom();
    const summary = calculateLongRentalSummary(form);
    const roomInfo = splitRoomTypeAndName(room.roomLabel);
    const roomCategoryName = room.roomCategoryName || roomInfo.roomType || '';
    const roomName = room.roomName || roomInfo.roomName;
    return {
        campId,
        poiId: room.poiId || undefined,
        roomCategoryId: room.roomCategoryId || undefined,
        roomId: room.roomId || undefined,
        orderType: 'long_rental',
        stayType: 'long_rental',
        guestName: form.tenantName.trim(),
        guestMobile: form.phone.trim(),
        checkInDate: `${room.contractStart} 14:00:00`,
        checkOutDate: `${room.contractEnd} 12:00:00`,
        totalPrice: Math.round(summary.monthlyRent * 100),
        totalPayPrice: Math.round(summary.firstPayment * 100),
        commissionPrice: Math.round(summary.commission * 100),
        paymentStatus: 'paid',
        poiName: room.poiName || undefined,
        roomCategoryName: roomCategoryName || undefined,
        roomName,
        sourceLabel: form.orderSource,
        depositPrice: Math.round(summary.deposit * 100),
        otherPrice: Math.round(summary.extras * 100),
        emergencyName: form.emergencyName.trim(),
        emergencyMobile: form.emergencyPhone.trim(),
        paymentCycle: form.paymentCycle,
        paymentMonth: form.paymentMonth,
        paymentDay: form.paymentDay,
        reminderEnabled: form.reminderEnabled === '开启' ? 1 : 0,
        contractDueMode: form.contractDueMode,
        contractNo: `HT-LR-${Date.now()}`,
        nextPaymentDate: room.contractEnd,
        nextPaymentAmount: Math.round(summary.recurringPayment * 100),
        extraFee: Math.round(summary.extras * 100),
        rooms: [
            {
                roomCategoryId: room.roomCategoryId || undefined,
                roomId: room.roomId || undefined,
                roomType: roomCategoryName || room.roomLabel,
                roomName,
                contractStart: room.contractStart,
                contractEnd: room.contractEnd,
                monthlyRent: Math.round(sanitizeAmount(room.monthlyRent) * 100),
                deposit: Math.round(sanitizeAmount(room.deposit) * 100),
                guests: resolveCount(room.guests, 1),
            },
        ],
        extraFeeItems: [
            { text: `宽带费:${form.broadband || '0'}` },
            { text: `公摊费:${form.shared || '0'}` },
            { text: `卫生费:${form.sanitation || '0'}` },
            { text: `物业费:${form.property || '0'}` },
            { text: `停车费:${form.park || '0'}` },
        ],
        billingSnapshot: JSON.stringify({
            paymentCycle: form.paymentCycle,
            paymentMonth: form.paymentMonth,
            paymentDay: form.paymentDay,
            roomContract: {
                start: room.contractStart,
                end: room.contractEnd,
            },
        }),
    };
}
function statusTone(status) {
    if (status === '进行中' || status === '入住中')
        return 'is-running';
    if (status === '已完成' || status === '已退房')
        return 'is-done';
    if (status === '已预订' || status === '待入住')
        return 'is-booked';
    return 'is-canceled';
}
function formatDateRange(order) {
    const start = order.checkInAt.slice(0, 10).replace(/-/g, '.');
    const end = order.leaveAt.slice(0, 10).replace(/-/g, '.');
    return `${start}-${end} 1晚`;
}
function formatLongContractTime(order) {
    return `${order.contractStart} 至 ${order.contractEnd}`;
}
function resolveOrderFlagState(kind, value, fallbackState = false) {
    const normalized = value?.trim().toLowerCase() ?? '';
    if (['1', 'true', 'yes', '是', '√', '✓', '占库存', '已排房', '计入统计'].includes(normalized)) {
        return true;
    }
    if (['0', 'false', 'no', '否', '×', '✕', '未排房', '不占库存', '不计入统计'].includes(normalized)) {
        return false;
    }
    if (kind === 'room' && normalized === '-') {
        return false;
    }
    return fallbackState;
}
function renderOrderFlagIndicator(kind, value, fallbackState = false) {
    const enabled = resolveOrderFlagState(kind, value, fallbackState);
    return (_jsx("span", { className: `order-flag-indicator ${enabled ? 'is-positive' : 'is-negative'}`, "aria-label": enabled ? '是' : '否', children: enabled ? '√' : '×' }));
}
function resolveVisibleColumns(baseColumns, expanded) {
    return [...baseColumns, ...(expanded ? expandedTrailingColumns : collapsedTrailingColumns)];
}
function resolveFixedColumnClassName(column) {
    if (column === '操作')
        return 'order-action-head order-action-head--edge';
    if (column === '占库存')
        return 'order-fixed-flag-head order-fixed-flag-head--stock';
    if (column === '已排房')
        return 'order-fixed-flag-head order-fixed-flag-head--room';
    if (column === '计入统计')
        return 'order-fixed-flag-head order-fixed-flag-head--plan';
    return undefined;
}
function OrderColumnToggle({ expanded, onToggle, }) {
    return (_jsxs("button", { type: "button", className: `order-column-toggle ${expanded ? 'is-expanded' : ''}`, "aria-label": expanded ? '隐藏操作列' : '显示操作列', "data-testid": "order-column-toggle", onClick: onToggle, children: [_jsx("span", { className: "order-column-toggle__icon", "aria-hidden": "true", children: expanded ? '‹' : '›' }), _jsx("span", { children: expanded ? '收起' : '展开' })] }));
}
function renderOrderColumnHeader(column, expanded, onToggle) {
    if (column === '操作') {
        return (_jsxs("div", { role: "columnheader", className: resolveFixedColumnClassName(column), children: [_jsx("span", { children: "\u64CD\u4F5C" }), _jsx(OrderColumnToggle, { expanded: expanded, onToggle: onToggle })] }, column));
    }
    return (_jsx("div", { role: "columnheader", className: resolveFixedColumnClassName(column), children: column }, column));
}
function OrderDetail({ order, onClose, onBlockedAction, onOrderCancelled, onOrderSkippedStock, }) {
    const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
    const [skipStockDialogOpen, setSkipStockDialogOpen] = useState(false);
    const [isCancelling, setIsCancelling] = useState(false);
    const [isSkippingStock, setIsSkippingStock] = useState(false);
    const [localOrderStatus, setLocalOrderStatus] = useState(order.status);
    const [localLiveStatus, setLocalLiveStatus] = useState(order.liveStatus);
    const [localRoom, setLocalRoom] = useState(order.room);
    const [localNeedsRoomAssignment, setLocalNeedsRoomAssignment] = useState(order.needsRoomAssignment);
    const [localStockFlag, setLocalStockFlag] = useState(order.stockFlag);
    const [localRoomFlag, setLocalRoomFlag] = useState(order.roomFlag);
    const [operationMessage, setOperationMessage] = useState('');
    const collected = order.collected ?? order.totalRevenue;
    const commission = order.commission ?? '0';
    const isCancelled = localOrderStatus === '已取消' || localLiveStatus === '已取消';
    const roomDisplayText = `${order.roomType}（${localRoom === '-' ? '未排房' : localRoom}）`;
    const handleCancelOrder = async () => {
        const campId = resolveHouseOrderCampId();
        if (!campId) {
            setOperationMessage('缺少当前门店，无法取消订单');
            return;
        }
        setIsCancelling(true);
        setOperationMessage('');
        try {
            const response = await cancelHouseOrder({
                campId,
                orderId: order.orderNo,
                reason: '订单详情取消房单',
            });
            const message = response.message || '订单取消成功';
            setLocalOrderStatus('已取消');
            setLocalLiveStatus('已取消');
            setCancelDialogOpen(false);
            setOperationMessage(message);
            onOrderCancelled(order.orderNo, message);
        }
        catch (error) {
            setOperationMessage(`取消房单失败：${error instanceof Error ? error.message : String(error)}`);
        }
        finally {
            setIsCancelling(false);
        }
    };
    const handleSkipStockOrder = async () => {
        const campId = resolveHouseOrderCampId();
        if (!campId) {
            setOperationMessage('缺少当前门店，无法设置不占库存');
            return;
        }
        setIsSkippingStock(true);
        setOperationMessage('');
        try {
            const response = await skipStockHouseOrder({
                campId,
                orderId: order.orderNo,
                reason: '订单详情不占库存',
            });
            const message = response.message || '订单已释放库存并取消排房';
            setLocalRoom('-');
            setLocalNeedsRoomAssignment(true);
            setLocalStockFlag('');
            setLocalRoomFlag('未排房');
            setSkipStockDialogOpen(false);
            setOperationMessage(message);
            onOrderSkippedStock(order.orderNo, message);
        }
        catch (error) {
            setOperationMessage(`不占库存失败：${error instanceof Error ? error.message : String(error)}`);
        }
        finally {
            setIsSkippingStock(false);
        }
    };
    return (_jsx("div", { className: "order-detail-backdrop", role: "presentation", onClick: onClose, children: _jsxs("section", { className: "order-detail-drawer", role: "dialog", "aria-modal": "true", "aria-label": "\u8BA2\u5355\u8BE6\u60C5", onClick: (event) => event.stopPropagation(), children: [_jsxs("header", { className: "order-detail-drawer__header", children: [_jsxs("div", { children: [_jsx("h2", { children: "\u8BA2\u5355\u8BE6\u60C5" }), _jsx("span", { children: order.stayType })] }), _jsx("button", { type: "button", "aria-label": "\u5173\u95ED\u8BA2\u5355\u8BE6\u60C5", onClick: onClose, children: "\u00D7" })] }), _jsxs("nav", { className: "order-detail-tabs", "aria-label": "\u8BA2\u5355\u8BE6\u60C5\u6807\u7B7E", children: [_jsx("button", { type: "button", className: "is-active", children: "\u8BA2\u5355\u4FE1\u606F" }), _jsx("button", { type: "button", children: "\u6E20\u9053\u4FE1\u606F" }), _jsx("button", { type: "button", children: "\u64CD\u4F5C\u65E5\u5FD7" })] }), _jsxs("div", { className: "order-detail-body", children: [_jsxs("section", { className: "order-guest-card", children: [_jsxs("div", { children: [_jsx("strong", { children: order.contact }), _jsx("span", { children: "\u76F4" }), _jsx("em", { children: order.channel })] }), _jsxs("p", { children: ["\u624B\u673A\u53F7\uFF1A", order.phone === '-' ? '无' : order.phone] }), _jsxs("p", { children: ["\u6E20\u9053\u5355\u53F7\uFF1A", order.channelOrderNo] })] }), _jsxs("section", { className: "order-room-card", children: [_jsxs("div", { className: "order-room-card__title", children: [_jsx("strong", { children: roomDisplayText }), _jsx("span", { className: `order-status ${statusTone(localLiveStatus)}`, children: localLiveStatus })] }), _jsxs("div", { className: "order-room-card__status-row", children: [_jsx("span", { children: "\u8BA2\u5355\u72B6\u6001" }), _jsx("strong", { className: `order-status ${statusTone(localOrderStatus)}`, children: localOrderStatus })] }), _jsx("p", { children: formatDateRange(order) }), _jsxs("strong", { className: "order-room-card__total", children: ["\u00A5 ", order.totalRevenue] })] }), operationMessage ? (_jsx("div", { className: `order-detail-operation-message ${operationMessage.includes('失败') ? 'is-error' : ''}`, role: "status", children: operationMessage })) : null, _jsxs("section", { className: "order-detail-section", children: [_jsx("h3", { children: "\u5165\u4F4F\u4EBA\uFF080/1\uFF09" }), _jsx("button", { type: "button", className: "order-link-button", onClick: () => onBlockedAction('登记入住人'), children: "\u767B\u8BB0\u5165\u4F4F\u4EBA" })] }), _jsxs("section", { className: "order-rate-card", children: [_jsx("header", { children: _jsxs("strong", { children: [order.roomType, "<\u65E0\u65E9>"] }) }), _jsxs("div", { className: "order-rate-grid", children: [_jsx("span", { children: "\u623F\u8D39(\u51CF\u4F63):" }), _jsxs("strong", { children: ["\u00A5", order.roomRevenueNet] }), _jsx("span", { children: "\u8BA2\u5355\u603B\u6536\u5165:" }), _jsxs("strong", { children: ["\u00A5", Number(order.totalRevenue).toFixed(2)] }), _jsx("span", { children: "\u4F63\u91D1:" }), _jsxs("strong", { children: ["\u00A5", commission] }), _jsx("span", { children: "\u623F\u8D39(\u542B\u4F63):" }), _jsxs("strong", { children: ["\u00A5", Number(order.roomRevenueGross).toFixed(2)] }), _jsx("span", { children: "\u5176\u4ED6\u6D88\u8D39:" }), _jsxs("strong", { children: ["\u00A5", Number(order.otherExpense).toFixed(2)] })] }), _jsxs("div", { className: "order-room-date-table", role: "table", "aria-label": "\u623F\u8D39\u65E5\u5386", children: [_jsxs("div", { role: "row", className: "order-room-date-table__head", children: [_jsx("div", { role: "columnheader", children: "\u623F\u95F4/\u65E5\u671F" }), _jsx("div", { role: "columnheader", children: order.checkInAt.slice(0, 10) })] }), _jsxs("div", { role: "row", children: [_jsxs("div", { role: "cell", children: [order.roomType, "(", localRoom === '-' ? '未排房' : localRoom, ")"] }), _jsx("div", { role: "cell", children: order.roomRevenueNet })] })] })] }), _jsxs("section", { className: "order-pay-card", children: [_jsx("h3", { children: "\u623F\u8D39\u6536\u6B3E" }), _jsxs("p", { children: ["\u6536\u6B3E\u91D1\u989D: \uFFE5", collected] }), _jsxs("p", { children: ["\u623F\u8D39\u6B20\u6B3E: \uFFE5", order.debt] })] }), _jsxs("section", { className: "order-detail-columns", children: [_jsxs("div", { children: [_jsx("h3", { children: "\u5F00\u7968\u4FE1\u606F" }), _jsx("p", { children: "\u5176\u4ED6\u6536\u5165/\u652F\u51FA 0\u9879/ \u00A50.00" })] }), _jsxs("div", { children: [_jsx("h3", { children: "\u62BC\u91D1\u4FE1\u606F" }), _jsx("p", { children: "\u62BC\u91D1\u91D1\u989D: \u00A5 0" })] }), _jsxs("div", { children: [_jsx("h3", { children: "\u8BA2\u5355\u6B20\u6B3E" }), _jsxs("p", { children: ["\u00A5", order.debt] })] })] }), _jsxs("section", { className: "order-detail-section", children: [_jsx("h3", { children: "\u8BA2\u5355\u5907\u6CE8" }), _jsxs("p", { children: ["\u8054\u7CFB\u5BA2\u4EBA\u8BF7\u62E8\u6253:02160454587(\u9A8C\u8BC1\u7801:05383);\u5982\u5BA2\u4EBA\u9700\u8981\u53D1\u7968\uFF0C\u8BF7\u8D35\u9152\u5E97\u5F00\u5177\uFF0C \u5F00\u7968\u91D1\u989D\uFF1ACNY", collected, " \u5BA2\u4EBA\u7535\u8BDD:\u8054\u7CFB\u5BA2\u4EBA\u8BF7\u62E8\u6253:02160454587; \u8BA2\u5355\u786E\u8BA4\u53F7: ", order.confirmNo ?? order.channelOrderNo] })] }), _jsxs("section", { className: "order-detail-meta", children: [_jsx("span", { children: "\u8BA2\u5355\u6807\u7B7E" }), _jsx("span", { children: "\u8BA2\u5355\u63D0\u9192" }), _jsx("span", { children: "\u8BA2\u5355\u9644\u4EF6" }), _jsx("span", { children: "\u521B\u5EFA\u4EBA \u65E0" }), _jsxs("span", { children: ["\u8BA2\u5355\u53F7 ", order.orderNo] }), _jsxs("span", { children: ["\u9884\u8BA2\u65F6\u95F4 ", order.bookedAt.replace(/-/g, '.')] }), _jsxs("span", { children: ["\u5360\u5E93\u5B58 ", localStockFlag ? '占库存' : '不占库存'] }), _jsxs("span", { children: ["\u5DF2\u6392\u623F ", localRoomFlag || (localNeedsRoomAssignment ? '未排房' : '已排房')] })] }), _jsx("section", { className: "order-detail-actions", "aria-label": "\u8BA2\u5355\u64CD\u4F5C", children: ['邀请登记', '邀请续住', '入住人', '延迟退房', '换房', '取消排房', '不占库存', '不计入统计', '设为续住单', '取消房单', '保洁', '打印'].map((action) => (_jsx("button", { type: "button", disabled: action === '取消房单' && (isCancelled || isCancelling), onClick: () => {
                                    if (action === '取消房单') {
                                        setCancelDialogOpen(true);
                                        return;
                                    }
                                    if (action === '不占库存') {
                                        setSkipStockDialogOpen(true);
                                        return;
                                    }
                                    onBlockedAction(action);
                                }, children: action }, action))) })] }), _jsxs("footer", { className: "order-detail-footer", children: [_jsxs("div", { children: [_jsx("span", { children: "\u623F\u8D39(\u51CF\u4F63)\uFF1A" }), _jsxs("strong", { children: ["\u00A5", order.roomRevenueNet] })] }), _jsxs("div", { children: [_jsx("span", { children: "\u8BA2\u5355\u603B\u6536\u5165\uFF1A" }), _jsxs("strong", { children: ["\u00A5", Number(order.totalRevenue).toFixed(2)] })] }), _jsx("button", { type: "button", onClick: () => onBlockedAction('更多操作'), children: "\u66F4\u591A\u64CD\u4F5C" }), _jsx("button", { type: "button", onClick: () => onBlockedAction('收款'), children: "\u6536 \u6B3E" }), _jsx("button", { type: "button", onClick: () => onBlockedAction('续住'), children: "\u7EED \u4F4F" }), _jsx("button", { type: "button", onClick: () => onBlockedAction('入住'), children: "\u5165\u4F4F" }), _jsx("button", { type: "button", onClick: () => onBlockedAction('退房'), children: "\u9000\u623F" })] }), cancelDialogOpen ? (_jsx("div", { className: "order-confirm-backdrop", role: "presentation", onClick: () => setCancelDialogOpen(false), children: _jsxs("section", { className: "order-confirm-dialog", role: "dialog", "aria-modal": "true", "aria-label": "\u53D6\u6D88\u623F\u5355", onClick: (event) => event.stopPropagation(), children: [_jsxs("header", { children: [_jsx("strong", { children: "\u53D6\u6D88\u623F\u5355" }), _jsx("button", { type: "button", "aria-label": "\u5173\u95ED\u53D6\u6D88\u623F\u5355", onClick: () => setCancelDialogOpen(false), children: "\u00D7" })] }), _jsxs("div", { className: "order-cancel-confirm", children: [_jsx("span", { className: "order-cancel-confirm__icon", "aria-hidden": "true", children: "!" }), _jsxs("div", { children: [_jsx("strong", { children: "\u786E\u5B9A\u53D6\u6D88\u6B64\u623F\u5355\u5417\uFF1F" }), _jsx("p", { children: "\u53D6\u6D88\u540E\u5C06\u91CA\u653E\u623F\u6001\uFF0C\u4E0D\u53EF\u6062\u590D\uFF0C\u8BF7\u8C28\u614E\u64CD\u4F5C" }), _jsxs("dl", { children: [_jsxs("div", { children: [_jsx("dt", { children: "\u623F\u95F4\u4FE1\u606F" }), _jsx("dd", { children: roomDisplayText })] }), _jsxs("div", { children: [_jsx("dt", { children: "\u8BA2\u5355\u7F16\u53F7" }), _jsx("dd", { children: order.orderNo })] }), _jsxs("div", { children: [_jsx("dt", { children: "\u5F53\u524D\u72B6\u6001" }), _jsx("dd", { children: localLiveStatus })] })] })] })] }), _jsxs("footer", { children: [_jsx("button", { type: "button", onClick: () => setCancelDialogOpen(false), disabled: isCancelling, children: "\u53D6\u6D88" }), _jsx("button", { type: "button", className: "is-primary", onClick: () => void handleCancelOrder(), disabled: isCancelling, children: isCancelling ? '取消中' : '确定' })] })] }) })) : null, skipStockDialogOpen ? (_jsx("div", { className: "order-confirm-backdrop", role: "presentation", onClick: () => setSkipStockDialogOpen(false), children: _jsxs("section", { className: "order-confirm-dialog", role: "dialog", "aria-modal": "true", "aria-label": "\u4E0D\u5360\u5E93\u5B58", onClick: (event) => event.stopPropagation(), children: [_jsxs("header", { children: [_jsx("strong", { children: "\u4E0D\u5360\u5E93\u5B58" }), _jsx("button", { type: "button", "aria-label": "\u5173\u95ED\u4E0D\u5360\u5E93\u5B58", onClick: () => setSkipStockDialogOpen(false), children: "\u00D7" })] }), _jsxs("div", { className: "order-cancel-confirm order-skip-stock-confirm", children: [_jsx("span", { className: "order-cancel-confirm__icon", "aria-hidden": "true", children: "!" }), _jsxs("div", { children: [_jsx("strong", { children: "\u8BA2\u5355\u5C06\u91CA\u653E\u5E93\u5B58\u4F1A\u540C\u65F6\u53D6\u6D88\u6392\u623F\uFF0C\u662F\u5426\u786E\u5B9A\u6B64\u64CD\u4F5C\uFF1F" }), _jsx("p", { children: "\u786E\u8BA4\u540E\u8BE5\u8BA2\u5355\u4E0D\u518D\u5360\u7528\u5F53\u524D\u623F\u95F4\u5E93\u5B58\uFF0C\u5F53\u524D\u6392\u623F\u4E5F\u4F1A\u540C\u6B65\u53D6\u6D88\u3002" }), _jsxs("button", { type: "button", className: "order-skip-stock-confirm__tag", onClick: () => onBlockedAction('添加标签'), children: [_jsx("span", { children: "\u6DFB\u52A0\u6807\u7B7E\uFF1A" }), _jsx("strong", { children: "+ \u6DFB\u52A0\u6807\u7B7E" })] }), _jsxs("dl", { children: [_jsxs("div", { children: [_jsx("dt", { children: "\u623F\u95F4\u4FE1\u606F" }), _jsx("dd", { children: roomDisplayText })] }), _jsxs("div", { children: [_jsx("dt", { children: "\u8BA2\u5355\u7F16\u53F7" }), _jsx("dd", { children: order.orderNo })] }), _jsxs("div", { children: [_jsx("dt", { children: "\u5F53\u524D\u72B6\u6001" }), _jsx("dd", { children: localLiveStatus })] })] })] })] }), _jsxs("footer", { children: [_jsx("button", { type: "button", onClick: () => setSkipStockDialogOpen(false), disabled: isSkippingStock, children: "\u53D6\u6D88" }), _jsx("button", { type: "button", className: "is-primary", onClick: () => void handleSkipStockOrder(), disabled: isSkippingStock, children: isSkippingStock ? '处理中' : '确定' })] })] }) })) : null] }) }));
}
function LongRentalOrderDetail({ order, onClose, onAction, }) {
    const [activeTab, setActiveTab] = useState('order');
    return (_jsx("div", { className: "order-detail-backdrop", role: "presentation", onClick: onClose, children: _jsxs("section", { className: "order-detail-drawer long-rental-detail", role: "dialog", "aria-modal": "true", "aria-label": "\u957F\u79DF\u8BA2\u5355\u8BE6\u60C5", onClick: (event) => event.stopPropagation(), children: [_jsxs("header", { className: "order-detail-drawer__header", children: [_jsxs("div", { children: [_jsx("h2", { children: "\u957F\u79DF\u8BA2\u5355\u8BE6\u60C5" }), _jsxs("span", { children: [order.contractTerm, " / ", order.paymentMethod] })] }), _jsx("button", { type: "button", "aria-label": "\u5173\u95ED\u957F\u79DF\u8BA2\u5355\u8BE6\u60C5", onClick: onClose, children: "\u00D7" })] }), _jsxs("nav", { className: "order-detail-tabs", "aria-label": "\u957F\u79DF\u8BA2\u5355\u8BE6\u60C5\u6807\u7B7E", children: [_jsx("button", { type: "button", className: activeTab === 'order' ? 'is-active' : '', onClick: () => setActiveTab('order'), children: "\u8BA2\u5355\u4FE1\u606F" }), _jsx("button", { type: "button", className: activeTab === 'contract' ? 'is-active' : '', onClick: () => setActiveTab('contract'), children: "\u5408\u540C\u4FE1\u606F" }), _jsx("button", { type: "button", className: activeTab === 'payment' ? 'is-active' : '', onClick: () => setActiveTab('payment'), children: "\u7F34\u8D39\u8BB0\u5F55" })] }), _jsxs("div", { className: "order-detail-body", children: [activeTab === 'order' ? (_jsxs(_Fragment, { children: [_jsxs("section", { className: "order-guest-card", children: [_jsxs("div", { children: [_jsx("strong", { children: order.tenantName }), _jsx("span", { children: "\u957F" }), _jsx("em", { children: order.channel })] }), _jsxs("p", { children: ["\u624B\u673A\u53F7\uFF1A", order.phone] }), _jsxs("p", { children: ["\u8BA2\u5355\u53F7\uFF1A", order.orderNo] })] }), _jsxs("section", { className: "order-room-card", children: [_jsxs("div", { className: "order-room-card__title", children: [_jsxs("strong", { children: [order.roomType, "\uFF08", order.room === '-' ? '未排房' : order.room, "\uFF09"] }), _jsx("span", { className: `order-status ${statusTone(order.liveStatus)}`, children: order.liveStatus })] }), _jsx("p", { children: formatLongContractTime(order) }), _jsxs("strong", { className: "order-room-card__total", children: ["\u62BC\u91D1\uFF1A", order.deposit] })] }), _jsxs("section", { className: "order-rate-card", children: [_jsx("header", { children: _jsx("strong", { children: "\u5408\u540C\u4E0E\u8D39\u7528" }) }), _jsxs("div", { className: "order-rate-grid", children: [_jsx("span", { children: "\u623F\u8D39\uFF08\u542B\u4F63\uFF09\uFF1A" }), _jsx("strong", { children: order.roomRevenueGross }), _jsx("span", { children: "\u623F\u8D39\uFF08\u51CF\u4F63\uFF09\uFF1A" }), _jsx("strong", { children: order.roomRevenueNet }), _jsx("span", { children: "\u5176\u4ED6\u6D88\u8D39\uFF1A" }), _jsx("strong", { children: order.otherExpense }), _jsx("span", { children: "\u62BC\u91D1\uFF1A" }), _jsx("strong", { children: order.deposit }), _jsx("span", { children: "\u8BA2\u5355\u603B\u6536\u5165\uFF1A" }), _jsx("strong", { children: order.totalRevenue }), _jsx("span", { children: "\u7F34\u8D39\u65B9\u5F0F\uFF1A" }), _jsx("strong", { children: order.paymentMethod }), _jsx("span", { children: "\u7F34\u8D39\u65F6\u95F4\uFF1A" }), _jsx("strong", { children: order.paymentDate }), _jsx("span", { children: "\u5408\u540C\u671F\u9650\uFF1A" }), _jsx("strong", { children: order.contractTerm })] })] })] })) : null, activeTab === 'contract' ? (_jsxs(_Fragment, { children: [_jsxs("section", { className: "order-detail-section", children: [_jsx("h3", { children: "\u5408\u540C\u5468\u671F" }), _jsx("p", { children: formatLongContractTime(order) }), _jsxs("p", { children: ["\u5408\u540C\u7F16\u53F7\uFF1A", order.contractNo] })] }), _jsxs("section", { className: "order-rate-card", children: [_jsx("header", { children: _jsx("strong", { children: "\u79DF\u4F4F\u7EA6\u5B9A" }) }), _jsxs("div", { className: "order-rate-grid", children: [_jsx("span", { children: "\u5408\u540C\u671F\u9650\uFF1A" }), _jsx("strong", { children: order.contractTerm }), _jsx("span", { children: "\u7F34\u8D39\u65B9\u5F0F\uFF1A" }), _jsx("strong", { children: order.paymentMethod }), _jsx("span", { children: "\u5360\u5E93\u5B58\uFF1A" }), _jsx("strong", { children: order.stockFlag || '1' }), _jsx("span", { children: "\u8BA1\u5165\u7EDF\u8BA1\uFF1A" }), _jsx("strong", { children: order.planFlag || '-' })] })] })] })) : null, activeTab === 'payment' ? (_jsxs(_Fragment, { children: [_jsxs("section", { className: "order-detail-section", children: [_jsx("h3", { children: "\u7F34\u8D39\u8BA1\u5212" }), _jsxs("p", { children: ["\u4E0B\u6B21\u7F34\u8D39\u65E5\u671F\uFF1A", order.nextPaymentDate] }), _jsxs("p", { children: ["\u4E0B\u6B21\u5E94\u6536\u91D1\u989D\uFF1A", order.nextPaymentAmount] })] }), _jsxs("section", { className: "order-pay-card", children: [_jsx("h3", { children: "\u62BC\u91D1\u4E0E\u6536\u6B3E" }), _jsxs("p", { children: ["\u62BC\u91D1\uFF1A", order.deposit] }), _jsxs("p", { children: ["\u8BA2\u5355\u603B\u6536\u5165\uFF1A", order.totalRevenue] })] })] })) : null, _jsxs("section", { className: "order-detail-meta", children: [_jsxs("span", { children: ["\u79DF\u5BA2\u59D3\u540D ", order.tenantName] }), _jsxs("span", { children: ["\u9884\u8BA2\u65F6\u95F4 ", order.bookedAt] }), _jsxs("span", { children: ["\u5165\u4F4F\u72B6\u6001 ", order.liveStatus] }), _jsxs("span", { children: ["\u5360\u5E93\u5B58 ", order.stockFlag || '1'] }), _jsxs("span", { children: ["\u5DF2\u6392\u623F ", order.roomFlag || '-'] }), _jsxs("span", { children: ["\u8BA1\u5165\u7EDF\u8BA1 ", order.planFlag || '-'] })] })] }), _jsxs("footer", { className: "order-detail-footer", children: [_jsxs("div", { children: [_jsx("span", { children: "\u62BC\u91D1\uFF1A" }), _jsx("strong", { children: order.deposit })] }), _jsxs("div", { children: [_jsx("span", { children: "\u8BA2\u5355\u603B\u6536\u5165\uFF1A" }), _jsx("strong", { children: order.totalRevenue })] }), _jsx("button", { type: "button", onClick: () => onAction('更多操作'), children: "\u66F4\u591A\u64CD\u4F5C" }), _jsx("button", { type: "button", onClick: () => onAction('收款流程'), children: "\u6536 \u6B3E" }), _jsx("button", { type: "button", onClick: () => onAction('续租流程'), children: "\u7EED \u79DF" }), _jsx("button", { type: "button", onClick: () => onAction('退租流程'), children: "\u9000 \u79DF" })] })] }) }));
}
function LongRentalOrdersPage() {
    const [activeFilter, setActiveFilter] = useState('全部');
    const [filtersExpanded, setFiltersExpanded] = useState(false);
    const [columnsExpanded, setColumnsExpanded] = useState(false);
    const [keyword, setKeyword] = useState('');
    const [appliedKeyword, setAppliedKeyword] = useState('');
    const [dateType, setDateType] = useState('');
    const [orderStatus, setOrderStatus] = useState('');
    const [channel, setChannel] = useState('');
    const [roomType, setRoomType] = useState('');
    const [liveStatus, setLiveStatus] = useState('');
    const [store, setStore] = useState('');
    const [openSelect, setOpenSelect] = useState(null);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [createDialogOpen, setCreateDialogOpen] = useState(false);
    const [data, setData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [requestError, setRequestError] = useState('');
    const [operationFeedback, setOperationFeedback] = useState('长租订单已就绪');
    const [requestRevision, setRequestRevision] = useState(0);
    const locationQuery = useMemo(() => resolveLongRentalQueryFromLocation(window.location), []);
    const orderType = orderTypeByFilter[activeFilter] ?? '';
    const query = useMemo(() => ({
        provider: locationQuery.provider,
        mockState: locationQuery.mockState,
        campId: locationQuery.campId,
        pageNum: 1,
        pageSize: 20,
        orderType,
        keyword: appliedKeyword,
        dateType,
        orderStatus,
        channel,
        roomType,
        liveStatus,
        store,
    }), [
        appliedKeyword,
        channel,
        dateType,
        liveStatus,
        locationQuery.mockState,
        locationQuery.provider,
        locationQuery.campId,
        orderStatus,
        orderType,
        roomType,
        store,
    ]);
    useEffect(() => {
        const controller = new AbortController();
        async function loadOrders() {
            setIsLoading(true);
            setRequestError('');
            try {
                const nextData = await fetchLongRentalOrders(query, controller.signal);
                if (controller.signal.aborted)
                    return;
                setData(nextData);
            }
            catch (error) {
                if (error instanceof DOMException && error.name === 'AbortError')
                    return;
                setData(null);
                setRequestError(error instanceof Error ? error.message : String(error));
            }
            finally {
                if (!controller.signal.aborted)
                    setIsLoading(false);
            }
        }
        loadOrders();
        return () => controller.abort();
    }, [query, requestRevision]);
    const orders = data?.rows ?? [];
    const options = data?.options;
    const handleQuery = useCallback(() => {
        setAppliedKeyword(keyword.trim());
        setOperationFeedback('已按当前条件查询长租订单');
        setRequestRevision((value) => value + 1);
    }, [keyword]);
    const handleReset = useCallback(() => {
        setKeyword('');
        setAppliedKeyword('');
        setActiveFilter('全部');
        setFiltersExpanded(false);
        setColumnsExpanded(false);
        setDateType('');
        setOrderStatus('');
        setChannel('');
        setRoomType('');
        setLiveStatus('');
        setStore('');
        setOpenSelect(null);
        setOperationFeedback('筛选条件已重置');
        setRequestRevision((value) => value + 1);
    }, []);
    const handleAction = useCallback((label) => {
        setOperationFeedback(`${label}已记录`);
    }, []);
    const handleSelect = useCallback((label, value, setter) => {
        setter(value);
        setOpenSelect(null);
        setOperationFeedback(`${label}已更新`);
        setRequestRevision((revision) => revision + 1);
    }, []);
    const requestSummary = `orderType=${orderType || 'all'} keyword=${appliedKeyword || 'all'} dateType=${dateType || 'all'}`;
    const visibleColumns = useMemo(() => resolveVisibleColumns(longRentalBaseColumns, columnsExpanded), [columnsExpanded]);
    const tableClassName = `order-table order-table--long-rental ${columnsExpanded ? 'is-columns-expanded' : 'is-columns-collapsed'}`;
    return (_jsxs("div", { className: "page-stack order-page order-page--long-rental", children: [_jsx("h1", { children: "\u957F\u79DF\u8BA2\u5355" }), _jsxs("section", { className: "order-source-panel", "aria-label": "\u957F\u79DF\u8BA2\u5355\u6570\u636E\u6765\u6E90", children: [_jsx("span", { children: "\u957F\u79DF\u8BA2\u5355\u670D\u52A1 \u00B7 \u4E1A\u52A1\u6570\u636E" }), _jsx("span", { role: "status", "aria-label": "\u957F\u79DF\u8BA2\u5355\u52A0\u8F7D\u72B6\u6001", children: isLoading ? '正在加载长租订单' : `已加载 ${orders.length} 条` })] }), requestError ? (_jsxs("section", { className: "order-request-error", role: "alert", "aria-label": "\u957F\u79DF\u8BA2\u5355\u6570\u636E\u9519\u8BEF", children: [_jsx("span", { children: requestError }), _jsx("button", { type: "button", onClick: () => setRequestRevision((value) => value + 1), children: "\u91CD\u8BD5" })] })) : null, _jsxs("section", { className: "order-filter-panel", "aria-label": "\u957F\u79DF\u8BA2\u5355\u7B5B\u9009", children: [_jsx("div", { className: "order-filter-tabs", role: "radiogroup", "aria-label": "\u8BA2\u5355\u5FEB\u6377\u7B5B\u9009", children: quickFilters.map((filter) => (_jsx("button", { type: "button", role: "radio", "aria-checked": activeFilter === filter, className: activeFilter === filter ? 'is-active' : '', disabled: isLoading, onClick: () => {
                                setActiveFilter(filter);
                                setOperationFeedback(`${filter}筛选已切换`);
                            }, children: filter }, filter))) }), _jsxs("div", { className: "order-filter-row", children: [_jsx("input", { type: "text", value: keyword, onChange: (event) => setKeyword(event.target.value), placeholder: "\u8F93\u5165\u8BA2\u5355\u53F7/\u59D3\u540D/\u624B\u673A\u53F7" }), _jsxs("div", { className: "order-filter-actions", children: [_jsx("button", { type: "button", className: "order-primary-action", onClick: handleQuery, disabled: isLoading, children: "\u67E5\u8BE2" }), _jsx("button", { type: "button", className: "order-link-action", "data-testid": "order-filter-toggle", onClick: () => setFiltersExpanded((value) => !value), children: filtersExpanded ? '收起' : '展开' }), _jsx("button", { type: "button", className: "order-outline-action", onClick: handleReset, disabled: isLoading, children: "\u91CD\u7F6E\u7B5B\u9009" }), _jsx("button", { type: "button", className: "order-outline-action", onClick: () => {
                                            setOperationFeedback('长租订单已刷新');
                                            setRequestRevision((value) => value + 1);
                                        }, disabled: isLoading, children: "\u5237\u65B0" }), _jsx("button", { type: "button", className: "order-primary-action", onClick: () => setOperationFeedback('导出任务已创建，请在下载中心查看'), children: "\u5BFC\u51FA\u660E\u7EC6" }), _jsx("button", { type: "button", className: "order-primary-action", onClick: () => setCreateDialogOpen(true), children: "\u5F55\u5165\u8BA2\u5355" })] })] }), filtersExpanded ? (_jsxs("div", { className: "order-advanced-filters order-advanced-filters--long-rental", children: [_jsx(LongRentalSelect, { label: "\u65E5\u671F\u7C7B\u578B", placeholder: "\u8BF7\u9009\u62E9\u65E5\u671F\u7C7B\u578B", value: dateType, options: options?.dateTypes ?? [], openSelect: openSelect, setOpenSelect: setOpenSelect, onSelect: (value) => handleSelect('日期类型', value, setDateType) }), _jsx(LongRentalSelect, { label: "\u8BA2\u5355\u72B6\u6001", placeholder: "\u8BF7\u9009\u62E9\u8BA2\u5355\u72B6\u6001", value: orderStatus, options: options?.orderStatuses ?? [], openSelect: openSelect, setOpenSelect: setOpenSelect, onSelect: (value) => handleSelect('订单状态', value, setOrderStatus) }), _jsx(LongRentalSelect, { label: "\u8BA2\u5355\u6E20\u9053", placeholder: "\u5168\u90E8", value: channel, options: options?.channels ?? [], openSelect: openSelect, setOpenSelect: setOpenSelect, onSelect: (value) => handleSelect('订单渠道', value, setChannel) }), _jsx(LongRentalSelect, { label: "\u8BA2\u5355\u623F\u578B", placeholder: "\u5168\u90E8", value: roomType, options: options?.roomTypes ?? [], openSelect: openSelect, setOpenSelect: setOpenSelect, onSelect: (value) => handleSelect('订单房型', value, setRoomType) }), _jsx(LongRentalSelect, { label: "\u5165\u4F4F\u72B6\u6001", placeholder: "\u5168\u90E8", value: liveStatus, options: options?.liveStatuses ?? [], openSelect: openSelect, setOpenSelect: setOpenSelect, onSelect: (value) => handleSelect('入住状态', value, setLiveStatus) }), _jsxs("label", { className: "order-select-field order-select-field--store", children: [_jsx("span", { children: "\u8BA2\u5355\u95E8\u5E97" }), _jsx(StoreSelectControl, { label: "\u8BA2\u5355\u95E8\u5E97", className: "order-store-select", options: options?.stores ?? [], value: store || 'all', disabled: isLoading, onChange: (storeId) => {
                                            setOpenSelect(null);
                                            handleSelect('订单门店', storeId === 'all' ? '' : storeId, setStore);
                                        } })] }), _jsx(LongRentalSelect, { label: "\u8BA2\u5355\u6807\u7B7E", placeholder: "\u5168\u90E8", value: "", options: options?.tags ?? [], openSelect: openSelect, setOpenSelect: setOpenSelect, onSelect: () => handleAction('订单标签筛选') }), _jsx(LongRentalSelect, { label: "\u6392\u623F\u60C5\u51B5", placeholder: "\u8BF7\u9009\u62E9\u6392\u623F\u60C5\u51B5", value: "", options: options?.roomFlags ?? [], openSelect: openSelect, setOpenSelect: setOpenSelect, onSelect: () => handleAction('排房情况筛选') }), _jsx(LongRentalSelect, { label: "\u5E93\u5B58\u60C5\u51B5", placeholder: "\u8BF7\u9009\u62E9\u5360\u5E93\u5B58\u60C5\u51B5", value: "", options: options?.stockFlags ?? [], openSelect: openSelect, setOpenSelect: setOpenSelect, onSelect: () => handleAction('库存情况筛选') }), _jsx(LongRentalSelect, { label: "\u7EDF\u8BA1\u60C5\u51B5", placeholder: "\u8BF7\u9009\u62E9\u7EDF\u8BA1\u60C5\u51B5", value: "", options: options?.statisticsFlags ?? [], openSelect: openSelect, setOpenSelect: setOpenSelect, onSelect: () => handleAction('统计情况筛选') }), longRentalAdvancedFilters.slice(5, 6).map(([label, value]) => (_jsx(LongRentalSelect, { label: label, placeholder: value, value: "", options: [{ label: value, value: '' }], openSelect: openSelect, setOpenSelect: setOpenSelect, onSelect: () => handleAction(`${label}筛选`) }, label))), _jsx(LongRentalSelect, { label: "\u623F\u578B\u6807\u7B7E", placeholder: "\u5168\u90E8", value: "", options: options?.tags ?? [], openSelect: openSelect, setOpenSelect: setOpenSelect, onSelect: () => handleAction('房型标签筛选') })] })) : null] }), _jsx("div", { className: "order-operation-feedback", role: "status", "aria-label": "\u957F\u79DF\u8BA2\u5355\u64CD\u4F5C\u53CD\u9988", children: operationFeedback }), _jsxs("section", { className: "order-table-card", children: [_jsx("div", { className: "order-table-scroll", children: _jsxs("div", { className: tableClassName, role: "table", "aria-label": "\u957F\u79DF\u8BA2\u5355\u5217\u8868", children: [_jsx("div", { className: "order-table__head", role: "row", children: visibleColumns.map((column) => renderOrderColumnHeader(column, columnsExpanded, () => setColumnsExpanded((value) => !value))) }), isLoading ? (_jsx("div", { className: "order-table__empty", role: "row", children: _jsx("div", { role: "cell", children: "\u6B63\u5728\u52A0\u8F7D\u957F\u79DF\u8BA2\u5355..." }) })) : null, !isLoading && !requestError ? orders.map((order) => (_jsxs("div", { className: "order-table__row", role: "row", children: [_jsx("div", { role: "cell", className: "order-no", children: order.orderNo }), _jsx("div", { role: "cell", children: order.channel }), _jsx("div", { role: "cell", children: order.tenantName }), _jsx("div", { role: "cell", children: order.phone }), _jsx("div", { role: "cell", className: "order-room-type", children: order.roomType }), _jsx("div", { role: "cell", children: order.room }), _jsx("div", { role: "cell", children: order.store }), _jsx("div", { role: "cell", children: order.checkInAt }), _jsx("div", { role: "cell", children: order.leaveAt }), _jsx("div", { role: "cell", children: _jsx("span", { className: `order-status ${statusTone(order.liveStatus)}`, children: order.liveStatus }) }), _jsx("div", { role: "cell", children: order.roomRevenueGross }), _jsx("div", { role: "cell", children: order.roomRevenueNet }), _jsx("div", { role: "cell", children: order.otherExpense }), _jsx("div", { role: "cell", children: order.deposit }), _jsx("div", { role: "cell", children: order.totalRevenue }), _jsxs("div", { role: "cell", className: "order-contract-time", children: [_jsxs("span", { children: [order.contractStart, " \u81F3"] }), _jsx("span", { children: order.contractEnd })] }), _jsx("div", { role: "cell", children: order.contractTerm }), _jsx("div", { role: "cell", children: order.paymentMethod }), _jsx("div", { role: "cell", children: order.paymentDate }), _jsx("div", { role: "cell", children: order.bookedAt }), _jsx("div", { role: "cell", className: "order-action-cell order-action-cell--edge", children: _jsx("button", { type: "button", onClick: () => setSelectedOrder(order), children: "\u8BE6\u60C5" }) }), columnsExpanded ? (_jsxs(_Fragment, { children: [_jsx("div", { role: "cell", className: "order-fixed-flag-cell order-fixed-flag-cell--stock", children: renderOrderFlagIndicator('stock', order.stockFlag) }), _jsx("div", { role: "cell", className: "order-fixed-flag-cell order-fixed-flag-cell--room", children: renderOrderFlagIndicator('room', order.roomFlag, order.room !== '-') }), _jsx("div", { role: "cell", className: "order-fixed-flag-cell order-fixed-flag-cell--plan", children: renderOrderFlagIndicator('plan', order.planFlag) })] })) : null] }, order.orderNo))) : null, !isLoading && !requestError && orders.length === 0 ? (_jsx("div", { className: "order-table__empty", role: "row", children: _jsx("div", { role: "cell", children: "\u6682\u65E0\u957F\u79DF\u8BA2\u5355" }) })) : null] }) }), _jsxs("footer", { className: "order-pagination", "aria-label": "\u957F\u79DF\u8BA2\u5355\u5206\u9875\u548C\u8BF7\u6C42\u53C2\u6570", children: [_jsxs("span", { children: ["\u5171 ", data?.total ?? 0, " \u6761"] }), _jsx("button", { type: "button", "aria-label": "\u4E0A\u4E00\u9875", disabled: true, children: '<' }), _jsx("button", { type: "button", className: "is-active", children: data?.pageNum ?? 1 }), _jsx("button", { type: "button", "aria-label": "\u4E0B\u4E00\u9875", disabled: !data || data.pageNum >= data.pages, onClick: () => handleAction('下一页'), children: '>' }), _jsx("span", { children: "20 \u6761/\u9875" }), _jsx("span", { className: "sr-only-heading", children: requestSummary })] })] }), selectedOrder ? (_jsx(LongRentalOrderDetail, { order: selectedOrder, onClose: () => setSelectedOrder(null), onAction: (label) => handleAction(label) })) : null, createDialogOpen ? (_jsxs("section", { className: "order-create-modal", role: "dialog", "aria-modal": "true", "aria-label": "\u5F55\u5165\u957F\u79DF\u8BA2\u5355", children: [_jsxs("header", { children: [_jsx("strong", { children: "\u5F55\u5165\u957F\u79DF\u8BA2\u5355" }), _jsx("button", { type: "button", "aria-label": "\u5173\u95ED\u5F55\u5165\u957F\u79DF\u8BA2\u5355", onClick: () => setCreateDialogOpen(false), children: "\u00D7" })] }), _jsxs("label", { children: [_jsx("span", { children: "\u79DF\u5BA2\u59D3\u540D" }), _jsx("input", { defaultValue: "\u65B0\u79DF\u5BA2" })] }), _jsxs("label", { children: [_jsx("span", { children: "\u5408\u540C\u65F6\u95F4" }), _jsx("input", { defaultValue: "2026-05-18 \u81F3 2026-06-18" })] }), _jsxs("footer", { children: [_jsx("button", { type: "button", onClick: () => setCreateDialogOpen(false), children: "\u53D6\u6D88" }), _jsx("button", { type: "button", className: "order-primary-action", onClick: () => {
                                    setCreateDialogOpen(false);
                                    setOperationFeedback('长租订单已保存');
                                }, children: "\u4FDD\u5B58\u8BA2\u5355" })] })] })) : null] }));
}
function LongRentalSelect({ label, placeholder, value, options, openSelect, setOpenSelect, onSelect, }) {
    const selectedLabel = options.find((option) => option.value === value)?.label ?? placeholder;
    const isOpen = openSelect === label;
    return (_jsxs("label", { className: "order-select-field", children: [_jsx("span", { children: label }), _jsx("button", { type: "button", "aria-label": label, className: "order-select-like", "aria-expanded": isOpen, onClick: () => setOpenSelect(isOpen ? null : label), children: selectedLabel }), isOpen ? (_jsx("div", { className: "order-select-menu", role: "listbox", "aria-label": `${label}选项`, children: options.map((option) => (_jsx("button", { type: "button", role: "option", onClick: () => onSelect(option.value), children: option.label }, `${label}-${option.value}-${option.label}`))) })) : null] }));
}
function OrderEntrySection({ title, extra, children, compact = false, boxed = false, }) {
    return (_jsxs("section", { className: `order-entry-section ${compact ? 'order-entry-section--compact' : ''} ${boxed ? 'order-entry-section--boxed' : ''}`, children: [_jsxs("header", { className: "order-entry-section__header", children: [_jsx("h3", { children: title }), extra ? _jsx("div", { className: "order-entry-section__extra", children: extra }) : null] }), _jsx("div", { className: "order-entry-section__body", children: children })] }));
}
function InlineChipEditor({ items, emptyText, onChange, }) {
    const [draft, setDraft] = useState('');
    const handleAdd = useCallback(() => {
        const value = draft.trim();
        if (!value)
            return;
        onChange([
            ...items,
            {
                id: nextOrderEntryId('entry-chip'),
                text: value,
            },
        ]);
        setDraft('');
    }, [draft, items, onChange]);
    return (_jsxs("div", { className: "order-entry-chip-editor", children: [_jsxs("div", { className: "order-entry-chip-list", children: [items.length === 0 ? _jsx("span", { className: "order-entry-chip-list__empty", children: emptyText }) : null, items.map((item) => (_jsxs("button", { type: "button", className: "order-entry-chip", onClick: () => onChange(items.filter((current) => current.id !== item.id)), children: [item.text, _jsx("span", { "aria-hidden": "true", children: "\u00D7" })] }, item.id)))] }), _jsxs("div", { className: "order-entry-chip-editor__input", children: [_jsx("input", { type: "text", value: draft, placeholder: "\u8F93\u5165\u540E\u6DFB\u52A0", onChange: (event) => setDraft(event.target.value), onKeyDown: (event) => {
                            if (event.key === 'Enter') {
                                event.preventDefault();
                                handleAdd();
                            }
                        } }), _jsx("button", { type: "button", onClick: handleAdd, children: "\u6DFB\u52A0" })] })] }));
}
function StayRoomCard({ kind, room, roomIndex, onChange, onRemove, }) {
    const amount = calculateStayRoomAmount(room);
    return (_jsxs("article", { className: "order-entry-room-card", children: [_jsxs("div", { className: "order-entry-room-card__header", children: [_jsx("strong", { children: kind === 'hourly' ? `钟点房 ${roomIndex + 1}` : `房间 ${roomIndex + 1}` }), _jsxs("div", { children: [_jsxs("span", { children: ["\u5C0F\u8BA1 \u00A5", formatMoney(amount)] }), _jsx("button", { type: "button", className: "order-entry-link", onClick: onRemove, children: "\u5220\u9664" })] })] }), _jsxs("div", { className: "order-entry-grid order-entry-grid--room", children: [_jsxs("label", { children: [_jsx("span", { children: "\u623F\u578B" }), _jsx("input", { type: "text", value: room.roomType, placeholder: "\u8BF7\u9009\u62E9\u623F\u578B", onChange: (event) => onChange({ ...room, roomType: event.target.value }) })] }), _jsxs("label", { children: [_jsx("span", { children: kind === 'hourly' ? '入住时段' : '入住时间' }), _jsx("input", { type: "text", value: room.dateRange, placeholder: kind === 'hourly' ? '例如 06-01 12:00 至 18:00' : '例如 06-01 至 06-02', onChange: (event) => onChange({ ...room, dateRange: event.target.value }) })] }), _jsxs("label", { children: [_jsx("span", { children: kind === 'hourly' ? '钟点价' : '单价' }), _jsx("input", { type: "text", value: room.price, placeholder: "0", onChange: (event) => onChange({ ...room, price: event.target.value }) })] }), _jsxs("label", { children: [_jsx("span", { children: "\u6570\u91CF" }), _jsx("input", { type: "number", min: "1", value: room.quantity, onChange: (event) => onChange({ ...room, quantity: event.target.value }) })] }), _jsxs("label", { children: [_jsx("span", { children: "\u5165\u4F4F\u4EBA\u6570" }), _jsx("input", { type: "number", min: "1", value: room.guests, onChange: (event) => onChange({ ...room, guests: event.target.value }) })] })] })] }));
}
function CollectionSection({ title, status, received, payMethod, onStatusChange, onReceivedChange, onMethodChange, }) {
    return (_jsxs("div", { className: "order-entry-collection-card", children: [_jsx("h4", { children: title }), _jsxs("div", { className: "order-entry-grid order-entry-grid--collection", children: [_jsxs("label", { children: [_jsx("span", { children: "\u6536\u6B3E\u72B6\u6001" }), _jsx("select", { value: status, onChange: (event) => onStatusChange(event.target.value), children: entryCollectionStatusOptions.map((option) => (_jsx("option", { value: option.value, children: option.label }, option.value))) })] }), _jsxs("label", { children: [_jsx("span", { children: "\u5DF2\u6536\u91D1\u989D" }), _jsx("input", { type: "text", value: received, onChange: (event) => onReceivedChange(event.target.value) })] }), _jsxs("label", { children: [_jsx("span", { children: "\u6536\u6B3E\u65B9\u5F0F" }), _jsx("select", { value: payMethod, onChange: (event) => onMethodChange(event.target.value), children: entryPayMethodOptions.map((option) => (_jsx("option", { value: option.value, children: option.label }, option.value))) })] })] })] }));
}
function StayOrderForm({ type, form, setForm, onOpenRoomSelector, onOpenReminder, onOpenTags, onSubmit, isSubmitting, }) {
    const summary = calculateStayFormSummary(form);
    const room = form.rooms[0] ?? createStayRoom();
    const roomAmount = calculateStayRoomAmount(room);
    const parsedRoomInfo = splitRoomTypeAndName(room.roomType);
    const roomInfo = {
        roomType: room.roomCategoryName || parsedRoomInfo.roomType,
        roomName: room.roomName || parsedRoomInfo.roomName,
    };
    const { start, end } = parseStayDateRange(room.dateRange);
    const nightCount = Math.max(getNightCount(start, end), 1);
    const hourlyDuration = Math.max(resolveCount(room.quantity, 5), 1);
    const hourlyDateTimeRange = formatHourlyDateTimeRange(room.dateRange, String(hourlyDuration));
    const updatePrimaryRoom = (updater) => {
        setForm((current) => ({
            ...current,
            rooms: current.rooms.map((item, index) => (index === 0 ? updater(item) : item)),
        }));
    };
    return (_jsxs(_Fragment, { children: [_jsxs("div", { className: "order-entry-scroll order-entry-scroll--plain", children: [_jsx(OrderEntrySection, { title: "\u57FA\u672C\u4FE1\u606F", compact: true, extra: _jsxs("label", { className: "order-entry-switch order-entry-switch--right", children: [_jsx("input", { type: "checkbox", checked: form.useGuestAsCheckin, onChange: (event) => setForm((current) => ({ ...current, useGuestAsCheckin: event.target.checked })) }), _jsx("span", { children: "\u9ED8\u8BA4\u4E3A\u5165\u4F4F\u4EBA\u4FE1\u606F" })] }), children: _jsxs("div", { className: "order-entry-basic-grid", children: [_jsxs("label", { className: "order-entry-inline-field is-required", children: [_jsx("span", { children: "\u59D3\u540D\uFF1A" }), _jsx("input", { type: "text", value: form.guestName, placeholder: "\u59D3\u540D", onChange: (event) => setForm((current) => ({ ...current, guestName: event.target.value })) })] }), _jsxs("label", { className: "order-entry-inline-field", children: [_jsx("span", { children: "\u624B\u673A\u53F7\uFF1A" }), _jsx("input", { type: "text", value: form.guestMobile, placeholder: "\u624B\u673A\u53F7", onChange: (event) => setForm((current) => ({ ...current, guestMobile: event.target.value })) })] }), _jsxs("label", { className: "order-entry-inline-field", children: [_jsx("span", { children: "\u8BA2\u5355\u6765\u6E90\uFF1A" }), _jsx("select", { value: form.orderSource, onChange: (event) => setForm((current) => ({ ...current, orderSource: event.target.value })), children: entryOrderSourceOptions.map((option) => (_jsx("option", { value: option, children: option }, option))) })] }), _jsxs("label", { className: "order-entry-inline-field", children: [_jsx("span", { children: "\u6E20\u9053\u5355\u53F7\uFF1A" }), _jsx("input", { type: "text", value: form.channelOrderNo, placeholder: "\u6E20\u9053\u5355\u53F7", onChange: (event) => setForm((current) => ({ ...current, channelOrderNo: event.target.value })) })] })] }) }), _jsxs(OrderEntrySection, { title: _jsxs("span", { children: ["\u623F\u95F4/\u8D39\u7528\u4FE1\u606F", _jsxs("em", { className: "order-entry-section-tip", children: ["\u623F\u8D39\u603B\u8BA1:\u00A5", summary.roomRevenueGross.toFixed(0), " | \u5171", form.rooms.length, "\u95F4\u623F"] })] }), compact: true, extra: _jsx("button", { type: "button", className: "order-entry-link order-entry-link--add", onClick: onOpenRoomSelector, children: "+ \u6DFB\u52A0\u623F\u95F4" }), children: [room.configured ? (_jsxs("div", { className: "order-entry-stay-room-shell", children: [_jsxs("div", { className: "order-entry-stay-room-bar", children: [_jsxs("button", { type: "button", className: "order-entry-stay-room-trigger", onClick: onOpenRoomSelector, children: [_jsx("strong", { children: roomInfo.roomType ? `${roomInfo.roomType}（${roomInfo.roomName || '未排房'}）` : '请选择房型（房间）' }), _jsx("span", { children: type === 'hourly' ? hourlyDateTimeRange : room.dateRange })] }), _jsxs("div", { className: "order-entry-stay-room-bar__tail", children: [_jsxs("label", { className: "order-entry-stay-room-price", children: [_jsx("span", { children: "\uFFE5" }), _jsx("input", { type: "text", value: room.price, onChange: (event) => updatePrimaryRoom((current) => {
                                                                    const nextPrice = event.target.value;
                                                                    const quantity = type === 'hourly' ? hourlyDuration : nightCount;
                                                                    return {
                                                                        ...current,
                                                                        price: nextPrice,
                                                                        unitPrice: formatPlainAmount(sanitizeAmount(nextPrice) / Math.max(quantity, 1)),
                                                                        quantity: current.quantity || '1',
                                                                    };
                                                                }) })] }), type === 'hourly' ? (_jsxs("div", { className: "order-entry-hourly-duration", children: [_jsx("button", { type: "button", onClick: () => updatePrimaryRoom((current) => updateStayRoomQuantity(current, Math.max(resolveCount(current.quantity, 5) - 1, 1), 5)), children: "\u2212" }), _jsx("input", { type: "number", min: "1", value: String(hourlyDuration), onChange: (event) => updatePrimaryRoom((current) => updateStayRoomQuantity(current, Math.max(resolveCount(event.target.value, 1), 1), 1)) }), _jsx("button", { type: "button", onClick: () => updatePrimaryRoom((current) => updateStayRoomQuantity(current, Math.max(resolveCount(current.quantity, 5), 1) + 1, 5)), children: "+" })] })) : (_jsxs(_Fragment, { children: [_jsxs("label", { className: "order-entry-stay-room-stepper", children: [_jsx("input", { type: "number", min: "1", value: String(nightCount), onChange: (event) => {
                                                                            const nextNightCount = Math.max(resolveCount(event.target.value, 1), 1);
                                                                            const { start } = parseStayDateRange(room.dateRange);
                                                                            const startDate = new Date(start);
                                                                            startDate.setDate(startDate.getDate() + nextNightCount);
                                                                            const end = startDate.toISOString().slice(0, 10).replace(/-/g, '.');
                                                                            updatePrimaryRoom((current) => ({
                                                                                ...updateStayRoomQuantity(current, nextNightCount),
                                                                                dateRange: `${start.replace(/-/g, '.')} - ${end}`.replace(' - ', '-'),
                                                                            }));
                                                                        } }), _jsx("span", { children: "\u665A" })] }), _jsxs("label", { className: "order-entry-stay-room-stepper", children: [_jsx("input", { type: "number", min: "1", value: room.guests || '1', onChange: (event) => updatePrimaryRoom((current) => ({
                                                                            ...current,
                                                                            guests: String(Math.max(resolveCount(event.target.value, 1), 1)),
                                                                        })) }), _jsx("span", { children: "\u4EBA" })] })] })), _jsx("button", { type: "button", className: "order-entry-link order-entry-link--register", onClick: () => updatePrimaryRoom((current) => ({
                                                            ...current,
                                                            registrationOpen: !current.registrationOpen,
                                                            registeredGuests: current.registeredGuests.length > 0 ? current.registeredGuests : [createStayGuest()],
                                                        })), children: "\u767B\u8BB0" })] })] }), room.registrationOpen ? (_jsxs("div", { className: "order-entry-stay-guest-list", children: [room.registeredGuests.map((guest) => (_jsxs("div", { className: "order-entry-stay-guest-row", children: [_jsx("input", { type: "text", value: guest.name, placeholder: "\u5BA2\u6237\u59D3\u540D", onChange: (event) => updatePrimaryRoom((current) => ({
                                                            ...current,
                                                            registeredGuests: current.registeredGuests.map((item) => item.id === guest.id ? { ...item, name: event.target.value } : item),
                                                        })) }), _jsx("input", { type: "text", value: guest.mobile, placeholder: "\u624B\u673A\u53F7", onChange: (event) => updatePrimaryRoom((current) => ({
                                                            ...current,
                                                            registeredGuests: current.registeredGuests.map((item) => item.id === guest.id ? { ...item, mobile: event.target.value } : item),
                                                        })) }), _jsxs("select", { value: guest.credentialType, onChange: (event) => updatePrimaryRoom((current) => ({
                                                            ...current,
                                                            registeredGuests: current.registeredGuests.map((item) => item.id === guest.id ? { ...item, credentialType: event.target.value } : item),
                                                        })), children: [_jsx("option", { value: "\u5C45\u6C11\u8EAB\u4EFD\u8BC1", children: "\u5C45\u6C11\u8EAB\u4EFD\u8BC1" }), _jsx("option", { value: "\u6E2F\u6FB3\u901A\u884C\u8BC1", children: "\u6E2F\u6FB3\u901A\u884C\u8BC1" }), _jsx("option", { value: "\u6E2F\u6FB3\u56DE\u4E61\u8BC1", children: "\u6E2F\u6FB3\u56DE\u4E61\u8BC1" }), _jsx("option", { value: "\u53F0\u80DE\u8BC1", children: "\u53F0\u80DE\u8BC1" }), _jsx("option", { value: "Passport", children: "Passport" })] }), _jsx("input", { type: "text", value: guest.credentialNo, placeholder: "\u8BF7\u8F93\u5165\u8BC1\u4EF6\u53F7\u7801", onChange: (event) => updatePrimaryRoom((current) => ({
                                                            ...current,
                                                            registeredGuests: current.registeredGuests.map((item) => item.id === guest.id ? { ...item, credentialNo: event.target.value } : item),
                                                        })) }), _jsx("button", { type: "button", className: "order-entry-link order-entry-link--tiny", children: "\u8BFB\u5361" }), _jsx("button", { type: "button", className: "order-entry-link order-entry-link--tiny", onClick: () => updatePrimaryRoom((current) => ({
                                                            ...current,
                                                            registeredGuests: current.registeredGuests.filter((item) => item.id !== guest.id),
                                                        })), children: "\u53D6\u6D88" })] }, guest.id))), _jsx("button", { type: "button", className: "order-entry-link order-entry-link--guest-add", onClick: () => updatePrimaryRoom((current) => ({
                                                    ...current,
                                                    registeredGuests: [...current.registeredGuests, createStayGuest()],
                                                })), children: "\u6DFB\u52A0\u5165\u4F4F\u4EBA" })] })) : null] })) : null, _jsxs("div", { className: "order-entry-fee-row", children: [_jsxs("label", { className: "order-entry-inline-money", children: [_jsx("span", { children: "\u4F63\u91D1\uFF1A" }), _jsxs("div", { className: "order-entry-money-box", children: [_jsx("span", { children: "\uFFE5" }), _jsx("input", { type: "text", value: form.commission, onChange: (event) => setForm((current) => ({ ...current, commission: event.target.value })) })] })] }), _jsxs("label", { className: "order-entry-inline-money", children: [_jsx("span", { children: "\u62BC\u91D1\uFF1A" }), _jsxs("div", { className: "order-entry-money-box", children: [_jsx("span", { children: "\uFFE5" }), _jsx("input", { type: "text", value: form.deposit, onChange: (event) => setForm((current) => ({ ...current, deposit: event.target.value })) })] })] })] })] }), _jsx(OrderEntrySection, { title: "\u6536\u6B3E\u4FE1\u606F", compact: true, children: _jsxs("div", { className: "order-entry-payment-grid", children: [_jsxs("div", { className: "order-entry-payment-row", children: [_jsx("div", { className: "order-entry-payment-label", children: "\u623F\u8D39\u6536\u6B3E:" }), _jsx("div", { className: "order-entry-segment", children: entryCollectionStatusOptions.map((option) => (_jsx("button", { type: "button", className: form.roomChargeStatus === option.value ? 'is-active' : '', onClick: () => setForm((current) => ({ ...current, roomChargeStatus: option.value })), children: option.label }, option.value))) }), _jsxs("label", { className: "order-entry-inline-money order-entry-inline-money--tight", children: [_jsx("span", { children: "\u5DF2\u6536\u623F\u8D39\uFF1A" }), _jsxs("div", { className: "order-entry-money-box", children: [_jsx("span", { children: "\uFFE5" }), _jsx("input", { type: "text", value: form.roomChargeReceived, onChange: (event) => setForm((current) => ({ ...current, roomChargeReceived: event.target.value })) })] })] }), _jsxs("label", { className: "order-entry-inline-field order-entry-inline-field--compact", children: [_jsx("span", { children: "\u6536\u6B3E\u65B9\u5F0F\uFF1A" }), _jsx("select", { value: form.roomChargeMethod, onChange: (event) => setForm((current) => ({ ...current, roomChargeMethod: event.target.value })), children: entryPayMethodOptions.map((option) => (_jsx("option", { value: option.value, children: option.label }, option.value))) })] })] }), _jsxs("div", { className: "order-entry-payment-row", children: [_jsx("div", { className: "order-entry-payment-label", children: "\u62BC\u91D1\u6536\u6B3E:" }), _jsx("div", { className: "order-entry-segment is-disabled", children: entryCollectionStatusOptions.map((option) => (_jsx("button", { type: "button", className: form.depositChargeStatus === option.value ? 'is-active' : '', disabled: true, children: option.label }, option.value))) }), _jsxs("label", { className: "order-entry-inline-money order-entry-inline-money--tight", children: [_jsx("span", { children: "\u5DF2\u6536\u62BC\u91D1\uFF1A" }), _jsxs("div", { className: "order-entry-money-box is-disabled", children: [_jsx("span", { children: "\uFFE5" }), _jsx("input", { type: "text", value: form.depositChargeReceived, disabled: true, onChange: () => undefined })] })] }), _jsxs("label", { className: "order-entry-inline-field order-entry-inline-field--compact", children: [_jsx("span", { children: "\u6536\u6B3E\u65B9\u5F0F\uFF1A" }), _jsx("select", { value: form.depositChargeMethod, disabled: true, onChange: () => undefined, children: entryPayMethodOptions.map((option) => (_jsx("option", { value: option.value, children: option.label }, option.value))) })] })] })] }) }), _jsx(OrderEntrySection, { title: "\u5F00\u7968\u4FE1\u606F", compact: true, children: _jsxs("div", { className: "order-entry-invoice-row", children: [_jsxs("label", { className: "order-entry-inline-field order-entry-inline-field--narrow", children: [_jsx("span", { children: "\u5F00\u7968\u65B9\uFF1A" }), _jsx("input", { type: "text", value: form.invoiceIssuer, placeholder: "\u8BF7\u8F93\u5165", onChange: (event) => setForm((current) => ({ ...current, invoiceIssuer: event.target.value })) })] }), _jsxs("label", { className: "order-entry-inline-money", children: [_jsx("span", { children: "\u5F00\u7968\u91D1\u989D\uFF1A" }), _jsxs("div", { className: "order-entry-money-box", children: [_jsx("span", { children: "\uFFE5" }), _jsx("input", { type: "text", value: form.invoiceAmount, onChange: (event) => setForm((current) => ({ ...current, invoiceAmount: event.target.value })) })] })] })] }) }), _jsx(OrderEntrySection, { title: "\u8BA2\u5355\u63D0\u9192", compact: true, boxed: true, extra: _jsx("button", { type: "button", className: "order-entry-link order-entry-link--icon", onClick: onOpenReminder, children: "\uFF0B" }), children: form.reminders.length > 0 ? (_jsx("div", { className: "order-entry-token-list", children: form.reminders.map((item) => (_jsx("span", { className: "order-entry-token", children: item.text }, item.id))) })) : (_jsx("div", { className: "order-entry-collapsed-line" })) }), _jsx(OrderEntrySection, { title: "\u8BA2\u5355\u6807\u7B7E", compact: true, boxed: true, extra: _jsx("button", { type: "button", className: "order-entry-link order-entry-link--icon", onClick: onOpenTags, children: "\uFF0B" }), children: form.tags.length > 0 ? (_jsx("div", { className: "order-entry-token-list", children: form.tags.map((item) => (_jsx("span", { className: "order-entry-token", children: item.text }, item.id))) })) : (_jsx("div", { className: "order-entry-collapsed-line" })) }), _jsx(OrderEntrySection, { title: "\u8BA2\u5355\u5907\u6CE8\uFF1A", compact: true, boxed: true, children: _jsx("textarea", { className: "order-entry-textarea order-entry-textarea--plain", value: form.remark, placeholder: "\u8BF7\u8F93\u5165\u8BA2\u5355\u5907\u6CE8", onChange: (event) => setForm((current) => ({ ...current, remark: event.target.value })) }) })] }), _jsxs("footer", { className: "order-entry-footer", children: [_jsxs("div", { className: "order-entry-footer__metrics", children: [_jsxs("div", { children: [_jsx("span", { children: "\u623F\u8D39(\u51CF\u4F63):" }), _jsxs("strong", { children: ["\u00A5", formatMoney(summary.roomRevenueNet)] })] }), _jsxs("div", { children: [_jsx("span", { children: "\u8BA2\u5355\u603B\u6536\u5165\uFF1A" }), _jsxs("strong", { children: ["\u00A5", formatMoney(summary.totalRevenue)] })] })] }), _jsx("button", { type: "button", className: "order-entry-submit", onClick: onSubmit, disabled: isSubmitting, children: isSubmitting ? '提交中...' : '提交' })] })] }));
}
function LongRentalRoomCard({ room, roomIndex, onChange, onRemove, }) {
    return (_jsxs("article", { className: "order-entry-room-card", children: [_jsxs("div", { className: "order-entry-room-card__header", children: [_jsxs("strong", { children: ["\u623F\u95F4 ", roomIndex + 1] }), _jsxs("div", { children: [_jsx("span", { children: formatContractDuration(room.contractStart, room.contractEnd) }), _jsx("button", { type: "button", className: "order-entry-link", onClick: onRemove, children: "\u5220\u9664" })] })] }), _jsxs("div", { className: "order-entry-grid order-entry-grid--long-room", children: [_jsxs("label", { children: [_jsx("span", { children: "\u623F\u578B/\u623F\u53F7" }), _jsx("input", { type: "text", value: room.roomLabel, placeholder: "\u4F8B\u5982 \u5927\u5E8A\u623F 201", onChange: (event) => onChange({ ...room, roomLabel: event.target.value }) })] }), _jsxs("label", { children: [_jsx("span", { children: "\u5408\u540C\u5F00\u59CB" }), _jsx("input", { type: "date", value: room.contractStart, onChange: (event) => onChange({ ...room, contractStart: event.target.value }) })] }), _jsxs("label", { children: [_jsx("span", { children: "\u5408\u540C\u7ED3\u675F" }), _jsx("input", { type: "date", value: room.contractEnd, onChange: (event) => onChange({ ...room, contractEnd: event.target.value }) })] }), _jsxs("label", { children: [_jsx("span", { children: "\u6708\u79DF\u91D1" }), _jsx("input", { type: "text", value: room.monthlyRent, onChange: (event) => onChange({ ...room, monthlyRent: event.target.value }) })] }), _jsxs("label", { children: [_jsx("span", { children: "\u62BC\u91D1" }), _jsx("input", { type: "text", value: room.deposit, onChange: (event) => onChange({ ...room, deposit: event.target.value }) })] }), _jsxs("label", { children: [_jsx("span", { children: "\u5165\u4F4F\u4EBA\u6570" }), _jsx("input", { type: "number", min: "1", value: room.guests, onChange: (event) => onChange({ ...room, guests: event.target.value }) })] })] })] }));
}
function LongRentalOrderForm({ form, setForm, onClose, onOpenRoomSelector, onSubmit, isSubmitting, }) {
    const summary = calculateLongRentalSummary(form);
    const room = form.rooms[0] ?? createLongRentalRoom();
    const contractDays = formatContractDuration(room.contractStart, room.contractEnd);
    const totalIncome = summary.firstPayment;
    const moveToStepTwo = useCallback(() => {
        const errors = validateLongRentalEntryStep(form);
        if (Object.keys(errors).length > 0) {
            setForm((current) => ({ ...current, errors }));
            return;
        }
        setForm((current) => ({
            ...current,
            step: 2,
            errors: {},
            contractDueMode: current.paymentCycle === '一次性付清' ? '分段付' : '月付',
        }));
    }, [form, setForm]);
    return (_jsxs(_Fragment, { children: [_jsxs("div", { className: "order-entry-steps order-entry-steps--line", "aria-label": "\u957F\u79DF\u5F55\u5165\u6B65\u9AA4", children: [_jsxs("button", { type: "button", className: form.step === 1 ? 'is-active' : 'is-done', onClick: () => setForm((current) => ({ ...current, step: 1 })), children: [_jsx("span", { children: "1" }), _jsx("strong", { children: "\u586B\u5199\u8BA2\u5355\u4FE1\u606F" })] }), _jsx("div", { className: "order-entry-steps__line" }), _jsxs("button", { type: "button", className: form.step === 2 ? 'is-active' : '', onClick: moveToStepTwo, children: [_jsx("span", { children: "2" }), _jsx("strong", { children: "\u6838\u5BF9\u8D26\u5355" })] })] }), form.step === 1 ? (_jsxs("div", { className: "order-entry-scroll order-entry-scroll--plain", children: [_jsx(OrderEntrySection, { title: "\u57FA\u672C\u4FE1\u606F", compact: true, children: _jsxs("div", { className: "order-entry-basic-grid order-entry-basic-grid--long", children: [_jsxs("label", { className: `order-entry-inline-field is-required ${form.errors.tenantName ? 'has-error' : ''}`, children: [_jsx("span", { children: "\u79DF\u5BA2\u59D3\u540D\uFF1A" }), _jsx("input", { type: "text", value: form.tenantName, placeholder: "\u8BF7\u8F93\u5165\u79DF\u5BA2\u59D3\u540D", onChange: (event) => setForm((current) => ({
                                                ...current,
                                                tenantName: event.target.value,
                                                errors: { ...current.errors, tenantName: undefined },
                                            })) }), form.errors.tenantName ? _jsx("em", { children: form.errors.tenantName }) : null] }), _jsxs("label", { className: `order-entry-inline-field is-required ${form.errors.phone ? 'has-error' : ''}`, children: [_jsx("span", { children: "\u624B\u673A\u53F7\uFF1A" }), _jsx("input", { type: "text", value: form.phone, placeholder: "\u8BF7\u8F93\u5165\u624B\u673A\u53F7", onChange: (event) => setForm((current) => ({
                                                ...current,
                                                phone: event.target.value,
                                                errors: { ...current.errors, phone: undefined },
                                            })) }), form.errors.phone ? _jsx("em", { children: form.errors.phone }) : null] }), _jsxs("label", { className: "order-entry-inline-field", children: [_jsx("span", { children: "\u7D27\u6025\u8054\u7CFB\u4EBA\u59D3\u540D\uFF1A" }), _jsx("input", { type: "text", value: form.emergencyName, placeholder: "\u8BF7\u8F93\u5165", onChange: (event) => setForm((current) => ({ ...current, emergencyName: event.target.value })) })] }), _jsxs("label", { className: "order-entry-inline-field", children: [_jsx("span", { children: "\u7D27\u6025\u8054\u7CFB\u4EBA\u7535\u8BDD\uFF1A" }), _jsx("input", { type: "text", value: form.emergencyPhone, placeholder: "\u8BF7\u8F93\u5165", onChange: (event) => setForm((current) => ({ ...current, emergencyPhone: event.target.value })) })] }), _jsxs("label", { className: "order-entry-inline-field is-required", children: [_jsx("span", { children: "\u8BA2\u5355\u6765\u6E90\uFF1A" }), _jsx("select", { value: form.orderSource, onChange: (event) => setForm((current) => ({ ...current, orderSource: event.target.value })), children: entryOrderSourceOptions.map((option) => (_jsx("option", { value: option, children: option }, option))) })] })] }) }), _jsx(OrderEntrySection, { title: "\u623F\u95F4\u4FE1\u606F", compact: true, children: _jsxs("div", { className: "order-entry-long-table", children: [_jsxs("div", { className: "order-entry-long-table__head", children: [_jsx("div", { children: "\u623F\u95F4/\u5165\u79BB\u65E5\u671F" }), _jsx("div", { children: "\u6BCF\u6708\u79DF\u91D1" }), _jsx("div", { children: "\u62BC\u91D1" }), _jsx("div", { children: "\u4EBA\u6570" })] }), _jsxs("div", { className: "order-entry-long-table__row", children: [_jsx("button", { type: "button", className: "order-entry-long-table__picker", onClick: onOpenRoomSelector, children: room.roomLabel || '请选择' }), _jsxs("label", { className: "order-entry-long-table__input", children: [_jsx("span", { children: "\u00A5" }), _jsx("input", { type: "text", value: room.monthlyRent, onChange: (event) => setForm((current) => ({ ...current, rooms: current.rooms.map((item, index) => (index === 0 ? { ...item, monthlyRent: event.target.value } : item)) })) })] }), _jsxs("label", { className: "order-entry-long-table__input", children: [_jsx("span", { children: "\u00A5" }), _jsx("input", { type: "text", value: room.deposit, onChange: (event) => setForm((current) => ({ ...current, rooms: current.rooms.map((item, index) => (index === 0 ? { ...item, deposit: event.target.value } : item)) })) })] }), _jsx("input", { className: "order-entry-long-table__people", type: "number", min: "1", value: room.guests, onChange: (event) => setForm((current) => ({
                                                ...current,
                                                rooms: current.rooms.map((item, index) => (index === 0 ? { ...item, guests: event.target.value } : item)),
                                            })) })] })] }) }), _jsx(OrderEntrySection, { title: "\u4F63\u91D1", compact: true, children: _jsx("div", { className: "order-entry-fee-row order-entry-fee-row--single", children: _jsxs("label", { className: "order-entry-inline-money", children: [_jsx("span", { children: "\u4F63\u91D1\uFF1A" }), _jsxs("div", { className: "order-entry-money-box", children: [_jsx("span", { children: "\uFFE5" }), _jsx("input", { type: "text", value: form.commission, onChange: (event) => setForm((current) => ({ ...current, commission: event.target.value })) })] })] }) }) }), _jsx(OrderEntrySection, { title: "\u79DF\u8D41\u4FE1\u606F", compact: true, children: _jsxs("div", { className: "order-entry-rental-info", children: [_jsxs("div", { className: "order-entry-info-line", children: [_jsx("span", { children: "\u5408\u540C\u65F6\u95F4\uFF1A" }), _jsxs("strong", { children: [room.contractStart, " \u81F3 ", room.contractEnd] })] }), _jsxs("div", { className: "order-entry-info-line", children: [_jsx("span", { children: "\u5408\u540C\u671F\u9650\uFF1A" }), _jsx("strong", { children: contractDays })] }), _jsxs("div", { className: "order-entry-rental-row", children: [_jsx("span", { children: "\u7F34\u8D39\u65B9\u5F0F\uFF1A" }), _jsx("div", { className: "order-entry-pill-group", children: longRentalPaymentCycles.map((option) => (_jsx("button", { type: "button", className: form.paymentCycle === option ? 'is-active' : '', onClick: () => setForm((current) => ({ ...current, paymentCycle: option })), children: option }, option))) })] }), _jsxs("div", { className: "order-entry-rental-row", children: [_jsx("span", { children: "\u7F34\u8D39\u65F6\u95F4\uFF1A" }), _jsxs("div", { className: "order-entry-select-pair", children: [_jsx("select", { value: form.paymentMonth, onChange: (event) => setForm((current) => ({ ...current, paymentMonth: event.target.value })), children: longRentalPaymentMonths.map((option) => (_jsx("option", { value: option, children: option }, option))) }), _jsx("select", { value: form.paymentDay, onChange: (event) => setForm((current) => ({ ...current, paymentDay: event.target.value })), children: longRentalPaymentDays.map((option) => (_jsx("option", { value: option, children: option }, option))) })] })] }), _jsxs("div", { className: "order-entry-rental-row", children: [_jsx("span", { children: "\u6536\u79DF\u63D0\u9192\uFF1A" }), _jsxs("div", { className: "order-entry-select-pair order-entry-select-pair--wide", children: [_jsxs("select", { value: form.reminderEnabled, onChange: (event) => setForm((current) => ({ ...current, reminderEnabled: event.target.value })), children: [_jsx("option", { value: "\u5F00\u542F", children: "\u5F00\u542F" }), _jsx("option", { value: "\u5173\u95ED", children: "\u5173\u95ED" })] }), _jsx("em", { children: "\u5F00\u542F\u540E \u5728\u6BCF\u6708\u201C\u5E94\u6536\u65F6\u95F4\u201D\u53D1\u9001\u63D0\u9192" })] })] })] }) }), _jsx(OrderEntrySection, { title: "\u968F\u623F\u4ED8\u8D39\u9879\u76EE", compact: true, children: _jsxs("div", { className: "order-entry-extra-grid", children: [_jsxs("label", { className: "order-entry-inline-addon", children: [_jsx("span", { children: "\u5BBD\u5E26\u8D39\uFF1A" }), _jsx("input", { type: "text", value: form.broadband, placeholder: "00.00", onChange: (event) => setForm((current) => ({ ...current, broadband: event.target.value })) }), _jsx("em", { children: "\u5143/\u6708" })] }), _jsxs("label", { className: "order-entry-inline-addon", children: [_jsx("span", { children: "\u516C\u644A\u8D39\uFF1A" }), _jsx("input", { type: "text", value: form.shared, placeholder: "00.00", onChange: (event) => setForm((current) => ({ ...current, shared: event.target.value })) }), _jsx("em", { children: "\u5143/\u6708" })] }), _jsxs("label", { className: "order-entry-inline-addon", children: [_jsx("span", { children: "\u536B\u751F\u8D39\uFF1A" }), _jsx("input", { type: "text", value: form.sanitation, placeholder: "00.00", onChange: (event) => setForm((current) => ({ ...current, sanitation: event.target.value })) }), _jsx("em", { children: "\u5143/\u6708" })] }), _jsxs("label", { className: "order-entry-inline-addon", children: [_jsx("span", { children: "\u7269\u4E1A\u8D39\uFF1A" }), _jsx("input", { type: "text", value: form.property, placeholder: "00.00", onChange: (event) => setForm((current) => ({ ...current, property: event.target.value })) }), _jsx("em", { children: "\u5143/\u6708" })] }), _jsxs("label", { className: "order-entry-inline-addon", children: [_jsx("span", { children: "\u505C\u8F66\u8D39\uFF1A" }), _jsx("input", { type: "text", value: form.park, placeholder: "00.00", onChange: (event) => setForm((current) => ({ ...current, park: event.target.value })) }), _jsx("em", { children: "\u5143/\u6708" })] })] }) })] })) : (_jsxs("div", { className: "order-entry-scroll order-entry-scroll--plain order-entry-scroll--long-bill", children: [_jsxs("div", { className: "order-entry-long-bill-topline", children: [_jsxs("div", { children: [_jsx("span", { children: "\u8D26\u5355\u4FE1\u606F" }), _jsxs("strong", { children: ["\u8D77\u6B62\u65F6\u95F4: ", room.contractStart, "\u81F3", room.contractEnd, "(\u5408\u540C\u671F\u9650", contractDays, ")"] })] }), _jsxs("span", { children: ["\u7F34\u8D39\u65B9\u5F0F: ", form.paymentCycle] })] }), _jsxs("div", { className: "order-entry-long-bill-table", role: "table", "aria-label": "\u957F\u79DF\u6838\u5BF9\u8D26\u5355", children: [_jsxs("div", { role: "row", className: "order-entry-long-bill-table__head", children: [_jsx("div", { role: "columnheader", children: "\u7F34\u8D39\u6B21\u6570" }), _jsx("div", { role: "columnheader", children: "\u5E94\u6536\u65F6\u95F4" }), _jsx("div", { role: "columnheader", children: "\u6709\u6548\u671F" }), _jsx("div", { role: "columnheader", children: "\u79DF\u91D1" }), _jsx("div", { role: "columnheader", children: "\u5176\u4ED6\u8D39\u7528" }), _jsx("div", { role: "columnheader", children: "\u5E94\u6536\u91D1\u989D" })] }), _jsxs("div", { role: "row", className: "order-entry-long-bill-table__row order-entry-long-bill-table__row--deposit", children: [_jsx("div", { role: "cell", children: "\u7F34\u7EB3\u62BC\u91D1" }), _jsx("div", { role: "cell", children: _jsx("label", { className: "order-entry-long-bill-date", children: _jsx("input", { type: "date", value: room.contractStart, onChange: (event) => setForm((current) => ({
                                                    ...current,
                                                    rooms: current.rooms.map((item, index) => (index === 0 ? { ...item, contractStart: event.target.value } : item)),
                                                })) }) }) }), _jsxs("div", { role: "cell", className: "order-entry-long-bill-period", children: [_jsx("strong", { children: room.contractStart }), _jsx("span", { children: "\u81F3" }), _jsx("strong", { children: room.contractEnd })] }), _jsx("div", { role: "cell", children: "-" }), _jsx("div", { role: "cell", children: "0\u9879 \u00A5 0" }), _jsxs("div", { role: "cell", children: ["\u00A5 ", formatMoney(summary.deposit)] })] }), _jsxs("div", { role: "row", className: "order-entry-long-bill-table__row", children: [_jsx("div", { role: "cell", children: "1" }), _jsx("div", { role: "cell", children: _jsx("label", { className: "order-entry-long-bill-date", children: _jsx("input", { type: "date", value: room.contractStart, onChange: (event) => setForm((current) => ({
                                                    ...current,
                                                    rooms: current.rooms.map((item, index) => (index === 0 ? { ...item, contractStart: event.target.value } : item)),
                                                })) }) }) }), _jsxs("div", { role: "cell", className: "order-entry-long-bill-period", children: [_jsx("strong", { children: room.contractStart }), _jsx("span", { children: "\u81F3" }), _jsx("strong", { children: room.contractEnd })] }), _jsx("div", { role: "cell", children: _jsxs("label", { className: "order-entry-long-bill-money", children: [_jsx("span", { children: "\u00A5" }), _jsx("input", { type: "text", value: room.monthlyRent, onChange: (event) => setForm((current) => ({
                                                        ...current,
                                                        rooms: current.rooms.map((item, index) => (index === 0 ? { ...item, monthlyRent: event.target.value } : item)),
                                                    })) })] }) }), _jsx("div", { role: "cell", children: "0\u9879 \u00A5 0" }), _jsxs("div", { role: "cell", children: ["\u00A5 ", formatMoney(summary.monthlyRent + summary.extras)] })] })] }), _jsxs("div", { className: "order-entry-long-bill-summary", children: [_jsxs("strong", { children: ["\u603B\u6536\u5165 ", _jsxs("em", { children: ["\u00A5 ", formatMoney(totalIncome)] })] }), _jsxs("span", { children: ["(\u79DF\u91D1 ", _jsxs("em", { children: ["\u00A5 ", formatMoney(summary.monthlyRent)] }), " \u5176\u4ED6\u8D39\u7528 ", _jsxs("em", { children: ["\u00A5 ", formatMoney(summary.extras)] }), ")"] }), _jsxs("span", { children: ["\u62BC\u91D1 ", _jsxs("em", { children: ["\u00A5 ", formatMoney(summary.deposit)] })] })] })] })), _jsxs("footer", { className: "order-entry-footer", children: [_jsx("div", { className: "order-entry-footer__metrics order-entry-footer__metrics--long" }), form.step === 1 ? (_jsxs(_Fragment, { children: [_jsx("button", { type: "button", className: "order-entry-secondary", onClick: onClose, children: "\u53D6\u6D88" }), _jsx("button", { type: "button", className: "order-entry-secondary order-entry-secondary--primary", onClick: onSubmit, disabled: isSubmitting, children: isSubmitting ? '保存中...' : '保存后结束' }), _jsx("button", { type: "button", className: "order-entry-submit", onClick: moveToStepTwo, children: "\u4FDD\u5B58\u540E\u4E0B\u4E00\u6B65" })] })) : (_jsxs(_Fragment, { children: [_jsx("button", { type: "button", className: `order-entry-secondary ${form.contractDueMode === '月付' ? 'order-entry-secondary--primary' : ''}`, onClick: () => setForm((current) => ({ ...current, contractDueMode: '月付' })), children: "\u6708\u4ED8" }), _jsx("button", { type: "button", className: `order-entry-secondary ${form.contractDueMode === '分段付' ? 'order-entry-secondary--primary' : ''}`, onClick: () => setForm((current) => ({ ...current, contractDueMode: '分段付' })), children: "\u5206\u6BB5\u4ED8" }), _jsx("button", { type: "button", className: "order-entry-secondary", onClick: () => setForm((current) => ({ ...current, step: 1 })), children: "\u8FD4\u56DE\u4E0A\u4E00\u6B65" }), _jsx("button", { type: "button", className: "order-entry-submit", onClick: onSubmit, disabled: isSubmitting, children: isSubmitting ? '提交中...' : '核对后结束' })] }))] })] }));
}
function OrderEntryModalShell({ title, className, onClose, children, footer, }) {
    return (_jsx("div", { className: "order-entry-modal-backdrop", role: "presentation", onClick: onClose, children: _jsxs("section", { className: `order-entry-modal ${className ?? ''}`, role: "dialog", "aria-modal": "true", "aria-label": title, onClick: (event) => event.stopPropagation(), children: [_jsxs("header", { className: "order-entry-modal__header", children: [_jsx("h3", { children: title }), _jsx("button", { type: "button", "aria-label": `关闭${title}`, onClick: onClose, children: "\u00D7" })] }), _jsx("div", { className: "order-entry-modal__body", children: children }), footer ? _jsx("footer", { className: "order-entry-modal__footer", children: footer }) : null] }) }));
}
function RoomSelectorModal({ state, onClose, onConfirm, setState, }) {
    if (!state.open)
        return null;
    const days = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];
    const calendarDays = buildCalendarDays(state.visibleMonth);
    const isHourlyMode = state.mode === 'hourly';
    const rangeStart = state.selectedStart && state.selectedEnd ? (state.selectedStart <= state.selectedEnd ? state.selectedStart : state.selectedEnd) : state.selectedStart;
    const rangeEnd = state.selectedStart && state.selectedEnd ? (state.selectedStart <= state.selectedEnd ? state.selectedEnd : state.selectedStart) : state.selectedEnd;
    const selectedNights = rangeStart && rangeEnd ? getNightCount(rangeStart, rangeEnd) : 0;
    const selectedHourlyDateTime = `${state.selectedStart} ${state.selectedHour}:${state.selectedMinute}`;
    const filteredTypes = state.roomOptions.filter((roomType) => {
        const keyword = state.keyword.trim();
        const matchesKeyword = !keyword ||
            roomType.roomCategoryName.includes(keyword) ||
            roomType.rooms.some((room) => room.roomName.includes(keyword));
        return matchesKeyword;
    });
    return (_jsx(OrderEntryModalShell, { title: "\u9009\u62E9\u65E5\u671F\u623F\u95F4", className: "order-entry-modal--room-selector", onClose: onClose, footer: _jsxs(_Fragment, { children: [_jsx("button", { type: "button", className: "order-entry-secondary", onClick: onClose, children: "\u53D6\u6D88" }), _jsx("button", { type: "button", className: "order-entry-submit", onClick: onConfirm, children: "\u786E\u5B9A" })] }), children: _jsxs("div", { className: "room-selector-modal", children: [_jsxs("div", { className: "room-selector-modal__calendar", children: [_jsxs("div", { className: "room-selector-calendar", children: [_jsxs("div", { className: "room-selector-calendar__header", children: [_jsx("button", { type: "button", onClick: () => setState((current) => ({ ...current, visibleMonth: shiftMonth(current.visibleMonth, -1) })), children: '<' }), _jsx("strong", { children: formatMonthLabel(state.visibleMonth) }), _jsx("button", { type: "button", onClick: () => setState((current) => ({ ...current, visibleMonth: shiftMonth(current.visibleMonth, 1) })), children: '>' })] }), _jsx("div", { className: "room-selector-calendar__weekdays", children: days.map((day) => (_jsx("span", { children: day }, day))) }), _jsx("div", { className: "room-selector-calendar__grid", children: calendarDays.map((item) => {
                                        const isSelected = item.key === state.selectedStart || item.key === state.selectedEnd;
                                        const isInRange = Boolean(rangeStart && rangeEnd && item.key > rangeStart && item.key < rangeEnd);
                                        return (_jsx("button", { type: "button", className: `${isSelected ? 'is-selected' : ''} ${isInRange ? 'is-in-range' : ''} ${item.isCurrentMonth ? '' : 'is-muted'}`, onClick: () => setState((current) => {
                                                if (current.mode === 'hourly') {
                                                    return {
                                                        ...current,
                                                        selectedStart: item.key,
                                                        selectedEnd: item.key,
                                                        selectingEnd: false,
                                                    };
                                                }
                                                if (!current.selectedStart || !current.selectingEnd) {
                                                    return {
                                                        ...current,
                                                        selectedStart: item.key,
                                                        selectedEnd: '',
                                                        selectingEnd: true,
                                                    };
                                                }
                                                if (item.key === current.selectedStart) {
                                                    return {
                                                        ...current,
                                                        selectedEnd: item.key,
                                                        selectingEnd: false,
                                                    };
                                                }
                                                return {
                                                    ...current,
                                                    selectedEnd: item.key,
                                                    selectingEnd: false,
                                                };
                                            }), children: item.day }, item.key));
                                    }) })] }), isHourlyMode ? (_jsxs("div", { className: "room-selector-time-panel", children: [_jsxs("div", { className: "room-selector-time-panel__columns", children: [_jsx("div", { className: "room-selector-time-column", children: hourlyRoomHours.map((hour) => (_jsx("button", { type: "button", className: hour === state.selectedHour ? 'is-active' : '', onClick: () => setState((current) => ({ ...current, selectedHour: hour })), children: hour }, hour))) }), _jsx("div", { className: "room-selector-time-column", children: hourlyRoomMinutes.map((minute) => (_jsx("button", { type: "button", className: minute === state.selectedMinute ? 'is-active' : '', onClick: () => setState((current) => ({ ...current, selectedMinute: minute })), children: minute }, minute))) })] }), _jsx("button", { type: "button", className: "room-selector-time-panel__now", onClick: () => {
                                        const now = new Date();
                                        const year = now.getFullYear();
                                        const month = String(now.getMonth() + 1).padStart(2, '0');
                                        const day = String(now.getDate()).padStart(2, '0');
                                        const hour = String(now.getHours()).padStart(2, '0');
                                        const minute = String(now.getMinutes()).padStart(2, '0');
                                        setState((current) => ({
                                            ...current,
                                            visibleMonth: `${year}-${month}`,
                                            selectedStart: `${year}-${month}-${day}`,
                                            selectedEnd: `${year}-${month}-${day}`,
                                            selectedHour: hour,
                                            selectedMinute: minute,
                                            selectingEnd: false,
                                        }));
                                    }, children: "\u6B64\u523B" })] })) : null, _jsx("div", { className: "room-selector-modal__summary", children: isHourlyMode
                                ? `入住时间：${selectedHourlyDateTime}`
                                : `已选 ${formatMonthDayRange(rangeStart || state.selectedStart, rangeEnd || state.selectedEnd)} 共${selectedNights}晚` })] }), _jsxs("div", { className: "room-selector-modal__content", children: [_jsx("div", { className: "room-selector-modal__toolbar", children: _jsx("input", { type: "text", value: state.keyword, placeholder: "\u8F93\u5165\u623F\u95F4/\u623F\u578B\u540D\u79F0", onChange: (event) => setState((current) => ({ ...current, keyword: event.target.value })) }) }), _jsxs("div", { className: "room-selector-modal__tree", children: [state.isLoading ? _jsx("div", { className: "room-selector-modal__status", children: "\u6B63\u5728\u52A0\u8F7D\u53EF\u9009\u623F\u578B\u623F\u95F4..." }) : null, state.error ? _jsx("div", { className: "room-selector-modal__status is-error", children: state.error }) : null, !state.isLoading && !state.error && filteredTypes.length === 0 ? (_jsx("div", { className: "room-selector-modal__status", children: "\u6682\u65E0\u53EF\u9009\u623F\u578B\u623F\u95F4" })) : null, !state.isLoading && !state.error ? filteredTypes.map((roomType) => {
                                    const expanded = state.expandedRoomTypes.includes(roomType.roomCategoryId);
                                    return (_jsxs("div", { className: "room-selector-tree__group", children: [_jsxs("button", { type: "button", className: "room-selector-tree__group-header", onClick: () => setState((current) => ({
                                                    ...current,
                                                    expandedRoomTypes: expanded
                                                        ? current.expandedRoomTypes.filter((item) => item !== roomType.roomCategoryId)
                                                        : [...current.expandedRoomTypes, roomType.roomCategoryId],
                                                })), children: [_jsx("span", { children: roomType.roomCategoryName }), _jsx("span", { children: expanded ? '▼' : '▶' })] }), expanded ? (_jsx("div", { className: "room-selector-tree__children", children: roomType.rooms.map((room) => {
                                                    const id = roomSelectionKey(roomType.roomCategoryId, room.roomId);
                                                    const checked = state.selectedRooms.includes(id);
                                                    return (_jsxs("label", { children: [_jsx("input", { type: "checkbox", checked: checked, onChange: (event) => setState((current) => ({
                                                                    ...current,
                                                                    error: '',
                                                                    selectedRooms: event.target.checked ? [id] : current.selectedRooms.filter((item) => item !== id),
                                                                })) }), _jsx("span", { children: room.roomName })] }, id));
                                                }) })) : null] }, roomType.roomCategoryId));
                                }) : null] })] })] }) }));
}
function ReminderModal({ state, onClose, onConfirm, setState, }) {
    if (!state.open)
        return null;
    return (_jsx(OrderEntryModalShell, { title: "\u6DFB\u52A0\u8BA2\u5355\u63D0\u9192", className: "order-entry-modal--reminder", onClose: onClose, footer: _jsxs(_Fragment, { children: [_jsx("button", { type: "button", className: "order-entry-secondary", onClick: onClose, children: "\u53D6\u6D88" }), _jsx("button", { type: "button", className: "order-entry-submit", onClick: onConfirm, children: "\u786E\u5B9A" })] }), children: _jsxs("div", { className: "order-entry-form-stack", children: [_jsxs("label", { className: "order-entry-inline-field", children: [_jsx("span", { children: "\u63D0\u9192\u65F6\u95F4\uFF1A" }), _jsx("input", { type: "text", value: state.date, placeholder: "\u8BF7\u9009\u62E9\u65E5\u671F", onChange: (event) => setState((current) => ({ ...current, date: event.target.value })) })] }), _jsxs("label", { className: "order-entry-form-stack__textarea", children: [_jsx("span", { children: "\u63D0\u9192\u5185\u5BB9\uFF1A" }), _jsx("textarea", { value: state.content, placeholder: "\u8BF7\u8F93\u5165\u63D0\u9192\u5185\u5BB9", onChange: (event) => setState((current) => ({ ...current, content: event.target.value })) })] })] }) }));
}
function TagSelectorModal({ state, onClose, onConfirm, setState, }) {
    if (!state.open)
        return null;
    return (_jsx(OrderEntryModalShell, { title: "\u9009\u62E9\u6807\u7B7E", className: "order-entry-modal--tags", onClose: onClose, footer: _jsxs(_Fragment, { children: [_jsx("button", { type: "button", className: "order-entry-secondary", onClick: onClose, children: "\u53D6\u6D88" }), _jsx("button", { type: "button", className: "order-entry-submit", onClick: onConfirm, children: "\u786E\u5B9A" })] }), children: _jsxs("div", { className: "tag-selector-modal", children: [_jsxs("div", { className: "tag-selector-modal__toolbar", children: [_jsx("input", { type: "text", value: state.keyword, placeholder: "\u641C\u7D22", onChange: (event) => setState((current) => ({ ...current, keyword: event.target.value })) }), _jsx("button", { type: "button", className: "order-entry-link order-entry-link--create", children: "+\u521B\u5EFA\u6807\u7B7E" })] }), _jsx("div", { className: "tag-selector-modal__section-title", children: "\u8BA2\u5355\u6807\u7B7E" }), _jsx("div", { className: "tag-selector-modal__tree", children: orderTagGroups.map((group) => {
                        const expanded = state.expandedGroups.includes(group.id);
                        return (_jsxs("div", { className: "tag-selector-tree__group", children: [_jsxs("button", { type: "button", className: "tag-selector-tree__group-header", onClick: () => setState((current) => ({
                                        ...current,
                                        expandedGroups: expanded ? current.expandedGroups.filter((item) => item !== group.id) : [...current.expandedGroups, group.id],
                                    })), children: [_jsx("span", { children: expanded ? '▼' : '▶' }), _jsxs("label", { children: [_jsx("input", { type: "checkbox", readOnly: true, checked: group.tags.every((tag) => state.selectedTagIds.includes(tag.id)) }), _jsx("span", { children: group.label })] })] }), expanded ? (_jsx("div", { className: "tag-selector-tree__children", children: group.tags
                                        .filter((tag) => !state.keyword.trim() || tag.label.includes(state.keyword.trim()))
                                        .map((tag) => (_jsxs("label", { children: [_jsx("input", { type: "checkbox", checked: state.selectedTagIds.includes(tag.id), onChange: (event) => setState((current) => ({
                                                    ...current,
                                                    selectedTagIds: event.target.checked
                                                        ? [...current.selectedTagIds, tag.id]
                                                        : current.selectedTagIds.filter((item) => item !== tag.id),
                                                })) }), _jsx("span", { children: tag.label })] }, tag.id))) })) : null] }, group.id));
                    }) })] }) }));
}
function OrderEntryDrawer({ isOpen, orderType, fullDayForm, hourlyForm, longRentalForm, roomSelectorModal, reminderModal, tagSelectorModal, onClose, onTypeChange, setFullDayForm, setHourlyForm, setLongRentalForm, setRoomSelectorModal, setReminderModal, setTagSelectorModal, onCreated, setActionMessage, isSubmitting, setIsSubmitting, }) {
    if (!isOpen)
        return null;
    const campId = resolveHouseOrderCampId();
    const handleStaySubmit = async (type) => {
        const form = type === 'hourly' ? hourlyForm : fullDayForm;
        if (!form.guestName.trim()) {
            setActionMessage('请先填写联系人姓名');
            return;
        }
        setIsSubmitting(true);
        try {
            await createOrder(buildStayOrderPayload(type, form, campId));
            if (type === 'hourly') {
                setHourlyForm(() => createStayForm('hourly'));
            }
            else {
                setFullDayForm(() => createStayForm());
            }
            setActionMessage('订单创建成功');
            onCreated();
            onClose();
        }
        catch (error) {
            setActionMessage(`订单创建失败：${error instanceof Error ? error.message : String(error)}`);
        }
        finally {
            setIsSubmitting(false);
        }
    };
    const handleLongRentalSubmit = async () => {
        const errors = validateLongRentalEntryStep(longRentalForm);
        if (Object.keys(errors).length > 0) {
            setLongRentalForm((current) => ({ ...current, errors }));
            return;
        }
        setIsSubmitting(true);
        try {
            await createOrder(buildLongRentalOrderPayload(longRentalForm, campId));
            setLongRentalForm(() => createLongRentalEntryForm());
            setActionMessage('长租订单创建成功');
            onCreated();
            onClose();
        }
        catch (error) {
            setActionMessage(`长租订单创建失败：${error instanceof Error ? error.message : String(error)}`);
        }
        finally {
            setIsSubmitting(false);
        }
    };
    return (_jsxs(_Fragment, { children: [_jsx("div", { className: "order-detail-backdrop", role: "presentation", onClick: onClose, children: _jsxs("section", { className: "order-entry-drawer", role: "dialog", "aria-modal": "true", "aria-label": "\u5F55\u5165\u8BA2\u5355", onClick: (event) => event.stopPropagation(), children: [_jsxs("header", { className: "order-entry-drawer__header", children: [_jsx("h2", { children: "\u5F55\u5165\u8BA2\u5355" }), _jsx("button", { type: "button", "aria-label": "\u5173\u95ED\u5F55\u5165\u8BA2\u5355", onClick: onClose, children: "\u00D7" })] }), _jsxs("nav", { className: "order-entry-tabs", "aria-label": "\u8BA2\u5355\u7C7B\u578B", children: [_jsx("button", { type: "button", className: orderType === 'fullDay' ? 'is-active' : '', onClick: () => onTypeChange('fullDay'), children: "\u5168\u65E5\u623F" }), _jsx("button", { type: "button", className: orderType === 'hourly' ? 'is-active' : '', onClick: () => onTypeChange('hourly'), children: "\u949F\u70B9\u623F" }), _jsx("button", { type: "button", className: orderType === 'longRental' ? 'is-active' : '', onClick: () => onTypeChange('longRental'), children: "\u957F\u79DF\u623F" })] }), orderType === 'fullDay' ? (_jsx(StayOrderForm, { type: "fullDay", form: fullDayForm, setForm: setFullDayForm, onOpenRoomSelector: () => setRoomSelectorModal((current) => ({ ...current, open: true, mode: 'fullDay' })), onOpenReminder: () => setReminderModal((current) => ({ ...current, open: true })), onOpenTags: () => setTagSelectorModal((current) => ({ ...current, open: true })), onSubmit: () => void handleStaySubmit('fullDay'), isSubmitting: isSubmitting })) : null, orderType === 'hourly' ? (_jsx(StayOrderForm, { type: "hourly", form: hourlyForm, setForm: setHourlyForm, onOpenRoomSelector: () => setRoomSelectorModal((current) => applyHourlyRoomToSelectorState(current, hourlyForm.rooms[0] ?? createHourlyStayRoom())), onOpenReminder: () => setReminderModal((current) => ({ ...current, open: true })), onOpenTags: () => setTagSelectorModal((current) => ({ ...current, open: true })), onSubmit: () => void handleStaySubmit('hourly'), isSubmitting: isSubmitting })) : null, orderType === 'longRental' ? (_jsx(LongRentalOrderForm, { form: longRentalForm, setForm: setLongRentalForm, onClose: onClose, onOpenRoomSelector: () => setRoomSelectorModal((current) => ({ ...current, open: true, mode: 'longRental' })), onSubmit: () => void handleLongRentalSubmit(), isSubmitting: isSubmitting })) : null] }) }), _jsx(RoomSelectorModal, { state: roomSelectorModal, onClose: () => setRoomSelectorModal((current) => ({ ...current, open: false })), onConfirm: () => {
                    const selection = findRoomSelection(roomSelectorModal.roomOptions, roomSelectorModal.selectedRooms[0] ?? '');
                    const { start, end } = resolveRoomSelectorRange(roomSelectorModal);
                    const nextDateRange = orderType === 'hourly'
                        ? `${start.replace(/-/g, '.')} ${roomSelectorModal.selectedHour}:${roomSelectorModal.selectedMinute}`
                        : toDisplayDateRange(start, end);
                    if (!selection) {
                        setRoomSelectorModal((current) => ({ ...current, error: '请选择可用房间' }));
                        return;
                    }
                    if (orderType === 'hourly') {
                        setHourlyForm((current) => ({
                            ...current,
                            rooms: current.rooms.map((room, index) => index === 0
                                ? applySelectionToStayRoom(room, selection, nextDateRange)
                                : room),
                        }));
                    }
                    else if (orderType === 'longRental') {
                        setLongRentalForm((current) => ({
                            ...current,
                            rooms: current.rooms.map((room, index) => index === 0
                                ? applySelectionToLongRentalRoom(room, selection, start, end)
                                : room),
                        }));
                    }
                    else {
                        setFullDayForm((current) => ({
                            ...current,
                            rooms: current.rooms.map((room, index) => index === 0
                                ? applySelectionToStayRoom(room, selection, nextDateRange)
                                : room),
                        }));
                    }
                    setRoomSelectorModal((current) => ({ ...current, open: false }));
                }, setState: setRoomSelectorModal }), _jsx(ReminderModal, { state: reminderModal, onClose: () => setReminderModal((current) => ({ ...current, open: false })), onConfirm: () => {
                    const text = [reminderModal.date, reminderModal.content].filter(Boolean).join(' ');
                    if (text) {
                        const nextItem = { id: nextOrderEntryId('reminder'), text };
                        if (orderType === 'hourly') {
                            setHourlyForm((current) => ({ ...current, reminders: [...current.reminders, nextItem] }));
                        }
                        else if (orderType === 'fullDay') {
                            setFullDayForm((current) => ({ ...current, reminders: [...current.reminders, nextItem] }));
                        }
                    }
                    setReminderModal(() => createReminderModalState());
                }, setState: setReminderModal }), _jsx(TagSelectorModal, { state: tagSelectorModal, onClose: () => setTagSelectorModal((current) => ({ ...current, open: false })), onConfirm: () => {
                    const selectedTags = orderTagGroups
                        .flatMap((group) => group.tags)
                        .filter((tag) => tagSelectorModal.selectedTagIds.includes(tag.id))
                        .map((tag) => ({ id: tag.id, text: tag.label }));
                    if (orderType === 'hourly') {
                        setHourlyForm((current) => ({ ...current, tags: selectedTags }));
                    }
                    else if (orderType === 'fullDay') {
                        setFullDayForm((current) => ({ ...current, tags: selectedTags }));
                    }
                    setTagSelectorModal(() => createTagSelectorModalState());
                }, setState: setTagSelectorModal })] }));
}
export function OrderEntryDrawerHost({ isOpen, initialRoom, onClose, onCreated, onActionMessage, }) {
    const [entryOrderType, setEntryOrderType] = useState('fullDay');
    const [fullDayForm, setFullDayFormState] = useState(() => createStayFormWithInitialRoom(initialRoom ?? undefined));
    const [hourlyForm, setHourlyFormState] = useState(() => createStayFormWithInitialRoom(initialRoom ?? undefined, 'hourly'));
    const [longRentalForm, setLongRentalFormState] = useState(() => createLongRentalEntryForm(initialRoom ?? undefined));
    const [roomSelectorModal, setRoomSelectorModalState] = useState(() => createRoomSelectorModalState(initialRoom ?? undefined));
    const [reminderModal, setReminderModalState] = useState(() => createReminderModalState());
    const [tagSelectorModal, setTagSelectorModalState] = useState(() => createTagSelectorModalState());
    const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);
    useEffect(() => {
        if (!isOpen)
            return;
        setEntryOrderType('fullDay');
        setFullDayFormState(createStayFormWithInitialRoom(initialRoom ?? undefined));
        setHourlyFormState(createStayFormWithInitialRoom(initialRoom ?? undefined, 'hourly'));
        setLongRentalFormState(createLongRentalEntryForm(initialRoom ?? undefined));
        setRoomSelectorModalState(createRoomSelectorModalState(initialRoom ?? undefined));
        setReminderModalState(createReminderModalState());
        setTagSelectorModalState(createTagSelectorModalState());
        setIsSubmittingOrder(false);
    }, [initialRoom, isOpen]);
    useEffect(() => {
        if (!roomSelectorModal.open)
            return;
        const controller = new AbortController();
        setRoomSelectorModalState((current) => ({
            ...current,
            isLoading: true,
            error: '',
        }));
        async function loadRoomOptions() {
            try {
                const options = await fetchOrderRoomSelectorOptions(buildRoomSelectorQuery(roomSelectorModal, resolveHouseOrderCampId()), controller.signal);
                if (controller.signal.aborted)
                    return;
                const validSelectionKeys = new Set(options.flatMap((group) => group.rooms.map((room) => roomSelectionKey(group.roomCategoryId, room.roomId))));
                setRoomSelectorModalState((current) => ({
                    ...current,
                    roomOptions: options,
                    expandedRoomTypes: options.map((item) => item.roomCategoryId),
                    selectedRooms: current.selectedRooms.filter((item) => validSelectionKeys.has(item)),
                    isLoading: false,
                    error: '',
                }));
            }
            catch (requestError) {
                if (controller.signal.aborted)
                    return;
                setRoomSelectorModalState((current) => ({
                    ...current,
                    roomOptions: [],
                    expandedRoomTypes: [],
                    selectedRooms: [],
                    isLoading: false,
                    error: `房型房间加载失败：${requestError instanceof Error ? requestError.message : String(requestError)}`,
                }));
            }
        }
        void loadRoomOptions();
        return () => controller.abort();
    }, [
        roomSelectorModal.open,
        roomSelectorModal.mode,
        roomSelectorModal.selectedStart,
        roomSelectorModal.selectedEnd,
        roomSelectorModal.selectedHour,
        roomSelectorModal.selectedMinute,
        roomSelectorModal.keyword,
    ]);
    const setFullDayForm = useCallback((updater) => {
        setFullDayFormState((current) => updater(current));
    }, []);
    const setHourlyForm = useCallback((updater) => {
        setHourlyFormState((current) => updater(current));
    }, []);
    const setLongRentalForm = useCallback((updater) => {
        setLongRentalFormState((current) => updater(current));
    }, []);
    const setRoomSelectorModal = useCallback((updater) => {
        setRoomSelectorModalState((current) => updater(current));
    }, []);
    const setReminderModal = useCallback((updater) => {
        setReminderModalState((current) => updater(current));
    }, []);
    const setTagSelectorModal = useCallback((updater) => {
        setTagSelectorModalState((current) => updater(current));
    }, []);
    const closeEntryDrawer = useCallback(() => {
        setEntryOrderType('fullDay');
        setFullDayFormState(createStayFormWithInitialRoom(initialRoom ?? undefined));
        setHourlyFormState(createStayFormWithInitialRoom(initialRoom ?? undefined, 'hourly'));
        setLongRentalFormState(createLongRentalEntryForm(initialRoom ?? undefined));
        setRoomSelectorModalState(createRoomSelectorModalState(initialRoom ?? undefined));
        setReminderModalState(createReminderModalState());
        setTagSelectorModalState(createTagSelectorModalState());
        setIsSubmittingOrder(false);
        onClose();
    }, [initialRoom, onClose]);
    return (_jsx(OrderEntryDrawer, { isOpen: isOpen, orderType: entryOrderType, fullDayForm: fullDayForm, hourlyForm: hourlyForm, longRentalForm: longRentalForm, roomSelectorModal: roomSelectorModal, reminderModal: reminderModal, tagSelectorModal: tagSelectorModal, onClose: closeEntryDrawer, onTypeChange: setEntryOrderType, setFullDayForm: setFullDayForm, setHourlyForm: setHourlyForm, setLongRentalForm: setLongRentalForm, setRoomSelectorModal: setRoomSelectorModal, setReminderModal: setReminderModal, setTagSelectorModal: setTagSelectorModal, onCreated: () => {
            onCreated?.();
        }, setActionMessage: (message) => onActionMessage?.(message), isSubmitting: isSubmittingOrder, setIsSubmitting: setIsSubmittingOrder }));
}
const orderTypeByFilter = {
    全部: '',
    今日新单: '1',
    今日预抵: '11',
    今日在住: '10',
    今日预离: '12',
    明日入住: '4',
    明日退房: '5',
    待接单: '6',
    待退款: '7',
    异常订单: '8',
};
function HouseOrdersPage() {
    const [activeFilter, setActiveFilter] = useState('全部');
    const [filtersExpanded, setFiltersExpanded] = useState(false);
    const [columnsExpanded, setColumnsExpanded] = useState(false);
    const [keyword, setKeyword] = useState('');
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [isEntryDrawerOpen, setIsEntryDrawerOpen] = useState(false);
    const [entryOrderType, setEntryOrderType] = useState('fullDay');
    const [fullDayForm, setFullDayFormState] = useState(() => createStayForm());
    const [hourlyForm, setHourlyFormState] = useState(() => createStayForm('hourly'));
    const [longRentalForm, setLongRentalFormState] = useState(() => createLongRentalEntryForm());
    const [roomSelectorModal, setRoomSelectorModalState] = useState(() => createRoomSelectorModalState());
    const [reminderModal, setReminderModalState] = useState(() => createReminderModalState());
    const [tagSelectorModal, setTagSelectorModalState] = useState(() => createTagSelectorModalState());
    const [data, setData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [requestRevision, setRequestRevision] = useState(0);
    const [actionMessage, setActionMessage] = useState('');
    const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);
    const orderType = orderTypeByFilter[activeFilter] ?? '';
    useEffect(() => {
        const controller = new AbortController();
        async function loadOrders() {
            setIsLoading(true);
            setError('');
            try {
                const campId = resolveHouseOrderCampId();
                const nextData = await fetchHouseOrders({
                    campId,
                    pageNum: 1,
                    pageSize: 20,
                    orderType,
                    keyword: keyword.trim(),
                }, controller.signal);
                if (controller.signal.aborted)
                    return;
                setData(nextData);
            }
            catch (requestError) {
                if (controller.signal.aborted)
                    return;
                setData(null);
                setError(`数据服务请求失败：${requestError instanceof Error ? requestError.message : String(requestError)}`);
            }
            finally {
                if (!controller.signal.aborted)
                    setIsLoading(false);
            }
        }
        loadOrders();
        return () => controller.abort();
    }, [keyword, orderType, requestRevision]);
    useEffect(() => {
        if (!roomSelectorModal.open)
            return;
        const controller = new AbortController();
        setRoomSelectorModalState((current) => ({
            ...current,
            isLoading: true,
            error: '',
        }));
        async function loadRoomOptions() {
            try {
                const options = await fetchOrderRoomSelectorOptions(buildRoomSelectorQuery(roomSelectorModal, resolveHouseOrderCampId()), controller.signal);
                if (controller.signal.aborted)
                    return;
                const validSelectionKeys = new Set(options.flatMap((group) => group.rooms.map((room) => roomSelectionKey(group.roomCategoryId, room.roomId))));
                setRoomSelectorModalState((current) => ({
                    ...current,
                    roomOptions: options,
                    expandedRoomTypes: options.map((item) => item.roomCategoryId),
                    selectedRooms: current.selectedRooms.filter((item) => validSelectionKeys.has(item)),
                    isLoading: false,
                    error: '',
                }));
            }
            catch (requestError) {
                if (controller.signal.aborted)
                    return;
                setRoomSelectorModalState((current) => ({
                    ...current,
                    roomOptions: [],
                    expandedRoomTypes: [],
                    selectedRooms: [],
                    isLoading: false,
                    error: `房型房间加载失败：${requestError instanceof Error ? requestError.message : String(requestError)}`,
                }));
            }
        }
        void loadRoomOptions();
        return () => controller.abort();
    }, [
        roomSelectorModal.open,
        roomSelectorModal.mode,
        roomSelectorModal.selectedStart,
        roomSelectorModal.selectedEnd,
        roomSelectorModal.selectedHour,
        roomSelectorModal.selectedMinute,
        roomSelectorModal.keyword,
    ]);
    const filteredOrders = useMemo(() => {
        const trimmedKeyword = keyword.trim().toLowerCase();
        const rows = data?.rows ?? [];
        if (!trimmedKeyword)
            return rows;
        return rows.filter((order) => [
            order.orderNo,
            order.channelOrderNo,
            order.room,
            order.roomType,
            order.contact,
            order.phone,
            order.channel,
            order.store,
        ]
            .join(' ')
            .toLowerCase()
            .includes(trimmedKeyword));
    }, [data?.rows, keyword]);
    const handleReset = useCallback(() => {
        setKeyword('');
        setActiveFilter('全部');
        setFiltersExpanded(false);
        setColumnsExpanded(false);
        setActionMessage('筛选条件已重置，正在重新请求住宿订单。');
        setRequestRevision((value) => value + 1);
    }, []);
    const handleBlockedAction = useCallback((label) => {
        const actionMessages = {
            导出明细: '导出明细任务已创建，范围为当前筛选结果。',
            录入订单: '录入订单面板已准备，可继续补充联系人、房型与入住时间。',
            排房: '排房面板已准备，可按当前订单选择可用房间。',
            登记入住人: '入住人登记面板已准备，可补充证件与联系方式。',
            更多操作: '更多操作菜单已展开，可选择订单改期、备注或标签维护。',
            收款: '收款面板已准备，可选择支付方式并核对待收金额。',
            续住: '续住面板已准备，可选择新的离店日期。',
            入住: '入住确认已打开，请核对房间与入住人信息。',
            退房: '退房确认已打开，请核对消费、押金与欠款。',
        };
        setActionMessage(actionMessages[label] ?? `${label}操作已响应，请在订单详情中继续处理。`);
    }, []);
    const handleOrderCancelled = useCallback((orderNo, message) => {
        setData((current) => {
            if (!current)
                return current;
            return {
                ...current,
                rows: current.rows.map((row) => row.orderNo === orderNo
                    ? {
                        ...row,
                        status: '已取消',
                        liveStatus: '已取消',
                    }
                    : row),
            };
        });
        setSelectedOrder((current) => current?.orderNo === orderNo
            ? {
                ...current,
                status: '已取消',
                liveStatus: '已取消',
            }
            : current);
        setActionMessage(message);
        setRequestRevision((value) => value + 1);
    }, []);
    const handleOrderSkippedStock = useCallback((orderNo, message) => {
        setData((current) => {
            if (!current)
                return current;
            return {
                ...current,
                rows: current.rows.map((row) => row.orderNo === orderNo
                    ? {
                        ...row,
                        room: '-',
                        stockFlag: '',
                        roomFlag: '未排房',
                        needsRoomAssignment: true,
                    }
                    : row),
            };
        });
        setSelectedOrder((current) => current?.orderNo === orderNo
            ? {
                ...current,
                room: '-',
                stockFlag: '',
                roomFlag: '未排房',
                needsRoomAssignment: true,
            }
            : current);
        setActionMessage(message);
        setRequestRevision((value) => value + 1);
    }, []);
    const setFullDayForm = useCallback((updater) => {
        setFullDayFormState((current) => updater(current));
    }, []);
    const setHourlyForm = useCallback((updater) => {
        setHourlyFormState((current) => updater(current));
    }, []);
    const setLongRentalForm = useCallback((updater) => {
        setLongRentalFormState((current) => updater(current));
    }, []);
    const setRoomSelectorModal = useCallback((updater) => {
        setRoomSelectorModalState((current) => updater(current));
    }, []);
    const setReminderModal = useCallback((updater) => {
        setReminderModalState((current) => updater(current));
    }, []);
    const setTagSelectorModal = useCallback((updater) => {
        setTagSelectorModalState((current) => updater(current));
    }, []);
    const openEntryDrawer = useCallback((type = 'fullDay') => {
        setEntryOrderType(type);
        setIsEntryDrawerOpen(true);
        setActionMessage(`已打开${type === 'fullDay' ? '全日房' : type === 'hourly' ? '钟点房' : '长租房'}录入面板。`);
    }, []);
    const closeEntryDrawer = useCallback(() => {
        setIsEntryDrawerOpen(false);
        setEntryOrderType('fullDay');
        setFullDayFormState(createStayForm());
        setHourlyFormState(createStayForm('hourly'));
        setLongRentalFormState(createLongRentalEntryForm());
        setRoomSelectorModalState(createRoomSelectorModalState());
        setReminderModalState(createReminderModalState());
        setTagSelectorModalState(createTagSelectorModalState());
        setIsSubmittingOrder(false);
    }, []);
    const requestText = data
        ? `已通过住宿订单数据服务刷新：${data.requestPaths.join('、')}，共 ${data.total} 条`
        : isLoading
            ? '正在请求住宿订单数据服务'
            : '等待住宿订单请求结果';
    const visibleColumns = useMemo(() => resolveVisibleColumns(houseBaseColumns, columnsExpanded), [columnsExpanded]);
    const tableClassName = `order-table order-table--house ${columnsExpanded ? 'is-columns-expanded' : 'is-columns-collapsed'}`;
    return (_jsxs("div", { className: "page-stack order-page", children: [_jsx("h1", { children: "\u4F4F\u5BBF\u8BA2\u5355" }), _jsxs("section", { className: "order-filter-panel", "aria-label": "\u4F4F\u5BBF\u8BA2\u5355\u7B5B\u9009", children: [_jsx("div", { className: "order-filter-tabs", role: "radiogroup", "aria-label": "\u8BA2\u5355\u5FEB\u6377\u7B5B\u9009", children: quickFilters.map((filter) => (_jsx("button", { type: "button", role: "radio", "aria-checked": activeFilter === filter, className: activeFilter === filter ? 'is-active' : '', disabled: isLoading, onClick: () => setActiveFilter(filter), children: filter }, filter))) }), _jsxs("div", { className: "order-filter-row", children: [_jsx("input", { type: "text", value: keyword, onChange: (event) => setKeyword(event.target.value), placeholder: "\u8F93\u5165\u8BA2\u5355\u53F7/\u6E20\u9053\u8BA2\u5355\u53F7/\u623F\u95F4\u53F7/\u59D3\u540D/\u624B\u673A\u53F7", "aria-label": "\u4F4F\u5BBF\u8BA2\u5355\u5173\u952E\u8BCD" }), _jsxs("div", { className: "order-filter-actions", children: [_jsx("button", { type: "button", className: "order-link-action", "data-testid": "order-filter-toggle", onClick: () => setFiltersExpanded((value) => !value), children: filtersExpanded ? '收起' : '展开' }), _jsx("button", { type: "button", className: "order-outline-action", onClick: handleReset, disabled: isLoading, children: "\u91CD\u7F6E\u7B5B\u9009" }), _jsx("button", { type: "button", className: "order-primary-action", onClick: () => handleBlockedAction('导出明细'), children: "\u5BFC\u51FA\u660E\u7EC6" }), _jsx("button", { type: "button", className: "order-primary-action", onClick: () => openEntryDrawer('fullDay'), children: "\u5F55\u5165\u8BA2\u5355" })] })] }), filtersExpanded ? (_jsxs("div", { className: "order-advanced-filters", children: [_jsxs("label", { children: [_jsx("span", { children: "\u8BA2\u5355\u72B6\u6001" }), _jsxs("select", { defaultValue: "", onChange: () => handleBlockedAction('订单状态筛选'), children: [_jsx("option", { value: "", children: "\u5168\u90E8" }), _jsx("option", { children: "\u8FDB\u884C\u4E2D" }), _jsx("option", { children: "\u5DF2\u9884\u8BA2" }), _jsx("option", { children: "\u5DF2\u5B8C\u6210" }), _jsx("option", { children: "\u5DF2\u53D6\u6D88" })] })] }), _jsxs("label", { children: [_jsx("span", { children: "\u6E20\u9053" }), _jsxs("select", { defaultValue: "", onChange: () => handleBlockedAction('渠道筛选'), children: [_jsx("option", { value: "", children: "\u5168\u90E8\u6E20\u9053" }), _jsx("option", { children: "\u643A\u7A0B" }), _jsx("option", { children: "\u8DEF\u5BA2\u4E91\u805A\u5408" }), _jsx("option", { children: "\u98DE\u732A\u6DD8\u9152\u5E97" }), _jsx("option", { children: "\u9014\u5BB6" })] })] }), _jsxs("label", { children: [_jsx("span", { children: "\u5165\u4F4F\u65E5\u671F" }), _jsx("input", { type: "text", placeholder: "\u5F00\u59CB\u65E5\u671F - \u7ED3\u675F\u65E5\u671F", onFocus: () => handleBlockedAction('入住日期筛选') })] }), _jsxs("label", { children: [_jsx("span", { children: "\u79BB\u5F00\u65E5\u671F" }), _jsx("input", { type: "text", placeholder: "\u5F00\u59CB\u65E5\u671F - \u7ED3\u675F\u65E5\u671F", onFocus: () => handleBlockedAction('离开日期筛选') })] })] })) : null, _jsx("div", { className: "order-request-status", role: "status", "aria-label": "\u4F4F\u5BBF\u8BA2\u5355\u8BF7\u6C42\u72B6\u6001", children: requestText }), actionMessage ? (_jsx("div", { className: "order-action-feedback", role: "status", "aria-label": "\u4F4F\u5BBF\u8BA2\u5355\u64CD\u4F5C\u53CD\u9988", children: actionMessage })) : null, error ? (_jsxs("div", { className: "order-request-error", role: "alert", children: [_jsx("span", { children: error }), _jsx("button", { type: "button", onClick: () => setRequestRevision((value) => value + 1), children: "\u91CD\u8BD5" })] })) : null] }), _jsxs("section", { className: "order-table-card", "aria-busy": isLoading, children: [_jsx("div", { className: "order-table-scroll", children: _jsxs("div", { className: tableClassName, role: "table", "aria-label": "\u4F4F\u5BBF\u8BA2\u5355\u5217\u8868", children: [_jsx("div", { className: "order-table__head", role: "row", children: visibleColumns.map((column) => renderOrderColumnHeader(column, columnsExpanded, () => setColumnsExpanded((value) => !value))) }), isLoading ? (_jsx("div", { className: "order-table__empty", role: "row", children: _jsx("div", { role: "cell", children: "\u6B63\u5728\u52A0\u8F7D\u4F4F\u5BBF\u8BA2\u5355..." }) })) : null, !isLoading && !error
                                    ? filteredOrders.map((order) => (_jsxs("div", { className: "order-table__row", role: "row", children: [_jsx("div", { role: "cell", className: "order-no", children: order.orderNo }), _jsx("div", { role: "cell", children: order.channel }), _jsx("div", { role: "cell", children: _jsx("span", { className: `order-status ${statusTone(order.status)}`, children: order.status }) }), _jsx("div", { role: "cell", children: order.contact }), _jsx("div", { role: "cell", children: order.phone }), _jsx("div", { role: "cell", children: order.stayType }), _jsx("div", { role: "cell", className: "order-room-type", children: order.roomType }), _jsx("div", { role: "cell", className: order.needsRoomAssignment ? 'needs-room' : undefined, children: order.needsRoomAssignment ? (_jsxs(_Fragment, { children: [_jsx("span", { children: order.room }), _jsx("em", { children: "\u672A\u6392\u623F" })] })) : (order.room) }), _jsx("div", { role: "cell", children: order.store }), _jsx("div", { role: "cell", children: order.checkInAt }), _jsx("div", { role: "cell", children: order.leaveAt }), _jsx("div", { role: "cell", children: _jsx("span", { className: `order-status ${statusTone(order.liveStatus)}`, children: order.liveStatus }) }), _jsx("div", { role: "cell", children: order.afterSaleStatus }), _jsx("div", { role: "cell", children: order.roomRevenueNet }), _jsx("div", { role: "cell", children: order.otherExpense }), _jsx("div", { role: "cell", children: order.roomRevenueGross }), _jsx("div", { role: "cell", children: order.totalRevenue }), _jsx("div", { role: "cell", children: order.debt }), _jsx("div", { role: "cell", children: order.bookedAt }), _jsx("div", { role: "cell", children: order.channelOrderNo }), _jsxs("div", { role: "cell", className: "order-action-cell order-action-cell--edge", children: [order.needsRoomAssignment ? (_jsx("button", { type: "button", onClick: () => handleBlockedAction('排房'), children: "\u6392\u623F" })) : null, _jsx("button", { type: "button", onClick: () => setSelectedOrder(order), children: "\u8BE6\u60C5" })] }), columnsExpanded ? (_jsxs(_Fragment, { children: [_jsx("div", { role: "cell", className: "order-fixed-flag-cell order-fixed-flag-cell--stock", children: renderOrderFlagIndicator('stock', order.stockFlag) }), _jsx("div", { role: "cell", className: "order-fixed-flag-cell order-fixed-flag-cell--room", children: renderOrderFlagIndicator('room', order.roomFlag, !order.needsRoomAssignment) }), _jsx("div", { role: "cell", className: "order-fixed-flag-cell order-fixed-flag-cell--plan", children: renderOrderFlagIndicator('plan', order.planFlag) })] })) : null] }, order.orderNo)))
                                    : null, !isLoading && !error && filteredOrders.length === 0 ? (_jsx("div", { className: "order-table__empty", role: "row", children: _jsx("div", { role: "cell", children: "\u6682\u65E0\u6570\u636E" }) })) : null] }) }), _jsxs("footer", { className: "order-pagination", children: [_jsxs("span", { children: ["\u5171 ", data?.total ?? 0, " \u6761"] }), _jsx("button", { type: "button", "aria-label": "\u4E0A\u4E00\u9875", disabled: true, children: '<' }), _jsx("button", { type: "button", className: "is-active", children: data?.pageNum ?? 1 }), _jsx("button", { type: "button", "aria-label": "\u4E0B\u4E00\u9875", disabled: !data?.pages || data.pageNum >= data.pages, onClick: () => handleBlockedAction('下一页'), children: '>' }), _jsxs("span", { children: [data?.pageSize ?? 20, " \u6761/\u9875"] })] })] }), selectedOrder ? (_jsx(OrderDetail, { order: selectedOrder, onClose: () => setSelectedOrder(null), onBlockedAction: handleBlockedAction, onOrderCancelled: handleOrderCancelled, onOrderSkippedStock: handleOrderSkippedStock })) : null, _jsx(OrderEntryDrawer, { isOpen: isEntryDrawerOpen, orderType: entryOrderType, fullDayForm: fullDayForm, hourlyForm: hourlyForm, longRentalForm: longRentalForm, roomSelectorModal: roomSelectorModal, reminderModal: reminderModal, tagSelectorModal: tagSelectorModal, onClose: closeEntryDrawer, onTypeChange: setEntryOrderType, setFullDayForm: setFullDayForm, setHourlyForm: setHourlyForm, setLongRentalForm: setLongRentalForm, setRoomSelectorModal: setRoomSelectorModal, setReminderModal: setReminderModal, setTagSelectorModal: setTagSelectorModal, onCreated: () => setRequestRevision((value) => value + 1), setActionMessage: setActionMessage, isSubmitting: isSubmittingOrder, setIsSubmitting: setIsSubmittingOrder })] }));
}
export function OrdersPage({ variant = 'house' }) {
    return variant === 'longRental' ? _jsx(LongRentalOrdersPage, {}) : _jsx(HouseOrdersPage, {});
}
