export const WagmiStrategyMultipool = [
  {
    inputs: [
      {
        internalType: "address",
        name: "_token0",
        type: "address",
      },
      {
        internalType: "address",
        name: "_token1",
        type: "address",
      },
      {
        internalType: "address",
        name: "_multisig",
        type: "address",
      },
    ],
    stateMutability: "nonpayable",
    type: "constructor",
  },
  {
    inputs: [
      {
        internalType: "uint24",
        name: "fee",
        type: "uint24",
      },
    ],
    name: "InvalidFee",
    type: "error",
  },
  {
    inputs: [
      {
        internalType: "enum ErrLib.ErrorCode",
        name: "code",
        type: "uint8",
      },
    ],
    name: "RevertErrorCode",
    type: "error",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "previousOwner",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "newOwner",
        type: "address",
      },
    ],
    name: "OwnershipTransferred",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "address",
        name: "multipool",
        type: "address",
      },
    ],
    name: "SetMultipool",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        components: [
          {
            internalType: "int24",
            name: "tickSpacingOffset",
            type: "int24",
          },
          {
            internalType: "int24",
            name: "positionRange",
            type: "int24",
          },
          {
            internalType: "uint24",
            name: "poolFeeAmt",
            type: "uint24",
          },
          {
            internalType: "uint256",
            name: "weight",
            type: "uint256",
          },
        ],
        indexed: false,
        internalType: "struct IMultiStrategy.Strategy[]",
        name: "strategy",
        type: "tuple[]",
      },
    ],
    name: "SetNewStrategy",
    type: "event",
  },
  {
    inputs: [],
    name: "MAX_STRATEGIES_NUM",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "getPositionsFromStrategy",
    outputs: [
      {
        components: [
          {
            internalType: "int24",
            name: "tick",
            type: "int24",
          },
          {
            internalType: "uint160",
            name: "currentSqrtRatioX96",
            type: "uint160",
          },
        ],
        internalType: "struct Slot0Data[]",
        name: "slots",
        type: "tuple[]",
      },
      {
        components: [
          {
            internalType: "int24",
            name: "lowerTick",
            type: "int24",
          },
          {
            internalType: "int24",
            name: "upperTick",
            type: "int24",
          },
          {
            internalType: "uint24",
            name: "poolFeeAmt",
            type: "uint24",
          },
          {
            internalType: "uint256",
            name: "weight",
            type: "uint256",
          },
          {
            internalType: "address",
            name: "poolAddress",
            type: "address",
          },
          {
            internalType: "bytes32",
            name: "positionKey",
            type: "bytes32",
          },
        ],
        internalType: "struct PositionInfo[]",
        name: "positions",
        type: "tuple[]",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "index",
        type: "uint256",
      },
    ],
    name: "getStrategyAt",
    outputs: [
      {
        components: [
          {
            internalType: "int24",
            name: "tickSpacingOffset",
            type: "int24",
          },
          {
            internalType: "int24",
            name: "positionRange",
            type: "int24",
          },
          {
            internalType: "uint24",
            name: "poolFeeAmt",
            type: "uint24",
          },
          {
            internalType: "uint256",
            name: "weight",
            type: "uint256",
          },
        ],
        internalType: "struct IMultiStrategy.Strategy",
        name: "",
        type: "tuple",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "multiFactory",
    outputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "multipool",
    outputs: [
      {
        internalType: "contract IMultipool",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "owner",
    outputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "renounceOwnership",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "_multipool",
        type: "address",
      },
    ],
    name: "setMultipool",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        components: [
          {
            internalType: "int24",
            name: "tickSpacingOffset",
            type: "int24",
          },
          {
            internalType: "int24",
            name: "positionRange",
            type: "int24",
          },
          {
            internalType: "uint24",
            name: "poolFeeAmt",
            type: "uint24",
          },
          {
            internalType: "uint256",
            name: "weight",
            type: "uint256",
          },
        ],
        internalType: "struct IMultiStrategy.Strategy[]",
        name: "_currentStrategy",
        type: "tuple[]",
      },
    ],
    name: "setStrategy",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "strategySize",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "token0",
    outputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "token1",
    outputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "newOwner",
        type: "address",
      },
    ],
    name: "transferOwnership",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
];
