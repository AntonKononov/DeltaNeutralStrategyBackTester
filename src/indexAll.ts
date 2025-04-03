import fs from "fs";

// import { historicalData as blockHistoricalData } from "./data/initialData/MultipoolHistoricalInfo_python_1903_2";
import { historicalData as blockHistoricalData } from "./data/initialData/MultipoolHistoricalInfo_python_1903_3";
// import { historicalData as blockHistoricalData } from "./data/initialData/2903-3103";

import { historicalData as blockHistoricalDataForStrategiesPeriod } from "./data/initialData/WagmiMultipoolHistoricalInfoForStrategiesPeriod";
import { historicalData as strategyNoPriceHistoricalData } from "./data/initialData/deltaNeutralStrategyNoPriceInfo5Percent";
import { historicalData as strategyWithPriceHistoricalData } from "./data/initialData/deltaNeutralStrategyWithPriceInfo";
import { historicalData as strategyDynamicThresholdHistoricalData } from "./data/initialData/deltaNeutralStrategyDynamicThresholdInfo";

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
const WAGMI_APR = 150;
const WAGMI_FEES = WAGMI_APR / (SECONDS_IN_A_YEAR * MAX_BP);
const SILO_APR = 7;
const SILO_FEES = SILO_APR / (SECONDS_IN_A_YEAR * MAX_BP);

let REBALANCE_THRESHOLD = 10;
const PRICE_THRESHOLD = 3;
const MIN_REBALANCE_THRESHOLD = 3;
const SLIPPAGE = 0.1;
const PROFIT_REBALANCE_PERCENTAGE = 0.98;

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

const hardcodeInitialAmounts = (
  historicalData: any[],
  siloHardCodeAmount: number
) => {
  const initialData = historicalData[0];

  const [stableStr, volatileStr] = initialData.rate.split("/");
  const stableRatio = parseFloat(stableStr);
  const volatileRatio = parseFloat(volatileStr);

  currentShortAvgPrice = Number(initialData.volatilePrice);
  currentSiloPositionBorrowed = siloHardCodeAmount;
  currentSiloPositionCollateral =
    (currentSiloPositionBorrowed * currentShortAvgPrice * MAX_BP) /
    SILO_SAFE_LTV;

  const forWagmi =
    INITIAL_POSITION_AMOUNT +
    currentSiloPositionBorrowed * currentShortAvgPrice -
    currentSiloPositionCollateral;
  currentWagmiPositionVolatile =
    (forWagmi * (volatileRatio / MAX_BP)) / currentShortAvgPrice;
  currentWagmiPositionStable = (forWagmi * stableRatio) / MAX_BP;
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

const calculateWagmiDeviationNew = (
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

const calculateNoStrategyTVLs = (
  historicalData: any[],
  folderName: string,
  useHardCodeSilo: boolean = false
) => {
  const name = "NoStrategy";
  const poolTvlData: { timestamp: number; tvl: number }[] = [];
  const tvlData: TvlData[] = [];

  let wagmiPositionStable = currentWagmiPositionStable;
  let wagmiPositionVolatile = currentWagmiPositionVolatile;
  let siloPositionCollateral = currentSiloPositionCollateral;
  let siloPositionBorrowed = currentSiloPositionBorrowed;
  let shortAvgPrice = currentShortAvgPrice;

  historicalData.forEach((data, index) => {
    let currentStablePrice = Number(data.stablePrice);
    let currentVolatilePrice = Number(data.volatilePrice);

    if (index !== 0) {
      const timeDifference = Number(
        data.timestamp - historicalData[index - 1].timestamp
      );

      const [wagmiStableDeviation, wagmiVolatileDeviation] =
        calculateWagmiDeviation(data, historicalData[index - 1]);

      wagmiPositionStable *= wagmiStableDeviation;
      wagmiPositionVolatile *= wagmiVolatileDeviation;

      siloPositionBorrowed += siloPositionBorrowed * SILO_FEES * timeDifference;
    }

    const poolTvl =
      wagmiPositionStable +
      (wagmiPositionVolatile * currentVolatilePrice) / currentStablePrice;

    poolTvlData.push({
      timestamp: data.timestamp,
      tvl: poolTvl,
    });

    const tvl =
      poolTvl +
      siloPositionCollateral -
      (siloPositionBorrowed * currentVolatilePrice) / currentStablePrice;

    tvlData.push({
      timestamp: data.timestamp,
      tvl: tvl,
      wagmiPositionStable: wagmiPositionStable,
      wagmiPositionVolatile: wagmiPositionVolatile,
      siloPositionCollateral: siloPositionCollateral,
      siloPositionBorrowed: siloPositionBorrowed,
      stableBalance: 0,
      volatileBalance: 0,
      stablePrice: currentStablePrice,
      volatilePrice: currentVolatilePrice,
      shortAvgPrice: shortAvgPrice,
      isRebalanceExecuted: false,
    });
  });

  // console.table(tvlData);
  saveDataToFile(
    poolTvlData,
    folderName,
    `HistoricalInfoTvls${name}${
      useHardCodeSilo ? `Silo${currentSiloPositionBorrowed}` : ""
    }Pool.json`
  );
  saveDataToFile(
    tvlData,
    folderName,
    `HistoricalInfoTvls${name}${
      useHardCodeSilo ? `Silo${currentSiloPositionBorrowed}` : ""
    }.json`
  );
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

    let currentStableFee = 0;
    let currentVolatileFee = 0;
    let isRebalanceNecessary = false;
    if (index !== 0) {
      const timeDifference = Number(
        data.timestamp - historicalData[index - 1].timestamp
      );

      const curentRate = parseRate(data.rate);
      const previoustRate = parseRate(historicalData[index - 1].rate);

      // currentStableFee =
      //   (wagmiPositionStable * WAGMI_FEES * timeDifference) / 2;
      // stableFees += currentStableFee;

      // currentVolatileFee =
      //   (wagmiPositionVolatile * WAGMI_FEES * timeDifference) / 2;
      // volatileFees += currentVolatileFee;

      const [wagmiStableDeviation, wagmiVolatileDeviation] =
        calculateWagmiDeviationNew(data, historicalData[index - 1]);

      wagmiPositionStable *= wagmiStableDeviation;
      wagmiPositionVolatile *= wagmiVolatileDeviation;

      siloPositionBorrowed += siloPositionBorrowed * SILO_FEES * timeDifference;

      const isRebalanceDown = wagmiPositionVolatile > siloPositionBorrowed;
      const volatileHedgeDifference = isRebalanceDown
        ? wagmiPositionVolatile - siloPositionBorrowed
        : siloPositionBorrowed - wagmiPositionVolatile;

      if (useHistoricalData) {
        isRebalanceNecessary =
          volatileHedgeDifference >=
            (siloPositionBorrowed * REBALANCE_THRESHOLD) / MAX_BP &&
          (withRandom ? Math.random() > PROFIT_REBALANCE_PERCENTAGE : true);
      } else {
        isRebalanceNecessary =
          data.siloCollateral !== historicalData[index - 1].siloCollateral;
      }

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

        if (withRandom) {
          stableBalance += feesInStableForUsers + slippageAmount;
        } else {
          const random = Math.random();
          stableBalance += feesInStableForUsers + slippageAmount * random;
        }
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
};

const calculateWithPriceStrategyTVLs = (
  historicalData: any[],
  folderName: string,
  useHistoricalData: boolean = true,
  withRandom: boolean = false
) => {
  const name = useHistoricalData ? "WithPrice" : "WithPriceForServerData";
  const tvlData: TvlData[] = [];

  let wagmiPositionStable = currentWagmiPositionStable;
  let wagmiPositionVolatile = currentWagmiPositionVolatile;
  let siloPositionCollateral = currentSiloPositionCollateral;
  let siloPositionBorrowed = currentSiloPositionBorrowed;
  let stableBalance = currentStableBalance;
  let volatileBalance = currentVolatileBalance;
  let shortAvgPrice = currentShortAvgPrice;
  let lastRebalancePrice = currentShortAvgPrice;

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

      if (useHistoricalData) {
        let sizeDiffrence =
          volatileHedgeDifference >=
          (siloPositionBorrowed * REBALANCE_THRESHOLD) / MAX_BP;

        let priceDifference =
          (currentVolatilePrice > lastRebalancePrice
            ? currentVolatilePrice - lastRebalancePrice
            : lastRebalancePrice - currentVolatilePrice) >=
          (lastRebalancePrice * PRICE_THRESHOLD) / MAX_BP;

        isRebalanceNecessary =
          sizeDiffrence &&
          priceDifference &&
          (withRandom ? Math.random() > PROFIT_REBALANCE_PERCENTAGE : true);
      } else {
        isRebalanceNecessary =
          data.siloCollateral !== historicalData[index - 1].siloCollateral;
      }

      if (isRebalanceNecessary) {
        const volatileHedgeDifferenceInStable =
          (volatileHedgeDifference * currentVolatilePrice) / currentStablePrice;

        rebalancesExecuted += 1;
        volatileSwapVolume += volatileHedgeDifference;
        volatileSwapVolumeInStable += volatileHedgeDifferenceInStable;
        lastRebalancePrice = currentVolatilePrice;

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
  folderName: string,
  useHistoricalData: boolean = true,
  withRandom: boolean = false
) => {
  const name = useHistoricalData
    ? "DynamicThreshold"
    : "DynamicThresholdForServerData";
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

      if (useHistoricalData) {
        isRebalanceNecessary =
          volatileHedgeDifference >=
            (siloPositionBorrowed *
              getDynamicThreshold(
                data.wagmiReserveStable,
                data.wagmiReserveVolatile,
                currentVolatilePrice
              )) /
              MAX_BP &&
          (withRandom ? Math.random() > PROFIT_REBALANCE_PERCENTAGE : true);
      } else {
        isRebalanceNecessary =
          data.siloCollateral !== historicalData[index - 1].siloCollateral;
      }

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
};

const calculateShortAvgPriceStrategyTVLs = (
  historicalData: any[],
  folderName: string,
  useHistoricalData: boolean = true,
  withRandom: boolean = false
) => {
  const name = useHistoricalData
    ? "ShortAvgPrice"
    : "ShortAvgPriceForServerData";
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

    let currentStableFee = 0;
    let currentVolatileFee = 0;
    let isRebalanceExecuted = false;
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

      let isRebalanceNecessary = false;
      if (useHistoricalData) {
        isRebalanceNecessary =
          volatileHedgeDifference >=
            (siloPositionBorrowed * REBALANCE_THRESHOLD) / MAX_BP &&
          (withRandom ? Math.random() > PROFIT_REBALANCE_PERCENTAGE : true);
      } else {
        isRebalanceNecessary =
          data.siloCollateral !== historicalData[index - 1].siloCollateral;
      }

      if (isRebalanceNecessary) {
        const volatileHedgeDifferenceInStable =
          (volatileHedgeDifference * currentVolatilePrice) / currentStablePrice;

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
          isRebalanceExecuted = true;
          rebalancesExecuted += 1;
          volatileSwapVolume += volatileHedgeDifference;
          volatileSwapVolumeInStable += volatileHedgeDifferenceInStable;

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
        } else if (currentVolatilePrice < shortAvgPrice) {
          isRebalanceExecuted = true;
          rebalancesExecuted += 1;
          volatileSwapVolume += volatileHedgeDifference;
          volatileSwapVolumeInStable += volatileHedgeDifferenceInStable;

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
      isRebalanceExecuted: isRebalanceExecuted,
    });
  });

  console.log(`... ${name} - ${REBALANCE_THRESHOLD}%`);
  console.log("... rebalancesExecuted", rebalancesExecuted);
  console.log("... volatileSwapVolume", volatileSwapVolume);
  console.log("... volatileSwapVolumeInStable", volatileSwapVolumeInStable);
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
};

// const calculateMovingAverageStrategyTVLs = () => {
//   const name = "MovingAverage";
// };

const startBT = (
  data: any[],
  folderName: string,
  useHistoricalData: boolean = true,
  withRandom: boolean = false
) => {
  calculateInitialAmounts(data);

  calculateNoPriceStrategyTVLs(data, folderName, useHistoricalData, withRandom);
  // calculateWithPriceStrategyTVLs(
  //   data,
  //   folderName,
  //   useHistoricalData,
  //   withRandom
  // );
  // calculateDynamicThresholdStrategyTVLs(
  //   data,
  //   folderName,
  //   useHistoricalData,
  //   withRandom
  // );
  // calculateShortAvgPriceStrategyTVLs(
  //   data,
  //   folderName,
  //   useHistoricalData,
  //   withRandom
  // );
};

const main = () => {
  console.log("Starting script...");

  // // No Strategy HardCode Silo Position
  // // {->
  // {
  //   let folderName = "blockData/hardcode";

  //   [40, 50, 60, 70].map((value) => {
  //     hardcodeInitialAmounts(blockHistoricalData, value);
  //     calculateNoStrategyTVLs(blockHistoricalData, folderName, true);
  //   });
  //   return;
  // }
  // // <-}

  // // No Strategy
  // // {->
  // {
  //   let folderName = "blockData";
  //   calculateInitialAmounts(blockHistoricalData);
  //   calculateNoStrategyTVLs(blockHistoricalData, folderName);
  // }
  // // <-}

  // // Block Data
  // // {->
  // {
  //   console.log("... Vadym Block Data ...");
  //   let folderName = "blockData/NoRandom";
  //   [2, 5, 7].map((value) => {
  //     console.log("\n");
  //     REBALANCE_THRESHOLD = value;
  //     startBT(blockHistoricalData, folderName);
  //   });
  // }
  // // <-}

  // // Block Data With random
  // // {->
  // {
  //   console.log("\n... Vadym Block Data With Random ...");
  //   let folderName = "blockData/WithRandom";
  //   [2, 5, 7].map((value) => {
  //     console.log("\n");
  //     REBALANCE_THRESHOLD = value;
  //     startBT(blockHistoricalData, folderName, true, true);
  //   });
  // }
  // // <-}

  // // Strategies Server Data
  // // {->
  // {
  //   console.log("\n... Strategies Server Data ...");
  //   let folderName = "strategyData/NoRandom";
  //   startBT(blockHistoricalDataForStrategiesPeriod, folderName);
  // }
  // // <-}

  // // Strategies Server Data With random
  // // {->
  // {
  //   console.log("\n... Strategies Server Data With Random ...");
  //   let folderName = "strategyData/WithRandom";

  //   startBT(blockHistoricalDataForStrategiesPeriod, folderName, true, true);
  // }
  // // <-}

  // // Strategies Server Strategies Data
  // // {->
  // {
  console.log("\n... Strategies Server Strategies Data ...");
  let folderName = "strategyDataWithServerStrategiesData";
  REBALANCE_THRESHOLD = 5;
  calculateInitialAmounts(strategyNoPriceHistoricalData, false);
  calculateNoPriceStrategyTVLs(
    strategyNoPriceHistoricalData,
    folderName,
    false
  );

  //   calculateInitialAmounts(strategyWithPriceHistoricalData, false);
  //   calculateWithPriceStrategyTVLs(
  //     strategyWithPriceHistoricalData,
  //     folderName,
  //     false
  //   );

  //   calculateInitialAmounts(strategyDynamicThresholdHistoricalData, false);
  //   calculateDynamicThresholdStrategyTVLs(
  //     strategyDynamicThresholdHistoricalData,
  //     folderName,
  //     false
  //   );

  //   calculateInitialAmounts(strategyNoPriceHistoricalData, false);
  //   calculateShortAvgPriceStrategyTVLs(
  //     strategyNoPriceHistoricalData,
  //     folderName,
  //     false
  //   );
  // }
  // // <-}

  console.log("\nStopping script...");
};

main();
