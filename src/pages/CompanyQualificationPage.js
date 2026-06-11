import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { CompanyQualificationRequestError, createDraftCompanyQualificationImage, createEmptyCompanyQualificationDraft, defaultCompanyQualificationQuery, fetchCompanyQualification, resolveCompanyQualificationRuntimeConfig, saveCompanyQualificationProfile, uploadCompanyQualificationAsset, } from '../services/companyQualification';
import { validateOptionalContactPhone } from '../utils/inputValidation';
import './CompanyQualificationPage.css';
const tabs = ['企业信息', '营业资质', '法人证件'];
export function CompanyQualificationPage() {
    const location = useLocation();
    const runtime = useMemo(() => resolveCompanyQualificationRuntimeConfig(location.search), [location.search]);
    const [viewModel, setViewModel] = useState(null);
    const [draft, setDraft] = useState(createEmptyCompanyQualificationDraft());
    const [activeTab, setActiveTab] = useState('企业信息');
    const [editing, setEditing] = useState(false);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [feedback, setFeedback] = useState('企业资质加载中');
    const [refreshToken, setRefreshToken] = useState(0);
    const [formErrors, setFormErrors] = useState({});
    const [dialog, setDialog] = useState(null);
    const nextSuccessMessageRef = useRef('企业资质已加载');
    useEffect(() => {
        const controller = new AbortController();
        queueMicrotask(() => {
            if (controller.signal.aborted)
                return;
            setLoading(true);
            setError('');
        });
        fetchCompanyQualification({
            ...defaultCompanyQualificationQuery,
            provider: runtime.provider,
        }, controller.signal)
            .then((nextViewModel) => {
            if (controller.signal.aborted)
                return;
            setViewModel(nextViewModel);
            setDraft(nextViewModel.profile ? cloneProfile(nextViewModel.profile) : createEmptyCompanyQualificationDraft());
            setEditing(false);
            setFormErrors({});
            setFeedback(nextSuccessMessageRef.current);
        })
            .catch((requestError) => {
            if (controller.signal.aborted)
                return;
            setError(requestError.message || '企业资质加载失败');
            setFeedback('企业资质加载失败');
        })
            .finally(() => {
            if (!controller.signal.aborted)
                setLoading(false);
        });
        return () => controller.abort();
    }, [refreshToken, runtime.mockState, runtime.provider]);
    const contractText = useMemo(() => JSON.stringify(viewModel?.contract ?? {
        provider: runtime.provider ?? 'mock',
        action: 'get',
        path: '/company/qualification/get',
        method: 'POST',
        requestBody: defaultCompanyQualificationQuery,
        traceId: '',
        timestamp: '',
        responseCode: 0,
        state: runtime.mockState ?? 'success',
    }, null, 2), [runtime.mockState, runtime.provider, viewModel?.contract]);
    function selectTab(tab) {
        setActiveTab(tab);
        if (tab !== '企业信息')
            setEditing(false);
        setDialog(null);
        setFeedback(`已切换到${tab}`);
    }
    function openEditor() {
        setEditing(true);
        setDraft(viewModel?.profile ? cloneProfile(viewModel.profile) : createEmptyCompanyQualificationDraft());
        setFormErrors({});
        setFeedback('已进入企业信息编辑状态');
    }
    function cancelEditing() {
        setEditing(false);
        setDraft(viewModel?.profile ? cloneProfile(viewModel.profile) : createEmptyCompanyQualificationDraft());
        setFormErrors({});
        setFeedback('已取消本次修改');
    }
    function updateDraft(key, value) {
        setDraft((current) => ({ ...current, [key]: value }));
        setFormErrors((current) => ({ ...current, [key]: undefined }));
    }
    function uploadDraftImage() {
        const nextImage = createDraftCompanyQualificationImage(draft.images);
        updateDraft('images', [...draft.images, nextImage]);
        setFeedback('已添加企业图片，保存后生效');
    }
    function validateDraft() {
        const nextErrors = {};
        if (!draft.name.trim())
            nextErrors.name = '请输入企业名称';
        const phoneError = validateOptionalContactPhone(draft.phone);
        if (phoneError)
            nextErrors.phone = phoneError;
        if (!draft.city.trim())
            nextErrors.city = '请选择所在城市';
        if (!draft.address.trim())
            nextErrors.address = '请输入详细地址';
        setFormErrors(nextErrors);
        return Object.keys(nextErrors).length === 0;
    }
    async function submitDraft() {
        if (!validateDraft()) {
            setFeedback('请先补全企业信息后再保存');
            return;
        }
        setSaving(true);
        setFeedback('企业资质保存中');
        try {
            const nextViewModel = await saveCompanyQualificationProfile(draft, {
                ...defaultCompanyQualificationQuery,
                provider: runtime.provider,
                legalIdentity: viewModel?.legalIdentity,
            });
            setViewModel(nextViewModel);
            setDraft(nextViewModel.profile ? cloneProfile(nextViewModel.profile) : createEmptyCompanyQualificationDraft());
            setEditing(false);
            setFormErrors({});
            setFeedback('企业资质已保存');
        }
        catch (requestError) {
            const message = requestError instanceof CompanyQualificationRequestError
                ? requestError.message
                : '企业资质保存失败';
            setFeedback(message);
        }
        finally {
            setSaving(false);
        }
    }
    function retryLoad() {
        nextSuccessMessageRef.current = '企业资质已重新加载';
        setLoading(true);
        setError('');
        setFeedback('企业资质加载中');
        setRefreshToken((current) => current + 1);
    }
    function startFromEmpty() {
        setEditing(true);
        setActiveTab('企业信息');
        setDraft(createEmptyCompanyQualificationDraft());
        setFormErrors({});
        setFeedback('请完善企业信息后保存');
    }
    async function handleAssetUpload(target, label) {
        setSaving(true);
        setFeedback(`正在上传${label}`);
        try {
            const result = await uploadCompanyQualificationAsset(target, {
                ...defaultCompanyQualificationQuery,
                provider: runtime.provider,
            });
            setViewModel(result.viewModel);
            setFeedback(`${label}已上传：${result.file.name}`);
        }
        catch (requestError) {
            const message = requestError instanceof CompanyQualificationRequestError
                ? requestError.message
                : `${label}上传失败`;
            setFeedback(message);
        }
        finally {
            setSaving(false);
        }
    }
    function openReference(label) {
        if (label === '下载授权承诺函模板') {
            setFeedback('授权承诺函模板下载任务已创建');
            return;
        }
        setDialog({
            title: label,
            description: referenceDescriptionMap[label] ?? '已打开对应资质说明，请按示例准备并上传清晰文件。',
        });
    }
    return (_jsxs("div", { className: "company-qualification-page", "data-provider": viewModel?.provider ?? runtime.provider ?? 'mock', children: [_jsx("h1", { className: "sr-only-heading", children: "\u4F01\u4E1A\u8D44\u8D28" }), _jsx("pre", { hidden: true, "data-testid": "company-qualification-service-contract", "data-provider": viewModel?.provider ?? runtime.provider ?? 'mock', "aria-label": "\u4F01\u4E1A\u8D44\u8D28\u670D\u52A1\u5951\u7EA6", children: contractText }), _jsx("div", { className: "qualification-feedback", role: "status", "aria-label": "\u4F01\u4E1A\u8D44\u8D28\u64CD\u4F5C\u53CD\u9988", children: feedback }), error ? (_jsxs("section", { className: "qualification-state qualification-state--error", role: "alert", "aria-label": "\u4F01\u4E1A\u8D44\u8D28\u6570\u636E\u9519\u8BEF", children: [_jsx("strong", { children: "\u4F01\u4E1A\u8D44\u8D28\u52A0\u8F7D\u5931\u8D25" }), _jsx("span", { children: error }), _jsx("button", { type: "button", className: "qualification-button qualification-button--primary", onClick: retryLoad, children: "\u91CD\u65B0\u52A0\u8F7D" })] })) : null, _jsx("nav", { className: "qualification-tabs", "aria-label": "\u4F01\u4E1A\u8D44\u8D28\u9875\u7B7E", role: "tablist", children: tabs.map((tab) => (_jsx("button", { type: "button", role: "tab", "aria-selected": activeTab === tab, className: activeTab === tab ? 'is-active' : '', onClick: () => selectTab(tab), children: tab }, tab))) }), _jsxs("section", { className: "qualification-card", children: [!loading && !error && !editing && activeTab === '企业信息' && !viewModel?.profile ? (_jsxs("section", { className: "qualification-state", role: "status", "aria-label": "\u4F01\u4E1A\u8D44\u8D28\u7A7A\u6001", children: [_jsx("strong", { children: "\u6682\u672A\u5B8C\u5584\u4F01\u4E1A\u8D44\u8D28" }), _jsx("span", { children: "\u8BF7\u5148\u8865\u9F50\u4F01\u4E1A\u57FA\u7840\u4FE1\u606F\u3001\u8425\u4E1A\u8D44\u8D28\u548C\u6CD5\u4EBA\u8BC1\u4EF6\uFF0C\u540E\u7EED\u95E8\u5E97\u5C55\u793A\u4E0E\u6E20\u9053\u63A5\u5165\u4F1A\u76F4\u63A5\u590D\u7528\u8FD9\u4E9B\u8D44\u6599\u3002" }), _jsx("button", { type: "button", className: "qualification-button qualification-button--primary", onClick: startFromEmpty, children: "\u7ACB\u5373\u5B8C\u5584" })] })) : null, activeTab === '企业信息' ? (_jsx(CompanyInfoPanel, { editing: editing, loading: loading, saving: saving, draft: draft, fields: viewModel?.fields ?? [], cityOptions: viewModel?.cityOptions ?? [], formErrors: formErrors, imageFiles: editing ? draft.images : viewModel?.profile?.images ?? [], onEdit: openEditor, onCancel: cancelEditing, onSave: () => void submitDraft(), onChange: updateDraft, onUploadImage: uploadDraftImage })) : null, activeTab === '营业资质' ? (_jsx(BusinessLicensePanel, { sections: viewModel?.businessLicenses ?? [], disabled: loading || saving, onReference: openReference, onUpload: (section) => void handleAssetUpload(section.id, section.title) })) : null, activeTab === '法人证件' ? (_jsx(LegalIdentityPanel, { legalIdentity: viewModel?.legalIdentity, disabled: loading || saving, onUpload: (photo) => void handleAssetUpload(photo.id, photo.label) })) : null] }), dialog ? (_jsx("div", { className: "qualification-dialog-backdrop", children: _jsxs("section", { role: "dialog", "aria-modal": "true", "aria-label": dialog.title, className: "qualification-dialog", children: [_jsx("h2", { children: dialog.title }), _jsx("p", { children: dialog.description }), _jsx("button", { type: "button", className: "qualification-button qualification-button--primary", onClick: () => setDialog(null), children: "\u5173\u95ED\u8BF4\u660E" })] }) })) : null] }));
}
function CompanyInfoPanel({ editing, loading, saving, draft, fields, cityOptions, formErrors, imageFiles, onEdit, onCancel, onSave, onChange, onUploadImage, }) {
    return (_jsxs(_Fragment, { children: [_jsxs("div", { className: "qualification-heading", children: [_jsx("h2", { children: "\u4F01\u4E1A\u4FE1\u606F" }), _jsx("div", { className: "qualification-actions", children: editing ? (_jsxs(_Fragment, { children: [_jsx("button", { type: "button", className: "qualification-button", onClick: onCancel, disabled: saving, children: "\u53D6 \u6D88" }), _jsx("button", { type: "button", className: "qualification-button qualification-button--primary", onClick: onSave, disabled: saving, children: "\u4FDD \u5B58" })] })) : (_jsx("button", { type: "button", className: "qualification-button qualification-button--primary", onClick: onEdit, disabled: loading, children: "\u7F16 \u8F91" })) })] }), editing ? (_jsx(CompanyEditForm, { draft: draft, cityOptions: cityOptions, formErrors: formErrors, onChange: onChange, onUploadImage: onUploadImage, imageFiles: imageFiles, disabled: saving })) : (_jsx(CompanyInfoView, { fields: fields, imageFiles: imageFiles, loading: loading }))] }));
}
function CompanyInfoView({ fields, imageFiles, loading, }) {
    return (_jsxs("dl", { className: "company-info-list", "aria-label": "\u4F01\u4E1A\u8D44\u8D28\u4F01\u4E1A\u4FE1\u606F\u8BE6\u60C5", children: [fields.map((field) => (_jsxs("div", { className: "company-info-row", children: [_jsxs("dt", { children: [field.label, "\uFF1A"] }), _jsx("dd", { children: loading ? '加载中...' : field.value })] }, field.label))), _jsxs("div", { className: "company-info-row company-info-row--files", children: [_jsx("dt", { children: "\u56FE\u7247\uFF1A" }), _jsx("dd", { children: imageFiles.length > 0 ? (_jsx("div", { className: "qualification-file-list", "aria-label": "\u4F01\u4E1A\u8D44\u8D28\u56FE\u7247\u5217\u8868", children: imageFiles.map((file) => (_jsxs("article", { className: "qualification-file-card", children: [_jsx("strong", { children: file.name }), _jsx("span", { children: file.uploadedAt })] }, file.id))) })) : ('暂无图片数据') })] })] }));
}
function CompanyEditForm({ draft, cityOptions, formErrors, onChange, onUploadImage, imageFiles, disabled, }) {
    return (_jsxs("form", { className: "company-edit-form", children: [_jsxs("label", { className: "company-edit-row", children: [_jsx("span", { children: "\u4F01\u4E1A\u540D\u79F0" }), _jsxs("div", { children: [_jsx("input", { "aria-label": "\u4F01\u4E1A\u540D\u79F0", value: draft.name, onChange: (event) => onChange('name', event.target.value), disabled: disabled }), formErrors.name ? _jsx("em", { children: formErrors.name }) : null] })] }), _jsxs("label", { className: "company-edit-row", children: [_jsx("span", { children: "\u4F01\u4E1A\u7C7B\u578B" }), _jsx("input", { "aria-label": "\u4F01\u4E1A\u7C7B\u578B", value: draft.type, onChange: (event) => onChange('type', event.target.value), disabled: disabled })] }), _jsxs("label", { className: "company-edit-row", children: [_jsx("span", { children: "\u8054\u7CFB\u7535\u8BDD" }), _jsxs("div", { children: [_jsx("input", { "aria-label": "\u8054\u7CFB\u7535\u8BDD", value: draft.phone, placeholder: "\u8BF7\u8F93\u5165\u8054\u7CFB\u7535\u8BDD", onChange: (event) => onChange('phone', event.target.value), disabled: disabled }), formErrors.phone ? _jsx("em", { children: formErrors.phone }) : null] })] }), _jsxs("label", { className: "company-edit-row", children: [_jsx("span", { children: "\u6240\u5728\u57CE\u5E02" }), _jsxs("div", { children: [_jsxs("select", { "aria-label": "\u6240\u5728\u57CE\u5E02", className: "city-picker", value: draft.city, onChange: (event) => onChange('city', event.target.value), disabled: disabled, children: [_jsx("option", { value: "", children: "\u8BF7\u9009\u62E9\u6240\u5728\u57CE\u5E02" }), cityOptions.map((item) => (_jsx("option", { value: item, children: item }, item)))] }), formErrors.city ? _jsx("em", { children: formErrors.city }) : null] })] }), _jsxs("label", { className: "company-edit-row", children: [_jsx("span", { children: "\u8BE6\u7EC6\u5730\u5740" }), _jsxs("div", { children: [_jsx("input", { "aria-label": "\u8BE6\u7EC6\u5730\u5740", value: draft.address, placeholder: "\u8BF7\u8F93\u5165\u8BE6\u7EC6\u5730\u5740", onChange: (event) => onChange('address', event.target.value), disabled: disabled }), formErrors.address ? _jsx("em", { children: formErrors.address }) : null] })] }), _jsxs("div", { className: "company-edit-row company-edit-row--upload", children: [_jsx("span", { children: "\u56FE\u7247" }), _jsxs("div", { className: "company-edit-upload", children: [_jsx("button", { type: "button", className: "upload-tile", "aria-label": "\u4E0A\u4F20 \u4F01\u4E1A\u56FE\u7247", onClick: onUploadImage, disabled: disabled, children: "\u4E0A\u4F20" }), imageFiles.length > 0 ? (_jsx("div", { className: "qualification-file-list", "aria-label": "\u4F01\u4E1A\u8D44\u8D28\u56FE\u7247\u5217\u8868", children: imageFiles.map((file) => (_jsxs("article", { className: "qualification-file-card", children: [_jsx("strong", { children: file.name }), _jsx("span", { children: file.uploadedAt })] }, file.id))) })) : null] })] })] }));
}
function BusinessLicensePanel({ sections, disabled, onReference, onUpload, }) {
    return (_jsxs(_Fragment, { children: [_jsx("div", { className: "qualification-heading", children: _jsx("h2", { children: "\u8425\u4E1A\u8D44\u8D28" }) }), _jsx("div", { className: "license-list", children: sections.map((group, index) => (_jsxs("article", { className: "license-item", children: [_jsx("div", { className: "license-index", children: index + 1 }), _jsxs("div", { className: "license-main", children: [_jsx("h3", { children: group.title }), _jsx("div", { className: "license-links", children: group.links.map((link) => (_jsx("button", { type: "button", onClick: () => onReference(link), children: link }, link))) }), _jsxs("div", { className: "license-upload", children: [_jsx("button", { type: "button", className: group.kind === 'pdf' ? 'license-upload-pdf' : '', "aria-label": `上传 ${group.title}`, onClick: () => onUpload(group), disabled: disabled, children: group.uploadLabel }), _jsxs("div", { className: "license-upload__meta", children: [_jsx("span", { children: group.hint }), group.files.length > 0 ? (_jsx("div", { className: "qualification-file-list", "aria-label": `${group.title}文件列表`, children: group.files.map((file) => (_jsxs("article", { className: "qualification-file-card", children: [_jsx("strong", { children: file.name }), _jsxs("span", { children: [file.uploadedAt, " \u00B7 ", file.sizeLabel] })] }, file.id))) })) : null] })] })] })] }, group.id))) })] }));
}
function LegalIdentityPanel({ legalIdentity, disabled, onUpload, }) {
    return (_jsxs(_Fragment, { children: [_jsx("div", { className: "qualification-heading", children: _jsx("h2", { children: "\u6CD5\u4EBA\u8BC1\u4EF6" }) }), _jsxs("dl", { className: "legal-info-list", children: [_jsxs("div", { children: [_jsx("dt", { children: "\u8BC1\u4EF6\u7C7B\u578B\uFF1A" }), _jsx("dd", { children: legalIdentity?.documentType ?? '居民身份证' })] }), _jsxs("div", { children: [_jsx("dt", { children: "\u8BC1\u4EF6\u53F7\u7801\uFF1A" }), _jsx("dd", { children: legalIdentity?.documentNumber || '待补充' })] })] }), _jsx("div", { className: "legal-photo-list", children: (legalIdentity?.photos ?? []).map((photo) => (_jsxs("article", { className: "legal-photo-card", children: [_jsx("h3", { children: photo.label }), _jsx("button", { type: "button", "aria-label": `上传 ${photo.label}`, onClick: () => onUpload(photo), disabled: disabled, children: "\u4E0A\u4F20" }), photo.files.length > 0 ? (_jsx("div", { className: "qualification-file-list", "aria-label": `${photo.label}文件列表`, children: photo.files.map((file) => (_jsxs("article", { className: "qualification-file-card", children: [_jsx("strong", { children: file.name }), _jsxs("span", { children: [file.uploadedAt, " \u00B7 ", file.sizeLabel] })] }, file.id))) })) : null] }, photo.id))) })] }));
}
const referenceDescriptionMap = {
    查看示例: '请上传清晰、完整且四角可见的证照示例图片，避免反光、遮挡或裁切。',
    公共场所许可证查看示例: '公共场所许可证需包含经营主体、经营地址和有效期等关键信息。',
    特种行业许可证查看示例: '特种行业许可证需保证证号、发证机关和经营范围完整可辨识。',
    食品经营许可证查看示例: '食品经营许可证建议上传彩色原件照片，确保许可项目可读。',
    行业补充资质说明: '若行业资质未覆盖经营范围，请补传补充资质并保持与营业执照主体一致。',
};
function cloneProfile(profile) {
    return {
        ...profile,
        images: profile.images.map((file) => ({ ...file })),
    };
}
