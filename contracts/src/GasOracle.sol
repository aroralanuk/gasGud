// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import {IAxiomV2Client} from "./IAxiomV2Client.sol";

contract GasOracle is IAxiomV2Client {
    event GasPriceUpdated(uint256 indexed blockNumber, uint256 indexed gasPrice);

    uint32 oracleLatest;
    uint32 oracleUpdateInterval;
    uint64 callbackSourceChainId;
    mapping(uint32 => uint256) public gasPrice;
    bytes32 public axiomCallbackQuerySchema;

    constructor(bytes32 _axiomCallbackQuerySchema, uint32 _oracleUpdateInterval) {
        axiomCallbackQuerySchema = _axiomCallbackQuerySchema;
        oracleUpdateInterval = _oracleUpdateInterval;
        callbackSourceChainId = 5;
    }

    function axiomV2Callback(
        uint64 sourceChainId,
        address callerAddr,
        bytes32 querySchema,
        bytes32 queryHash,
        bytes32[] calldata axiomResults,
        bytes calldata callbackExtraData
    ) external override {
        _validateAxiomV2Call(sourceChainId, callerAddr, querySchema);

        uint32 timestamp = uint32(uint256(axiomResults[0]));
        uint256 _gasPrice = uint256(axiomResults[1]);

        gasPrice[timestamp] = _gasPrice;
        oracleLatest = timestamp;
        emit GasPriceUpdated(timestamp, _gasPrice);
    }

    function getLatestGasPrice() public view returns (uint256) {
        if (oracleLatest + oracleUpdateInterval < block.timestamp) return 0;
        return gasPrice[oracleLatest];
    }

    function _validateAxiomV2Call(uint64 sourceChainId, address callerAddr, bytes32 querySchema) internal virtual {
        require(sourceChainId == callbackSourceChainId, "AxiomV2: caller sourceChainId mismatch");
        require(querySchema == axiomCallbackQuerySchema, "AxiomV2: query schema mismatch");
    }
}
