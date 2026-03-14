// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract OrdersContract {
    address public immutable executor;

    event OrderExecuted(string exchangeSell, string exchangeBuy, uint256 amount, uint256 timestamp);

    constructor(address _executor) {
        require(_executor != address(0), "Executor zero");
        executor = _executor;
    }

    function executeOrder(string calldata exchangeSell, string calldata exchangeBuy, uint256 amount) external {
        require(msg.sender == executor, "Only executor");
        emit OrderExecuted(exchangeSell, exchangeBuy, amount, block.timestamp);
    }
}
