import { NextResponse } from 'next/server'
import { getStripePublishableKey } from '@/lib/stripe'

export async function GET() {
  try {
    const publishableKey = getStripePublishableKey()
    return NextResponse.json({ publishableKey })
  } catch {
    return NextResponse.json(
      { error: 'Stripe not configured' },
      { status: 500 }
    )
  }
}
