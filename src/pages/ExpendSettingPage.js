import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useMemo, useState } from 'react';
import { createExpendSettingItem, fetchExpendSettingDashboard, getDefaultExpendSettingQuery, } from '../services/expendSetting';
import './ExpendSettingPage.css';
const pageHint = '系统默认项目不支持编辑和删除，可直接拖动调整排序。';
const statusOptions = [
    { id: 'enabled', name: '启用' },
    { id: 'disabled', name: '停用' },
];
export function ExpendSettingPage() {
    const defaultQuery = useMemo(() => getDefaultExpendSettingQuery(), []);
    const [activeTab, setActiveTab] = useState(defaultQuery.tab);
    const [dashboard, setDashboard] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [feedback, setFeedback] = useState('正在加载收入/支出设置');
    const [dialogOpen, setDialogOpen] = useState(false);
    const [groupMenuOpen, setGroupMenuOpen] = useState(false);
    const [statusMenuOpen, setStatusMenuOpen] = useState(false);
    const [selectedGroupName, setSelectedGroupName] = useState('');
    const [selectedStatus, setSelectedStatus] = useState('enabled');
    const [nameDraft, setNameDraft] = useState('');
    const [dialogError, setDialogError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [draggingItem, setDraggingItem] = useState(null);
    useEffect(() => {
        void loadDashboard(activeTab);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeTab]);
    const serviceRequest = dashboard?.request ?? { campId: defaultQuery.campId, tab: activeTab };
    const serviceContract = {
        provider: dashboard?.provider ?? 'mock',
        state: error ? 'error' : dashboard?.state ?? 'success',
        request: serviceRequest,
        endpoints: dashboard?.endpoints ?? [],
        timestamp: dashboard?.timestamp ?? '',
        traceIds: dashboard?.traceIds ?? [],
    };
    const currentListLabel = activeTab === 'income' ? '收入项目列表' : '支出项目列表';
    const currentEmptyLabel = activeTab === 'income' ? '收入项目空态' : '支出项目空态';
    const currentEmptyMessage = activeTab === 'income' ? '当前门店暂未配置收入项目' : '当前门店暂未配置支出项目';
    const currentSyncTitle = activeTab === 'income' ? '已同步收入项目配置' : '已同步支出项目配置';
    const businessTypeOptions = dashboard?.businessTypeOptions ?? [];
    const disabledItems = dashboard?.disabledGroups.flatMap((group) => group.items) ?? [];
    const selectedStatusOption = statusOptions.find((option) => option.id === selectedStatus) ?? statusOptions[0];
    async function loadDashboard(nextTab) {
        setIsLoading(true);
        setError('');
        setDialogError('');
        setGroupMenuOpen(false);
        setFeedback(nextTab === 'income' ? '正在加载收入项目' : '正在加载支出项目');
        try {
            const nextDashboard = await fetchExpendSettingDashboard({
                campId: defaultQuery.campId,
                tab: nextTab,
            });
            setDashboard(nextDashboard);
            setFeedback(nextTab === 'income' ? '已同步收入项目配置' : '已同步支出项目配置');
        }
        catch (loadError) {
            setDashboard(null);
            const nextError = loadError instanceof Error ? loadError.message : '收入/支出设置数据加载失败，请稍后重试';
            setError(nextError);
            setFeedback(nextError);
        }
        finally {
            setIsLoading(false);
        }
    }
    function openDialog(groupName = '') {
        setDialogOpen(true);
        setGroupMenuOpen(false);
        setStatusMenuOpen(false);
        setSelectedGroupName(groupName);
        setSelectedStatus('enabled');
        setNameDraft('');
        setDialogError('');
    }
    function closeDialog() {
        setDialogOpen(false);
        setGroupMenuOpen(false);
        setStatusMenuOpen(false);
        setSelectedGroupName('');
        setSelectedStatus('enabled');
        setNameDraft('');
        setDialogError('');
        setIsSubmitting(false);
    }
    async function handleSubmit(event) {
        event.preventDefault();
        const trimmedName = nameDraft.trim();
        if (!selectedGroupName) {
            setDialogError('请选择业态');
            return;
        }
        if (!trimmedName) {
            setDialogError('请输入项目名称');
            return;
        }
        setDialogError('');
        setIsSubmitting(true);
        try {
            const result = await createExpendSettingItem({
                campId: serviceRequest.campId,
                tab: activeTab,
                groupName: selectedGroupName,
                name: trimmedName,
                status: selectedStatus,
            });
            setDashboard((current) => {
                if (!current)
                    return current;
                return {
                    ...current,
                    groups: selectedStatus === 'enabled'
                        ? appendItemToGroups(current.groups, selectedGroupName, result.item)
                        : current.groups,
                    disabledGroups: selectedStatus === 'disabled'
                        ? appendItemToGroups(current.disabledGroups, selectedGroupName, result.item)
                        : current.disabledGroups,
                };
            });
            setFeedback(result.message);
            closeDialog();
        }
        catch (submitError) {
            const nextError = submitError instanceof Error ? submitError.message : '新增项目失败，请稍后重试';
            setDialogError(nextError);
            setFeedback(nextError);
            setIsSubmitting(false);
        }
    }
    function handleSortDrop(groupName, targetItemId) {
        if (!draggingItem || draggingItem.groupName !== groupName || draggingItem.itemId === targetItemId) {
            setDraggingItem(null);
            return;
        }
        setDashboard((current) => {
            if (!current)
                return current;
            return {
                ...current,
                groups: current.groups.map((group) => {
                    if (group.name !== groupName)
                        return group;
                    const items = [...group.items];
                    const fromIndex = items.findIndex((item) => item.id === draggingItem.itemId);
                    const toIndex = items.findIndex((item) => item.id === targetItemId);
                    if (fromIndex < 0 || toIndex < 0 || fromIndex === toIndex)
                        return group;
                    const [movedItem] = items.splice(fromIndex, 1);
                    items.splice(toIndex, 0, movedItem);
                    return {
                        ...group,
                        items,
                    };
                }),
            };
        });
        setFeedback(activeTab === 'income' ? '收入项目排序已更新' : '支出项目排序已更新');
        setDraggingItem(null);
    }
    return (_jsxs("div", { className: "expend-setting-page", "data-provider": serviceContract.provider, "data-response-state": serviceContract.state, children: [_jsx("pre", { hidden: true, "data-testid": "expend-setting-service-contract", "data-provider": serviceContract.provider, "data-state": serviceContract.state, "data-request": JSON.stringify(serviceContract.request), "data-endpoints": JSON.stringify(serviceContract.endpoints), children: JSON.stringify(serviceContract, null, 2) }), _jsxs("section", { className: "expend-setting-card", "aria-label": "\u6536\u5165\u652F\u51FA\u8BBE\u7F6E", children: [_jsx("div", { className: "expend-setting-feedback", role: "status", "aria-label": "\u6536\u5165\u652F\u51FA\u8BBE\u7F6E\u64CD\u4F5C\u53CD\u9988", children: feedback }), _jsxs("header", { className: "expend-setting-toolbar", children: [_jsx("p", { children: pageHint }), _jsx("button", { type: "button", className: "expend-setting-primary", "aria-label": "\u65B0\u589E", "data-testid": "expend-setting-top-add", onClick: () => openDialog(), disabled: isLoading || isSubmitting, children: "\u65B0\u589E" })] }), _jsxs("div", { className: "expend-setting-tabs", role: "tablist", "aria-label": "\u6536\u5165\u652F\u51FA\u8BBE\u7F6E\u9875\u7B7E", children: [_jsx("button", { type: "button", role: "tab", "aria-selected": activeTab === 'income', className: activeTab === 'income' ? 'is-active' : '', onClick: () => setActiveTab('income'), children: "\u6536\u5165\u9879" }), _jsx("button", { type: "button", role: "tab", "aria-selected": activeTab === 'expense', className: activeTab === 'expense' ? 'is-active' : '', onClick: () => setActiveTab('expense'), children: "\u652F\u51FA\u9879" })] }), error ? (_jsxs("section", { role: "alert", "aria-label": "\u6536\u5165\u652F\u51FA\u8BBE\u7F6E\u52A0\u8F7D\u5931\u8D25", className: "expend-setting-alert", children: [_jsx("p", { children: error }), _jsx("button", { type: "button", onClick: () => void loadDashboard(activeTab), children: "\u91CD\u65B0\u52A0\u8F7D" })] })) : null, isLoading ? (_jsx("section", { role: "status", "aria-label": "\u6536\u5165\u652F\u51FA\u8BBE\u7F6E\u52A0\u8F7D\u4E2D", className: "expend-setting-empty-box", children: _jsx("p", { children: "\u6B63\u5728\u52A0\u8F7D\u6536\u5165/\u652F\u51FA\u8BBE\u7F6E..." }) })) : null, !isLoading && !error && dashboard ? (_jsxs("section", { className: "expend-setting-content", children: [_jsx("p", { className: "expend-setting-section-title", children: currentSyncTitle }), dashboard.groups.length === 0 ? (_jsx("section", { role: "status", "aria-label": currentEmptyLabel, className: "expend-setting-empty-box", children: _jsx("p", { children: currentEmptyMessage }) })) : (_jsxs("section", { className: "expend-setting-groups", "aria-label": currentListLabel, children: [dashboard.groups.map((group) => (_jsxs("section", { className: "expend-setting-group", "data-testid": "expend-setting-group", "data-group-name": group.name, children: [_jsx("h2", { children: group.name }), group.items.length > 0 ? (_jsx("div", { className: "expend-setting-item-grid", children: group.items.map((item) => (_jsx(ExpendItemCard, { item: item, groupName: group.name, isDragging: draggingItem?.itemId === item.id, onDragStart: () => setDraggingItem({ groupName: group.name, itemId: item.id }), onDragEnd: () => setDraggingItem(null), onDrop: () => handleSortDrop(group.name, item.id) }, item.id))) })) : (_jsxs("div", { className: "expend-setting-empty-box", children: [_jsx("p", { children: "\u6682\u65E0\u9879\u76EE\uFF0C" }), _jsx("button", { type: "button", onClick: () => openDialog(group.name), children: "\u70B9\u51FB\u65B0\u589E" })] }))] }, `${activeTab}-${group.id}`))), _jsx("div", { className: "expend-setting-divider" }), _jsxs("section", { className: "expend-setting-disabled", children: [_jsx("h2", { children: "\u5DF2\u505C\u7528\u9879" }), disabledItems.length > 0 ? (_jsx("div", { className: "expend-setting-item-grid", "aria-label": "\u5DF2\u505C\u7528\u9879\u76EE\u5217\u8868", children: disabledItems.map((item) => (_jsx(ExpendItemCard, { item: item, groupName: item.groupName, isDragging: false, onDragStart: () => undefined, onDragEnd: () => undefined, onDrop: () => undefined, isStatic: true }, item.id))) })) : (_jsx("div", { className: "expend-setting-empty-box", children: _jsx("p", { children: "\u6682\u65E0\u505C\u7528\u9879\u76EE" }) }))] })] }))] })) : null] }), dialogOpen ? (_jsx("div", { className: "expend-setting-modal-backdrop", children: _jsxs("section", { className: "expend-setting-modal", role: "dialog", "aria-modal": "true", "aria-label": "\u65B0\u589E", children: [_jsxs("header", { children: [_jsx("h2", { children: "\u65B0\u589E" }), _jsx("button", { type: "button", "aria-label": "\u5173\u95ED\u65B0\u589E", onClick: closeDialog, children: "\u00D7" })] }), _jsxs("form", { onSubmit: handleSubmit, children: [_jsxs("div", { className: "expend-setting-form-row", children: [_jsx("span", { children: "\u9009\u62E9\u4E1A\u6001:" }), _jsxs("div", { className: "expend-setting-select-shell", children: [_jsxs("button", { type: "button", className: `expend-setting-select${groupMenuOpen ? ' is-open' : ''}`, "data-testid": "expend-setting-group-select", "aria-haspopup": "listbox", "aria-expanded": groupMenuOpen, onClick: () => {
                                                        setGroupMenuOpen((current) => !current);
                                                        setStatusMenuOpen(false);
                                                    }, disabled: isSubmitting, children: [_jsx("span", { className: selectedGroupName ? '' : 'is-placeholder', children: selectedGroupName || '' }), _jsx("span", { className: "expend-setting-select-arrow", "aria-hidden": "true" })] }), groupMenuOpen ? (_jsx("ul", { className: "expend-setting-option-list", role: "listbox", "aria-label": "\u4E1A\u6001\u9009\u9879", children: businessTypeOptions.map((option) => (_jsx("li", { children: _jsx("button", { type: "button", role: "option", "aria-selected": option.name === selectedGroupName, className: option.name === selectedGroupName ? 'is-active' : '', onClick: () => {
                                                                setSelectedGroupName(option.name);
                                                                setGroupMenuOpen(false);
                                                                setDialogError('');
                                                            }, children: option.name }) }, option.id))) })) : null] })] }), _jsxs("label", { className: "expend-setting-form-row", children: [_jsxs("span", { children: [_jsx("em", { children: "*" }), "\u540D\u79F0:"] }), _jsx("input", { "aria-label": "\u540D\u79F0", value: nameDraft, onChange: (event) => {
                                                setNameDraft(event.target.value);
                                                setDialogError('');
                                            }, disabled: isSubmitting })] }), _jsxs("div", { className: "expend-setting-form-row", children: [_jsx("span", { children: "\u9009\u62E9\u72B6\u6001:" }), _jsxs("div", { className: "expend-setting-select-shell", children: [_jsxs("button", { type: "button", className: `expend-setting-select${statusMenuOpen ? ' is-open' : ''}`, "data-testid": "expend-setting-status-select", "aria-haspopup": "listbox", "aria-expanded": statusMenuOpen, onClick: () => {
                                                        setStatusMenuOpen((current) => !current);
                                                        setGroupMenuOpen(false);
                                                    }, disabled: isSubmitting, children: [_jsx("span", { children: selectedStatusOption.name }), _jsx("span", { className: "expend-setting-select-arrow", "aria-hidden": "true" })] }), statusMenuOpen ? (_jsx("ul", { className: "expend-setting-option-list", role: "listbox", "aria-label": "\u72B6\u6001\u9009\u9879", children: statusOptions.map((option) => (_jsx("li", { children: _jsx("button", { type: "button", role: "option", "aria-selected": option.id === selectedStatus, className: option.id === selectedStatus ? 'is-active' : '', onClick: () => {
                                                                setSelectedStatus(option.id);
                                                                setStatusMenuOpen(false);
                                                            }, children: option.name }) }, option.id))) })) : null] })] }), dialogError ? _jsx("p", { className: "expend-setting-form-error", children: dialogError }) : null, _jsxs("footer", { children: [_jsx("button", { type: "button", onClick: closeDialog, disabled: isSubmitting, children: "\u53D6\u6D88" }), _jsx("button", { type: "submit", className: "expend-setting-primary", disabled: isSubmitting, children: "\u5B8C\u6210" })] })] })] }) })) : null] }));
}
function ExpendItemCard({ item, groupName, isDragging, onDragStart, onDragEnd, onDrop, isStatic = false, }) {
    return (_jsxs("div", { className: `expend-setting-item${isDragging ? ' is-dragging' : ''}${isStatic ? ' is-static' : ''}`, "data-testid": "expend-setting-item", "data-group-name": groupName, "data-item-id": item.id, draggable: !isStatic, onDragStart: onDragStart, onDragEnd: onDragEnd, onDragOver: (event) => {
            if (!isStatic)
                event.preventDefault();
        }, onDrop: onDrop, children: [_jsx("span", { className: "expend-setting-drag", "aria-hidden": "true", children: "\u22EE\u22EE" }), _jsx("span", { className: "expend-setting-item-name", children: item.name }), _jsx("span", { className: "expend-setting-lock", "aria-hidden": "true" }), item.isDefault ? _jsx("span", { className: "expend-setting-default-badge", children: "\u9ED8\u8BA4" }) : null] }));
}
function appendItemToGroups(groups, groupName, item) {
    return groups.map((group) => group.name === groupName
        ? {
            ...group,
            items: [...group.items, item],
        }
        : group);
}
