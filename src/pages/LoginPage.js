import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import http from '../utils/request';
import { setCurrentCampId, setToken, setUser } from '../utils/auth';
import { toAuthUser } from '../services/account';
import suyinLogo from '../assets/suyin-logo.svg';
import './LoginPage.css';
const DEFAULT_CAMP_ID = '10001';
const emptyRegisterForm = {
    username: '',
    password: '',
    nickName: '',
    mobile: '',
    email: '',
    roleId: '',
};
export function LoginPage() {
    const navigate = useNavigate();
    const [mode, setMode] = useState('login');
    const [account, setAccount] = useState('root');
    const [password, setPassword] = useState('123456');
    const [registerForm, setRegisterForm] = useState(emptyRegisterForm);
    const [roles, setRoles] = useState([]);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [optionsLoading, setOptionsLoading] = useState(false);
    useEffect(() => {
        if (mode !== 'register') {
            return;
        }
        let active = true;
        setOptionsLoading(true);
        setError('');
        http
            .get('/auth/register/options', { params: { campId: DEFAULT_CAMP_ID } })
            .then((res) => {
            if (!active)
                return;
            const nextRoles = Array.isArray(res.data?.data?.roles) ? res.data.data.roles : [];
            setRoles(nextRoles);
            setRegisterForm((current) => ({
                ...current,
                roleId: current.roleId || String(nextRoles[0]?.roleId ?? ''),
            }));
        })
            .catch((err) => {
            if (!active)
                return;
            setRoles([]);
            setError(err?.response?.data?.message || err?.message || '角色列表加载失败');
        })
            .finally(() => {
            if (active)
                setOptionsLoading(false);
        });
        return () => {
            active = false;
        };
    }, [mode]);
    const completeLogin = (data, fallback = {}) => {
        const campId = data.campId ? String(data.campId) : DEFAULT_CAMP_ID;
        setToken(data.token);
        setCurrentCampId(campId);
        setUser(toAuthUser(data, { ...fallback, campId }));
        navigate('/workspace', { replace: true });
    };
    const handleLogin = async () => {
        if (!account.trim()) {
            setError('请输入账号');
            return;
        }
        if (!password.trim()) {
            setError('请输入密码');
            return;
        }
        setLoading(true);
        setError('');
        try {
            const loginAccount = account.trim();
            const res = await http.post('/auth/login', buildLoginPayload(loginAccount, password));
            completeLogin(res.data.data, { name: loginAccount, mobile: loginAccount });
        }
        catch (err) {
            setError(err?.response?.data?.message || err?.message || '登录失败');
        }
        finally {
            setLoading(false);
        }
    };
    const handleRegister = async () => {
        const payload = {
            username: registerForm.username.trim(),
            password: registerForm.password,
            nickName: registerForm.nickName.trim(),
            mobile: registerForm.mobile.trim(),
            email: registerForm.email.trim() || undefined,
            campId: Number(DEFAULT_CAMP_ID),
            roleId: registerForm.roleId ? Number(registerForm.roleId) : undefined,
        };
        const validationError = validateRegisterForm(payload);
        if (validationError) {
            setError(validationError);
            return;
        }
        setLoading(true);
        setError('');
        try {
            const res = await http.post('/auth/register', payload);
            completeLogin(res.data.data, { name: payload.nickName, mobile: payload.mobile });
        }
        catch (err) {
            setError(err?.response?.data?.message || err?.message || '注册失败');
        }
        finally {
            setLoading(false);
        }
    };
    const submit = mode === 'login' ? handleLogin : handleRegister;
    return (_jsx("div", { className: "login-page", children: _jsxs("div", { className: "login-card", children: [_jsx("div", { className: "login-brand", "aria-label": "\u5BBF\u94F6", children: _jsx("img", { src: suyinLogo, alt: "\u5BBF\u94F6" }) }), _jsx("h1", { className: "login-title", children: "\u5BBF\u94F6" }), _jsx("p", { className: "login-subtitle", children: "\u805A\u5408\u623F\u6001\u7BA1\u7406\u5E73\u53F0" }), _jsxs("div", { className: "login-tabs", role: "tablist", "aria-label": "\u8D26\u53F7\u5165\u53E3", children: [_jsx("button", { type: "button", className: mode === 'login' ? 'is-active' : '', onClick: () => {
                                setMode('login');
                                setError('');
                            }, children: "\u767B\u5F55" }), _jsx("button", { type: "button", className: mode === 'register' ? 'is-active' : '', onClick: () => {
                                setMode('register');
                                setError('');
                            }, children: "\u6CE8\u518C" })] }), mode === 'login' ? (_jsxs(_Fragment, { children: [_jsxs("div", { className: "login-field", children: [_jsx("label", { children: "\u8D26\u53F7/\u624B\u673A\u53F7/\u90AE\u7BB1" }), _jsx("input", { type: "text", value: account, onChange: (e) => setAccount(e.target.value), placeholder: "\u8BF7\u8F93\u5165\u8D26\u53F7", disabled: loading, onKeyDown: (e) => e.key === 'Enter' && submit() })] }), _jsxs("div", { className: "login-field", children: [_jsx("label", { children: "\u5BC6\u7801" }), _jsx("input", { type: "password", value: password, onChange: (e) => setPassword(e.target.value), placeholder: "\u8BF7\u8F93\u5165\u5BC6\u7801", disabled: loading, onKeyDown: (e) => e.key === 'Enter' && submit() })] })] })) : (_jsx(RegisterFields, { form: registerForm, roles: roles, loading: loading || optionsLoading, onChange: (patch) => setRegisterForm((current) => ({ ...current, ...patch })), onEnter: submit })), error && _jsx("p", { className: "login-error", children: error }), _jsx("button", { className: "login-btn", onClick: submit, disabled: loading || optionsLoading, children: loading ? (mode === 'login' ? '登录中...' : '注册中...') : mode === 'login' ? '登录' : '注册并登录' }), _jsx("p", { className: "login-hint", children: mode === 'login' ? '管理员账号：root / 123456' : '注册后会按所选角色分配权限' })] }) }));
}
function RegisterFields({ form, roles, loading, onChange, onEnter, }) {
    return (_jsxs(_Fragment, { children: [_jsxs("div", { className: "login-field", children: [_jsx("label", { children: "\u767B\u5F55\u8D26\u53F7" }), _jsx("input", { type: "text", value: form.username, onChange: (e) => onChange({ username: e.target.value }), placeholder: "\u5B57\u6BCD\u5F00\u5934\uFF0C3-32 \u4F4D", disabled: loading, onKeyDown: (e) => e.key === 'Enter' && onEnter() })] }), _jsxs("div", { className: "login-field", children: [_jsx("label", { children: "\u5BC6\u7801" }), _jsx("input", { type: "password", value: form.password, onChange: (e) => onChange({ password: e.target.value }), placeholder: "\u81F3\u5C11 6 \u4F4D", disabled: loading, onKeyDown: (e) => e.key === 'Enter' && onEnter() })] }), _jsxs("div", { className: "login-field", children: [_jsx("label", { children: "\u59D3\u540D" }), _jsx("input", { type: "text", value: form.nickName, onChange: (e) => onChange({ nickName: e.target.value }), placeholder: "\u8BF7\u8F93\u5165\u59D3\u540D", disabled: loading, onKeyDown: (e) => e.key === 'Enter' && onEnter() })] }), _jsxs("div", { className: "login-field", children: [_jsx("label", { children: "\u624B\u673A\u53F7" }), _jsx("input", { type: "tel", value: form.mobile, onChange: (e) => onChange({ mobile: e.target.value }), placeholder: "\u8BF7\u8F93\u5165\u624B\u673A\u53F7", disabled: loading, onKeyDown: (e) => e.key === 'Enter' && onEnter() })] }), _jsxs("div", { className: "login-field", children: [_jsx("label", { children: "\u90AE\u7BB1" }), _jsx("input", { type: "email", value: form.email, onChange: (e) => onChange({ email: e.target.value }), placeholder: "\u9009\u586B", disabled: loading, onKeyDown: (e) => e.key === 'Enter' && onEnter() })] }), _jsxs("div", { className: "login-field", children: [_jsx("label", { children: "\u89D2\u8272" }), _jsxs("select", { value: form.roleId, onChange: (e) => onChange({ roleId: e.target.value }), disabled: loading || roles.length === 0, children: [roles.length === 0 ? _jsx("option", { value: "", children: "\u89D2\u8272\u52A0\u8F7D\u4E2D" }) : null, roles.map((role) => (_jsx("option", { value: String(role.roleId), children: role.roleName }, String(role.roleId))))] })] })] }));
}
function buildLoginPayload(account, password) {
    if (/^1[3-9]\d{9}$/.test(account)) {
        return { mobile: account, password };
    }
    if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(account)) {
        return { email: account, password };
    }
    return { username: account, password };
}
function validateRegisterForm(payload) {
    if (!/^[A-Za-z][A-Za-z0-9_]{2,31}$/.test(payload.username)) {
        return '登录账号需为 3-32 位字母、数字或下划线，且以字母开头';
    }
    if (payload.password.trim().length < 6) {
        return '密码长度不能少于 6 位';
    }
    if (!/^[\p{L}\s]{2,30}$/u.test(payload.nickName)) {
        return '姓名格式不正确';
    }
    if (!/^1[3-9]\d{9}$/.test(payload.mobile)) {
        return '手机号格式不正确';
    }
    if (payload.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.email)) {
        return '邮箱格式不正确';
    }
    if (!payload.roleId) {
        return '请选择角色';
    }
    return '';
}
