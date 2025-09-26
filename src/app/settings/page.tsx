import { requireAuth } from '@/lib/auth'
import SettingsClient from './SettingsClient'

export default async function SettingsPage() {
  const user = await requireAuth()

  return <SettingsClient user={user} />
}
