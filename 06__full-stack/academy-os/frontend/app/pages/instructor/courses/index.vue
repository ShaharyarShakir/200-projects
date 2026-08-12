<script setup lang="ts">
import { useApi } from '~/composables/useApi'
import type { Course } from '~/types/course'

const api = useApi()
const { data: courses, refresh, pending } = await useFetch<Course[]>(
  `${api.baseURL}/api/courses`
)
</script>

<template>
  <div class="courses-dashboard">
    <header class="dashboard-header">
      <h1>My Courses</h1>
      <NuxtLink to="/instructor/courses/new" class="btn-create">
        Create Course
      </NuxtLink>
    </header>

    <div v-if="pending" class="loading">
      Loading courses...
    </div>

    <div v-else-if="!courses || !courses.length" class="empty-state">
      <p>You haven't created any courses yet.</p>
      <NuxtLink to="/instructor/courses/new" class="link">Get started by creating your first course</NuxtLink>
    </div>

    <div v-else class="courses-grid">
      <article v-for="course in courses" :key="course.id" class="course-card">
        <h2>{{ course.title }}</h2>
        <p class="description">{{ course.description || 'No description provided.' }}</p>
        <div class="card-footer">
          <span class="badge" :class="course.status">{{ course.status }}</span>
          <NuxtLink :to="`/instructor/courses/${course.id}`" class="btn-edit">
            Edit Structure
          </NuxtLink>
        </div>
      </article>
    </div>
  </div>
</template>

<style scoped>
.courses-dashboard {
  max-width: 900px;
  margin: 2rem auto;
  padding: 0 1rem;
  font-family: system-ui, -apple-system, sans-serif;
}
.dashboard-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}
.btn-create {
  padding: 0.5rem 1rem;
  background-color: #2563eb;
  color: white;
  text-decoration: none;
  border-radius: 6px;
  font-weight: 500;
}
.courses-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1.5rem;
}
.course-card {
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 1.25rem;
  background: white;
  box-shadow: 0 1px 3px rgba(0,0,0,0.05);
}
.description {
  color: #6b7280;
  font-size: 14px;
  margin: 0.5rem 0 1.25rem 0;
}
.card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.badge {
  padding: 0.2rem 0.5rem;
  border-radius: 4px;
  font-size: 12px;
  text-transform: uppercase;
  font-weight: 600;
}
.badge.draft { background-color: #f3f4f6; color: #4b5563; }
.badge.published { background-color: #dcfce7; color: #15803d; }
.btn-edit {
  color: #2563eb;
  text-decoration: none;
  font-weight: 500;
  font-size: 14px;
}
.empty-state {
  text-align: center;
  padding: 3rem;
  background: #f9fafb;
  border-radius: 8px;
}
</style>
