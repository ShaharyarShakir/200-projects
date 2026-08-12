<template>
  <div class="learning-layout">
    <header class="learning-nav">
      <NuxtLink to="/courses" class="nav-logo">AcademyOS Classroom</NuxtLink>
      <div class="nav-right">
        <slot name="header-right"></slot>
      </div>
    </header>
    <main class="learning-main">
      <slot />
    </main>
  </div>
</template>

<style scoped>
.learning-layout {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: #0f172a;
  color: #f8fafc;
  font-family: system-ui, -apple-system, sans-serif;
}

.learning-nav {
  height: 56px;
  background-color: #1e293b;
  border-bottom: 1px solid #334155;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 1.5rem;
}

.nav-logo {
  color: #38bdf8;
  font-weight: 700;
  font-size: 1.1rem;
  text-decoration: none;
}

.learning-main {
  flex: 1;
  display: flex;
  overflow: hidden;
}
</style>
