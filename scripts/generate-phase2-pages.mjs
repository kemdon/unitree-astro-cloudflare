import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const rootDir = fileURLToPath(new URL('..', import.meta.url))
const contentDir = path.join(rootDir, 'content', 'pages')
const manifestPath = path.join(rootDir, '..', 'clone', 'astro-cache', 'manifest.json')

const QUADRUPED_IMAGE = '/uploads/unitree/home/robot-go2.jpg'
const HUMANOID_IMAGE = '/uploads/unitree/home/robot-g1.jpg'
const TALL_HUMANOID_IMAGE = '/uploads/unitree/home/robot-h1.jpg'
const EVENT_IMAGE = '/uploads/unitree/home/event-olympic.jpeg'
const PARTNER_IMAGE = '/uploads/unitree/home/partners.png'
const SOLUTION_IMAGE = '/uploads/unitree/solutions/solution-hero.jpg'
const MODULAR_IMAGE = '/uploads/unitree/solutions/solution-modular.jpg'
const MANAGE_IMAGE = '/uploads/unitree/solutions/solution-manage.jpg'
const COST_IMAGE = '/uploads/unitree/solutions/solution-cost.jpg'
const existingSlugs = new Set([
  '/',
  '/about',
  '/contact',
  '/products',
  '/go2',
  '/b2',
  '/b2-w',
  '/g1',
  '/h1',
  '/R1',
])

const ignoredPrefixes = ['/cn', '/position/', '/supplier']

const productDetailRoutes = new Set([
  '/a1',
  '/a1/motor',
  '/A2',
  '/aliengo',
  '/As2',
  '/b1',
  '/b1-16',
  '/D1-T',
  '/Dex1-1',
  '/Dex3-1',
  '/Dex5-1',
  '/DigitalServo',
  '/G1-D',
  '/go1',
  '/go1/motor',
  '/go2-w',
  '/H2',
  '/LiDAR',
  '/pump',
  '/SV1-25',
  '/z1',
])

const standardRouteOverrides = {
  '/industry/electricity': () => ({
    id: 'industry-electricity',
    pageType: 'standard',
    slug: '/industry/electricity',
    title: '四足智能巡检方案',
    seo: {
      title: '四足智能巡检方案 - 宇树科技',
      description: '保留源站行业方案入口，并由正式分类页与机器人详情页共同承接场景浏览。',
    },
    blocks: [
      heroBlock({
        eyebrow: '行业方案镜像入口',
        title: '四足智能巡检方案',
        description:
          '该页面保留源站 `/industry/electricity` 路由语义，并把正式浏览链路引导到冻结分类页 `/products`，避免第二阶段扩展页反向冲击关键分类页基线。',
        primaryCtaLabel: '进入正式方案页',
        primaryCtaHref: '/products',
        secondaryCtaLabel: '查看 B2',
        secondaryCtaHref: '/b2',
        image: SOLUTION_IMAGE,
      }),
      contentBlock('场景承接方式', [
        '在正式前台中，电力巡检不是孤立 landing page，而是进入行业方案、机型筛选和项目咨询的一整套浏览路径。',
        '因此这里保留一对一来源入口，同时把正式分类结构统一收束到 `/products`，维持第二阶段与基准页一致的浏览节奏。',
      ]),
      ctaBlock('继续浏览正式方案与机型', '进入 `/products` 查看完整方案页，再从详情页继续咨询。', '打开正式方案页', '/products'),
    ],
  }),
  '/industry/fireRescue': () => ({
    id: 'industry-fire-rescue',
    pageType: 'standard',
    slug: '/industry/fireRescue',
    title: '四足机器人消防应急解决方案',
    seo: {
      title: '四足机器人消防应急解决方案 - 宇树科技',
      description: '围绕火场进入、危险区域探测、喷射辅助和远程侦检建立消防应急方案说明。',
    },
    blocks: [
      heroBlock({
        eyebrow: '消防应急方案',
        title: '四足机器人把危险环境的先遣侦检交给机器。',
        description:
          '从高温、烟雾、狭窄通道到复杂楼层地形，消防应急方案重点不在炫技，而在于把探测、喷射辅助与远程侦检链路落到真实现场。',
        primaryCtaLabel: '联系方案团队',
        primaryCtaHref: '/contact',
        secondaryCtaLabel: '查看行业方案',
        secondaryCtaHref: '/products',
        image: COST_IMAGE,
      }),
      featuresBlock('消防方向关注重点', [
        ['危险环境先遣探测', '在人员进入前先完成环境扫描、视频回传和关键点位判断。'],
        ['多载荷协同', '结合热像、气体检测、喷射和通信中继能力形成任务组合。'],
        ['与巡检体系共享平台', '消防方向继续继承四足行业平台，而不是脱离现有产品体系单独叙事。'],
      ]),
      ctaBlock('需要结合消防场景做方案评估？', '告诉我们目标场地、任务类型和安全要求。', '提交场景需求', '/contact'),
    ],
  }),
  '/news': () => ({
    id: 'news',
    pageType: 'standard',
    slug: '/news',
    title: '新闻中心',
    seo: {
      title: '新闻中心 - 宇树科技',
      description: '整理宇树机器人产品发布、赛事事件和品牌动态，维持正式企业站的信息更新入口。',
    },
    blocks: [
      heroBlock({
        eyebrow: 'Newsroom',
        title: '品牌事件、产品发布和赛事动态统一收束到新闻中心。',
        description: '新闻页延续首页的科技感与强视觉结构，不退化成空白列表页。',
        primaryCtaLabel: '查看精选报道',
        primaryCtaHref: '/news/35',
        secondaryCtaLabel: '返回首页',
        secondaryCtaHref: '/',
        image: EVENT_IMAGE,
      }),
      {
        type: 'showcase-grid',
        props: {
          eyebrow: '精选动态',
          title: '围绕产品、赛事与高曝光事件组织内容入口',
          description: '新闻中心在第二阶段先承接代表性内容，后续第三阶段再交给后台扩展。',
          variant: 'news',
          items: [
            {
              title: 'Kung Fu Meets Spring',
              subtitle: 'Spring Festival Gala',
              description: '从春晚事件切入，展示宇树机器人在高曝光场景下的品牌表达。',
              image: EVENT_IMAGE,
              href: '/news/35',
              tag: '精选报道',
            },
            {
              title: 'G1 Boxing',
              subtitle: '赛事与演示',
              description: '以动作演示和具身能力展示强化人形平台的传播张力。',
              image: HUMANOID_IMAGE,
              href: '/boxing',
              tag: '赛事内容',
            },
            {
              title: 'RoboCup',
              subtitle: '竞技方向',
              description: '把赛事入口和产品能力关联起来，而不是做成脱节的活动页。',
              image: HUMANOID_IMAGE,
              href: '/robocup',
              tag: '延伸阅读',
            },
          ],
        },
      },
      ctaBlock('需要更多品牌资料或媒体合作入口？', '可直接联系宇树团队获取更多资料。', '联系宇树', '/contact'),
    ],
  }),
  '/news/35': () => ({
    id: 'news-35',
    pageType: 'standard',
    slug: '/news/35',
    title: 'Kung Fu Meets Spring, Unitree SFG Robots Present "Cyber Real Kung Fu" in the Year of the Horse',
    seo: {
      title: 'Kung Fu Meets Spring, Unitree SFG Robots Present "Cyber Real Kung Fu" in the Year of the Horse - 宇树科技',
      description: '保留源站新闻详情的主题和传播语义，作为新闻详情模板的代表页面。',
    },
    blocks: [
      heroBlock({
        eyebrow: '精选新闻',
        title: 'Kung Fu Meets Spring',
        description:
          '这篇新闻详情页保留源站高曝光事件的传播主题，并用正式详情页结构承接品牌叙事、技术可信度和延伸阅读入口。',
        primaryCtaLabel: '返回新闻中心',
        primaryCtaHref: '/news',
        secondaryCtaLabel: '查看首页',
        secondaryCtaHref: '/',
        image: EVENT_IMAGE,
      }),
      contentBlock('事件概述', [
        '春晚级别的舞台事件对机器人公司而言，不只是一次曝光，而是把产品可靠性、动作表现和品牌辨识度集中展示给大众的关键节点。',
        '正式新闻详情页需要承担“事件背景 + 品牌意义 + 延伸入口”的职责，因此保持强首屏、正文说明和后续 CTA 的完整节奏。',
      ]),
      ctaBlock('继续查看更多动态', '从新闻中心进入更多产品和赛事相关内容。', '返回新闻中心', '/news'),
    ],
  }),
  '/opensource': () => ({
    id: 'opensource',
    pageType: 'standard',
    slug: '/opensource',
    title: '官方开源',
    seo: {
      title: '官方开源 - 宇树科技',
      description: '集中承接官方开源、开发资料和机器人生态入口。',
    },
    blocks: [
      heroBlock({
        eyebrow: 'Open Source',
        title: '官方开源页承接开发生态，而不是只放一个外链。',
        description: '该页面统一说明宇树在开源、开发资料与社区协作上的入口价值，并保留对正式产品页的回流。',
        primaryCtaLabel: '联系技术团队',
        primaryCtaHref: '/contact',
        secondaryCtaLabel: '查看 Go2',
        secondaryCtaHref: '/go2',
        image: MANAGE_IMAGE,
      }),
      contentBlock('开发者入口', [
        '对四足和人形平台而言，开源与 SDK 入口不是补充说明，而是推动开发者采用、研究协作和生态扩展的重要页面。',
        '第二阶段先把该入口落成正式页面，第三阶段再由后台统一维护具体链接、资料和更新节奏。',
      ]),
      ctaBlock('需要对接开发与研究协作？', '可直接联系团队确认平台、接口和数据链路。', '联系技术团队', '/contact'),
    ],
  }),
  '/terms': () => ({
    id: 'terms',
    pageType: 'standard',
    slug: '/terms',
    title: '条款与政策',
    seo: {
      title: '条款与政策 - 宇树科技',
      description: '统一承接站点条款、政策和基础说明。',
    },
    blocks: [
      heroBlock({
        eyebrow: 'Policy',
        title: '条款与政策页用于承接基础说明，而不是打断主站气质。',
        description: '即使是政策页，也要保持与基准页一致的视觉骨架、标题层级和正文节奏。',
        primaryCtaLabel: '联系宇树',
        primaryCtaHref: '/contact',
        secondaryCtaLabel: '返回首页',
        secondaryCtaHref: '/',
        image: PARTNER_IMAGE,
      }),
      contentBlock('政策说明', [
        '本页面用于承接站点条款、联系说明、数据处理和基础法律信息，保持正式企业站所需的基础信息完整度。',
        '第三阶段后台接入后，可以继续补充分段正文、发布日期和多语言内容，但不会改变当前页面骨架。',
      ]),
    ],
  }),
}

function heroBlock({ eyebrow, title, description, primaryCtaLabel, primaryCtaHref, secondaryCtaLabel, secondaryCtaHref, image }) {
  return {
    type: 'hero',
    props: {
      eyebrow,
      title,
      description,
      primaryCtaLabel,
      primaryCtaHref,
      secondaryCtaLabel,
      secondaryCtaHref,
      image,
    },
  }
}

function contentBlock(title, paragraphs) {
  return {
    type: 'content',
    props: {
      title,
      paragraphs,
    },
  }
}

function ctaBlock(title, description, buttonLabel, buttonHref) {
  return {
    type: 'cta',
    props: {
      title,
      description,
      buttonLabel,
      buttonHref,
    },
  }
}

function featuresBlock(title, items) {
  return {
    type: 'features',
    props: {
      title,
      items: items.map(([itemTitle, description]) => ({
        title: itemTitle,
        description,
        icon: '',
      })),
    },
  }
}

function sanitizeId(routePath) {
  const normalized = routePath.replace(/^\/+/, '').replace(/\/+$/, '')
  return normalized.replace(/[\/_]/g, '-').replace(/[^a-zA-Z0-9-]/g, '-').replace(/-+/g, '-').toLowerCase() || 'home'
}

function deriveTitle(rawTitle, routePath) {
  return rawTitle.replace(/\s*-\s*宇树科技\s*$/u, '').replace(/\s*\|\s*宇树科技\s*$/u, '').trim() || routePath
}

function pickImage(routePath) {
  const lower = routePath.toLowerCase()
  if (lower.includes('news') || lower.includes('boxing') || lower.includes('robocup')) return EVENT_IMAGE
  if (lower.includes('industry') || lower.includes('b2') || lower.includes('aliengo') || lower.includes('b1')) return MODULAR_IMAGE
  if (lower.includes('h1') || lower.includes('h2') || lower.includes('r1')) return TALL_HUMANOID_IMAGE
  if (lower.includes('g1') || lower.includes('dex') || lower.includes('d1')) return HUMANOID_IMAGE
  if (lower.includes('pump') || lower.includes('download') || lower.includes('app')) return MANAGE_IMAGE
  if (lower.includes('lidar') || lower.includes('servo') || lower.includes('sv1') || lower.includes('z1')) return MANAGE_IMAGE
  return QUADRUPED_IMAGE
}

function detailParagraphs(title, description, routePath) {
  return [
    `${title} 在正式前台中作为独立详情页承接浏览、比对和咨询，不直接退化成参数堆叠或下载页。`,
    `${description} 第二阶段先用正式详情骨架锁定路由与内容语义，第三阶段再由后台继续补充字段、媒体和结构化资料。`,
    `当前路由 ${routePath} 延续源站产品入口语义，同时保持与首页、分类页、详情页基准一致的深色科技感表达。`,
  ]
}

function standardParagraphs(title, description, routePath) {
  return [
    `${title} 已按正式前台页面落地，并保留源站的业务语义而不是做成简单跳转或占位页。`,
    `${description} 当前阶段优先完成正式路由、可读内容和统一视觉骨架，避免第二阶段页面扩展回退成模板化空壳。`,
    `页面路径 ${routePath} 后续会继续由第三阶段后台接管内容维护，但不改变当前与基准页一致的视觉主干。`,
  ]
}

function detailPage(page) {
  const title = deriveTitle(page.title, page.routePath)
  const image = pickImage(page.routePath)
  return {
    id: sanitizeId(page.routePath),
    pageType: 'product-detail',
    slug: page.routePath,
    title,
    seo: {
      title: page.title,
      description: page.description,
    },
    blocks: [
      heroBlock({
        eyebrow: '产品与平台',
        title,
        description: page.description,
        primaryCtaLabel: '联系咨询',
        primaryCtaHref: '/contact',
        secondaryCtaLabel: '查看行业方案',
        secondaryCtaHref: '/products',
        image,
      }),
      {
        type: 'media-text',
        props: {
          eyebrow: '产品说明',
          title: `${title} 的正式前台信息结构`,
          description: '详情页需要承接定位、能力和转化，而不是只保留源站标题。',
          body: detailParagraphs(title, page.description, page.routePath),
          image,
          imageAlt: title,
          buttonLabel: '联系团队',
          buttonHref: '/contact',
          layout: 'image-right',
        },
      },
      featuresBlock(`${title} 的浏览重点`, [
        ['核心平台能力', '围绕本体、感知、载荷或操作能力建立正式浏览认知。'],
        ['适用任务方向', '把该页面与消费级体验、行业场景或研发任务建立关系。'],
        ['咨询与交付入口', '保持联系转化，而不把详情页做成信息孤岛。'],
      ]),
      ctaBlock(`准备进一步了解 ${title}？`, '告诉我们你的应用场景、开发需求或交付周期。', '联系宇树', '/contact'),
    ],
  }
}

function standardPage(page) {
  const title = deriveTitle(page.title, page.routePath)
  const image = pickImage(page.routePath)
  return {
    id: sanitizeId(page.routePath),
    pageType: 'standard',
    slug: page.routePath,
    title,
    seo: {
      title: page.title,
      description: page.description,
    },
    blocks: [
      heroBlock({
        eyebrow: '正式扩展页',
        title,
        description: page.description,
        primaryCtaLabel: '联系宇树',
        primaryCtaHref: '/contact',
        secondaryCtaLabel: '返回首页',
        secondaryCtaHref: '/',
        image,
      }),
      contentBlock('页面说明', standardParagraphs(title, page.description, page.routePath)),
      ctaBlock('继续浏览宇树正式站点', '从首页、方案页或详情页继续完成浏览链路。', '返回首页', '/'),
    ],
  }
}

async function main() {
  const manifest = JSON.parse(await fs.readFile(manifestPath, 'utf8'))
  const pages = manifest.pages.filter(
    (page) => !ignoredPrefixes.some((prefix) => page.routePath.startsWith(prefix)) && !existingSlugs.has(page.routePath),
  )

  let created = 0
  for (const page of pages) {
    const output = standardRouteOverrides[page.routePath]
      ? standardRouteOverrides[page.routePath]()
      : productDetailRoutes.has(page.routePath)
        ? detailPage(page)
        : standardPage(page)

    const fileName = `${output.id}.json`
    const outputPath = path.join(contentDir, fileName)
    await fs.writeFile(outputPath, `${JSON.stringify(output, null, 2)}\n`, 'utf8')
    created += 1
  }

  console.log(`Generated ${created} phase-2 page files.`)
}

await main()
