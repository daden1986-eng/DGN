export enum SubscriptionType {
  PPPOE = 'PPPoE',
  STATIC = 'Static',
  HOTSPOT = 'Hotspot',
  VOUCHER = 'Mitra Voucher'
}

export enum PaymentMethod {
  TRANSFER = 'Transfer',
  CASH = 'Tunai'
}

export enum TransactionType {
  INCOME = 'Income',
  EXPENSE = 'Expense'
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  type: SubscriptionType;
  dueDate: number; // Day of month (1-31)
  monthlyFee: number; // Iuran Bulanan
  accumulatedDebt: number; // Akumulasi tunggakan jika tidak lunas
  remainingAnnualBalance: number; // Sisa nominal tahunan (berkurang tiap bulan)
  status: 'paid' | 'unpaid';
  lastPaymentDate?: string;
}

export interface Transaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  type: TransactionType;
  method: PaymentMethod;
  category?: string; // e.g., "Bill Payment", "Infrastructure", "Salary"
  proofImage?: string;
  customerId?: string;
}

export interface CompanySettings {
  name: string;
  address: string;
  phone: string;
  logoUrl: string;
  bankName: string;
  accountNumber: string;
  accountHolder: string;
  directorName: string;
}

export interface Investor {
  id: string;
  name: string;
  sharePercentage: number; // 0-100
}

export interface AppState {
  customers: Customer[];
  transactions: Transaction[];
  settings: CompanySettings;
  investors: Investor[];
}