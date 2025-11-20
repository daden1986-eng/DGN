import { AppState, SubscriptionType, PaymentMethod, TransactionType } from './types';

export const INITIAL_STATE: AppState = {
  settings: {
    name: "DGN NETWORK",
    address: "Jl. Teknologi No. 123, Digital Valley",
    phone: "0812-3456-7890",
    logoUrl: "",
    bankName: "BCA",
    accountNumber: "1234567890",
    accountHolder: "DGN Official",
    directorName: "Bpk. Admin DGN"
  },
  investors: [
    { id: '1', name: 'Investor A', sharePercentage: 30 },
    { id: '2', name: 'Investor B', sharePercentage: 20 },
  ],
  customers: [
    {
      id: 'C001',
      name: 'Budi Santoso',
      phone: '628123456789',
      type: SubscriptionType.PPPOE,
      dueDate: 5,
      monthlyFee: 150000,
      status: 'unpaid'
    },
    {
      id: 'C002',
      name: 'Warung Kopi Javanica',
      phone: '628198765432',
      type: SubscriptionType.HOTSPOT,
      dueDate: 10,
      monthlyFee: 300000,
      status: 'paid',
      lastPaymentDate: '2023-10-10'
    }
  ],
  transactions: [
    {
      id: 'T001',
      date: '2023-10-01',
      description: 'Modal Awal Bulan',
      amount: 5000000,
      type: TransactionType.INCOME,
      method: PaymentMethod.TRANSFER,
      category: 'Capital'
    },
    {
      id: 'T002',
      date: '2023-10-05',
      description: 'Biaya Maintenance Server',
      amount: 750000,
      type: TransactionType.EXPENSE,
      method: PaymentMethod.TRANSFER,
      category: 'Maintenance'
    },
    {
      id: 'T003',
      date: '2023-10-10',
      description: 'Pembayaran C002 - Warung Kopi',
      amount: 300000,
      type: TransactionType.INCOME,
      method: PaymentMethod.CASH,
      category: 'Bill Payment',
      customerId: 'C002'
    }
  ]
};