import React from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity } from 'react-native';
import { formatCurrency } from '../../utils/formatters';

export interface Transaction {
  id: string;
  hash: string;
  from_address: string;
  to_address: string;
  amount: string;
  timestamp: string;
  block_number: number;
  status: 'confirmed' | 'pending' | 'failed';
}

interface TransactionHistoryProps {
  transactions: Transaction[];
  isLoading: boolean;
  error: Error | null;
  onRefresh: () => void;
  walletAddress: string;
  onViewTransaction: (hash: string) => void;
}

export default function TransactionHistory({
  transactions,
  isLoading,
  error,
  onRefresh,
  walletAddress,
  onViewTransaction
}: TransactionHistoryProps) {
  if (isLoading && !transactions.length) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6366f1" />
        <Text style={styles.loadingText}>Loading transactions...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Error loading transactions</Text>
        <Text style={styles.errorDetail}>{error.message}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={onRefresh}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!transactions.length) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No transactions found</Text>
        <TouchableOpacity style={styles.refreshButton} onPress={onRefresh}>
          <Text style={styles.refreshButtonText}>Refresh</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const renderTransactionItem = ({ item }: { item: Transaction }) => {
    const isIncoming = item.to_address.toLowerCase() === walletAddress.toLowerCase();
    const amount = parseFloat(item.amount);
    
    return (
      <TouchableOpacity 
        style={styles.transactionItem} 
        onPress={() => onViewTransaction(item.hash)}
      >
        <View style={styles.transactionHeader}>
          <Text style={styles.transactionType}>
            {isIncoming ? 'Received' : 'Sent'}
          </Text>
          <Text 
            style={[
              styles.transactionAmount, 
              isIncoming ? styles.incoming : styles.outgoing
            ]}
          >
            {isIncoming ? '+' : '-'} {formatCurrency(amount, 'USD')}
          </Text>
        </View>
        
        <View style={styles.transactionDetails}>
          <Text style={styles.transactionDate}>
            {new Date(item.timestamp).toLocaleString()}
          </Text>
          <View style={[styles.statusBadge, styles[item.status]]}>
            <Text style={styles.statusText}>{item.status}</Text>
          </View>
        </View>
        
        <View style={styles.addressContainer}>
          {isIncoming ? (
            <>
              <Text style={styles.addressLabel}>From:</Text>
              <Text style={styles.address} numberOfLines={1} ellipsizeMode="middle">
                {item.from_address}
              </Text>
            </>
          ) : (
            <>
              <Text style={styles.addressLabel}>To:</Text>
              <Text style={styles.address} numberOfLines={1} ellipsizeMode="middle">
                {item.to_address}
              </Text>
            </>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={transactions}
        renderItem={renderTransactionItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
  },
  listContent: {
    paddingBottom: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ef4444',
    marginBottom: 8,
  },
  errorDetail: {
    fontSize: 14,
    color: '#666',
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
    fontWeight: 'bold',
  },
  emptyContainer: {
    padding: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 16,
  },
  refreshButton: {
    backgroundColor: '#e5e7eb',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  refreshButtonText: {
    color: '#4b5563',
    fontWeight: 'bold',
  },
  transactionItem: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginTop: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  transactionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  transactionType: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  incoming: {
    color: '#10b981',
  },
  outgoing: {
    color: '#ef4444',
  },
  transactionDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  transactionDate: {
    fontSize: 14,
    color: '#6b7280',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  confirmed: {
    backgroundColor: '#d1fae5',
  },
  pending: {
    backgroundColor: '#fef3c7',
  },
  failed: {
    backgroundColor: '#fee2e2',
  },
  statusText: {
    fontSize: 12,
    fontWeight: 'bold',
    textTransform: 'capitalize',
  },
  addressContainer: {
    marginTop: 4,
  },
  addressLabel: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 2,
  },
  address: {
    fontSize: 14,
    color: '#4b5563',
    fontFamily: 'monospace',
  },
}); 