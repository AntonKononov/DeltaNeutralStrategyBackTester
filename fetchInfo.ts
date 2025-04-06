import fs from "fs";
import {
  WAGMI_FACTORY_ADDRESS,
  STABLE_TOKEN_ADDRESS,
  VOLATILE_TOKEN_ADDRESS,
  IS_STABLE_TOKEN_0,
  STABLE_TOKEN_DECIMALS,
  VOLATILE_TOKEN_DECIMALS,
} from "./utils/constants";
import { WagmiFactory } from "./utils/abi/WagmiFactory";
import { WagmiMultipool } from "./utils/abi/WagmiMultipool";
import { WagmiStrategyMultipool } from "./utils/abi/WagmiStrategyMultipool";
import { getContract } from "./utils/helpers";

interface StrategyInfo {
  poolAddress: string;
  poolFeeAmt: number;
  weight: number;
  tickSpacingOffset: number;
  positionRange: number;
  lowerTick: number;
  upperTick: number;
  lowerPrice: number;
  upperPrice: number;
  currentTick: number;
  currentSqrtRatioX96: number;
  currentTickPrice: number;
  currentSqrtRatioX96Price: number;
}

const saveDataToFile = (data: any[], fileName: string) => {
  try {
    const filePath = "./src/data";
    const fullFilePath = `${filePath}/${fileName}`;

    if (!fs.existsSync(filePath)) {
      fs.mkdirSync(filePath, { recursive: true });
    }

    let existingData = [];
    if (fs.existsSync(fullFilePath)) {
      const fileContent = fs.readFileSync(fullFilePath, "utf-8");
      existingData = JSON.parse(fileContent);
    }

    existingData.push({
      timestamp: Math.floor(Date.now() / 1000),
      data: data,
    });

    fs.writeFileSync(fullFilePath, JSON.stringify(existingData, null, 2));
    console.log(`Data saved to ${fullFilePath}`);
  } catch (error) {
    console.log("... ... Error saving data to JSON file:", error);
  }
};

const calculatePriceFromTick = (tick: number) => {
  const price = Math.pow(1.0001, tick);

  const price1 = IS_STABLE_TOKEN_0
    ? price * (10 ** STABLE_TOKEN_DECIMALS / 10 ** VOLATILE_TOKEN_DECIMALS)
    : price * (10 ** VOLATILE_TOKEN_DECIMALS / 10 ** STABLE_TOKEN_DECIMALS);

  return IS_STABLE_TOKEN_0 ? 1 / price1 : price1;
};

const calculatePriceFromSqrt = (sqrtRatioX96: number) => {
  const sqrtPrice = sqrtRatioX96 / Math.pow(2, 96);

  const price = sqrtPrice * sqrtPrice;

  const price1 = IS_STABLE_TOKEN_0
    ? price * (10 ** STABLE_TOKEN_DECIMALS / 10 ** VOLATILE_TOKEN_DECIMALS)
    : price * (10 ** VOLATILE_TOKEN_DECIMALS / 10 ** STABLE_TOKEN_DECIMALS);

  return IS_STABLE_TOKEN_0 ? 1 / price1 : price1;
};

const fetchInfo = async () => {
  const wagmiFactory = getContract(WagmiFactory, WAGMI_FACTORY_ADDRESS);

  const wagmiMultipoolAddress = await wagmiFactory.getmultipool(
    STABLE_TOKEN_ADDRESS,
    VOLATILE_TOKEN_ADDRESS
  );

  const wagmiMultipool = getContract(WagmiMultipool, wagmiMultipoolAddress);

  const wagmiMultipoolStrategyAddress = await wagmiMultipool.strategy();

  const wagmiMultipoolStrategy = getContract(
    WagmiStrategyMultipool,
    wagmiMultipoolStrategyAddress
  );

  const multipoolStrategyStrategySize =
    await wagmiMultipoolStrategy.strategySize();

  const multipoolStrategyPositions =
    await wagmiMultipoolStrategy.getPositionsFromStrategy();

  const strategyInfo: StrategyInfo[] = [];
  for (let i = 0; i < Number(multipoolStrategyStrategySize); i++) {
    const currentStrategyInfo = await wagmiMultipoolStrategy.getStrategyAt(i);

    const lowerTick = Number(multipoolStrategyPositions[1][i][0]);
    const upperTick = Number(multipoolStrategyPositions[1][i][1]);
    const currentTick = Number(multipoolStrategyPositions[0][i][0]);
    const currentSqrtRatioX96 = Number(multipoolStrategyPositions[0][i][1]);

    strategyInfo.push({
      poolAddress: multipoolStrategyPositions[1][i][4].toString(),
      poolFeeAmt: Number(currentStrategyInfo[2]),
      weight: Number(currentStrategyInfo[3]),
      tickSpacingOffset: Number(currentStrategyInfo[0]),
      positionRange: Number(currentStrategyInfo[1]),
      lowerTick: lowerTick,
      upperTick: upperTick,
      lowerPrice: calculatePriceFromTick(lowerTick),
      upperPrice: calculatePriceFromTick(upperTick),
      currentTick: currentTick,
      currentSqrtRatioX96: currentSqrtRatioX96,
      currentTickPrice: calculatePriceFromTick(currentTick),
      currentSqrtRatioX96Price: calculatePriceFromSqrt(currentSqrtRatioX96),
    });
  }

  saveDataToFile(strategyInfo, "StrategyInfo.json");

  console.log("--------- Multipool Info ---------");
  console.log("wagmiMultipoolAddress", wagmiMultipoolAddress);
  console.log("wagmiMultipoolStrategyAddress", wagmiMultipoolStrategyAddress);
  console.log("\n Strategy info");
  console.log("multipoolStrategyStrategySize", multipoolStrategyStrategySize);
  console.log("strategyInfo", strategyInfo);
};

const main = () => {
  console.log("Starting script...");

  fetchInfo();
};

main();
