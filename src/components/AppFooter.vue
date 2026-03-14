<script setup>
/**
 * Подвал сайта — соответствует дизайну Footer из макетов
 */
</script>

<template>
  <footer class="footer">
    <div class="container footer__inner">

      <!-- Навигация -->
      <nav class="footer__nav" aria-label="Навигация в подвале">
        <a href="#" class="footer__nav-link">О портале</a>
        <a href="#" class="footer__nav-link">Поставщикам</a>
        <a href="#" class="footer__nav-link">Новости</a>
        <a href="#" class="footer__nav-link">Контакты</a>
        <a href="#" class="footer__nav-link">Карта сайта</a>
      </nav>

      <!-- Поддержка -->
      <div class="footer__support">
        <a href="#" class="footer__support-link">
          <!-- Иконка щита -->
          <svg width="16" height="18" viewBox="0 0 16 18" fill="none" aria-hidden="true">
            <path d="M8 1L1 4v5c0 4 3 7 7 8 4-1 7-4 7-8V4L8 1z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/>
          </svg>
          Служба качества
        </a>
        <a href="#" class="footer__support-link">
          <!-- Иконка чата -->
          <svg width="18" height="16" viewBox="0 0 18 16" fill="none" aria-hidden="true">
            <path d="M1 1h16v10H9l-4 4v-4H1V1z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/>
          </svg>
          Написать в службу поддержки
        </a>

        <!-- Социальные сети -->
        <div class="footer__social">
          <a href="#" class="footer__social-btn footer__social-btn--fb"  aria-label="Facebook">f</a>
          <a href="#" class="footer__social-btn footer__social-btn--tw"  aria-label="Twitter">t</a>
          <a href="#" class="footer__social-btn footer__social-btn--yt"  aria-label="YouTube">▶</a>
          <a href="#" class="footer__social-btn footer__social-btn--vk"  aria-label="ВКонтакте">vk</a>
          <a href="#" class="footer__social-btn footer__social-btn--ok"  aria-label="Одноклассники">ok</a>
        </div>
      </div>
    </div>

    <!-- Копирайт -->
    <div class="footer__copy">
      <div class="container">
        <span>© 2017–2026 · Портал Поставщиков 2.0 · Работает в соответствии с 44-ФЗ</span>
      </div>
    </div>
  </footer>
</template>

<style scoped>
.footer {
  background-color: var(--color-pale-blue);
  border-top: 1px solid var(--color-gray-blue);
  margin-top: auto;
}

.footer__inner {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--space-8);
  padding-top: var(--space-6);
  padding-bottom: var(--space-6);
}

/* --- Навигация --- */
.footer__nav {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-4);
}

.footer__nav-link {
  font-size: var(--font-size-sm);
  color: var(--color-black);
}

.footer__nav-link:hover {
  color: var(--color-main-blue);
  text-decoration: underline;
}

/* --- Поддержка --- */
.footer__support {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: var(--space-2);
}

.footer__support-link {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  font-size: var(--font-size-sm);
  color: var(--color-black);
}

.footer__support-link:hover {
  color: var(--color-main-blue);
  text-decoration: underline;
}

/* --- Социальные сети --- */
.footer__social {
  display: flex;
  gap: var(--space-2);
  margin-top: var(--space-1);
}

.footer__social-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  border-radius: 50%;
  font-size: 11px;
  font-weight: var(--font-weight-bold);
  color: #fff;
  text-decoration: none;
  transition: opacity var(--transition-fast);
}

.footer__social-btn:hover { opacity: 0.8; text-decoration: none; }

.footer__social-btn--fb { background-color: #1877F2; }
.footer__social-btn--tw { background-color: #1DA1F2; }
.footer__social-btn--yt { background-color: #FF0000; }
.footer__social-btn--vk { background-color: #0077FF; }
.footer__social-btn--ok { background-color: #EE8208; }

/* --- Копирайт --- */
.footer__copy {
  background-color: var(--color-gray-blue);
  padding: var(--space-3) 0;
  font-size: var(--font-size-xs);
  color: var(--color-pale-black);
}

/* --- Адаптив --- */
@media (max-width: 640px) {
  .footer__inner {
    flex-direction: column;
    gap: var(--space-5);
  }

  .footer__support {
    align-items: flex-start;
  }
}
</style>
