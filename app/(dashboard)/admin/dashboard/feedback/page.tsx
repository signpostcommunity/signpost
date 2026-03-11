import { createClient } from '@/lib/supabase/server'
import FeedbackClient from './FeedbackClient'

export const dynamic = 'force-dynamic'

export default async function AdminFeedbackPage() {
  const supabase = await createClient()

  const { data: feedback } = await supabase
    .from('beta_feedback')
    .select('id, tester_name, tester_email, feedback_type, page, page_area, notes, specific_answer, survey_answers, created_at')
    .order('created_at', { ascending: false })

  return <FeedbackClient feedback={feedback || []} />
}
