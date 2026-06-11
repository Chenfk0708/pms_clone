import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { createDefaultPsbPoliceFilters, fetchPsbPolicePageData, PSB_SYSTEM_NAME, submitPsbPoliceRegistration, } from '../services/psbPolice';
import { validateCredentialNumber, validatePersonName } from '../utils/inputValidation';
import './PsbPolicePage.css';
const tableColumns = [
    '登记系统/机构',
    '酒店旅业编码/ID',
    '类型',
    '商户名称',
    '关联门店',
    '关联房间数',
    '操作',
];
const addFormFields = [
    { label: '商户名称', placeholder: '请输入商户名称' },
    { label: '选择门店', placeholder: '请选择门店', kind: 'select' },
    { label: '旅业经营名称', placeholder: '请输入旅业经营名称' },
    { label: '旅业编码', placeholder: '请输入旅业编码' },
    { label: '社会信用代码', placeholder: '请输入社会信用代码' },
    { label: '旅业经营地址', placeholder: '请输入旅业经营地址' },
    { label: '行政区划码', placeholder: '请输入行政区划码' },
    { label: '旅业申请的注册码', placeholder: '请输入旅业申请的注册码' },
    { label: '旅馆编码', placeholder: '请输入旅馆编码' },
    { label: 'accessKeyId', placeholder: '请输入accessKeyId' },
    { label: '设备处理业务公钥', placeholder: '请输入设备处理业务公钥', kind: 'textarea' },
    { label: '设备处理业务私钥', placeholder: '请输入设备处理业务私钥', kind: 'textarea' },
    { label: '登记人姓名', placeholder: '请输入登记人姓名' },
    { label: '登记人证件号码', placeholder: '请输入登记人证件号码' },
];
export function PsbPolicePage() {
    const location = useLocation();
    const navigate = useNavigate();
    const [pageData, setPageData] = useState(null);
    const [rows, setRows] = useState([]);
    const [total, setTotal] = useState(0);
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState('');
    const [feedback, setFeedback] = useState('公安登记数据加载中');
    const [detailRow, setDetailRow] = useState(null);
    const [pendingDeleteRow, setPendingDeleteRow] = useState(null);
    useEffect(() => {
        const controller = new AbortController();
        const filters = createDefaultPsbPoliceFilters(new URLSearchParams(location.search));
        void fetchPsbPolicePageData(filters, controller.signal)
            .then((result) => {
            setPageData(result);
            setRows(result.rows);
            setTotal(result.pagination.total);
            setFeedback('公安登记数据已加载');
        })
            .catch((error) => {
            if (error instanceof DOMException && error.name === 'AbortError')
                return;
            setPageData(null);
            setRows([]);
            setTotal(0);
            const nextMessage = error instanceof Error
                ? error.message
                : 'PSB公安对接列表加载失败，请稍后重试';
            setErrorMessage(nextMessage);
            setFeedback(nextMessage);
        })
            .finally(() => {
            if (!controller.signal.aborted) {
                setIsLoading(false);
            }
        });
        return () => controller.abort();
    }, [location.search]);
    function closeDialog() {
        setIsAddOpen(false);
    }
    function handleOpenDialog() {
        if (isLoading || errorMessage || !pageData)
            return;
        setIsAddOpen(true);
    }
    function handleRetry() {
        setPageData(null);
        setRows([]);
        setTotal(0);
        setErrorMessage('');
        setFeedback('公安登记数据加载中');
        setIsLoading(true);
        navigate('/psb/list', { replace: true });
    }
    function handleDeleteRow(rowId) {
        setRows((current) => {
            const nextRows = current.filter((row) => row.id !== rowId);
            setTotal(nextRows.length);
            if (detailRow?.id === rowId) {
                setDetailRow(null);
            }
            setFeedback('PSB公安对接商户已删除');
            return nextRows;
        });
    }
    return (_jsxs("div", { className: "psb-page", "data-provider": pageData?.provider ?? 'mock', "data-empty": rows.length === 0 ? 'true' : 'false', children: [_jsx("h1", { className: "sr-only-heading", children: "PSB\u516C\u5B89\u5BF9\u63A5" }), _jsx("span", { className: "psb-version", children: "\u7248\u672C\u53F7\uFF1Av4.10.7" }), _jsxs("section", { className: "psb-panel", "aria-label": "\u516C\u5B89\u767B\u8BB0", children: [_jsxs("header", { className: "psb-panel__head", children: [_jsxs("div", { children: [_jsx("h2", { children: "\u516C\u5B89\u767B\u8BB0" }), _jsx("p", { children: "\u5165\u4F4F\u5BA2\u4EBA\u767B\u8BB0\u7684\u4FE1\u606F\u540C\u6B65\u5230\u5F53\u5730\u5408\u6CD5\u76D1\u7BA1\u90E8\u95E8" })] }), _jsx("button", { type: "button", className: "psb-primary-button", onClick: handleOpenDialog, disabled: isLoading || Boolean(errorMessage), children: "\u65B0 \u589E" })] }), _jsxs("div", { className: "psb-statusbar", children: [_jsx("span", { role: "status", "aria-label": "PSB\u516C\u5B89\u5BF9\u63A5\u64CD\u4F5C\u53CD\u9988", children: feedback }), _jsxs("span", { className: "psb-statusbar__meta", children: ["\u5171 ", total, " \u6761\u767B\u8BB0\u8BB0\u5F55"] })] }), isLoading ? _jsx("div", { className: "psb-loading", children: "\u6B63\u5728\u52A0\u8F7D\u516C\u5B89\u767B\u8BB0\u6570\u636E" }) : null, errorMessage ? (_jsxs("div", { className: "psb-error", role: "alert", "aria-label": "PSB\u516C\u5B89\u5BF9\u63A5\u52A0\u8F7D\u5931\u8D25", children: [_jsxs("div", { children: [_jsx("strong", { children: "PSB\u516C\u5B89\u5BF9\u63A5\u52A0\u8F7D\u5931\u8D25" }), _jsx("span", { children: errorMessage })] }), _jsx("button", { type: "button", onClick: handleRetry, children: "\u91CD\u65B0\u52A0\u8F7D" })] })) : null, _jsxs("div", { className: "psb-table", role: "table", "aria-label": "\u516C\u5B89\u767B\u8BB0\u5217\u8868", children: [_jsx("div", { className: "psb-table__head", role: "row", children: tableColumns.map((column) => (_jsx("div", { role: "columnheader", children: column }, column))) }), !isLoading && !errorMessage && rows.length === 0 ? (_jsx("div", { className: "psb-table__empty", role: "row", children: _jsxs("div", { role: "cell", "aria-colspan": tableColumns.length, children: [_jsx("span", { className: "psb-empty-icon", "aria-hidden": "true" }), _jsx("strong", { children: "\u6682\u65E0\u6570\u636E" })] }) })) : null, !isLoading && !errorMessage && rows.length > 0 ? (_jsx("div", { className: "psb-table__body", role: "rowgroup", children: rows.map((row) => (_jsxs("div", { className: "psb-table__row", role: "row", children: [_jsx("div", { role: "cell", children: row.systemName }), _jsx("div", { role: "cell", children: row.hotelCode }), _jsx("div", { role: "cell", children: row.typeLabel }), _jsx("div", { role: "cell", children: row.merchantName }), _jsx("div", { role: "cell", children: row.storeName }), _jsx("div", { role: "cell", children: row.roomCount }), _jsxs("div", { role: "cell", className: "psb-table__actions", children: [_jsx("button", { type: "button", onClick: () => setDetailRow(row), children: "\u67E5\u770B" }), _jsx("button", { type: "button", onClick: () => setPendingDeleteRow(row), children: "\u5220\u9664" })] })] }, row.id))) })) : null] }), pageData ? (_jsx("div", { className: "sr-only-heading", "aria-label": "PSB\u516C\u5B89\u5BF9\u63A5\u6570\u636E\u670D\u52A1", children: pageData.requestSummary.join(' | ') })) : null] }), isAddOpen && pageData ? (_jsx(AddPsbDialog, { stores: pageData.stores, roomCount: pageData.roomCategories.reduce((sum, item) => sum + item.roomCount, 0), filters: createDefaultPsbPoliceFilters(new URLSearchParams(location.search)), onClose: closeDialog, onSubmitSuccess: (result) => {
                    setRows((current) => [result.createdRow, ...current]);
                    setTotal((current) => current + 1);
                    setFeedback(result.feedbackMessage);
                    setIsAddOpen(false);
                } })) : null, detailRow ? (_jsx("div", { className: "psb-modal-backdrop", children: _jsxs("section", { className: "psb-detail-modal", role: "dialog", "aria-modal": "true", "aria-labelledby": "psb-detail-title", children: [_jsxs("header", { className: "psb-modal__head", children: [_jsx("h2", { id: "psb-detail-title", children: "\u516C\u5B89\u767B\u8BB0\u8BE6\u60C5" }), _jsx("button", { type: "button", "aria-label": "\u5173\u95ED\u8BE6\u60C5", onClick: () => setDetailRow(null), children: "\u00D7" })] }), _jsxs("div", { className: "psb-detail-modal__body", children: [_jsxs("div", { children: [_jsx("span", { children: "\u767B\u8BB0\u7CFB\u7EDF/\u673A\u6784" }), _jsx("strong", { children: detailRow.systemName })] }), _jsxs("div", { children: [_jsx("span", { children: "\u9152\u5E97\u65C5\u4E1A\u7F16\u7801/ID" }), _jsx("strong", { children: detailRow.hotelCode })] }), _jsxs("div", { children: [_jsx("span", { children: "\u5546\u6237\u540D\u79F0" }), _jsx("strong", { children: detailRow.merchantName })] }), _jsxs("div", { children: [_jsx("span", { children: "\u5173\u8054\u95E8\u5E97" }), _jsx("strong", { children: detailRow.storeName })] }), _jsxs("div", { children: [_jsx("span", { children: "\u5173\u8054\u623F\u95F4\u6570" }), _jsx("strong", { children: detailRow.roomCount })] })] })] }) })) : null, pendingDeleteRow ? (_jsx("div", { className: "psb-modal-backdrop", children: _jsxs("section", { className: "psb-confirm-modal", role: "dialog", "aria-modal": "true", "aria-labelledby": "psb-delete-title", children: [_jsxs("header", { className: "psb-modal__head", children: [_jsx("h2", { id: "psb-delete-title", children: "\u5220\u9664\u786E\u8BA4" }), _jsx("button", { type: "button", "aria-label": "\u5173\u95ED\u5220\u9664\u786E\u8BA4", onClick: () => setPendingDeleteRow(null), children: "\u00D7" })] }), _jsxs("div", { className: "psb-confirm-modal__body", children: [_jsx("p", { children: "\u786E\u8BA4\u5220\u9664\u5F53\u524D PSB \u516C\u5B89\u5BF9\u63A5\u5546\u6237\u5417\uFF1F" }), _jsx("strong", { children: pendingDeleteRow.merchantName })] }), _jsxs("footer", { className: "psb-modal__foot", children: [_jsx("button", { type: "button", onClick: () => setPendingDeleteRow(null), children: "\u53D6 \u6D88" }), _jsx("button", { type: "button", className: "is-primary", onClick: () => {
                                        handleDeleteRow(pendingDeleteRow.id);
                                        setPendingDeleteRow(null);
                                    }, children: "\u786E \u5B9A" })] })] }) })) : null] }));
}
function AddPsbDialog({ stores, roomCount, filters, onClose, onSubmitSuccess, }) {
    const [formState, setFormState] = useState({
        systemName: PSB_SYSTEM_NAME,
        merchantName: '',
        poiId: '',
        travelBusinessName: '',
        travelBusinessCode: '',
        socialCreditCode: '',
        travelBusinessAddress: '',
        districtCode: '',
        registerCode: '',
        hotelCode: '',
        accessKeyId: '',
        devicePublicKey: '',
        devicePrivateKey: '',
        registrantName: '',
        registrantIdNumber: '',
    });
    const [fieldErrors, setFieldErrors] = useState({});
    const [submitMessage, setSubmitMessage] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isStoreListOpen, setIsStoreListOpen] = useState(false);
    const selectedStore = stores.find((store) => store.poiId === formState.poiId) ?? null;
    function updateField(field, value) {
        setFormState((current) => ({ ...current, [field]: value }));
        setFieldErrors((current) => {
            if (!current[field])
                return current;
            return { ...current, [field]: undefined };
        });
        if (field === 'poiId') {
            setIsStoreListOpen(false);
        }
    }
    function validateForm() {
        const nextErrors = {};
        if (!formState.merchantName.trim())
            nextErrors.merchantName = '商户名称不能为空';
        if (!formState.poiId.trim())
            nextErrors.poiId = '请选择门店';
        if (!formState.travelBusinessName.trim())
            nextErrors.travelBusinessName = '旅业经营名称不能为空';
        if (!formState.travelBusinessCode.trim())
            nextErrors.travelBusinessCode = '旅业编码不能为空';
        if (!formState.socialCreditCode.trim())
            nextErrors.socialCreditCode = '社会信用代码不能为空';
        if (!formState.travelBusinessAddress.trim())
            nextErrors.travelBusinessAddress = '旅业经营地址不能为空';
        if (!formState.districtCode.trim())
            nextErrors.districtCode = '行政区划码不能为空';
        if (!formState.registerCode.trim())
            nextErrors.registerCode = '旅业申请的注册码不能为空';
        if (!formState.hotelCode.trim())
            nextErrors.hotelCode = '旅馆编码不能为空';
        if (!formState.accessKeyId.trim())
            nextErrors.accessKeyId = 'accessKeyId不能为空';
        if (!formState.devicePublicKey.trim())
            nextErrors.devicePublicKey = '设备处理业务公钥不能为空';
        if (!formState.devicePrivateKey.trim())
            nextErrors.devicePrivateKey = '设备处理业务私钥不能为空';
        if (!formState.registrantName.trim())
            nextErrors.registrantName = '登记人姓名不能为空';
        if (!formState.registrantIdNumber.trim())
            nextErrors.registrantIdNumber = '登记人证件号码不能为空';
        if (formState.registrantName.trim()) {
            const nameError = validatePersonName(formState.registrantName);
            if (nameError)
                nextErrors.registrantName = nameError;
        }
        if (formState.registrantIdNumber.trim()) {
            const credentialError = validateCredentialNumber('居民身份证', formState.registrantIdNumber);
            if (credentialError)
                nextErrors.registrantIdNumber = credentialError;
        }
        setFieldErrors(nextErrors);
        return Object.keys(nextErrors).length === 0;
    }
    async function handleSubmit() {
        setSubmitMessage('');
        if (!validateForm())
            return;
        setIsSubmitting(true);
        try {
            const result = await submitPsbPoliceRegistration(formState, filters);
            onSubmitSuccess(result);
        }
        catch (error) {
            setSubmitMessage(error instanceof Error
                ? error.message
                : 'PSB公安对接资料提交失败，请稍后重试');
        }
        finally {
            setIsSubmitting(false);
        }
    }
    return (_jsx("div", { className: "psb-modal-backdrop", children: _jsxs("section", { className: "psb-modal", role: "dialog", "aria-modal": "true", "aria-labelledby": "psb-add-title", children: [_jsxs("header", { className: "psb-modal__head", children: [_jsx("h2", { id: "psb-add-title", children: "\u65B0\u589E" }), _jsx("button", { type: "button", "aria-label": "\u5173\u95ED", onClick: onClose, children: "\u00D7" })] }), _jsxs("div", { className: "psb-modal__body", children: [_jsxs("div", { className: "psb-form-row", children: [_jsxs("span", { children: [_jsx("em", { children: "*" }), " \u767B\u8BB0\u7CFB\u7EDF/\u673A\u6784\uFF1A"] }), _jsx("button", { type: "button", className: "psb-select", disabled: true, children: PSB_SYSTEM_NAME })] }), addFormFields.map((field) => {
                            const fieldKey = mapFieldLabelToKey(field.label);
                            const fieldError = fieldErrors[fieldKey];
                            return (_jsxs("div", { className: `psb-form-row${field.kind === 'textarea' ? ' is-textarea' : ''}`, children: [_jsxs("span", { children: [_jsx("em", { children: "*" }), " ", field.label, "\uFF1A"] }), _jsxs("div", { className: "psb-field-control", children: [field.kind === 'textarea' ? (_jsx("textarea", { "aria-label": field.label, placeholder: field.placeholder, value: String(formState[fieldKey]), onChange: (event) => updateField(fieldKey, event.target.value) })) : field.kind === 'select' ? (_jsxs("div", { className: "psb-select-wrap", children: [_jsx("button", { type: "button", className: "psb-select", onClick: () => setIsStoreListOpen((current) => !current), children: selectedStore?.poiName ?? field.placeholder }), isStoreListOpen ? (_jsx("div", { className: "psb-select-options", role: "listbox", "aria-label": "\u95E8\u5E97\u9009\u9879", children: stores.map((store) => (_jsx("button", { type: "button", role: "option", "aria-selected": store.poiId === formState.poiId, onClick: () => updateField('poiId', store.poiId), children: store.poiName }, store.poiId))) })) : null] })) : (_jsx("input", { "aria-label": field.label, placeholder: field.placeholder, value: String(formState[fieldKey]), onChange: (event) => updateField(fieldKey, event.target.value) })), fieldError ? _jsx("span", { className: "psb-form-error", children: fieldError }) : null] })] }, field.label));
                        }), _jsxs("div", { className: "psb-form-summary", children: [_jsx("span", { children: "\u5F53\u524D\u5173\u8054\u623F\u95F4\u6570\u9884\u4F30" }), _jsx("strong", { children: roomCount })] }), submitMessage ? (_jsx("div", { className: "psb-submit-message", role: "status", children: submitMessage })) : null] }), _jsxs("footer", { className: "psb-modal__foot", children: [_jsx("button", { type: "button", onClick: onClose, children: "\u53D6 \u6D88" }), _jsx("button", { type: "button", className: "is-primary", onClick: handleSubmit, disabled: isSubmitting, children: "\u786E \u5B9A" })] })] }) }));
}
function mapFieldLabelToKey(label) {
    const fieldMap = {
        商户名称: 'merchantName',
        选择门店: 'poiId',
        旅业经营名称: 'travelBusinessName',
        旅业编码: 'travelBusinessCode',
        社会信用代码: 'socialCreditCode',
        旅业经营地址: 'travelBusinessAddress',
        行政区划码: 'districtCode',
        旅业申请的注册码: 'registerCode',
        旅馆编码: 'hotelCode',
        accessKeyId: 'accessKeyId',
        设备处理业务公钥: 'devicePublicKey',
        设备处理业务私钥: 'devicePrivateKey',
        登记人姓名: 'registrantName',
        登记人证件号码: 'registrantIdNumber',
    };
    return fieldMap[label];
}
