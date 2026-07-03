export type CS2Category = 'Trees' | 'Graphs' | 'Hash'

export interface PlannedEndpoint {
  method: 'GET' | 'POST' | 'DELETE' | 'PUT'
  path: string
  description: string
}

export interface CS2Project {
  slug: string
  title: string
  titleEs: string
  description: string
  detail: string
  category: CS2Category
  timeComplexity: string
  spaceComplexity: string
  concepts: string[]
  gradientFrom: string
  gradientTo: string
  plannedEndpoints: PlannedEndpoint[]
}

export const CS2_PROJECTS: CS2Project[] = [
  {
    slug: 'b-tree',
    title: 'B-Tree',
    titleEs: 'Árbol B',
    description: 'Self-balancing tree where each node holds multiple keys. Foundation for database indexing and file systems.',
    detail: 'A B-tree generalises a binary search tree by allowing nodes to have more than two children. All leaves appear at the same level, and insertion and deletion keep the tree balanced. Widely used in relational databases and file systems because its node size maps naturally to a disk block.',
    category: 'Trees',
    timeComplexity: 'O(log n)',
    spaceComplexity: 'O(n)',
    concepts: ['Multi-way search tree', 'Balanced insertion', 'Disk locality', 'Database indexing'],
    gradientFrom: '#1e3a8a',
    gradientTo: '#1d4ed8',
    plannedEndpoints: [
      { method: 'POST', path: '/api/v1/btree/insert', description: 'Insert a key, returns the updated tree' },
      { method: 'POST', path: '/api/v1/btree/delete', description: 'Delete a key, rebalancing via borrow/merge' },
      { method: 'POST', path: '/api/v1/btree/find',   description: 'Find a key, returns the path from root' },
    ],
  },
  {
    slug: 'trie-dictionary',
    title: 'Trie Dictionary',
    titleEs: 'Árbol N-Ario (Diccionario)',
    description: 'Prefix tree for word storage with translation lookup, autocomplete, and traversal visualization.',
    detail: 'A Trie (prefix tree) stores strings character by character, sharing common prefixes among words. Each node holds a single character; a terminal node marks the end of a word and stores its translation. This makes prefix search and autocomplete O(m) — proportional only to the prefix length. Ported from the legacy Java "Arbol N-ario" bilingual dictionary with proper deletion, prefix search, and three traversal orders.',
    category: 'Trees',
    timeComplexity: 'O(m)',
    spaceComplexity: 'O(n·m)',
    concepts: ['Prefix trees', 'Autocomplete', 'Tree traversals', 'Dictionary data structure'],
    gradientFrom: '#065f46',
    gradientTo: '#047857',
    plannedEndpoints: [
      { method: 'POST', path: '/api/v1/trie/insert',   description: 'Insert a word + translation, returns updated trie' },
      { method: 'POST', path: '/api/v1/trie/delete',   description: 'Delete a word with proper node pruning' },
      { method: 'POST', path: '/api/v1/trie/search',   description: 'Find all words matching a prefix' },
      { method: 'POST', path: '/api/v1/trie/traverse', description: 'Traverse the trie (PREORDER/INORDER/POSTORDER)' },
    ],
  },
  {
    slug: 'lcrs-transform',
    title: 'N-ary to Binary (LCRS)',
    titleEs: 'Árbol N-Ario a Binario',
    description: 'Left-Child Right-Sibling transformation with weighted edges and shortest root-to-leaf path visualization.',
    detail: 'The LCRS (Left-Child Right-Sibling) encoding is the canonical way to convert any N-ary tree into a binary tree: each node\'s first child becomes its left pointer, and its next sibling becomes its right pointer. This preserves the full N-ary structure without any information loss and uses O(n) space. Previously called "N-ary to Binary" — LCRS is the precise computer-science term used in all modern textbooks.',
    category: 'Trees',
    timeComplexity: 'O(n)',
    spaceComplexity: 'O(n)',
    concepts: ['LCRS encoding', 'N-ary trees', 'Binary trees', 'Weighted shortest path'],
    gradientFrom: '#164e63',
    gradientTo: '#0e7490',
    plannedEndpoints: [
      { method: 'POST', path: '/api/v1/lcrs/transform',     description: 'Convert N-ary tree to LCRS binary, returns both trees' },
      { method: 'POST', path: '/api/v1/lcrs/shortest-path', description: 'Find shortest root-to-leaf path by edge weight sum' },
      { method: 'POST', path: '/api/v1/lcrs/traverse',      description: 'Traverse binary tree (PREORDER/INORDER/POSTORDER/BFS)' },
    ],
  },
  {
    slug: 'huffman-coding',
    title: 'Huffman Coding',
    titleEs: 'Codigos de Huffman',
    description: 'Optimal prefix-free encoding with tree visualization and compression analysis.',
    detail: 'Huffman coding assigns variable-length prefix-free binary codes to symbols based on their frequency. More frequent symbols get shorter codes. The algorithm builds an optimal binary tree bottom-up using a min-priority queue, achieving the minimum possible average code length. Ported from the legacy Java application with a min-heap instead of the O(n²) linear scan.',
    category: 'Trees',
    timeComplexity: 'O(n log n)',
    spaceComplexity: 'O(n)',
    concepts: ['Greedy algorithms', 'Priority queues', 'Prefix-free codes', 'Data compression'],
    gradientFrom: '#92400e',
    gradientTo: '#b45309',
    plannedEndpoints: [
      { method: 'POST', path: '/api/v1/huffman/encode', description: 'Encode text — returns tree, code table, and compression stats' },
    ],
  },
  {
    slug: 'avl-cursor',
    title: 'AVL with Cursors',
    titleEs: 'Cursores AVL',
    description: 'Height-balanced BST that maintains a balance factor of ±1, implemented with a cursor-based memory model.',
    detail: 'An AVL tree guarantees O(log n) operations by tracking the height difference between subtrees. After any insertion or deletion, single or double rotations restore balance. The cursor-based variant simulates pointer-based trees inside a fixed-size array, demonstrating how dynamic structures can be embedded in contiguous memory.',
    category: 'Trees',
    timeComplexity: 'O(log n)',
    spaceComplexity: 'O(n)',
    concepts: ['Self-balancing BST', 'Rotations', 'Balance factor', 'Cursor arrays'],
    gradientFrom: '#881337',
    gradientTo: '#be123c',
    plannedEndpoints: [
      { method: 'POST', path: '/api/v1/avl-cursor/initialize', description: 'Create an empty cursor table with name + capacity' },
      { method: 'POST', path: '/api/v1/avl-cursor/insert',     description: 'Insert a key — returns updated cursor + rotation info' },
      { method: 'POST', path: '/api/v1/avl-cursor/delete',     description: 'Delete a key — returns updated cursor + rotation info' },
    ],
  },
  {
    slug: 'graph-algorithms',
    title: 'Graph Algorithms',
    titleEs: 'Dijkstra & Prim',
    description: 'Shortest paths and minimum spanning trees on weighted graphs.',
    detail: 'Dijkstra\'s algorithm finds the single-source shortest path in a weighted graph without negative edges, using a min-priority queue to greedily relax edges in O((V+E) log V). Prim\'s algorithm grows a minimum spanning tree by repeatedly selecting the cheapest edge connecting the MST to a new vertex, also in O((V+E) log V). Both share structural similarity — greedy selection driven by a priority queue. Ported from the legacy Java application, correcting the FIFO-queue bug that produced wrong results on certain weighted graphs.',
    category: 'Graphs',
    timeComplexity: 'O((V+E) log V)',
    spaceComplexity: 'O(V + E)',
    concepts: ['Dijkstra shortest path', 'Prim MST', 'Priority queues', 'Adjacency matrix', 'Greedy algorithms'],
    gradientFrom: '#134e4a',
    gradientTo: '#0f766e',
    plannedEndpoints: [
      { method: 'POST', path: '/api/v1/graph/shortest-path', description: 'Dijkstra from a source vertex — returns distances, parents, and shortest-path tree' },
      { method: 'POST', path: '/api/v1/graph/mst',           description: "Prim's MST — returns MST edges and total weight" },
    ],
  },
  {
    slug: 'graph-traversals',
    title: 'Graph Traversals',
    titleEs: 'Recorridos de Grafos (BFS & DFS)',
    description: 'Breadth-first and depth-first search on directed graphs with spanning tree visualization.',
    detail: 'BFS (Breadth-First Search) explores level by level using a queue, naturally finding shortest paths in unweighted graphs. DFS (Depth-First Search) follows branches to their deepest point using a stack before backtracking, revealing connected components and cycle structure. Both produce a spanning tree of discovery edges — BFS trees are wide and shallow while DFS trees are narrow and deep, a contrast made visual by rendering both side-by-side. Ported from the legacy Java/Swing application with O(1) visited checks and iterative DFS to eliminate stack-overflow risk.',
    category: 'Graphs',
    timeComplexity: 'O(V + E)',
    spaceComplexity: 'O(V)',
    concepts: ['BFS', 'DFS', 'Spanning trees', 'Adjacency lists', 'Graph exploration'],
    gradientFrom: '#312e81',
    gradientTo: '#4338ca',
    plannedEndpoints: [
      { method: 'POST', path: '/api/v1/graph-traversal/bfs', description: 'BFS from source — returns traversal order + spanning tree' },
      { method: 'POST', path: '/api/v1/graph-traversal/dfs', description: 'DFS from source — returns traversal order + spanning tree' },
    ],
  },
  {
    slug: 'kruskal',
    title: "Kruskal's MST",
    titleEs: 'Algoritmo de Kruskal',
    description: 'Minimum spanning tree via sorted-edge greedy selection with Union-Find cycle detection.',
    detail: "Kruskal's algorithm finds the MST by sorting all edges by weight and greedily adding each one, skipping any that would create a cycle. Cycle detection is done in near O(1) amortized time using a Union-Find (disjoint-set) data structure with union-by-rank and path compression. Unlike Prim's which grows from a vertex, Kruskal operates globally on the edge list — making the sorted-edge view the educational centerpiece. Ported from the legacy Java application, replacing the naive ArrayList-based union-find with a proper O(α(n)) implementation.",
    category: 'Graphs',
    timeComplexity: 'O(E log E)',
    spaceComplexity: 'O(V + E)',
    concepts: ["Kruskal's MST", 'Union-Find', 'Greedy algorithms', 'Cycle detection', 'Disjoint sets'],
    gradientFrom: '#14532d',
    gradientTo: '#15803d',
    plannedEndpoints: [
      { method: 'POST', path: '/api/v1/graph/kruskal', description: "Kruskal's MST — returns MST edges sorted by weight and total weight" },
    ],
  },
  {
    slug: 'hash-dispersion',
    title: 'Hash Dispersion',
    titleEs: 'Matriz de Dispersión',
    description: 'Separate chaining hash table with cursor-based linked lists — visualize how keys scatter across buckets.',
    detail: 'Hash dispersion uses h(key) = key % prime to scatter entries across buckets, resolving collisions with separate chaining implemented as cursor-based linked lists in a flat array. Each slot stores (position, key, value, nextCursor) where nextCursor points to the next entry in the same chain. The educational value is in seeing TWO simultaneous views: the bucket-heads table (which bucket each key hashes to, with the full chain) and the data array (the physical layout with cursor pointers linking the chains). Ported from the legacy Java/Swing application, fixing the prime validation edge cases and removing the UI coupling from the domain.',
    category: 'Hash',
    timeComplexity: 'O(1) avg / O(n) worst',
    spaceComplexity: 'O(n)',
    concepts: ['Hash functions', 'Separate chaining', 'Cursor-based linked lists', 'Prime modulus', 'Collision resolution'],
    gradientFrom: '#831843',
    gradientTo: '#9d174d',
    plannedEndpoints: [
      { method: 'POST', path: '/api/v1/hash-dispersion/disperse', description: 'Build table from modulus + key-value entries' },
      { method: 'POST', path: '/api/v1/hash-dispersion/remove',   description: 'Remove key — returns updated table with adjusted cursor chain' },
      { method: 'POST', path: '/api/v1/hash-dispersion/search',   description: 'Search key — returns traversal path and slot position' },
    ],
  },
  {
    slug: 'hash-functions',
    title: 'Hash Functions',
    titleEs: 'Métodos de Dispersión',
    description: 'Four hash function methods — Division, Mid-Square, Folding, and Transformation — with step-by-step computation breakdowns.',
    detail: 'Hash functions map integer keys to array indices. Division (h(k) = k % prime) is the simplest and most common. Mid-Square squares the key, converts to binary, and extracts the middle bits — those bits have the most entropy from the multiplication. Folding (XOR) splits the binary representation into equal-width chunks and XORs them together. Transformation converts the key to a different base, maps each digit to binary, concatenates, and applies modulo. Each method is visualized with step-by-step breakdowns so students see WHY each approach produces different distributions.',
    category: 'Hash',
    timeComplexity: 'O(1)',
    spaceComplexity: 'O(1)',
    concepts: ['Division method', 'Mid-square', 'Folding (XOR)', 'Base transformation', 'Hash function design'],
    gradientFrom: '#7c2d12',
    gradientTo: '#c2410c',
    plannedEndpoints: [
      { method: 'POST', path: '/api/v1/hash-function/compute', description: 'Compute hash index using a specified method — returns hashIndex + full step-by-step breakdown' },
    ],
  },
  {
    slug: 'hash-table-chaining',
    title: 'Hash Table — Separate Chaining',
    titleEs: 'Matriz de Dispersión',
    description: 'Division-method hashing with linked-list collision handling. Insert, delete, and find entries while watching the bucket chains grow.',
    detail: 'The hash function h(k) = k mod m (prime m) maps each key to a bucket. Collisions are resolved by appending to a singly-linked chain at that bucket. The service is stateless — the full table is included in every request and response, keeping the backend a pure calculation engine. Original Java/Swing application ported to Go + React following DDD and Hexagonal Architecture.',
    category: 'Hash',
    timeComplexity: 'O(1) avg, O(n) worst',
    spaceComplexity: 'O(n)',
    concepts: ['Division-method hashing', 'Separate chaining', 'Load factor', 'Prime modulus', 'Linked lists'],
    gradientFrom: '#082f49',
    gradientTo: '#0c4a6e',
    plannedEndpoints: [
      { method: 'POST', path: '/api/v1/hash-table/insert', description: 'Insert entry → returns updated table + location' },
      { method: 'POST', path: '/api/v1/hash-table/delete', description: 'Delete key → returns updated table + freed location' },
      { method: 'POST', path: '/api/v1/hash-table/find',   description: 'Find key → returns location (table unchanged)' },
    ],
  },
  {
    slug: 'chromatic-graph',
    title: 'Chromatic Number Estimator',
    titleEs: 'Número Cromático',
    description: 'Interactive graph builder + greedy coloring: place vertices, connect edges, then estimate the chromatic number χ(G).',
    detail: 'Greedy graph coloring assigns each vertex the lowest color index not already used by any of its colored neighbors, visiting vertices in BFS order from the selected start. The result is an upper bound on χ(G) — the minimum colors needed so no two adjacent vertices share a color. Implemented as a live interactive tool with 16-color palette ported from the original Java application.',
    category: 'Graphs',
    timeComplexity: 'O(V²)',
    spaceComplexity: 'O(V)',
    concepts: ['Graph coloring', 'Greedy algorithm', 'BFS traversal', 'Adjacency matrix', 'χ(G) upper bound'],
    gradientFrom: '#1e3a8a',
    gradientTo: '#3730a3',
    plannedEndpoints: [
      { method: 'POST', path: '/api/v1/chromatic/estimate', description: 'Run greedy chromatic estimate on submitted graph' },
    ],
  },
  {
    slug: 'topological-sort',
    title: 'Topological Sort',
    titleEs: 'Orden Topológico',
    description: "Kahn's algorithm for dependency ordering on directed acyclic graphs (DAGs) with in-degree visualization.",
    detail: "Topological sort produces a linear ordering of vertices such that for every directed edge u→v, u appears before v — only defined for DAGs. Kahn's algorithm initializes a queue with all zero-in-degree vertices, processes them decrementing neighbors' in-degrees, and enqueues neighbors that reach zero. The layer layout visualization shows vertices at the same dependency depth in the same column, making the parallel execution potential visible. Ported from the legacy Java application, fixing the misleading 'DFSTopologico' name and adding explicit cycle detection.",
    category: 'Graphs',
    timeComplexity: 'O(V + E)',
    spaceComplexity: 'O(V)',
    concepts: ["Kahn's algorithm", 'In-degree', 'DAG', 'Dependency ordering', 'Cycle detection'],
    gradientFrom: '#5b21b6',
    gradientTo: '#7c3aed',
    plannedEndpoints: [
      { method: 'POST', path: '/api/v1/topological-sort/compute', description: "Kahn's sort — returns topological order + per-vertex in-degrees + cycle detection" },
    ],
  },
]

export const CS2_CATEGORY_COLOR: Record<CS2Category, string> = {
  Trees:  '#7c3aed',
  Graphs: '#0f766e',
  Hash:   '#c2410c',
}
