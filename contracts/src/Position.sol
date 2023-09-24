// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

library Position {
    struct Info {
        uint256 size;
        uint256 collateral;
        uint256 averagePrice;
        uint256 entryFundingRate;
        uint256 reserveAmount;
        int256 realisedPnl;
        uint256 lastIncreasedTime;
    }
}
