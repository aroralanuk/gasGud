// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import {GasOracle} from "./GasOracle.sol";

import {Position} from "./Position.sol";

import {IERC20} from "./interfaces/IERC20.sol";

contract ClearingHouse {
    GasOracle public gasOracle;
    IERC20 public indexToken;

    uint256 public fundingInterval = 1 minutes;
    // lastFundingTime tracks the last time funding rate is updated
    uint256 public lastFundingTime;
    // cumulativeFundingRate tracks the funding rate based on utilization
    uint256 public cumulativeFundingRate;

    event UpdateFundingRate(uint256 indexed time, uint256 indexed fundingRate);

    constructor(address _gasOracle) {
        gasOracle = GasOracle(_gasOracle);
    }

    function increasePosition(address _account, uint256 _amount, bool _isLong) external payable {
        require(msg.value >= _amount, "ClearingHouse: insufficient collateral");

        updateCummlativeFundingRate();

        uint256 price = gasOracle.getLatestGasPrice();

        // if (position.size == 0) {
        //     position.averagePrice = price;
        // }
    }

    function updateMargin() external payable {}

    function settlePosition() external {}

    function liquidatePosition() external {}

    function updateCummlativeFundingRate() public {
        if (lastFundingTime == 0) {
            // floor by fundingInterval
            lastFundingTime = (block.timestamp / fundingInterval) * fundingInterval;
            return;
        }
        if (lastFundingTime + fundingInterval > block.timestamp) return;

        uint256 fundingRate = getNextFundingRate();
        cumulativeFundingRate = cumulativeFundingRate + fundingRate;
        lastFundingTime = (block.timestamp / fundingInterval) * fundingInterval;

        emit UpdateFundingRate(lastFundingTime, cumulativeFundingRate);
    }

    function getNextFundingRate() public view returns (uint256) {
        return 0;
    }
}
