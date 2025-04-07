import fs from "fs";

import { historicalData as blockHistoricalData } from "./data/initialData/MultipoolHistoricalInfo_python_1903_3";
import { historicalData as strategyNoPriceHistoricalData2Percent } from "./data/initialData/deltaNeutralStrategyNoPriceInfo2Percent";
import { historicalData as strategyNoPriceHistoricalData5Percent } from "./data/initialData/deltaNeutralStrategyNoPriceInfo5Percent";

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
    const curentRate = parseRate(currentWagmiHistoricalData.rate);
    const previoustRate = parseRate(previousWagmiHistoricalData.rate);

    wagmiStableDeviation = curentRate.stableRatio / previoustRate.stableRatio;

    wagmiVolatileDeviation =
      curentRate.volatileRatio / previoustRate.volatileRatio;
  } else {
    wagmiStableDeviation =
      Number(currentWagmiHistoricalData.wagmiReserveStable) /
      Number(previousWagmiHistoricalData.wagmiReserveStable);

    wagmiVolatileDeviation =
      Number(currentWagmiHistoricalData.wagmiReserveVolatile) /
      Number(previousWagmiHistoricalData.wagmiReserveVolatile);
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
  withRandom: boolean = false
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

  let rebalancesExecuted = 0;
  let volatileSwapVolume = 0;
  let volatileSwapVolumeInStable = 0;
  let userFees = 0;
  let protocolFees = 0;

  let stableFees = 0;
  let volatileFees = 0;

  historicalData.forEach((data, index) => {
    let currentStablePrice = Number(data.stablePrice);
    let currentVolatilePrice = Number(data.volatilePrice);

    let isRebalanceNecessary = false;
    if (index !== 0) {
      const timeDifference = Number(
        getTimestamp(data.timestamp) -
          getTimestamp(historicalData[index - 1].timestamp)
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

      if (useHistoricalData) {
        // const [wagmiStableDeviation, wagmiVolatileDeviation] =
        //   calculateWagmiDeviationRates(data, historicalData[index - 1]);
        // wagmiPositionStable *= wagmiStableDeviation;
        // wagmiPositionVolatile *= wagmiVolatileDeviation;

        // wagmiPositionStable = Number(data.myStableTokens);
        // wagmiPositionVolatile = Number(data.myVolatileTokens);

        const [wagmiStableDeviation, wagmiVolatileDeviation] =
          calculateWagmiDeviationCombined(data, historicalData[index - 1]);
        wagmiPositionStable *= wagmiStableDeviation;
        wagmiPositionVolatile *= wagmiVolatileDeviation;
      } else {
        const [wagmiStableDeviation, wagmiVolatileDeviation] =
          calculateWagmiDeviationReserves(data, historicalData[index - 1]);
        wagmiPositionStable *= wagmiStableDeviation;
        wagmiPositionVolatile *= wagmiVolatileDeviation;
      }

      // const [wagmiStableDeviation, wagmiVolatileDeviation] =
      //   calculateWagmiDeviationRates(data, historicalData[index - 1]);

      wagmiPositionStable -= stableFees;
      wagmiPositionVolatile -= volatileFees;

      siloPositionBorrowed += siloPositionBorrowed * SILO_FEES * timeDifference;

      const isRebalanceDown = wagmiPositionVolatile > siloPositionBorrowed;
      const volatileHedgeDifference = isRebalanceDown
        ? wagmiPositionVolatile - siloPositionBorrowed
        : siloPositionBorrowed - wagmiPositionVolatile;

      // if (useHistoricalData) {
      //   isRebalanceNecessary =
      //     volatileHedgeDifference >=
      //       (siloPositionBorrowed * REBALANCE_THRESHOLD) / MAX_BP &&
      //     (withRandom ? Math.random() > PROFIT_REBALANCE_PERCENTAGE : true);
      // } else {
      //   isRebalanceNecessary =
      //     data.siloCollateral !== historicalData[index - 1].siloCollateral;
      // }
      isRebalanceNecessary =
        volatileHedgeDifference >=
          (siloPositionBorrowed * REBALANCE_THRESHOLD) / MAX_BP &&
        Math.random() > PROFIT_REBALANCE_PERCENTAGE;
      // (withRandom ? Math.random() > PROFIT_REBALANCE_PERCENTAGE : true);

      if (isRebalanceNecessary) {
        const volatileHedgeDifferenceInStable =
          (volatileHedgeDifference * currentVolatilePrice) / currentStablePrice;

        rebalancesExecuted += 1;
        volatileSwapVolume += volatileHedgeDifference;
        volatileSwapVolumeInStable += volatileHedgeDifferenceInStable;

        // claim fees
        const feesInStable =
          stableFees +
          (volatileFees * currentVolatilePrice) / currentStablePrice;

        const feesInStableForUsers =
          (feesInStable * (MAX_BP - PROTOCOL_FEES)) / MAX_BP;
        userFees += feesInStableForUsers;
        protocolFees += (feesInStable * PROTOCOL_FEES) / MAX_BP;

        // reset fees
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
      timestamp: data.timestamp,
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
  console.log(
    "... last stable balance",
    tvlData[tvlData.length - 1].stableBalance
  );
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
};

const startBT = (
  data: any[],
  folderName: string,
  useHistoricalData: boolean = true,
  withRandom: boolean = false
) => {
  calculateInitialAmounts(data);

  calculateNoPriceStrategyTVLs(data, folderName, useHistoricalData, withRandom);
};

const main = () => {
  console.log("Starting script...");
  // Block Data
  // {->
  {
    console.log("... Vadym Block Data ...");
    let folderName = "blockData/NoRandom";
    [2, 5, 7].map((value) => {
      console.log("\n");
      REBALANCE_THRESHOLD = value;
      startBT(blockHistoricalData, folderName);
    });
  }
  // <-}

  // Strategies Server Strategies Data
  // {->
  {
    console.log("\n... Strategies Server Strategies Data ...");
    let folderName = "strategyDataWithServerStrategiesData";
    REBALANCE_THRESHOLD = 2;
    calculateInitialAmounts(strategyNoPriceHistoricalData2Percent, false);
    calculateNoPriceStrategyTVLs(
      strategyNoPriceHistoricalData2Percent,
      folderName,
      false
    );

    REBALANCE_THRESHOLD = 5;
    calculateInitialAmounts(strategyNoPriceHistoricalData5Percent, false);
    calculateNoPriceStrategyTVLs(
      strategyNoPriceHistoricalData5Percent,
      folderName,
      false
    );
  }
  // <-}

  console.log("\nStopping script...");
};

main();
