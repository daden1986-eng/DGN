import React, { useMemo } from 'react';
import { 
  ResponsiveContainer, 
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
import { TrendingUp, ArrowDownRight, Wallet, CreditCard, Banknote } from 'lucide-react';

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
    const sortedTx = [...transactions].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    const grouped = sortedTx.reduce((acc, curr) => {
      const date = curr.date;
      if (!acc[date]) {
        acc[date] = { date, income: 0, expense: 0, cash: 0, transfer: 0 };
      }
      if (curr.type === TransactionType.INCOME) acc[date].income += curr.amount;
      else acc[date].expense += curr.amount;

      if (curr.method === PaymentMethod.CASH) acc[date].cash += curr.amount;
      if (curr.method === PaymentMethod.TRANSFER) acc[date].transfer += curr.amount;

      return acc;
    }, {} as Record<string, any>);

    let runningSaldo = 0;
    const result = Object.keys(grouped).sort().map(date => {
      const day = grouped[date];
      runningSaldo += (day.income - day.expense);
      const dateObj = new Date(date);
      const formattedDate = dateObj.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
      return { ...day, displayDate: formattedDate, saldo: runningSaldo };
    });

    return result;
  }, [transactions]);

  const formatCurrency = (value: number) => `Rp ${value.toLocaleString('id-ID')}`;

  const Card = ({ title, value, icon: Icon, colorClass, details }: any) => (
    <div className="relative group overflow-hidden rounded-2xl p-6 bg-white/5 backdrop-blur-md border border-white/10 transition-all duration-300 hover:bg-white/10 hover:shadow-xl hover:shadow-sky-500/5">
      <div className={`absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 group-hover:scale-110 transition-all duration-500 ${colorClass}`}>
        <Icon size={100} />
      </div>
      
      <div className="relative z-10">
        <div className="flex items-center gap-2 mb-3">
          <div className={`p-2 rounded-lg bg-white/5 ${colorClass} bg-opacity-20`}>
            <Icon size={20} className={colorClass.replace('text-', 'text-')} />
          </div>
          <h3 className="text-slate-400 font-medium text-sm">{title}</h3>
        </div>
        
        <p className="text-3xl font-bold text-white tracking-tight mb-6">
          {formatCurrency(value)}
        </p>

        {details && (
          <div className="space-y-2 border-t border-white/10 pt-3">
            {details.map((d: any, i: number) => (
              <div key={i} className="flex justify-between items-center text-xs text-slate-400">
                <span className="flex items-center gap-2">
                  <span className={`w-1.5 h-1.5 rounded-full ${d.color}`}></span>
                  {d.label}
                </span>
                <span className="font-mono text-slate-300">{formatCurrency(d.value)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-white tracking-tight">Dashboard Overview</h2>
          <p className="text-slate-400 mt-1">Ringkasan performa keuangan perusahaan Anda.</p>
        </div>
      </div>
      
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card 
          title="Total Saldo (Laba Bersih)" 
          value={summary.profit} 
          icon={Wallet}
          colorClass="text-emerald-400"
        />
        
        <Card 
          title="Total Pemasukan" 
          value={summary.income} 
          icon={TrendingUp}
          colorClass="text-sky-400"
          details={[
            { label: 'Transfer', value: summary.incomeTransfer, color: 'bg-sky-500' },
            { label: 'Tunai', value: summary.incomeCash, color: 'bg-emerald-500' }
          ]}
        />
        
        <Card 
          title="Total Pengeluaran" 
          value={summary.expense} 
          icon={ArrowDownRight}
          colorClass="text-rose-400"
          details={[
            { label: 'Transfer', value: summary.expenseTransfer, color: 'bg-rose-500' },
            { label: 'Tunai', value: summary.expenseCash, color: 'bg-orange-500' }
          ]}
        />
      </div>

      {/* Traffic Trading Chart */}
      <div className="rounded-3xl p-6 bg-white/5 backdrop-blur-md border border-white/10 shadow-2xl">
        <div className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-4">
          <h3 className="text-white font-semibold text-lg flex items-center gap-2">
            <Banknote size={20} className="text-slate-400" />
            Visualisasi Arus Kas
          </h3>
          <div className="flex flex-wrap justify-center gap-3 text-xs bg-black/20 p-2 rounded-full">
            <div className="flex items-center px-2"><span className="w-2 h-2 rounded-full bg-emerald-500 mr-2 shadow-[0_0_10px_rgba(16,185,129,0.5)]"></span>Pemasukan</div>
            <div className="flex items-center px-2"><span className="w-2 h-2 rounded-full bg-rose-500 mr-2 shadow-[0_0_10px_rgba(244,63,94,0.5)]"></span>Pengeluaran</div>
            <div className="flex items-center px-2"><span className="w-2 h-2 rounded-full bg-sky-400 mr-2 shadow-[0_0_10px_rgba(56,189,248,0.5)]"></span>Saldo</div>
          </div>
        </div>

        <div className="h-[400px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis dataKey="displayDate" stroke="#64748b" tick={{fontSize: 11}} tickMargin={15} axisLine={false} />
              <YAxis stroke="#64748b" tickFormatter={(val) => val >= 1000000 ? `${(val/1000000).toFixed(1)}M` : `${(val/1000).toFixed(0)}k`} tick={{fontSize: 11}} axisLine={false} />
              <Tooltip 
                contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', backdropFilter: 'blur(8px)', borderColor: 'rgba(255,255,255,0.1)', color: '#f1f5f9', borderRadius: '12px', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)' }}
                formatter={(value: number) => formatCurrency(value)}
                labelStyle={{ color: '#94a3b8', marginBottom: '0.5rem' }}
                cursor={{ stroke: 'rgba(255,255,255,0.1)', strokeWidth: 2 }}
              />
              <Area type="monotone" dataKey="expense" name="Pengeluaran" stroke="#f43f5e" fillOpacity={1} fill="url(#colorExpense)" strokeWidth={2} />
              <Area type="monotone" dataKey="income" name="Pemasukan" stroke="#10b981" fillOpacity={1} fill="url(#colorIncome)" strokeWidth={2} />
              <Line type="monotone" dataKey="saldo" name="Saldo Akumulasi" stroke="#38bdf8" strokeWidth={3} dot={{ r: 4, fill: '#0ea5e9', strokeWidth: 0 }} activeDot={{ r: 6, stroke: '#fff', strokeWidth: 2 }} />
              <Line type="monotone" dataKey="cash" name="Tunai" stroke="#f59e0b" strokeWidth={2} strokeDasharray="4 4" dot={false} />
              <Line type="monotone" dataKey="transfer" name="Transfer" stroke="#a8a29e" strokeWidth={2} strokeDasharray="4 4" dot={false} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};