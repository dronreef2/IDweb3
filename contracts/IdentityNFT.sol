// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title IdentityNFT
 * @dev ERC721 NFT contract for IDweb3 digital identities
 * Each NFT represents a unique digital identity with associated metadata stored on IPFS
 */
contract IdentityNFT is ERC721, Ownable {
    uint256 public tokenCounter;
    
    // Mapping from token ID to identity metadata URI (IPFS hash)
    mapping(uint256 => string) private _tokenURIs;
    
    // Mapping to track if an address already has an identity NFT
    mapping(address => bool) public hasIdentity;
    
    // Events
    event IdentityMinted(address indexed to, uint256 indexed tokenId, string metadataURI);
    event MetadataUpdated(uint256 indexed tokenId, string newMetadataURI);

    /**
     * @dev Constructor initializes the NFT collection
     */
    constructor() ERC721("IDweb3Identity", "ID3") {
        tokenCounter = 0;
    }

    /**
     * @dev Mint a new identity NFT
     * @param to Address to receive the NFT
     * @param metadataURI IPFS URI containing identity metadata (e.g., "ipfs://Qm...")
     * @return The token ID of the newly minted NFT
     */
    function mintIdentity(address to, string memory metadataURI) public onlyOwner returns (uint256) {
        require(!hasIdentity[to], "Address already has an identity NFT");
        require(bytes(metadataURI).length > 0, "Metadata URI cannot be empty");
        
        uint256 newId = tokenCounter;
        _safeMint(to, newId);
        _tokenURIs[newId] = metadataURI;
        hasIdentity[to] = true;
        tokenCounter += 1;
        
        emit IdentityMinted(to, newId, metadataURI);
        
        return newId;
    }

    /**
     * @dev Update metadata URI for an existing token (e.g., when identity is verified)
     * @param tokenId The token ID to update
     * @param newMetadataURI New IPFS URI for updated metadata
     */
    function updateMetadata(uint256 tokenId, string memory newMetadataURI) public onlyOwner {
        require(_exists(tokenId), "Token does not exist");
        require(bytes(newMetadataURI).length > 0, "Metadata URI cannot be empty");
        
        _tokenURIs[tokenId] = newMetadataURI;
        
        emit MetadataUpdated(tokenId, newMetadataURI);
    }

    /**
     * @dev Get the metadata URI for a token
     * @param tokenId The token ID to query
     * @return The IPFS URI containing the token's metadata
     */
    function tokenURI(uint256 tokenId) public view virtual override returns (string memory) {
        require(_exists(tokenId), "Token does not exist");
        return _tokenURIs[tokenId];
    }

    /**
     * @dev Check if a token exists
     * @param tokenId The token ID to check
     * @return True if the token exists, false otherwise
     */
    function _exists(uint256 tokenId) internal view returns (bool) {
        return _ownerOf(tokenId) != address(0);
    }

    /**
     * @dev Override transfer functions to make identity NFTs soulbound (non-transferable)
     * Identities should not be transferable to maintain integrity
     */
    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 tokenId,
        uint256 batchSize
    ) internal virtual {
        // Allow minting (from == address(0))
        // Prevent transfers (from != address(0) && to != address(0))
        require(from == address(0) || to == address(0), "Identity NFTs are soulbound and cannot be transferred");
    }

    /**
     * @dev Get the total number of identities minted
     * @return The total supply of identity NFTs
     */
    function totalSupply() public view returns (uint256) {
        return tokenCounter;
    }

    /**
     * @dev Check if an address owns an identity NFT
     * @param owner The address to check
     * @return True if the address owns at least one identity NFT
     */
    function hasIdentityNFT(address owner) public view returns (bool) {
        return hasIdentity[owner];
    }
}
