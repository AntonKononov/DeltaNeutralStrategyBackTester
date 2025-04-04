import * as dotenv from "dotenv";

dotenv.config();

export const STABLE_TOKEN_ADDRESS =
  "0x29219dd400f2Bf60E5a23d13Be72B486D4038894";
export const VOLATILE_TOKEN_ADDRESS =
  "0x039e2fB66102314Ce7b64Ce5Ce3E5183bc94aD38";

export const IS_STABLE_TOKEN_0 =
  STABLE_TOKEN_ADDRESS.toLowerCase() < VOLATILE_TOKEN_ADDRESS.toLowerCase();

export const STABLE_TOKEN_DECIMALS = 6;
export const VOLATILE_TOKEN_DECIMALS = 18;

export const PROVIDER_URL = `${process.env.RPC_API_URL}${process.env.RPC_API_KEY}`;

export const WAGMI_FACTORY_ADDRESS = process.env.WAGMI_FACTORY_ADDRESS!;
export const WAGMI_DISPATCHER_ADDRESS = process.env.WAGMI_DISPATCHER_ADDRESS1;
