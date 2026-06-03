import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import http from '../utils/request';
import { setCurrentCampId, setToken, setUser } from '../utils/auth';
import './LoginPage.css';
export function LoginPage() {
    const navigate = useNavigate();
    const [mobile, setMobile] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const handleLogin = async () => {
        if (!mobile.trim()) {
            setError('请输入手机号');
            return;
        }
        if (!password.trim()) {
            setError('请输入密码');
            return;
        }
        setLoading(true);
        setError('');
        try {
            const res = await http.post('/auth/login', { mobile: mobile.trim(), password });
            const { data } = res.data;
            const campId = data.campId ? String(data.campId) : '';
            setToken(data.token);
            setCurrentCampId(campId);
            setUser({
                id: String(data.userId),
                name: data.roleName || mobile,
                mobile: mobile,
                roleName: data.roleName || '',
                campId,
                campName: data.campName ? String(data.campName) : campId,
            });
            navigate('/workspace', { replace: true });
        }
        catch (err) {
            setError(err?.response?.data?.message || err?.message || '登录失败');
        }
        finally {
            setLoading(false);
        }
    };
    return (_jsx("div", { className: "login-page", children: _jsxs("div", { className: "login-card", children: [_jsx("h1", { className: "login-title", children: "\u8DEF\u5BA2\u4E91 PMS" }), _jsx("p", { className: "login-subtitle", children: "\u805A\u5408\u623F\u6001\u7BA1\u7406\u5E73\u53F0" }), _jsxs("div", { className: "login-field", children: [_jsx("label", { children: "\u624B\u673A\u53F7" }), _jsx("input", { type: "text", value: mobile, onChange: (e) => setMobile(e.target.value), placeholder: "\u8BF7\u8F93\u5165\u624B\u673A\u53F7", disabled: loading, onKeyDown: (e) => e.key === 'Enter' && handleLogin() })] }), _jsxs("div", { className: "login-field", children: [_jsx("label", { children: "\u5BC6\u7801" }), _jsx("input", { type: "password", value: password, onChange: (e) => setPassword(e.target.value), placeholder: "\u6F14\u793A\u73AF\u5883\u8BF7\u8F93\u5165 demo-login", disabled: loading, onKeyDown: (e) => e.key === 'Enter' && handleLogin() })] }), error && _jsx("p", { className: "login-error", children: error }), _jsx("button", { className: "login-btn", onClick: handleLogin, disabled: loading, children: loading ? '登录中...' : '登 录' }), _jsx("p", { className: "login-hint", children: "\u6F14\u793A\u5BC6\u7801\uFF1Ademo-login" })] }) }));
}
