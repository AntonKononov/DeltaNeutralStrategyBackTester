import fs from "fs";

import { historicalData as wagmiBlockHistoricalData } from "./data/initialData/WagmiInfo";
import { historicalData as wagmiBlockStrategyInfo } from "./data/initialData/StrategyInfo";
// import { historicalData as wagmiBlockStrategyInfoLongPart1 } from "./data/initialData/StrategyInfo1Part";
// import { historicalData as wagmiBlockStrategyInfoLongPart2 } from "./data/initialData/StrategyInfo2Part";
// import { historicalData as wagmiBlockStrategyInfoLongPart3 } from "./data/initialData/StrategyInfo3Part";

interface TvlData {
  timestamp: number;
  tvl: number;
  wagmiPositionStable: number;
  wagmiPositionVolatile: number;
  siloPositionCollateral: number;
  siloPositionBorrowed: number;
  stableBalance: number;
  volatileBalance: number;
  stablePrice: number;
  volatilePrice: number;
  shortAvgPrice: number;
  isRebalanceExecuted: boolean;
}

const MAX_BP = 100;
const INITIAL_POSITION_AMOUNT = 100;
const SILO_SAFE_LTV = 50;
const PROTOCOL_FEES = 20;
const SECONDS_IN_A_YEAR = 365 * 24 * 60 * 60;
const WAGMI_APR = 230;
const WAGMI_FEES = WAGMI_APR / (SECONDS_IN_A_YEAR * MAX_BP);
const SILO_APR = 7;
const SILO_FEES = SILO_APR / (SECONDS_IN_A_YEAR * MAX_BP);

let REBALANCE_THRESHOLD = 10;
const SLIPPAGE = 0.1;
const PROFIT_REBALANCE_PERCENTAGE = 0.95;

let currentWagmiPositionStable = 0;
let currentWagmiPositionVolatile = 0;
let currentSiloPositionCollateral = 0;
let currentSiloPositionBorrowed = 0;
let currentStableBalance = 0;
let currentVolatileBalance = 0;
let currentShortAvgPrice = 0;

const parseRate = (rateString: string) => {
  const [stableStr, volatileStr] = rateString.split("/");

  return {
    stableRatio: parseFloat(stableStr.replace("%", "")) / 100,
    volatileRatio: parseFloat(volatileStr.replace("%", "")) / 100,
  };
};

const calculateInitialAmounts = (
  historicalData: any[],
  calculateAmounts: boolean = true
) => {
  const initialData = historicalData[0];
  if (calculateAmounts) {
    const rate = parseRate(initialData.rate);

    currentSiloPositionCollateral =
      INITIAL_POSITION_AMOUNT /
      ((rate.stableRatio * SILO_SAFE_LTV) / MAX_BP / rate.volatileRatio + 1);

    currentWagmiPositionStable =
      INITIAL_POSITION_AMOUNT - currentSiloPositionCollateral;

    currentWagmiPositionVolatile = currentSiloPositionBorrowed =
      (((currentSiloPositionCollateral * SILO_SAFE_LTV) / MAX_BP) *
        Number(initialData.stablePrice)) /
      Number(initialData.volatilePrice);

    currentStableBalance = 0;
    currentVolatileBalance = 0;
    currentShortAvgPrice = Number(initialData.volatilePrice);
  } else {
    currentWagmiPositionStable = Number(initialData.wagmiReserveStable);
    currentWagmiPositionVolatile = Number(initialData.wagmiReserveVolatile);
    currentSiloPositionCollateral = Number(initialData.siloCollateral);
    currentSiloPositionBorrowed = Number(initialData.siloBorrowed);
    currentStableBalance = Number(initialData.stableBalance);
    currentVolatileBalance = Number(initialData.volatileBalance);
    currentShortAvgPrice = Number(initialData.volatilePrice);
  }

  // console.log("currentWagmiPositionStable", currentWagmiPositionStable);
  // console.log("currentWagmiPositionVolatile", currentWagmiPositionVolatile);
  // console.log("currentSiloPositionCollateral", currentSiloPositionCollateral);
  // console.log("currentSiloPositionBorrowed", currentSiloPositionBorrowed);
  // console.log("currentStableBalance", currentStableBalance);
  // console.log("currentVolatileBalance", currentVolatileBalance);
  // console.log("currentShortAvgPrice", currentShortAvgPrice);
};

const calculateWagmiDeviationReserves = (
  currentWagmiHistoricalData: any,
  previousWagmiHistoricalData: any
) => {
  const wagmiStableDeviation =
    Number(currentWagmiHistoricalData.wagmiReserveStable) /
    Number(previousWagmiHistoricalData.wagmiReserveStable);

  const wagmiVolatileDeviation =
    Number(currentWagmiHistoricalData.wagmiReserveVolatile) /
    Number(previousWagmiHistoricalData.wagmiReserveVolatile);

  return [wagmiStableDeviation, wagmiVolatileDeviation];
};

const calculateWagmiDeviationRates = (
  currentWagmiHistoricalData: any,
  previousWagmiHistoricalData: any
) => {
  const curentRate = parseRate(currentWagmiHistoricalData.rate);
  const previoustRate = parseRate(previousWagmiHistoricalData.rate);

  const wagmiStableDeviation =
    curentRate.stableRatio / previoustRate.stableRatio;

  const wagmiVolatileDeviation =
    curentRate.volatileRatio / previoustRate.volatileRatio;

  return [wagmiStableDeviation, wagmiVolatileDeviation];
};

const calculateWagmiDeviationCombined = (
  currentWagmiHistoricalData: any,
  previousWagmiHistoricalData: any
) => {
  const currentWagmiReserveStable = Number(
    currentWagmiHistoricalData.wagmiReserveStable
  );
  const previousWagmiReserveStable = Number(
    previousWagmiHistoricalData.wagmiReserveStable
  );
  const currentWagmiReserveVolatile = Number(
    currentWagmiHistoricalData.wagmiReserveVolatile
  );
  const previousWagmiReserveVolatile = Number(
    previousWagmiHistoricalData.wagmiReserveVolatile
  );

  let wagmiStableDeviation = 0;
  let wagmiVolatileDeviation = 0;
  if (
    (currentWagmiReserveStable > previousWagmiReserveStable &&
      currentWagmiReserveVolatile > previousWagmiReserveVolatile) ||
    (currentWagmiReserveStable < previousWagmiReserveStable &&
      currentWagmiReserveVolatile < previousWagmiReserveVolatile)
  ) {
    // deposit or withdraw was made

    [wagmiStableDeviation, wagmiVolatileDeviation] =
      calculateWagmiDeviationRates(
        currentWagmiHistoricalData,
        previousWagmiHistoricalData
      );
  } else {
    [wagmiStableDeviation, wagmiVolatileDeviation] =
      calculateWagmiDeviationReserves(
        currentWagmiHistoricalData,
        previousWagmiHistoricalData
      );
  }

  return [wagmiStableDeviation, wagmiVolatileDeviation];
};

const saveDataToFile = (data: any[], dirName: string, fileName: string) => {
  try {
    const filePath = "./src/data";
    if (!fs.existsSync(`${filePath}/${dirName}`)) {
      fs.mkdirSync(`${filePath}/${dirName}`, { recursive: true });
    }

    fs.writeFileSync(
      `${filePath}/${dirName}/${fileName}`,
      JSON.stringify(data, null, 2)
    );
  } catch (error) {
    console.log("... ... Error saving data to JSON file:", error);
  }
};

const getTimestamp = (timestamp: string) => {
  if (!Number(timestamp)) {
    const date = new Date(timestamp);
    return date.getTime() / 1000;
  }

  return Number(timestamp);
};

const calculateNoPriceStrategyTVLs = (
  historicalData: any[],
  folderName: string,
  useHistoricalData: boolean = true,
  withRandom: boolean = false,
  additionalData?: any
) => {
  const name = useHistoricalData ? "NoPrice" : "NoPriceForServerData";
  const tvlData: TvlData[] = [];

  let wagmiPositionStable = currentWagmiPositionStable;
  let wagmiPositionVolatile = currentWagmiPositionVolatile;
  let siloPositionCollateral = currentSiloPositionCollateral;
  let siloPositionBorrowed = currentSiloPositionBorrowed;
  let stableBalance = currentStableBalance;
  let volatileBalance = currentVolatileBalance;
  let shortAvgPrice = currentShortAvgPrice;

  let rebalancesExecuted = additionalData
    ? additionalData.rebalancesExecuted
    : 0;
  let volatileSwapVolume = additionalData
    ? additionalData.volatileSwapVolume
    : 0;
  let volatileSwapVolumeInStable = additionalData
    ? additionalData.volatileSwapVolumeInStable
    : 0;
  let userFees = additionalData ? additionalData.userFees : 0;
  let protocolFees = additionalData ? additionalData.protocolFees : 0;

  let stableFees = additionalData ? additionalData.stableFees : 0;
  let volatileFees = additionalData ? additionalData.volatileFees : 0;

  historicalData.forEach((data, index) => {
    let currentStablePrice = Number(1);
    let currentVolatilePrice = Number(
      data.strategy_info[0].currentSqrtRatioX96Price
    );

    let isRebalanceNecessary = false;
    if (index !== 0) {
      const timeDifference = Number(
        getTimestamp(data.block_timestamp) -
          getTimestamp(historicalData[index - 1].block_timestamp)
      );

      stableFees +=
        (wagmiPositionStable *
          WAGMI_FEES *
          timeDifference *
          (MAX_BP - PROTOCOL_FEES)) /
        MAX_BP /
        2;

      volatileFees +=
        (wagmiPositionVolatile *
          WAGMI_FEES *
          timeDifference *
          (MAX_BP - PROTOCOL_FEES)) /
        MAX_BP /
        2;

      wagmiPositionStable -= stableFees;
      wagmiPositionVolatile -= volatileFees;

      siloPositionBorrowed += siloPositionBorrowed * SILO_FEES * timeDifference;

      const wagmiTvlInStable =
        wagmiPositionStable + wagmiPositionVolatile * currentVolatilePrice;

      let hedgeAmount = 0;
      for (let strategy of data.strategy_info) {
        const poolTvlInStable = (wagmiTvlInStable * strategy.weight) / 10000;

        const numerator =
          Math.sqrt(strategy.upperPrice / currentVolatilePrice) - 1;
        const denominator =
          Math.sqrt(strategy.upperPrice / strategy.lowerPrice) - 1;

        const delta = numerator / denominator;

        let poolNeededToHedge = poolTvlInStable * delta; // / currentVolatilePrice;

        hedgeAmount += poolNeededToHedge;
      }

      const isRebalanceDown = hedgeAmount > siloPositionBorrowed;
      const volatileHedgeDifference = isRebalanceDown
        ? hedgeAmount - siloPositionBorrowed
        : siloPositionBorrowed - hedgeAmount;

      isRebalanceNecessary =
        volatileHedgeDifference >=
        (siloPositionBorrowed * REBALANCE_THRESHOLD) / MAX_BP;

      if (isRebalanceNecessary) {
        const volatileHedgeDifferenceInStable =
          volatileHedgeDifference * currentVolatilePrice;

        rebalancesExecuted += 1;
        volatileSwapVolume += volatileHedgeDifference;
        volatileSwapVolumeInStable += volatileHedgeDifferenceInStable;

        const feesInStable =
          stableFees +
          (volatileFees * currentVolatilePrice) / currentStablePrice;

        const feesInStableForUsers =
          (feesInStable * (MAX_BP - PROTOCOL_FEES)) / MAX_BP;
        userFees += feesInStableForUsers;
        protocolFees += (feesInStable * PROTOCOL_FEES) / MAX_BP;

        stableFees = 0;
        volatileFees = 0;

        let slippageAmount = 0;
        if (isRebalanceDown) {
          // rebalance down need more hedge
          shortAvgPrice =
            (siloPositionBorrowed * shortAvgPrice +
              volatileHedgeDifference * currentVolatilePrice) /
            (siloPositionBorrowed + volatileHedgeDifference);

          slippageAmount =
            volatileHedgeDifferenceInStable -
            (volatileHedgeDifferenceInStable * (MAX_BP - SLIPPAGE)) / MAX_BP;

          siloPositionCollateral +=
            volatileHedgeDifferenceInStable - slippageAmount;
          siloPositionBorrowed += volatileHedgeDifference;
        } else {
          // rebalance up need less hedge
          slippageAmount =
            (volatileHedgeDifferenceInStable * (MAX_BP + SLIPPAGE)) / MAX_BP -
            volatileHedgeDifferenceInStable;

          siloPositionCollateral -=
            volatileHedgeDifferenceInStable + slippageAmount;
          siloPositionBorrowed -= volatileHedgeDifference;
        }

        if (withRandom) {
          stableBalance += feesInStableForUsers + slippageAmount;
        } else {
          const random = Math.random();
          stableBalance += feesInStableForUsers + slippageAmount * random;
        }
      } else {
        wagmiPositionStable += stableFees;
        wagmiPositionVolatile += volatileFees;
      }
    }

    const tvl =
      wagmiPositionStable +
      (wagmiPositionVolatile * currentVolatilePrice) / currentStablePrice +
      stableBalance +
      (volatileBalance * currentVolatilePrice) / currentStablePrice +
      siloPositionCollateral -
      (siloPositionBorrowed * currentVolatilePrice) / currentStablePrice;

    tvlData.push({
      timestamp: data.block_timestamp,
      tvl: tvl,
      wagmiPositionStable: wagmiPositionStable,
      wagmiPositionVolatile: wagmiPositionVolatile,
      siloPositionCollateral: siloPositionCollateral,
      siloPositionBorrowed: siloPositionBorrowed,
      stableBalance: stableBalance,
      volatileBalance: volatileBalance,
      stablePrice: currentStablePrice,
      volatilePrice: currentVolatilePrice,
      shortAvgPrice: shortAvgPrice,
      isRebalanceExecuted: isRebalanceNecessary,
    });
  });

  console.log(`... ${name} - ${REBALANCE_THRESHOLD}%`);
  console.log("... rebalancesExecuted", rebalancesExecuted);
  console.log("... volatileSwapVolume", volatileSwapVolume);
  console.log("... volatileSwapVolumeInStable", volatileSwapVolumeInStable);
  console.log("... shortAvgPrice", shortAvgPrice);
  console.log("... userFees", userFees);
  console.log("... protocolFees", protocolFees);
  console.log("... last TVL", tvlData[tvlData.length - 1].tvl);
  console.log("... =================");

  saveDataToFile(
    tvlData,
    useHistoricalData
      ? `${folderName}/${REBALANCE_THRESHOLD}%`
      : `${folderName}`,
    `HistoricalInfoTvls${name}${REBALANCE_THRESHOLD}%${
      withRandom ? "WithRandom" : ""
    }.json`
  );

  return {
    wagmiPositionStable,
    wagmiPositionVolatile,
    siloPositionCollateral,
    siloPositionBorrowed,
    stableBalance,
    volatileBalance,
    shortAvgPrice,
    additionalData: {
      rebalancesExecuted,
      volatileSwapVolume,
      volatileSwapVolumeInStable,
      userFees,
      protocolFees,
      stableFees,
      volatileFees,
    },
  };
};

const startBT = (
  wagmiData: any[],
  data: any[],
  folderName: string,
  useHistoricalData: boolean = true,
  withRandom: boolean = false
) => {
  calculateInitialAmounts(wagmiData);

  let additionalData = {
    rebalancesExecuted: 0,
    volatileSwapVolume: 0,
    volatileSwapVolumeInStable: 0,
    userFees: 0,
    protocolFees: 0,
    stableFees: 0,
    volatileFees: 0,
  };

  for (let i = 0; i < data.length; i++) {
    console.log("here");
    let info = calculateNoPriceStrategyTVLs(
      data[i],
      folderName,
      useHistoricalData,
      withRandom,
      additionalData
    );

    currentWagmiPositionStable = info.wagmiPositionStable;
    currentWagmiPositionVolatile = info.wagmiPositionVolatile;
    currentSiloPositionCollateral = info.siloPositionCollateral;
    currentSiloPositionBorrowed = info.siloPositionBorrowed;
    currentStableBalance = info.stableBalance;
    currentVolatileBalance = info.volatileBalance;
    currentShortAvgPrice = info.shortAvgPrice;
    additionalData = info.additionalData;
  }
};

const main = () => {
  console.log("Starting script...");
  // Block Data
  // {->
  {
    console.log("... Vadym Block Data ...");
    let folderName = "blockData/NoRandom";
    [10, 20, 30, 40, 50].map((value) => {
      console.log("\n");
      REBALANCE_THRESHOLD = value;
      startBT(wagmiBlockHistoricalData, [wagmiBlockStrategyInfo], folderName);
    });
  }
  // <-}

  console.log("\nStopping script...");
};

main();

// NODE_OPTIONS="--max-old-space-size=8192" npm run dev
