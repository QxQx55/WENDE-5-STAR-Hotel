import { useState, useEffect } from 'react';
import { supabase, Payment, Invoice, Reservation, Guest, Room } from '../lib/supabase';
import { Search, Download, Filter, TrendingUp } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface TransactionRecord {
  payment: Payment;
  invoice?: Invoice;
  reservation?: Reservation & {
    guests?: Guest;
    rooms?: Room;
  };
}

export default function TransactionManagement() {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<TransactionRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [paymentMethodFilter, setPaymentMethodFilter] = useState<'All' | 'Cash' | 'Card' | 'Mobile'>('All');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  useEffect(() => {
    fetchTransactions();
  }, [paymentMethodFilter, dateFrom, dateTo]);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('payments')
        .select('*, invoices(*, reservations(*, guests(*), rooms(*)))')
        .order('paid_at', { ascending: false });

      if (paymentMethodFilter !== 'All') {
        query = query.eq('payment_method', paymentMethodFilter);
      }

      const { data, error } = await query;
      if (error) throw error;

      let filtered = data || [];

      if (dateFrom) {
        filtered = filtered.filter(
          (p) => new Date(p.paid_at) >= new Date(dateFrom)
        );
      }

      if (dateTo) {
        const endDate = new Date(dateTo);
        endDate.setHours(23, 59, 59, 999);
        filtered = filtered.filter(
          (p) => new Date(p.paid_at) <= endDate
        );
      }

      const records: TransactionRecord[] = filtered.map((payment: any) => ({
        payment,
        invoice: payment.invoices,
        reservation: payment.invoices?.reservations,
      }));

      setTransactions(records);
    } catch (error) {
      console.error('Error fetching transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredTransactions = transactions.filter((record) => {
    const guest = record.reservation?.guests;
    const roomNumber = record.reservation?.rooms?.room_number;
    const invoiceNumber = record.invoice?.invoice_number;
    const transactionRef = record.payment.transaction_reference;

    const searchLower = searchTerm.toLowerCase();
    return (
      (guest?.first_name.toLowerCase().includes(searchLower) ||
        guest?.last_name.toLowerCase().includes(searchLower) ||
        roomNumber?.toLowerCase().includes(searchLower) ||
        invoiceNumber?.toLowerCase().includes(searchLower) ||
        transactionRef?.toLowerCase().includes(searchLower)) ??
      true
    );
  });

  const totalAmount = filteredTransactions.reduce((sum, t) => sum + t.payment.amount, 0);
  const avgAmount = filteredTransactions.length > 0 ? totalAmount / filteredTransactions.length : 0;
  const cashCount = filteredTransactions.filter((t) => t.payment.payment_method === 'Cash').length;
  const cardCount = filteredTransactions.filter((t) => t.payment.payment_method === 'Card').length;
  const mobileCount = filteredTransactions.filter((t) => t.payment.payment_method === 'Mobile').length;

  const handleExport = () => {
    const csv = [
      ['Transaction ID', 'Invoice', 'Guest', 'Room', 'Amount', 'Method', 'Reference', 'Date', 'Received By'].join(','),
      ...filteredTransactions.map((t) =>
        [
          t.payment.id,
          t.invoice?.invoice_number || 'N/A',
          `${t.reservation?.guests?.first_name || ''} ${t.reservation?.guests?.last_name || ''}`.trim() || 'N/A',
          t.reservation?.rooms?.room_number || 'N/A',
          t.payment.amount.toFixed(2),
          t.payment.payment_method,
          t.payment.transaction_reference || 'N/A',
          new Date(t.payment.paid_at).toLocaleString(),
          t.payment.received_by || 'N/A',
        ].join(',')
      ),
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transactions_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  if (loading) {
    return <div className="p-6">Loading transactions...</div>;
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-900">Transactions</h2>
        <p className="text-slate-600 mt-1">View and manage all payment transactions</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <p className="text-slate-600 text-sm font-medium">Total Transactions</p>
          <p className="text-2xl font-bold text-slate-900 mt-2">{filteredTransactions.length}</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-600 text-sm font-medium">Total Amount</p>
              <p className="text-2xl font-bold text-slate-900 mt-2">${totalAmount.toFixed(2)}</p>
            </div>
            <TrendingUp className="w-8 h-8 text-green-600" />
          </div>
        </div>
        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <p className="text-slate-600 text-sm font-medium">Average Amount</p>
          <p className="text-2xl font-bold text-slate-900 mt-2">${avgAmount.toFixed(2)}</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <p className="text-slate-600 text-sm font-medium">Payment Methods</p>
          <div className="space-y-1 mt-2 text-sm">
            <p className="text-slate-700">Cash: {cashCount}</p>
            <p className="text-slate-700">Card: {cardCount}</p>
            <p className="text-slate-700">Mobile: {mobileCount}</p>
          </div>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-lg p-6 mb-6">
        <div className="flex flex-col lg:flex-row gap-4 mb-6">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search by guest, room, invoice, or reference..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none text-sm"
              />
            </div>
          </div>
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition text-sm"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Payment Method</label>
            <select
              value={paymentMethodFilter}
              onChange={(e) => setPaymentMethodFilter(e.target.value as any)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none text-sm"
            >
              <option value="All">All Methods</option>
              <option value="Cash">Cash</option>
              <option value="Card">Card</option>
              <option value="Mobile">Mobile</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">From Date</label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">To Date</label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">&nbsp;</label>
            <button
              onClick={() => {
                setPaymentMethodFilter('All');
                setDateFrom('');
                setDateTo('');
                setSearchTerm('');
              }}
              className="w-full px-3 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition text-sm"
            >
              Reset Filters
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Invoice</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Guest</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Room</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Amount</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Method</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Date & Time</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Reference</th>
              </tr>
            </thead>
            <tbody>
              {filteredTransactions.length > 0 ? (
                filteredTransactions.map((record) => (
                  <tr key={record.payment.id} className="border-b border-slate-100 hover:bg-slate-50 transition">
                    <td className="px-6 py-4 text-sm text-slate-900 font-medium">
                      {record.invoice?.invoice_number || 'N/A'}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-700">
                      {record.reservation?.guests ? `${record.reservation.guests.first_name} ${record.reservation.guests.last_name}` : 'N/A'}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-700">
                      {record.reservation?.rooms?.room_number || 'N/A'}
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold text-slate-900">
                      ${record.payment.amount.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          record.payment.payment_method === 'Cash'
                            ? 'bg-blue-100 text-blue-800'
                            : record.payment.payment_method === 'Card'
                              ? 'bg-purple-100 text-purple-800'
                              : 'bg-green-100 text-green-800'
                        }`}
                      >
                        {record.payment.payment_method}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-700">
                      {new Date(record.payment.paid_at).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-700">
                      {record.payment.transaction_reference || '-'}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                    No transactions found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
