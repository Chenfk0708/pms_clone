import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createDefaultMemberEquityFilters, createMemberEquityItem, deleteMemberEquityItem, fetchMemberEquityDashboard, saveMemberEquitySort, updateMemberEquityItem, } from '../services/memberEquity';
import './MemberEquityPage.css';
const tableColumns = ['展示名称', '权益图标', '权益简介', '操作'];
const emptyDraft = {
    name: '',
    logoMediaId: '',
    logoMediaUrl: '',
    description: '',
};
export function MemberEquityPage() {
    const search = typeof window === 'undefined' ? '' : window.location.search;
    const initialFilters = useMemo(() => createDefaultMemberEquityFilters(new URLSearchParams(search)), [search]);
    const [filters] = useState(initialFilters);
    const [dashboard, setDashboard] = useState(null);
    const [items, setItems] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSorting, setIsSorting] = useState(false);
    const [error, setError] = useState('');
    const [feedback, setFeedback] = useState('会员权益数据加载中...');
    const [dialog, setDialog] = useState(null);
    const [draft, setDraft] = useState(emptyDraft);
    const [formError, setFormError] = useState('');
    const [deleteTarget, setDeleteTarget] = useState(null);
    const uploadInputRef = useRef(null);
    const uploadedPreviewUrlRef = useRef(null);
    const loadDashboard = useCallback(async (reason) => {
        setIsLoading(true);
        setError('');
        setFeedback('会员权益数据加载中...');
        try {
            const nextDashboard = await fetchMemberEquityDashboard(filters);
            setDashboard(nextDashboard);
            setItems(nextDashboard.items);
            if (nextDashboard.items.length === 0) {
                setFeedback('暂无会员权益');
            }
            else if (reason === 'refresh') {
                setFeedback('会员权益已刷新');
            }
            else {
                setFeedback('会员权益已更新');
            }
        }
        catch (loadError) {
            const message = loadError instanceof Error ? loadError.message : '会员权益加载失败，请稍后重试';
            setDashboard(null);
            setItems([]);
            setError(message);
            setFeedback(message);
        }
        finally {
            setIsLoading(false);
        }
    }, [filters]);
    useEffect(() => {
        const timer = window.setTimeout(() => {
            void loadDashboard('initial');
        }, 0);
        return () => window.clearTimeout(timer);
    }, [loadDashboard]);
    useEffect(() => {
        if (!dialog && !deleteTarget)
            return undefined;
        function handleKeyDown(event) {
            if (event.key === 'Escape') {
                resetUploadedPreview();
                setDialog(null);
                setDraft(emptyDraft);
                setFormError('');
                setIsSubmitting(false);
                setDeleteTarget(null);
            }
        }
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [dialog, deleteTarget]);
    useEffect(() => {
        return () => {
            if (uploadedPreviewUrlRef.current) {
                URL.revokeObjectURL(uploadedPreviewUrlRef.current);
            }
        };
    }, []);
    const canOperate = !isLoading && !isSubmitting;
    const hasItems = items.length > 0;
    function resetUploadedPreview() {
        if (uploadedPreviewUrlRef.current) {
            URL.revokeObjectURL(uploadedPreviewUrlRef.current);
            uploadedPreviewUrlRef.current = null;
        }
    }
    function openCreateDialog() {
        resetUploadedPreview();
        setDialog({ mode: 'create', item: null });
        setDraft(emptyDraft);
        setFormError('');
    }
    function openEditDialog(item) {
        resetUploadedPreview();
        setDialog({ mode: 'edit', item });
        setDraft({
            name: item.name,
            logoMediaId: item.logoMediaId,
            logoMediaUrl: item.logoMediaUrl,
            description: item.description === '--' ? '' : item.description,
        });
        setFormError('');
    }
    function closeDialog() {
        resetUploadedPreview();
        setDialog(null);
        setDraft(emptyDraft);
        setFormError('');
        setIsSubmitting(false);
    }
    function updateDraft(key, value) {
        setDraft((current) => ({ ...current, [key]: value }));
        setFormError('');
    }
    function chooseIcon() {
        uploadInputRef.current?.click();
    }
    function handleIconUpload(event) {
        const file = event.target.files?.[0];
        if (!file)
            return;
        if (!file.type.startsWith('image/')) {
            const message = '请上传图片文件';
            setFormError(message);
            setFeedback(message);
            event.target.value = '';
            return;
        }
        resetUploadedPreview();
        const previewUrl = URL.createObjectURL(file);
        uploadedPreviewUrlRef.current = previewUrl;
        setDraft((current) => ({
            ...current,
            logoMediaId: `mock-media-${Date.now()}`,
            logoMediaUrl: previewUrl,
        }));
        setFeedback(`已选择图标：${file.name}`);
        setFormError('');
        event.target.value = '';
    }
    async function handleSubmit(event) {
        event.preventDefault();
        if (!dialog)
            return;
        const validationErrors = [];
        if (!draft.name.trim())
            validationErrors.push('请输入权益名称');
        if (draft.name.trim().length > 8)
            validationErrors.push('最多可输入8个字符');
        if (!draft.logoMediaId || !draft.logoMediaUrl)
            validationErrors.push('请上传权益图标');
        if (validationErrors.length > 0) {
            const message = validationErrors.join('，');
            setFormError(message);
            setFeedback(message);
            return;
        }
        setIsSubmitting(true);
        setFormError('');
        try {
            const nextItems = dialog.mode === 'edit' && dialog.item
                ? await updateMemberEquityItem(filters, items, dialog.item.memberBenefitId, draft)
                : await createMemberEquityItem(filters, items, draft);
            setItems(nextItems);
            setFeedback(dialog.mode === 'edit' ? '权益已保存' : '权益已创建');
            closeDialog();
        }
        catch (submitError) {
            const message = submitError instanceof Error ? submitError.message : '会员权益操作失败，请稍后重试';
            setFormError(message);
            setFeedback(message);
        }
        finally {
            setIsSubmitting(false);
        }
    }
    async function handleSaveSort() {
        setIsSubmitting(true);
        setError('');
        try {
            const nextItems = await saveMemberEquitySort(filters, items);
            setItems(nextItems);
            setIsSorting(false);
            setFeedback('排序已保存');
        }
        catch (sortError) {
            const message = sortError instanceof Error ? sortError.message : '排序保存失败，请稍后重试';
            setFeedback(message);
            setError(message);
        }
        finally {
            setIsSubmitting(false);
        }
    }
    function moveItem(memberBenefitId, direction) {
        setItems((current) => {
            const index = current.findIndex((item) => item.memberBenefitId === memberBenefitId);
            const nextIndex = index + direction;
            if (index < 0 || nextIndex < 0 || nextIndex >= current.length)
                return current;
            const nextItems = [...current];
            const [item] = nextItems.splice(index, 1);
            nextItems.splice(nextIndex, 0, item);
            return nextItems.map((nextItem, orderIndex) => ({ ...nextItem, seq: orderIndex + 1 }));
        });
        setFeedback('排序已调整');
    }
    async function confirmDelete() {
        if (!deleteTarget)
            return;
        setIsSubmitting(true);
        try {
            const nextItems = await deleteMemberEquityItem(filters, items, deleteTarget.memberBenefitId);
            setItems(nextItems);
            setDeleteTarget(null);
            setFeedback('权益已删除');
        }
        catch (deleteError) {
            const message = deleteError instanceof Error ? deleteError.message : '会员权益删除失败，请稍后重试';
            setFeedback(message);
        }
        finally {
            setIsSubmitting(false);
        }
    }
    return (_jsxs("div", { className: "member-equity-page", "data-provider": dashboard?.provider ?? 'mock', "data-request-page": filters.page, "data-request-page-size": filters.pageSize, children: [_jsxs("section", { className: "member-equity-panel", "aria-label": "\u4F1A\u5458\u6743\u76CA\u7BA1\u7406", children: [_jsxs("header", { className: "member-equity-panel__header", children: [_jsxs("div", { children: [_jsx("h1", { children: "\u6743\u76CA\u5217\u8868" }), _jsx("p", { children: "\u53EF\u4EE5\u5728\u6B64\u5904\u914D\u7F6E\u6240\u9700\u7684\u4F1A\u5458\u6743\u76CA" })] }), _jsxs("div", { className: "member-equity-actions", children: [_jsx("button", { type: "button", className: "member-equity-button is-primary", disabled: !canOperate, onClick: openCreateDialog, children: "\u6DFB\u52A0" }), _jsx("button", { type: "button", className: "member-equity-button is-primary", disabled: !canOperate, onClick: () => (isSorting ? void handleSaveSort() : setIsSorting(true)), children: isSorting ? '保存排序' : '排 序' }), _jsx("button", { type: "button", className: "member-equity-button", disabled: !canOperate, onClick: () => void loadDashboard('refresh'), children: "\u5237\u65B0" })] })] }), _jsxs("div", { className: "member-equity-statebar", children: [isSorting ? _jsx("span", { children: "\u62D6\u52A8\u5217\u8868\u9879\u6392\u5E8F" }) : _jsxs("span", { children: ["\u5F53\u524D\u6743\u76CA ", items.length, " \u9879"] }), _jsx("span", { role: "status", "aria-label": "\u4F1A\u5458\u6743\u76CA\u64CD\u4F5C\u53CD\u9988", children: feedback })] }), isLoading ? _jsx("div", { className: "member-equity-loading", "aria-label": "\u4F1A\u5458\u6743\u76CA\u52A0\u8F7D\u72B6\u6001", children: "\u4F1A\u5458\u6743\u76CA\u6570\u636E\u52A0\u8F7D\u4E2D..." }) : null, error ? (_jsxs("div", { className: "member-equity-error", role: "alert", "aria-label": "\u4F1A\u5458\u6743\u76CA\u6570\u636E\u9519\u8BEF", children: [_jsx("strong", { children: "\u4F1A\u5458\u6743\u76CA\u52A0\u8F7D\u5931\u8D25" }), _jsx("span", { children: error }), _jsx("button", { type: "button", onClick: () => void loadDashboard('retry'), children: "\u91CD\u65B0\u52A0\u8F7D" })] })) : null, _jsxs("table", { className: "member-equity-table", "aria-label": "\u4F1A\u5458\u6743\u76CA\u5217\u8868", children: [_jsx("thead", { children: _jsx("tr", { children: tableColumns.map((column) => (_jsx("th", { children: column }, column))) }) }), _jsx("tbody", { children: !hasItems ? (_jsx("tr", { children: _jsx("td", { colSpan: tableColumns.length, children: _jsxs("div", { className: "member-equity-empty", children: [_jsx("span", { "aria-hidden": "true" }), _jsx("strong", { children: "\u6682\u65E0\u6570\u636E" })] }) }) })) : (items.map((item, index) => (_jsxs("tr", { children: [_jsxs("td", { children: [_jsx("strong", { children: item.name }), _jsxs("em", { children: ["\u5E8F\u53F7 ", item.seq] })] }), _jsx("td", { children: _jsx("img", { src: item.logoMediaUrl, alt: "", className: "member-equity-icon" }) }), _jsx("td", { children: item.description }), _jsx("td", { children: _jsx("div", { className: "member-equity-row-actions", children: isSorting ? (_jsxs(_Fragment, { children: [_jsx("button", { type: "button", disabled: index === 0 || isSubmitting, onClick: () => moveItem(item.memberBenefitId, -1), children: "\u4E0A\u79FB" }), _jsx("button", { type: "button", disabled: index === items.length - 1 || isSubmitting, onClick: () => moveItem(item.memberBenefitId, 1), children: "\u4E0B\u79FB" })] })) : (_jsxs(_Fragment, { children: [_jsx("button", { type: "button", disabled: !canOperate, onClick: () => openEditDialog(item), children: "\u7F16\u8F91" }), _jsx("button", { type: "button", disabled: !canOperate, onClick: () => setDeleteTarget(item), children: "\u5220\u9664" })] })) }) })] }, item.memberBenefitId)))) })] })] }), dialog ? (_jsx("div", { className: "member-equity-modal-backdrop", role: "presentation", children: _jsxs("section", { className: "member-equity-modal", role: "dialog", "aria-modal": "true", "aria-labelledby": "member-equity-modal-title", children: [_jsxs("header", { children: [_jsx("h2", { id: "member-equity-modal-title", children: dialog.mode === 'edit' ? '编辑权益' : '新增权益' }), _jsx("button", { type: "button", "aria-label": "\u5173\u95ED\u6743\u76CA\u5F39\u7A97", onClick: closeDialog, children: "\u00D7" })] }), _jsxs("form", { className: "member-equity-form", onSubmit: handleSubmit, children: [_jsxs("label", { children: [_jsx("span", { children: "\u6743\u76CA\u540D\u79F0" }), _jsx("input", { type: "text", value: draft.name, maxLength: 8, placeholder: "\u8BF7\u8F93\u5165\u6743\u76CA\u540D\u79F0", disabled: isSubmitting, onChange: (event) => updateDraft('name', event.target.value) })] }), _jsxs("label", { children: [_jsx("span", { children: "\u6743\u76CA\u56FE\u6807" }), _jsx("input", { ref: uploadInputRef, type: "file", accept: "image/*", className: "member-equity-upload-input", onChange: handleIconUpload }), _jsx("button", { type: "button", className: "member-equity-upload", disabled: isSubmitting, onClick: chooseIcon, children: draft.logoMediaUrl ? _jsx("img", { src: draft.logoMediaUrl, alt: "" }) : '+ 添加图标' })] }), _jsxs("label", { children: [_jsx("span", { children: "\u6743\u76CA\u7B80\u4ECB" }), _jsx("textarea", { value: draft.description, placeholder: "\u8BF7\u8F93\u5165\u6743\u76CA\u7B80\u4ECB", disabled: isSubmitting, onChange: (event) => updateDraft('description', event.target.value) })] }), formError ? _jsx("div", { className: "member-equity-form-error", role: "alert", children: formError }) : null, _jsxs("footer", { children: [_jsx("button", { type: "button", disabled: isSubmitting, onClick: closeDialog, children: "\u53D6\u6D88" }), _jsx("button", { type: "submit", className: "is-primary", disabled: isSubmitting, children: isSubmitting ? '提交中...' : '提交' })] })] })] }) })) : null, deleteTarget ? (_jsx("div", { className: "member-equity-modal-backdrop", role: "presentation", children: _jsxs("section", { className: "member-equity-confirm", role: "dialog", "aria-modal": "true", "aria-label": "\u5220\u9664\u6743\u76CA", children: [_jsx("h2", { children: "\u5220\u9664\u6743\u76CA" }), _jsx("p", { children: "\u60A8\u786E\u5B9A\u8981\u5220\u9664\u5F53\u524D\u6743\u76CA\u5417\uFF1F" }), _jsx("strong", { children: deleteTarget.name }), _jsxs("footer", { children: [_jsx("button", { type: "button", disabled: isSubmitting, onClick: () => setDeleteTarget(null), children: "\u53D6\u6D88" }), _jsx("button", { type: "button", className: "is-danger", disabled: isSubmitting, onClick: () => void confirmDelete(), children: "\u786E\u8BA4" })] })] }) })) : null] }));
}
