'use client'

import { useState } from 'react'
import PrelaunchModal from './PrelaunchModal'
import PrelaunchChip from './PrelaunchChip'

type Role = 'interpreter' | 'dhh' | 'requester'

interface PrelaunchNoticeProps {
  role: Role
  dismissedAt: string | null
}

export default function PrelaunchNotice({ role, dismissedAt }: PrelaunchNoticeProps) {
  const [dismissed, setDismissed] = useState(!!dismissedAt)
  const [modalOpen, setModalOpen] = useState(!dismissedAt)

  function handleClose() {
    setModalOpen(false)
    setDismissed(true)
  }

  return (
    <>
      {dismissed && (
        <PrelaunchChip role={role} onClick={() => setModalOpen(true)} />
      )}
      <PrelaunchModal role={role} open={modalOpen} onClose={handleClose} />
    </>
  )
}
