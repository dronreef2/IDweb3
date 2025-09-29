// MongoDB initialization script
db = db.getSiblingDB('idweb3');

// Create collections
db.createCollection('users');
db.createCollection('identities');
db.createCollection('credentials');

// Create indexes for better performance
db.users.createIndex({ "email": 1 }, { unique: true });
db.users.createIndex({ "username": 1 }, { unique: true });

db.identities.createIndex({ "userId": 1 }, { unique: true });
db.identities.createIndex({ "identityId": 1 }, { unique: true });
db.identities.createIndex({ "status": 1 });

db.credentials.createIndex({ "credentialId": 1 }, { unique: true });
db.credentials.createIndex({ "userId": 1 });
db.credentials.createIndex({ "identityId": 1 });
db.credentials.createIndex({ "type": 1 });
db.credentials.createIndex({ "status": 1 });

print('Database initialized successfully');