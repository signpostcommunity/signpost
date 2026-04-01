import { getSupabaseAdmin } from '@/lib/supabase/admin'

interface AuditEntry {
  user_id: string | null
  action: string
  resource_type: string
  resource_id?: string
  metadata?: Record<string, unknown>
  ip_address?: string
}

export function logAudit(entry: AuditEntry): void {
  Promise.resolve(
    getSupabaseAdmin()
      .from('audit_log')
      .insert({
        user_id: entry.user_id,
        action: entry.action,
        resource_type: entry.resource_type,
        resource_id: entry.resource_id || null,
        metadata: entry.metadata || {},
        ip_address: entry.ip_address || null,
      })
  ).catch((err: unknown) => {
    console.error('[audit] Failed to log:', err)
  })
}
