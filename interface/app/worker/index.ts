import { convertToBytes } from "@/shared/utils";
import { CircuitRunner, CircuitScaffold } from "@axiom-crypto/halo2-js";
import { expose } from "comlink";
import { circuit } from "../circuit";
import {
  CircuitInputs,
  ModifiedInputs,
  config,
  vk,
} from "../circuit/constants";

export class Circuit extends CircuitScaffold {
  constructor(provider?: string) {
    super(provider);
  }

  async buildCircuit(inputs: ModifiedInputs) {
    await CircuitRunner(this.halo2wasm, this.config, this.provider).run(
      circuit,
      inputs
    );
    super.assignPublicInstances();
  }

  async newCircuit() {
    super.newCircuitFromConfig(config);
    await super.loadParamsAndVk(new Uint8Array(vk));
  }

  async getComputeProof(inputs: string) {
    await this.newCircuit();
    let circuitInputs: CircuitInputs;
    let modifiedInputs: ModifiedInputs;
    try {
      circuitInputs = JSON.parse(inputs);
      modifiedInputs = JSON.parse(inputs);
      modifiedInputs.transactions = circuitInputs.transactions.join("");
    } catch (error) {
      console.error(error);
      return;
    }
    await this.buildCircuit(modifiedInputs);
    console.time("Proving");
    this.prove();
    console.timeEnd("Proving");

    const proof = this.getProof();
    const publicInstances = this.getCallbackData();
    const publicInstancesBytes =
      "0x" +
      publicInstances
        .map((instance) => instance.slice(2).padStart(64, "0"))
        .join("");
    const computeProof = publicInstancesBytes + convertToBytes(proof);
    return { computeProof, resultLen: publicInstances.length / 2 };
  }
}

expose(Circuit);
