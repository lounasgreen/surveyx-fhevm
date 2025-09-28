import type { FhevmInstance } from "@zama-fhe/relayer-sdk/bundle";
import type { FhevmInstanceConfig } from "@zama-fhe/relayer-sdk/web";
import type { HandleContractPair } from "@zama-fhe/relayer-sdk/bundle";
import type { DecryptedResults } from "@zama-fhe/relayer-sdk/bundle";

export type { FhevmInstance, FhevmInstanceConfig, HandleContractPair, DecryptedResults };

export type FhevmDecryptionSignatureType = {
  publicKey: string;
  privateKey: string;
  signature: string;
  startTimestamp: number; // Unix timestamp in seconds
  durationDays: number;
  userAddress: `0x${string}`;
  contractAddresses: `0x${string}`[];
  eip712: EIP712Type;
};

export type EIP712Type = {
  domain: {
    chainId: number;
    name: string;
    verifyingContract: `0x${string}`;
    version: string;
  };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  message: any;
  primaryType: string;
  types: {
    [key: string]: {
      name: string;
      type: string;
    }[];
  };
};

export type FhevmRelayerSDKType = {
  initSDK: (options?: FhevmInitSDKOptions) => Promise<boolean>;
  createInstance: (config: FhevmInstanceConfig) => Promise<FhevmInstance>;
  SepoliaConfig: {
    aclContractAddress: `0x${string}`;
    inputVerifierContractAddress: `0x${string}`;
    kmsContractAddress: `0x${string}`;
    gatewayChainId: number;
    verifyingContractAddressDecryption: `0x${string}`;
    verifyingContractAddressInputVerification: `0x${string}`;
  };
  __initialized__?: boolean;
};

export type FhevmWindowType = Window & {
  relayerSDK: FhevmRelayerSDKType;
};

export type FhevmInitSDKOptions = {
  debug?: boolean;
};

export type FhevmInitSDKType = (options?: FhevmInitSDKOptions) => Promise<boolean>;
export type FhevmLoadSDKType = () => Promise<void>;
