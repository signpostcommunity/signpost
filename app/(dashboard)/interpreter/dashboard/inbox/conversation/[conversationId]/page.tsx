'use client'

export const dynamic = 'force-dynamic'

import ConversationThread from '@/components/messaging/ConversationThread'
import { use } from 'react'

export default function InterpreterConversationPage({ params }: { params: Promise<{ conversationId: string }> }) {
  const { conversationId } = use(params)
  return <ConversationThread conversationId={conversationId} backHref="/interpreter/dashboard/inbox" />
}
