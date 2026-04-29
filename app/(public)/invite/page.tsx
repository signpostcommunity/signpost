export const dynamic = 'force-dynamic'

import { getPortalUserData } from '@/lib/getPortalUserData'
import InviteClient from './InviteClient'

export const metadata = {
  title: 'Invite an interpreter to signpost',
  description: 'Send a quick invite to an interpreter you love working with.',
}

export default async function InvitePage() {
  const userData = await getPortalUserData()
  return <InviteClient userData={userData} />
}
