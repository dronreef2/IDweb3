# Identity Policy Configuration for Guardian

## Overview
This configuration defines the policy workflow for digital identity verification in IDweb3.

## Policy Blocks

### 1. User Registration Block
- **Type**: Registration
- **Description**: Initial user registration and basic information collection
- **Required Fields**:
  - Full Name
  - Email
  - Date of Birth
  - Nationality

### 2. Document Upload Block
- **Type**: Document Collection
- **Description**: Upload and validation of identity documents
- **Supported Documents**:
  - Government ID (Passport, Driver's License)
  - Educational Credentials (Diplomas, Certificates)
  - Professional Licenses
  - Medical Records

### 3. Verification Block
- **Type**: Manual/Automated Verification
- **Description**: Document verification process
- **Verification Methods**:
  - Manual review by authorized verifiers
  - Automated checks (OCR, format validation)
  - Biometric verification (future)

### 4. Credential Issuance Block
- **Type**: VC Generation
- **Description**: Generate and issue verifiable credentials
- **Output**: W3C Verifiable Credential in JSON-LD format

### 5. Hedera Integration Block
- **Type**: Blockchain Recording
- **Description**: Record credential on Hedera network
- **Components**:
  - Topic message submission
  - NFT creation (optional)
  - IPFS metadata storage

## Policy Flow

```
User Registration → Document Upload → Verification → Credential Issuance → Hedera Recording
```

## Guardian Policy JSON

```json
{
  "name": "IDweb3 Digital Identity Policy",
  "version": "1.0.0",
  "description": "Digital identity verification and credential issuance policy",
  "topicDescription": "IDweb3 Identity Policy Topic",
  "config": {
    "blockType": "interfaceContainerBlock",
    "children": [
      {
        "blockType": "policyRolesBlock",
        "roles": [
          {
            "name": "Registrant",
            "description": "Users registering for digital identity"
          },
          {
            "name": "Verifier",
            "description": "Authorized identity verifiers"
          },
          {
            "name": "Issuer",
            "description": "Credential issuers"
          }
        ]
      },
      {
        "blockType": "registrationBlock",
        "uiMetaData": {
          "title": "User Registration",
          "description": "Register for digital identity"
        }
      },
      {
        "blockType": "requestVcDocumentBlock",
        "schema": {
          "@context": ["https://www.w3.org/2018/credentials/v1"],
          "type": "object",
          "properties": {
            "personalInfo": {
              "type": "object",
              "properties": {
                "firstName": {"type": "string"},
                "lastName": {"type": "string"},
                "dateOfBirth": {"type": "string", "format": "date"},
                "nationality": {"type": "string"}
              }
            },
            "documents": {
              "type": "array",
              "items": {
                "type": "object",
                "properties": {
                  "type": {"type": "string"},
                  "hash": {"type": "string"},
                  "filename": {"type": "string"}
                }
              }
            }
          }
        }
      },
      {
        "blockType": "sendToGuardianBlock",
        "uiMetaData": {
          "title": "Submit for Verification"
        }
      },
      {
        "blockType": "externalDataBlock",
        "entityType": "VC",
        "uiMetaData": {
          "title": "Manual Verification",
          "description": "Verify submitted documents"
        }
      },
      {
        "blockType": "mintDocumentBlock",
        "uiMetaData": {
          "title": "Issue Identity Credential"
        }
      }
    ]
  }
}
```

## Usage Instructions

1. **Import Policy**: Load this policy into Guardian via the UI or API
2. **Configure Roles**: Assign users to appropriate roles (Registrant, Verifier, Issuer)
3. **Set Schema**: Define document schemas for different credential types
4. **Deploy**: Activate the policy to start accepting registrations

## Integration with IDweb3

The policy integrates with IDweb3 backend through:
- REST API endpoints for document submission
- Webhook notifications for verification status
- Hedera topic message coordination
- IPFS metadata synchronization