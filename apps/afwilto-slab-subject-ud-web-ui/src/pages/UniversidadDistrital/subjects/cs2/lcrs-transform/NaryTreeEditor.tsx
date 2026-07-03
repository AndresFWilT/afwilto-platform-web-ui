import { useState } from 'react'
import { Card, Text, Button, Input } from '@afwilto/design-system'
import type { NaryTree, NaryNodeDef, NaryChild } from '@/application/ports/ILCRSService'

interface NaryTreeEditorProps {
  disabled: boolean
  onTreeChange: (tree: NaryTree) => void
}

// Validates a single uppercase or lowercase single-char label.
function validLabel(s: string) { return /^[A-Za-z]$/.test(s) }

export function NaryTreeEditor({ disabled, onTreeChange }: NaryTreeEditorProps) {
  const [root, setRoot] = useState('A')
  const [nodes, setNodes] = useState<NaryNodeDef[]>([
    { label: 'A', children: [] },
  ])
  const [newNodeLabel, setNewNodeLabel] = useState('')

  const labelSet = new Set(nodes.map((n) => n.label))

  const emitChange = (r: string, ns: NaryNodeDef[]) => {
    // Any child label that isn't already an explicit node becomes a leaf node automatically.
    const defined = new Set(ns.map((n) => n.label))
    const implicit: NaryNodeDef[] = []
    for (const node of ns) {
      for (const child of node.children) {
        if (child.label && validLabel(child.label) && !defined.has(child.label)) {
          implicit.push({ label: child.label, children: [] })
          defined.add(child.label)
        }
      }
    }
    onTreeChange({ root: r, nodes: implicit.length > 0 ? [...ns, ...implicit] : ns })
  }

  const handleRootChange = (v: string) => {
    setRoot(v)
    if (validLabel(v) && labelSet.has(v)) emitChange(v, nodes)
  }

  const addNode = () => {
    const label = newNodeLabel.trim().toUpperCase()
    if (!validLabel(label) || labelSet.has(label)) return
    const next = [...nodes, { label, children: [] }]
    setNodes(next)
    setNewNodeLabel('')
    emitChange(root, next)
  }

  const removeNode = (label: string) => {
    if (label === root) return
    const next = nodes
      .filter((n) => n.label !== label)
      .map((n) => ({ ...n, children: n.children.filter((c) => c.label !== label) }))
    setNodes(next)
    emitChange(root, next)
  }

  const addChild = (parentLabel: string) => {
    const next = nodes.map((n) =>
      n.label === parentLabel
        ? { ...n, children: [...n.children, { label: '', weight: 1 }] }
        : n
    )
    setNodes(next)
    // Don't emit yet — the new child has an empty label, which isn't valid input.
  }

  const updateChild = (parentLabel: string, idx: number, field: keyof NaryChild, value: string | number) => {
    const next = nodes.map((n) => {
      if (n.label !== parentLabel) return n
      return { ...n, children: n.children.map((c, i) => i === idx ? { ...c, [field]: value } : c) }
    })
    setNodes(next)
    emitChange(root, next)
  }

  const removeChild = (parentLabel: string, idx: number) => {
    const next = nodes.map((n) =>
      n.label === parentLabel
        ? { ...n, children: n.children.filter((_, i) => i !== idx) }
        : n
    )
    setNodes(next)
    emitChange(root, next)
  }

  return (
    <Card padding="md" className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <Text variant="h4" color="default">N-ary Tree</Text>
        <Text variant="caption" color="muted">
          Build the N-ary tree by defining nodes and their children (single letters, weights ≥ 0).
        </Text>
      </div>

      <div className="flex items-end gap-3">
        <div className="flex flex-col gap-1">
          <Text variant="caption" color="muted">Root node</Text>
          <Input
            inputSize="sm"
            placeholder="A"
            value={root}
            disabled={disabled}
            onChange={(e) => handleRootChange(e.target.value.toUpperCase())}
            className="w-16"
          />
        </div>
        <div className="flex flex-col gap-1 flex-1">
          <Text variant="caption" color="muted">Add node</Text>
          <div className="flex gap-2">
            <Input
              inputSize="sm"
              placeholder="label e.g. B"
              value={newNodeLabel}
              disabled={disabled}
              onChange={(e) => setNewNodeLabel(e.target.value.toUpperCase())}
              onKeyDown={(e) => e.key === 'Enter' && addNode()}
              className="w-24"
            />
            <Button variant="ghost" size="sm" disabled={disabled || !validLabel(newNodeLabel.trim().toUpperCase()) || labelSet.has(newNodeLabel.trim().toUpperCase())} onClick={addNode}>
              + Node
            </Button>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-2 max-h-64 overflow-y-auto">
        {nodes.map((node) => (
          <div key={node.label} className="border border-surface-border rounded-md p-3 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <Text variant="mono" color="default" className="font-bold">
                {node.label}{node.label === root ? ' (root)' : ''}
              </Text>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" disabled={disabled} onClick={() => addChild(node.label)}>
                  + Child
                </Button>
                {node.label !== root && (
                  <Button variant="danger" size="sm" disabled={disabled} onClick={() => removeNode(node.label)}>
                    ✕
                  </Button>
                )}
              </div>
            </div>
            {node.children.length > 0 && (
              <div className="flex flex-col gap-1 pl-3 border-l border-surface-border">
                {node.children.map((child, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <Input
                      inputSize="sm"
                      placeholder="label"
                      value={child.label}
                      disabled={disabled}
                      onChange={(e) => updateChild(node.label, idx, 'label', e.target.value.toUpperCase())}
                      className="w-16"
                    />
                    <Text variant="caption" color="muted">w=</Text>
                    <Input
                      inputSize="sm"
                      type="number"
                      min={0}
                      placeholder="0"
                      value={child.weight}
                      disabled={disabled}
                      onChange={(e) => updateChild(node.label, idx, 'weight', Math.max(0, Number(e.target.value)))}
                      className="w-16"
                    />
                    <Button variant="danger" size="sm" disabled={disabled} onClick={() => removeChild(node.label, idx)}>
                      ✕
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </Card>
  )
}
