import { ethers } from "ethers";

export interface ConnectionData {
    walletAddress: string,
    signer: ethers.providers.JsonRpcSigner | null
}