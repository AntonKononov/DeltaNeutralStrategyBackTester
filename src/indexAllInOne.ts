import fs from "fs";
import { Contract, ethers } from "ethers";

import { WagmiFactory } from "./utils/abi/WagmiFactory";
import { WagmiMultipool } from "./utils/abi/WagmiMultipool";
import { WagmiStrategyMultipool } from "./utils/abi/WagmiStrategyMultipool";

const STABLE_TOKEN_ADDRESS = "0x29219dd400f2Bf60E5a23d13Be72B486D4038894";
const VOLATILE_TOKEN_ADDRESS = "0x039e2fB66102314Ce7b64Ce5Ce3E5183bc94aD38";

const IS_STABLE_TOKEN_0 =
  STABLE_TOKEN_ADDRESS.toLowerCase() < VOLATILE_TOKEN_ADDRESS.toLowerCase();

const STABLE_TOKEN_DECIMALS = 6;
const VOLATILE_TOKEN_DECIMALS = 18;

const PROVIDER_URL = "https://rpc.soniclabs.com/";

const WAGMI_FACTORY_ADDRESS = "0x86fd613d79cea7ce51defd31bfcf68adbf4038fa";

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

const getProvider = (): ethers.JsonRpcProvider => {
  const provider = new ethers.JsonRpcProvider(PROVIDER_URL);

  return provider;
};

const getContract = (abi: any[], target: string): Contract => {
  const contract = new Contract(target, abi, getProvider());

  return contract;
};

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
