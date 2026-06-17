import { redirect } from 'next/navigation'

// Onboarding is handled as a modal on /dashboard.
// Direct URL access to /onboarding/* just sends users back to the app.
export default function OnboardingStepPage() {
  redirect('/dashboard')
}
