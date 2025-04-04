import { Contract, ethers, Wallet } from "ethers";
import { PROVIDER_URL } from "../utils/constants";

export const getProvider = (): ethers.JsonRpcProvider => {
  const provider = new ethers.JsonRpcProvider(PROVIDER_URL);

  return provider;
};

export const getContract = (abi: any[], target: string): Contract => {
  const contract = new Contract(target, abi, getProvider());

  return contract;
};
