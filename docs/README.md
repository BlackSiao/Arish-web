---
pageLayout: home
config:
  - type: hero
    full: false
    hero:
      tagline: BlackSiao's Blog
      text: 记录我在生活和工作中的一点碎碎念
      image:
        src: https://theme-plume.vuejs.press/plume.png
        alt: Black Hsiao

  - type: article
    layout: article
    title: 最新文章
    # 可选：只显示特定标签的文章
    filter: tag=k8s OR tag=故障
    limit: 6

  - type: features
    features:
      - icon: 🛠
        title: 运维技术
        details: Linux、网络、系统管理、容器化等技术积累
      - icon: 📚
        title: 学习笔记
        details: 深入学习各类技术栈的笔记记录和原理分析
      - icon: 💡
        title: 问题总结
        details: 工作中遇到的问题解决方案和最佳实践
      - icon: 🔍
        title: 全文搜索
        details: 快速搜索所有笔记内容，轻松找到你需要的信息
---