import { configure } from '@testing-library/react'

// Async queries wait up to 5 s: the first render of a lazy page, or a loaded machine, exceeds the 1 s default.
configure({ asyncUtilTimeout: 5000 })
