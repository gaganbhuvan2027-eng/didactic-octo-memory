const streams = [
  {
    id: 'frontend',
    title: 'Frontend Development',
    icon: '🎨',
    description: 'Master modern frontend technologies and frameworks',
    color: 'from-blue-50 to-cyan-50',
    subcourses: [
      { id: 'react', name: 'React', difficulty: 'Intermediate', info: 'Build interactive UIs with React hooks and components' },
      { id: 'vue', name: 'Vue.js', difficulty: 'Intermediate', info: "Create reactive applications with Vue's composition API" },
      { id: 'angular', name: 'Angular', difficulty: 'Advanced', info: 'Develop enterprise apps with TypeScript and RxJS' },
      { id: 'nextjs', name: 'Next.js', difficulty: 'Advanced', info: 'Master server-side rendering and static site generation' },
      { id: 'typescript', name: 'TypeScript', difficulty: 'Intermediate', info: 'Write type-safe JavaScript for scalable applications' },
      { id: 'tailwind', name: 'Tailwind CSS', difficulty: 'Beginner', info: 'Design modern UIs with utility-first CSS framework' },
    ],
  },
]

module.exports = streams
