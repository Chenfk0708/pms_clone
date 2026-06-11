import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useRef, useState } from 'react';
import './CompanyInfoPage.css';
import { CompanyInfoRequestError, createEmptyCompanyInfoDraft, createUploadedCompanyImage, defaultCompanyInfoQuery, fetchCompanyInfo, saveCompanyInfo, } from '../services/companyInfo';
import { validateOptionalContactPhone } from '../utils/inputValidation';
export function CompanyInfoPage() {
    const [viewModel, setViewModel] = useState(null);
    const [draft, setDraft] = useState(createEmptyCompanyInfoDraft());
    const [editing, setEditing] = useState(false);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [feedback, setFeedback] = useState('企业信息加载中');
    const [formErrors, setFormErrors] = useState({});
    const [refreshToken, setRefreshToken] = useState(0);
    const nextSuccessMessageRef = useRef('企业信息已加载');
    useEffect(() => {
        const controller = new AbortController();
        fetchCompanyInfo(defaultCompanyInfoQuery, controller.signal)
            .then((data) => {
            if (controller.signal.aborted)
                return;
            setViewModel(data);
            setDraft(data.profile ? cloneProfile(data.profile) : createEmptyCompanyInfoDraft());
            setEditing(false);
            setFormErrors({});
            setFeedback(nextSuccessMessageRef.current);
        })
            .catch((requestError) => {
            if (controller.signal.aborted)
                return;
            setError(requestError.message || '企业信息加载失败');
            setFeedback('企业信息加载失败');
        })
            .finally(() => {
            if (!controller.signal.aborted)
                setLoading(false);
        });
        return () => controller.abort();
    }, [refreshToken]);
    const provider = viewModel?.provider ?? 'mock';
    const contractText = JSON.stringify(viewModel?.contract ?? {
        provider,
        path: '/company/info/get',
        method: 'POST',
        requestBody: defaultCompanyInfoQuery,
        traceId: '',
        timestamp: '',
    });
    function openEditor() {
        setEditing(true);
        setDraft(viewModel?.profile ? cloneProfile(viewModel.profile) : createEmptyCompanyInfoDraft());
        setFormErrors({});
        setFeedback('已进入编辑状态');
    }
    function cancelEditing() {
        setEditing(false);
        setDraft(viewModel?.profile ? cloneProfile(viewModel.profile) : createEmptyCompanyInfoDraft());
        setFormErrors({});
        setFeedback('已取消本次修改');
    }
    function updateDraft(key, value) {
        setDraft((current) => ({ ...current, [key]: value }));
        setFormErrors((current) => ({ ...current, [key]: undefined }));
    }
    function uploadImage() {
        const image = createUploadedCompanyImage(draft.images);
        updateDraft('images', [...draft.images, image]);
        setFeedback('已添加图片，保存后生效');
    }
    function validateDraft() {
        const errors = {};
        if (!draft.name.trim())
            errors.name = '请输入企业名称';
        const phoneError = validateOptionalContactPhone(draft.phone);
        if (phoneError)
            errors.phone = phoneError;
        if (!draft.city.trim())
            errors.city = '请选择所在城市';
        if (!draft.address.trim())
            errors.address = '请输入详细地址';
        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    }
    async function submitDraft() {
        if (!validateDraft()) {
            setFeedback('请先补全必填信息');
            return;
        }
        setSaving(true);
        setFeedback('企业信息保存中');
        try {
            const nextViewModel = await saveCompanyInfo(draft);
            setViewModel(nextViewModel);
            setDraft(nextViewModel.profile ? cloneProfile(nextViewModel.profile) : createEmptyCompanyInfoDraft());
            setEditing(false);
            setFormErrors({});
            setFeedback('企业信息已保存');
        }
        catch (requestError) {
            const message = requestError instanceof CompanyInfoRequestError ? requestError.message : '企业信息保存失败';
            setFeedback(message);
        }
        finally {
            setSaving(false);
        }
    }
    function retryLoad() {
        nextSuccessMessageRef.current = '企业信息已重新加载';
        setLoading(true);
        setError('');
        setFeedback('企业信息加载中');
        setRefreshToken((current) => current + 1);
    }
    function startFromEmpty() {
        openEditor();
        setFeedback('请填写企业信息后保存');
    }
    return (_jsx("div", { className: "company-info-page", "data-provider": provider, children: _jsxs("section", { className: "company-info-panel", "aria-label": "\u4F01\u4E1A\u4FE1\u606F", children: [_jsxs("header", { className: "company-info-header", children: [_jsxs("div", { children: [_jsx("h1", { children: "\u4F01\u4E1A\u4FE1\u606F" }), _jsx("p", { children: "\u7EF4\u62A4\u4F01\u4E1A\u57FA\u7840\u8D44\u6599\uFF0C\u540E\u7EED\u7528\u4E8E\u95E8\u5E97\u5C55\u793A\u3001\u6210\u5458\u534F\u4F5C\u548C\u5BF9\u5916\u4FE1\u606F\u540C\u6B65\u3002" })] }), _jsx("div", { className: "company-info-actions", children: editing ? (_jsxs(_Fragment, { children: [_jsx("button", { type: "button", className: "company-info-button company-info-button--ghost", onClick: cancelEditing, disabled: saving, children: "\u53D6 \u6D88" }), _jsx("button", { type: "button", className: "company-info-button company-info-button--primary", onClick: () => void submitDraft(), disabled: saving, children: "\u4FDD \u5B58" })] })) : (_jsx("button", { type: "button", className: "company-info-button company-info-button--primary", onClick: openEditor, disabled: loading || Boolean(error), children: "\u7F16 \u8F91" })) })] }), _jsx("div", { className: "company-info-feedback", role: "status", "aria-label": "\u4F01\u4E1A\u4FE1\u606F\u64CD\u4F5C\u53CD\u9988", children: feedback }), _jsx("pre", { className: "company-info-contract", "aria-label": "\u4F01\u4E1A\u4FE1\u606F\u670D\u52A1\u5951\u7EA6", children: contractText }), error ? (_jsxs("section", { className: "company-info-state company-info-state--error", role: "alert", "aria-label": "\u4F01\u4E1A\u4FE1\u606F\u6570\u636E\u9519\u8BEF", children: [_jsx("strong", { children: "\u4F01\u4E1A\u4FE1\u606F\u52A0\u8F7D\u5931\u8D25" }), _jsx("span", { children: error }), _jsx("button", { type: "button", className: "company-info-button company-info-button--primary", onClick: retryLoad, children: "\u91CD\u8BD5" })] })) : null, !error && !loading && !editing && !viewModel?.profile ? (_jsxs("section", { className: "company-info-state", role: "status", "aria-label": "\u4F01\u4E1A\u4FE1\u606F\u7A7A\u6001", children: [_jsx("strong", { children: "\u6682\u672A\u586B\u5199\u4F01\u4E1A\u4FE1\u606F" }), _jsx("span", { children: "\u5148\u8865\u9F50\u4F01\u4E1A\u540D\u79F0\u3001\u6240\u5728\u57CE\u5E02\u548C\u8BE6\u7EC6\u5730\u5740\uFF0C\u540E\u7EED\u95E8\u5E97\u5C55\u793A\u4E0E\u6210\u5458\u534F\u4F5C\u4F1A\u76F4\u63A5\u590D\u7528\u8FD9\u4E9B\u8D44\u6599\u3002" }), _jsx("button", { type: "button", className: "company-info-button company-info-button--primary", onClick: startFromEmpty, children: "\u7ACB\u5373\u586B\u5199" })] })) : null, !error && (editing || viewModel?.profile || loading) ? (_jsx("div", { className: `company-info-content ${loading ? 'is-loading' : ''}`, children: editing ? (_jsx(CompanyInfoForm, { draft: draft, errors: formErrors, loading: loading || saving, cityOptions: viewModel?.cityOptions ?? [], onChange: updateDraft, onUpload: uploadImage })) : (_jsx(CompanyInfoReadonly, { fields: viewModel?.fields ?? [], images: viewModel?.profile?.images ?? [], loading: loading })) })) : null] }) }));
}
function CompanyInfoReadonly({ fields, images, loading, }) {
    return (_jsxs("div", { className: "company-info-readonly", "aria-label": "\u4F01\u4E1A\u4FE1\u606F\u8BE6\u60C5", children: [fields.map((field) => (_jsxs("div", { className: "company-info-row", children: [_jsxs("span", { className: "company-info-label", children: [field.label, "\uFF1A"] }), _jsx("span", { className: "company-info-value", children: loading ? '加载中...' : field.value })] }, field.label))), _jsxs("div", { className: "company-info-row company-info-row--images", children: [_jsx("span", { className: "company-info-label", children: "\u56FE\u7247\uFF1A" }), _jsx("div", { className: "company-info-image-column", children: images.length > 0 ? (_jsx("div", { className: "company-info-image-list", "aria-label": "\u4F01\u4E1A\u4FE1\u606F\u56FE\u7247\u5217\u8868", children: images.map((image) => (_jsxs("article", { className: "company-info-image-card", children: [_jsx("div", { className: "company-info-image-card__preview", "aria-hidden": "true", children: image.name.slice(0, 2) }), _jsxs("div", { children: [_jsx("strong", { children: image.name }), _jsx("span", { children: image.uploadedAt })] })] }, image.id))) })) : (_jsxs("div", { className: "company-info-empty-image", "aria-label": "\u4F01\u4E1A\u4FE1\u606F\u56FE\u7247\u5217\u8868", children: [_jsxs("div", { className: "company-info-empty-box", "aria-hidden": "true", children: [_jsx("span", {}), _jsx("i", {})] }), _jsx("p", { children: "\u6682\u65E0\u56FE\u7247\u6570\u636E" })] })) })] })] }));
}
function CompanyInfoForm({ draft, errors, loading, cityOptions, onChange, onUpload, }) {
    return (_jsxs("form", { className: "company-info-form", "aria-label": "\u7F16\u8F91\u4F01\u4E1A\u4FE1\u606F", onSubmit: (event) => event.preventDefault(), children: [_jsxs("label", { className: "company-info-form-row", children: [_jsx("span", { children: "\u4F01\u4E1A\u540D\u79F0\uFF1A" }), _jsxs("div", { className: "company-info-field", children: [_jsx("input", { "aria-label": "\u4F01\u4E1A\u540D\u79F0", value: draft.name, disabled: loading, onChange: (event) => onChange('name', event.target.value) }), errors.name ? _jsx("small", { children: errors.name }) : null] })] }), _jsxs("label", { className: "company-info-form-row", children: [_jsx("span", { children: "\u4F01\u4E1A\u7C7B\u578B\uFF1A" }), _jsx("div", { className: "company-info-field", children: _jsx("input", { "aria-label": "\u4F01\u4E1A\u7C7B\u578B", value: draft.type, disabled: true, readOnly: true }) })] }), _jsxs("label", { className: "company-info-form-row", children: [_jsx("span", { children: "\u8054\u7CFB\u7535\u8BDD\uFF1A" }), _jsxs("div", { className: "company-info-field", children: [_jsx("input", { "aria-label": "\u8054\u7CFB\u7535\u8BDD", value: draft.phone, disabled: loading, onChange: (event) => onChange('phone', event.target.value) }), errors.phone ? _jsx("small", { children: errors.phone }) : null] })] }), _jsxs("label", { className: "company-info-form-row", children: [_jsx("span", { children: "\u6240\u5728\u57CE\u5E02\uFF1A" }), _jsxs("div", { className: "company-info-field", children: [_jsxs("select", { "aria-label": "\u6240\u5728\u57CE\u5E02", value: draft.city, disabled: loading, onChange: (event) => onChange('city', event.target.value), children: [_jsx("option", { value: "", children: "\u8BF7\u9009\u62E9\u6240\u5728\u57CE\u5E02" }), cityOptions.map((option) => (_jsx("option", { value: option, children: option }, option)))] }), errors.city ? _jsx("small", { children: errors.city }) : null] })] }), _jsxs("label", { className: "company-info-form-row company-info-form-row--textarea", children: [_jsx("span", { children: "\u8BE6\u7EC6\u5730\u5740\uFF1A" }), _jsxs("div", { className: "company-info-field", children: [_jsx("textarea", { "aria-label": "\u8BE6\u7EC6\u5730\u5740", value: draft.address, disabled: loading, placeholder: "\u8BF7\u8F93\u5165\u8BE6\u7EC6\u5730\u5740(\u4E0D\u5305\u62EC\u7701\u5E02\u533A)", onChange: (event) => onChange('address', event.target.value) }), errors.address ? _jsx("small", { children: errors.address }) : null] })] }), _jsxs("div", { className: "company-info-form-row company-info-form-row--upload", children: [_jsx("span", { children: "\u56FE\u7247\uFF1A" }), _jsxs("div", { className: "company-info-upload-panel", children: [_jsxs("button", { type: "button", className: "company-info-upload", onClick: onUpload, disabled: loading, children: [_jsx("strong", { children: "+" }), "\u4E0A\u4F20"] }), _jsx("div", { className: "company-info-image-list company-info-image-list--compact", "aria-label": "\u4F01\u4E1A\u4FE1\u606F\u56FE\u7247\u5217\u8868", children: draft.images.length > 0 ? (draft.images.map((image) => (_jsxs("article", { className: "company-info-image-card", children: [_jsx("div", { className: "company-info-image-card__preview", "aria-hidden": "true", children: image.name.slice(0, 2) }), _jsxs("div", { children: [_jsx("strong", { children: image.name }), _jsx("span", { children: image.uploadedAt })] })] }, image.id)))) : (_jsx("div", { className: "company-info-upload-hint", children: "\u4FDD\u5B58\u540E\u4F1A\u540C\u6B65\u5230\u4F01\u4E1A\u8D44\u6599\u5C55\u793A\u533A\u3002" })) })] })] })] }));
}
function cloneProfile(profile) {
    return {
        ...profile,
        images: profile.images.map((image) => ({ ...image })),
    };
}
