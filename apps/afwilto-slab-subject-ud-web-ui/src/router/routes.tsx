import type { RouteObject } from 'react-router-dom'
import { lazy, Suspense } from 'react'
import { Spinner, ErrorBoundary } from '@afwilto/design-system'
import { SubjectPage } from '@/pages/Subject'

const UniversidadDistritalPage = lazy(() =>
  import('@/pages/UniversidadDistrital').then((m) => ({ default: m.UniversidadDistritalPage }))
)
const ComputerScience1Page = lazy(() =>
  import('@/pages/UniversidadDistrital/subjects').then((m) => ({ default: m.ComputerScience1Page }))
)
const ComputerScience2Page = lazy(() =>
  import('@/pages/UniversidadDistrital/subjects').then((m) => ({ default: m.ComputerScience2Page }))
)
const ComputerScience3Page = lazy(() =>
  import('@/pages/UniversidadDistrital/subjects').then((m) => ({ default: m.ComputerScience3Page }))
)
const CS2ProjectRouterPage = lazy(() =>
  import('@/pages/UniversidadDistrital/subjects').then((m) => ({ default: m.CS2ProjectRouterPage }))
)
const CS3ProjectRouterPage = lazy(() =>
  import('@/pages/UniversidadDistrital/subjects').then((m) => ({ default: m.CS3ProjectRouterPage }))
)
const CriticalPathPage = lazy(() =>
  import('@/pages/UniversidadDistrital/subjects').then((m) => ({ default: m.CriticalPathPage }))
)
const TruthTablePage = lazy(() =>
  import('@/pages/UniversidadDistrital/subjects').then((m) => ({ default: m.TruthTablePage }))
)
const ChromaticGraphPage = lazy(() =>
  import('@/pages/UniversidadDistrital/subjects').then((m) => ({ default: m.ChromaticGraphPage }))
)
const HashTableChainingPage = lazy(() =>
  import('@/pages/UniversidadDistrital/subjects').then((m) => ({ default: m.HashTableChainingPage }))
)
const BTreePage = lazy(() =>
  import('@/pages/UniversidadDistrital/subjects').then((m) => ({ default: m.BTreePage }))
)
const TrieDictionaryPage = lazy(() =>
  import('@/pages/UniversidadDistrital/subjects').then((m) => ({ default: m.TrieDictionaryPage }))
)
const LCRSTransformPage = lazy(() =>
  import('@/pages/UniversidadDistrital/subjects').then((m) => ({ default: m.LCRSTransformPage }))
)
const HuffmanCodingPage = lazy(() =>
  import('@/pages/UniversidadDistrital/subjects').then((m) => ({ default: m.HuffmanCodingPage }))
)
const AVLCursorPage = lazy(() =>
  import('@/pages/UniversidadDistrital/subjects').then((m) => ({ default: m.AVLCursorPage }))
)
const GraphAlgorithmsPage = lazy(() =>
  import('@/pages/UniversidadDistrital/subjects').then((m) => ({ default: m.GraphAlgorithmsPage }))
)
const GraphTraversalsPage = lazy(() =>
  import('@/pages/UniversidadDistrital/subjects').then((m) => ({ default: m.GraphTraversalsPage }))
)
const KruskalPage = lazy(() =>
  import('@/pages/UniversidadDistrital/subjects').then((m) => ({ default: m.KruskalPage }))
)
const HashDispersionPage = lazy(() =>
  import('@/pages/UniversidadDistrital/subjects').then((m) => ({ default: m.HashDispersionPage }))
)
const HashFunctionsPage = lazy(() =>
  import('@/pages/UniversidadDistrital/subjects').then((m) => ({ default: m.HashFunctionsPage }))
)
const TopologicalSortPage = lazy(() =>
  import('@/pages/UniversidadDistrital/subjects').then((m) => ({ default: m.TopologicalSortPage }))
)
const NetworkCommunications2Page = lazy(() =>
  import('@/pages/UniversidadDistrital/subjects').then((m) => ({ default: m.NetworkCommunications2Page }))
)
const NetworkComm1Page = lazy(() =>
  import('@/pages/UniversidadDistrital/subjects').then((m) => ({ default: m.NetworkComm1Page }))
)
const NetworkComm3Page = lazy(() =>
  import('@/pages/UniversidadDistrital/subjects').then((m) => ({ default: m.NetworkComm3Page }))
)
const OperationsResearch1Page = lazy(() =>
  import('@/pages/UniversidadDistrital/subjects').then((m) => ({ default: m.OperationsResearch1Page }))
)
const OR1ProjectRouterPage = lazy(() =>
  import('@/pages/UniversidadDistrital/subjects').then((m) => ({ default: m.OR1ProjectRouterPage }))
)
const GraphicalMethodPage = lazy(() =>
  import('@/pages/UniversidadDistrital/subjects/or1/graphical-method/GraphicalMethodPage').then((m) => ({ default: m.GraphicalMethodPage }))
)
const MixedIntegerPage = lazy(() =>
  import('@/pages/UniversidadDistrital/subjects/or1/mixed-integer/MixedIntegerPage').then((m) => ({ default: m.MixedIntegerPage }))
)
const PhysicsLabPage = lazy(() =>
  import('@/pages/UniversidadDistrital/subjects').then((m) => ({ default: m.PhysicsLabPage }))
)
const DatabasesIIPage = lazy(() =>
  import('@/pages/UniversidadDistrital/subjects').then((m) => ({ default: m.DatabasesIIPage }))
)
const OperativeSystemsPage = lazy(() =>
  import('@/pages/UniversidadDistrital/subjects').then((m) => ({ default: m.OperativeSystemsPage }))
)
const RoundRobinPage = lazy(() =>
  import('@/pages/UniversidadDistrital/subjects').then((m) => ({ default: m.RoundRobinPage }))
)
const OSProjectRouterPage = lazy(() =>
  import('@/pages/UniversidadDistrital/subjects').then((m) => ({ default: m.OSProjectRouterPage }))
)
const MLFQPage = lazy(() =>
  import('@/pages/UniversidadDistrital/subjects').then((m) => ({ default: m.MLFQPage }))
)
const ArtificialIntelligencePage = lazy(() =>
  import('@/pages/UniversidadDistrital/subjects').then((m) => ({ default: m.ArtificialIntelligencePage }))
)
const AIProjectRouterPage = lazy(() =>
  import('@/pages/UniversidadDistrital/subjects').then((m) => ({ default: m.AIProjectRouterPage }))
)
const AStarPage = lazy(() =>
  import('@/pages/UniversidadDistrital/subjects').then((m) => ({ default: m.AStarPage }))
)
const DFSPage = lazy(() =>
  import('@/pages/UniversidadDistrital/subjects').then((m) => ({ default: m.DFSPage }))
)
const ProgrammingModels2Page = lazy(() =>
  import('@/pages/UniversidadDistrital/subjects').then((m) => ({ default: m.ProgrammingModels2Page }))
)
const PM2ProjectRouterPage = lazy(() =>
  import('@/pages/UniversidadDistrital/subjects').then((m) => ({ default: m.PM2ProjectRouterPage }))
)
const ProgrammingOOPage = lazy(() =>
  import('@/pages/UniversidadDistrital/subjects').then((m) => ({ default: m.ProgrammingOOPage }))
)
const OOProjectRouterPage = lazy(() =>
  import('@/pages/UniversidadDistrital/subjects').then((m) => ({ default: m.OOProjectRouterPage }))
)
const BasicProgrammingPage = lazy(() =>
  import('@/pages/UniversidadDistrital/subjects').then((m) => ({ default: m.BasicProgrammingPage }))
)
const BPProjectRouterPage = lazy(() =>
  import('@/pages/UniversidadDistrital/subjects').then((m) => ({ default: m.BPProjectRouterPage }))
)
const NotFoundPage = lazy(() =>
  import('@/pages/NotFound').then((m) => ({ default: m.NotFoundPage }))
)

function Fallback() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-surface-base">
      <Spinner size="lg" />
    </div>
  )
}

function withSuspense(Component: React.ComponentType) {
  return (
    <ErrorBoundary>
      <Suspense fallback={<Fallback />}>
        <Component />
      </Suspense>
    </ErrorBoundary>
  )
}

export const routes: RouteObject[] = [

  { path: '',                       element: withSuspense(UniversidadDistritalPage) },
  { path: 'basic-programming',                            element: withSuspense(BasicProgrammingPage) },
  { path: 'basic-programming/:projectSlug',               element: withSuspense(BPProjectRouterPage) },
  { path: 'programming-models-2',                        element: withSuspense(ProgrammingModels2Page) },
  { path: 'programming-models-2/:projectSlug',           element: withSuspense(PM2ProjectRouterPage) },
  { path: 'object-oriented-programming',                  element: withSuspense(ProgrammingOOPage) },
  { path: 'object-oriented-programming/:projectSlug',    element: withSuspense(OOProjectRouterPage) },
  { path: 'artificial-intelligence-1',                   element: withSuspense(ArtificialIntelligencePage) },
  { path: 'artificial-intelligence-1/a-star',           element: withSuspense(AStarPage) },
  { path: 'artificial-intelligence-1/depth-first-search', element: withSuspense(DFSPage) },
  { path: 'artificial-intelligence-1/:projectSlug',     element: withSuspense(AIProjectRouterPage) },
  { path: 'operative-systems',                          element: withSuspense(OperativeSystemsPage) },
  { path: 'operative-systems/mlfq-scheduler',           element: withSuspense(MLFQPage) },
  { path: 'operative-systems/round-robin',              element: withSuspense(RoundRobinPage) },
  { path: 'operative-systems/:projectSlug',             element: withSuspense(OSProjectRouterPage) },
  { path: 'databases-ii',                               element: withSuspense(DatabasesIIPage) },
  { path: 'network-communication-1',                    element: withSuspense(NetworkComm1Page) },
  { path: 'operations-research-1',                      element: withSuspense(OperationsResearch1Page) },
  { path: 'operations-research-1/graphical-method',     element: withSuspense(GraphicalMethodPage) },
  { path: 'operations-research-1/mixed-integer',        element: withSuspense(MixedIntegerPage) },
  { path: 'operations-research-1/:projectSlug',         element: withSuspense(OR1ProjectRouterPage) },
  { path: 'network-communication-2',                    element: withSuspense(NetworkCommunications2Page) },
  { path: 'network-communication-3',                    element: withSuspense(NetworkComm3Page) },
  { path: 'physics-lab',                               element: withSuspense(PhysicsLabPage) },
  { path: 'computer-science-1',                       element: withSuspense(ComputerScience1Page) },
  { path: 'computer-science-2',                       element: withSuspense(ComputerScience2Page) },
  { path: 'computer-science-3',                       element: withSuspense(ComputerScience3Page) },
  { path: 'computer-science-3/critical-path',          element: withSuspense(CriticalPathPage) },
  { path: 'computer-science-3/truth-table',             element: withSuspense(TruthTablePage) },
  { path: 'computer-science-3/:projectSlug',            element: withSuspense(CS3ProjectRouterPage) },
  { path: 'computer-science-2/b-tree',                 element: withSuspense(BTreePage) },
  { path: 'computer-science-2/trie-dictionary',        element: withSuspense(TrieDictionaryPage) },
  { path: 'computer-science-2/lcrs-transform',         element: withSuspense(LCRSTransformPage) },
  { path: 'computer-science-2/huffman-coding',         element: withSuspense(HuffmanCodingPage) },
  { path: 'computer-science-2/avl-cursor',             element: withSuspense(AVLCursorPage) },
  { path: 'computer-science-2/chromatic-graph',        element: withSuspense(ChromaticGraphPage) },
  { path: 'computer-science-2/graph-algorithms',       element: withSuspense(GraphAlgorithmsPage) },
  { path: 'computer-science-2/graph-traversals',       element: withSuspense(GraphTraversalsPage) },
  { path: 'computer-science-2/kruskal',                element: withSuspense(KruskalPage) },
  { path: 'computer-science-2/hash-dispersion',        element: withSuspense(HashDispersionPage) },
  { path: 'computer-science-2/hash-functions',         element: withSuspense(HashFunctionsPage) },
  { path: 'computer-science-2/topological-sort',       element: withSuspense(TopologicalSortPage) },
  { path: 'computer-science-2/hash-table-chaining',   element: withSuspense(HashTableChainingPage) },
  { path: 'computer-science-2/:projectSlug',          element: withSuspense(CS2ProjectRouterPage) },
  { path: ':subjectSlug',                             element: <SubjectPage university="distrital" /> },


  { path: '*', element: withSuspense(NotFoundPage) },
]
