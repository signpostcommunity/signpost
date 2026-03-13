'use client'

export const dynamic = 'force-dynamic'

import ConversationThread from '@/components/messaging/ConversationThread'
import { use } from 'react'

export default function DhhConversationPage({ params }: { params: Promise<{ conversationId: string }> }) {
  const { conversationId } = use(params)
  return <ConversationThread conversationId={conversationId} backHref="/dhh/dashboard/inbox" />
}
