import { expect, test } from '@playwright/test'

test('新建页面 -> 添加 Hero -> 保存 -> 打开预览页', async ({ page }) => {
  const adminUsername = process.env.ADMIN_USERNAME ?? 'template-admin'
  const adminPassword = process.env.ADMIN_PASSWORD ?? 'change-me-immediately'
  const token = Date.now().toString()
  const pageTitle = `Smoke 页面 ${token}`
  const seoTitle = `Smoke SEO ${token}`
  const seoDescription = `Smoke 描述 ${token}`
  const heroTitle = `Hero 标题 ${token}`

  let pageId = ''

  try {
    await page.goto('/admin/login?next=/admin/pages')
    await page.getByTestId('login-username-input').fill(adminUsername)
    await page.getByTestId('login-password-input').fill(adminPassword)
    await page.getByTestId('login-submit-button').click()
    await expect(page.getByTestId('page-editor-workbench')).toHaveAttribute('data-ready', 'true')

    await page.getByTestId('new-page-button').click()

    pageId = await page.getByTestId('page-id-input').inputValue()
    expect(pageId).toMatch(/^page-\d+$/)
    await page.getByTestId('page-title-input').fill(pageTitle)
    await page.getByTestId('page-seo-title-input').fill(seoTitle)
    await page.getByTestId('page-seo-description-input').fill(seoDescription)

    await page.getByTestId('add-hero-block-button').click()
    await expect(page.getByTestId('block-0-hero')).toBeVisible()

    await page.getByTestId('block-0-hero-title').fill(heroTitle)

    const saveResponsePromise = page.waitForResponse(
      (response) => response.url().endsWith('/api/pages') && response.request().method() === 'POST',
    )
    await page.getByTestId('save-page-button').click()
    const saveResponse = await saveResponsePromise
    expect(saveResponse.status()).toBe(201)

    const previewPopupPromise = page.waitForEvent('popup')
    await page.getByTestId('open-preview-link').click()
    const previewPage = await previewPopupPromise

    await previewPage.waitForLoadState('domcontentloaded')
    await expect(previewPage.getByText(pageTitle)).toBeVisible()
    await expect(previewPage.getByText(heroTitle)).toBeVisible()
  } finally {
    if (pageId) {
      const responseStatus = await page.evaluate(async (id) => {
        const response = await fetch(`/api/pages/${id}`, {
          method: 'DELETE',
        })

        return response.status
      }, pageId)
      expect([200, 404]).toContain(responseStatus)
    }
  }
})
