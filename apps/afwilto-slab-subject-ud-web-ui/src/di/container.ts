import type { IHttpClient } from '@/application/ports'
import type { IRBTService } from '@/application/ports/IRBTService'
import type { IChromaticGraphService } from '@/application/ports/IChromaticGraphService'
import type { IHashTableService } from '@/application/ports/IHashTableService'
import type { IBTreeService } from '@/application/ports/IBTreeService'
import type { ITrieService } from '@/application/ports/ITrieService'
import type { ILCRSService } from '@/application/ports/ILCRSService'
import type { IHuffmanService } from '@/application/ports/IHuffmanService'
import type { ITheaterService } from '@/application/ports/ITheaterService'
import type { IAVLCursorService } from '@/application/ports/IAVLCursorService'
import type { IEncodingService } from '@/application/ports/IEncodingService'
import type { IPhysicsLabService } from '@/application/ports/IPhysicsLabService'
import type { ICriticalPathService } from '@/application/ports/ICriticalPathService'
import type { ITruthTableService } from '@/application/ports/ITruthTableService'
import type { IGraphAlgoService } from '@/application/ports/IGraphAlgoService'
import type { IGraphTraversalService } from '@/application/ports/IGraphTraversalService'
import type { IHashDispersionService } from '@/application/ports/IHashDispersionService'
import type { IHashFunctionService } from '@/application/ports/IHashFunctionService'
import type { ITopologicalSortService } from '@/application/ports/ITopologicalSortService'
import type { IWeatherStationService } from '@/application/ports/IWeatherStationService'
import type { IGraphicalMethodService } from '@/application/ports/IGraphicalMethodService'
import type { IMixedIntegerService } from '@/application/ports/IMixedIntegerService'
import type { IMailClientService } from '@/application/ports/IMailClientService'
import type { IRoundRobinService } from '@/application/ports/IRoundRobinService'
import type { IMLFQService } from '@/application/ports/IMLFQService'
import type { IAStarService } from '@/application/ports/IAStarService'
import type { IDFSService } from '@/application/ports/IDFSService'
import type { IChessService } from '@/application/ports/IChessService'
import type { IScrabbleService } from '@/application/ports/IScrabbleService'
import type { ITicTacToeService } from '@/application/ports/ITicTacToeService'
import { FetchHttpClient } from '@/infrastructure/adapters'
import { RBTHttpAdapter } from '@/infrastructure/adapters/rbt'
import { ChromaticGraphHttpAdapter } from '@/infrastructure/adapters/chromatic'
import { HashTableHttpAdapter } from '@/infrastructure/adapters/hashtable'
import { BTreeHttpAdapter } from '@/infrastructure/adapters/btree'
import { TrieHttpAdapter } from '@/infrastructure/adapters/trie'
import { LCRSHttpAdapter } from '@/infrastructure/adapters/lcrs'
import { HuffmanHttpAdapter } from '@/infrastructure/adapters/huffman'
import { TheaterHttpAdapter } from '@/infrastructure/adapters/theater'
import { AVLCursorHttpAdapter } from '@/infrastructure/adapters/avlcursor'
import { EncodingHttpAdapter } from '@/infrastructure/adapters/encoding'
import { PhysicsLabHttpAdapter } from '@/infrastructure/adapters/physics'
import { CriticalPathHttpAdapter } from '@/infrastructure/adapters/criticalpath'
import { TruthTableHttpAdapter } from '@/infrastructure/adapters/truthtable'
import { GraphAlgoHttpAdapter } from '@/infrastructure/adapters/graphalgo'
import { GraphTraversalHttpAdapter } from '@/infrastructure/adapters/graphtraversal'
import { HashDispersionHttpAdapter } from '@/infrastructure/adapters/hashdispersion'
import { HashFunctionHttpAdapter } from '@/infrastructure/adapters/hashfunction'
import { TopologicalSortHttpAdapter } from '@/infrastructure/adapters/toposort'
import { WeatherStationHttpAdapter } from '@/infrastructure/adapters/weatherstation'
import { GraphicalMethodHttpAdapter } from '@/infrastructure/adapters/graphicalmethod'
import { MixedIntegerHttpAdapter } from '@/infrastructure/adapters/mixedinteger'
import { MailClientHttpAdapter } from '@/infrastructure/adapters/mailclient'
import { RoundRobinHttpAdapter } from '@/infrastructure/adapters/roundrobin'
import { MLFQHttpAdapter } from '@/infrastructure/adapters/mlfq'
import { AStarHttpAdapter } from '@/infrastructure/adapters/astar'
import { DFSHttpAdapter } from '@/infrastructure/adapters/dfs'
import { ChessHttpAdapter } from '@/infrastructure/adapters/chess'
import { ScrabbleHttpAdapter } from '@/infrastructure/adapters/scrabble'
import { TicTacToeHttpAdapter } from '@/infrastructure/adapters/tictactoe'

const MAIN_API_URL       = import.meta.env.VITE_API_BASE_URL         ?? 'http://localhost:8080'
const CS_MNGR_URL        = import.meta.env.VITE_CS_MNGR_URL           ?? 'http://localhost:8081'
const THEATER_URL        = import.meta.env.VITE_THEATER_MNGR_URL      ?? 'http://localhost:8085'
const ENCODING_URL       = import.meta.env.VITE_ENCODING_MNGR_URL     ?? 'http://localhost:8086'
const PHYSICS_URL        = import.meta.env.VITE_PHYSICS_MNGR_URL      ?? 'http://localhost:8087'
const NETWORK_COMM_URL   = import.meta.env.VITE_NETWORK_COMM_MNGR_URL     ?? 'http://localhost:8086'
const OR_MNGR_URL        = import.meta.env.VITE_OPERATIONS_RESEARCH_MNGR_URL ?? 'http://localhost:8088'
const OS_MNGR_URL        = import.meta.env.VITE_OPERATIVE_SYSTEM_MNGR_URL    ?? 'http://localhost:8089'
const AI_MNGR_URL        = import.meta.env.VITE_AI_MNGR_URL                  ?? 'http://localhost:8090'
const PROGRAMMING_MNGR_URL = import.meta.env.VITE_PROGRAMMING_MNGR_URL       ?? 'http://localhost:8091'

export interface ServiceContainer {
  httpClient:             IHttpClient
  rbtService:             IRBTService
  weatherStationService:  IWeatherStationService
  graphicalMethodService: IGraphicalMethodService
  mixedIntegerService:    IMixedIntegerService
  mailClientService:      IMailClientService
  chromaticGraphService: IChromaticGraphService
  hashTableService:      IHashTableService
  bTreeService:          IBTreeService
  trieService:           ITrieService
  lcrsService:           ILCRSService
  huffmanService:        IHuffmanService
  theaterService:        ITheaterService
  avlCursorService:      IAVLCursorService
  encodingService:       IEncodingService
  physicsLabService:     IPhysicsLabService
  criticalPathService:   ICriticalPathService
  truthTableService:     ITruthTableService
  graphAlgoService:      IGraphAlgoService
  graphTraversalService:  IGraphTraversalService
  hashDispersionService:  IHashDispersionService
  hashFunctionService:      IHashFunctionService
  topologicalSortService:   ITopologicalSortService
  roundRobinService:        IRoundRobinService
  mlfqService:              IMLFQService
  astarService:             IAStarService
  dfsService:               IDFSService
  chessService:             IChessService
  scrabbleService:          IScrabbleService
  ticTacToeService:         ITicTacToeService
}

const mainHttp    = new FetchHttpClient(MAIN_API_URL)
const csMngrHttp  = new FetchHttpClient(CS_MNGR_URL)
const theaterHttp = new FetchHttpClient(THEATER_URL)

const networkCommHttp = new FetchHttpClient(NETWORK_COMM_URL)
const orHttp          = new FetchHttpClient(OR_MNGR_URL)

export const container: ServiceContainer = {
  httpClient:             mainHttp,
  weatherStationService:  new WeatherStationHttpAdapter(networkCommHttp),
  graphicalMethodService: new GraphicalMethodHttpAdapter(orHttp),
  mixedIntegerService:    new MixedIntegerHttpAdapter(orHttp),
  mailClientService:      new MailClientHttpAdapter(networkCommHttp),
  rbtService:            new RBTHttpAdapter(csMngrHttp),
  chromaticGraphService: new ChromaticGraphHttpAdapter(csMngrHttp),
  hashTableService:      new HashTableHttpAdapter(csMngrHttp),
  bTreeService:          new BTreeHttpAdapter(csMngrHttp),
  trieService:           new TrieHttpAdapter(csMngrHttp),
  lcrsService:           new LCRSHttpAdapter(csMngrHttp),
  huffmanService:        new HuffmanHttpAdapter(csMngrHttp),
  theaterService:        new TheaterHttpAdapter(theaterHttp, THEATER_URL),
  avlCursorService:      new AVLCursorHttpAdapter(csMngrHttp),
  encodingService:       new EncodingHttpAdapter(new FetchHttpClient(ENCODING_URL)),
  physicsLabService:     new PhysicsLabHttpAdapter(new FetchHttpClient(PHYSICS_URL)),
  criticalPathService:   new CriticalPathHttpAdapter(csMngrHttp),
  truthTableService:     new TruthTableHttpAdapter(csMngrHttp),
  graphAlgoService:      new GraphAlgoHttpAdapter(csMngrHttp),
  graphTraversalService:  new GraphTraversalHttpAdapter(csMngrHttp),
  hashDispersionService:  new HashDispersionHttpAdapter(csMngrHttp),
  hashFunctionService:      new HashFunctionHttpAdapter(csMngrHttp),
  topologicalSortService:   new TopologicalSortHttpAdapter(csMngrHttp),
  roundRobinService:        new RoundRobinHttpAdapter(new FetchHttpClient(OS_MNGR_URL)),
  mlfqService:              new MLFQHttpAdapter(new FetchHttpClient(OS_MNGR_URL)),
  astarService:             new AStarHttpAdapter(new FetchHttpClient(AI_MNGR_URL)),
  dfsService:               new DFSHttpAdapter(new FetchHttpClient(AI_MNGR_URL)),
  chessService:             new ChessHttpAdapter(new FetchHttpClient(PROGRAMMING_MNGR_URL)),
  scrabbleService:          new ScrabbleHttpAdapter(new FetchHttpClient(PROGRAMMING_MNGR_URL)),
  ticTacToeService:         new TicTacToeHttpAdapter(new FetchHttpClient(PROGRAMMING_MNGR_URL)),
}
