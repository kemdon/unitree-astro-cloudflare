import { z } from 'zod'

export const PageTypeSchema = z.enum(['standard', 'product-list', 'product-detail'])
export const TextFieldSchema = z.string()

export const NavItemSchema = z.object({
  label: TextFieldSchema,
  href: z.string(),
})

export const FooterGroupSchema = z.object({
  title: TextFieldSchema,
  links: z.array(NavItemSchema),
})

export const SocialLinkSchema = z.object({
  label: TextFieldSchema,
  href: z.string(),
})

export const SiteSchema = z.object({
  siteName: TextFieldSchema,
  brand: z.object({
    primary: z.string(),
    secondary: z.string().optional(),
    logoText: TextFieldSchema.optional(),
  }),
  contact: z.object({
    phone: z.string().optional(),
    email: z.email().optional(),
    address: TextFieldSchema.optional(),
  }),
  seo: z.object({
    defaultTitle: TextFieldSchema,
    defaultDescription: TextFieldSchema,
  }),
  navigation: z.array(NavItemSchema),
  featuredLinks: z.array(NavItemSchema).optional(),
  footerGroups: z.array(FooterGroupSchema).optional(),
  socialLinks: z.array(SocialLinkSchema).optional(),
  legalText: z.string().optional(),
})

export const HeroBlockSchema = z.object({
  type: z.literal('hero'),
  props: z.object({
    eyebrow: TextFieldSchema.optional(),
    title: TextFieldSchema,
    description: TextFieldSchema,
    primaryCtaLabel: TextFieldSchema.optional(),
    primaryCtaHref: z.string().optional(),
    secondaryCtaLabel: TextFieldSchema.optional(),
    secondaryCtaHref: z.string().optional(),
    image: z.string().optional(),
  }),
})

export const FeaturesBlockSchema = z.object({
  type: z.literal('features'),
  props: z.object({
    title: TextFieldSchema,
    items: z.array(
      z.object({
        title: TextFieldSchema,
        description: TextFieldSchema,
        icon: z.string().optional(),
      }),
    ),
  }),
})

export const FAQBlockSchema = z.object({
  type: z.literal('faq'),
  props: z.object({
    title: TextFieldSchema,
    items: z.array(
      z.object({
        question: TextFieldSchema,
        answer: TextFieldSchema,
      }),
    ),
  }),
})

export const CTABlockSchema = z.object({
  type: z.literal('cta'),
  props: z.object({
    title: TextFieldSchema,
    description: TextFieldSchema.optional(),
    buttonLabel: TextFieldSchema,
    buttonHref: z.string(),
  }),
})

export const ContentBlockSchema = z.object({
  type: z.literal('content'),
  props: z.object({
    title: TextFieldSchema,
    paragraphs: z.array(TextFieldSchema),
  }),
})

export const MediaTextBlockSchema = z.object({
  type: z.literal('media-text'),
  props: z.object({
    eyebrow: TextFieldSchema.optional(),
    title: TextFieldSchema,
    description: TextFieldSchema,
    body: z.array(TextFieldSchema),
    image: z.string(),
    imageAlt: TextFieldSchema.optional(),
    buttonLabel: TextFieldSchema.optional(),
    buttonHref: z.string().optional(),
    layout: z.enum(['image-left', 'image-right']).default('image-right'),
  }),
})

export const LogoGridBlockSchema = z.object({
  type: z.literal('logo-grid'),
  props: z.object({
    title: TextFieldSchema,
    description: TextFieldSchema.optional(),
    logos: z.array(
      z.object({
        name: TextFieldSchema,
        image: z.string(),
        href: z.string().optional(),
      }),
    ),
  }),
})

export const ProductFeedBlockSchema = z.object({
  type: z.literal('product-feed'),
  props: z.object({
    title: TextFieldSchema,
    description: TextFieldSchema.optional(),
    buttonLabel: TextFieldSchema,
    emptyMessage: TextFieldSchema.optional(),
  }),
})

export const ShowcaseGridBlockSchema = z.object({
  type: z.literal('showcase-grid'),
  props: z.object({
    eyebrow: TextFieldSchema.optional(),
    title: TextFieldSchema,
    description: TextFieldSchema.optional(),
    variant: z.enum(['product', 'solution', 'news']).default('product'),
    items: z.array(
      z.object({
        title: TextFieldSchema,
        subtitle: TextFieldSchema.optional(),
        description: TextFieldSchema,
        image: z.string(),
        href: z.string().optional(),
        tag: TextFieldSchema.optional(),
      }),
    ),
  }),
})

export const GalleryBlockSchema = z.object({
  type: z.literal('gallery'),
  props: z.object({
    eyebrow: TextFieldSchema.optional(),
    title: TextFieldSchema,
    description: TextFieldSchema.optional(),
    images: z.array(
      z.object({
        src: z.string(),
        alt: TextFieldSchema.optional(),
        caption: TextFieldSchema.optional(),
      }),
    ),
  }),
})

export const BlockSchema = z.discriminatedUnion('type', [
  HeroBlockSchema,
  FeaturesBlockSchema,
  FAQBlockSchema,
  CTABlockSchema,
  ContentBlockSchema,
  MediaTextBlockSchema,
  LogoGridBlockSchema,
  ProductFeedBlockSchema,
  ShowcaseGridBlockSchema,
  GalleryBlockSchema,
])

export const PageSchema = z.object({
  id: z.string(),
  pageType: PageTypeSchema.default('standard'),
  slug: z.string(),
  title: TextFieldSchema,
  seo: z.object({
    title: TextFieldSchema,
    description: TextFieldSchema,
  }),
  blocks: z.array(BlockSchema),
})

export type PageType = z.infer<typeof PageTypeSchema>
export type TextField = z.infer<typeof TextFieldSchema>
export type NavItem = z.infer<typeof NavItemSchema>
export type FooterGroup = z.infer<typeof FooterGroupSchema>
export type SocialLink = z.infer<typeof SocialLinkSchema>
export type SiteConfig = z.infer<typeof SiteSchema>
export type Block = z.infer<typeof BlockSchema>
export type PageData = z.infer<typeof PageSchema>
