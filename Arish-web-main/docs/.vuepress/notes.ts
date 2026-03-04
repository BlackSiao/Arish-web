/**
 * @see https://theme-plume.vuejs.press/guide/document/ 查看文档了解配置详情。
 *
 * Notes 配置文件，它在 `.vuepress/plume.config.ts` 中被导入。
 * （如果您有plume.config.ts，请确保那里也导入此文件；否则config.ts的导入已足够）
 *
 * 请注意，你应该先在这里配置好 Notes，然后再启动 vuepress，主题会在启动 vuepress 时，
 * 读取这里配置的 Notes，然后在与 Note 相关的 Markdown 文件中，自动生成 permalink。
 *
 * 如果你发现 侧边栏没有显示，那么请检查你的配置是否正确，以及 Markdown 文件中的 permalink
 * 是否是以对应的 note 配置的 link 的前缀开头。 是否展示侧边栏是根据 页面链接 的前缀 与 `note.link`
 * 的前缀是否匹配来决定。 
 */

/**
 * 在受支持的 IDE 中会智能提示配置项。
 *
 * - `defineNoteConfig` 是用于定义单个 note 配置的帮助函数
 * - `defineNotesConfig` 是用于定义 notes 集合的帮助函数
 *
 * 通过 `defineNoteConfig` 定义的 note 配置，应该填入 `defineNotesConfig` 的 notes 数组中
 */
import { defineNoteConfig, defineNotesConfig } from 'vuepress-theme-plume'

/* =================== locale: zh-CN ======================= */

const InternetNote = defineNoteConfig({
  text: '1.计算机网络',  // 关键：添加text，用于navbar子菜单显示
  dir: 'Internet',
  link: '/notes/Internet/',
  sidebar: 'auto'    // 进入此页时，侧边栏显示Internet下.md文件
})

const LinuxNote = defineNoteConfig({
  text: '2.Linux',     // 关键：添加text
  dir:  'Linux',
  link: '/notes/Linux/',
  sidebar: 'auto'
})

const ShicaoNote = defineNoteConfig({  // 新增实操
  text: '3.实用技巧',
  dir: '实操',
  link: '/notes/实操/',
  sidebar: 'auto'
})

const MiddlewareNote = defineNoteConfig({
  text: '4.中间件',
  dir: '中间件',
  link: '/notes/中间件/',
  sidebar: 'auto'
})

const HardwareNote = defineNoteConfig({
  text: '5.硬件相关内容',
  dir: '硬件相关内容',
  link: '/notes/硬件相关内容/',
  sidebar: 'auto'
})

/**
 * 导出所有的 note
 * 每一个 note 都应该填入到 `notes.notes` 数组中
 */
export const zhNotes = defineNotesConfig({
  dir: 'notes',
  link: '/',   // 笔记入口（navbar主项“笔记”链接到此）
  notes: [InternetNote, LinuxNote, ShicaoNote, MiddlewareNote, HardwareNote],  // 包含所有，顺序即navbar顺序
})