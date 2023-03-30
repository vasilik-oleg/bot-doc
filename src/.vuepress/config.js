const { description } = require('../../package')

module.exports = {
  /**
   * Ref：https://v1.vuepress.vuejs.org/config/#title
   */
  title: 'Документация торговых роботов компании "Викинг"',
  base: '/bot-doc/',
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
      indexName: 'test_viking2',
      // If Algolia did not provided you any `appId`, use `BH4D9OD16A` or remove this option
      appId: 'GRBQWTRZK3',
      searchParameters: {
        advancedSyntax: true
      }
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
            '01-change-history',
            '02-introduction',
            '03-getting-started',
            '04-creating-connection',
            {
              title: '5. Описание параметров',
              children: [
                '05-params/5-1-connections.md',
                '05-params/5-2-portfolios.md',
                '05-params/5-3-securities.md',
                '05-params/5-4-notifications.md',
                '05-params/5-5-positions.md',
              ]
            },
            '06-algorithm-comments',
            '07-order-error',
            '08-c-api',
            '09-api-v1',
            '10-api-v2',
            '11-faq',
            {
              title: '12. API Фронта 2.0',
              children: [
                '12-api-v3/authorization-firebase.md'
              ]
            },
            '99-sample-doc'
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
