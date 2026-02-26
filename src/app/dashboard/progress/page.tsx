import { createServerComponentClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ProgressClient from './ProgressClient'

export default async function ProgressPage() {
  const supabase = await createServerComponentClient()
  
  const { data: { user }, error } = await supabase.auth.getUser()
  
  if (error || !user) {
    redirect('/auth/login')
  }

  return <ProgressClient user={user} />
}
