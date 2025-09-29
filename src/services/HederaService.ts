import { 
  Client, 
  AccountId, 
  PrivateKey, 
  TopicCreateTransaction, 
  TopicMessageSubmitTransaction,
  TransactionResponse,
  TopicId,
  FileCreateTransaction,
  FileAppendTransaction,
  Hbar
} from '@hashgraph/sdk';
import winston from 'winston';

export class HederaService {
  private client: Client;
  private accountId: AccountId;
  private privateKey: PrivateKey;
  private logger: winston.Logger;

  constructor() {
    this.logger = winston.createLogger({
      level: 'info',
      format: winston.format.json(),
      transports: [
        new winston.transports.Console(),
        new winston.transports.File({ filename: 'hedera.log' })
      ]
    });

    const network = process.env.HEDERA_NETWORK || 'testnet';
    const accountIdStr = process.env.HEDERA_ACCOUNT_ID;
    const privateKeyStr = process.env.HEDERA_PRIVATE_KEY;

    if (!accountIdStr || !privateKeyStr) {
      throw new Error('Hedera credentials not provided in environment variables');
    }

    this.accountId = AccountId.fromString(accountIdStr);
    this.privateKey = PrivateKey.fromString(privateKeyStr);

    if (network === 'mainnet') {
      this.client = Client.forMainnet();
    } else {
      this.client = Client.forTestnet();
    }

    this.client.setOperator(this.accountId, this.privateKey);
  }

  async createIdentityTopic(): Promise<TopicId> {
    try {
      const transaction = new TopicCreateTransaction()
        .setTopicMemo('Digital Identity Topic')
        .setMaxTransactionFee(new Hbar(1));

      const response: TransactionResponse = await transaction.execute(this.client);
      const receipt = await response.getReceipt(this.client);
      
      const topicId = receipt.topicId;
      if (!topicId) {
        throw new Error('Failed to create topic');
      }

      this.logger.info(`Created identity topic: ${topicId.toString()}`);
      return topicId;
    } catch (error) {
      this.logger.error('Failed to create identity topic:', error);
      throw error;
    }
  }

  async submitIdentityMessage(topicId: TopicId, message: string): Promise<TransactionResponse> {
    try {
      const transaction = new TopicMessageSubmitTransaction()
        .setTopicId(topicId)
        .setMessage(message)
        .setMaxTransactionFee(new Hbar(1));

      const response = await transaction.execute(this.client);
      
      this.logger.info(`Submitted message to topic ${topicId.toString()}`);
      return response;
    } catch (error) {
      this.logger.error('Failed to submit identity message:', error);
      throw error;
    }
  }

  async createFileOnHedera(contents: Uint8Array): Promise<string> {
    try {
      // Create file
      const createTransaction = new FileCreateTransaction()
        .setKeys([this.privateKey.publicKey])
        .setContents(contents.slice(0, 1024)) // Initial chunk
        .setMaxTransactionFee(new Hbar(2));

      const createResponse = await createTransaction.execute(this.client);
      const createReceipt = await createResponse.getReceipt(this.client);
      
      const fileId = createReceipt.fileId;
      if (!fileId) {
        throw new Error('Failed to create file');
      }

      // Append remaining content if necessary
      if (contents.length > 1024) {
        const appendTransaction = new FileAppendTransaction()
          .setFileId(fileId)
          .setContents(contents.slice(1024))
          .setMaxTransactionFee(new Hbar(2));

        await appendTransaction.execute(this.client);
      }

      this.logger.info(`Created file on Hedera: ${fileId.toString()}`);
      return fileId.toString();
    } catch (error) {
      this.logger.error('Failed to create file on Hedera:', error);
      throw error;
    }
  }

  async signMessage(message: string): Promise<string> {
    try {
      const messageBytes = Buffer.from(message, 'utf8');
      const signature = this.privateKey.sign(messageBytes);
      return Buffer.from(signature).toString('hex');
    } catch (error) {
      this.logger.error('Failed to sign message:', error);
      throw error;
    }
  }

  getPublicKey(): string {
    return this.privateKey.publicKey.toString();
  }

  getAccountId(): string {
    return this.accountId.toString();
  }
}