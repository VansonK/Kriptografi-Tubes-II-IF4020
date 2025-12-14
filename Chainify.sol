// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract Chainify {
    
    struct Diploma {
        string ipfsCid;
        string fileHash;
        address issuer;
        bytes signature;      // Signature for Issuance
        uint256 timestamp;
        bool isValid;
        string revokeReason;  
        bytes revokeSignature;// Signature for Revocation 
    }

    mapping(string => Diploma) public diplomas;

    event DiplomaIssued(string indexed diplomaId, address indexed issuer, uint256 timestamp);
    event DiplomaRevoked(string indexed diplomaId, address indexed issuer, string reason, bytes signature);

    function issueDiploma(
        string memory _diplomaId, 
        string memory _ipfsCid, 
        string memory _fileHash,
        bytes memory _signature
    ) public {
        require(diplomas[_diplomaId].timestamp == 0, "Diploma ID already exists");
        require(bytes(_diplomaId).length > 0, "ID cannot be empty");

        diplomas[_diplomaId] = Diploma({
            ipfsCid: _ipfsCid,
            fileHash: _fileHash,
            issuer: msg.sender,
            signature: _signature,
            timestamp: block.timestamp,
            isValid: true,
            revokeReason: "",    // Initialize empty
            revokeSignature: ""  // Initialize empty
        });

        emit DiplomaIssued(_diplomaId, msg.sender, block.timestamp);
    }

    function revokeDiploma(
        string memory _diplomaId, 
        string memory _reason, 
        bytes memory _signature 
    ) public {
        require(diplomas[_diplomaId].timestamp != 0, "Diploma does not exist");
        require(msg.sender == diplomas[_diplomaId].issuer, "Only the issuer can revoke");
        require(diplomas[_diplomaId].isValid == true, "Diploma is already revoked");

        diplomas[_diplomaId].isValid = false;
        diplomas[_diplomaId].revokeReason = _reason;       
        diplomas[_diplomaId].revokeSignature = _signature; 

        emit DiplomaRevoked(_diplomaId, msg.sender, _reason, _signature);
    }

    function verifyDiploma(string memory _diplomaId) public view returns (
        bool isValid,
        address issuer,
        string memory fileHash,
        string memory ipfsCid,
        bytes memory signature,
        uint256 timestamp,
        string memory revokeReason,
        bytes memory revokeSignature 
    ) {
        Diploma memory d = diplomas[_diplomaId];
        return (d.isValid, d.issuer, d.fileHash, d.ipfsCid, d.signature, d.timestamp, d.revokeReason, d.revokeSignature);
    }
}