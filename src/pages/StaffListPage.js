import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { createDefaultStaffListQuery, loadStaffListViewModel, resolveStaffListRuntimeConfig, StaffListServiceError, } from '../services/staffList';
import './StaffListPage.css';
const defaultContract = {
    provider: 'mock',
    responseState: 'loading',
    endpoint: '/customer/staffList/bootstrap',
    traceId: '',
    timestamp: '',
    request: {},
};
export function StaffListPage() {
    const location = useLocation();
    const navigate = useNavigate();
    const runtimeConfig = useMemo(() => resolveStaffListRuntimeConfig({ search: location.search }), [location.search]);
    const query = useMemo(() => createDefaultStaffListQuery(runtimeConfig), [runtimeConfig]);
    const queryKey = JSON.stringify(query);
    return _jsx(StaffListSurface, { query: query, navigate: navigate }, queryKey);
}
function StaffListSurface({ query, navigate, }) {
    const [reloadKey, setReloadKey] = useState(0);
    const [mockStateOverride, setMockStateOverride] = useState(null);
    const [state, setState] = useState({
        kind: 'loading',
        contract: {
            ...defaultContract,
            provider: query.provider ?? 'mock',
        },
    });
    useEffect(() => {
        const abort = new AbortController();
        const requestQuery = mockStateOverride ? { ...query, mockState: mockStateOverride } : query;
        loadStaffListViewModel(requestQuery, abort.signal)
            .then((data) => {
            setState({
                kind: 'ready',
                data,
                contract: toContract(data),
            });
        })
            .catch((error) => {
            if (error instanceof DOMException && error.name === 'AbortError')
                return;
            setState({
                kind: 'error',
                message: error instanceof Error ? error.message : '企微员工管理订阅信息加载失败',
                contract: toErrorContract(error, query.provider ?? 'mock'),
            });
        });
        return () => abort.abort();
    }, [mockStateOverride, query, reloadKey]);
    const contractJson = JSON.stringify(state.contract);
    const viewModel = state.kind === 'ready' ? state.data : null;
    return (_jsxs("div", { className: "staff-list-page", children: [_jsx("pre", { hidden: true, "data-testid": "staff-list-contract", "data-provider": state.contract.provider, "data-response-state": state.contract.responseState, "data-endpoint": state.contract.endpoint, "data-trace-id": state.contract.traceId, children: contractJson }), state.kind === 'loading' ? (_jsxs("section", { className: "staff-list-state-card", role: "status", "aria-label": "\u4F01\u5FAE\u5458\u5DE5\u5217\u8868\u52A0\u8F7D\u4E2D", children: [_jsx("h1", { children: "\u4F01\u5FAESCRM-\u5458\u5DE5\u7BA1\u7406" }), _jsx("p", { children: "\u6B63\u5728\u52A0\u8F7D\u4F01\u5FAE\u5458\u5DE5\u7BA1\u7406\u8BA2\u9605\u4FE1\u606F\uFF0C\u8BF7\u7A0D\u5019\u3002" })] })) : null, state.kind === 'error' ? (_jsxs("section", { className: "staff-list-state-card staff-list-state-card--error", role: "alert", "aria-label": "\u4F01\u5FAE\u5458\u5DE5\u5217\u8868\u9519\u8BEF\u6001", children: [_jsx("h1", { children: "\u4F01\u5FAE\u5458\u5DE5\u7BA1\u7406\u8BA2\u9605\u4FE1\u606F\u52A0\u8F7D\u5931\u8D25" }), _jsx("p", { children: state.message }), _jsx("button", { type: "button", onClick: () => {
                            window.localStorage.setItem('pms.staffList.mockState', 'success');
                            setMockStateOverride('success');
                            setState({
                                kind: 'loading',
                                contract: {
                                    ...state.contract,
                                    responseState: 'loading',
                                },
                            });
                            setReloadKey((value) => value + 1);
                        }, children: "\u91CD\u8BD5" })] })) : null, viewModel?.state === 'empty' ? (_jsxs("section", { className: "staff-list-state-card staff-list-state-card--empty", role: "status", "aria-label": "\u4F01\u5FAE\u5458\u5DE5\u5217\u8868\u7A7A\u6001", children: [_jsx("h1", { children: viewModel.emptyState.title }), _jsx("p", { children: viewModel.emptyState.description })] })) : null, viewModel?.state === 'success' ? (_jsxs("section", { className: "staff-subscription-card", "aria-label": "\u4F01\u5FAE\u5458\u5DE5\u5217\u8868\u672A\u5F00\u901A\u6001", children: [_jsxs("header", { className: "staff-subscription-hero", children: [_jsx("img", { src: viewModel.hero.logoSrc, alt: "", "aria-hidden": "true" }), _jsxs("div", { children: [_jsx("h1", { children: viewModel.hero.title }), _jsx("p", { children: viewModel.hero.description })] }), _jsxs("div", { className: "staff-subscription-action", children: [_jsx("button", { type: "button", onClick: () => navigate(viewModel.routeTargets.paymentDetail, {
                                            state: { product: 'scrm', source: '/customer/staffList' },
                                        }), children: viewModel.hero.actionText }), _jsx("span", { children: viewModel.hero.badgeText })] })] }), _jsxs("section", { className: "staff-product-detail", "aria-label": "\u5546\u54C1\u8BE6\u60C5", children: [_jsx("h2", { children: viewModel.detail.title }), _jsx("div", { className: "staff-product-images", children: viewModel.detail.images.map((image) => (_jsx("img", { src: image.src, alt: image.alt }, image.id))) })] })] })) : null] }));
}
function toContract(data) {
    return {
        provider: data.provider,
        responseState: data.state,
        endpoint: data.endpoint,
        traceId: data.traceId,
        timestamp: data.timestamp,
        request: data.request,
    };
}
function toErrorContract(error, provider) {
    if (error instanceof StaffListServiceError) {
        return {
            provider: error.provider,
            responseState: 'error',
            endpoint: '/customer/staffList/bootstrap',
            traceId: error.response.traceId,
            timestamp: error.response.timestamp,
            request: error.request,
        };
    }
    return {
        provider,
        responseState: 'error',
        endpoint: '/customer/staffList/bootstrap',
        traceId: '',
        timestamp: '',
        request: {},
    };
}
