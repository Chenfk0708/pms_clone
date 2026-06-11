export const inputValidationMessages = {
    personName: '姓名格式不正确，请输入 2-30 个中文或英文字母',
    mobile: '手机号格式不正确',
    contactPhone: '联系电话格式不正确',
    residentIdCard: '居民身份证号格式不正确',
    credential: '证件号码格式不正确',
    email: '邮箱格式不正确',
};
const personNamePattern = /^[\p{L}·\s]{2,30}$/u;
const mainlandMobilePattern = /^1[3-9]\d{9}$/;
const prefixedMainlandMobilePattern = /^(?:\+?86[-\s]?|0086[-\s]?)1[3-9]\d{9}$/;
const landlinePattern = /^0\d{2,3}-?\d{7,8}$/;
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const generalCredentialPattern = /^[A-Za-z0-9-]{5,20}$/;
export function validatePersonName(value) {
    const normalized = value.trim();
    if (!normalized || !personNamePattern.test(normalized) || !hasLetter(normalized)) {
        return inputValidationMessages.personName;
    }
    return '';
}
export function validateOptionalMainlandMobile(value) {
    const normalized = value.trim();
    if (normalized && !mainlandMobilePattern.test(normalized)) {
        return inputValidationMessages.mobile;
    }
    return '';
}
export function validateRequiredMainlandMobile(value) {
    const normalized = value.trim();
    if (!normalized || !mainlandMobilePattern.test(normalized)) {
        return inputValidationMessages.mobile;
    }
    return '';
}
export function validateOptionalContactPhone(value) {
    const normalized = value.trim();
    if (normalized && !mainlandMobilePattern.test(normalized) && !prefixedMainlandMobilePattern.test(normalized) && !landlinePattern.test(normalized)) {
        return inputValidationMessages.contactPhone;
    }
    return '';
}
export function validateOptionalEmail(value) {
    const normalized = value.trim();
    if (normalized && !emailPattern.test(normalized)) {
        return inputValidationMessages.email;
    }
    return '';
}
export function validateCredentialNumber(credentialType, credentialNumber) {
    const normalized = credentialNumber.trim();
    if (!normalized)
        return '';
    if (!credentialType.trim() || credentialType === '居民身份证') {
        return isValidResidentIdCard(normalized) ? '' : inputValidationMessages.residentIdCard;
    }
    return generalCredentialPattern.test(normalized) ? '' : inputValidationMessages.credential;
}
function isValidResidentIdCard(value) {
    if (!/^\d{17}[\dXx]$/.test(value))
        return false;
    const weights = [7, 9, 10, 5, 8, 4, 2, 1, 6, 3, 7, 9, 10, 5, 8, 4, 2];
    const checkCodes = ['1', '0', 'X', '9', '8', '7', '6', '5', '4', '3', '2'];
    const sum = weights.reduce((total, weight, index) => total + Number(value[index]) * weight, 0);
    return checkCodes[sum % 11] === value[17].toUpperCase();
}
function hasLetter(value) {
    return Array.from(value).some((char) => /\p{L}/u.test(char));
}
