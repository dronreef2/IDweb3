const {
  Client,
  PrivateKey,
  AccountId,
  TopicCreateTransaction,
  TopicMessageSubmitTransaction,
  TokenCreateTransaction,
  TokenType,
  TokenSupplyType,
  TokenMintTransaction,
  TransferTransaction,
  Hbar
} = require('@hashgraph/sdk');

class HederaService {
  constructor() {
    this.client = null;
    this.operatorId = null;
    this.operatorKey = null;
    this.initialize();
  }

  initialize() {
    try {
      // Setup Hedera client
      this.operatorId = AccountId.fromString(process.env.HEDERA_OPERATOR_ID);
      this.operatorKey = PrivateKey.fromString(process.env.HEDERA_OPERATOR_KEY);

      if (process.env.HEDERA_NET === 'testnet') {
        this.client = Client.forTestnet();
      } else if (process.env.HEDERA_NET === 'mainnet') {
        this.client = Client.forMainnet();
      } else {
        throw new Error('Invalid HEDERA_NET configuration');
      }

      this.client.setOperator(this.operatorId, this.operatorKey);
      console.log('🌐 Hedera client initialized for', process.env.HEDERA_NET);
    } catch (error) {
      console.error('❌ Hedera initialization error:', error);
      throw error;
    }
  }

  // Create a topic for identity records
  async createIdentityTopic(memo = 'IDweb3 Identity Records') {
    try {
      const transaction = new TopicCreateTransaction()
        .setTopicMemo(memo)
        .setAdminKey(this.operatorKey.publicKey)
        .setSubmitKey(this.operatorKey.publicKey)
        .freezeWith(this.client);

      const response = await transaction.execute(this.client);
      const receipt = await response.getReceipt(this.client);
      
      console.log('✅ Identity topic created:', receipt.topicId.toString());
      return receipt.topicId.toString();
    } catch (error) {
      console.error('❌ Error creating identity topic:', error);
      throw error;
    }
  }

  // Submit identity data to topic
  async submitIdentityMessage(topicId, message) {
    try {
      const transaction = new TopicMessageSubmitTransaction()
        .setTopicId(topicId)
        .setMessage(JSON.stringify(message))
        .freezeWith(this.client);

      const response = await transaction.execute(this.client);
      const receipt = await response.getReceipt(this.client);
      
      console.log('✅ Identity message submitted to topic:', topicId);
      return receipt.topicSequenceNumber;
    } catch (error) {
      console.error('❌ Error submitting identity message:', error);
      throw error;
    }
  }

  // Create NFT token for identity
  async createIdentityNFT(name, symbol, memo) {
    try {
      const transaction = new TokenCreateTransaction()
        .setTokenName(name)
        .setTokenSymbol(symbol)
        .setTokenType(TokenType.NonFungibleUnique)
        .setDecimals(0)
        .setInitialSupply(0)
        .setTreasuryAccountId(this.operatorId)
        .setSupplyType(TokenSupplyType.Finite)
        .setMaxSupply(1000000)
        .setSupplyKey(this.operatorKey.publicKey)
        .setAdminKey(this.operatorKey.publicKey)
        .setTokenMemo(memo)
        .freezeWith(this.client);

      const response = await transaction.execute(this.client);
      const receipt = await response.getReceipt(this.client);
      
      console.log('✅ Identity NFT token created:', receipt.tokenId.toString());
      return receipt.tokenId.toString();
    } catch (error) {
      console.error('❌ Error creating identity NFT:', error);
      throw error;
    }
  }

  // Mint identity NFT
  async mintIdentityNFT(tokenId, metadata) {
    try {
      const transaction = new TokenMintTransaction()
        .setTokenId(tokenId)
        .setMetadata([Buffer.from(JSON.stringify(metadata))])
        .freezeWith(this.client);

      const response = await transaction.execute(this.client);
      const receipt = await response.getReceipt(this.client);
      
      console.log('✅ Identity NFT minted:', receipt.serials[0].toString());
      return receipt.serials[0].toString();
    } catch (error) {
      console.error('❌ Error minting identity NFT:', error);
      throw error;
    }
  }

  // Transfer NFT to user account
  async transferNFT(tokenId, serial, fromAccount, toAccount) {
    try {
      const transaction = new TransferTransaction()
        .addNftTransfer(tokenId, serial, fromAccount, toAccount)
        .freezeWith(this.client);

      const response = await transaction.execute(this.client);
      const receipt = await response.getReceipt(this.client);
      
      console.log('✅ NFT transferred to:', toAccount);
      return receipt.status.toString();
    } catch (error) {
      console.error('❌ Error transferring NFT:', error);
      throw error;
    }
  }

  // Get account balance
  async getAccountBalance(accountId) {
    try {
      const balance = await this.client.getAccountBalance(accountId);
      return balance;
    } catch (error) {
      console.error('❌ Error getting account balance:', error);
      throw error;
    }
  }
}

module.exports = HederaService;