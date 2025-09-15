import { redirect } from 'next/navigation'
import { requireAuth } from '@/lib/auth'
import { Button } from '@/components/ui/button'
import DashboardClient from './DashboardClient'

export default async function DashboardPage() {
  const user = await requireAuth()

  return <DashboardClient user={user} />
}
