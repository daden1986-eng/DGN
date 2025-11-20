import React, { createContext, useContext, useState, useEffect } from 'react';
import { AppState, Customer, Transaction, CompanySettings, Investor } from '../types';
import { INITIAL_STATE } from '../constants';

interface AppContextType extends AppState {
  setCustomers: React.Dispatch<React.SetStateAction<Customer[]>>;
  setTransactions: React.Dispatch<React.SetStateAction<Transaction[]>>;
  setSettings: React.Dispatch<React.SetStateAction<CompanySettings>>;
  setInvestors: React.Dispatch<React.SetStateAction<Investor[]>>;
  addTransaction: (t: Transaction) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Load from localStorage or use Initial
  const [customers, setCustomers] = useState<Customer[]>(() => {
    const saved = localStorage.getItem('dgn_customers');
    return saved ? JSON.parse(saved) : INITIAL_STATE.customers;
  });

  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    const saved = localStorage.getItem('dgn_transactions');
    return saved ? JSON.parse(saved) : INITIAL_STATE.transactions;
  });

  const [settings, setSettings] = useState<CompanySettings>(() => {
    const saved = localStorage.getItem('dgn_settings');
    return saved ? JSON.parse(saved) : INITIAL_STATE.settings;
  });

  const [investors, setInvestors] = useState<Investor[]>(() => {
    const saved = localStorage.getItem('dgn_investors');
    return saved ? JSON.parse(saved) : INITIAL_STATE.investors;
  });

  // Persist state
  useEffect(() => localStorage.setItem('dgn_customers', JSON.stringify(customers)), [customers]);
  useEffect(() => localStorage.setItem('dgn_transactions', JSON.stringify(transactions)), [transactions]);
  useEffect(() => localStorage.setItem('dgn_settings', JSON.stringify(settings)), [settings]);
  useEffect(() => localStorage.setItem('dgn_investors', JSON.stringify(investors)), [investors]);

  const addTransaction = (t: Transaction) => {
    setTransactions(prev => [t, ...prev]);
  };

  return (
    <AppContext.Provider value={{
      customers, setCustomers,
      transactions, setTransactions,
      settings, setSettings,
      investors, setInvestors,
      addTransaction
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error("useApp must be used within AppProvider");
  return context;
};