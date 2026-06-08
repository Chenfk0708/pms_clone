import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useId, useMemo, useRef, useState } from 'react';
export function StoreSelect({ label, options, value, open, onOpenChange, onSelect, disabled }) {
    const listboxId = useId();
    const normalizedOptions = options.length > 0 ? options : [{ id: 'all', name: '全部门店' }];
    const selectedStore = normalizedOptions.find((option) => option.id === value) ?? normalizedOptions[0];
    const hasValue = selectedStore.id !== normalizedOptions[0]?.id;
    return (_jsxs("div", { className: `month-store-select${hasValue ? ' has-value' : ''}`, children: [_jsxs("button", { type: "button", className: "month-store-select__trigger", "aria-haspopup": "listbox", "aria-expanded": open, "aria-controls": open ? listboxId : undefined, disabled: disabled, title: selectedStore.name, onClick: () => onOpenChange(!open), children: [_jsx("span", { children: selectedStore.name }), _jsx("i", { "aria-hidden": "true" })] }), open ? (_jsx("div", { id: listboxId, className: "month-store-select__options", role: "listbox", "aria-label": label, children: normalizedOptions.map((option) => (_jsx("button", { type: "button", role: "option", "aria-selected": value === option.id, className: "month-store-select__option", title: option.name, onClick: () => {
                        onSelect(option.id);
                        onOpenChange(false);
                    }, children: option.name }, option.id))) })) : null] }));
}
export function StoreSelectControl({ label = '门店范围', options = [], value = 'all', onChange, disabled, className = '', settingsLabel = '门店设置', onSettingsClick, }) {
    const [open, setOpen] = useState(false);
    const rootRef = useRef(null);
    const normalizedOptions = useMemo(() => normalizeStoreSelectOptions(options), [options]);
    const normalizedValue = normalizeStoreValue(value);
    useEffect(() => {
        if (!open)
            return undefined;
        const closeByKey = (event) => {
            if (event.key === 'Escape')
                setOpen(false);
        };
        const closeByPointer = (event) => {
            const target = event.target;
            if (target instanceof Node && rootRef.current?.contains(target))
                return;
            setOpen(false);
        };
        window.addEventListener('keydown', closeByKey);
        window.addEventListener('click', closeByPointer);
        return () => {
            window.removeEventListener('keydown', closeByKey);
            window.removeEventListener('click', closeByPointer);
        };
    }, [open]);
    return (_jsxs("div", { ref: rootRef, className: [
            'month-store-control',
            onSettingsClick ? 'month-store-control--with-settings' : '',
            className,
        ]
            .filter(Boolean)
            .join(' '), children: [_jsx(StoreSelect, { label: label, options: normalizedOptions, value: normalizedValue, open: open, onOpenChange: setOpen, onSelect: (storeId) => {
                    const option = normalizedOptions.find((item) => item.id === storeId) ?? normalizedOptions[0];
                    onChange(storeId, option);
                }, disabled: disabled }), onSettingsClick ? (_jsx("button", { type: "button", className: "month-store-settings", "aria-label": settingsLabel, onClick: onSettingsClick, children: _jsx("span", { "aria-hidden": "true", children: "\u2699" }) })) : null] }));
}
export function normalizeStoreSelectOptions(options = []) {
    const normalized = options.map((option) => {
        const id = normalizeStoreValue(option.id ?? option.value ?? '');
        const name = normalizeStoreLabel(option.name ?? option.label, id);
        return { id, name };
    });
    if (!normalized.some((option) => option.id === 'all')) {
        normalized.unshift({ id: 'all', name: '全部门店' });
    }
    const seen = new Set();
    return normalized.filter((option) => {
        if (!option.id || seen.has(option.id))
            return false;
        seen.add(option.id);
        return true;
    });
}
function normalizeStoreValue(value) {
    const normalized = value?.trim();
    if (!normalized || normalized === 'ALL')
        return 'all';
    return normalized;
}
function normalizeStoreLabel(label, id) {
    const normalized = label?.trim();
    if (normalized)
        return normalized;
    return id === 'all' ? '全部门店' : id;
}
