import { requireAuthWithOrganization } from '@/lib/auth/utils'
import { OKRsDashboard } from '@/components/okr/OKRsDashboard'

export default async function OKRsPage() {
  const { dbUser } = await requireAuthWithOrganization()
  
  return <OKRsDashboard user={dbUser} organization={dbUser.organization!} />
}