import { defaultSchema, type Options } from 'rehype-sanitize'

/**
 * GitHub's sanitize schema plus only what this pipeline needs (Spec 16 §9.3):
 * remark-math's code markers survive until rehype-katex runs, links allow
 * http/https/mailto, and images allow https and `media:` (resolved by MarkdownImage, never fetched as-is). Event handlers, style and
 * active elements stay forbidden, as in the default schema.
 */
export const studiesSchema: Options = {
  ...defaultSchema,
  attributes: {
    ...defaultSchema.attributes,
    code: [['className', /^language-./, 'math-inline', 'math-display']],
  },
  protocols: {
    ...defaultSchema.protocols,
    href: ['http', 'https', 'mailto'],
    src: ['https', 'media'],
  },
}
