import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
  Linking
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useUsdcBalance } from '@/hooks/useUsdcBalance';
import { useAuth } from '../_layout';

// Get screen width for consistent sizing
const { width, height } = Dimensions.get('window');
const contentPadding = 24;
const contentWidth = width - (contentPadding * 2);

const WalletBalancePage = () => {
  const { setWalletBalance } = useAuth();
  const {
    balance,
    isLoading,
    error,
    lastUpdated,
    refreshBalance
  } = useUsdcBalance(0); // Disable automatic polling - only update when Supabase real-time event occurs
  
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTab, setSelectedTab] = useState('balance');
  
  // Update the main app wallet balance whenever our USDC balance changes
  useEffect(() => {
    if (!isLoading && !error) {
      setWalletBalance(balance);
    }
  }, [balance, isLoading, error, setWalletBalance]);
  
  // Format the balance for display
  const formattedBalance = Math.floor(balance).toLocaleString();
  const decimalPart = (balance % 1).toFixed(5).substring(2);
  
  // Format the last updated time
  const formattedLastUpdated = lastUpdated 
    ? `Last updated: ${lastUpdated.toLocaleTimeString()}`
    : 'Updating...';
  
  // Pull-to-refresh handler
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refreshBalance();
    setRefreshing(false);
  }, [refreshBalance]);
  
  // Placeholder functions for various actions
  const handleAddFunds = () => {
    console.log('Add funds pressed');
    // Implementation would go here
  };
  
  const handleSend = () => {
    console.log('Send pressed');
    // Implementation would go here
  };
  
  const handleReceive = () => {
    console.log('Receive pressed');
    // Implementation would go here
  };
  
  const handleLearnMore = () => {
    console.log('Learn more pressed');
    // Implementation would go here
  };
  
  const handleViewActivity = () => {
    console.log('View activity pressed');
    // Implementation would go here
  };
  
  const handleTabPress = (tab: string) => {
    setSelectedTab(tab);
  };
  
  // Dummy transaction data for the Activity tab
  const transactions = [
    { id: '1', type: 'received', amount: 100, from: '0x123...abc', date: new Date(Date.now() - 3600000) },
    { id: '2', type: 'sent', amount: 50, to: '0x456...def', date: new Date(Date.now() - 86400000) },
    { id: '3', type: 'received', amount: 75, from: '0x789...ghi', date: new Date(Date.now() - 172800000) },
    { id: '4', type: 'received', amount: 25, from: '0xabc...123', date: new Date(Date.now() - 259200000) }
  ];
  
  const renderBalanceTab = () => (
    <>
      {/* Balance Section */}
      <View style={styles.balanceContainer}>
        <Text style={styles.balanceLabel}>Your USDC Balance</Text>
        {isLoading && !balance ? (
          <ActivityIndicator size="large" color="#0052B4" />
        ) : (
          <>
            <Text style={styles.balanceAmount}>
              <Text style={styles.currencySymbol}>$</Text>
              {formattedBalance}
              <Text style={styles.cents}>.{decimalPart}</Text>
            </Text>
            <Text style={styles.lastUpdated}>{formattedLastUpdated}</Text>
          </>
        )}
        
        <TouchableOpacity 
          style={styles.addFundsButton}
          onPress={handleAddFunds}
        >
          <Text style={styles.addFundsText}>Add funds</Text>
        </TouchableOpacity>
      </View>
      
      {/* Activity and Earn Cards */}
      <View style={styles.cardsRow}>
        <TouchableOpacity 
          style={styles.card}
          onPress={handleViewActivity}
        >
          <Text style={styles.cardTitle}>Activity</Text>
          <Text style={styles.cardDescription}>
            Track your Ampli transactions and see your payment history.
          </Text>
          <View style={styles.cardFooter}>
            <Text style={styles.cardLink}>See all</Text>
            <MaterialIcons name="chevron-right" size={20} color="#005BB2" />
          </View>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.card}
          onPress={handleLearnMore}
        >
          <Text style={styles.cardTitle}>Earn</Text>
          <Text style={styles.cardDescription}>
            Refer friends, earn rewards.
          </Text>
          <View style={styles.cardFooter}>
            <Text style={styles.cardLink}>Learn more</Text>
            <MaterialIcons name="chevron-right" size={20} color="#005BB2" />
          </View>
        </TouchableOpacity>
      </View>
      
      {/* Send & Receive Section */}
      <View style={styles.sendReceiveContainer}>
        <Text style={styles.sendReceiveTitle}>Send & Receive</Text>
        <Text style={styles.sendReceiveDescription}>
          Instantly send or receive funds with no fees.
        </Text>
        
        <View style={styles.buttonsRow}>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={handleSend}
          >
            <Text style={styles.actionButtonText}>Send</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={handleReceive}
          >
            <Text style={styles.actionButtonText}>Receive</Text>
          </TouchableOpacity>
        </View>
      </View>
    </>
  );
  
  const renderActivityTab = () => (
    <View style={styles.tabContent}>
      <Text style={styles.tabTitle}>Recent Activity</Text>
      
      {transactions.map(tx => (
        <View key={tx.id} style={styles.transactionItem}>
          <View style={styles.transactionIconContainer}>
            <MaterialIcons 
              name={tx.type === 'received' ? 'arrow-downward' : 'arrow-upward'} 
              size={24} 
              color={tx.type === 'received' ? '#009E60' : '#FF4500'} 
            />
          </View>
          <View style={styles.transactionDetails}>
            <Text style={styles.transactionType}>
              {tx.type === 'received' ? 'Received USDC' : 'Sent USDC'}
            </Text>
            <Text style={styles.transactionDate}>
              {tx.date.toLocaleDateString()} {tx.date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
            </Text>
            {tx.from && (
              <Text style={styles.transactionAddress}>From: {tx.from}</Text>
            )}
            {tx.to && (
              <Text style={styles.transactionAddress}>To: {tx.to}</Text>
            )}
          </View>
          <Text style={[
            styles.transactionAmount,
            tx.type === 'received' ? styles.amountReceived : styles.amountSent
          ]}>
            {tx.type === 'received' ? '+' : '-'}${tx.amount.toFixed(2)}
          </Text>
        </View>
      ))}
      
      <TouchableOpacity style={styles.viewAllButton}>
        <Text style={styles.viewAllButtonText}>View Full History</Text>
      </TouchableOpacity>
    </View>
  );
  
  const renderSendReceiveTab = () => (
    <View style={styles.tabContent}>
      <Text style={styles.tabTitle}>Send & Receive USDC</Text>
      
      <View style={styles.sendReceiveOptions}>
        <TouchableOpacity style={styles.optionCard} onPress={handleSend}>
          <View style={styles.optionIconContainer}>
            <MaterialIcons name="send" size={32} color="#0052B4" />
          </View>
          <Text style={styles.optionTitle}>Send</Text>
          <Text style={styles.optionDescription}>
            Send USDC to another wallet instantly with no fees
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.optionCard} onPress={handleReceive}>
          <View style={styles.optionIconContainer}>
            <MaterialIcons name="call-received" size={32} color="#0052B4" />
          </View>
          <Text style={styles.optionTitle}>Receive</Text>
          <Text style={styles.optionDescription}>
            Receive USDC from another wallet instantly with no fees
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
  
  const renderEarnTab = () => (
    <View style={styles.tabContent}>
      <Text style={styles.tabTitle}>Earn Rewards</Text>
      
      <View style={styles.earnCard}>
        <View style={styles.earnCardHeader}>
          <MaterialIcons name="card-giftcard" size={32} color="#0052B4" />
          <Text style={styles.earnCardTitle}>Refer & Earn</Text>
        </View>
        <Text style={styles.earnCardDescription}>
          Invite friends to join Ampli and earn rewards when they sign up and add funds.
        </Text>
        <TouchableOpacity style={styles.earnCardButton}>
          <Text style={styles.earnCardButtonText}>Get Referral Link</Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.earnRules}>
        <Text style={styles.earnRulesTitle}>How it works</Text>
        <View style={styles.earnRule}>
          <Text style={styles.earnRuleNumber}>1</Text>
          <Text style={styles.earnRuleText}>Invite friends using your personal referral link</Text>
        </View>
        <View style={styles.earnRule}>
          <Text style={styles.earnRuleNumber}>2</Text>
          <Text style={styles.earnRuleText}>They sign up and add at least $10 to their account</Text>
        </View>
        <View style={styles.earnRule}>
          <Text style={styles.earnRuleNumber}>3</Text>
          <Text style={styles.earnRuleText}>You both receive $5 in USDC as a reward</Text>
        </View>
      </View>
    </View>
  );
  
  const renderAddFundsTab = () => (
    <View style={styles.tabContent}>
      <Text style={styles.tabTitle}>Add Funds</Text>
      
      <View style={styles.fundingOptions}>
        <TouchableOpacity style={styles.fundingOption}>
          <View style={styles.fundingIconContainer}>
            <MaterialIcons name="account-balance" size={24} color="#0052B4" />
          </View>
          <View style={styles.fundingDetails}>
            <Text style={styles.fundingTitle}>Bank Transfer (ACH)</Text>
            <Text style={styles.fundingDescription}>2-3 business days • No fee</Text>
          </View>
          <MaterialIcons name="chevron-right" size={24} color="#888" />
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.fundingOption}>
          <View style={styles.fundingIconContainer}>
            <MaterialIcons name="credit-card" size={24} color="#0052B4" />
          </View>
          <View style={styles.fundingDetails}>
            <Text style={styles.fundingTitle}>Debit Card</Text>
            <Text style={styles.fundingDescription}>Instant • 2.5% fee</Text>
          </View>
          <MaterialIcons name="chevron-right" size={24} color="#888" />
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.fundingOption}>
          <View style={styles.fundingIconContainer}>
            <MaterialIcons name="swap-horiz" size={24} color="#0052B4" />
          </View>
          <View style={styles.fundingDetails}>
            <Text style={styles.fundingTitle}>Crypto Transfer</Text>
            <Text style={styles.fundingDescription}>Minutes • Network fee only</Text>
          </View>
          <MaterialIcons name="chevron-right" size={24} color="#888" />
        </TouchableOpacity>
      </View>
    </View>
  );
  
  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Wallet</Text>
      </View>
      
      {/* Main Tab Navigation */}
      <View style={styles.tabBar}>
        <TouchableOpacity 
          style={[styles.tabButton, selectedTab === 'balance' && styles.activeTabButton]}
          onPress={() => handleTabPress('balance')}
        >
          <MaterialIcons 
            name="account-balance-wallet" 
            size={22} 
            color={selectedTab === 'balance' ? '#0052B4' : '#666'} 
          />
          <Text style={[styles.tabText, selectedTab === 'balance' && styles.activeTabText]}>
            Balance
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.tabButton, selectedTab === 'activity' && styles.activeTabButton]}
          onPress={() => handleTabPress('activity')}
        >
          <MaterialIcons 
            name="history" 
            size={22} 
            color={selectedTab === 'activity' ? '#0052B4' : '#666'} 
          />
          <Text style={[styles.tabText, selectedTab === 'activity' && styles.activeTabText]}>
            Activity
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.tabButton, selectedTab === 'send-receive' && styles.activeTabButton]}
          onPress={() => handleTabPress('send-receive')}
        >
          <MaterialIcons 
            name="swap-horiz" 
            size={22} 
            color={selectedTab === 'send-receive' ? '#0052B4' : '#666'} 
          />
          <Text style={[styles.tabText, selectedTab === 'send-receive' && styles.activeTabText]}>
            Send/Receive
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.tabButton, selectedTab === 'earn' && styles.activeTabButton]}
          onPress={() => handleTabPress('earn')}
        >
          <MaterialIcons 
            name="card-giftcard" 
            size={22} 
            color={selectedTab === 'earn' ? '#0052B4' : '#666'} 
          />
          <Text style={[styles.tabText, selectedTab === 'earn' && styles.activeTabText]}>
            Earn
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.tabButton, selectedTab === 'add-funds' && styles.activeTabButton]}
          onPress={() => handleTabPress('add-funds')}
        >
          <MaterialIcons 
            name="add-circle-outline" 
            size={22} 
            color={selectedTab === 'add-funds' ? '#0052B4' : '#666'} 
          />
          <Text style={[styles.tabText, selectedTab === 'add-funds' && styles.activeTabText]}>
            Add Funds
          </Text>
        </TouchableOpacity>
      </View>
      
      {/* Tab Content */}
      <ScrollView 
        style={styles.scrollView} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#0052B4']}
            tintColor="#0052B4"
          />
        }
      >
        {/* Render different content based on selected tab */}
        {selectedTab === 'balance' && renderBalanceTab()}
        {selectedTab === 'activity' && renderActivityTab()}
        {selectedTab === 'send-receive' && renderSendReceiveTab()}
        {selectedTab === 'earn' && renderEarnTab()}
        {selectedTab === 'add-funds' && renderAddFundsTab()}
        
        {/* Footer spacing */}
        <View style={styles.footer} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    paddingHorizontal: contentPadding,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#EFEFEF',
    backgroundColor: '#FFFFFF',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111111',
  },
  scrollView: {
    flex: 1,
  },
  balanceContainer: {
    marginHorizontal: contentPadding,
    marginTop: 24,
    paddingHorizontal: 20,
    paddingVertical: 24,
    backgroundColor: '#F5F9FF',
    borderRadius: 16,
    alignItems: 'center',
  },
  balanceLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#555555',
    marginBottom: 8,
  },
  balanceAmount: {
    fontSize: 40,
    fontWeight: '700',
    color: '#111111',
    marginVertical: 8,
  },
  currencySymbol: {
    fontSize: 36,
    fontWeight: '600',
    color: '#111111',
  },
  cents: {
    fontSize: 28,
    fontWeight: '500',
    color: '#666666',
  },
  lastUpdated: {
    fontSize: 12,
    color: '#777777',
    marginBottom: 16,
  },
  addFundsButton: {
    backgroundColor: '#0052B4',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 8,
    width: '100%',
    alignItems: 'center',
    marginTop: 8,
  },
  addFundsText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  cardsRow: {
    flexDirection: 'row',
    marginTop: 20,
    paddingHorizontal: contentPadding,
    justifyContent: 'space-between',
  },
  card: {
    width: (contentWidth / 2) - 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111111',
    marginBottom: 8,
  },
  cardDescription: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 12,
    lineHeight: 20,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardLink: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0052B4',
    marginRight: 4,
  },
  sendReceiveContainer: {
    marginTop: 24,
    marginHorizontal: contentPadding,
    paddingVertical: 20,
  },
  sendReceiveTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111111',
    marginBottom: 8,
  },
  sendReceiveDescription: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 16,
  },
  buttonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    backgroundColor: '#E8F1FB',
    width: (contentWidth / 2) - 8,
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  actionButtonText: {
    color: '#0052B4',
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    height: 40,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#EFEFEF',
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: 8,
  },
  activeTabButton: {
    backgroundColor: '#E8F1FB',
  },
  tabText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#666666',
    marginTop: 4,
  },
  activeTabText: {
    color: '#0052B4',
    fontWeight: '600',
  },
  tabContent: {
    paddingHorizontal: contentPadding,
    paddingTop: 16,
  },
  tabTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111111',
    marginBottom: 16,
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  transactionIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  transactionDetails: {
    flex: 1,
  },
  transactionType: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111111',
  },
  transactionDate: {
    fontSize: 12,
    color: '#888888',
    marginTop: 4,
  },
  transactionAddress: {
    fontSize: 12,
    color: '#666666',
    marginTop: 2,
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: '600',
  },
  amountReceived: {
    color: '#009E60',
  },
  amountSent: {
    color: '#FF4500',
  },
  viewAllButton: {
    backgroundColor: '#F5F5F5',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  viewAllButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#0052B4',
  },
  sendReceiveOptions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  optionCard: {
    width: (contentWidth / 2) - 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    alignItems: 'center',
  },
  optionIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#E8F1FB',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  optionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111111',
    marginBottom: 8,
  },
  optionDescription: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 20,
  },
  earnCard: {
    backgroundColor: '#F5F9FF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
  },
  earnCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  earnCardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111111',
    marginLeft: 12,
  },
  earnCardDescription: {
    fontSize: 14,
    color: '#666666',
    lineHeight: 20,
    marginBottom: 16,
  },
  earnCardButton: {
    backgroundColor: '#0052B4',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  earnCardButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  earnRules: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  earnRulesTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111111',
    marginBottom: 16,
  },
  earnRule: {
    flexDirection: 'row',
    marginBottom: 12,
    alignItems: 'flex-start',
  },
  earnRuleNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#0052B4',
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: 24,
    fontWeight: '600',
    marginRight: 12,
  },
  earnRuleText: {
    flex: 1,
    fontSize: 14,
    color: '#444444',
    lineHeight: 20,
  },
  fundingOptions: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  fundingOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  fundingIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E8F1FB',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  fundingDetails: {
    flex: 1,
  },
  fundingTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111111',
  },
  fundingDescription: {
    fontSize: 12,
    color: '#888888',
    marginTop: 4,
  },
});

export default WalletBalancePage; 