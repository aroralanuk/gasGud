import { Halo2Data, Halo2Lib } from "@axiom-crypto/halo2-js";
import { CircuitValue256 } from "@axiom-crypto/halo2-js/halo2lib/CircuitValue256";
import { ModifiedInputs } from "./constants";

export const circuit = async (
  halo2Lib: Halo2Lib,
  halo2Data: Halo2Data,
  // inputs: { [key: string]: string | number | bigint }
  { blockNumber, transactions }: ModifiedInputs
) => {
  // const { blockNumber, transactions } = inputs;
  const {
    witness,
    getCircuitValue256FromHiLo,
    getCircuitValue256,
    add,
    and,
    or,
    select,
    selectFromIdx,
    assertEqual,
    div,
    addToCallback,
    log,
  } = halo2Lib;
  const { getTx } = halo2Data;
  const maxLength = 10;
  const numSamples = 4;

  const transactionsCircuit: CircuitValue256[] = [];

  let txArray: string[] = transactions.split("0x");

  const txLength = witness(txArray.length);
  let lastTxValue;

  for (let i = 0; i < maxLength; i++) {
    lastTxValue = i < txArray.length ? txArray[i] : txArray[txArray.length - 1];
    transactionsCircuit.push(getCircuitValue256(lastTxValue));
  }

  const txHi = transactionsCircuit.map((tx) => tx.hi());
  const txLo = transactionsCircuit.map((tx) => tx.lo());

  let totalGasPrice = witness(0);
  for (let i = 0; i < numSamples; i++) {
    //todo: implement random check here
    let index = witness(i);

    let hi = selectFromIdx(txHi, index);
    let lo = selectFromIdx(txLo, index);

    let txHash = getCircuitValue256FromHiLo(hi, lo);
    log(txHash);
    let singleTx = getTx(txHash);
    assertEqual(singleTx.blockNumber().toCircuitValue(), witness(blockNumber));

    const gasPrice = singleTx.gasPrice().toCircuitValue();
    log(gasPrice);

    totalGasPrice = add(gasPrice, totalGasPrice);
  }

  let avgPrice = div(totalGasPrice, witness(numSamples));
  log(avgPrice);
  addToCallback(avgPrice);
};
