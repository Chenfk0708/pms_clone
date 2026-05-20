import baseConfig from '../playwright.config'

export default {
  ...baseConfig,
  testDir: '../tests',
  webServer: undefined,
  use: {
    ...baseConfig.use,
    baseURL: process.env.PMS_TEST_BASE_URL ?? 'http://127.0.0.1:4173',
  },
}
