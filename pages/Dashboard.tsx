import React, { useMemo } from 'react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ComposedChart, 
  Line 
} from 'recharts';
import { useApp } from '../context/AppContext';
import { TransactionType, PaymentMethod } from '../types';

export const Dashboard: React.FC = () => {
  const { transactions } = useApp();

  // Calculate Summaries
  const summary = useMemo(() => {
    const incomeTx = transactions.filter(t => t.type === TransactionType.INCOME);
    const expenseTx = transactions.filter(t => t.type === TransactionType.EXPENSE);

    const income = incomeTx.reduce((sum, t) => sum + t.amount, 0);
    const expense = expenseTx.reduce((sum, t) => sum + t.amount, 0);
    
    const incomeTransfer = incomeTx.filter(t => t.method === PaymentMethod.TRANSFER).reduce((sum, t) => sum + t.amount, 0);
    const incomeCash = incomeTx.filter(t => t.method === PaymentMethod.CASH).reduce((sum, t) => sum + t.amount, 0);

    const expenseTransfer = expenseTx.filter(t => t.method === PaymentMethod.TRANSFER).reduce((sum, t) => sum + t.amount, 0);
    const expenseCash = expenseTx.filter(t => t.method === PaymentMethod.CASH).reduce((sum, t) => sum + t.amount, 0);

    return { 
      income, 
      expense, 
      profit: income - expense,
      incomeTransfer,
      incomeCash,
      expenseTransfer,
      expenseCash
    };
  }, [transactions]);

  // Process Data for Trading Traffic Chart
  const chartData = useMemo(() => {
    // 1. Sort transactions by date
    const sortedTx = [...transactions].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // 2. Group by date
    const grouped = sortedTx.reduce((acc, curr) => {
      const date = curr.date;
      if (!acc[date]) {
        acc[date] = { 
          date, 
          income: 0, 
          expense: 0, 
          cash: 0, 
          transfer: 0,
          net: 0
        };
      }
      
      if (curr.type === TransactionType.INCOME) {
        acc[date].income += curr.amount;
      } else {
        acc[date].expense += curr.amount;
      }

      if (curr.method === PaymentMethod.CASH) acc[date].cash += curr.amount;
      if (curr.method === PaymentMethod.TRANSFER) acc[date].transfer += curr.amount;

      return acc;
    }, {} as Record<string, any>);

    // 3. Convert to array and calculate Cumulative Saldo
    let runningSaldo = 0;
    const result = Object.keys(grouped).sort().map(date => {
      const day = grouped[date];
      runningSaldo += (day.income - day.expense);
      
      // Format date for axis (e.g., 10 Oct)
      const dateObj = new Date(date);
      const formattedDate = dateObj.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });

      return {
        ...day,
        displayDate: formattedDate,
        saldo: runningSaldo // "Hijau Muda"
      };
    });

    return result;
  }, [transactions]);

  const formatCurrency = (value: number) => {
    return `Rp ${value.toLocaleString('id-ID')}`;
  };

  return (
    <div className="space-y-6 p-6">
      <h2 className="text-2xl font-bold text-white mb-6">Dashboard & Neraca</h2>
      
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-lg relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 bg-green-500/10 w-24 h-24 rounded-full group-hover:scale-150 transition-transform duration-500"></div>
          <h3 className="text-slate-400 text-sm mb-2 relative z-10">Total Saldo (Laba Bersih)</h3>
          <p className="text-3xl font-bold text-green-400 relative z-10">Rp {summary.profit.toLocaleString('id-ID')}</p>
        </div>
        
        <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-lg relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 bg-sky-500/10 w-24 h-24 rounded-full group-hover:scale-150 transition-transform duration-500"></div>
          <h3 className="text-slate-400 text-sm mb-2 relative z-10">Total Pemasukan</h3>
          <p className="text-3xl font-bold text-sky-400 relative z-10 mb-4">Rp {summary.income.toLocaleString('id-ID')}</p>
          <div className="relative z-10 border-t border-slate-700 pt-2 mt-2">
             <div className="flex justify-between text-xs text-slate-300 mb-1">
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#854d0e]"></span> Transfer:</span>
                <span className="font-mono">Rp {summary.incomeTransfer.toLocaleString('id-ID')}</span>
             </div>
             <div className="flex justify-between text-xs text-slate-300">
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-yellow-500"></span> Tunai:</span>
                <span className="font-mono">Rp {summary.incomeCash.toLocaleString('id-ID')}</span>
             </div>
          </div>
        </div>
        
        <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-lg relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 bg-red-500/10 w-24 h-24 rounded-full group-hover:scale-150 transition-transform duration-500"></div>
          <h3 className="text-slate-400 text-sm mb-2 relative z-10">Total Pengeluaran</h3>
          <p className="text-3xl font-bold text-red-400 relative z-10 mb-4">Rp {summary.expense.toLocaleString('id-ID')}</p>
          <div className="relative z-10 border-t border-slate-700 pt-2 mt-2">
             <div className="flex justify-between text-xs text-slate-300 mb-1">
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#854d0e]"></span> Transfer:</span>
                <span className="font-mono">Rp {summary.expenseTransfer.toLocaleString('id-ID')}</span>
             </div>
             <div className="flex justify-between text-xs text-slate-300">
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-yellow-500"></span> Tunai:</span>
                <span className="font-mono">Rp {summary.expenseCash.toLocaleString('id-ID')}</span>
             </div>
          </div>
        </div>
      </div>

      {/* Traffic Trading Chart */}
      <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-lg">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-white font-semibold text-lg">Visualisasi Arus Kas (Traffic)</h3>
          <div className="flex flex-wrap gap-4 text-xs">
            <div className="flex items-center"><span className="w-3 h-3 rounded-full bg-green-500 mr-2"></span>Pemasukan</div>
            <div className="flex items-center"><span className="w-3 h-3 rounded-full bg-red-500 mr-2"></span>Pengeluaran</div>
            <div className="flex items-center"><span className="w-3 h-3 rounded-full bg-[#86efac] mr-2"></span>Saldo</div>
            <div className="flex items-center"><span className="w-3 h-3 rounded-full bg-yellow-500 mr-2"></span>Tunai</div>
            <div className="flex items-center"><span className="w-3 h-3 rounded-full bg-[#854d0e] mr-2"></span>Transfer</div>
          </div>
        </div>

        <div className="h-[400px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                </linearGradient>
              </defs>
              
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
              
              <XAxis 
                dataKey="displayDate" 
                stroke="#94a3b8" 
                tick={{fontSize: 12}}
                tickMargin={10}
              />
              
              <YAxis 
                stroke="#94a3b8" 
                tickFormatter={(val) => val >= 1000000 ? `${(val/1000000).toFixed(1)}M` : `${(val/1000).toFixed(0)}k`}
                tick={{fontSize: 12}}
              />
              
              <Tooltip 
                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#f1f5f9' }}
                formatter={(value: number) => formatCurrency(value)}
                labelStyle={{ color: '#94a3b8' }}
              />
              
              <Legend wrapperStyle={{ paddingTop: '20px' }}/>

              {/* Benang Merah (Pengeluaran) */}
              <Area 
                type="monotone" 
                dataKey="expense" 
                name="Pengeluaran"
                stroke="#ef4444" 
                fillOpacity={1} 
                fill="url(#colorExpense)" 
                strokeWidth={2}
              />

              {/* Hijau (Pemasukan) */}
              <Area 
                type="monotone" 
                dataKey="income" 
                name="Pemasukan"
                stroke="#22c55e" 
                fillOpacity={1} 
                fill="url(#colorIncome)" 
                strokeWidth={2}
              />

              {/* Hijau Muda (Saldo) - Line Only */}
              <Line 
                type="monotone" 
                dataKey="saldo" 
                name="Saldo Akumulasi"
                stroke="#86efac" 
                strokeWidth={3} 
                dot={{ r: 4, fill: '#86efac' }}
                activeDot={{ r: 6 }}
              />

              {/* Kuning (Tunai) */}
              <Line 
                type="monotone" 
                dataKey="cash" 
                name="Metode Tunai"
                stroke="#eab308" 
                strokeWidth={2} 
                strokeDasharray="5 5"
                dot={false}
              />

              {/* Coklat (Transfer) */}
              <Line 
                type="monotone" 
                dataKey="transfer" 
                name="Metode Transfer"
                stroke="#854d0e" // Brown color code
                strokeWidth={2} 
                strokeDasharray="5 5"
                dot={false}
              />

            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>
      
    </div>
  );
};