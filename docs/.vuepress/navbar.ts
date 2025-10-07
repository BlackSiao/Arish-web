/**
 * @see https://theme-plume.vuejs.press/config/navigation/ 查看文档了解配置详情
 *
 * Navbar 配置文件，它在 `.vuepress/plume.config.ts` 中被导入。
 */

import { defineNavbarConfig } from 'vuepress-theme-plume'
import { zhNotes } from './notes'  // 导入 zhNotes

// zh-CN navbar：整合 zhNotes.notes 为子菜单
export const zhNavbar = defineNavbarConfig([
  { text: '首页', link: '/' },
  { text: '博客', link: '/blog/' },
  { text: '标签', link: '/blog/tags/' },
  { text: '归档', link: '/blog/archives/' },
  {
    text: '笔记',
    items: zhNotes.notes.map(note => ({
      text: note.text!,  // 非空断言：您的配置已确保 text 非 undefined
      link: note.link!,  // 同上，确保类型匹配 NavItemWithLink
    })) as any[],  // 临时 as any[] 绕过严格类型（或用类型守卫见下）
  },
])

// en-US navbar：类似，但需 enNotes（见步骤2）
export const enNavbar = defineNavbarConfig([
  { text: 'Home', link: '/en/' },
  { text: 'Blog', link: '/en/blog/' },
  { text: 'Tags', link: '/en/blog/tags/' },
  { text: 'Archives', link: '/en/blog/archives/' },
  {
    text: 'Notes',
    items: [],  // 先空，步骤2后替换为 enNotes.notes.map(...)
  },
])