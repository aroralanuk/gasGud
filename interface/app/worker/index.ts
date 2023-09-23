import { CircuitScaffold, CircuitRunner } from '@axiom-crypto/halo2-js';
import { expose } from 'comlink';
import { vk, config, CircuitInputs } from '../circuit/constants';
import { circuit } from '../circuit';
import { convertToBytes } from '@/shared/utils';

export class Circuit extends CircuitScaffold {
    constructor(provider?: string) {
        super(provider);
    }

    async buildCircuit(inputs: CircuitInputs) {
        await CircuitRunner(this.halo2wasm, this.config, this.provider).run(circuit, inputs);
        super.assignPublicInstances();
    }

    async newCircuit() {
        super.newCircuitFromConfig(config);
        await super.loadParamsAndVk(new Uint8Array(vk));
    }

    async getComputeProof(inputs: string) {
        await this.newCircuit();
        let circuitInputs: CircuitInputs;
        try {
            circuitInputs = JSON.parse(inputs);
        } catch (error) {
            console.error(error);
            return;
        }
        await this.buildCircuit(circuitInputs);
        console.time("Proving")
        this.prove();
        console.timeEnd("Proving");

        const proof = this.getProof();
        const publicInstances = this.getCallbackData();
        const publicInstancesBytes = "0x" + publicInstances.map((instance) => instance.slice(2).padStart(64, "0")).join("");
        const computeProof = publicInstancesBytes + convertToBytes(proof);
        return { computeProof, resultLen: publicInstances.length / 2 };
    }
}

expose(Circuit);