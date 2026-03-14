// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IConsortiumToken {
    function mint(address to, uint256 amount) external;
}

contract BridgeMock {
    IConsortiumToken public immutable token;
    address public immutable bridgeOperator;

    event Bridged(address indexed to, uint256 amount);

    constructor(address _token, address _bridgeOperator) {
        require(_token != address(0), "Token zero");
        require(_bridgeOperator != address(0), "Operator zero");
        token = IConsortiumToken(_token);
        bridgeOperator = _bridgeOperator;
    }

    function mintFromBridge(address to, uint256 amount) external {
        require(msg.sender == bridgeOperator, "Only bridge operator");
        require(to != address(0), "Mint to zero");
        token.mint(to, amount);
        emit Bridged(to, amount);
    }
}
