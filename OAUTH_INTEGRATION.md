# Deriv OAuth 2.0 Integration Guide

## Overview

This guide explains how our trading platform uses Deriv's OAuth 2.0 authentication flow to securely handle multi-account connections without requiring users to manually copy/paste API tokens.

## Architecture

### OAuth Flow

```
User → [Connect Button] → Deriv OAuth Server → User Login → Redirect to /oauth-redirect
           ↓
    [Token Exchange]
           ↓
Backend validates tokens → Encrypt & store → Deriv WebSocket API
```

### Multi-Account Support

Deriv's OAuth can return multiple accounts if you have multiple real/demo accounts or currencies:

```
Deriv OAuth Response:
token1=XXX&acct1=CR123&cur1=USD&token2=YYY&acct2=CR456&cur2=EUR
        ↓
Frontend parses all tokens → Sends to backend → Backend creates individual account records
```

## Frontend Setup

### 1. Environment Variables

Add to `.env`:

```env
VITE_DERIV_APP_ID=YOUR_DERIV_APP_ID
VITE_API_URL=http://localhost:5000/api
```

### 2. OAuthRedirectPage Component

Located at `/frontend/src/pages/OAuthRedirectPage.tsx`

**Purpose**: Handles the Deriv OAuth callback
- Parses URL parameters (token1, acct1, cur1, etc.)
- Sends all captured tokens to your backend
- Shows success/error state
- Redirects to dashboard on success

**Key Features**:
- Multi-account parsing
- Error handling with retry
- Loading state management
- Success confirmation with auto-redirect

### 3. DerivConnectPage Component

Located at `/frontend/src/pages/DerivConnectPage.tsx`

**Purpose**: User-friendly OAuth connection interface
- Single "Connect with Deriv OAuth" button
- OAuth flow explanation
- Security/privacy benefits
- FAQ section

**Key Features**:
- Seamless one-click connection
- No manual token handling
- Educational content about OAuth
- Security transparency

### 4. API Client Updates

```typescript
// Connect multiple OAuth accounts
connectDerivOAuthAccounts(accounts: Array<{
  token: string
  accountId: string
  currency: string
}>) {
  return this.instance.post('/accounts/oauth/connect', { accounts });
}
```

## Backend Setup

### 1. Database Schema

The `DerivAccount` model stores:

```typescript
{
  id: UUID,                    // Primary key
  userId: UUID,               // Owner of the account
  accountId: string,          // Deriv account ID (CR123, etc.)
  accountName: string,        // User-friendly name
  encryptedToken: string,     // AES-256 encrypted OAuth token
  currency: string,           // Account currency (USD, EUR, BTC, etc.)
  accountType: 'real'|'demo', // Account type
  balance: Decimal,           // Current balance
  connectionStatus: string,   // 'connected' | 'error' | 'disconnected'
  isDefault: boolean,         // Default account for operations
  lastSyncedAt: Date,        // Last balance sync timestamp
  createdAt: Date,
  updatedAt: Date
}
```

### 2. OAuth Controller

Located at `/backend/src/controllers/oauthController.ts`

**Endpoint**: `POST /accounts/oauth/connect`

**Request Body**:
```json
{
  "accounts": [
    {
      "token": "OAuth token from Deriv",
      "accountId": "CR123",
      "currency": "USD"
    },
    {
      "token": "OAuth token for second account",
      "accountId": "CR456",
      "currency": "EUR"
    }
  ]
}
```

**Response**:
```json
{
  "success": true,
  "message": "Successfully connected 2 account(s)",
  "accounts": [
    {
      "id": "uuid-1",
      "accountId": "CR123",
      "accountName": "Real - CR123 (USD)",
      "currency": "USD",
      "balance": 5000.00,
      "connectionStatus": "connected"
    },
    {
      "id": "uuid-2",
      "accountId": "CR456",
      "accountName": "Real - CR456 (EUR)",
      "currency": "EUR",
      "balance": 3500.50,
      "connectionStatus": "connected"
    }
  ]
}
```

### 3. OAuth Service Logic

The controller handles:

1. **Token Validation**: Each token is validated against Deriv API
2. **Duplicate Prevention**: Checks if accounts already exist for other users
3. **Account Creation**: Creates `DerivAccount` records for each token
4. **Default Account Selection**: Sets first account as default if none exists
5. **Balance Synchronization**: Immediately syncs balances for all new accounts
6. **Error Handling**: Gracefully handles partial failures

### 4. Encryption Service

Located at `/backend/src/utils/encryption.ts`

**Token Encryption**:

```typescript
const encryptedToken = encryptionService.encrypt(oauthToken);
// Stored in database as AES-256 encrypted string

// When needed:
const decryptedToken = encryptionService.decrypt(encryptedToken);
// Used to connect to Deriv WebSocket API
```

**Security Features**:
- AES-256-CBC encryption
- Random IV for each token
- Separate encryption keys
- Stored securely in environment variables

### 5. Deriv WebSocket Connection

In `derivAuthService.ts`:

```typescript
const ws = new WebSocket(ENV.DERIV.API_URL);

ws.onopen = () => {
  const req = this.buildAuthRequest(decryptedToken);
  ws.send(JSON.stringify(req));
};

// Request format:
{
  "authorize": decryptedToken,
  "req_id": 1
}
```

## Environment Configuration

### Backend (.env)

```env
# Deriv OAuth
DERIV_APP_ID=YOUR_APP_ID_HERE
DERIV_API_URL=wss://ws.derivws.com/websockets/v3

# Encryption
ENCRYPTION_KEY=your-32-char-hex-key-for-aes256
ENCRYPTION_IV=your-16-char-hex-key

# Frontend
CLIENT_URL=http://localhost:3000
```

### Frontend (.env)

```env
VITE_DERIV_APP_ID=YOUR_APP_ID_HERE
VITE_API_URL=http://localhost:5000/api
```

## Getting a Deriv App ID

1. Go to [Deriv.com Developer Dashboard](https://app.deriv.com/account/settings/apps)
2. Create a new app:
   - Name: Your Platform Name
   - Redirect URL: `https://your-domain.com/oauth-redirect`
   - Scope: `trade` (for trading operations)
3. Copy the `App ID` to your environment variables

## Step-by-Step Implementation

### 1. User Clicks "Connect with Deriv"

```typescript
const DERIV_OAUTH_URL = 'https://oauth.deriv.com/oauth2/authorize';
const oauthParams = new URLSearchParams({
  app_id: YOUR_APP_ID,
  scope: 'trade',
  redirect_uri: 'https://yourapp.com/oauth-redirect',
  response_type: 'token',
});
window.location.href = `${DERIV_OAUTH_URL}?${oauthParams}`;
```

### 2. User Logs In at Deriv

User enters their Deriv credentials (username/password/2FA)

### 3. Deriv Redirects Back with Tokens

Redirects to: `https://yourapp.com/oauth-redirect?token1=XXX&acct1=CR123&cur1=USD&...`

### 4. Frontend Parses and Sends to Backend

```typescript
// OAuthRedirectPage parses params
const accounts = [];
let index = 1;
while (params.has(`token${index}`)) {
  accounts.push({
    token: params.get(`token${index}`),
    accountId: params.get(`acct${index}`),
    currency: params.get(`cur${index}`),
  });
  index++;
}

// Send to backend
const response = await apiClient.connectDerivOAuthAccounts(accounts);
```

### 5. Backend Creates Account Records

```typescript
// For each account:
const encryptedToken = encryptionService.encrypt(oauthToken);
const account = await derivAccountRepo.save({
  userId,
  accountId,
  encryptedToken,
  currency,
  accountType: 'real',
  connectionStatus: 'connected',
});

// Sync balance immediately
await this.getAccountBalance(accountId);
```

### 6. Frontend Redirects to Dashboard

Users see their account(s) connected and ready to trade!

## Security Considerations

### Token Storage

✅ **Do**:
- Store encrypted tokens using AES-256
- Use random IVs for each encryption
- Keep encryption keys in secure environment variables
- Never log or expose tokens

❌ **Don't**:
- Store tokens in plain text
- Send tokens in browser console/logs
- Store tokens in localStorage (even encrypted)
- Share encryption keys in code

### Token Scope

The platform requests **`trade` scope only**:
- Can execute trades
- Can read account info
- Cannot withdraw funds
- Cannot modify security settings

### Token Revocation

Users can revoke access anytime:

1. **Via Deriv**: Visit Deriv account settings → Connected apps → Revoke
2. **Via Platform**: Settings → Connected Accounts → Disconnect

Both actions will prevent the platform from accessing that account.

## Testing

### Test OAuth Flow Locally

1. Set up environment variables
2. Start backend: `npm run dev` (port 5000)
3. Start frontend: `npm run dev` (port 3000)
4. Visit `http://localhost:3000/connect-deriv`
5. Click "Connect with Deriv OAuth"
6. Use Deriv test credentials (if available)

### Manual Token Testing

For debugging, you can still use manual tokens:

```bash
curl -X POST http://localhost:5000/api/accounts/oauth/connect \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "accounts": [{
      "token": "YOUR_OAUTH_TOKEN",
      "accountId": "CR123",
      "currency": "USD"
    }]
  }'
```

## Troubleshooting

### Issue: "Invalid Deriv token"

**Cause**: Token from OAuth response is malformed
**Solution**: Verify Deriv App ID is correct and redirect URI matches exactly

### Issue: "This account is already connected to another user"

**Cause**: The Deriv account is already linked to a different user
**Solution**: User needs to disconnect from other account first or use a different Deriv account

### Issue: Balance sync fails

**Cause**: Network issue or Deriv API temporarily unavailable
**Solution**: Platform will retry. User can manually sync from Dashboard

### Issue: Multiple accounts not connecting

**Cause**: One of the tokens is invalid
**Solution**: Check that all `tokenX`, `acctX`, `curX` parameters are present

## API Reference

### POST /accounts/oauth/connect

Connect multiple OAuth accounts from Deriv

**Auth**: Bearer JWT Token (Required)

**Request**:
```json
{
  "accounts": [
    {
      "token": "string (OAuth token)",
      "accountId": "string (e.g., CR123)",
      "currency": "string (e.g., USD)"
    }
  ]
}
```

**Response** (201):
```json
{
  "success": true,
  "message": "string",
  "accounts": [
    {
      "id": "UUID",
      "accountId": "string",
      "accountName": "string",
      "currency": "string",
      "balance": "number",
      "connectionStatus": "string"
    }
  ]
}
```

### POST /accounts/oauth/disconnect

Disconnect all OAuth-connected accounts

**Auth**: Bearer JWT Token (Required)

**Response** (200):
```json
{
  "success": true,
  "message": "Disconnected X account(s)"
}
```

### GET /accounts

Get all connected accounts for user

**Auth**: Bearer JWT Token (Required)

**Response** (200):
```json
{
  "accounts": [DerivAccount[]]
}
```

## Next Steps

1. ✅ Deploy OAuth redirect handler
2. ✅ Update DerivConnectPage with OAuth button
3. ✅ Test OAuth flow end-to-end
4. ✅ Monitor account connections in logs
5. ✅ Handle token refresh (if needed in future)
6. ✅ Add account disconnection UI

## Support

For issues with:
- **Deriv OAuth**: Visit [Deriv Developer Docs](https://deriv.com/api)
- **Platform Integration**: Check logs in backend/logs
- **Encryption**: Review encryption.service.ts implementation
