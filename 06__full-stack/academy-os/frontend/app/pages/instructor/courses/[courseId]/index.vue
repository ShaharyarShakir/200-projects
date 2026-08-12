<script setup lang="ts">
import { ref } from 'vue'
import { useApi } from '~/composables/useApi'
import type { Course } from '~/types/course'
import SectionEditor from '~/components/instructor/SectionEditor.vue'
import LessonEditor from '~/components/instructor/LessonEditor.vue'
import VideoUploader from '~/components/instructor/VideoUploader.vue'

const route = useRoute()
const api = useApi()
const courseId = route.params.courseId as string

const publishing = ref(false)
const publishError = ref('')

const { data: course, refresh, pending, error } = await useFetch<Course>(
  `${api.baseURL}/api/courses/${courseId}/structure`
)

async function publishCourse() {
  publishing.value = true
  publishError.value = ''

  try {
    await $fetch(`${api.baseURL}/api/courses/${courseId}/publish`, {
      method: 'POST'
    })
    await refresh()
  } catch (err: any) {
    publishError.value = err.data?.message || err.message || 'Publishing failed. Please ensure all videos are ready.'
  } finally {
    publishing.value = false
  }
}
</script>

<template>
  <div class="course-builder">
    <div v-if="pending" class="loading">
      Loading course structure...
    </div>

    <div v-else-if="error || !course" class="error-container">
      <p>Could not load course structure.</p>
      <NuxtLink to="/instructor/courses" class="link">Back to courses</NuxtLink>
    </div>

    <div v-else class="builder-content">
      <header class="builder-header">
        <div>
          <NuxtLink to="/instructor/courses" class="back-link">← All Courses</NuxtLink>
          <h1>{{ course.title }}</h1>
          <span class="status-badge" :class="course.status">{{ course.status }}</span>
        </div>

        <div class="header-actions">
          <button
            @click="publishCourse"
            :disabled="publishing || course.status === 'published'"
            class="btn-publish"
          >
            {{ publishing ? 'Publishing...' : course.status === 'published' ? 'Published' : 'Publish Course' }}
          </button>
        </div>
      </header>

      <p v-if="publishError" class="publish-error">
        ✕ {{ publishError }}
      </p>

      <p class="course-desc">{{ course.description }}</p>

      <main class="sections-container">
        <h2>Course Content</h2>

        <div v-if="!course.sections || !course.sections.length" class="empty-sections">
          <p>No sections added yet. Start by adding a section below.</p>
        </div>

        <div v-else class="sections-list">
          <section
            v-for="(section, sIdx) in course.sections"
            :key="section.id"
            class="section-card"
          >
            <div class="section-header">
              <h3>Section {{ sIdx + 1 }}: {{ section.title }}</h3>
            </div>

            <div class="lessons-list">
              <div
                v-for="(lesson, lIdx) in section.lessons"
                :key="lesson.id"
                class="lesson-card"
              >
                <div class="lesson-title">
                  <span>Lesson {{ lIdx + 1 }}: {{ lesson.title }}</span>
                </div>

                <VideoUploader
                  :course-id="course.id"
                  :section-id="section.id"
                  :lesson-id="lesson.id"
                  :existing-video-asset="lesson.videoAsset"
                  @updated="refresh"
                />
              </div>

              <LessonEditor
                :course-id="course.id"
                :section-id="section.id"
                @created="refresh"
              />
            </div>
          </section>
        </div>

        <SectionEditor
          :course-id="course.id"
          @created="refresh"
        />
      </main>
    </div>
  </div>
</template>

<style scoped>
.course-builder {
  max-width: 900px;
  margin: 2rem auto;
  padding: 0 1rem;
  font-family: system-ui, -apple-system, sans-serif;
}
.back-link {
  color: #6b7280;
  text-decoration: none;
  font-size: 14px;
}
.builder-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-top: 0.5rem;
}
.builder-header h1 {
  margin: 0.25rem 0;
  display: inline-block;
  margin-right: 0.75rem;
}
.status-badge {
  padding: 0.2rem 0.6rem;
  border-radius: 4px;
  font-size: 12px;
  text-transform: uppercase;
  font-weight: 600;
  vertical-align: middle;
}
.status-badge.draft { background-color: #f3f4f6; color: #4b5563; }
.status-badge.published { background-color: #dcfce7; color: #15803d; }
.btn-publish {
  padding: 0.5rem 1.25rem;
  background-color: #16a34a;
  color: white;
  border: none;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
}
.btn-publish:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
.publish-error {
  color: #dc2626;
  font-size: 14px;
  background-color: #fef2f2;
  padding: 0.5rem 0.75rem;
  border-radius: 6px;
  margin-top: 1rem;
}
.course-desc {
  color: #4b5563;
  margin-bottom: 2rem;
}
.sections-container {
  margin-top: 1.5rem;
}
.section-card {
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 1.25rem;
  background: #ffffff;
  margin-bottom: 1.5rem;
}
.section-header h3 {
  margin: 0 0 1rem 0;
  font-size: 18px;
  color: #111827;
}
.lessons-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
.lesson-card {
  border: 1px solid #f3f4f6;
  border-radius: 6px;
  padding: 0.85rem;
  background: #fafafa;
}
.lesson-title {
  font-weight: 600;
  font-size: 15px;
  color: #1f2937;
}
.empty-sections {
  padding: 2rem;
  text-align: center;
  background: #f9fafb;
  border-radius: 8px;
  color: #6b7280;
}
</style>
