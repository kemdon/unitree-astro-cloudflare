import type { Block } from './schema'
import CTA from '@/components/blocks/CTA.astro'
import Content from '@/components/blocks/Content.astro'
import FAQ from '@/components/blocks/FAQ.astro'
import Features from '@/components/blocks/Features.astro'
import Hero from '@/components/blocks/Hero.astro'
import LogoGrid from '@/components/blocks/LogoGrid.astro'
import MediaText from '@/components/blocks/MediaText.astro'
import ProductFeed from '@/components/blocks/ProductFeed.astro'
import ShowcaseGrid from '@/components/blocks/ShowcaseGrid.astro'
import Gallery from '@/components/blocks/Gallery.astro'

export const blockRegistry: Record<Block['type'], unknown> = {
  hero: Hero,
  features: Features,
  faq: FAQ,
  cta: CTA,
  content: Content,
  'media-text': MediaText,
  'logo-grid': LogoGrid,
  'product-feed': ProductFeed,
  'showcase-grid': ShowcaseGrid,
  gallery: Gallery,
}
