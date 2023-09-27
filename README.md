## GasGud

Perpectual futures on verifiable gas prices using SNARK-proofs with Axiom

Note: The [ethnyc](https://github.com/aroralanuk/gasGud/tree/ethnyc) branch contains the work done during EthGlobal hackathon until 9am 24th Sept. The main branch is the latest version.

### Background

Commoditiies like oil and gold have greatly benefitted from a liquid derivative market over the last few decades. One can draw comparisons to the ethereum gas used to meter resource consumption in the Ethereum Virtual Machine today, ie, they are both easier to trade with derivative products rather than spot becuase of the physical settlement of the underlying asset. On one side you have L2 sequencers, oracles, AA bundlers, exchanges who have time-critical onchain processes and want less volatile gas prices and on the other hand, there are the suppliers of blockspace, PBS searchers and builders, who will likely be on the short side.
As a early proof of concept, I built a gas oracle for Ethereum Goerli using Axiom for verifiably querying the average gas price for previously committed specific block. This gas price is then used as index price for the perp contract which is settled in ETH right now. The funding rate is based on the relatively reserves of the long vs short positions in the contract.

### Contracts

Go to [Contracts](https://github.com/aroralanuk/gasGud/tree/main/contracts) subfolder for Solidity contracts.

### Interface

Go to [Interface](https://github.com/aroralanuk/gasGud/tree/main/interface) subfolder for the app interface.
