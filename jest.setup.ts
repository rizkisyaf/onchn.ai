import '@testing-library/jest-dom'

// Mock next/router
jest.mock('next/router', () => ({
  useRouter: () => ({
    route: '/',
    pathname: '',
    query: {},
    asPath: '',
    push: jest.fn(),
    replace: jest.fn(),
  }),
}))

// Mock environment variables
process.env = {
  ...process.env,
  NEXT_PUBLIC_APP_URL: 'http://localhost:3000',
  SOLANATRACKER_API_KEY: 'e4f3d212-9642-4f5d-b5c1-416ffdcbc29f',
  SOLANATRACKER_API_URL: 'https://data.solanatracker.io',
}

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
})

// Mock IntersectionObserver
const mockIntersectionObserver = jest.fn()
mockIntersectionObserver.mockReturnValue({
  observe: () => null,
  unobserve: () => null,
  disconnect: () => null,
})
window.IntersectionObserver = mockIntersectionObserver

// Mock ResizeObserver
const mockResizeObserver = jest.fn()
mockResizeObserver.mockReturnValue({
  observe: () => null,
  unobserve: () => null,
  disconnect: () => null,
})
window.ResizeObserver = mockResizeObserver

// Mock @solana/web3.js
jest.mock('@solana/web3.js', () => ({
  Connection: jest.fn().mockImplementation(() => ({
    getAccountInfo: jest.fn().mockResolvedValue(null),
    getBalance: jest.fn().mockResolvedValue(0),
    getRecentBlockhash: jest.fn().mockResolvedValue({
      blockhash: '11111111111111111111111111111111',
      feeCalculator: { lamportsPerSignature: 5000 },
    }),
    sendTransaction: jest.fn().mockResolvedValue('tx-signature'),
    confirmTransaction: jest.fn().mockResolvedValue({ value: { err: null } }),
  })),
  PublicKey: jest.fn().mockImplementation(key => ({
    toString: () => key,
    toBase58: () => key,
  })),
  Transaction: {
    from: jest.fn().mockReturnValue({}),
    populate: jest.fn().mockReturnValue({}),
  },
  SystemProgram: {
    transfer: jest.fn().mockReturnValue({}),
  },
  LAMPORTS_PER_SOL: 1000000000,
}))

// Mock @jup-ag/api
jest.mock('@jup-ag/api', () => ({
  QuoteResponse: jest.fn().mockImplementation(data => data),
  SwapResponse: jest.fn().mockImplementation(data => data),
}))

// Mock @tensorflow/tfjs
jest.mock('@tensorflow/tfjs', () => ({
  setBackend: jest.fn(),
  sequential: jest.fn().mockReturnValue({
    add: jest.fn(),
    compile: jest.fn(),
    predict: jest.fn().mockReturnValue({
      data: jest.fn().mockResolvedValue(new Float32Array([0.1, 0.2, 0.7])),
      dispose: jest.fn(),
    }),
    fit: jest.fn().mockImplementation(async () => {
      return { history: { loss: [0.1] } }
    }),
    getWeights: jest.fn().mockReturnValue([]),
    setWeights: jest.fn(),
    save: jest.fn().mockResolvedValue({}),
    loadLayersModel: jest.fn().mockResolvedValue({}),
  }),
  layers: {
    dense: jest.fn().mockReturnValue({}),
    dropout: jest.fn().mockReturnValue({}),
  },
  train: {
    adam: jest.fn().mockReturnValue({}),
  },
  tensor2d: jest.fn().mockReturnValue({
    dispose: jest.fn(),
  }),
  tensor1d: jest.fn().mockReturnValue({
    dispose: jest.fn(),
  }),
  softmax: jest.fn().mockReturnValue({
    data: jest.fn().mockResolvedValue(new Float32Array([0.1, 0.2, 0.7])),
    dispose: jest.fn(),
  }),
  loadLayersModel: jest.fn().mockResolvedValue({
    predict: jest.fn().mockReturnValue({
      data: jest.fn().mockResolvedValue(new Float32Array([0.1, 0.2, 0.7])),
      dispose: jest.fn(),
    }),
  }),
})) 