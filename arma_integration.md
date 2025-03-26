# ARMA Integration Planning

## 1. Security & Key Management

**Decision**: Continue using Tenderly for wallet operations
- Store ARMA wallet private key in Tenderly secrets
- Use existing combo_withdrawal Web3 action (ID: 235de538-7869-4ff3-9918-b2dec1496522)
- Modify Web3 action to handle deposits/withdrawals for the new ARMA wallet
- JWT token generation will be separate, used only for activating/deactivating the ARMA agent

**Benefits**:
- Maintains existing security model
- Keeps private keys encrypted in Tenderly's environment
- Consistent with current architecture
- Separates concerns between transaction processing and agent management

## 2. UI/UX for ARMA Activation

**Goals**:
- Eventually automate activation when funds land in the wallet
- Initially implement manual activation for testing
- Provide clear user feedback on agent status

**Implementation Plan**:
- Create test UI with manual activation button
- Later, implement automatic activation upon deposit detection
- Include deactivation functionality for emergency cases

## 3. Tenderly Actions Structure

**Deposit Monitoring**:
- Update existing usdc-monitor action (ID: 3b027ea7-ba88-4e12-852b-282018fb271e) to use ARMA wallet as target
- This will maintain the current functionality while directing funds to the ARMA-managed wallet

**ARMA Management Actions**:
- Create new activation Tenderly action
- Create new deactivation Tenderly action
- Continue using existing combo_withdrawal action (modified for new wallet)

**Withdrawal Flow**:
1. User presses "Withdraw All" button
2. App triggers ARMA deactivation Tenderly action
3. Action calls ARMA deactivation endpoint using JWT
4. Upon successful deactivation, triggers the combo_withdrawal action
5. Funds are withdrawn from ARMA wallet to origin wallet

## 4. JWT Token Management

**Approach**: Scheduled Daily Token Refresh
- Create a scheduled Tenderly action to refresh the JWT token
- Run daily at a specific low-traffic time (e.g., 3:00 AM)
- Store token in Tenderly secrets for use by other actions

**Benefits**:
- Avoids token refreshes during demos or business hours
- Ensures token is always valid during operational hours
- Separates token management from other operations
- Reduces latency during ARMA interactions

**Implementation Details**:
- Use cron expression "0 3 * * *" for scheduling (3:00 AM daily)
- Include robust error handling and retry mechanisms
- Optional fallback: check token age during operations as safety net

## 5. Status Indicators

**UI Elements**:
- Clear status indicator showing if ARMA agent is active
- Updates based on known state of the agent

## 6. Future Enhancements (Post-Initial Implementation)

**Protocol Selection**:
- Allow users to select which protocols ARMA should utilize
- Display current protocol allocation

**Yield Reporting**:
- Show estimated yield improvements
- Display historical performance 