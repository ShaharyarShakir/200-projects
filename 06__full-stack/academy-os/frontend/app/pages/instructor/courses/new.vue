<script setup lang="ts">
import { ref } from 'vue'
import { useApi } from '~/composables/useApi'

const api = useApi()
const title = ref('')
const description = ref('')
const loading = ref(false)
const error = ref('')

async function createCourse() {
  if (!title.value.trim()) {
    error.value = 'Course title is required.'
    return
  }

  loading.value = true
  error.value = ''

  try {
    const course: any = await $fetch(`${api.baseURL}/api/courses`, {
      method: 'POST',
      body: {
        title: title.value,
        description: description.value
      }
    })

    await navigateTo(`/instructor/courses/${course.id}`)
  } catch (err: any) {
    error.value = err.data?.message || 'Failed to create course.'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="new-course-page">
    <header class="page-header">
      <NuxtLink to="/instructor/courses" class="back-link">← Back to Courses</NuxtLink>
      <h1>Create New Course</h1>
    </header>

    <form @submit.prevent="createCourse" class="course-form">
      <div class="form-group">
        <label for="title">Course Title</label>
        <input
          id="title"
          v-model="title"
          type="text"
          placeholder="e.g. Go Backend Development"
          required
        />
      </div>

      <div class="form-group">
        <label for="description">Description</label>
        <textarea
          id="description"
          v-model="description"
          rows="4"
          placeholder="Detailed course description..."
        ></textarea>
      </div>

      <p v-if="error" class="error-msg">{{ error }}</p>

      <button type="submit" :disabled="loading" class="btn-submit">
        {{ loading ? 'Creating...' : 'Create Course' }}
      </button>
    </form>
  </div>
</template>

<style scoped>
.new-course-page {
  max-width: 600px;
  margin: 2rem auto;
  padding: 0 1rem;
  font-family: system-ui, -apple-system, sans-serif;
}
.back-link {
  color: #6b7280;
  text-decoration: none;
  font-size: 14px;
}
.page-header h1 {
  margin-top: 0.5rem;
}
.course-form {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  margin-top: 1.5rem;
}
.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}
.form-group label {
  font-weight: 500;
  font-size: 14px;
}
.form-group input, .form-group textarea {
  padding: 0.6rem;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 14px;
}
.btn-submit {
  padding: 0.65rem 1.25rem;
  background-color: #2563eb;
  color: white;
  border: none;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
}
.btn-submit:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
.error-msg {
  color: #dc2626;
  font-size: 14px;
}
</style>
