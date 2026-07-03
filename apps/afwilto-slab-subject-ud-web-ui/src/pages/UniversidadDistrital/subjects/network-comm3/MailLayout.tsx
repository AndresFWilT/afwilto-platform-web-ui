import { useState } from 'react'
import { Button, Text } from '@afwilto/design-system'
import { Inbox } from './Inbox'
import { MessageView } from './MessageView'
import { ComposeForm } from './ComposeForm'
import type { AuthState, EmailMessage } from './types'

interface Props {
  auth: AuthState
  onLogout: () => void
}

type Panel = 'inbox' | 'compose'

export function MailLayout({ auth, onLogout }: Props) {
  const [panel,    setPanel]    = useState<Panel>('inbox')
  const [selected, setSelected] = useState<EmailMessage | null>(null)

  return (
    <div className="flex flex-col gap-0 w-full min-h-[600px] border border-surface-border rounded-lg overflow-hidden">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-3 bg-surface-raised border-b border-surface-border">
        <div className="flex items-center gap-3">
          <Text variant="small" weight="semibold" color="default">{auth.email}</Text>
          <Text variant="caption" color="muted">SMTP + POP3</Text>
        </div>
        <Button variant="ghost" size="sm" onClick={onLogout}>Logout</Button>
      </div>

      <div className="flex flex-1 min-h-0">
        {/* Sidebar */}
        <aside className="w-48 shrink-0 border-r border-surface-border flex flex-col bg-surface-raised">
          <nav className="flex flex-col p-2 gap-1">
            <button
              onClick={() => { setPanel('inbox'); setSelected(null) }}
              className={`text-left px-3 py-2 rounded text-sm transition-colors ${panel === 'inbox' ? 'bg-primary-400/20 text-primary-400' : 'text-neutral-400 hover:text-neutral-200 hover:bg-surface-overlay'}`}
            >
              📥 Inbox
            </button>
            <button
              onClick={() => setPanel('compose')}
              className={`text-left px-3 py-2 rounded text-sm transition-colors ${panel === 'compose' ? 'bg-primary-400/20 text-primary-400' : 'text-neutral-400 hover:text-neutral-200 hover:bg-surface-overlay'}`}
            >
              ✏️ Compose
            </button>
          </nav>
        </aside>

        {/* Content */}
        <main className="flex flex-1 min-w-0">
          {panel === 'compose' ? (
            <div className="flex-1 p-4">
              <ComposeForm token={auth.token} fromEmail={auth.email} />
            </div>
          ) : (
            <>
              {/* Message list */}
              <div className="w-72 shrink-0 border-r border-surface-border overflow-y-auto">
                <div className="px-4 py-3 border-b border-surface-border">
                  <Text variant="small" weight="semibold" color="default">Inbox</Text>
                </div>
                <Inbox
                  token={auth.token}
                  selectedId={selected?.id ?? null}
                  onSelect={setSelected}
                />
              </div>
              {/* Message detail */}
              <div className="flex-1 p-4 overflow-y-auto">
                {selected ? (
                  <MessageView message={selected} />
                ) : (
                  <div className="flex flex-col items-center justify-center h-full gap-2 text-center">
                    <Text variant="body" color="muted">Select a message to read it</Text>
                    <Text variant="caption" color="muted">Messages are retrieved via POP3</Text>
                  </div>
                )}
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  )
}
