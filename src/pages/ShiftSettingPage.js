import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { createDefaultShiftSettingFilters, fetchShiftSettingDashboard, saveShiftConfigs, saveShiftGoods, } from '../services/shiftSetting';
import './ShiftSettingPage.css';
export function ShiftSettingPage() {
    const location = useLocation();
    const filters = useMemo(() => createDefaultShiftSettingFilters(new URLSearchParams(location.search)), [location.search]);
    const [dashboard, setDashboard] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [feedback, setFeedback] = useState('正在加载交接班设置...');
    const [shiftDialogOpen, setShiftDialogOpen] = useState(false);
    const [goodsDialogOpen, setGoodsDialogOpen] = useState(false);
    const [shiftDrafts, setShiftDrafts] = useState([]);
    const [goodsDrafts, setGoodsDrafts] = useState([]);
    const [dialogError, setDialogError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    useEffect(() => {
        void loadDashboard(filters);
    }, [filters]);
    async function loadDashboard(nextFilters) {
        setIsLoading(true);
        setError('');
        try {
            const nextDashboard = await fetchShiftSettingDashboard(nextFilters);
            setDashboard(nextDashboard);
            setFeedback('已加载交接班设置');
        }
        catch (loadError) {
            setDashboard(null);
            setError(loadError instanceof Error ? loadError.message : '交接班设置加载失败，请稍后重试');
            setFeedback('交接班设置加载失败');
        }
        finally {
            setIsLoading(false);
        }
    }
    function openShiftDialog() {
        setDialogError('');
        setShiftDrafts(dashboard?.shiftConfigs.length ? dashboard.shiftConfigs.map(toShiftDraft) : [createEmptyShiftDraft()]);
        setShiftDialogOpen(true);
    }
    function openGoodsDialog() {
        setDialogError('');
        setGoodsDrafts(dashboard?.goodsConfigs.length ? dashboard.goodsConfigs.map(toGoodsDraft) : [createEmptyGoodsDraft()]);
        setGoodsDialogOpen(true);
    }
    async function submitShiftDrafts() {
        setIsSubmitting(true);
        setDialogError('');
        try {
            const result = await saveShiftConfigs(filters, shiftDrafts);
            setDashboard((current) => {
                if (!current)
                    return result.dashboard;
                return {
                    ...result.dashboard,
                    goodsConfigs: current.goodsConfigs,
                    goodsUpdatedAt: current.goodsUpdatedAt,
                };
            });
            setFeedback(result.message);
            setShiftDialogOpen(false);
        }
        catch (submitError) {
            const message = submitError instanceof Error ? submitError.message : '保存班次设置失败';
            setDialogError(message);
            setFeedback(message);
        }
        finally {
            setIsSubmitting(false);
        }
    }
    async function submitGoodsDrafts() {
        setIsSubmitting(true);
        setDialogError('');
        try {
            const result = await saveShiftGoods(filters, goodsDrafts);
            setDashboard((current) => {
                if (!current)
                    return result.dashboard;
                return {
                    ...result.dashboard,
                    shiftConfigs: current.shiftConfigs,
                    shiftUpdatedAt: current.shiftUpdatedAt,
                };
            });
            setFeedback(result.message);
            setGoodsDialogOpen(false);
        }
        catch (submitError) {
            const message = submitError instanceof Error ? submitError.message : '保存交班物品失败';
            setDialogError(message);
            setFeedback(message);
        }
        finally {
            setIsSubmitting(false);
        }
    }
    const provider = dashboard?.provider ?? 'mock';
    const pageState = error ? 'error' : isLoading ? 'loading' : filters.mockState;
    const serviceAudit = [
        ...(dashboard?.audit ?? []),
        ...(dashboard ? [] : [`provider=${provider}`, `mockState=${filters.mockState}`, 'shiftCount=0', 'goodsCount=0']),
    ];
    return (_jsxs(_Fragment, { children: [_jsx("pre", { id: "shift-setting-service-contract", hidden: true, "aria-label": "\u4EA4\u63A5\u73ED\u8BBE\u7F6E\u6570\u636E\u670D\u52A1", "data-provider": provider, "data-state": pageState, children: serviceAudit.join('\n') }), _jsxs("div", { className: "shift-setting-page", "data-provider": provider, "data-state": pageState, children: [_jsx("div", { className: "shift-setting-status", role: "status", "aria-label": "\u4EA4\u63A5\u73ED\u8BBE\u7F6E\u64CD\u4F5C\u53CD\u9988", children: feedback }), error ? (_jsxs("section", { className: "shift-setting-state shift-setting-state--error", role: "alert", "aria-label": "\u4EA4\u63A5\u73ED\u8BBE\u7F6E\u6570\u636E\u9519\u8BEF", children: [_jsx("h2", { children: "\u4EA4\u63A5\u73ED\u8BBE\u7F6E\u52A0\u8F7D\u5931\u8D25\uFF0C\u8BF7\u7A0D\u540E\u91CD\u8BD5" }), _jsx("p", { children: error }), _jsx("button", { type: "button", className: "shift-setting-primary", onClick: () => void loadDashboard(filters), children: "\u91CD\u65B0\u52A0\u8F7D\u4EA4\u63A5\u73ED\u8BBE\u7F6E" })] })) : null, _jsxs("section", { className: "shift-setting-section", role: "region", "aria-label": "\u73ED\u6B21\u8BBE\u7F6E", children: [_jsxs("header", { className: "shift-setting-section__header", children: [_jsxs("div", { className: "shift-setting-section__title", children: [_jsx("h2", { children: "\u73ED\u6B21\u8BBE\u7F6E" }), _jsxs("span", { children: ["\u6700\u8FD1\u66F4\u65B0\u65F6\u95F4\uFF1A", dashboard?.shiftUpdatedAt ?? '-'] })] }), _jsx("button", { type: "button", className: "shift-setting-primary", onClick: openShiftDialog, disabled: isLoading || Boolean(error), children: "\u73ED\u6B21\u8BBE\u7F6E" })] }), isLoading ? (_jsx("div", { className: "shift-setting-panel shift-setting-panel--loading", children: "\u6B63\u5728\u52A0\u8F7D\u73ED\u6B21\u8BBE\u7F6E..." })) : (_jsxs("div", { className: "shift-setting-table-wrap", "data-testid": "shift-setting-table", children: [_jsxs("table", { className: "shift-setting-table", children: [_jsx("thead", { children: _jsxs("tr", { children: [_jsx("th", { className: "shift-setting-col", children: "\u73ED\u6B21\u540D\u79F0" }), _jsx("th", { className: "shift-setting-col", children: "\u5F00\u59CB\u65F6\u95F4" }), _jsx("th", { className: "shift-setting-col", children: "\u7ED3\u675F\u65F6\u95F4" }), _jsx("th", { className: "shift-setting-col--members", children: "\u73ED\u6B21\u6210\u5458" })] }) }), dashboard && dashboard.shiftConfigs.length > 0 ? (_jsx("tbody", { children: dashboard.shiftConfigs.map((item) => (_jsxs("tr", { children: [_jsx("td", { children: item.name }), _jsx("td", { children: item.startTime }), _jsx("td", { children: item.endTime }), _jsx("td", { children: item.memberNames.join('、') })] }, item.id))) })) : null] }), !dashboard || dashboard.shiftConfigs.length === 0 ? (_jsxs("div", { className: "shift-setting-empty", "data-testid": "shift-setting-empty-shifts", children: [_jsx("span", { children: "\u6682\u65E0\u73ED\u6B21\uFF0C" }), _jsx("button", { type: "button", onClick: openShiftDialog, children: "\u70B9\u51FB\u65B0\u589E" })] })) : null] }))] }), _jsxs("section", { className: "shift-setting-section shift-setting-section--goods", role: "region", "aria-label": "\u4EA4\u73ED\u7269\u54C1", children: [_jsxs("header", { className: "shift-setting-section__header", children: [_jsxs("div", { className: "shift-setting-section__title", children: [_jsx("h2", { children: "\u4EA4\u73ED\u7269\u54C1" }), _jsxs("span", { children: ["\u6700\u8FD1\u66F4\u65B0\u65F6\u95F4\uFF1A", dashboard?.goodsUpdatedAt ?? '-'] })] }), _jsx("button", { type: "button", className: "shift-setting-primary", onClick: openGoodsDialog, disabled: isLoading || Boolean(error), children: "\u6DFB\u52A0\u7269\u54C1" })] }), isLoading ? (_jsx("div", { className: "shift-setting-panel shift-setting-panel--loading", children: "\u6B63\u5728\u52A0\u8F7D\u4EA4\u73ED\u7269\u54C1..." })) : dashboard && dashboard.goodsConfigs.length > 0 ? (_jsx("div", { className: "shift-setting-goods-list", children: dashboard.goodsConfigs.map((item) => (_jsxs("article", { className: "shift-setting-goods-item", children: [_jsx("strong", { children: item.name }), _jsxs("span", { children: ["\u66F4\u65B0\u65F6\u95F4\uFF1A", item.updatedAt || '-'] })] }, item.id))) })) : (_jsxs("div", { className: "shift-setting-panel shift-setting-panel--empty", "data-testid": "shift-setting-empty-goods", children: [_jsx("span", { children: "\u6682\u65E0\u4EA4\u73ED\u7269\u54C1\uFF0C" }), _jsx("button", { type: "button", onClick: openGoodsDialog, children: "\u70B9\u51FB\u65B0\u589E" })] }))] }), shiftDialogOpen ? (_jsx("div", { className: "shift-setting-modal-mask", children: _jsxs("section", { className: "shift-setting-modal", role: "dialog", "aria-modal": "true", "aria-label": "\u73ED\u6B21\u8BBE\u7F6E", children: [_jsxs("header", { className: "shift-setting-modal__header", children: [_jsx("h2", { children: "\u73ED\u6B21\u8BBE\u7F6E" }), _jsx("button", { type: "button", "aria-label": "\u5173\u95ED\u73ED\u6B21\u8BBE\u7F6E", onClick: () => setShiftDialogOpen(false), children: "\u00D7" })] }), _jsxs("div", { className: "shift-setting-modal__body", children: [dialogError ? _jsx("div", { className: "shift-setting-dialog-error", children: dialogError }) : null, _jsx("button", { type: "button", className: "shift-setting-outline", onClick: () => setShiftDrafts((current) => [...current, createEmptyShiftDraft()]), children: "+ \u65B0\u589E\u73ED\u6B21" }), _jsx("div", { className: "shift-setting-dialog-list", children: shiftDrafts.map((draft, index) => (_jsxs("div", { className: "shift-setting-shift-row", children: [_jsx("input", { placeholder: "\u8BF7\u8F93\u5165\u73ED\u6B21\u540D\u79F0", value: draft.name, onChange: (event) => patchShiftDraft(setShiftDrafts, index, { name: event.target.value }) }), _jsx("input", { "aria-label": "\u5F00\u59CB\u65F6\u95F4", placeholder: "08:00", value: draft.startTime, onChange: (event) => patchShiftDraft(setShiftDrafts, index, { startTime: event.target.value }) }), _jsx("input", { "aria-label": "\u7ED3\u675F\u65F6\u95F4", placeholder: "18:00", value: draft.endTime, onChange: (event) => patchShiftDraft(setShiftDrafts, index, { endTime: event.target.value }) }), _jsx("select", { multiple: true, "aria-label": "\u73ED\u6B21\u6210\u5458", value: draft.memberIds, onChange: (event) => patchShiftDraft(setShiftDrafts, index, {
                                                            memberIds: [...event.currentTarget.selectedOptions].map((option) => option.value),
                                                        }), children: (dashboard?.memberOptions ?? []).map((option) => (_jsx("option", { value: option.value, children: option.label }, option.value))) })] }, `shift-draft-${index}`))) })] }), _jsxs("footer", { className: "shift-setting-modal__footer", children: [_jsx("button", { type: "button", className: "shift-setting-cancel", onClick: () => setShiftDialogOpen(false), disabled: isSubmitting, children: "\u53D6\u6D88" }), _jsx("button", { type: "button", className: "shift-setting-confirm", onClick: () => void submitShiftDrafts(), disabled: isSubmitting, children: "\u786E\u5B9A" })] })] }) })) : null, goodsDialogOpen ? (_jsx("div", { className: "shift-setting-modal-mask", children: _jsxs("section", { className: "shift-setting-modal shift-setting-modal--goods", role: "dialog", "aria-modal": "true", "aria-label": "\u6DFB\u52A0\u7269\u54C1", children: [_jsxs("header", { className: "shift-setting-modal__header", children: [_jsx("h2", { children: "\u6DFB\u52A0\u7269\u54C1" }), _jsx("button", { type: "button", "aria-label": "\u5173\u95ED\u6DFB\u52A0\u7269\u54C1", onClick: () => setGoodsDialogOpen(false), children: "\u00D7" })] }), _jsxs("div", { className: "shift-setting-modal__body", children: [dialogError ? _jsx("div", { className: "shift-setting-dialog-error", children: dialogError }) : null, _jsx("button", { type: "button", className: "shift-setting-outline", onClick: () => setGoodsDrafts((current) => [...current, createEmptyGoodsDraft()]), children: "+ \u65B0\u589E\u7269\u54C1" }), _jsx("div", { className: "shift-setting-dialog-list", children: goodsDrafts.map((draft, index) => (_jsx("div", { className: "shift-setting-item-row", children: _jsx("input", { placeholder: "\u8BF7\u8F93\u5165\u7269\u54C1\u540D\u79F0", value: draft.name, onChange: (event) => patchGoodsDraft(setGoodsDrafts, index, { name: event.target.value }) }) }, `goods-draft-${index}`))) })] }), _jsxs("footer", { className: "shift-setting-modal__footer", children: [_jsx("button", { type: "button", className: "shift-setting-cancel", onClick: () => setGoodsDialogOpen(false), disabled: isSubmitting, children: "\u53D6\u6D88" }), _jsx("button", { type: "button", className: "shift-setting-confirm", onClick: () => void submitGoodsDrafts(), disabled: isSubmitting, children: "\u786E\u5B9A" })] })] }) })) : null] })] }));
}
function createEmptyShiftDraft() {
    return { name: '', startTime: '', endTime: '', memberIds: [] };
}
function createEmptyGoodsDraft() {
    return { name: '' };
}
function toShiftDraft(item) {
    return {
        id: item.id,
        name: item.name,
        startTime: item.startTime,
        endTime: item.endTime,
        memberIds: [...item.memberIds],
    };
}
function toGoodsDraft(item) {
    return {
        id: item.id,
        name: item.name,
    };
}
function patchShiftDraft(setDrafts, index, patch) {
    setDrafts((current) => current.map((item, itemIndex) => (itemIndex === index ? { ...item, ...patch } : item)));
}
function patchGoodsDraft(setDrafts, index, patch) {
    setDrafts((current) => current.map((item, itemIndex) => (itemIndex === index ? { ...item, ...patch } : item)));
}
