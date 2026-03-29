import { useEffect, useMemo, useState } from 'react'
import BlockEditor from '@/components/admin/BlockEditor'
import { createProductPageDraft, isProductDetailSource } from '@/lib/page-templates'
import { PAGE_DISPLAY_ORDER } from '@/lib/page-order'
import { PageSchema, type PageData } from '@/lib/schema'
import { isCoreTemplatePage } from '@/lib/template-contract'

type Props = {
  pages: PageData[]
  initialSelectedId?: string
}

function createNewPage(): PageData {
  const token = Date.now().toString()
  return {
    id: `page-${token}`,
    pageType: 'standard',
    slug: `/page-${token}`,
    title: '',
    seo: { title: '', description: '' },
    blocks: [],
  }
}

function isTemplatePage(page: PageData) {
  return PAGE_DISPLAY_ORDER.includes(page.id as (typeof PAGE_DISPLAY_ORDER)[number])
}

export default function PageEditor({ pages, initialSelectedId }: Props) {
  const [hydrated, setHydrated] = useState(false)
  const [draftPages, setDraftPages] = useState<PageData[]>(pages)
  const [persistedIds, setPersistedIds] = useState<string[]>(pages.map((page) => page.id))
  const [selectedId, setSelectedId] = useState<string>(() =>
    pages.some((page) => page.id === initialSelectedId) ? initialSelectedId ?? '' : pages[0]?.id ?? '',
  )
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  const currentPage = useMemo(
    () => draftPages.find((page) => page.id === selectedId) ?? null,
    [draftPages, selectedId],
  )
  const validationIssues = useMemo(() => {
    if (!currentPage) return []
    const result = PageSchema.safeParse(currentPage)
    return result.success ? [] : result.error.issues.map((issue) => `${issue.path.join('.')}：${issue.message}`)
  }, [currentPage])
  const canCreateProductCopy = useMemo(() => isProductDetailSource(currentPage), [currentPage])
  const isLockedTemplatePage = useMemo(() => isCoreTemplatePage(currentPage), [currentPage])
  const pageGroups = useMemo(() => {
    const templatePages = draftPages.filter((page) => isTemplatePage(page) && page.id !== 'product-detail')
    const productPages = draftPages.filter((page) => isProductDetailSource(page))
    const otherPages = draftPages.filter((page) => !isTemplatePage(page) && !isProductDetailSource(page))
    return [
      { key: 'templates', title: '模板页', pages: templatePages },
      { key: 'products', title: '产品详情页', pages: productPages },
      { key: 'others', title: '其他页面', pages: otherPages },
    ].filter((group) => group.pages.length > 0)
  }, [draftPages])

  useEffect(() => setHydrated(true), [])

  function updateCurrentPage(nextPage: PageData) {
    setDraftPages((current) => current.map((page) => (page.id === nextPage.id ? nextPage : page)))
  }

  function addPage() {
    const nextPage = createNewPage()
    setDraftPages((current) => [...current, nextPage])
    setSelectedId(nextPage.id)
    setMessage('已创建未保存的新页面')
  }

  function duplicateProductPage() {
    if (!currentPage) return
    const nextPage = createProductPageDraft(currentPage, draftPages)
    setDraftPages((current) => [...current, nextPage])
    setSelectedId(nextPage.id)
    setMessage('已按产品详情约定生成新草稿，请先修改 slug 和文案后保存')
  }

  async function saveCurrentPage() {
    if (!currentPage) return
    setSaving(true)
    setMessage('')
    const existsInSource = persistedIds.includes(currentPage.id)
    const response = await fetch(existsInSource ? `/api/pages/${currentPage.id}` : '/api/pages', {
      method: existsInSource ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(currentPage),
    })
    const result = await response.json()
    setSaving(false)
    if (!response.ok) {
      setMessage(result.error ?? '页面保存失败')
      return
    }
    updateCurrentPage(result.data)
    if (!existsInSource) setPersistedIds((current) => [...current, result.data.id])
    setMessage('页面保存成功')
  }

  async function deleteCurrentPage() {
    if (!currentPage) return
    if (!persistedIds.includes(currentPage.id)) {
      const nextPages = draftPages.filter((page) => page.id !== currentPage.id)
      setDraftPages(nextPages)
      setSelectedId(nextPages[0]?.id ?? '')
      setMessage('未保存页面已移除')
      return
    }

    const response = await fetch(`/api/pages/${currentPage.id}`, { method: 'DELETE' })
    const result = await response.json()
    if (!response.ok) {
      setMessage(result.error ?? '删除失败')
      return
    }

    const nextPages = draftPages.filter((page) => page.id !== currentPage.id)
    setDraftPages(nextPages)
    setPersistedIds((current) => current.filter((id) => id !== currentPage.id))
    setSelectedId(nextPages[0]?.id ?? '')
    setMessage('页面已删除')
  }

  return (
    <div className="admin-workbench" data-ready={hydrated ? 'true' : 'false'} data-testid="page-editor-workbench">
      {currentPage && (
        <section className="form-grid">
          <div className="admin-card admin-card--wide">
            <div className="admin-toolbar">
              <div>
                <h2>页面切换</h2>
                <p className="muted">选择页面后在下方编辑字段与 blocks。</p>
                <p className="muted">新建页面不会自动加入导航或前台入口。</p>
              </div>
              <button className="button button--secondary" data-testid="new-page-button" onClick={addPage} type="button">
                新建页面
              </button>
            </div>
            <div className="field">
              <label>当前页面</label>
              <select value={selectedId} onChange={(event) => setSelectedId(event.target.value)}>
                {pageGroups.map((group) => (
                  <optgroup key={group.key} label={group.title}>
                    {group.pages.map((page) => (
                      <option key={page.id} value={page.id}>
                        {(page.title || page.id) + ` · ${page.slug}`}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>
          </div>

          <div className="admin-card admin-card--wide">
            <div className="admin-toolbar">
              <div>
                <h2>页面基础信息</h2>
                <p className="muted">编辑页面字段后可直接保存到 Cloudflare D1。</p>
              </div>
              <div className="inline-actions">
                {canCreateProductCopy && (
                  <button className="button button--secondary" data-testid="duplicate-product-page-button" onClick={duplicateProductPage} type="button">
                    复制为新产品页
                  </button>
                )}
                <button className="button button--primary" data-testid="save-page-button" disabled={saving} onClick={saveCurrentPage} type="button">
                  {saving ? '保存中...' : '保存页面'}
                </button>
                <button className="button button--secondary" disabled={isLockedTemplatePage} onClick={deleteCurrentPage} type="button">
                  删除页面
                </button>
              </div>
            </div>

            {canCreateProductCopy && (
              <div className="panel admin-preview-note">
                <p>产品详情复制约定：模板页不进主导航，实际产品页建议使用 `/products/&lt;slug&gt;`。</p>
                <p className="muted">复制后会生成新的 `product-*` 页面草稿，并保留当前详情页的 block 结构。</p>
              </div>
            )}

            {isLockedTemplatePage && (
              <div className="panel admin-preview-note">
                <p>当前页面属于底座保留模板页，不能删除，且必须保持约定 slug 和 pageType。</p>
              </div>
            )}

            <div className="form-grid">
              <div className="field">
                <label>页面 ID</label>
                <input data-testid="page-id-input" value={currentPage.id} readOnly />
              </div>
              <div className="field">
                <label>页面类型</label>
                <input value={currentPage.pageType} readOnly />
              </div>
              <div className="field">
                <label>Slug</label>
                <input
                  data-testid="page-slug-input"
                  readOnly={isLockedTemplatePage}
                  value={currentPage.slug}
                  onChange={(event) => updateCurrentPage({ ...currentPage, slug: event.target.value })}
                />
              </div>
              <div className="field">
                <label>页面标题</label>
                <input data-testid="page-title-input" value={currentPage.title} onChange={(event) => updateCurrentPage({ ...currentPage, title: event.target.value })} />
              </div>
              <div className="field">
                <label>SEO 标题</label>
                <input
                  data-testid="page-seo-title-input"
                  value={currentPage.seo.title}
                  onChange={(event) =>
                    updateCurrentPage({ ...currentPage, seo: { ...currentPage.seo, title: event.target.value } })
                  }
                />
              </div>
              <div className="field">
                <label>SEO 描述</label>
                <textarea
                  data-testid="page-seo-description-input"
                  value={currentPage.seo.description}
                  onChange={(event) =>
                    updateCurrentPage({ ...currentPage, seo: { ...currentPage.seo, description: event.target.value } })
                  }
                />
              </div>
            </div>

            {validationIssues.length > 0 && (
              <div className="admin-section">
                <h3>保存前校验</h3>
                <div className="validation-list">
                  {validationIssues.map((issue) => (
                    <div className="validation-item" key={issue}>{issue}</div>
                  ))}
                </div>
              </div>
            )}

            {message && <p className="muted" data-testid="page-editor-message">{message}</p>}
          </div>

          <BlockEditor page={currentPage} onChange={updateCurrentPage} />

          <div className="admin-card admin-card--wide">
            <div className="admin-toolbar">
              <div>
                <h2>独立预览</h2>
                <p className="muted">预览页会复用真实前台布局与 Astro block 组件。当前仅预览已保存内容。</p>
              </div>
              <div className="inline-actions">
                <a className="button button--secondary" data-testid="open-preview-link" href={`/admin/preview/${currentPage.id}`} target="_blank">
                  打开预览页
                </a>
              </div>
            </div>
            <div className="panel admin-preview-note">
              <p>当前页面：{currentPage.title || currentPage.id}</p>
              <p className="muted">如需查看最新修改，请先保存页面，再打开独立预览页。</p>
            </div>
          </div>
        </section>
      )}
    </div>
  )
}
