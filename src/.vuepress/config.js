const { description } = require('../../package')

module.exports = {
  /**
   * Ref：https://v1.vuepress.vuejs.org/config/#title
   */
  title: 'Документация торговых роботов компании "Викинг"',
  /**
   * Ref：https://v1.vuepress.vuejs.org/config/#description
   */
  description: description,

  /**
   * Extra tags to be injected to the page HTML `<head>`
   *
   * ref：https://v1.vuepress.vuejs.org/config/#head
   */
  head: [
    ['meta', { name: 'theme-color', content: '#3eaf7c' }],
    ['meta', { name: 'apple-mobile-web-app-capable', content: 'yes' }],
    ['meta', { name: 'apple-mobile-web-app-status-bar-style', content: 'black' }],
    ['link', { rel: 'stylesheet', href: 'https://cdnjs.cloudflare.com/ajax/libs/KaTeX/0.5.1/katex.min.css' }],
    ['link', { rel: 'stylesheet', href: 'https://cdn.jsdelivr.net/github-markdown-css/2.2.1/github-markdown.css' }]
  ],

  /**
   * Theme configuration, here is the default theme configuration for VuePress.
   *
   * ref：https://v1.vuepress.vuejs.org/theme/default-theme-config.html
   */
  themeConfig: {
    repo: '',
    editLinks: false,
    docsDir: 'docs',
    editLinkText: '',
    lastUpdated: false,
    algolia: {
      apiKey: '7d6295408b07d0fac47f9f4f4082d107',
      indexName: 'test_viking',
      // If Algolia did not provided you any `appId`, use `BH4D9OD16A` or remove this option
      appId: 'GRBQWTRZK3',
    },
    nav: [
      {
        text: 'Документация',
        link: '/docs/'
      }
    ],
    sidebar: {
      '/docs/': [
        {
          collapsable: false,
          children: [
            'change-history',
            'introduction',
            'getting-started',
            'creating-connection',
            {
              title: '4. Описание параметров',
              children: [
                'params/connections.md',
                'params/portfolios.md',
                'params/securities.md',
                'params/notifications.md',
                'params/positions.md',
              ]
            },
            'algorithm-comments',
            'order-error',
            'c-api',
            'api-v1',
            'api-v2',
            'faq',
            {
              title: '12. API Фронта 2.0',
              children: [
                'api-v3/authorization_firebase.md'
              ]
            },
            'sample-doc'
          ]
        }
      ],

    }
  },
  markdown: {
    extendMarkdown: md => {
      // use more markdown-it plugins!
      md.use(require('markdown-it-attrs')),
        md.use(require('markdown-it-katex'))
    }
  },
  /**
   * Apply plugins，ref：https://v1.vuepress.vuejs.org/zh/plugin/
   */
  plugins: [
    '@vuepress/plugin-back-to-top',
    '@vuepress/plugin-medium-zoom',
  ]
}