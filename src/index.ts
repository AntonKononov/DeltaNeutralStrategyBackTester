import fs from "fs";

import { historicalData as blockHistoricalData } from "./data/initialData/MultipoolHistoricalInfo_python_1903_2";
// import { historicalData as blockHistoricalData } from "./data/initialData/MultipoolHistoricalInfo_python_1903_3";

import { historicalData as blockHistoricalDataForStrategiesPeriod } from "./data/initialData/WagmiMultipoolHistoricalInfoForStrategiesPeriod";
import { historicalData as strategyNoPriceHistoricalData } from "./data/initialData/deltaNeutralStrategyNoPriceInfo";
// import { historicalData as strategyWithPriceHistoricalData } from "./data/initialData/deltaNeutralStrategyWithPriceInfo";
// import { historicalData as strategyDynamicThresholdHistoricalData } from "./data/initialData/deltaNeutralStrategyDynamicThresholdInfo";

interface TvlData {
  timestamp: number;
  tvl: number;
  wagmiPositionStable: number;
  wagmiPositionVolatile: number;
  siloPositionCollateral: number;
  siloPositionBorrowed: number;
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
const WAGMI_APR = 300;
const WAGMI_FEES = WAGMI_APR / (SECONDS_IN_A_YEAR * MAX_BP);
const SILO_APR = 10;
const SILO_FEES = SILO_APR / (SECONDS_IN_A_YEAR * MAX_BP);

const REBALANCE_AMOUNT = 10;
const REBALANCE_THRESHOLD = 10;
const PRICE_THRESHOLD = 3;
const MIN_REBALANCE_THRESHOLD = 3;
const SLIPPAGE = 0.1;

let currentWagmiPositionStable = 0;
let currentWagmiPositionVolatile = 0;
let currentSiloPositionCollateral = 0;
let currentSiloPositionBorrowed = 0;
let currentStableBalance = 0;
let currentVolatileBalance = 0;
let currentShortAvgPrice = 0;

const calculateInitialAmounts = (historicalData: any[]) => {
  const initialData = historicalData[0];
  const [stableStr, volatileStr] = initialData.rate.split("/");
  const stableRatio = parseFloat(stableStr);
  const volatileRatio = parseFloat(volatileStr);

  currentSiloPositionCollateral =
    INITIAL_POSITION_AMOUNT /
    ((stableRatio * SILO_SAFE_LTV) / MAX_BP / volatileRatio + 1);

  currentWagmiPositionStable =
    INITIAL_POSITION_AMOUNT - currentSiloPositionCollateral;

  currentWagmiPositionVolatile = currentSiloPositionBorrowed =
    (((currentSiloPositionCollateral * SILO_SAFE_LTV) / MAX_BP) *
      Number(initialData.stablePrice)) /
    Number(initialData.volatilePrice);

  currentShortAvgPrice = Number(initialData.volatilePrice);

  // currentShortAvgPrice = Number(initialData.volatilePrice);
  // currentSiloPositionBorrowed = 45;
  // currentSiloPositionCollateral =
  //   (currentSiloPositionBorrowed * currentShortAvgPrice) / SILO_SAFE_LTV;

  // const forWagmi = depositAmount + currentSiloPositionBorrowed * currentShortAvgPrice - currentSiloPositionCollateral;
  // currentWagmiPositionVolatile =
  //   (forWagmi * (volatileRatio / MAX_BP)) / currentShortAvgPrice;
  // currentWagmiPositionStable = (forWagmi * stableRatio) / MAX_BP;

  // console.log("currentWagmiPositionStable", currentWagmiPositionStable);
  // console.log("currentWagmiPositionVolatile", currentWagmiPositionVolatile);
  // console.log("currentSiloPositionCollateral", currentSiloPositionCollateral);
  // console.log("currentSiloPositionBorrowed", currentSiloPositionBorrowed);
};

const calculateWagmiDeviation = (
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

const saveDataToFile = (data: any[], fileName: string) => {
  try {
    const filePath = `./src/data/${fileName}`;

    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  } catch (error) {
    console.log("... ... Error saving data to JSON file:", error);
  }
};

const calculateNoStrategyTVLs = (historicalData: any[], folderName: string) => {
  const name = "NoStrategy";
  const poolTvlData: { timestamp: number; tvl: number }[] = [];
  const tvlData: { timestamp: number; tvl: number }[] = [];

  let wagmiPositionStable = currentWagmiPositionStable;
  let wagmiPositionVolatile = currentWagmiPositionVolatile;

  historicalData.forEach((data, index) => {
    if (index !== 0) {
      const [wagmiStableDeviation, wagmiVolatileDeviation] =
        calculateWagmiDeviation(data, historicalData[index - 1]);

      wagmiPositionStable *= wagmiStableDeviation;
      wagmiPositionVolatile *= wagmiVolatileDeviation;
    }
    const poolTvl =
      wagmiPositionStable * Number(data.stablePrice) +
      wagmiPositionVolatile * Number(data.volatilePrice);
    const tvl =
      poolTvl +
      currentSiloPositionCollateral * Number(data.stablePrice) -
      currentSiloPositionBorrowed * Number(data.volatilePrice);

    poolTvlData.push({
      timestamp: data.timestamp,
      tvl: poolTvl,
    });
    tvlData.push({
      timestamp: data.timestamp,
      tvl: tvl,
    });
  });

  // console.table(tvlData);
  saveDataToFile(
    poolTvlData,
    `${folderName}HistoricalInfoTvls${name}Pool.json`
  );
  saveDataToFile(tvlData, `${folderName}HistoricalInfoTvls${name}.json`);
};

const calculateRandomTVLs = (historicalData: any[], folderName: string) => {
  const name = "RandomRebalances";
  const tvlData: TvlData[] = [];

  let rebalancesExecuted = 0;
  let volatileSwapVolume = 0;
  let volatileSwapVolumeInStable = 0;

  let wagmiPositionStable = currentWagmiPositionStable;
  let wagmiPositionVolatile = currentWagmiPositionVolatile;
  let siloPositionCollateral = currentSiloPositionCollateral;
  let siloPositionBorrowed = currentSiloPositionBorrowed;
  let shortAvgPrice = currentShortAvgPrice;

  historicalData.forEach((data, index) => {
    let currentStablePrice = Number(data.stablePrice);
    let currentVolatilePrice = Number(data.volatilePrice);

    if (index !== 0) {
      const [wagmiStableDeviation, wagmiVolatileDeviation] =
        calculateWagmiDeviation(data, historicalData[index - 1]);

      wagmiPositionStable *= wagmiStableDeviation;
      wagmiPositionVolatile *= wagmiVolatileDeviation;
    }

    let isRebalanceNecessary =
      Math.random() > 0.95 && rebalancesExecuted < REBALANCE_AMOUNT;
    if (isRebalanceNecessary) {
      const isRebalanceDown = wagmiPositionVolatile > siloPositionBorrowed;
      const volatileHedgeDifference = isRebalanceDown
        ? wagmiPositionVolatile - siloPositionBorrowed
        : siloPositionBorrowed - wagmiPositionVolatile;

      const volatileHedgeDifferenceInStable =
        (volatileHedgeDifference * currentVolatilePrice) / currentStablePrice;

      rebalancesExecuted += 1;
      volatileSwapVolume += volatileHedgeDifference;
      volatileSwapVolumeInStable += volatileHedgeDifferenceInStable;

      if (isRebalanceDown) {
        // rebalance down need more hedge
        shortAvgPrice =
          (siloPositionBorrowed * shortAvgPrice +
            volatileHedgeDifference * currentVolatilePrice) /
          (siloPositionBorrowed + volatileHedgeDifference);

        siloPositionCollateral += volatileHedgeDifferenceInStable;
        siloPositionBorrowed += volatileHedgeDifference;
      } else {
        // rebalance up need less hedge
        siloPositionCollateral -= volatileHedgeDifferenceInStable;
        siloPositionBorrowed -= volatileHedgeDifference;
      }
    }

    const tvl =
      wagmiPositionStable +
      wagmiPositionVolatile * currentVolatilePrice +
      siloPositionCollateral -
      siloPositionBorrowed * currentVolatilePrice;

    tvlData.push({
      timestamp: data.timestamp,
      tvl: tvl,
      wagmiPositionStable: wagmiPositionStable,
      wagmiPositionVolatile: wagmiPositionVolatile,
      siloPositionCollateral: siloPositionCollateral,
      siloPositionBorrowed: siloPositionBorrowed,
      shortAvgPrice: shortAvgPrice,
      stablePrice: currentStablePrice,
      volatilePrice: currentVolatilePrice,
      isRebalanceExecuted: isRebalanceNecessary,
    });
  });

  console.log("... ", name);
  console.log("... rebalancesExecuted", rebalancesExecuted);
  console.log("... volatileSwapVolume", volatileSwapVolume);
  console.log("... volatileSwapVolumeInStable", volatileSwapVolumeInStable);
  console.log("... last TVL", tvlData[tvlData.length - 1].tvl);
  console.log("... =================");

  saveDataToFile(tvlData, `${folderName}HistoricalInfoTvls${name}.json`);
};

const calculateNoPriceStrategyTVLs = (
  historicalData: any[],
  folderName: string
) => {
  const name = "NoPrice";
  const tvlData: TvlData[] = [];

  let rebalancesExecuted = 0;
  let volatileSwapVolume = 0;
  let volatileSwapVolumeInStable = 0;
  let wagmiPositionStable = currentWagmiPositionStable;
  let wagmiPositionVolatile = currentWagmiPositionVolatile;
  let siloPositionCollateral = currentSiloPositionCollateral;
  let siloPositionBorrowed = currentSiloPositionBorrowed;
  let shortAvgPrice = currentShortAvgPrice;
  let stableFee = 0;
  let volatileFee = 0;

  historicalData.forEach((data, index) => {
    let currentStablePrice = Number(data.stablePrice);
    let currentVolatilePrice = Number(data.volatilePrice);

    if (index !== 0) {
      const [wagmiStableDeviation, wagmiVolatileDeviation] =
        calculateWagmiDeviation(data, historicalData[index - 1]);

      wagmiPositionStable *= wagmiStableDeviation;
      wagmiPositionVolatile *= wagmiVolatileDeviation;
    }

    const isRebalanceDown = wagmiPositionVolatile > siloPositionBorrowed;
    const volatileHedgeDifference = isRebalanceDown
      ? wagmiPositionVolatile - siloPositionBorrowed
      : siloPositionBorrowed - wagmiPositionVolatile;

    let isRebalanceNecessary = false;
    if (
      volatileHedgeDifference >=
      (siloPositionBorrowed * REBALANCE_THRESHOLD) / MAX_BP
    ) {
      if (Math.random() > 0.98) {
        isRebalanceNecessary = true;
        const volatileHedgeDifferenceInStable =
          (volatileHedgeDifference * currentVolatilePrice) / currentStablePrice;

        rebalancesExecuted += 1;
        volatileSwapVolume += volatileHedgeDifference;
        volatileSwapVolumeInStable += volatileHedgeDifferenceInStable;

        if (isRebalanceDown) {
          // rebalance down need more hedge
          shortAvgPrice =
            (siloPositionBorrowed * shortAvgPrice +
              volatileHedgeDifference * currentVolatilePrice) /
            (siloPositionBorrowed + volatileHedgeDifference);

          siloPositionCollateral += volatileHedgeDifferenceInStable;
          siloPositionBorrowed += volatileHedgeDifference;
        } else {
          // rebalance up need less hedge
          siloPositionCollateral -= volatileHedgeDifferenceInStable;
          siloPositionBorrowed -= volatileHedgeDifference;
        }
      }
    }

    const tvl =
      wagmiPositionStable +
      (wagmiPositionVolatile * currentVolatilePrice) / currentStablePrice +
      siloPositionCollateral -
      (siloPositionBorrowed * currentVolatilePrice) / currentStablePrice;

    tvlData.push({
      timestamp: data.timestamp,
      tvl: tvl,
      wagmiPositionStable: wagmiPositionStable,
      wagmiPositionVolatile: wagmiPositionVolatile,
      siloPositionCollateral: siloPositionCollateral,
      siloPositionBorrowed: siloPositionBorrowed,
      stablePrice: currentStablePrice,
      volatilePrice: currentVolatilePrice,
      shortAvgPrice: shortAvgPrice,
      isRebalanceExecuted: isRebalanceNecessary,
    });
  });

  console.log("... ", name);
  console.log("... rebalancesExecuted", rebalancesExecuted);
  console.log("... volatileSwapVolume", volatileSwapVolume);
  console.log("... volatileSwapVolumeInStable", volatileSwapVolumeInStable);
  console.log("... shortAvgPrice", shortAvgPrice);
  console.log("... stableFee", stableFee);
  console.log("... volatileFee", volatileFee);
  console.log("... last TVL", tvlData[tvlData.length - 1].tvl);
  console.log("... =================");

  saveDataToFile(tvlData, `${folderName}HistoricalInfoTvls${name}.json`);
};

interface TvlDataNew {
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

const calculateNoPriceStrategyTVLsWithFeesAndBalance = (
  historicalData: any[],
  folderName: string
) => {
  const name = "NoPriceWithFeesAndBalance";
  const tvlData: TvlDataNew[] = [];

  let rebalancesExecuted = 0;
  let volatileSwapVolume = 0;
  let volatileSwapVolumeInStable = 0;
  let wagmiPositionStable = currentWagmiPositionStable;
  let wagmiPositionVolatile = currentWagmiPositionVolatile;
  let siloPositionCollateral = currentSiloPositionCollateral;
  let siloPositionBorrowed = currentSiloPositionBorrowed;
  let stableBalance = currentStableBalance;
  let volatileBalance = currentVolatileBalance;
  let userFees = 0;
  let protocolFees = 0;
  let shortAvgPrice = currentShortAvgPrice;

  let stableFees = 0;
  let volatileFees = 0;
  historicalData.forEach((data, index) => {
    let currentStablePrice = Number(data.stablePrice);
    let currentVolatilePrice = Number(data.volatilePrice);

    let currentStableFee = 0;
    let currentVolatileFee = 0;
    if (index !== 0) {
      const timeDifference = Number(
        data.timestamp - historicalData[index - 1].timestamp
      );
      currentStableFee =
        (wagmiPositionStable * WAGMI_FEES * timeDifference) / 2;
      stableFees += currentStableFee;

      currentVolatileFee =
        (wagmiPositionVolatile * WAGMI_FEES * timeDifference) / 2;
      volatileFees += currentVolatileFee;

      const [wagmiStableDeviation, wagmiVolatileDeviation] =
        calculateWagmiDeviation(data, historicalData[index - 1]);

      wagmiPositionStable *= wagmiStableDeviation;
      wagmiPositionVolatile *= wagmiVolatileDeviation;

      wagmiPositionStable -= currentStableFee;
      wagmiPositionVolatile -= currentVolatileFee;

      siloPositionBorrowed += siloPositionBorrowed * SILO_FEES * timeDifference;
    }

    const isRebalanceDown = wagmiPositionVolatile > siloPositionBorrowed;
    const volatileHedgeDifference = isRebalanceDown
      ? wagmiPositionVolatile - siloPositionBorrowed
      : siloPositionBorrowed - wagmiPositionVolatile;

    let isRebalanceNecessary = false;
    if (
      volatileHedgeDifference >=
        (siloPositionBorrowed * REBALANCE_THRESHOLD) / MAX_BP &&
      Math.random() > 0.98
    ) {
      isRebalanceNecessary = true;
      const volatileHedgeDifferenceInStable =
        (volatileHedgeDifference * currentVolatilePrice) / currentStablePrice;

      rebalancesExecuted += 1;
      volatileSwapVolume += volatileHedgeDifference;
      volatileSwapVolumeInStable += volatileHedgeDifferenceInStable;

      // claim fees
      const feesInStable =
        stableFees + (volatileFees * currentVolatilePrice) / currentStablePrice;

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
          volatileHedgeDifferenceInStable + slippageAmount;
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

      const random = Math.random();

      stableBalance +=
        feesInStableForUsers + slippageAmount - slippageAmount * random;
    } else {
      wagmiPositionStable += currentStableFee;
      wagmiPositionVolatile += currentVolatileFee;
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

  console.log("... ", name);
  console.log("... rebalancesExecuted", rebalancesExecuted);
  console.log("... volatileSwapVolume", volatileSwapVolume);
  console.log("... volatileSwapVolumeInStable", volatileSwapVolumeInStable);
  console.log("... shortAvgPrice", shortAvgPrice);
  console.log("... userFees", userFees);
  console.log("... protocolFees", protocolFees);
  console.log("... last TVL", tvlData[tvlData.length - 1].tvl);
  console.log("... =================");

  saveDataToFile(tvlData, `${folderName}HistoricalInfoTvls${name}.json`);
};

const calculateNoPriceStrategyTVLsWithFeesAndBalanceForServerData = (
  historicalData: any[],
  folderName: string
) => {
  const name = "NoPriceWithFeesAndBalanceForServerData";
  const tvlData: TvlDataNew[] = [];

  let rebalancesExecuted = 0;
  let volatileSwapVolume = 0;
  let volatileSwapVolumeInStable = 0;
  let wagmiPositionStable = currentWagmiPositionStable;
  let wagmiPositionVolatile = currentWagmiPositionVolatile;
  let siloPositionCollateral = currentSiloPositionCollateral;
  let siloPositionBorrowed = currentSiloPositionBorrowed;
  let stableBalance = currentStableBalance;
  let volatileBalance = currentVolatileBalance;
  let userFees = 0;
  let protocolFees = 0;
  let shortAvgPrice = currentShortAvgPrice;

  let stableFees = 0;
  let volatileFees = 0;
  historicalData.forEach((data, index) => {
    let currentStablePrice = Number(data.stablePrice);
    let currentVolatilePrice = Number(data.volatilePrice);

    let currentStableFee = 0;
    let currentVolatileFee = 0;
    let isRebalanceNecessary = false;
    if (index !== 0) {
      const timeDifference = Number(
        data.timestamp - historicalData[index - 1].timestamp
      );
      currentStableFee =
        (wagmiPositionStable * WAGMI_FEES * timeDifference) / 2;
      stableFees += currentStableFee;

      currentVolatileFee =
        (wagmiPositionVolatile * WAGMI_FEES * timeDifference) / 2;
      volatileFees += currentVolatileFee;

      const [wagmiStableDeviation, wagmiVolatileDeviation] =
        calculateWagmiDeviation(data, historicalData[index - 1]);

      wagmiPositionStable *= wagmiStableDeviation;
      wagmiPositionVolatile *= wagmiVolatileDeviation;

      wagmiPositionStable -= currentStableFee;
      wagmiPositionVolatile -= currentVolatileFee;

      siloPositionBorrowed += siloPositionBorrowed * SILO_FEES * timeDifference;

      const isRebalanceDown = wagmiPositionVolatile > siloPositionBorrowed;
      const volatileHedgeDifference = isRebalanceDown
        ? wagmiPositionVolatile - siloPositionBorrowed
        : siloPositionBorrowed - wagmiPositionVolatile;

      isRebalanceNecessary =
        data.siloCollateral !== historicalData[index - 1].siloCollateral;
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

        // if (isRebalanceDown) {
        //   // rebalance down need more hedge
        //   shortAvgPrice =
        //     (siloPositionBorrowed * shortAvgPrice +
        //       volatileHedgeDifference * currentVolatilePrice) /
        //     (siloPositionBorrowed + volatileHedgeDifference);

        //   siloPositionCollateral += volatileHedgeDifferenceInStable;
        //   siloPositionBorrowed += volatileHedgeDifference;
        // } else {
        //   // rebalance up need less hedge
        //   siloPositionCollateral -= volatileHedgeDifferenceInStable;
        //   siloPositionBorrowed -= volatileHedgeDifference;
        // }

        // stableBalance += (userFees * Math.random()) / 2;

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
            volatileHedgeDifferenceInStable + slippageAmount;
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

        const random = Math.random();

        stableBalance +=
          feesInStableForUsers + slippageAmount - slippageAmount * random;
      } else {
        wagmiPositionStable += currentStableFee;
        wagmiPositionVolatile += currentVolatileFee;
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

  console.log("... ", name);
  console.log("... rebalancesExecuted", rebalancesExecuted);
  console.log("... volatileSwapVolume", volatileSwapVolume);
  console.log("... volatileSwapVolumeInStable", volatileSwapVolumeInStable);
  console.log("... shortAvgPrice", shortAvgPrice);
  console.log("... userFees", userFees);
  console.log("... protocolFees", protocolFees);
  console.log("... last TVL", tvlData[tvlData.length - 1].tvl);
  console.log("... =================");

  saveDataToFile(tvlData, `${folderName}HistoricalInfoTvls${name}.json`);
};

const calculateWithPriceStrategyTVLs = (
  historicalData: any[],
  folderName: string
) => {
  const name = "WithPrice";
  const tvlData: TvlData[] = [];

  let rebalancesExecuted = 0;
  let volatileSwapVolume = 0;
  let volatileSwapVolumeInStable = 0;
  let wagmiPositionStable = currentWagmiPositionStable;
  let wagmiPositionVolatile = currentWagmiPositionVolatile;
  let siloPositionCollateral = currentSiloPositionCollateral;
  let siloPositionBorrowed = currentSiloPositionBorrowed;
  let shortAvgPrice = currentShortAvgPrice;
  let lastRebalancePrice = currentShortAvgPrice;

  historicalData.forEach((data, index) => {
    let currentStablePrice = Number(data.stablePrice);
    let currentVolatilePrice = Number(data.volatilePrice);

    if (index !== 0) {
      const [wagmiStableDeviation, wagmiVolatileDeviation] =
        calculateWagmiDeviation(data, historicalData[index - 1]);

      wagmiPositionStable *= wagmiStableDeviation;
      wagmiPositionVolatile *= wagmiVolatileDeviation;
    }

    const isRebalanceDown = wagmiPositionVolatile > siloPositionBorrowed;
    const volatileHedgeDifference = isRebalanceDown
      ? wagmiPositionVolatile - siloPositionBorrowed
      : siloPositionBorrowed - wagmiPositionVolatile;

    let sizeDiffrence =
      volatileHedgeDifference >=
      (siloPositionBorrowed * REBALANCE_THRESHOLD) / MAX_BP;

    let priceDifference =
      (currentVolatilePrice > lastRebalancePrice
        ? currentVolatilePrice - lastRebalancePrice
        : lastRebalancePrice - currentVolatilePrice) >=
      (lastRebalancePrice * PRICE_THRESHOLD) / MAX_BP;

    let isRebalanceNecessary = sizeDiffrence && priceDifference;
    if (isRebalanceNecessary) {
      const volatileHedgeDifferenceInStable =
        (volatileHedgeDifference * currentVolatilePrice) / currentStablePrice;

      rebalancesExecuted += 1;
      volatileSwapVolume += volatileHedgeDifference;
      volatileSwapVolumeInStable += volatileHedgeDifferenceInStable;
      lastRebalancePrice = currentVolatilePrice;

      if (isRebalanceDown) {
        // rebalance down need more hedge
        shortAvgPrice =
          (siloPositionBorrowed * shortAvgPrice +
            volatileHedgeDifference * currentVolatilePrice) /
          (siloPositionBorrowed + volatileHedgeDifference);

        siloPositionCollateral += volatileHedgeDifferenceInStable;
        siloPositionBorrowed += volatileHedgeDifference;
      } else {
        // rebalance up need less hedge
        siloPositionCollateral -= volatileHedgeDifferenceInStable;
        siloPositionBorrowed -= volatileHedgeDifference;
      }
    }

    const tvl =
      wagmiPositionStable +
      wagmiPositionVolatile * currentVolatilePrice +
      siloPositionCollateral -
      siloPositionBorrowed * currentVolatilePrice;

    tvlData.push({
      timestamp: data.timestamp,
      tvl: tvl,
      wagmiPositionStable: wagmiPositionStable,
      wagmiPositionVolatile: wagmiPositionVolatile,
      siloPositionCollateral: siloPositionCollateral,
      siloPositionBorrowed: siloPositionBorrowed,
      shortAvgPrice: shortAvgPrice,
      stablePrice: currentStablePrice,
      volatilePrice: currentVolatilePrice,
      isRebalanceExecuted: isRebalanceNecessary,
    });
  });

  console.log("... ", name);
  console.log("... rebalancesExecuted", rebalancesExecuted);
  console.log("... volatileSwapVolume", volatileSwapVolume);
  console.log("... volatileSwapVolumeInStable", volatileSwapVolumeInStable);
  console.log("... last TVL", tvlData[tvlData.length - 1].tvl);
  console.log("... =================");

  saveDataToFile(tvlData, `${folderName}HistoricalInfoTvls${name}.json`);
};

const getDynamicThreshold = (
  currentWagmiReserveStable: number,
  currentWagmiReserveVolatile: number,
  currentVolatilePrice: number
) => {
  const ratioStable =
    1 /
    (1 +
      (currentWagmiReserveVolatile * currentVolatilePrice) /
        currentWagmiReserveStable);

  const ratioVolatile = 1 - ratioStable;

  const currentThreshold = (ratioStable * 10) / ratioVolatile;

  return currentThreshold >= MIN_REBALANCE_THRESHOLD
    ? currentThreshold
    : MIN_REBALANCE_THRESHOLD;
};

const calculateDynamicThresholdStrategyTVLs = (
  historicalData: any[],
  folderName: string
) => {
  const name = "DynamicThreshold";
  const tvlData: TvlData[] = [];

  let rebalancesExecuted = 0;
  let volatileSwapVolume = 0;
  let volatileSwapVolumeInStable = 0;
  let wagmiPositionStable = currentWagmiPositionStable;
  let wagmiPositionVolatile = currentWagmiPositionVolatile;
  let siloPositionCollateral = currentSiloPositionCollateral;
  let siloPositionBorrowed = currentSiloPositionBorrowed;
  let shortAvgPrice = currentShortAvgPrice;

  historicalData.forEach((data, index) => {
    let currentStablePrice = Number(data.stablePrice);
    let currentVolatilePrice = Number(data.volatilePrice);

    if (index !== 0) {
      const [wagmiStableDeviation, wagmiVolatileDeviation] =
        calculateWagmiDeviation(data, historicalData[index - 1]);

      wagmiPositionStable *= wagmiStableDeviation;
      wagmiPositionVolatile *= wagmiVolatileDeviation;
    }

    const isRebalanceDown = wagmiPositionVolatile > siloPositionBorrowed;
    const volatileHedgeDifference = isRebalanceDown
      ? wagmiPositionVolatile - siloPositionBorrowed
      : siloPositionBorrowed - wagmiPositionVolatile;

    let isRebalanceNecessary =
      volatileHedgeDifference >=
      (siloPositionBorrowed *
        getDynamicThreshold(
          data.wagmiReserveStable,
          data.wagmiReserveVolatile,
          currentVolatilePrice
        )) /
        MAX_BP;
    if (isRebalanceNecessary) {
      const volatileHedgeDifferenceInStable =
        (volatileHedgeDifference * currentVolatilePrice) / currentStablePrice;

      rebalancesExecuted += 1;
      volatileSwapVolume += volatileHedgeDifference;
      volatileSwapVolumeInStable += volatileHedgeDifferenceInStable;

      if (isRebalanceDown) {
        // rebalance down need more hedge
        shortAvgPrice =
          (siloPositionBorrowed * shortAvgPrice +
            volatileHedgeDifference * currentVolatilePrice) /
          (siloPositionBorrowed + volatileHedgeDifference);

        siloPositionCollateral += volatileHedgeDifferenceInStable;
        siloPositionBorrowed += volatileHedgeDifference;
      } else {
        // rebalance up need less hedge
        siloPositionCollateral -= volatileHedgeDifferenceInStable;
        siloPositionBorrowed -= volatileHedgeDifference;
      }
    }

    const tvl =
      wagmiPositionStable +
      wagmiPositionVolatile * currentVolatilePrice +
      siloPositionCollateral -
      siloPositionBorrowed * currentVolatilePrice;

    tvlData.push({
      timestamp: data.timestamp,
      tvl: tvl,
      wagmiPositionStable: wagmiPositionStable,
      wagmiPositionVolatile: wagmiPositionVolatile,
      siloPositionCollateral: siloPositionCollateral,
      siloPositionBorrowed: siloPositionBorrowed,
      shortAvgPrice: shortAvgPrice,
      stablePrice: currentStablePrice,
      volatilePrice: currentVolatilePrice,
      isRebalanceExecuted: isRebalanceNecessary,
    });
  });

  console.log("... ", name);
  console.log("... rebalancesExecuted", rebalancesExecuted);
  console.log("... volatileSwapVolume", volatileSwapVolume);
  console.log("... volatileSwapVolumeInStable", volatileSwapVolumeInStable);
  console.log("... last TVL", tvlData[tvlData.length - 1].tvl);
  console.log("... =================");

  saveDataToFile(tvlData, `${folderName}HistoricalInfoTvls${name}.json`);
};

const calculateShortAvgPriceStrategyTVLs = (
  historicalData: any[],
  folderName: string
) => {
  const name = "ShortAvgPrice";
  const tvlData: TvlData[] = [];

  let rebalancesExecuted = 0;
  let volatileSwapVolume = 0;
  let volatileSwapVolumeInStable = 0;
  let wagmiPositionStable = currentWagmiPositionStable;
  let wagmiPositionVolatile = currentWagmiPositionVolatile;
  let siloPositionCollateral = currentSiloPositionCollateral;
  let siloPositionBorrowed = currentSiloPositionBorrowed;
  let shortAvgPrice = currentShortAvgPrice;

  historicalData.forEach((data, index) => {
    let currentStablePrice = Number(data.stablePrice);
    let currentVolatilePrice = Number(data.volatilePrice);

    if (index !== 0) {
      const [wagmiStableDeviation, wagmiVolatileDeviation] =
        calculateWagmiDeviation(data, historicalData[index - 1]);

      wagmiPositionStable *= wagmiStableDeviation;
      wagmiPositionVolatile *= wagmiVolatileDeviation;
    }

    const isRebalanceDown = wagmiPositionVolatile > siloPositionBorrowed;
    const volatileHedgeDifference = isRebalanceDown
      ? wagmiPositionVolatile - siloPositionBorrowed
      : siloPositionBorrowed - wagmiPositionVolatile;

    let isRebalanceNecessary = false;
    if (
      volatileHedgeDifference >=
      (siloPositionBorrowed * REBALANCE_THRESHOLD) / MAX_BP
    ) {
      const volatileHedgeDifferenceInStable =
        (volatileHedgeDifference * currentVolatilePrice) / currentStablePrice;

      volatileSwapVolume += volatileHedgeDifference;
      volatileSwapVolumeInStable += volatileHedgeDifferenceInStable;

      if (isRebalanceDown) {
        // rebalance down need more hedge
        shortAvgPrice =
          (siloPositionBorrowed * shortAvgPrice +
            volatileHedgeDifference * currentVolatilePrice) /
          (siloPositionBorrowed + volatileHedgeDifference);

        siloPositionCollateral += volatileHedgeDifferenceInStable;
        siloPositionBorrowed += volatileHedgeDifference;
        rebalancesExecuted += 1;
        isRebalanceNecessary = true;
      } else if (currentVolatilePrice < shortAvgPrice) {
        // rebalance up need less hedge
        siloPositionCollateral -= volatileHedgeDifferenceInStable;
        siloPositionBorrowed -= volatileHedgeDifference;
        rebalancesExecuted += 1;
        isRebalanceNecessary = true;
      }
    }

    const tvl =
      wagmiPositionStable +
      wagmiPositionVolatile * currentVolatilePrice +
      siloPositionCollateral -
      siloPositionBorrowed * currentVolatilePrice;

    tvlData.push({
      timestamp: data.timestamp,
      tvl: tvl,
      wagmiPositionStable: wagmiPositionStable,
      wagmiPositionVolatile: wagmiPositionVolatile,
      siloPositionCollateral: siloPositionCollateral,
      siloPositionBorrowed: siloPositionBorrowed,
      shortAvgPrice: shortAvgPrice,
      stablePrice: currentStablePrice,
      volatilePrice: currentVolatilePrice,
      isRebalanceExecuted: isRebalanceNecessary,
    });
  });

  console.log("... ", name);
  console.log("... rebalancesExecuted", rebalancesExecuted);
  console.log("... volatileSwapVolume", volatileSwapVolume);
  console.log("... volatileSwapVolumeInStable", volatileSwapVolumeInStable);
  console.log("... last TVL", tvlData[tvlData.length - 1].tvl);
  console.log("... =================");

  saveDataToFile(tvlData, `${folderName}HistoricalInfoTvls${name}.json`);
};

// const calculateMovingAverageStrategyTVLs = () => {
//   const name = "MovingAverage";
// };

const main = () => {
  console.log("Starting script...");

  // Block Data
  // {->
  let folderName = "blockData/";

  calculateInitialAmounts(blockHistoricalData);
  // calculateNoStrategyTVLs(blockHistoricalData, folderName);
  // calculateRandomTVLs(blockHistoricalData, folderName);
  // calculateNoPriceStrategyTVLs(blockHistoricalData, folderName);
  calculateNoPriceStrategyTVLsWithFeesAndBalance(
    blockHistoricalData,
    folderName
  );
  // calculateWithPriceStrategyTVLs(blockHistoricalData, folderName);
  // calculateDynamicThresholdStrategyTVLs(blockHistoricalData, folderName);
  // calculateShortAvgPriceStrategyTVLs(blockHistoricalData, folderName);
  // <-}

  // Strategies Server Data
  // {->
  folderName = "strategyData/";
  calculateInitialAmounts(blockHistoricalDataForStrategiesPeriod);

  currentWagmiPositionStable = 34.06856;
  currentWagmiPositionVolatile = 65.250773251395684889;
  currentSiloPositionCollateral = 66.801254;
  currentSiloPositionBorrowed = 66.994198384232506964;
  currentStableBalance = 0.00332;
  currentVolatileBalance = 0;
  currentShortAvgPrice = 0.50114019;

  // calculateNoPriceStrategyTVLs(
  //   blockHistoricalDataForStrategiesPeriod,
  //   folderName
  // );
  calculateNoPriceStrategyTVLsWithFeesAndBalance(
    blockHistoricalDataForStrategiesPeriod,
    folderName
  );
  // calculateNoPriceStrategyTVLsWithFeesAndBalanceForServerData(
  //   strategyNoPriceHistoricalData,
  //   folderName
  // );
  // calculateWithPriceStrategyTVLs(
  //   blockHistoricalDataForStrategiesPeriod,
  //   folderName
  // );
  // calculateDynamicThresholdStrategyTVLs(
  //   blockHistoricalDataForStrategiesPeriod,
  //   folderName
  // );
  // calculateShortAvgPriceStrategyTVLs(
  //   blockHistoricalDataForStrategiesPeriod,
  //   folderName
  // );
  // <-}

  console.log("\nStopping script...");
};

main();
