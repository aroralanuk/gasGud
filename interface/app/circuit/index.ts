import { Halo2Lib, Halo2Data } from "@axiom-crypto/halo2-js";
import { CircuitInputs } from "./constants";

export const circuit = async (
  halo2Lib: Halo2Lib,
  halo2Data: Halo2Data,
  { blockNumber, transactions }: CircuitInputs
) => {
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
    log
  } = halo2Lib;
  const { getTx } = halo2Data;
  const maxLength = 10;
  const numSamples = 4;

  const txLength = witness(transactions.length);
  const lastTxValue = transactions[transactions.length - 1].hex();

  for (let i = transactions.length; i < maxLength; i++) {
    transactions.push(getCircuitValue256(lastTxValue));
  }

  const txHi = transactions.map(tx => tx.hi());
  const txLo = transactions.map(tx => tx.lo());

  let totalGasPrice = witness(0);
  for (let i = 0; i < numSamples; i++) {
    //todo: implement random check here
    let index = witness(i);

    let hi = selectFromIdx(txHi, index);
    let lo = selectFromIdx(txLo, index);

    let txHash = getCircuitValue256FromHiLo(hi, lo);
    log(txHash);
    let singleTx = getTx(txHash);
    assertEqual(singleTx.blockNumber().toCircuitValue(), blockNumber);

    const gasPrice = singleTx.gasPrice().toCircuitValue();
    log(gasPrice);

    totalGasPrice = add(gasPrice, totalGasPrice);
  }

  let avgPrice = div(totalGasPrice, witness(numSamples));
  log(avgPrice);
  addToCallback(avgPrice);
};
