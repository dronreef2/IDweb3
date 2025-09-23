const {
    AccountId,
    PrivateKey,
    Client,
    AccountCreateTransaction,
    Hbar,
    TransferTransaction,
    AccountAllowanceApproveTransaction,
    AccountBalanceQuery
  } = require("@hashgraph/sdk"); // v2.64.5

async function main() {
  let client;
  try {
    // Your account ID and private key from string value
    const MY_ACCOUNT_ID = AccountId.fromString("0.0.6884670");
    const MY_PRIVATE_KEY = PrivateKey.fromStringECDSA("cedf73bce83f89a31d2f6032aa522043424a3a0fa1078fa2c2c1da989827725c");

    // Pre-configured client for test network (testnet)
    client = Client.forTestnet();

    //Set the operator with the account ID and private key
    client.setOperator(MY_ACCOUNT_ID, MY_PRIVATE_KEY);

    // Start your code here

    
    //Generate a new key for the account
    const accountPrivateKey = PrivateKey.generateECDSA();
    const accountPublicKey = accountPrivateKey.publicKey;
    
    const txCreateAccount = new AccountCreateTransaction()
      .setECDSAKeyWithAlias(accountPrivateKey)
      //DO NOT set an alias with your key if you plan to update/rotate keys in the future, Use .setKeyWithoutAlias instead 
      //.setKeyWithoutAlias(accountPublicKey)
      .setInitialBalance(new Hbar(10));
    
    //Sign the transaction with the client operator private key and submit to a Hedera network
    const txCreateAccountResponse = await txCreateAccount.execute(client);

    //Request the receipt of the transaction
    const receiptCreateAccountTx= await txCreateAccountResponse.getReceipt(client);

    //Get the transaction consensus status
    const statusCreateAccountTx = receiptCreateAccountTx.status;

    //Get the Account ID
    const accountId = receiptCreateAccountTx.accountId;

    //Get the Transaction ID 
    const txIdAccountCreated = txCreateAccountResponse.transactionId.toString();

    console.log("------------------------------ Create Account ------------------------------ ");
    console.log("Receipt status       :", statusCreateAccountTx.toString());
    console.log("Transaction ID       :", txIdAccountCreated);
    console.log("Hashscan URL         :", `https://hashscan.io/testnet/tx/${txIdAccountCreated}`);
    console.log("Account ID           :", accountId.toString());
    console.log("Private key          :", accountPrivateKey.toString());
    console.log("Public key           :", accountPublicKey.toString());
    
    const receiverAccount = accountId;
    const spenderAccount = accountId;
    
    //Configure query parameters
    const getAllAccountsParams = {
      limit: 10,                   //Fill the number of accounts to return
      order: "desc",               //Fill the result ordering
    };
    
    const getAllAccountsResponse = await fetch(
      `https://testnet.mirrornode.hedera.com/api/v1/accounts?limit=${getAllAccountsParams.limit}&order=${getAllAccountsParams.order}`
    );

    if (!getAllAccountsResponse.ok) {
      throw new Error(`HTTP error! status: ${getAllAccountsResponse.status}`);
    }
    
    const getAllAccountsData = await getAllAccountsResponse.json();
    
    console.log("------------------------------ Get Accounts ------------------------------ ");
    console.log("Response status         :", getAllAccountsResponse.status);
    console.log("Total accounts          :", getAllAccountsData.accounts.length);
    console.log("Accounts                :", getAllAccountsData.accounts);
        
  
    
    //Configure query parameters
    const getAccountByIdParams = {
      idOrAliasOrEvmAddress: accountId,       //Fill in the account ID or alias or EVM address
      limit: 10,                              //Fill in the number of transactions to return
      order: "desc",                          //Fill the result ordering
    };
    
    //Get account by ID/alias/EVM address
    try {
      const getAccountByIdResponse = await fetch(
        `https://testnet.mirrornode.hedera.com/api/v1/accounts/${getAccountByIdParams.idOrAliasOrEvmAddress}?limit=${getAccountByIdParams.limit}&order=${getAccountByIdParams.order}`
      );

      if (!getAccountByIdResponse.ok) {
        console.log("Account not yet indexed by Mirror Node, skipping...");
      } else {
        const getAccountByIdData = await getAccountByIdResponse.json();
        console.log("------------------------------ Get Account by ID ------------------------------ ");
        console.log("Response status         :", getAccountByIdResponse.status);
        console.log("Account details         :", getAccountByIdData);
      }
    } catch (error) {
      console.log("Error getting account by ID:", error.message);
    }
        
  
    
    //Create a transaction to transfer 1 HBAR
    const txTransfer= new TransferTransaction()
      .addHbarTransfer(MY_ACCOUNT_ID, new Hbar(-1))
      .addHbarTransfer(receiverAccount, new Hbar(1)); //Fill in the receiver account ID
          
    //Submit the transaction to a Hedera network
    const txTransferResponse = await txTransfer.execute(client);

    //Request the receipt of the transaction
    const receiptTransferTx = await txTransferResponse.getReceipt(client);

    //Get the transaction consensus status
    const statusTransferTx= receiptTransferTx.status;

    //Get the Transaction ID
    const txIdTransfer = txTransferResponse.transactionId.toString();

    console.log("-------------------------------- Transfer HBAR ------------------------------ ");
    console.log("Receipt status           :", statusTransferTx.toString());
    console.log("Transaction ID           :", txIdTransfer);
    console.log("Hashscan URL             :", `https://hashscan.io/testnet/tx/${txIdTransfer}`);
      
  
        
    //Configure query parameters
    const getAllowancesParams = {
      idOrAliasOrEvmAddress : accountId,     //Fill in the account ID or alias or EVM address
      limit: 10,                             //Fill in the number of items to return
      order: "desc",                         //Fill in the result ordering
    };
    
    const getAllowancesResponse = await fetch(
      `https://testnet.mirrornode.hedera.com/api/v1/accounts/${getAllowancesParams.idOrAliasOrEvmAddress}/allowances/crypto?limit=${getAllowancesParams.limit}&order=${getAllowancesParams.order}`
    );

    if (!getAllowancesResponse.ok) {
      throw new Error(`HTTP error! status: ${getAllowancesResponse.status}`);
    }
    
    const getAllowancesData = await getAllowancesResponse.json();
    
    console.log("------------------------------ Get Account Allowances ------------------------------ ");
    console.log("Response status         :", getAllowancesResponse.status);
    console.log("Allowances              :", getAllowancesData.allowances);
        
  
    
    //Create the transaction
    const txApproveAllowance = await new AccountAllowanceApproveTransaction()
      .approveHbarAllowance(MY_ACCOUNT_ID, spenderAccount, Hbar.from(1)).freezeWith(client); //Fill in the spender Account ID
          
    //Sign the transaction with the owner account key
    const signTxApproveAllowance= await txApproveAllowance.sign(MY_PRIVATE_KEY); 

    //Sign the transaction with the client operator private key and submit to a Hedera network
    const txResponseApproveAllowance = await signTxApproveAllowance.execute(client);

    //Request the receipt of the transaction
    const receiptApproveAllowanceTx = await txResponseApproveAllowance.getReceipt(client);

    //Get the transaction consensus status
    const statusApproveAllowanceTx = receiptApproveAllowanceTx.status;

    //Get the Transaction ID
    const txIdApproveAllowance = txResponseApproveAllowance.transactionId.toString();

    console.log("-------------------------------- Approve Allowance ------------------------------ ");
    console.log("Receipt status           :", statusApproveAllowanceTx.toString());
    console.log("Transaction ID           :", txIdApproveAllowance);
    console.log("Hashscan URL             :", `https://hashscan.io/testnet/tx/${txIdApproveAllowance}`);
    
  
    
    //Create the account balance query
    const accountBalanceQuery = new AccountBalanceQuery()
      .setAccountId(accountId);

    //Submit the query to a Hedera network
    const accountBalance = await accountBalanceQuery.execute(client);

    console.log("-------------------------------- Account Balance ------------------------------");
    console.log("HBAR account balance     :", accountBalance.hbars.toString());
    console.log("Token account balance    :", accountBalance.tokens.toString());
    
  } catch (error) {
    console.error(error);
  } finally {
    if (client) client.close();
  }
}

main();