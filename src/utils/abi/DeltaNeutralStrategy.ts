export const DeltaNeutralStrategy = [
  {
    inputs: [
      {
        components: [
          {
            internalType: "address",
            name: "stable",
            type: "address",
          },
          {
            internalType: "address",
            name: "volatile",
            type: "address",
          },
          {
            internalType: "address",
            name: "stableOracle",
            type: "address",
          },
          {
            internalType: "address",
            name: "volatileOracle",
            type: "address",
          },
          {
            internalType: "uint8[2]",
            name: "decimals",
            type: "uint8[2]",
          },
          {
            internalType: "string",
            name: "symbols",
            type: "string",
          },
        ],
        internalType: "struct TokensInfo",
        name: "tokensInfo",
        type: "tuple",
      },
      {
        components: [
          {
            internalType: "address",
            name: "multipool",
            type: "address",
          },
          {
            internalType: "address",
            name: "dispatcher",
            type: "address",
          },
          {
            internalType: "uint256",
            name: "dispatcherId",
            type: "uint256",
          },
        ],
        internalType: "struct WagmiInfo",
        name: "wagmiInfo",
        type: "tuple",
      },
      {
        components: [
          {
            internalType: "address",
            name: "collateral",
            type: "address",
          },
          {
            internalType: "address",
            name: "borrow",
            type: "address",
          },
        ],
        internalType: "struct SiloInfo",
        name: "siloInfo",
        type: "tuple",
      },
      {
        internalType: "address",
        name: "_algebraV3Router",
        type: "address",
      },
      {
        internalType: "address",
        name: "_balancerVault",
        type: "address",
      },
      {
        internalType: "address",
        name: "_multisig",
        type: "address",
      },
      {
        internalType: "address",
        name: "_protocolFeesVault",
        type: "address",
      },
      {
        internalType: "contract IStrategyToken",
        name: "_strategyToken",
        type: "address",
      },
    ],
    stateMutability: "nonpayable",
    type: "constructor",
  },
  {
    inputs: [],
    name: "EnforcedPause",
    type: "error",
  },
  {
    inputs: [],
    name: "ExpectedPause",
    type: "error",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "owner",
        type: "address",
      },
    ],
    name: "OwnableInvalidOwner",
    type: "error",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "account",
        type: "address",
      },
    ],
    name: "OwnableUnauthorizedAccount",
    type: "error",
  },
  {
    inputs: [],
    name: "ReentrancyGuardReentrantCall",
    type: "error",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "token",
        type: "address",
      },
    ],
    name: "SafeERC20FailedOperation",
    type: "error",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "user",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "shares",
        type: "uint256",
      },
    ],
    name: "Deposited",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "uint256",
        name: "totalValueLockedInStableBefore",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "totalValueLockedInStableAfter",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "currentStableBalance",
        type: "uint256",
      },
    ],
    name: "EmergencyDeposit",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "uint256",
        name: "beforeWagmiStableAmount",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "beforeWagmiVolatileAmount",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "beforeSiloPositionCollateral",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "beforeSiloPositionBorrowed",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "afterWagmiStableAmount",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "afterWagmiVolatileAmount",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "afterSiloPositionCollateral",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "afterSiloPositionBorrowed",
        type: "uint256",
      },
    ],
    name: "EmergencyRebalanceAllExecuted",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "uint256",
        name: "totalValueLockedInStableBefore",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "totalValueLockedInStableAfter",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "currentStableBalance",
        type: "uint256",
      },
    ],
    name: "EmergencyWithdraw",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "uint256",
        name: "usersFee",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "protocolFee",
        type: "uint256",
      },
    ],
    name: "FeesClaimed",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "address",
        name: "protocolAddress",
        type: "address",
      },
      {
        indexed: false,
        internalType: "address",
        name: "token",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "fee",
        type: "uint256",
      },
    ],
    name: "FlashLoanExecuted",
    type: "event",
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
        internalType: "enum IDeltaNeutralStrategy.MANAGING_OPERATIONS",
        name: "operationId",
        type: "uint8",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "operationValue",
        type: "uint256",
      },
    ],
    name: "ParamChanged",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "address",
        name: "account",
        type: "address",
      },
    ],
    name: "Paused",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "uint256",
        name: "wagmiMultipoolStableAmount",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "wagmiMultipoolVolatileAmount",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "wagmiDispatcherLpAmount",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "siloCollateralStableAmount",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "siloBorrowStableAmount",
        type: "uint256",
      },
    ],
    name: "ProtocolsDeposit",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "uint256",
        name: "wagmiMultipoolStableAmount",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "wagmiMultipoolVolatileAmount",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "wagmiDispatcherLpAmount",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "siloCollateralStableAmount",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "siloBorrowStableAmount",
        type: "uint256",
      },
    ],
    name: "ProtocolsWithdraw",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "uint256",
        name: "afterTvl",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "afterWagmiStableAmount",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "afterWagmiVolatileAmount",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "afterSiloPositionCollateral",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "afterSiloPositionBorrowed",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "afterStableBalance",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "afterVolatileBalance",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "stablePrice",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "volatilePrice",
        type: "uint256",
      },
    ],
    name: "RebalanceDataAfterExecution",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "uint256",
        name: "beforeTvl",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "beforeWagmiStableAmount",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "beforeWagmiVolatileAmount",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "beforeSiloPositionCollateral",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "beforeSiloPositionBorrowed",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "beforeStableBalance",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "beforeVolatileBalance",
        type: "uint256",
      },
    ],
    name: "RebalanceDataBeforeExecution",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "uint256",
        name: "amountOfStableAsCollateralDeposited",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "amountOfVolatileBorrowed",
        type: "uint256",
      },
    ],
    name: "RebalanceDownExecuted",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "uint256",
        name: "amountOfStableAsCollateralWithdrawn",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "amountOfVolatileRepayed",
        type: "uint256",
      },
    ],
    name: "RebalanceUpExecuted",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "address",
        name: "account",
        type: "address",
      },
    ],
    name: "Unpaused",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "user",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "shares",
        type: "uint256",
      },
    ],
    name: "Withdrawn",
    type: "event",
  },
  {
    inputs: [],
    name: "DEVIATION_BP",
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
    name: "MINIMUM_DEPOSIT",
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
    name: "PROTOCOL_FEE",
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
    name: "REBALANCE_THRESHOLD",
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
    name: "SILO_SAFE_LTV",
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
    name: "STABLE_ORACLE_ANSWER_AGE",
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
    name: "SWAP_SLIPPAGE",
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
    name: "VOLATILE_ORACLE_ANSWER_AGE",
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
    name: "algebraV3Router",
    outputs: [
      {
        internalType: "contract IAlgebraV3SwapRouter",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "balancerVault",
    outputs: [
      {
        internalType: "contract IBalancerVault",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "claimProtocolFees",
    outputs: [
      {
        internalType: "uint256",
        name: "protocolFees",
        type: "uint256",
      },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "closeAllPositions",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "recipient",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "stableAmount",
        type: "uint256",
      },
    ],
    name: "deposit",
    outputs: [
      {
        internalType: "uint256",
        name: "lpAmount",
        type: "uint256",
      },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "contract IERC20",
        name: "token",
        type: "address",
      },
    ],
    name: "getBalance",
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
    name: "getSiloBorrowed",
    outputs: [
      {
        internalType: "uint256",
        name: "borrowedVolatile",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "getSiloCollateral",
    outputs: [
      {
        internalType: "uint256",
        name: "collateralStable",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
    ],
    name: "getStableInUsd",
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
    name: "getStablePrice",
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
    name: "getTotalValueLockedInStable",
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
    inputs: [
      {
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
    ],
    name: "getVolatileInUsd",
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
    name: "getVolatilePrice",
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
    name: "getWagmiPosition",
    outputs: [
      {
        internalType: "uint256",
        name: "estimatedCurrentWagmiStableAmount",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "estimatedCurrentWagmiVolatileAmount",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "isStableToken0",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
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
    name: "paused",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "protocolFeesVault",
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
    name: "rebalance",
    outputs: [
      {
        internalType: "bool",
        name: "isRebalanceNecessary",
        type: "bool",
      },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "rebalanceAll",
    outputs: [],
    stateMutability: "nonpayable",
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
    inputs: [],
    name: "reopenAllPositions",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "enum IDeltaNeutralStrategy.MANAGING_OPERATIONS",
        name: "operationId",
        type: "uint8",
      },
      {
        internalType: "uint256",
        name: "operationValue",
        type: "uint256",
      },
    ],
    name: "setParam",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "siloBorrowManager",
    outputs: [
      {
        internalType: "contract ISilo",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "siloCollateralManager",
    outputs: [
      {
        internalType: "contract ISilo",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "stable",
    outputs: [
      {
        internalType: "contract IERC20",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "stableDecimals",
    outputs: [
      {
        internalType: "uint8",
        name: "",
        type: "uint8",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "stableOracle",
    outputs: [
      {
        internalType: "contract IOracle",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "strategyToken",
    outputs: [
      {
        internalType: "contract IStrategyToken",
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
  {
    inputs: [],
    name: "volatile",
    outputs: [
      {
        internalType: "contract IERC20",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "volatileDecimals",
    outputs: [
      {
        internalType: "uint8",
        name: "",
        type: "uint8",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "volatileOracle",
    outputs: [
      {
        internalType: "contract IOracle",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "wagmiDispatcher",
    outputs: [
      {
        internalType: "contract IWagmiDispatcher",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "wagmiDispatcherPoolId",
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
    name: "wagmiMultipool",
    outputs: [
      {
        internalType: "contract IWagmiMultipool",
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
        name: "recipient",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "lpAmount",
        type: "uint256",
      },
    ],
    name: "withdraw",
    outputs: [
      {
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },
] as const;
