import { DataSubquery } from "@axiom-crypto/codec";
import { Axiom, AxiomConfig, AxiomV2Callback, AxiomV2ComputeQuery, QueryV2 } from "@axiom-crypto/experimental";
import { parseEther } from "viem";

export const useAxiom = (providerUri: string) => {
    const axiomConfig: AxiomConfig = {
        providerUri: providerUri,
        version: "v2",
        chainId: 5,
    };
    const axiom = new Axiom(axiomConfig);
    const axiomQueryAddress = axiom.getAxiomQueryAddress();
    const axiomAbi = axiom.getAxiomQueryAbi();
    return {
        axiom,
        axiomQueryAddress,
        axiomAbi
    }
}

export const buildSendQuery = async (providerUri: string, { compute, callback }: { compute: AxiomV2ComputeQuery, callback: AxiomV2Callback }) => {

    const { axiom, axiomQueryAddress, axiomAbi } = useAxiom(providerUri);
    const query = axiom.query as QueryV2;
    const qb = query.new([], compute, callback);
    const {
        dataQueryHash,
        dataQuery,
        computeQuery,
        callback: callbackQuery,
        maxFeePerGas,
        callbackGasLimit,
        sourceChainId
    } = await qb.build();

    return ({
        address: axiomQueryAddress as `0x${string}`,
        abi: axiomAbi,
        functionName: 'sendQuery',
        value: parseEther('0.03'),
        args: [sourceChainId, dataQueryHash, computeQuery, callbackQuery, maxFeePerGas, callbackGasLimit, dataQuery],
    });

}