# GasGud contracts

## Contracts

```ml
src
├─ interfaces
│  ├─ IERC20 — "OZ IERC20 interface"
├─ libraries
│  ├─ Position — "library for managing positions"
│  ├─ IAxiomV2Client — "client interface for axiom V2 callback"
├─ ClearingHouse — "external functions for a perpetual futures contract"
├─ GasOracle — "gas oracle contract for posting and querying gas prices"
```

## Usage

To build the contracts:

```shell
$ git clone git@github.com:aroralanuk/gasGud.git
$ cd gasGud/contracts
$ forge install
```

### Test

```shell
$ forge test
```

### Format

```shell
$ forge fmt
```

### Gas Snapshots

```shell
$ forge snapshot
```

### Anvil

```shell
$ anvil
```

### Deploy

```shell
$ forge script script/Counter.s.sol:CounterScript --rpc-url <your_rpc_url> --private-key <your_private_key>
```

### Cast

```shell
$ cast <subcommand>
```

### Help

```shell
$ forge --help
$ anvil --help
$ cast --help
```
