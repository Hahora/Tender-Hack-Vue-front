<template>
  <div class="team">
    <div class="team__stars" aria-hidden="true">
      <span v-for="i in 60" :key="i" class="team__star" :style="starStyle(i)" />
    </div>

    <div class="team__card">
      <div class="team__moon">🌙</div>

      <h1 class="team__title">Мы говорили, что сделаем за ночь</h1>
      <p class="team__subtitle">Теперь мы спать 😴</p>

      <div class="team__divider" />

      <p class="team__thanks">
        Спасибо за кейс! Было по настоящему интересно.<br />
        Приятно, когда задача не надуманная, а живая.
      </p>

      <div class="team__roles">
        <div class="team__role">
          <span class="team__role-icon">⚙️</span>
          <span class="team__role-label">Бэкенд</span>
          <span class="team__role-status">устал, но держится</span>
        </div>
        <div class="team__role">
          <span class="team__role-icon">🎨</span>
          <span class="team__role-label">Фронтенд</span>
          <span class="team__role-status">устал, но красиво</span>
        </div>
      </div>

      <div class="team__divider" />

      <p class="team__footer">
        Главное - всё работает.<br />
        <span class="team__footer-note"
          >А кто знает ссылку, тот молодец, что нашёл нас здесь 🫡</span
        >
      </p>

      <div class="team__zzz" aria-hidden="true">
        z&nbsp;&nbsp;z&nbsp;&nbsp;z
      </div>
    </div>
  </div>
</template>

<script setup>
function starStyle(i) {
  const size = Math.random() * 2.5 + 1;
  const x = Math.random() * 100;
  const y = Math.random() * 100;
  const delay = Math.random() * 4;
  return {
    width: `${size}px`,
    height: `${size}px`,
    left: `${x}%`,
    top: `${y}%`,
    animationDelay: `${delay}s`,
  };
}
</script>

<style scoped>
.team {
  min-height: 100vh;
  background: #080c18;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  position: relative;
  overflow: hidden;
}

/* Звёзды */
.team__stars {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.team__star {
  position: absolute;
  background: #fff;
  border-radius: 50%;
  opacity: 0;
  animation: twinkle 4s ease-in-out infinite;
}

@keyframes twinkle {
  0%,
  100% {
    opacity: 0;
  }
  50% {
    opacity: 0.75;
  }
}

/* Карточка */
.team__card {
  position: relative;
  z-index: 1;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 24px;
  padding: 52px 48px;
  max-width: 520px;
  width: 100%;
  text-align: center;
  backdrop-filter: blur(12px);
  box-shadow: 0 0 80px rgba(80, 120, 220, 0.12);
}

.team__moon {
  font-size: 52px;
  line-height: 1;
  margin-bottom: 24px;
  display: block;
  filter: drop-shadow(0 0 18px rgba(255, 230, 100, 0.5));
  animation: float 4s ease-in-out infinite;
}

@keyframes float {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-8px);
  }
}

.team__title {
  font-size: 22px;
  font-weight: 700;
  color: #f0f4ff;
  line-height: 1.3;
  margin-bottom: 10px;
  letter-spacing: -0.01em;
}

.team__subtitle {
  font-size: 16px;
  color: rgba(200, 210, 255, 0.65);
  margin-bottom: 0;
}

.team__divider {
  height: 1px;
  background: rgba(255, 255, 255, 0.08);
  margin: 28px 0;
}

.team__thanks {
  font-size: 15px;
  color: rgba(200, 215, 255, 0.7);
  line-height: 1.7;
}

/* Роли */
.team__roles {
  display: flex;
  gap: 16px;
  margin-top: 24px;
  justify-content: center;
  flex-wrap: wrap;
}

.team__role {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 14px;
  padding: 14px 24px;
  min-width: 140px;
}

.team__role-icon {
  font-size: 22px;
  line-height: 1;
}

.team__role-label {
  font-size: 13px;
  font-weight: 700;
  color: #c8d8ff;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.team__role-status {
  font-size: 12px;
  color: rgba(180, 200, 255, 0.45);
}

/* Подвал */
.team__footer {
  font-size: 14px;
  color: rgba(180, 200, 255, 0.55);
  line-height: 1.8;
}

.team__footer-note {
  font-size: 13px;
  color: rgba(160, 185, 255, 0.4);
}

.team__zzz {
  margin-top: 28px;
  font-size: 18px;
  color: rgba(160, 185, 255, 0.2);
  letter-spacing: 6px;
  animation: drift 3s ease-in-out infinite;
  font-style: italic;
}

@keyframes drift {
  0%,
  100% {
    opacity: 0.3;
    transform: translateY(0);
  }
  50% {
    opacity: 0.7;
    transform: translateY(-4px);
  }
}
</style>
