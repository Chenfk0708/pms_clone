export const defaultProbeApiUrl = 'https://hudson-prod.localhome.cn/checkinGuide/page/get'

export async function collectPmsAuthProbe(page, apiUrl = defaultProbeApiUrl) {
  await page.waitForLoadState('domcontentloaded', { timeout: 15_000 }).catch(() => {})
  await page
    .waitForFunction(
      () =>
        Boolean(document.querySelector('input#mobile')) ||
        Boolean(document.querySelector('#aliyunCaptcha-sliding-slider')) ||
        Boolean(document.body?.innerText?.trim()),
      { timeout: 5_000 },
    )
    .catch(() => {})

  return page.evaluate(
    async ({ apiUrl: resolvedApiUrl }) => {
      const bodyText = document.body?.innerText ?? ''
      const lastSelectCampId = window.localStorage?.getItem('lastSelectCampId') ?? null

      const probe = {
        href: window.location.href,
        title: document.title,
        lastSelectCampId,
        hasMobileInput: Boolean(document.querySelector('input#mobile')),
        hasPasswordInput: Boolean(document.querySelector('input#password')),
        hasSlider: Boolean(document.querySelector('#aliyunCaptcha-sliding-slider')),
        bodySample: bodyText.slice(0, 300),
        apiResult: {
          skipped: !lastSelectCampId,
        },
      }

      if (!lastSelectCampId) {
        return probe
      }

      try {
        const response = await fetch(resolvedApiUrl, {
          method: 'POST',
          credentials: 'include',
          headers: {
            'content-type': 'application/json',
          },
          body: JSON.stringify({
            campId: lastSelectCampId,
            pageNum: 1,
            pageSize: 10,
          }),
        })

        probe.apiResult = {
          skipped: false,
          ok: response.ok,
          status: response.status,
          json: await response.json(),
        }
      } catch (error) {
        probe.apiResult = {
          skipped: false,
          error: error instanceof Error ? error.message : String(error),
        }
      }

      return probe
    },
    { apiUrl },
  )
}

export function classifyPmsAuthProbe(probe) {
  const apiJson = probe?.apiResult?.json

  if (apiJson && typeof apiJson === 'object') {
    if (apiJson.success === true) {
      return {
        authenticated: true,
        reason: 'api_success',
      }
    }

    if (apiJson.errorCode === 'USER_NOT_LOGIN') {
      return {
        authenticated: false,
        reason: 'api_user_not_login',
      }
    }

    if (apiJson.errorCode) {
      return {
        authenticated: false,
        reason: `api_error:${apiJson.errorCode}`,
      }
    }
  }

  if (!probe?.lastSelectCampId) {
    return {
      authenticated: false,
      reason: 'missing_lastSelectCampId',
    }
  }

  if (probe?.hasMobileInput || probe?.hasPasswordInput) {
    return {
      authenticated: false,
      reason: 'login_form_visible',
    }
  }

  if (probe?.hasSlider) {
    return {
      authenticated: false,
      reason: 'slider_visible',
    }
  }

  if (probe?.apiResult?.error) {
    return {
      authenticated: false,
      reason: 'api_request_failed',
    }
  }

  return {
    authenticated: false,
    reason: 'auth_unverified',
  }
}

export function buildPmsAuthSummary(probe) {
  const classification = classifyPmsAuthProbe(probe)

  return {
    ...classification,
    href: probe?.href ?? null,
    title: probe?.title ?? null,
    lastSelectCampId: probe?.lastSelectCampId ?? null,
    hasLoginInputs: Boolean(probe?.hasMobileInput || probe?.hasPasswordInput),
    hasSlider: Boolean(probe?.hasSlider),
    bodySample: probe?.bodySample ?? '',
    apiResult: probe?.apiResult ?? null,
  }
}
