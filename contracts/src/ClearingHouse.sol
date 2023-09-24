// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import {GasOracle} from "./GasOracle.sol";

import {Position} from "./Position.sol";

import {IERC20} from "./interfaces/IERC20.sol";

contract ClearingHouse {
    using Position for Position.Info;

    GasOracle public gasOracle;
    IERC20 public indexToken;

    uint256 public constant BASIS_POINTS_DIVISOR = 10000;
    uint256 public constant MAX_LEVERAGE = 100 * 10000; // 100x
    uint256 public constant MIN_MARGIN = 5 * 1000; // 0.5%

    uint256 public fundingInterval = 1 minutes;
    // lastFundingTime tracks the last time funding rate is updated
    uint256 public lastFundingTime;
    // cumulativeFundingRate tracks the funding rate based on utilization
    uint256 public cumulativeFundingRate;
    uint256 public reservedAmounts;

    uint256 public totalShortAmount;
    uint256 public shortAveragePrice;

    uint256 public poolAmount;

    mapping(bytes32 => Position.Info) public positions;

    event UpdateFundingRate(uint256 indexed time, uint256 indexed fundingRate);

    event LiquidatedPosition(
        address indexed account, bool indexed isLong, uint256 size, uint256 collateral, uint256 delta
    );

    constructor(address _gasOracle) {
        gasOracle = GasOracle(_gasOracle);
    }

    function increasePosition(address _account, uint256 _amount, uint256 _leverage, bool _isLong) external payable {
        require(msg.value >= _amount * _leverage / BASIS_POINTS_DIVISOR, "ClearingHouse: insufficient collateral");

        updateFunding();

        bytes32 key = getPositionKey(_account, _isLong);
        Position.Info storage position = positions[key];
        uint256 price = gasOracle.getLatestGasPrice();

        if (position.size == 0) {
            position.averagePrice = price;
        } else {
            position.averagePrice = getNextAveragePrice(
                position.size, position.averagePrice, _isLong, price, _amount, position.lastIncreasedTime
            );
        }

        position.collateral = position.collateral + _amount;
        position.entryFundingRate = cumulativeFundingRate;
        position.size = position.size + _amount * _leverage / BASIS_POINTS_DIVISOR;
        position.lastIncreasedTime = block.timestamp;

        require(position.size >= position.collateral, "ClearingHouse: position size < collateral");
        // check if liquidation is needed

        // reserve tokens to pay profits on the position
        uint256 reserveDelta = _amount; // TODO: numeriare correct?
        position.reserveAmount = position.reserveAmount + reserveDelta;
        _depositToReserve(_amount);

        if (_isLong) {
            poolAmount += _amount;
        } else {
            if (totalShortAmount == 0) {
                shortAveragePrice = price;
            } else {
                shortAveragePrice = getNextShortAveragePrice(price, _amount);
            }

            totalShortAmount += _amount;
        }
    }

    function settlePosition() external {}

    function liquidatePosition(address _account, bool _isLong) external {
        updateFunding();

        Position.Info memory position = positions[getPositionKey(_account, _isLong)];
        uint256 currentPrice = gasOracle.getLatestGasPrice();

        // start with 10 and 500, price - 50
        // price drops to 49, delta = 10 - (50 - 49.4) * 10 = 4

        uint256 delta = position.collateral * (position.averagePrice - currentPrice) / BASIS_POINTS_DIVISOR;
        if (_isLong) {
            if (
                position.collateral < delta
                    || position.collateral - delta < (MIN_MARGIN * position.size) / BASIS_POINTS_DIVISOR
            ) {
                // transfer to the pool
                poolAmount += position.collateral;
            } else {
                revert("ClearingHouse: insufficient collateral");
            }
        }

        emit LiquidatedPosition(_account, _isLong, position.size, position.collateral, delta);
    }

    function updateFunding() public {
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

    function getPositionLeverage(address _account, bool _isLong) public view returns (uint256) {
        bytes32 key = getPositionKey(_account, _isLong);
        Position.Info memory position = positions[key];
        require(position.collateral > 0, "ClearingHouse: invalid collateral");
        return position.size * BASIS_POINTS_DIVISOR / position.collateral;
    }

    function _depositToReserve(uint256 _amount) internal {
        reservedAmounts += _amount;
        require(reservedAmounts <= poolAmount, "ClearingHouse: insufficient pool balance");
    }

    function getPositionKey(address _account, bool _isLong) public pure returns (bytes32) {
        return keccak256(abi.encodePacked(_account, _isLong));
    }

    // for longs: nextAveragePrice = (nextPrice * nextSize)/ (nextSize + delta)
    // for shorts: nextAveragePrice = (nextPrice * nextSize) / (nextSize - delta)
    function getNextAveragePrice(
        uint256 _size,
        uint256 _averagePrice,
        bool _isLong,
        uint256 _nextPrice,
        uint256 _sizeDelta,
        uint256 _lastIncreasedTime
    ) public view returns (uint256) {
        (bool hasProfit, uint256 delta) = getDelta(_size, _averagePrice, _isLong, _lastIncreasedTime);
        uint256 nextSize = _size + _sizeDelta;
        uint256 divisor;
        if (_isLong) {
            divisor = hasProfit ? nextSize + delta : nextSize - delta;
        } else {
            divisor = hasProfit ? nextSize - delta : nextSize + delta;
        }
        return _nextPrice * nextSize / divisor;
    }

    // for longs: nextAveragePrice = (nextPrice * nextSize)/ (nextSize + delta)
    // for shorts: nextAveragePrice = (nextPrice * nextSize) / (nextSize - delta)
    function getNextShortAveragePrice(uint256 _nextPrice, uint256 _sizeDelta) public view returns (uint256) {
        uint256 size = totalShortAmount;
        uint256 averagePrice = shortAveragePrice;
        uint256 priceDelta = averagePrice > _nextPrice ? averagePrice - _nextPrice : _nextPrice - averagePrice;
        uint256 delta = (size * priceDelta) / averagePrice;
        bool hasProfit = averagePrice > _nextPrice;

        uint256 nextSize = size + _sizeDelta;
        uint256 divisor = hasProfit ? nextSize - delta : nextSize + delta;

        return (_nextPrice * nextSize) / divisor;
    }

    function getDelta(uint256 _size, uint256 _averagePrice, bool _isLong, uint256 _lastIncreasedTime)
        public
        view
        returns (bool, uint256)
    {
        uint256 price = gasOracle.getLatestGasPrice();
        uint256 priceDelta = _averagePrice > price ? _averagePrice - price : price - _averagePrice;
        uint256 delta = (_size * priceDelta) / _averagePrice;

        bool hasProfit;

        if (_isLong) {
            hasProfit = price > _averagePrice;
        } else {
            hasProfit = _averagePrice > price;
        }

        return (hasProfit, delta);
    }
}
