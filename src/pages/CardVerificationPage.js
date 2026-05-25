import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useMemo, useRef, useState } from 'react';
import { checkCardVerificationTicket, loadCardVerificationData, } from '../services/cardVerification';
import './CardVerificationPage.css';
const defaultFilters = {
    pageNum: 1,
    pageSize: 20,
    ticketItemVerifyState: 1,
};
const tableColumns = [
    '卡券码',
    '类目',
    '商品名称',
    '卡券名称',
    '用户昵称',
    '用户手机',
    '价格',
    '核销人',
    '核销时间',
    '相关订单',
    '状态',
    '操作',
];
export function CardVerificationPage() {
    const [code, setCode] = useState('');
    const [data, setData] = useState(null);
    const [rows, setRows] = useState([]);
    const [selectedRow, setSelectedRow] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [dataNotice, setDataNotice] = useState('');
    const [toast, setToast] = useState(null);
    const requestRef = useRef(0);
    const toastTimerRef = useRef(null);
    function showToast(nextToast) {
        setToast(nextToast);
    }
    async function requestData(reason = '刷新') {
        const requestId = requestRef.current + 1;
        requestRef.current = requestId;
        setLoading(true);
        setError('');
        setDataNotice(reason === '刷新' ? '正在刷新核销记录' : '正在加载核销记录');
        try {
            const result = await loadCardVerificationData(defaultFilters);
            if (requestRef.current !== requestId)
                return;
            setData(result);
            setRows(result.rows);
            setDataNotice('核销记录已更新');
            if (reason === '刷新') {
                showToast({
                    tone: 'success',
                    role: 'status',
                    label: '卡券核销操作反馈',
                    text: '核销记录已更新',
                });
            }
        }
        catch (caught) {
            if (requestRef.current !== requestId)
                return;
            const message = caught instanceof Error ? caught.message : String(caught);
            setError(message || '核销记录加载失败');
            setDataNotice('核销记录加载失败');
            setRows([]);
        }
        finally {
            if (requestRef.current === requestId)
                setLoading(false);
        }
    }
    useEffect(() => {
        const timer = window.setTimeout(() => {
            void requestData('加载');
        }, 0);
        return () => window.clearTimeout(timer);
    }, []);
    useEffect(() => {
        if (!toast)
            return undefined;
        if (toastTimerRef.current)
            window.clearTimeout(toastTimerRef.current);
        toastTimerRef.current = window.setTimeout(() => {
            setToast(null);
            toastTimerRef.current = null;
        }, 2200);
        return () => {
            if (toastTimerRef.current) {
                window.clearTimeout(toastTimerRef.current);
                toastTimerRef.current = null;
            }
        };
    }, [toast]);
    const contract = useMemo(() => {
        return {
            provider: data?.provider ?? 'mock',
            mode: data?.mode ?? 'success',
            traceId: data?.traceId ?? '',
            requestBody: data ? JSON.stringify(data.requestBody) : '',
        };
    }, [data]);
    async function submitVerification() {
        const trimmedCode = code.trim();
        if (!trimmedCode) {
            showToast({
                tone: 'error',
                role: 'alert',
                text: '请输入卡券码',
            });
            return;
        }
        setLoading(true);
        try {
            const result = await checkCardVerificationTicket(trimmedCode, String(data?.requestBody.campId ?? ''));
            if (result.row) {
                const verifiedRow = result.row;
                setRows((current) => {
                    const withoutDuplicate = current.filter((row) => row.ticketNo !== verifiedRow.ticketNo);
                    return [verifiedRow, ...withoutDuplicate];
                });
            }
            showToast({
                tone: 'success',
                role: 'status',
                label: '卡券核销操作反馈',
                text: `核销成功：${trimmedCode}`,
            });
            setCode('');
        }
        catch (caught) {
            const message = caught instanceof Error ? caught.message : String(caught);
            showToast({
                tone: 'error',
                role: 'alert',
                text: message || '卡券核销失败',
            });
        }
        finally {
            setLoading(false);
        }
    }
    function exportRecords() {
        showToast({
            tone: 'success',
            role: 'status',
            label: '卡券核销操作反馈',
            text: `导出任务已创建，共 ${rows.length} 条核销记录`,
        });
    }
    function nextPage() {
        if (!data?.pagination.hasNextPage) {
            showToast({
                tone: 'success',
                role: 'status',
                label: '卡券核销操作反馈',
                text: '已经是最后一页',
            });
            return;
        }
        showToast({
            tone: 'success',
            role: 'status',
            label: '卡券核销操作反馈',
            text: `已切换到第 ${data.pagination.page + 1} 页`,
        });
    }
    const total = data?.pagination.total ?? rows.length;
    return (_jsxs("div", { className: "card-verify-page", "aria-label": "\u5361\u5238\u6838\u9500", children: [_jsx("h1", { className: "sr-only-heading", children: "\u5361\u5238\u6838\u9500" }), _jsx("span", { "data-testid": "card-verification-service-contract", "data-provider": contract.provider, "data-mode": contract.mode, "data-trace-id": contract.traceId, "data-request-body": contract.requestBody, hidden: true }), _jsxs("section", { className: "card-verify-entry", "aria-label": "\u5361\u5238\u6838\u9500\u5165\u53E3", children: [_jsx("input", { value: code, placeholder: "\u8BF7\u8F93\u5165\u5361\u5238\u7801", disabled: loading, onChange: (event) => setCode(event.target.value), onKeyDown: (event) => {
                            if (event.key === 'Enter')
                                void submitVerification();
                        } }), _jsx("button", { type: "button", disabled: loading, onClick: () => void submitVerification(), children: "\u6838 \u9500" }), _jsx("button", { type: "button", className: "card-verify-secondary", disabled: loading, onClick: () => void requestData('刷新'), children: "\u5237\u65B0" })] }), _jsx("div", { className: "sr-only-heading", children: _jsx("div", { className: "card-verify-status", role: "status", "aria-label": "\u5361\u5238\u6838\u9500\u6570\u636E\u72B6\u6001", "aria-live": "polite", children: loading ? '正在处理，请稍候' : dataNotice || '核销记录已更新' }) }), toast ? (_jsx("div", { className: `card-verify-toast${toast.tone === 'error' ? ' card-verify-toast--error' : ''}`, role: toast.role, "aria-label": toast.label, children: toast.text })) : null, _jsxs("section", { className: "card-verify-records", "aria-label": "\u6838\u9500\u8BB0\u5F55", children: [_jsxs("header", { className: "card-verify-records__head", children: [_jsx("h2", { children: "\u6838\u9500\u8BB0\u5F55" }), _jsx("button", { type: "button", disabled: loading || rows.length === 0, onClick: exportRecords, children: "\u5BFC\u51FA\u660E\u7EC6" })] }), error ? (_jsxs("div", { className: "card-verify-error", role: "status", "aria-label": "\u5361\u5238\u6838\u9500\u9519\u8BEF\u72B6\u6001", children: [_jsx("strong", { children: "\u6838\u9500\u8BB0\u5F55\u52A0\u8F7D\u5931\u8D25" }), _jsx("span", { children: error }), _jsx("button", { type: "button", onClick: () => void requestData('重新加载'), children: "\u91CD\u65B0\u52A0\u8F7D" })] })) : (_jsxs("div", { className: "card-verify-table", "aria-label": "\u5361\u5238\u6838\u9500\u8BB0\u5F55\u8868\u683C", children: [_jsx("div", { className: "card-verify-table__head", children: tableColumns.map((column) => (_jsx("div", { children: column }, column))) }), rows.length > 0 ? (rows.map((row) => (_jsxs("div", { className: "card-verify-table__row", children: [_jsx("div", { children: row.ticketNo }), _jsx("div", { children: row.category }), _jsx("div", { children: row.productName }), _jsx("div", { children: row.ticketName }), _jsx("div", { children: row.userName }), _jsx("div", { children: row.userMobile }), _jsx("div", { children: row.price }), _jsx("div", { children: row.verifier }), _jsx("div", { children: row.verifiedAt }), _jsx("div", { children: row.orderNo }), _jsx("div", { children: _jsx("span", { className: "card-verify-tag", children: row.status }) }), _jsx("div", { children: _jsxs("button", { type: "button", className: "card-verify-link", onClick: () => setSelectedRow(row), children: ["\u67E5\u770B\u8BE6\u60C5 ", row.ticketNo] }) })] }, row.id)))) : (_jsxs("div", { className: "card-verify-empty", role: "status", "aria-label": "\u5361\u5238\u6838\u9500\u7A7A\u6001", children: [_jsx("span", { className: "card-verify-empty__icon", "aria-hidden": "true" }), _jsx("strong", { children: "\u6682\u65E0\u7B26\u5408\u6761\u4EF6\u7684\u6838\u9500\u8BB0\u5F55" })] }))] }))] }), _jsxs("footer", { className: "card-verify-pagination", "aria-label": "\u5361\u5238\u6838\u9500\u5206\u9875", children: [_jsxs("span", { children: ["\u7B2C ", data?.pagination.page ?? 1, " \u9875 / \u5171 ", total, " \u6761"] }), _jsx("button", { type: "button", disabled: loading, onClick: nextPage, children: "\u4E0B\u4E00\u9875" })] }), selectedRow ? (_jsx("div", { className: "card-verify-drawer-mask", role: "presentation", onMouseDown: () => setSelectedRow(null), children: _jsxs("aside", { className: "card-verify-drawer", role: "dialog", "aria-modal": "true", "aria-label": "\u5361\u5238\u6838\u9500\u8BE6\u60C5", onMouseDown: (event) => event.stopPropagation(), children: [_jsxs("header", { children: [_jsx("strong", { children: "\u5361\u5238\u6838\u9500\u8BE6\u60C5" }), _jsx("button", { type: "button", "aria-label": "\u5173\u95ED\u5361\u5238\u6838\u9500\u8BE6\u60C5", onClick: () => setSelectedRow(null), children: "\u00D7" })] }), _jsxs("dl", { children: [_jsxs("div", { children: [_jsx("dt", { children: "\u5361\u5238\u7801" }), _jsx("dd", { children: selectedRow.ticketNo })] }), _jsxs("div", { children: [_jsx("dt", { children: "\u5546\u54C1\u540D\u79F0" }), _jsx("dd", { children: selectedRow.productName })] }), _jsxs("div", { children: [_jsx("dt", { children: "\u5361\u5238\u540D\u79F0" }), _jsx("dd", { children: selectedRow.ticketName })] }), _jsxs("div", { children: [_jsx("dt", { children: "\u76F8\u5173\u8BA2\u5355" }), _jsx("dd", { children: selectedRow.orderNo })] }), _jsxs("div", { children: [_jsx("dt", { children: "\u6838\u9500\u65F6\u95F4" }), _jsx("dd", { children: selectedRow.verifiedAt })] }), _jsxs("div", { children: [_jsx("dt", { children: "\u6838\u9500\u4EBA" }), _jsx("dd", { children: selectedRow.verifier })] })] })] }) })) : null] }));
}
