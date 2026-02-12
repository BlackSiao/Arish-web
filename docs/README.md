---
pageLayout: custom
---

<style scoped>
.home-container {
  position: relative;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

/* 动态背景 */
.dynamic-bg {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(-45deg, #ee7752, #e73c7e, #23a6d5, #23d5ab);
  background-size: 400% 400%;
  animation: gradientShift 15s ease infinite;
  z-index: -1;
}

@keyframes gradientShift {
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}

/* 浮动粒子效果 */
.floating-particles {
  position: absolute;
  width: 100%;
  height: 100%;
  z-index: -1;
}

.particle {
  position: absolute;
  width: 10px;
  height: 10px;
  background: rgba(255, 255, 255, 0.5);
  border-radius: 50%;
  animation: float 20s infinite;
}

@keyframes float {
  0%, 100% { transform: translateY(0px) translateX(0px); opacity: 0; }
  10% { opacity: 1; }
  90% { opacity: 1; }
  100% { transform: translateY(-100vh) translateX(100px); opacity: 0; }
}

/* 左右布局 */
.home-content {
  position: relative;
  z-index: 1;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 60px;
  max-width: 1200px;
  width: 100%;
  margin: 0 auto;
  padding: 60px 40px;
  backdrop-filter: blur(10px);
  background: rgba(255, 255, 255, 0.1);
  border-radius: 20px;
  box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.37);
  border: 1px solid rgba(255, 255, 255, 0.18);
}

.left-section h1 {
  font-size: 3em;
  font-weight: 700;
  color: #fff;
  margin: 0 0 20px 0;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
}

.left-section p {
  font-size: 1.2em;
  color: rgba(255, 255, 255, 0.9);
  margin: 15px 0;
  line-height: 1.6;
}

.tagline {
  font-size: 1.5em;
  color: rgba(255, 255, 255, 0.7);
  margin: 30px 0;
  font-style: italic;
}

.features-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  margin: 40px 0;
}

.feature-item {
  background: rgba(255, 255, 255, 0.1);
  padding: 20px;
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(10px);
  transition: all 0.3s ease;
}

.feature-item:hover {
  background: rgba(255, 255, 255, 0.2);
  transform: translateY(-5px);
}

.feature-item .icon {
  font-size: 2em;
  margin-bottom: 10px;
}

.feature-item .title {
  font-weight: 600;
  color: #fff;
  margin: 10px 0 5px 0;
}

.feature-item .details {
  font-size: 0.9em;
  color: rgba(255, 255, 255, 0.7);
}

.action-buttons {
  display: flex;
  gap: 20px;
  margin-top: 40px;
}

.btn {
  padding: 12px 30px;
  border-radius: 8px;
  font-weight: 600;
  text-decoration: none;
  transition: all 0.3s ease;
  cursor: pointer;
  border: none;
  font-size: 1em;
}

.btn-primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 20px rgba(102, 126, 234, 0.4);
}

.btn-secondary {
  background: rgba(255, 255, 255, 0.2);
  color: white;
  border: 2px solid rgba(255, 255, 255, 0.5);
}

.btn-secondary:hover {
  background: rgba(255, 255, 255, 0.3);
  border-color: rgba(255, 255, 255, 0.8);
}

/* 右侧头像和联系 */
.right-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.avatar {
  width: 200px;
  height: 200px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.2);
  border: 4px solid rgba(255, 255, 255, 0.5);
  padding: 8px;
  margin-bottom: 30px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
  transition: all 0.3s ease;
}

.avatar:hover {
  transform: scale(1.05) rotateZ(5deg);
  border-color: rgba(255, 255, 255, 0.8);
}

.avatar img {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
}

.contact-section {
  text-align: center;
}

.contact-section h3 {
  color: #fff;
  font-size: 1.3em;
  margin: 0 0 20px 0;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
}

.contact-links {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.contact-link {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 10px 20px;
  background: rgba(255, 255, 255, 0.15);
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 8px;
  color: #fff;
  text-decoration: none;
  transition: all 0.3s ease;
  font-weight: 500;
}

.contact-link:hover {
  background: rgba(255, 255, 255, 0.25);
  border-color: rgba(255, 255, 255, 0.6);
  transform: translateY(-2px);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .home-content {
    grid-template-columns: 1fr;
    gap: 40px;
    padding: 40px 20px;
  }

  .left-section h1 {
    font-size: 2em;
  }

  .features-grid {
    grid-template-columns: 1fr;
  }

  .action-buttons {
    flex-direction: column;
  }

  .btn {
    width: 100%;
    text-align: center;
  }
}
</style>

<div class="home-container">
  <div class="dynamic-bg"></div>
  <div class="floating-particles" id="particles"></div>
  
  <div class="home-content">
    <!-- 左侧：介绍 -->
    <div class="left-section">
      <h1>黑小刀</h1>
      <p class="tagline">技术笔记 | 运维知识 | 学习记录</p>
      <p>👋 欢迎来到我的技术博客</p>
      <p>这里分享我在运维、Linux、网络等领域的知识积累，记录工作中遇到的问题和解决方案。</p>

      <!-- 特性展示 -->
      <div class="features-grid">
        <div class="feature-item">
          <div class="icon">🛠</div>
          <div class="title">运维技术</div>
          <div class="details">Linux、网络、系统管理、容器化</div>
        </div>
        <div class="feature-item">
          <div class="icon">📚</div>
          <div class="title">学习笔记</div>
          <div class="details">各类技术栈的深度学习与分析</div>
        </div>
        <div class="feature-item">
          <div class="icon">💡</div>
          <div class="title">问题总结</div>
          <div class="details">工作实践中的最佳实践</div>
        </div>
        <div class="feature-item">
          <div class="icon">🔍</div>
          <div class="title">全文搜索</div>
          <div class="details">快速找到你需要的内容</div>
        </div>
      </div>

      <!-- 行动按钮 -->
      <div class="action-buttons">
        <a href="/notes/" class="btn btn-primary">📖 开始阅读笔记</a>
        <a href="/blog/" class="btn btn-secondary">📝 最近更新</a>
      </div>
    </div>

    <!-- 右侧：头像和联系 -->
    <div class="right-section">
      <div class="avatar">
        <img src="https://avatars.githubusercontent.com/u/blacksiao" alt="头像" />
      </div>
      
      <div class="contact-section">
        <h3>获取联系</h3>
        <div class="contact-links">
          <a href="https://github.com/BlackSiao" class="contact-link" target="_blank">
            <span>💻 GitHub</span>
          </a>
          <a href="mailto:blacksiao@example.com" class="contact-link">
            <span>✉️ 邮箱</span>
          </a>
          <a href="https://twitter.com/blacksiao" class="contact-link" target="_blank">
            <span>🐦 Twitter</span>
          </a>
        </div>
      </div>
    </div>
  </div>
</div>

<script>
// 动态生成浮动粒子
function generateParticles() {
  const container = document.getElementById('particles');
  if (!container) return;
  
  for (let i = 0; i < 20; i++) {
    const particle = document.createElement('div');
    particle.className = 'particle';
    particle.style.left = Math.random() * 100 + '%';
    particle.style.top = Math.random() * 100 + '%';
    particle.style.animationDelay = Math.random() * 20 + 's';
    particle.style.animationDuration = (Math.random() * 10 + 15) + 's';
    container.appendChild(particle);
  }
}

// 页面加载时生成粒子
generateParticles();
</script>
