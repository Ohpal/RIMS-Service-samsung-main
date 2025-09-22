export default {
  path: '/lesson',
  name: 'lesson',
  redirect: { name: 'learned' },
  children: [
    {
      path: 'learned',
      name: 'learned',
      component: () => import('@/components/LessonLearned.vue'),
      children: [
        {
          path: 'question',
          name: 'learned-details',
          component: () => import('@/components/LessonLearned.vue'),
        },
      ],
    },
    {
      path: 'write',
      name: 'learned-write',
      component: () => import('@/components/WriteLessonLearned.vue'),
    },
    {
      path: 'board',
      name: 'learned-board',
      component: () => import('@/components/LessonLearnedboard.vue'),
    },
  ],
}
