import { useEffect, useState } from 'react'
import MediaPickerField from '@/components/admin/MediaPickerField'
import type { MediaFile } from '@/lib/media-types'
import type { Block, PageData } from '@/lib/schema'

type Props = {
  page: PageData
  onChange: (page: PageData) => void
}

function createBlock(type: Block['type']): Block {
  switch (type) {
    case 'hero':
      return { type: 'hero', props: { eyebrow: '', title: '', description: '', primaryCtaLabel: '', primaryCtaHref: '', secondaryCtaLabel: '', secondaryCtaHref: '', image: '' } }
    case 'features':
      return { type: 'features', props: { title: '', items: [{ title: '', description: '', icon: '' }] } }
    case 'faq':
      return { type: 'faq', props: { title: '', items: [{ question: '', answer: '' }] } }
    case 'cta':
      return { type: 'cta', props: { title: '', description: '', buttonLabel: '', buttonHref: '' } }
    case 'content':
      return { type: 'content', props: { title: '', paragraphs: [''] } }
    case 'media-text':
      return { type: 'media-text', props: { eyebrow: '', title: '', description: '', body: [''], image: '', imageAlt: '', buttonLabel: '', buttonHref: '', layout: 'image-right' } }
    case 'logo-grid':
      return { type: 'logo-grid', props: { title: '', description: '', logos: [{ name: '', image: '', href: '' }] } }
    case 'product-feed':
      return { type: 'product-feed', props: { title: '', description: '', buttonLabel: '查看详情', emptyMessage: '暂无产品详情页，请先从“产品详情”模板复制并保存至少一个产品页。' } }
    case 'showcase-grid':
      return {
        type: 'showcase-grid',
        props: {
          eyebrow: '',
          title: '',
          description: '',
          variant: 'product',
          items: [{ title: '', subtitle: '', description: '', image: '', href: '', tag: '' }],
        },
      }
    case 'gallery':
      return {
        type: 'gallery',
        props: {
          eyebrow: '',
          title: '',
          description: '',
          images: [{ src: '', alt: '', caption: '' }],
        },
      }
  }
}

function updateBlock(page: PageData, blockIndex: number, nextBlock: Block) {
  return { ...page, blocks: page.blocks.map((block, index) => (index === blockIndex ? nextBlock : block)) }
}

function Field({
  label,
  value,
  onChange,
  multiline = false,
  testId,
}: {
  label: string
  value?: string
  onChange: (nextValue: string) => void
  multiline?: boolean
  testId?: string
}) {
  return (
    <div className="field">
      <label>{label}</label>
      {multiline ? (
        <textarea data-testid={testId} value={value ?? ''} onChange={(event) => onChange(event.target.value)} />
      ) : (
        <input data-testid={testId} value={value ?? ''} onChange={(event) => onChange(event.target.value)} />
      )}
    </div>
  )
}

export default function BlockEditor({ page, onChange }: Props) {
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([])
  const [mediaLoading, setMediaLoading] = useState(false)
  const [mediaError, setMediaError] = useState('')

  async function loadMediaFiles() {
    setMediaLoading(true)
    setMediaError('')
    try {
      const response = await fetch('/api/media')
      const result = await response.json()
      setMediaLoading(false)
      if (!response.ok) {
        setMediaError(result.error ?? '媒体库加载失败')
        return
      }
      setMediaFiles(result.files ?? [])
    } catch {
      setMediaLoading(false)
      setMediaError('媒体库加载失败')
    }
  }

  useEffect(() => {
    void loadMediaFiles()
  }, [])

  function addBlock(type: Block['type']) {
    onChange({ ...page, blocks: [...page.blocks, createBlock(type)] })
  }

  function deleteBlock(index: number) {
    onChange({ ...page, blocks: page.blocks.filter((_, blockIndex) => blockIndex !== index) })
  }

  function moveBlock(index: number, direction: -1 | 1) {
    const nextIndex = index + direction
    if (nextIndex < 0 || nextIndex >= page.blocks.length) return
    const nextBlocks = [...page.blocks]
    const current = nextBlocks[index]
    nextBlocks[index] = nextBlocks[nextIndex]
    nextBlocks[nextIndex] = current
    onChange({ ...page, blocks: nextBlocks })
  }

  return (
    <div className="admin-card admin-card--wide">
      <div className="admin-toolbar">
        <div>
          <h2>Block 编辑器</h2>
          <p className="muted">支持增删改与上下排序，保存时直接写回当前页面 JSON。</p>
        </div>
        <div className="inline-actions">
          <button className="button button--secondary" data-testid="add-hero-block-button" onClick={() => addBlock('hero')} type="button">添加 Hero</button>
          <button className="button button--secondary" onClick={() => addBlock('features')} type="button">添加 Features</button>
          <button className="button button--secondary" onClick={() => addBlock('faq')} type="button">添加 FAQ</button>
          <button className="button button--secondary" onClick={() => addBlock('cta')} type="button">添加 CTA</button>
          <button className="button button--secondary" onClick={() => addBlock('content')} type="button">添加 Content</button>
          <button className="button button--secondary" onClick={() => addBlock('media-text')} type="button">添加 Media Text</button>
          <button className="button button--secondary" onClick={() => addBlock('logo-grid')} type="button">添加 Logo Grid</button>
          <button className="button button--secondary" onClick={() => addBlock('product-feed')} type="button">添加 Product Feed</button>
          <button className="button button--secondary" onClick={() => addBlock('showcase-grid')} type="button">添加 Showcase Grid</button>
          <button className="button button--secondary" onClick={() => addBlock('gallery')} type="button">添加 Gallery</button>
        </div>
      </div>

      <div className="form-grid">
        {page.blocks.map((block, blockIndex) => (
          <div className="feature-item" data-testid={`block-${blockIndex}-${block.type}`} key={`${page.id}-${block.type}-${blockIndex}`}>
            <div className="admin-toolbar">
              <strong>{block.type}</strong>
              <div className="inline-actions">
                <button className="button button--secondary" onClick={() => moveBlock(blockIndex, -1)} type="button">上移</button>
                <button className="button button--secondary" onClick={() => moveBlock(blockIndex, 1)} type="button">下移</button>
                <button className="button button--secondary" onClick={() => deleteBlock(blockIndex)} type="button">删除</button>
              </div>
            </div>

            {block.type === 'hero' && (
              <div className="form-grid">
                <Field label="Eyebrow" value={block.props.eyebrow} onChange={(nextValue) => onChange(updateBlock(page, blockIndex, { ...block, props: { ...block.props, eyebrow: nextValue } }))} />
                <Field label="标题" value={block.props.title} onChange={(nextValue) => onChange(updateBlock(page, blockIndex, { ...block, props: { ...block.props, title: nextValue } }))} testId={`block-${blockIndex}-hero-title`} />
                <Field label="描述" value={block.props.description} onChange={(nextValue) => onChange(updateBlock(page, blockIndex, { ...block, props: { ...block.props, description: nextValue } }))} />
                <Field label="主按钮文案" value={block.props.primaryCtaLabel} onChange={(nextValue) => onChange(updateBlock(page, blockIndex, { ...block, props: { ...block.props, primaryCtaLabel: nextValue } }))} />
                <Field label="主按钮链接" value={block.props.primaryCtaHref} onChange={(nextValue) => onChange(updateBlock(page, blockIndex, { ...block, props: { ...block.props, primaryCtaHref: nextValue } }))} />
                <Field label="次按钮文案" value={block.props.secondaryCtaLabel} onChange={(nextValue) => onChange(updateBlock(page, blockIndex, { ...block, props: { ...block.props, secondaryCtaLabel: nextValue } }))} />
                <Field label="次按钮链接" value={block.props.secondaryCtaHref} onChange={(nextValue) => onChange(updateBlock(page, blockIndex, { ...block, props: { ...block.props, secondaryCtaHref: nextValue } }))} />
                <MediaPickerField error={mediaError} files={mediaFiles} label="图片" loading={mediaLoading} onChange={(nextValue) => onChange(updateBlock(page, blockIndex, { ...block, props: { ...block.props, image: nextValue } }))} onRefresh={() => void loadMediaFiles()} value={block.props.image ?? ''} />
              </div>
            )}

            {block.type === 'features' && (
              <div className="form-grid">
                <Field label="区块标题" value={block.props.title} onChange={(nextValue) => onChange(updateBlock(page, blockIndex, { ...block, props: { ...block.props, title: nextValue } }))} />
                {block.props.items.map((item, itemIndex) => (
                  <div className="feature-item" key={`${blockIndex}-feature-${itemIndex}`}>
                    <div className="admin-toolbar">
                      <strong>Feature {itemIndex + 1}</strong>
                      <button className="button button--secondary" onClick={() => onChange(updateBlock(page, blockIndex, { ...block, props: { ...block.props, items: block.props.items.filter((_, index) => index !== itemIndex) } }))} type="button">删除条目</button>
                    </div>
                    <Field label="标题" value={item.title} onChange={(nextValue) => onChange(updateBlock(page, blockIndex, { ...block, props: { ...block.props, items: block.props.items.map((entry, index) => index === itemIndex ? { ...entry, title: nextValue } : entry) } }))} />
                    <Field label="描述" value={item.description} onChange={(nextValue) => onChange(updateBlock(page, blockIndex, { ...block, props: { ...block.props, items: block.props.items.map((entry, index) => index === itemIndex ? { ...entry, description: nextValue } : entry) } }))} />
                    <Field label="Icon" value={item.icon} onChange={(nextValue) => onChange(updateBlock(page, blockIndex, { ...block, props: { ...block.props, items: block.props.items.map((entry, index) => index === itemIndex ? { ...entry, icon: nextValue } : entry) } }))} />
                  </div>
                ))}
                <button className="button button--secondary" onClick={() => onChange(updateBlock(page, blockIndex, { ...block, props: { ...block.props, items: [...block.props.items, { title: '', description: '', icon: '' }] } }))} type="button">添加 Feature 条目</button>
              </div>
            )}

            {block.type === 'faq' && (
              <div className="form-grid">
                <Field label="区块标题" value={block.props.title} onChange={(nextValue) => onChange(updateBlock(page, blockIndex, { ...block, props: { ...block.props, title: nextValue } }))} />
                {block.props.items.map((item, itemIndex) => (
                  <div className="feature-item" key={`${blockIndex}-faq-${itemIndex}`}>
                    <div className="admin-toolbar">
                      <strong>FAQ {itemIndex + 1}</strong>
                      <button className="button button--secondary" onClick={() => onChange(updateBlock(page, blockIndex, { ...block, props: { ...block.props, items: block.props.items.filter((_, index) => index !== itemIndex) } }))} type="button">删除条目</button>
                    </div>
                    <Field label="问题" value={item.question} onChange={(nextValue) => onChange(updateBlock(page, blockIndex, { ...block, props: { ...block.props, items: block.props.items.map((entry, index) => index === itemIndex ? { ...entry, question: nextValue } : entry) } }))} />
                    <Field label="回答" value={item.answer} onChange={(nextValue) => onChange(updateBlock(page, blockIndex, { ...block, props: { ...block.props, items: block.props.items.map((entry, index) => index === itemIndex ? { ...entry, answer: nextValue } : entry) } }))} />
                  </div>
                ))}
                <button className="button button--secondary" onClick={() => onChange(updateBlock(page, blockIndex, { ...block, props: { ...block.props, items: [...block.props.items, { question: '', answer: '' }] } }))} type="button">添加 FAQ 条目</button>
              </div>
            )}

            {block.type === 'cta' && (
              <div className="form-grid">
                <Field label="标题" value={block.props.title} onChange={(nextValue) => onChange(updateBlock(page, blockIndex, { ...block, props: { ...block.props, title: nextValue } }))} />
                <Field label="描述" value={block.props.description} onChange={(nextValue) => onChange(updateBlock(page, blockIndex, { ...block, props: { ...block.props, description: nextValue } }))} />
                <Field label="按钮文案" value={block.props.buttonLabel} onChange={(nextValue) => onChange(updateBlock(page, blockIndex, { ...block, props: { ...block.props, buttonLabel: nextValue } }))} />
                <Field label="按钮链接" value={block.props.buttonHref} onChange={(nextValue) => onChange(updateBlock(page, blockIndex, { ...block, props: { ...block.props, buttonHref: nextValue } }))} />
              </div>
            )}

            {block.type === 'content' && (
              <div className="form-grid">
                <Field label="区块标题" value={block.props.title} onChange={(nextValue) => onChange(updateBlock(page, blockIndex, { ...block, props: { ...block.props, title: nextValue } }))} />
                {block.props.paragraphs.map((paragraph, paragraphIndex) => (
                  <div className="feature-item" key={`${blockIndex}-content-${paragraphIndex}`}>
                    <div className="admin-toolbar">
                      <strong>正文段落 {paragraphIndex + 1}</strong>
                      <button className="button button--secondary" onClick={() => onChange(updateBlock(page, blockIndex, { ...block, props: { ...block.props, paragraphs: block.props.paragraphs.filter((_, index) => index !== paragraphIndex) } }))} type="button">删除段落</button>
                    </div>
                    <Field label="正文" value={paragraph} onChange={(nextValue) => onChange(updateBlock(page, blockIndex, { ...block, props: { ...block.props, paragraphs: block.props.paragraphs.map((entry, index) => index === paragraphIndex ? nextValue : entry) } }))} multiline />
                  </div>
                ))}
                <button className="button button--secondary" onClick={() => onChange(updateBlock(page, blockIndex, { ...block, props: { ...block.props, paragraphs: [...block.props.paragraphs, ''] } }))} type="button">添加正文段落</button>
              </div>
            )}

            {block.type === 'media-text' && (
              <div className="form-grid">
                <Field label="Eyebrow" value={block.props.eyebrow} onChange={(nextValue) => onChange(updateBlock(page, blockIndex, { ...block, props: { ...block.props, eyebrow: nextValue } }))} />
                <Field label="标题" value={block.props.title} onChange={(nextValue) => onChange(updateBlock(page, blockIndex, { ...block, props: { ...block.props, title: nextValue } }))} />
                <Field label="摘要" value={block.props.description} onChange={(nextValue) => onChange(updateBlock(page, blockIndex, { ...block, props: { ...block.props, description: nextValue } }))} />
                <div className="field">
                  <label>布局</label>
                  <select value={block.props.layout} onChange={(event) => onChange(updateBlock(page, blockIndex, { ...block, props: { ...block.props, layout: event.target.value as 'image-left' | 'image-right' } }))}>
                    <option value="image-left">图片在左</option>
                    <option value="image-right">图片在右</option>
                  </select>
                </div>
                <MediaPickerField error={mediaError} files={mediaFiles} label="图片" loading={mediaLoading} onChange={(nextValue) => onChange(updateBlock(page, blockIndex, { ...block, props: { ...block.props, image: nextValue } }))} onRefresh={() => void loadMediaFiles()} value={block.props.image} />
                <Field label="图片替代文本" value={block.props.imageAlt} onChange={(nextValue) => onChange(updateBlock(page, blockIndex, { ...block, props: { ...block.props, imageAlt: nextValue } }))} />
                {block.props.body.map((paragraph, paragraphIndex) => (
                  <div className="feature-item" key={`${blockIndex}-media-text-${paragraphIndex}`}>
                    <div className="admin-toolbar">
                      <strong>正文段落 {paragraphIndex + 1}</strong>
                      <button className="button button--secondary" onClick={() => onChange(updateBlock(page, blockIndex, { ...block, props: { ...block.props, body: block.props.body.filter((_, index) => index !== paragraphIndex) } }))} type="button">删除段落</button>
                    </div>
                    <Field label="正文" value={paragraph} onChange={(nextValue) => onChange(updateBlock(page, blockIndex, { ...block, props: { ...block.props, body: block.props.body.map((entry, index) => index === paragraphIndex ? nextValue : entry) } }))} multiline />
                  </div>
                ))}
                <button className="button button--secondary" onClick={() => onChange(updateBlock(page, blockIndex, { ...block, props: { ...block.props, body: [...block.props.body, ''] } }))} type="button">添加正文段落</button>
                <Field label="按钮文案" value={block.props.buttonLabel} onChange={(nextValue) => onChange(updateBlock(page, blockIndex, { ...block, props: { ...block.props, buttonLabel: nextValue } }))} />
                <Field label="按钮链接" value={block.props.buttonHref} onChange={(nextValue) => onChange(updateBlock(page, blockIndex, { ...block, props: { ...block.props, buttonHref: nextValue } }))} />
              </div>
            )}

            {block.type === 'logo-grid' && (
              <div className="form-grid">
                <Field label="区块标题" value={block.props.title} onChange={(nextValue) => onChange(updateBlock(page, blockIndex, { ...block, props: { ...block.props, title: nextValue } }))} />
                <Field label="区块描述" value={block.props.description} onChange={(nextValue) => onChange(updateBlock(page, blockIndex, { ...block, props: { ...block.props, description: nextValue } }))} />
                {block.props.logos.map((logo, logoIndex) => (
                  <div className="feature-item" key={`${blockIndex}-logo-${logoIndex}`}>
                    <div className="admin-toolbar">
                      <strong>Logo {logoIndex + 1}</strong>
                      <button className="button button--secondary" onClick={() => onChange(updateBlock(page, blockIndex, { ...block, props: { ...block.props, logos: block.props.logos.filter((_, index) => index !== logoIndex) } }))} type="button">删除 Logo</button>
                    </div>
                    <Field label="名称" value={logo.name} onChange={(nextValue) => onChange(updateBlock(page, blockIndex, { ...block, props: { ...block.props, logos: block.props.logos.map((entry, index) => index === logoIndex ? { ...entry, name: nextValue } : entry) } }))} />
                    <MediaPickerField error={mediaError} files={mediaFiles} label="图片" loading={mediaLoading} onChange={(nextValue) => onChange(updateBlock(page, blockIndex, { ...block, props: { ...block.props, logos: block.props.logos.map((entry, index) => index === logoIndex ? { ...entry, image: nextValue } : entry) } }))} onRefresh={() => void loadMediaFiles()} value={logo.image} />
                    <Field label="跳转链接" value={logo.href} onChange={(nextValue) => onChange(updateBlock(page, blockIndex, { ...block, props: { ...block.props, logos: block.props.logos.map((entry, index) => index === logoIndex ? { ...entry, href: nextValue } : entry) } }))} />
                  </div>
                ))}
                <button className="button button--secondary" onClick={() => onChange(updateBlock(page, blockIndex, { ...block, props: { ...block.props, logos: [...block.props.logos, { name: '', image: '', href: '' }] } }))} type="button">添加 Logo</button>
              </div>
            )}

            {block.type === 'product-feed' && (
              <div className="form-grid">
                <Field label="区块标题" value={block.props.title} onChange={(nextValue) => onChange(updateBlock(page, blockIndex, { ...block, props: { ...block.props, title: nextValue } }))} />
                <Field label="区块描述" value={block.props.description} onChange={(nextValue) => onChange(updateBlock(page, blockIndex, { ...block, props: { ...block.props, description: nextValue } }))} />
                <Field label="按钮文案" value={block.props.buttonLabel} onChange={(nextValue) => onChange(updateBlock(page, blockIndex, { ...block, props: { ...block.props, buttonLabel: nextValue } }))} />
                <Field label="空状态文案" value={block.props.emptyMessage} onChange={(nextValue) => onChange(updateBlock(page, blockIndex, { ...block, props: { ...block.props, emptyMessage: nextValue } }))} multiline />
                <p className="muted">该区块会自动列出已保存的产品详情页，不需要手工维护条目。</p>
              </div>
            )}

            {block.type === 'showcase-grid' && (
              <div className="form-grid">
                <Field label="Eyebrow" value={block.props.eyebrow} onChange={(nextValue) => onChange(updateBlock(page, blockIndex, { ...block, props: { ...block.props, eyebrow: nextValue } }))} />
                <Field label="区块标题" value={block.props.title} onChange={(nextValue) => onChange(updateBlock(page, blockIndex, { ...block, props: { ...block.props, title: nextValue } }))} />
                <Field label="区块描述" value={block.props.description} onChange={(nextValue) => onChange(updateBlock(page, blockIndex, { ...block, props: { ...block.props, description: nextValue } }))} multiline />
                <div className="field">
                  <label>展示类型</label>
                  <select value={block.props.variant} onChange={(event) => onChange(updateBlock(page, blockIndex, { ...block, props: { ...block.props, variant: event.target.value as 'product' | 'solution' | 'news' } }))}>
                    <option value="product">产品卡片</option>
                    <option value="solution">方案卡片</option>
                    <option value="news">资讯卡片</option>
                  </select>
                </div>
                {block.props.items.map((item, itemIndex) => (
                  <div className="feature-item" key={`${blockIndex}-showcase-${itemIndex}`}>
                    <div className="admin-toolbar">
                      <strong>卡片 {itemIndex + 1}</strong>
                      <button className="button button--secondary" onClick={() => onChange(updateBlock(page, blockIndex, { ...block, props: { ...block.props, items: block.props.items.filter((_, index) => index !== itemIndex) } }))} type="button">删除卡片</button>
                    </div>
                    <Field label="标题" value={item.title} onChange={(nextValue) => onChange(updateBlock(page, blockIndex, { ...block, props: { ...block.props, items: block.props.items.map((entry, index) => index === itemIndex ? { ...entry, title: nextValue } : entry) } }))} />
                    <Field label="副标题" value={item.subtitle} onChange={(nextValue) => onChange(updateBlock(page, blockIndex, { ...block, props: { ...block.props, items: block.props.items.map((entry, index) => index === itemIndex ? { ...entry, subtitle: nextValue } : entry) } }))} />
                    <Field label="描述" value={item.description} onChange={(nextValue) => onChange(updateBlock(page, blockIndex, { ...block, props: { ...block.props, items: block.props.items.map((entry, index) => index === itemIndex ? { ...entry, description: nextValue } : entry) } }))} multiline />
                    <Field label="标签" value={item.tag} onChange={(nextValue) => onChange(updateBlock(page, blockIndex, { ...block, props: { ...block.props, items: block.props.items.map((entry, index) => index === itemIndex ? { ...entry, tag: nextValue } : entry) } }))} />
                    <Field label="跳转链接" value={item.href} onChange={(nextValue) => onChange(updateBlock(page, blockIndex, { ...block, props: { ...block.props, items: block.props.items.map((entry, index) => index === itemIndex ? { ...entry, href: nextValue } : entry) } }))} />
                    <MediaPickerField error={mediaError} files={mediaFiles} label="图片" loading={mediaLoading} onChange={(nextValue) => onChange(updateBlock(page, blockIndex, { ...block, props: { ...block.props, items: block.props.items.map((entry, index) => index === itemIndex ? { ...entry, image: nextValue } : entry) } }))} onRefresh={() => void loadMediaFiles()} value={item.image} />
                  </div>
                ))}
                <button className="button button--secondary" onClick={() => onChange(updateBlock(page, blockIndex, { ...block, props: { ...block.props, items: [...block.props.items, { title: '', subtitle: '', description: '', image: '', href: '', tag: '' }] } }))} type="button">添加卡片</button>
              </div>
            )}

            {block.type === 'gallery' && (
              <div className="form-grid">
                <Field label="Eyebrow" value={block.props.eyebrow} onChange={(nextValue) => onChange(updateBlock(page, blockIndex, { ...block, props: { ...block.props, eyebrow: nextValue } }))} />
                <Field label="区块标题" value={block.props.title} onChange={(nextValue) => onChange(updateBlock(page, blockIndex, { ...block, props: { ...block.props, title: nextValue } }))} />
                <Field label="区块描述" value={block.props.description} onChange={(nextValue) => onChange(updateBlock(page, blockIndex, { ...block, props: { ...block.props, description: nextValue } }))} multiline />
                {block.props.images.map((item, itemIndex) => (
                  <div className="feature-item" key={`${blockIndex}-gallery-${itemIndex}`}>
                    <div className="admin-toolbar">
                      <strong>图片 {itemIndex + 1}</strong>
                      <button className="button button--secondary" onClick={() => onChange(updateBlock(page, blockIndex, { ...block, props: { ...block.props, images: block.props.images.filter((_, index) => index !== itemIndex) } }))} type="button">删除图片</button>
                    </div>
                    <MediaPickerField error={mediaError} files={mediaFiles} label="图片" loading={mediaLoading} onChange={(nextValue) => onChange(updateBlock(page, blockIndex, { ...block, props: { ...block.props, images: block.props.images.map((entry, index) => index === itemIndex ? { ...entry, src: nextValue } : entry) } }))} onRefresh={() => void loadMediaFiles()} value={item.src} />
                    <Field label="替代文本" value={item.alt} onChange={(nextValue) => onChange(updateBlock(page, blockIndex, { ...block, props: { ...block.props, images: block.props.images.map((entry, index) => index === itemIndex ? { ...entry, alt: nextValue } : entry) } }))} />
                    <Field label="说明文字" value={item.caption} onChange={(nextValue) => onChange(updateBlock(page, blockIndex, { ...block, props: { ...block.props, images: block.props.images.map((entry, index) => index === itemIndex ? { ...entry, caption: nextValue } : entry) } }))} />
                  </div>
                ))}
                <button className="button button--secondary" onClick={() => onChange(updateBlock(page, blockIndex, { ...block, props: { ...block.props, images: [...block.props.images, { src: '', alt: '', caption: '' }] } }))} type="button">添加图片</button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
