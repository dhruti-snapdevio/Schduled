'use client'

import { useState, useTransition } from 'react'
import { FloppyDisk } from '@phosphor-icons/react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { updateContactSettings } from '@/app/actions/settings'

export function ContactSettingsForm({
  initial,
}: {
  initial: { autoCreateContacts: boolean; excludedContactDomains: string }
}) {
  const [autoCreate, setAutoCreate] = useState(initial.autoCreateContacts)
  const [excluded, setExcluded] = useState(initial.excludedContactDomains)
  const [pending, start] = useTransition()

  function save() {
    start(async () => {
      const res = await updateContactSettings({
        autoCreateContacts: autoCreate,
        excludedContactDomains: excluded,
      })
      if ('error' in res) {
        toast.error(res.error)
        return
      }
      toast.success('Contact settings saved')
    })
  }

  return (
    <div className="space-y-6">
      <section className="border border-border bg-background">
        <div className="border-b border-border px-5 py-4">
          <h2 className="text-xs font-semibold uppercase tracking-ui text-muted-foreground">
            Create new contacts automatically
          </h2>
        </div>

        <div className="space-y-5 px-5 py-5">
          {/* Auto-create toggle */}
          <label className="flex cursor-pointer items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-foreground">
                Someone books a meeting with you
              </p>
              <p className="mt-0.5 text-sm text-muted-foreground">
                When someone schedules a meeting, their booking information is used to
                create a new contact automatically.
              </p>
            </div>
            <Switch checked={autoCreate} onCheckedChange={setAutoCreate} />
          </label>

          {/* Exclusion list */}
          <div className="border-t border-border pt-5">
            <Label htmlFor="excluded" className="text-sm font-semibold text-foreground">
              Exclude domains or email addresses
            </Label>
            <p className="mb-3 mt-0.5 text-sm text-muted-foreground">
              Block specific email addresses (like <strong>person@company.com</strong>)
              or entire domains (like <strong>company.com</strong>) from being
              auto-added to your contacts.
            </p>
            <Textarea
              id="excluded"
              value={excluded}
              onChange={(e) => setExcluded(e.target.value)}
              placeholder="Add domains or email addresses, separated by commas or spaces"
              rows={3}
              disabled={!autoCreate}
            />
          </div>
        </div>
      </section>

      <Button onClick={save} disabled={pending} className="gap-1.5">
        <FloppyDisk size={14} />
        {pending ? 'Saving…' : 'Save changes'}
      </Button>
    </div>
  )
}
