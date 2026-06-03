import { jsx as _jsx } from "react/jsx-runtime";
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import { getToken } from './utils/auth';
import './api/setup';
import './index.css';
import App from './App';
if (!getToken() && window.location.hash !== '#/login') {
    window.location.replace('#/login');
}
createRoot(document.getElementById('root')).render(_jsx(StrictMode, { children: _jsx(HashRouter, { children: _jsx(App, {}) }) }));
