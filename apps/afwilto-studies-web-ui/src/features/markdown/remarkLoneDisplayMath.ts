import type { Paragraph, Parent, Root } from 'mdast'

// remark-math parses `$$x$$` written on one line as inline math. Like GitHub,
// a paragraph holding nothing but one `$$…$$` span is meant as a display
// formula, so it becomes the same `pre > code.math-display` that a multi-line
// `$$` block produces. `$$…$$` sharing a paragraph with text stays inline.

type InlineMath = { type: 'inlineMath'; value: string; position?: Paragraph['position'] }

function isLoneDoubleDollarMath(node: Paragraph, source: string): boolean {
  if (node.children.length !== 1) return false
  const only = node.children[0] as unknown as InlineMath
  const start = only.position?.start.offset
  return only.type === 'inlineMath' && start !== undefined && source.startsWith('$$', start)
}

function displayMath(value: string): Root['children'][number] {
  return {
    type: 'math',
    value,
    data: {
      hName: 'pre',
      hChildren: [
        {
          type: 'element',
          tagName: 'code',
          properties: { className: ['language-math', 'math-display'] },
          children: [{ type: 'text', value }],
        },
      ],
    },
  } as unknown as Root['children'][number]
}

function walk(parent: Parent, source: string) {
  parent.children = parent.children.map((child) => {
    if (child.type === 'paragraph' && isLoneDoubleDollarMath(child, source)) {
      return displayMath((child.children[0] as unknown as InlineMath).value)
    }
    if ('children' in child) walk(child as Parent, source)
    return child
  }) as Parent['children']
}

export function remarkLoneDisplayMath() {
  return (tree: Root, file: { value: unknown }) => walk(tree, String(file.value))
}
