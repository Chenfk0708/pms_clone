// Development-only UI identity. Real API authentication still depends on PMS cookies/session.
const devAdminUser = {
    id: 'dev-admin',
    name: '管理员',
    roleLabel: '开发环境',
    developmentOnly: true,
};
export function getCurrentSessionUser() {
    if (!import.meta.env.DEV)
        return null;
    return devAdminUser;
}
