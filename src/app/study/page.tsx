import { Suspense } from 'react'
import StudyClient from './StudyClient'

export default function StudyPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    }>
      <StudyClient />
    </Suspense>
  )
}
