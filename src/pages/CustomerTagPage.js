import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { defaultCustomerTagFilters, loadCustomerTagData, } from '../services/customerTag';
import './CustomerTagPage.css';
const tableColumns = ['标签组', '标签名称', '创建人', '创建时间', '操作'];
export function CustomerTagPage() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [filters, setFilters] = useState({
        ...defaultCustomerTagFilters,
        keyword: searchParams.get('tagGroupName') ?? '',
    });
    const [scenario, setScenario] = useState(normalizeScenario(searchParams.get('customerTagMockState')));
    const [draftKeyword, setDraftKeyword] = useState(searchParams.get('tagGroupName') ?? '');
    const [data, setData] = useState(null);
    const [selectedRow, setSelectedRow] = useState(null);
    const [showCreateDialog, setShowCreateDialog] = useState(false);
    const [showSyncDialog, setShowSyncDialog] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [feedback, setFeedback] = useState('');
    useEffect(() => {
        void loadData(filters, scenario);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
    async function loadData(nextFilters, nextScenario, message = '') {
        setLoading(true);
        setError('');
        try {
            const nextData = await loadCustomerTagData(nextFilters, nextScenario);
            setData(nextData);
            setFilters(nextFilters);
            setScenario(nextScenario);
            if (message)
                setFeedback(message);
        }
        catch (caught) {
            setData(null);
            setScenario(nextScenario);
            setError(caught instanceof Error ? caught.message : '客户标签数据加载失败');
        }
        finally {
            setLoading(false);
        }
    }
    function handleSearch() {
        const nextFilters = { ...filters, keyword: draftKeyword, page: 1 };
        void loadData(nextFilters, 'success', '查询已更新');
    }
    function handleReset() {
        setDraftKeyword('');
        void loadData({ ...defaultCustomerTagFilters }, 'success', '筛选已重置');
    }
    function handleRefresh() {
        void loadData({ ...filters }, 'success', '数据已刷新');
    }
    function handleExport() {
        setFeedback('导出任务已创建，稍后可在任务中心查看');
    }
    function handleCreate(groupName, tags) {
        setShowCreateDialog(false);
        setFeedback(`标签组已保存：${groupName}，共 ${tags.length} 个标签`);
    }
    const rows = data?.rows ?? [];
    const isEmpty = !loading && !error && rows.length === 0;
    const requestEcho = useMemo(() => data?.requestEcho ?? JSON.stringify({ provider: 'mock', responseCode: error ? 503 : 0, state: scenario }), [data, error, scenario]);
    return (_jsxs("div", { className: "customer-tag-page", children: [_jsx("h1", { className: "sr-only-heading", children: "\u5BA2\u6237\u6807\u7B7E" }), _jsx("output", { hidden: true, "aria-label": "\u5BA2\u6237\u6807\u7B7E\u670D\u52A1\u5951\u7EA6", children: requestEcho }), _jsxs("section", { className: "customer-tag-filter", "aria-label": "\u5BA2\u6237\u6807\u7B7E\u7B5B\u9009", children: [_jsxs("label", { className: "customer-tag-field", children: [_jsx("span", { children: "\u6807\u7B7E\u7EC4:" }), _jsx("input", { "aria-label": "\u6807\u7B7E\u7EC4", value: draftKeyword, placeholder: "\u8BF7\u8F93\u5165", onChange: (event) => setDraftKeyword(event.target.value) })] }), _jsxs("div", { className: "customer-tag-filter__actions", children: [_jsx("button", { type: "button", disabled: loading, onClick: handleReset, children: "\u91CD\u7F6E" }), _jsx("button", { type: "button", className: "is-primary", disabled: loading, onClick: handleSearch, children: "\u67E5\u8BE2" })] })] }), _jsxs("div", { className: "customer-tag-toolbar", children: [_jsx("button", { type: "button", disabled: loading, onClick: handleRefresh, children: "\u5237\u65B0" }), _jsx("button", { type: "button", onClick: handleExport, children: "\u5BFC\u51FA" }), _jsx("button", { type: "button", className: "is-primary", onClick: () => setShowSyncDialog(true), children: "\u540C\u6B65\u4F01\u5FAE\u6807\u7B7E" }), _jsx("button", { type: "button", className: "is-primary", onClick: () => setShowCreateDialog(true), children: "\u65B0\u5EFA\u6807\u7B7E\u7EC4" })] }), _jsx("div", { className: "customer-tag-feedback", role: "status", children: loading ? '客户标签加载中...' : feedback }), error ? (_jsxs("section", { className: "customer-tag-error", role: "alert", children: [_jsx("strong", { children: "\u5BA2\u6237\u6807\u7B7E\u6570\u636E\u52A0\u8F7D\u5931\u8D25" }), _jsx("span", { children: error }), _jsx("button", { type: "button", onClick: () => void loadData({ ...filters }, 'success', '数据已恢复'), children: "\u91CD\u8BD5" })] })) : null, _jsxs("section", { className: "customer-tag-table", "aria-label": "\u5BA2\u6237\u6807\u7B7E\u8868\u683C", "aria-busy": loading, children: [_jsx("div", { className: "customer-tag-table__head", children: tableColumns.map((column) => (_jsx("div", { children: column }, column))) }), _jsxs("div", { className: "customer-tag-table__body", children: [loading ? _jsx("div", { className: "customer-tag-loading", children: "\u52A0\u8F7D\u5BA2\u6237\u6807\u7B7E..." }) : null, isEmpty ? (_jsxs("div", { className: "customer-tag-empty", children: [_jsx("span", { className: "customer-tag-empty__icon", "aria-hidden": "true" }), _jsx("p", { children: "\u5F53\u524D\u6761\u4EF6\u4E0B\u6CA1\u6709\u5BA2\u6237\u6807\u7B7E" }), _jsx("button", { type: "button", onClick: handleReset, children: "\u6E05\u7A7A\u7B5B\u9009" })] })) : null, !loading &&
                                rows.map((row) => (_jsxs("div", { className: "customer-tag-table__row", children: [_jsxs("div", { children: [_jsx("strong", { children: row.groupName }), _jsxs("span", { children: [row.sourceLabel, " \u00B7 ", row.statusLabel] })] }), _jsx("div", { children: row.tagNames }), _jsx("div", { children: row.createdBy }), _jsx("div", { children: row.createdAt }), _jsx("div", { children: _jsx("button", { type: "button", "aria-label": `查看 ${row.groupName}`, onClick: () => setSelectedRow(row), children: "\u67E5\u770B" }) })] }, row.id)))] }), data ? _jsxs("div", { className: "customer-tag-pagination", children: ["\u7B2C ", data.pagination.page, " \u9875\uFF0C\u5171 ", data.pagination.total, " \u6761\uFF0C\u6BCF\u9875 20 \u6761"] }) : null] }), _jsxs("section", { className: "customer-tag-shortcuts", "aria-label": "\u5BA2\u6237\u6807\u7B7E\u5FEB\u6377\u5165\u53E3", children: [_jsx("button", { type: "button", onClick: () => navigate('/customer/list'), children: "\u67E5\u770B\u5BA2\u6237\u5217\u8868" }), _jsx("button", { type: "button", onClick: () => navigate('/scrm/memberCenter/level'), children: "\u4F1A\u5458\u7B49\u7EA7" }), _jsx("button", { type: "button", onClick: () => navigate('/scrm/marketing/customer'), children: "\u5BA2\u6237\u8425\u9500" })] }), selectedRow ? _jsx(TagDetailDialog, { row: selectedRow, onClose: () => setSelectedRow(null) }) : null, showCreateDialog ? _jsx(CreateTagGroupDialog, { onClose: () => setShowCreateDialog(false), onConfirm: handleCreate }) : null, showSyncDialog ? _jsx(SyncTagDialog, { onClose: () => setShowSyncDialog(false), onAuthorize: () => navigate('/channels/private') }) : null] }));
}
function TagDetailDialog({ row, onClose }) {
    return (_jsx("div", { className: "customer-tag-modal-backdrop", children: _jsxs("section", { className: "customer-tag-modal customer-tag-detail", role: "dialog", "aria-modal": "true", "aria-label": "\u6807\u7B7E\u7EC4\u8BE6\u60C5", children: [_jsxs("header", { children: [_jsx("h2", { children: "\u6807\u7B7E\u7EC4\u8BE6\u60C5" }), _jsx("button", { type: "button", "aria-label": "\u5173\u95ED\u6807\u7B7E\u7EC4\u8BE6\u60C5", onClick: onClose, children: "\u00D7" })] }), _jsx("div", { className: "customer-tag-modal__body", children: _jsxs("dl", { children: [_jsx("dt", { children: "\u6807\u7B7E\u7EC4" }), _jsx("dd", { children: row.groupName }), _jsx("dt", { children: "\u6807\u7B7E\u540D\u79F0" }), _jsx("dd", { children: row.tagNames }), _jsx("dt", { children: "\u8986\u76D6\u5BA2\u6237" }), _jsxs("dd", { children: [row.memberCount, " \u4EBA"] }), _jsx("dt", { children: "\u6700\u8FD1 30 \u5929\u65B0\u589E" }), _jsxs("dd", { children: [row.recentlyAddedCount, " \u4EBA"] }), _jsx("dt", { children: "\u8BF4\u660E" }), _jsx("dd", { children: row.description })] }) }), _jsx("footer", { children: _jsx("button", { type: "button", onClick: onClose, children: "\u5173\u95ED" }) })] }) }));
}
function CreateTagGroupDialog({ onClose, onConfirm, }) {
    const [groupName, setGroupName] = useState('');
    const [tagInputs, setTagInputs] = useState([]);
    const cleanTags = tagInputs.map((item) => item.trim()).filter(Boolean);
    const canSubmit = groupName.trim().length > 0 && cleanTags.length > 0;
    function addTagInput() {
        setTagInputs((current) => [...current, '']);
    }
    function updateTag(index, value) {
        setTagInputs((current) => current.map((item, itemIndex) => (itemIndex === index ? value : item)));
    }
    function removeTag(index) {
        setTagInputs((current) => current.filter((_, itemIndex) => itemIndex !== index));
    }
    return (_jsx("div", { className: "customer-tag-modal-backdrop", children: _jsxs("section", { className: "customer-tag-modal", role: "dialog", "aria-modal": "true", "aria-label": "\u65B0\u5EFA\u6807\u7B7E\u7EC4", children: [_jsxs("header", { children: [_jsx("h2", { children: "\u65B0\u5EFA\u6807\u7B7E\u7EC4" }), _jsx("button", { type: "button", "aria-label": "\u5173\u95ED\u65B0\u5EFA\u6807\u7B7E\u7EC4", onClick: onClose, children: "\u00D7" })] }), _jsxs("div", { className: "customer-tag-modal__body customer-tag-create-body", children: [_jsxs("label", { className: "customer-tag-dialog-field", children: [_jsx("span", { children: "\u6807\u7B7E\u7EC4\u540D\u79F0" }), _jsx("input", { "aria-label": "\u6807\u7B7E\u7EC4\u540D\u79F0", value: groupName, placeholder: "\u8BF7\u8F93\u5165\u6807\u7B7E\u7EC4\u540D\u79F0", onChange: (event) => setGroupName(event.target.value) })] }), _jsxs("div", { className: "customer-tag-dialog-field customer-tag-dialog-tags", children: [_jsx("span", { children: "\u6807\u7B7E" }), _jsxs("div", { className: "customer-tag-dialog-tags__content", children: [tagInputs.length ? (tagInputs.map((value, index) => (_jsxs("div", { className: "customer-tag-tag-row", children: [_jsx("input", { "aria-label": `标签${index + 1}`, value: value, onChange: (event) => updateTag(index, event.target.value) }), _jsx("button", { type: "button", className: "customer-tag-icon-button", "aria-label": `拖动标签${index + 1}`, children: "\u2630" }), _jsx("button", { type: "button", className: "customer-tag-icon-button", "aria-label": `删除标签${index + 1}`, onClick: () => removeTag(index), children: "\uD83D\uDDD1" })] }, index)))) : null, _jsx("button", { type: "button", className: "customer-tag-add-link", onClick: addTagInput, children: "+ \u6DFB\u52A0\u6807\u7B7E" })] })] })] }), _jsxs("footer", { children: [_jsx("button", { type: "button", onClick: onClose, children: "\u53D6\u6D88" }), _jsx("button", { type: "button", className: "is-primary", disabled: !canSubmit, onClick: () => onConfirm(groupName.trim(), cleanTags), children: "\u786E\u5B9A" })] })] }) }));
}
function SyncTagDialog({ onClose, onAuthorize }) {
    return (_jsx("div", { className: "customer-tag-modal-backdrop", children: _jsxs("section", { className: "customer-tag-auth-modal", role: "dialog", "aria-modal": "true", "aria-label": "\u4F01\u5FAE\u6807\u7B7E\u540C\u6B65\u6388\u6743", children: [_jsxs("div", { className: "customer-tag-auth-modal__message", children: [_jsx("span", { "aria-hidden": "true", children: "!" }), _jsx("p", { children: "\u8BF7\u5148\u524D\u5F80\u6388\u6743\u4F01\u5FAE\u518D\u64CD\u4F5C" })] }), _jsxs("div", { className: "customer-tag-auth-modal__actions", children: [_jsx("button", { type: "button", onClick: onClose, children: "\u6211\u77E5\u9053\u4E86" }), _jsx("button", { type: "button", className: "is-primary", onClick: onAuthorize, children: "\u524D\u5F80\u6388\u6743" })] })] }) }));
}
function normalizeScenario(value) {
    if (value === 'empty' || value === 'error')
        return value;
    return 'success';
}
