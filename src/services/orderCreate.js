export async function createOrder(payload, signal) {
    const response = await fetch('/api/orders/create', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
        signal,
    });
    const result = (await response.json().catch(() => null));
    if (!response.ok) {
        throw new Error(result?.errorMsg ? String(result.errorMsg) : `HTTP ${response.status}`);
    }
    if (!result || typeof result !== 'object') {
        throw new Error('创建订单响应不可解析');
    }
    if (result.success === false) {
        throw new Error(String(result.errorMsg || result.errorDetail || '创建订单失败'));
    }
    if (!result.data) {
        throw new Error('创建订单响应缺少 data');
    }
    return result.data;
}
