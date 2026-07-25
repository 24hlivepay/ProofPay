// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

contract ProofPayEscrow {
    enum Status {
        None,
        Created,
        Funded,
        Delivered,
        Released,
        Refunded,
        Disputed
    }

    struct Escrow {
        address buyer;
        address seller;
        uint256 amount;
        Status status;
    }

    mapping(string => Escrow) public escrows;

    event EscrowCreated(
        string escrowId,
        address buyer,
        address seller,
        uint256 amount
    );

    event DeliveryConfirmed(string escrowId);

    event FundsReleased(string escrowId);

    function createEscrow(
        string memory escrowId,
        address seller
    ) external payable {
        require(escrows[escrowId].buyer == address(0), "Escrow already exists");

        require(msg.value > 0, "Amount must be greater than zero");

        escrows[escrowId] = Escrow({
            buyer: msg.sender,
            seller: seller,
            amount: msg.value,
            status: Status.Funded
        });

        emit EscrowCreated(escrowId, msg.sender, seller, msg.value);
    }

    function confirmDelivery(string memory escrowId) external {
        Escrow storage escrow = escrows[escrowId];

        require(
            escrow.seller == msg.sender,
            "Only seller can confirm delivery"
        );

        require(escrow.status == Status.Funded, "Escrow is not funded");

        escrow.status = Status.Delivered;

        emit DeliveryConfirmed(escrowId);
    }

    function releaseFunds(string memory escrowId) external {
        Escrow storage escrow = escrows[escrowId];

        require(escrow.buyer == msg.sender, "Only buyer can release funds");

        require(escrow.status == Status.Delivered, "Product not delivered yet");

        escrow.status = Status.Released;

        payable(escrow.seller).transfer(escrow.amount);

        emit FundsReleased(escrowId);
    }

    function getEscrow(
        string memory escrowId
    )
        external
        view
        returns (address buyer, address seller, uint256 amount, Status status)
    {
        Escrow memory escrow = escrows[escrowId];

        return (escrow.buyer, escrow.seller, escrow.amount, escrow.status);
    }
}
