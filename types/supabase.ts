export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      wallet_balances: {
        Row: {
          id: number
          wallet_address: string
          usdc_balance: number
          last_updated: string
          created_at: string
        }
        Insert: {
          id?: number
          wallet_address: string
          usdc_balance: number
          last_updated?: string
          created_at?: string
        }
        Update: {
          id?: number
          wallet_address?: string
          usdc_balance?: number
          last_updated?: string
          created_at?: string
        }
      }
      usdc_transactions: {
        Row: {
          id: number
          tx_hash: string
          from_address: string
          to_address: string
          amount: number
          block_number: number
          timestamp: string
          tenderly_event_id: string | null
          created_at: string
        }
        Insert: {
          id?: number
          tx_hash: string
          from_address: string
          to_address: string
          amount: number
          block_number: number
          timestamp: string
          tenderly_event_id?: string | null
          created_at?: string
        }
        Update: {
          id?: number
          tx_hash?: string
          from_address?: string
          to_address?: string
          amount?: number
          block_number?: number
          timestamp?: string
          tenderly_event_id?: string | null
          created_at?: string
        }
      }
      wallet_withdrawals: {
        Row: {
          id: number
          wallet_address: string
          withdrawal_time: string
          created_at: string
        }
        Insert: {
          id?: number
          wallet_address: string
          withdrawal_time?: string
          created_at?: string
        }
        Update: {
          id?: number
          wallet_address?: string
          withdrawal_time?: string
          created_at?: string
        }
      }
      interest_balances: {
        Row: {
          id: number
          wallet_address: string
          interest_amount: number
          last_updated: string
          created_at: string
        }
        Insert: {
          id?: number
          wallet_address: string
          interest_amount: number
          last_updated?: string
          created_at?: string
        }
        Update: {
          id?: number
          wallet_address?: string
          interest_amount?: number
          last_updated?: string
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
} 