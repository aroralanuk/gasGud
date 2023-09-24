"use client";

import { wrap, Remote } from "comlink";
import { useRef, useEffect, useState } from "react";
import {
  AxiomV2Callback,
  AxiomV2ComputeQuery,
} from "@axiom-crypto/experimental";
import { Circuit } from "./worker";
import { config, defaultInputs, vk } from "./circuit/constants";
import { keccak256, toHex } from "viem";
import { ConnectKitButton } from "connectkit";
import { writeContract } from "wagmi/actions";
import { buildSendQuery } from "@/shared/axiom";
import { convertToBytes32 } from "@/shared/utils";
import "@uniswap/widgets/fonts.css";
import WidgetCard from "../components/Card";
import { Affix, Button, Center } from "@mantine/core";

const providerUri = `https://eth-goerli.g.alchemy.com/v2/${process.env.NEXT_PUBLIC_ALCHEMY_KEY}`;

export default function Home() {
  const [input, setInput] = useState<string>(JSON.stringify(defaultInputs));
  const [callbackAddr, setCallbackAddr] = useState<string>(
    "0xDD1156315Fc4cCC942d5f8303F9A28c92Cf0B2fe"
  );
  const [functionSignature, setFunctionSignature] = useState<string>(
    "axiomV2Callback(uint64,address,bytes32,bytes32,bytes32[],bytes)"
  );
  const [callbackExtraData, setCallbackExtraData] = useState<string>("0x0");

  const workerApi = useRef<Remote<Circuit>>();
  useEffect(() => {
    const setupWorker = async () => {
      const worker = new Worker(new URL("./worker", import.meta.url), {
        type: "module",
      });
      const Halo2Circuit = wrap<typeof Circuit>(worker);
      workerApi.current = await new Halo2Circuit(process.env
        .NEXT_PUBLIC_PROVIDER_URI as string);
      await workerApi.current.setup(window.navigator.hardwareConcurrency);
    };
    setupWorker();
  }, []);

  const generateAndSendQuery = async () => {
    console.log("Generating proof...", workerApi.current, input);
    const res = await workerApi.current!.getComputeProof(input);
    if (!res) throw new Error("Failed to generate proof");
    const { computeProof, resultLen } = res;

    const compute: AxiomV2ComputeQuery = {
      k: config.k,
      vkey: convertToBytes32(new Uint8Array(vk)),
      computeProof: computeProof.toString(),
    };

    let callbackFunctionSelector =
      functionSignature && functionSignature.length > 0
        ? keccak256(toHex(functionSignature)).slice(0, 10)
        : "0x00000000";
    const callback: AxiomV2Callback = {
      callbackAddr,
      callbackFunctionSelector,
      resultLen,
      callbackExtraData,
    };

    const builtQuery = await buildSendQuery(providerUri, { compute, callback });

    const { hash } = await writeContract(builtQuery);

    console.log(`Sent query: https://goerli.etherscan.io/tx/${hash}`);
  };

  return (
    <div className="flex flex-col items-center justify-center py-2 margin-auto">
      {/* <ConnectKitButton />
      <div className="flex gap-2">
        <button
          onClick={generateAndSendQuery}
          className="border py-2 px-4 rounded"
        >
          Build and Send Query (on Goerli)
        </button>
      </div>
      <div className="flex flex-col">
        <label htmlFor="input" className="mr-2">
          Circuit inputs:
        </label>
        <textarea
          id="input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="px-1 border rounded"
        />
      </div>
      <div className="flex flex-col gap-2">
        <div className="flex flex-col">
          <label htmlFor="callbackAddr" className="mr-2">
            Callback Address:
          </label>
          <textarea
            id="callbackAddr"
            value={callbackAddr}
            onChange={(e) => setCallbackAddr(e.target.value)}
            className="px-1 border rounded"
          />
        </div>
        <div className="flex flex-col">
          <label htmlFor="callbackFunctionSelector" className="mr-2">
            Callback Function Selector:
          </label>
          <textarea
            id="callbackFunctionSelector"
            value={functionSignature}
            onChange={(e) => setFunctionSignature(e.target.value)}
            className="px-1 border rounded"
          />
        </div>
        <div className="flex flex-col">
          <label htmlFor="callbackExtraData" className="mr-2">
            Callback Extra Data:
          </label>
          <textarea
            id="callbackExtraData"
            value={callbackExtraData}
            onChange={(e) => setCallbackExtraData(e.target.value)}
            className="px-1 border rounded"
          />
        </div>
      </div>
      <div className="semi-bold">
        Open Developer Console to see logs and outputs!
      </div> */}
      <WidgetCard />

      <Affix position={{ bottom: 20, right: 20 }}>
        <Button
          variant="filled"
          fullWidth
          color="black"
          onClick={generateAndSendQuery}
        >
          Update Gas Oracle for block number 9202201
        </Button>
      </Affix>
    </div>
  );
}
