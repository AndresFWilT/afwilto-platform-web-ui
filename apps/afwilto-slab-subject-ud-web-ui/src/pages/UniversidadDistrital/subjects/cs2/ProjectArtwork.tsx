import type { CS2Project } from './data'

interface ArtworkProps {
  project: CS2Project
  className?: string
}

export function ProjectArtwork({ project, className = 'h-36 w-full' }: ArtworkProps) {
  const Component = ARTWORK[project.slug] ?? DefaultArtwork
  return (
    <div className={`relative overflow-hidden rounded-t-lg ${className}`}>
      <Component from={project.gradientFrom} to={project.gradientTo} />
    </div>
  )
}

interface SvgProps { from: string; to: string }

const G = ({ id, from, to }: { id: string; from: string; to: string }) => (
  <defs>
    <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stopColor={from} />
      <stop offset="100%" stopColor={to} />
    </linearGradient>
  </defs>
)

// ── B-Tree ────────────────────────────────────────────────────────────────────
function BTree({ from, to }: SvgProps) {
  const id = 'btg'
  return (
    <svg viewBox="0 0 200 120" className="w-full h-full" preserveAspectRatio="xMidYMid slice">
      <G id={id} from={from} to={to} />
      <rect width="200" height="120" fill={`url(#${id})`} />
      {/* root node — 2 keys */}
      <rect x="65" y="10" width="70" height="22" rx="4" fill="rgba(255,255,255,0.15)" stroke="rgba(255,255,255,0.3)" strokeWidth="1"/>
      <text x="87" y="24" fill="white" fontSize="10" fontFamily="monospace" fontWeight="700">25</text>
      <text x="116" y="24" fill="rgba(255,255,255,0.5)" fontSize="9" fontFamily="monospace">|</text>
      <text x="123" y="24" fill="white" fontSize="10" fontFamily="monospace" fontWeight="700">60</text>
      {/* level 1 — 3 children */}
      {[20, 85, 150].map((x, i) => (
        <g key={i}>
          <line x1={100} y1={32} x2={x + 20} y2={46} stroke="rgba(255,255,255,0.25)" strokeWidth="1.5"/>
          <rect x={x} y={46} width={40} height={20} rx="3" fill="rgba(255,255,255,0.12)" stroke="rgba(255,255,255,0.25)" strokeWidth="1"/>
          <text x={x + 20} y={59} fill="white" fontSize="9" fontFamily="monospace" fontWeight="600" textAnchor="middle">
            {['10|18', '35|50', '70|90'][i]}
          </text>
        </g>
      ))}
      {/* level 2 — leaf dots */}
      {[10, 35, 60, 90, 115, 140, 165].map((x, i) => (
        <rect key={i} x={x} y={82} width={22} height={14} rx="2" fill="rgba(255,255,255,0.07)" stroke="rgba(255,255,255,0.15)" strokeWidth="1"/>
      ))}
    </svg>
  )
}

// ── Trie Dictionary ───────────────────────────────────────────────────────────
function TrieDictionary({ from, to }: SvgProps) {
  const id = 'trd'
  // Trie for: "ca", "car", "cat", "he", "her"
  // root → c → a(term) → r(term)
  //                     → t(term)
  //      → h → e(term) → r(term)
  const nodes = [
    { cx: 100, cy: 12,  ch: '∅',  term: false },
    { cx: 55,  cy: 46,  ch: 'c',  term: false },
    { cx: 145, cy: 46,  ch: 'h',  term: false },
    { cx: 55,  cy: 80,  ch: 'a',  term: true  },
    { cx: 145, cy: 80,  ch: 'e',  term: true  },
    { cx: 30,  cy: 108, ch: 'r',  term: true  },
    { cx: 80,  cy: 108, ch: 't',  term: true  },
    { cx: 145, cy: 108, ch: 'r',  term: true  },
  ]
  const edges = [[0,1],[0,2],[1,3],[2,4],[3,5],[3,6],[4,7]]
  return (
    <svg viewBox="0 0 200 120" className="w-full h-full" preserveAspectRatio="xMidYMid slice">
      <G id={id} from={from} to={to} />
      <rect width="200" height="120" fill={`url(#${id})`} />
      {edges.map(([a, b], i) => (
        <line key={i}
          x1={nodes[a].cx} y1={nodes[a].cy + 8}
          x2={nodes[b].cx} y2={nodes[b].cy - 8}
          stroke="rgba(255,255,255,0.25)" strokeWidth="1.5"/>
      ))}
      {nodes.map(({ cx, cy, ch, term }, i) => (
        <g key={i}>
          <circle cx={cx} cy={cy} r={9}
            fill={term ? 'rgba(52,211,153,0.75)' : i === 0 ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.15)'}
            stroke={term ? 'rgba(52,211,153,0.9)' : 'rgba(255,255,255,0.35)'}
            strokeWidth={term ? 1.5 : 1}/>
          <text x={cx} y={cy + 4} fill="white" fontSize="8" fontFamily="monospace"
            fontWeight="700" textAnchor="middle">{ch}</text>
        </g>
      ))}
    </svg>
  )
}

// ── LCRS Transform (N-ary → Binary) ──────────────────────────────────────────
function LCRSTransform({ from, to }: SvgProps) {
  const id = 'lcg'
  return (
    <svg viewBox="0 0 200 120" className="w-full h-full" preserveAspectRatio="xMidYMid slice">
      <G id={id} from={from} to={to} />
      <rect width="200" height="120" fill={`url(#${id})`} />
      {/* left panel: N-ary (A→B,C,D; B→E,F) */}
      {[18, 42, 66].map(x => (
        <line key={x} x1={42} y1={26} x2={x} y2={50} stroke="rgba(255,255,255,0.25)" strokeWidth="1.5"/>
      ))}
      <circle cx={42} cy={18} r={9} fill="rgba(255,255,255,0.2)" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5"/>
      <text x={42} y={22} fill="white" fontSize="8" fontFamily="monospace" fontWeight="700" textAnchor="middle">A</text>
      {[{cx:18,ch:'B'},{cx:42,ch:'C'},{cx:66,ch:'D'}].map(({cx,ch}) => (
        <g key={ch}>
          <circle cx={cx} cy={56} r={8} fill="rgba(255,255,255,0.12)" stroke="rgba(255,255,255,0.3)" strokeWidth="1"/>
          <text x={cx} y={60} fill="white" fontSize="7" fontFamily="monospace" textAnchor="middle">{ch}</text>
        </g>
      ))}
      {[8, 28].map((cx,i) => (
        <g key={i}>
          <line x1={18} y1={64} x2={cx} y2={82} stroke="rgba(255,255,255,0.18)" strokeWidth="1.5"/>
          <circle cx={cx} cy={88} r={6} fill="rgba(255,255,255,0.08)" stroke="rgba(255,255,255,0.2)" strokeWidth="1"/>
          <text x={cx} y={92} fill="white" fontSize="7" fontFamily="monospace" textAnchor="middle">{['E','F'][i]}</text>
        </g>
      ))}
      {/* arrow */}
      <path d="M84 55 L100 55" stroke="rgba(255,255,255,0.75)" strokeWidth="2" strokeLinecap="round"/>
      <path d="M96 50 L102 55 L96 60" fill="none" stroke="rgba(255,255,255,0.75)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      {/* right panel: LCRS binary */}
      <circle cx={120} cy={18} r={9} fill="rgba(255,255,255,0.2)" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5"/>
      <text x={120} y={22} fill="white" fontSize="8" fontFamily="monospace" fontWeight="700" textAnchor="middle">A</text>
      {/* A.left=B */}
      <line x1={114} y1={26} x2={110} y2={46} stroke="rgba(255,255,255,0.3)" strokeWidth="1.5"/>
      <circle cx={108} cy={52} r={8} fill="rgba(255,255,255,0.15)" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5"/>
      <text x={108} y={56} fill="white" fontSize="7" fontFamily="monospace" textAnchor="middle">B</text>
      {/* B.left=E */}
      <line x1={102} y1={60} x2={98} y2={78} stroke="rgba(255,255,255,0.25)" strokeWidth="1.5"/>
      <circle cx={96} cy={84} r={7} fill="rgba(255,255,255,0.1)" stroke="rgba(255,255,255,0.25)" strokeWidth="1"/>
      <text x={96} y={88} fill="white" fontSize="7" fontFamily="monospace" textAnchor="middle">E</text>
      {/* E.right=F (sibling) */}
      <line x1={103} y1={84} x2={118} y2={84} stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" strokeDasharray="3 2"/>
      <circle cx={124} cy={84} r={7} fill="rgba(255,255,255,0.08)" stroke="rgba(255,255,255,0.2)" strokeWidth="1"/>
      <text x={124} y={88} fill="white" fontSize="7" fontFamily="monospace" textAnchor="middle">F</text>
      {/* B.right=C (sibling) */}
      <line x1={116} y1={52} x2={138} y2={52} stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" strokeDasharray="3 2"/>
      <circle cx={144} cy={52} r={8} fill="rgba(255,255,255,0.1)" stroke="rgba(255,255,255,0.25)" strokeWidth="1"/>
      <text x={144} y={56} fill="white" fontSize="7" fontFamily="monospace" textAnchor="middle">C</text>
      {/* C.right=D */}
      <line x1={152} y1={52} x2={168} y2={52} stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" strokeDasharray="3 2"/>
      <circle cx={174} cy={52} r={7} fill="rgba(255,255,255,0.08)" stroke="rgba(255,255,255,0.2)" strokeWidth="1"/>
      <text x={174} y={56} fill="white" fontSize="7" fontFamily="monospace" textAnchor="middle">D</text>
      {/* legend */}
      <text x={104} y={110} fill="rgba(255,255,255,0.35)" fontSize="6" fontFamily="monospace">↙child  →sibling</text>
    </svg>
  )
}

// ── Huffman Coding ────────────────────────────────────────────────────────────
function HuffmanCoding({ from, to }: SvgProps) {
  const id = 'hfg'
  return (
    <svg viewBox="0 0 200 120" className="w-full h-full" preserveAspectRatio="xMidYMid slice">
      <G id={id} from={from} to={to} />
      <rect width="200" height="120" fill={`url(#${id})`} />
      {/* root */}
      <circle cx={100} cy={16} r={13} fill="rgba(255,255,255,0.18)" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5"/>
      <text x={100} y={20} fill="white" fontSize="9" fontFamily="monospace" fontWeight="700" textAnchor="middle">100</text>
      {/* edges */}
      <line x1={90} y1={28} x2={65} y2={50} stroke="rgba(255,255,255,0.3)" strokeWidth="1.5"/>
      <line x1={110} y1={28} x2={135} y2={50} stroke="rgba(255,255,255,0.3)" strokeWidth="1.5"/>
      <text x={72} y={44} fill="rgba(255,255,255,0.7)" fontSize="10" fontWeight="700">0</text>
      <text x={126} y={44} fill="rgba(255,255,255,0.7)" fontSize="10" fontWeight="700">1</text>
      {/* level 1 */}
      <circle cx={65} cy={58} r={11} fill="rgba(255,255,255,0.13)" stroke="rgba(255,255,255,0.3)" strokeWidth="1"/>
      <text x={65} y={62} fill="white" fontSize="8" fontFamily="monospace" textAnchor="middle">45</text>
      <circle cx={135} cy={58} r={11} fill="rgba(255,255,255,0.13)" stroke="rgba(255,255,255,0.3)" strokeWidth="1"/>
      <text x={135} y={62} fill="white" fontSize="8" fontFamily="monospace" textAnchor="middle">55</text>
      {/* leaves */}
      {[
        [55, 82, 'A', '30'], [75, 82, 'B', '15'],
        [120, 82, 'C', '25'], [148, 82, 'D', '30'],
      ].map(([x, y, label, freq], i) => (
        <g key={i}>
          <line x1={[65,65,135,135][i]} y1={69} x2={+x} y2={+y - 6} stroke="rgba(255,255,255,0.2)" strokeWidth="1"/>
          <rect x={+x - 10} y={+y - 6} width={20} height={22} rx="3" fill="rgba(255,255,255,0.1)" stroke="rgba(255,255,255,0.25)" strokeWidth="1"/>
          <text x={+x} y={+y + 5} fill="rgba(255,255,255,0.9)" fontSize="9" fontFamily="monospace" fontWeight="700" textAnchor="middle">{label}</text>
          <text x={+x} y={+y + 13} fill="rgba(255,255,255,0.5)" fontSize="7" textAnchor="middle">{freq}</text>
        </g>
      ))}
    </svg>
  )
}

// ── AVL Cursors ───────────────────────────────────────────────────────────────
function AVLCursors({ from, to }: SvgProps) {
  const id = 'avg'
  return (
    <svg viewBox="0 0 200 120" className="w-full h-full" preserveAspectRatio="xMidYMid slice">
      <G id={id} from={from} to={to} />
      <rect width="200" height="120" fill={`url(#${id})`} />
      {/* rotation arc hint */}
      <path d="M 155 30 A 22 22 0 0 1 168 55" fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth="2" strokeDasharray="4 3"/>
      <path d="M165 52 L168 55 L164 57" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      {/* tree */}
      <line x1={80} y1={28} x2={50} y2={52} stroke="rgba(255,255,255,0.25)" strokeWidth="1.5"/>
      <line x1={80} y1={28} x2={115} y2={52} stroke="rgba(255,255,255,0.25)" strokeWidth="1.5"/>
      <line x1={115} y1={64} x2={100} y2={86} stroke="rgba(255,255,255,0.2)" strokeWidth="1.5"/>
      <line x1={115} y1={64} x2={140} y2={86} stroke="rgba(255,255,255,0.2)" strokeWidth="1.5"/>
      <circle cx={80} cy={20} r={12} fill="rgba(255,255,255,0.2)" stroke="rgba(255,255,255,0.45)" strokeWidth="1.5"/>
      <text x={80} y={24} fill="white" fontSize="10" fontFamily="monospace" fontWeight="700" textAnchor="middle">30</text>
      <circle cx={50} cy={58} r={10} fill="rgba(255,255,255,0.13)" stroke="rgba(255,255,255,0.3)" strokeWidth="1"/>
      <text x={50} y={62} fill="white" fontSize="9" fontFamily="monospace" fontWeight="700" textAnchor="middle">15</text>
      <circle cx={115} cy={58} r={10} fill="rgba(255,255,255,0.13)" stroke="rgba(255,255,255,0.3)" strokeWidth="1"/>
      <text x={115} y={62} fill="white" fontSize="9" fontFamily="monospace" fontWeight="700" textAnchor="middle">50</text>
      <circle cx={100} cy={92} r={9} fill="rgba(255,255,255,0.08)" stroke="rgba(255,255,255,0.2)" strokeWidth="1"/>
      <text x={100} y={96} fill="white" fontSize="9" fontFamily="monospace" textAnchor="middle">40</text>
      <circle cx={140} cy={92} r={9} fill="rgba(255,255,255,0.08)" stroke="rgba(255,255,255,0.2)" strokeWidth="1"/>
      <text x={140} y={96} fill="white" fontSize="9" fontFamily="monospace" textAnchor="middle">70</text>
      {/* balance factors */}
      <text x={96} y={17} fill="rgba(255,255,255,0.5)" fontSize="8">-1</text>
      <text x={62} y={55} fill="rgba(255,255,255,0.4)" fontSize="7">0</text>
      <text x={127} y={55} fill="rgba(255,255,255,0.4)" fontSize="7">0</text>
    </svg>
  )
}

// ── Graph Algorithms (Dijkstra & Prim) ───────────────────────────────────────
function GraphAlgorithms({ from, to }: SvgProps) {
  const id = 'dpg'
  const nodes = [
    { cx: 40,  cy: 60,  label: 'A' },
    { cx: 80,  cy: 25,  label: 'B' },
    { cx: 80,  cy: 95,  label: 'C' },
    { cx: 130, cy: 40,  label: 'D' },
    { cx: 130, cy: 85,  label: 'E' },
    { cx: 168, cy: 60,  label: 'F' },
  ]
  const edges = [
    { from: 0, to: 1, w: '4',  highlighted: true  },
    { from: 0, to: 2, w: '2',  highlighted: false },
    { from: 1, to: 3, w: '5',  highlighted: true  },
    { from: 2, to: 4, w: '6',  highlighted: false },
    { from: 3, to: 5, w: '3',  highlighted: true  },
    { from: 4, to: 5, w: '1',  highlighted: false },
    { from: 1, to: 4, w: '7',  highlighted: false },
  ]
  return (
    <svg viewBox="0 0 200 120" className="w-full h-full" preserveAspectRatio="xMidYMid slice">
      <G id={id} from={from} to={to} />
      <rect width="200" height="120" fill={`url(#${id})`} />
      {edges.map((e, i) => {
        const n1 = nodes[e.from], n2 = nodes[e.to]
        const mx = (n1.cx + n2.cx) / 2, my = (n1.cy + n2.cy) / 2
        return (
          <g key={i}>
            <line x1={n1.cx} y1={n1.cy} x2={n2.cx} y2={n2.cy}
              stroke={e.highlighted ? 'rgba(250,204,21,0.85)' : 'rgba(255,255,255,0.2)'}
              strokeWidth={e.highlighted ? 2.5 : 1.5}/>
            <text x={mx} y={my - 3} fill={e.highlighted ? 'rgba(250,204,21,0.9)' : 'rgba(255,255,255,0.45)'}
              fontSize="8" textAnchor="middle" fontFamily="monospace">{e.w}</text>
          </g>
        )
      })}
      {nodes.map((n, i) => (
        <g key={i}>
          <circle cx={n.cx} cy={n.cy} r={11} fill="rgba(255,255,255,0.13)" stroke="rgba(255,255,255,0.35)" strokeWidth="1.5"/>
          <text x={n.cx} y={n.cy + 4} fill="white" fontSize="9" fontFamily="monospace" fontWeight="700" textAnchor="middle">{n.label}</text>
        </g>
      ))}
    </svg>
  )
}

// ── Graph Traversals (BFS & DFS) ─────────────────────────────────────────────
function GraphTraversals({ from, to }: SvgProps) {
  const id = 'grg'
  const nodes = [
    { cx: 60,  cy: 30,  n: 1 },
    { cx: 140, cy: 30,  n: 2 },
    { cx: 30,  cy: 75,  n: 3 },
    { cx: 100, cy: 75,  n: 4 },
    { cx: 170, cy: 75,  n: 5 },
    { cx: 65,  cy: 108, n: 6 },
  ]
  const edges = [[0,1],[0,2],[0,3],[1,4],[2,5],[3,5],[1,3]]
  return (
    <svg viewBox="0 0 200 120" className="w-full h-full" preserveAspectRatio="xMidYMid slice">
      <G id={id} from={from} to={to} />
      <rect width="200" height="120" fill={`url(#${id})`} />
      {edges.map(([a, b], i) => (
        <line key={i} x1={nodes[a].cx} y1={nodes[a].cy} x2={nodes[b].cx} y2={nodes[b].cy}
          stroke="rgba(255,255,255,0.2)" strokeWidth="1.5"/>
      ))}
      {nodes.map(({ cx, cy, n }, i) => (
        <g key={i}>
          <circle cx={cx} cy={cy} r={12} fill={i === 0 ? 'rgba(255,255,255,0.28)' : 'rgba(255,255,255,0.1)'}
            stroke="rgba(255,255,255,0.35)" strokeWidth="1.5"/>
          <text x={cx} y={cy + 4} fill="white" fontSize="10" fontFamily="monospace" fontWeight="700" textAnchor="middle">{n}</text>
        </g>
      ))}
      {/* DFS / BFS labels */}
      <text x={190} y={15} fill="rgba(255,255,255,0.5)" fontSize="8" textAnchor="end">DFS</text>
      <text x={190} y={24} fill="rgba(255,255,255,0.5)" fontSize="8" textAnchor="end">BFS</text>
    </svg>
  )
}

// ── Kruskal ───────────────────────────────────────────────────────────────────
function Kruskal({ from, to }: SvgProps) {
  const id = 'krg'
  const nodes = [
    { cx: 40, cy: 40 }, { cx: 100, cy: 20 }, { cx: 160, cy: 40 },
    { cx: 40, cy: 90 }, { cx: 100, cy: 90 }, { cx: 160, cy: 90 },
  ]
  const edges = [
    { a:0, b:1, w:'1', mst:true  },{ a:1, b:2, w:'3', mst:true  },
    { a:0, b:3, w:'4', mst:false },{ a:1, b:4, w:'2', mst:true  },
    { a:2, b:5, w:'5', mst:false },{ a:3, b:4, w:'6', mst:false },
    { a:4, b:5, w:'2', mst:true  },{ a:0, b:4, w:'7', mst:false },
  ]
  return (
    <svg viewBox="0 0 200 120" className="w-full h-full" preserveAspectRatio="xMidYMid slice">
      <G id={id} from={from} to={to} />
      <rect width="200" height="120" fill={`url(#${id})`} />
      {edges.map(({a,b,w,mst}, i) => {
        const n1 = nodes[a], n2 = nodes[b]
        return (
          <g key={i}>
            <line x1={n1.cx} y1={n1.cy} x2={n2.cx} y2={n2.cy}
              stroke={mst ? 'rgba(74,222,128,0.85)' : 'rgba(255,255,255,0.15)'}
              strokeWidth={mst ? 2.5 : 1}
              strokeDasharray={mst ? 'none' : '4 3'}/>
            <text x={(n1.cx+n2.cx)/2} y={(n1.cy+n2.cy)/2 - 3}
              fill={mst ? 'rgba(74,222,128,0.9)' : 'rgba(255,255,255,0.3)'}
              fontSize="8" textAnchor="middle" fontFamily="monospace">{w}</text>
          </g>
        )
      })}
      {nodes.map(({cx,cy}, i) => (
        <circle key={i} cx={cx} cy={cy} r={10}
          fill="rgba(255,255,255,0.12)" stroke="rgba(255,255,255,0.35)" strokeWidth="1.5"/>
      ))}
    </svg>
  )
}

// ── Hash Dispersion ───────────────────────────────────────────────────────────
function HashDispersion({ from, to }: SvgProps) {
  const id = 'hmx'
  const cols = 5, rows = 4
  const cw = 30, ch = 22, ox = 22, oy = 12
  const filled = new Set([1, 6, 8, 13, 15, 19])
  return (
    <svg viewBox="0 0 200 120" className="w-full h-full" preserveAspectRatio="xMidYMid slice">
      <G id={id} from={from} to={to} />
      <rect width="200" height="120" fill={`url(#${id})`} />
      {Array.from({ length: rows }, (_, r) => (
        <text key={r} x={14} y={oy + r * ch + ch / 2 + 4} fill="rgba(255,255,255,0.4)" fontSize="8" fontFamily="monospace" textAnchor="middle">
          h{r}
        </text>
      ))}
      {Array.from({ length: rows * cols }, (_, idx) => {
        const r = Math.floor(idx / cols), c = idx % cols
        const isFilled = filled.has(idx)
        return (
          <rect key={idx} x={ox + c * cw} y={oy + r * ch} width={cw - 2} height={ch - 2} rx="2"
            fill={isFilled ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.06)'}
            stroke={isFilled ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.12)'}
            strokeWidth="1"/>
        )
      })}
      {/* hash symbol decoration */}
      <text x={178} y={100} fill="rgba(255,255,255,0.2)" fontSize="32" fontFamily="monospace" fontWeight="900">#</text>
    </svg>
  )
}

// ── Hash Functions ────────────────────────────────────────────────────────────
function HashFunctions({ from, to }: SvgProps) {
  const id = 'hmt'
  const buckets = 5
  const bh = 18, bw = 28, ox = 15, oy = 10
  const chains = [1, 3, 0, 2, 1]
  return (
    <svg viewBox="0 0 200 120" className="w-full h-full" preserveAspectRatio="xMidYMid slice">
      <G id={id} from={from} to={to} />
      <rect width="200" height="120" fill={`url(#${id})`} />
      {Array.from({ length: buckets }, (_, i) => {
        const y = oy + i * (bh + 4)
        return (
          <g key={i}>
            <text x={10} y={y + bh - 5} fill="rgba(255,255,255,0.35)" fontSize="8" fontFamily="monospace">{i}</text>
            <rect x={ox + 12} y={y} width={bw} height={bh} rx="2"
              fill="rgba(255,255,255,0.12)" stroke="rgba(255,255,255,0.3)" strokeWidth="1"/>
            <text x={ox + 26} y={y + 12} fill="white" fontSize="8" fontFamily="monospace" textAnchor="middle">
              {['→', '42', '—', '17', '8'][i]}
            </text>
            {Array.from({ length: chains[i] }, (_, j) => {
              const cx = ox + 12 + bw + 10 + j * (bw + 6)
              return (
                <g key={j}>
                  <line x1={cx - 10} y1={y + bh / 2} x2={cx} y2={y + bh / 2} stroke="rgba(255,255,255,0.3)" strokeWidth="1.5"/>
                  <rect x={cx} y={y} width={bw} height={bh} rx="2"
                    fill="rgba(255,255,255,0.08)" stroke="rgba(255,255,255,0.2)" strokeWidth="1"/>
                </g>
              )
            })}
          </g>
        )
      })}
    </svg>
  )
}

// ── Chromatic Number ──────────────────────────────────────────────────────────
function ChromaticNumber({ from, to }: SvgProps) {
  const id = 'cng'
  const nodeColors = ['#ef4444','#22c55e','#3b82f6','#f59e0b','#ef4444','#22c55e']
  const nodes = [
    { cx:60,  cy:30  },{ cx:140, cy:30  },{ cx:30,  cy:75  },
    { cx:100, cy:65  },{ cx:170, cy:75  },{ cx:80,  cy:105 },
  ]
  const edges = [[0,1],[0,2],[1,4],[2,3],[3,4],[2,5],[3,5],[0,3]]
  return (
    <svg viewBox="0 0 200 120" className="w-full h-full" preserveAspectRatio="xMidYMid slice">
      <G id={id} from={from} to={to} />
      <rect width="200" height="120" fill={`url(#${id})`} />
      {edges.map(([a,b], i) => (
        <line key={i} x1={nodes[a].cx} y1={nodes[a].cy} x2={nodes[b].cx} y2={nodes[b].cy}
          stroke="rgba(255,255,255,0.2)" strokeWidth="1.5"/>
      ))}
      {nodes.map(({cx,cy}, i) => (
        <g key={i}>
          <circle cx={cx} cy={cy} r={12} fill={nodeColors[i]} opacity={0.85} stroke="rgba(255,255,255,0.4)" strokeWidth="1.5"/>
          <text x={cx} y={cy + 4} fill="white" fontSize="9" fontFamily="monospace" fontWeight="700" textAnchor="middle">
            {i + 1}
          </text>
        </g>
      ))}
      {/* χ(G) label */}
      <text x={185} y={110} fill="rgba(255,255,255,0.3)" fontSize="20" fontFamily="monospace" fontStyle="italic" textAnchor="end">χ=3</text>
    </svg>
  )
}

// ── Topological Sort ──────────────────────────────────────────────────────────
function TopologicalSort({ from, to }: SvgProps) {
  const id = 'tpg'
  const nodes = [
    { cx:30,  cy:60, label:'1' },
    { cx:75,  cy:30, label:'2' },
    { cx:75,  cy:90, label:'3' },
    { cx:120, cy:50, label:'4' },
    { cx:120, cy:90, label:'5' },
    { cx:168, cy:60, label:'6' },
  ]
  const edges = [[0,1],[0,2],[1,3],[2,4],[3,5],[4,5],[1,4]]
  const ARROW = 8
  return (
    <svg viewBox="0 0 200 120" className="w-full h-full" preserveAspectRatio="xMidYMid slice">
      <G id={id} from={from} to={to} />
      <rect width="200" height="120" fill={`url(#${id})`} />
      {edges.map(([a,b], i) => {
        const n1 = nodes[a], n2 = nodes[b]
        const dx = n2.cx - n1.cx, dy = n2.cy - n1.cy
        const len = Math.sqrt(dx*dx + dy*dy)
        const ux = dx/len, uy = dy/len
        const x1 = n1.cx + ux*12, y1 = n1.cy + uy*12
        const x2 = n2.cx - ux*14, y2 = n2.cy - uy*14
        return (
          <g key={i}>
            <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="rgba(255,255,255,0.3)" strokeWidth="1.5"/>
            <path d={`M${x2 - uy*ARROW/2 - ux*ARROW} ${y2 + ux*ARROW/2 - uy*ARROW} L${x2} ${y2} L${x2 + uy*ARROW/2 - ux*ARROW} ${y2 - ux*ARROW/2 - uy*ARROW}`}
              fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </g>
        )
      })}
      {nodes.map(({cx,cy,label},i) => (
        <g key={i}>
          <circle cx={cx} cy={cy} r={12} fill="rgba(255,255,255,0.15)" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5"/>
          <text x={cx} y={cy+4} fill="white" fontSize="10" fontFamily="monospace" fontWeight="700" textAnchor="middle">{label}</text>
        </g>
      ))}
    </svg>
  )
}

// ── Hash Table Chaining (live interactive) ────────────────────────────────────
function HashTableChaining({ from, to }: SvgProps) {
  const id = 'htc'
  // 5 bucket rows: 0 (2 entries), 1 (empty), 2 (2 entries), 3 (empty), 4 (1 entry)
  const rows = [
    { label: '0', entries: ['14', '21'], filled: true },
    { label: '1', entries: [],           filled: false },
    { label: '2', entries: ['9', '16'],  filled: true },
    { label: '3', entries: [],           filled: false },
    { label: '4', entries: ['7'],        filled: true },
  ]
  const rowH = 20, startY = 8, boxW = 28, boxH = 14, gap = 6
  return (
    <svg viewBox="0 0 200 120" className="w-full h-full" preserveAspectRatio="xMidYMid slice">
      <G id={id} from={from} to={to} />
      <rect width="200" height="120" fill={`url(#${id})`} />
      {rows.map((row, ri) => {
        const y = startY + ri * rowH
        return (
          <g key={ri}>
            {/* bucket label */}
            <text x={18} y={y + boxH - 2} fill="rgba(255,255,255,0.4)" fontSize="8" fontFamily="monospace" textAnchor="middle">
              b[{row.label}]
            </text>
            {/* divider tick */}
            <line x1={30} y1={y + 2} x2={30} y2={y + boxH - 2} stroke="rgba(255,255,255,0.3)" strokeWidth="1"/>
            {row.filled ? (
              row.entries.map((entry, ei) => {
                const x = 34 + ei * (boxW + gap)
                return (
                  <g key={ei}>
                    {ei > 0 && (
                      <text x={x - gap + 1} y={y + 10} fill="rgba(255,255,255,0.4)" fontSize="8" textAnchor="middle">→</text>
                    )}
                    <rect x={x} y={y} width={boxW} height={boxH} rx="2"
                      fill="rgba(34,197,94,0.2)" stroke="rgba(34,197,94,0.5)" strokeWidth="1"/>
                    <text x={x + boxW/2} y={y + 9} fill="rgba(255,255,255,0.85)" fontSize="8" fontFamily="monospace" textAnchor="middle">
                      {entry}
                    </text>
                  </g>
                )
              })
            ) : (
              <rect x={34} y={y} width={boxW} height={boxH} rx="2"
                fill="rgba(255,255,255,0.04)" stroke="rgba(255,255,255,0.15)" strokeWidth="1" strokeDasharray="3 2"/>
            )}
            {row.filled && (
              <text x={34 + row.entries.length * (boxW + gap)} y={y + 10}
                fill="rgba(255,255,255,0.3)" fontSize="8" fontFamily="monospace">→ ∅</text>
            )}
          </g>
        )
      })}
      <text x={188} y={112} fill="rgba(255,255,255,0.25)" fontSize="10" fontFamily="monospace" textAnchor="end">h(k)=k mod 7</text>
    </svg>
  )
}

// ── Chromatic Graph (live interactive) ───────────────────────────────────────
function ChromaticGraph({ from, to }: SvgProps) {
  const id = 'chg'
  const nodeColors = ['#0000FF','#FF0000','#00FF00','#FFFF00','#0000FF','#FF0000']
  const nodes = [
    { cx:50,  cy:35 },{ cx:130, cy:25 },{ cx:170, cy:75 },
    { cx:100, cy:100 },{ cx:30, cy:85 },{ cx:100, cy:55 },
  ]
  const edges = [[0,1],[1,2],[2,3],[3,4],[4,0],[0,5],[1,5],[2,5]]
  return (
    <svg viewBox="0 0 200 120" className="w-full h-full" preserveAspectRatio="xMidYMid slice">
      <G id={id} from={from} to={to} />
      <rect width="200" height="120" fill={`url(#${id})`} />
      {edges.map(([a,b], i) => (
        <line key={i} x1={nodes[a].cx} y1={nodes[a].cy} x2={nodes[b].cx} y2={nodes[b].cy}
          stroke="rgba(255,255,255,0.22)" strokeWidth="1.5"/>
      ))}
      {nodes.map(({cx,cy}, i) => (
        <g key={i}>
          <circle cx={cx} cy={cy} r={12} fill={nodeColors[i]} opacity={0.9}
            stroke="rgba(255,255,255,0.5)" strokeWidth="1.5"/>
          <text x={cx} y={cy+4} fill="white" fontSize="8" fontFamily="monospace"
            fontWeight="700" textAnchor="middle">{i+1}</text>
        </g>
      ))}
      <text x={188} y={112} fill="rgba(255,255,255,0.35)" fontSize="18"
        fontFamily="monospace" fontStyle="italic" textAnchor="end">χ≈3</text>
    </svg>
  )
}

// ── Default fallback ──────────────────────────────────────────────────────────
function DefaultArtwork({ from, to }: SvgProps) {
  const id = 'dfg'
  return (
    <svg viewBox="0 0 200 120" className="w-full h-full" preserveAspectRatio="xMidYMid slice">
      <G id={id} from={from} to={to} />
      <rect width="200" height="120" fill={`url(#${id})`} />
      <circle cx={100} cy={60} r={30} fill="rgba(255,255,255,0.1)" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5"/>
    </svg>
  )
}

// ── Artwork registry ──────────────────────────────────────────────────────────
const ARTWORK: Record<string, React.FC<SvgProps>> = {
  'trie-dictionary':  TrieDictionary,
  'lcrs-transform':   LCRSTransform,
  'b-tree':           BTree,
  'huffman-coding':   HuffmanCoding,
  'avl-cursor':       AVLCursors,
  'graph-algorithms': GraphAlgorithms,
  'graph-traversals': GraphTraversals,
  'kruskal':          Kruskal,
  'hash-dispersion':  HashDispersion,
  'hash-functions':   HashFunctions,
  'chromatic-number':    ChromaticNumber,
  'chromatic-graph':     ChromaticGraph,
  'hash-table-chaining': HashTableChaining,
  'topological-sort': TopologicalSort,
}
