import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchCurrentAccount, saveCurrentAccount } from '../services/account';
import { getUser, setUser } from '../utils/auth';
import { validateOptionalEmail, validatePersonName } from '../utils/inputValidation';
import './AccountSettingPage.css';
const fallbackAccount = {
    id: 'current-user',
    name: '当前用户',
    mobile: '',
    roleName: '管理员',
    campName: '宿银',
    email: '',
    wechat: '',
    passwordSet: false,
};
export function AccountSettingPage() {
    const fileInputRef = useRef(null);
    const successFeedbackTimerRef = useRef(null);
    const [account, setAccount] = useState(() => ({ ...fallbackAccount, ...getUser() }));
    const [feedback, setFeedback] = useState('');
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [oldPassword, setOldPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [formErrors, setFormErrors] = useState({});
    useEffect(() => {
        let ignore = false;
        const fallback = getUser() ?? account;
        setLoading(true);
        fetchCurrentAccount(fallback)
            .then((nextAccount) => {
            if (ignore)
                return;
            setAccount(nextAccount);
            setUser(nextAccount);
        })
            .catch((error) => {
            if (ignore)
                return;
            setFeedback(error?.message || '账号信息加载失败');
        })
            .finally(() => {
            if (!ignore)
                setLoading(false);
        });
        return () => {
            ignore = true;
        };
    }, []);
    useEffect(() => () => clearSuccessFeedbackTimer(), []);
    function clearSuccessFeedbackTimer() {
        if (successFeedbackTimerRef.current === null)
            return;
        window.clearTimeout(successFeedbackTimerRef.current);
        successFeedbackTimerRef.current = null;
    }
    function showFeedback(message) {
        clearSuccessFeedbackTimer();
        setFeedback(message);
    }
    function showSuccessFeedback(message) {
        clearSuccessFeedbackTimer();
        setFeedback(message);
        successFeedbackTimerRef.current = window.setTimeout(() => {
            setFeedback((current) => (current === message ? '' : current));
            successFeedbackTimerRef.current = null;
        }, 2500);
    }
    function updateAccount(nextPatch) {
        setAccount((current) => ({ ...current, ...nextPatch }));
        setFormErrors((current) => {
            const nextErrors = { ...current };
            if ('name' in nextPatch)
                delete nextErrors.name;
            if ('email' in nextPatch)
                delete nextErrors.email;
            return nextErrors;
        });
        showFeedback('');
    }
    function handleAvatarChange(file) {
        if (!file)
            return;
        const reader = new FileReader();
        reader.onload = () => {
            const result = typeof reader.result === 'string' ? reader.result : '';
            if (result)
                updateAccount({ avatar: result });
        };
        reader.readAsDataURL(file);
    }
    async function handleSave() {
        const trimmedName = account.name.trim();
        const nextErrors = {
            name: validatePersonName(trimmedName),
            email: validateOptionalEmail(account.email || ''),
        };
        Object.keys(nextErrors).forEach((key) => {
            if (!nextErrors[key])
                delete nextErrors[key];
        });
        setFormErrors(nextErrors);
        if (Object.keys(nextErrors).length > 0) {
            showFeedback('请先修正账号信息格式');
            return;
        }
        const wantsPasswordChange = Boolean(newPassword || confirmPassword);
        if (wantsPasswordChange && (!oldPassword || !newPassword || !confirmPassword)) {
            showFeedback('修改密码需要输入原密码、新密码和确认密码');
            return;
        }
        if (wantsPasswordChange && newPassword !== confirmPassword) {
            showFeedback('两次输入的新密码不一致');
            return;
        }
        setSaving(true);
        showFeedback('');
        try {
            const nextAccount = await saveCurrentAccount({
                nickName: trimmedName,
                email: account.email?.trim() || undefined,
                wechat: account.wechat?.trim() || undefined,
                avatarUrl: account.avatar || undefined,
                oldPassword: wantsPasswordChange ? oldPassword : undefined,
                newPassword: wantsPasswordChange ? newPassword : undefined,
            }, account);
            setAccount(nextAccount);
            setUser(nextAccount);
            setOldPassword('');
            setNewPassword('');
            setConfirmPassword('');
            showSuccessFeedback('账号信息已保存');
        }
        catch (error) {
            showFeedback(error?.message || '账号信息保存失败');
        }
        finally {
            setSaving(false);
        }
    }
    return (_jsxs("section", { className: "account-setting-page", "aria-label": "\u8D26\u53F7\u8BBE\u7F6E", children: [_jsxs("header", { className: "account-setting-header", children: [_jsxs("nav", { "aria-label": "\u8D26\u53F7\u8BBE\u7F6E\u8DEF\u5F84", children: [_jsx(Link, { to: "/setting/member", children: "\u6210\u5458\u5217\u8868" }), _jsx("span", { children: "/" }), _jsx("strong", { children: "\u8D26\u53F7\u8BBE\u7F6E" })] }), _jsx("button", { type: "button", className: "account-save-button", onClick: handleSave, disabled: saving, children: saving ? '保存中...' : '保存' })] }), _jsx("div", { className: "account-setting-section-title", children: "\u8D26\u53F7\u4FE1\u606F" }), loading ? _jsx("div", { className: "account-setting-loading", children: "\u8D26\u53F7\u4FE1\u606F\u52A0\u8F7D\u4E2D..." }) : null, feedback ? (_jsx("div", { className: "account-setting-feedback", role: "status", "aria-label": "\u8D26\u53F7\u8BBE\u7F6E\u64CD\u4F5C\u53CD\u9988", children: feedback })) : null, _jsxs("div", { className: "account-setting-form", children: [_jsxs("div", { className: "account-setting-row account-setting-row--avatar", children: [_jsx("span", { children: "\u5934\u50CF" }), _jsx("button", { type: "button", className: "account-avatar-uploader", onClick: () => fileInputRef.current?.click(), children: account.avatar ? _jsx("img", { src: account.avatar, alt: "\u5F53\u524D\u5934\u50CF" }) : _jsx(DefaultAccountAvatar, {}) }), _jsx("input", { ref: fileInputRef, type: "file", accept: "image/*", hidden: true, "aria-label": "\u4E0A\u4F20\u5934\u50CF", onChange: (event) => handleAvatarChange(event.target.files?.[0]) })] }), _jsxs("label", { className: "account-setting-row", children: [_jsx("span", { children: "\u59D3\u540D" }), _jsxs("div", { className: "account-setting-field", children: [_jsx("input", { value: account.name, onChange: (event) => updateAccount({ name: event.target.value }) }), formErrors.name ? _jsx("small", { className: "account-setting-field-error", children: formErrors.name }) : null] })] }), _jsxs("div", { className: "account-setting-row", children: [_jsx("span", { children: "\u624B\u673A\u53F7" }), _jsx("strong", { children: account.mobile || '-' })] }), _jsxs("label", { className: "account-setting-row", children: [_jsx("span", { children: "\u90AE\u7BB1" }), _jsxs("div", { className: "account-setting-field", children: [_jsx("input", { type: "email", value: account.email || '', onChange: (event) => updateAccount({ email: event.target.value }) }), formErrors.email ? _jsx("small", { className: "account-setting-field-error", children: formErrors.email }) : null] })] }), _jsxs("label", { className: "account-setting-row", children: [_jsx("span", { children: "\u5FAE\u4FE1" }), _jsx("input", { value: account.wechat || '', onChange: (event) => updateAccount({ wechat: event.target.value }) })] }), _jsxs("div", { className: "account-setting-password-block", "aria-label": "\u767B\u5F55\u5BC6\u7801", children: [_jsxs("div", { className: "account-setting-row", children: [_jsx("span", { children: "\u767B\u5F55\u5BC6\u7801" }), _jsx("strong", { children: account.passwordSet ? '已设置' : '暂未设置' })] }), _jsxs("label", { className: "account-setting-row", children: [_jsx("span", { children: "\u539F\u5BC6\u7801" }), _jsx("input", { type: "password", autoComplete: "current-password", value: oldPassword, onChange: (event) => setOldPassword(event.target.value) })] }), _jsxs("label", { className: "account-setting-row", children: [_jsx("span", { children: "\u65B0\u5BC6\u7801" }), _jsx("input", { type: "password", autoComplete: "new-password", value: newPassword, onChange: (event) => setNewPassword(event.target.value) })] }), _jsxs("label", { className: "account-setting-row", children: [_jsx("span", { children: "\u786E\u8BA4\u5BC6\u7801" }), _jsx("input", { type: "password", autoComplete: "new-password", value: confirmPassword, onChange: (event) => setConfirmPassword(event.target.value) })] })] })] })] }));
}
function DefaultAccountAvatar() {
    return (_jsxs("svg", { viewBox: "0 0 80 80", "aria-hidden": "true", children: [_jsx("circle", { cx: "40", cy: "40", r: "40", fill: "#f0f1f4" }), _jsx("circle", { cx: "40", cy: "32", r: "14", fill: "#dedfe3" }), _jsx("path", { d: "M16 69c4.8-13 13-19.5 24-19.5S59.2 56 64 69", fill: "#dedfe3" })] }));
}
