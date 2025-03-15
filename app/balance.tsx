import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, RefreshControl, ScrollView, TouchableOpacity, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useUsdcBalance } from '../hooks/useUsdcBalance';
import { useTransactionHistory } from '../hooks/useTransactionHistory';
import { formatCurrency } from '../utils/formatters';
import TransactionHistory from '../components/ui/TransactionHistory';

// Constants
const TARGET_WALLET = "0x2B769d40A46Bde0718f0AB1242c7d5eAe7402e71";
const BASE_EXPLORER_URL = "https://basescan.org/address/";
const BASE_TX_EXPLORER_URL = "https://basescan.org/tx/";

export default function BalancePage() {
  const { 
    balance, 
    isLoading: isBalanceLoading, 
    error: balanceError, 
    lastUpdated, 
    refreshBalance 
  } = useUsdcBalance(0); // Disable automatic polling - only update when Supabase real-time event occurs

  const {
    transactions,
    isLoading: isTransactionsLoading,
    error: transactionsError,
    refreshTransactions
  } = useTransactionHistory(20); // Fetch up to 20 recent transactions

  // Immediately fetch data on page load
  useEffect(() => {
    refreshBalance();
    refreshTransactions();
  }, []);
  
  const handleViewOnExplorer = () => {
    const url = `${BASE_EXPLORER_URL}${TARGET_WALLET}`;
    Linking.openURL(url).catch(err => 
      console.error('Error opening explorer URL:', err)
    );
  };

  const handleViewTransaction = (hash: string) => {
    const url = `${BASE_TX_EXPLORER_URL}${hash}`;
    Linking.openURL(url).catch(err => 
      console.error('Error opening transaction URL:', err)
    );
  };

  const formatLastUpdated = () => {
    if (!lastUpdated) return 'Never updated';
    
    // Format relative time
    const now = new Date();
    const diffMs = now.getTime() - lastUpdated.getTime();
    const diffSecs = Math.floor(diffMs / 1000);
    
    if (diffSecs < 60) return `${diffSecs} seconds ago`;
    if (diffSecs < 3600) return `${Math.floor(diffSecs / 60)} minutes ago`;
    
    // If more than an hour, show the time
    return lastUpdated.toLocaleTimeString();
  };

  const handleRefresh = () => {
    refreshBalance();
    refreshTransactions();
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={isBalanceLoading || isTransactionsLoading}
            onRefresh={handleRefresh}
            tintColor="#6366f1"
          />
        }
      >
        <View style={styles.header}>
          <Text style={styles.title}>USDC Balance</Text>
          <Text style={styles.subtitle}>
            Last updated: {formatLastUpdated()}
          </Text>
        </View>

        <View style={styles.balanceCard}>
          {isBalanceLoading && !balance ? (
            <ActivityIndicator size="large" color="#6366f1" />
          ) : balanceError ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>Error loading balance</Text>
              <Text style={styles.errorDetail}>{balanceError.message}</Text>
              <TouchableOpacity 
                style={styles.retryButton} 
                onPress={refreshBalance}
              >
                <Text style={styles.retryButtonText}>Retry</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <Text style={styles.balanceAmount}>
                {formatCurrency(balance, 'USD')}
              </Text>
              <Text style={styles.balanceSubtitle}>Available USDC</Text>
            </>
          )}
        </View>
        
        <View style={styles.walletInfo}>
          <Text style={styles.walletInfoLabel}>Wallet Address:</Text>
          <Text style={styles.walletAddress} numberOfLines={1} ellipsizeMode="middle">
            {TARGET_WALLET}
          </Text>
          <TouchableOpacity 
            style={styles.explorerButton} 
            onPress={handleViewOnExplorer}
          >
            <Text style={styles.explorerButtonText}>View on BaseScan</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.transactionSection}>
          <Text style={styles.sectionTitle}>Transaction History</Text>
          <TransactionHistory
            transactions={transactions}
            isLoading={isTransactionsLoading}
            error={transactionsError}
            onRefresh={refreshTransactions}
            walletAddress={TARGET_WALLET}
            onViewTransaction={handleViewTransaction}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 30,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#6b7280',
  },
  balanceCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 15,
    elevation: 2,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 150,
    marginBottom: 24,
  },
  balanceAmount: {
    fontSize: 36,
    fontWeight: '700',
    color: '#111827',
  },
  balanceSubtitle: {
    fontSize: 16,
    color: '#6b7280',
    marginTop: 8,
  },
  errorContainer: {
    alignItems: 'center',
  },
  errorText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ef4444',
    marginBottom: 8,
  },
  errorDetail: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#6366f1',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  retryButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  walletInfo: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 15,
    elevation: 2,
  },
  walletInfoLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
    marginBottom: 4,
  },
  walletAddress: {
    fontSize: 16,
    color: '#111827',
    marginBottom: 16,
  },
  explorerButton: {
    backgroundColor: '#e0e7ff',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  explorerButtonText: {
    color: '#4f46e5',
    fontWeight: '600',
  },
  transactionSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
}); 