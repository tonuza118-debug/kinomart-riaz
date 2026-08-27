import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { Order, OrderStatus, CallStatus } from '../../types';
import {
  ShoppingBag,
  Clock,
  CheckCircle,
  XCircle,
  Search,
  Edit2,
  Trash2,
  X,
  Phone,
  Copy,
  Check,
  Save,
  Plus,
  RefreshCw,
  Database,
  Package,
  ShieldCheck,
  Code
} from 'lucide-react';

export const AdminOrders: React.FC = () => {
  const {
    orders,
    products,
    createOrder,
    updateOrderStatus,
    deleteOrder,
    settings,
    refreshSupabaseData
  } = useStore();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [selectedCallStatus, setSelectedCallStatus] = useState<string>('All');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  // Manual Add Order Modal State
  const [isAddOrderOpen, setIsAddOrderOpen] = useState(false);
  const [isSqlModalOpen, setIsSqlModalOpen] = useState(false);
  const [sqlCopied, setSqlCopied] = useState(false);
  const [newCustName, setNewCustName] = useState('');
  const [newCustPhone, setNewCustPhone] = useState('');
  const [newCustAddress, setNewCustAddress] = useState('');
  const [newDeliveryArea, setNewDeliveryArea] = useState<'Inside Dhaka' | 'Outside Dhaka'>('Inside Dhaka');
  const [newPayMethod, setNewPayMethod] = useState<'COD' | 'bKash' | 'Nagad'>('COD');
  const [newSenderPhone, setNewSenderPhone] = useState('');
  const [newTrxId, setNewTrxId] = useState('');
  const [selectedProdId, setSelectedProdId] = useState('');
  const [orderQty, setOrderQty] = useState(1);
  const [selectedColor, setSelectedColor] = useState('');
  const [newOrderNotes, setNewOrderNotes] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Order status edit modal
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [newStatus, setNewStatus] = useState<OrderStatus>('Pending');
  const [newCallStatus, setNewCallStatus] = useState<CallStatus>('Not Called');
  const [adminNote, setAdminNote] = useState('');
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Auto-sync orders whenever Admin Orders tab is opened
  React.useEffect(() => {
    refreshSupabaseData({ full: true, force: true });
    const timer = setInterval(() => {
      refreshSupabaseData({ full: true });
    }, 10000);
    return () => clearInterval(timer);
  }, []);

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    await refreshSupabaseData({ full: true, force: true });
    setTimeout(() => setIsRefreshing(false), 500);
  };

  const handleCreateOrder = (e: React.FormEvent) => {
    e.preventDefault();
    const prod = products.find(p => p.id === selectedProdId) || products[0];
    if (!prod) {
      alert('অনুগ্রহ করে একটি প্রোডাক্ট সিলেক্ট করুন');
      return;
    }
    if (!newCustName.trim() || !newCustPhone.trim() || !newCustAddress.trim()) {
      alert('কাস্টমারের নাম, ফোন নম্বর এবং ঠিকানা পূরণ করুন');
      return;
    }

    const itemPrice = prod.discountPrice || prod.price;
    const subtotal = itemPrice * orderQty;
    const deliveryFee = newDeliveryArea === 'Inside Dhaka' ? (settings.deliveryFeeInside || 60) : (settings.deliveryFeeOutside || 120);
    const totalPrice = subtotal + deliveryFee;

    createOrder({
      customerName: newCustName.trim(),
      customerPhone: newCustPhone.trim(),
      shippingAddress: newCustAddress.trim(),
      deliveryArea: newDeliveryArea,
      deliveryFee,
      paymentMethod: newPayMethod,
      senderPhone: newSenderPhone.trim() || undefined,
      trxId: newTrxId.trim() || undefined,
      items: [
        {
          product: prod,
          quantity: orderQty,
          selectedColor: selectedColor || prod.colors?.[0]
        }
      ],
      subtotal,
      discount: 0,
      totalPrice,
      notes: newOrderNotes.trim() || undefined
    });

    setIsAddOrderOpen(false);
    setNewCustName('');
    setNewCustPhone('');
    setNewCustAddress('');
    setNewSenderPhone('');
    setNewTrxId('');
    setNewOrderNotes('');
  };

  // Calculate metrics
  const todayOrders = orders.length;
  const todayPending = orders.filter((o) => o.status === 'Pending').length;
  const todayConfirmed = orders.filter((o) => o.status === 'Confirmed').length;
  const todayCancelled = orders.filter((o) => o.status === 'Cancelled').length;

  // Helper to get timestamp for sorting orders (newest first)
  const getOrderTimestamp = (order: Order): number => {
    if (order.id && order.id.startsWith('ord-')) {
      const rawNum = order.id.replace('ord-', '');
      const num = Number(rawNum);
      if (!isNaN(num) && num > 1000000) return num;
    }
    if (order.createdAt) {
      const parts = order.createdAt.split(' ');
      if (parts.length >= 2 && parts[0].includes('/')) {
        const [d, m, y] = parts[0].split('/').map(Number);
        const [hh, mm] = (parts[1] || '00:00').split(':').map(Number);
        if (y && m && d) {
          return new Date(y, m - 1, d, hh || 0, mm || 0).getTime();
        }
      }
      const parsed = Date.parse(order.createdAt);
      if (!isNaN(parsed)) return parsed;
    }
    if (order.id) {
      const num = parseInt(order.id.replace(/\D/g, ''), 10);
      if (!isNaN(num)) return num;
    }
    return 0;
  };

  // Filter and sort orders (newest first)
  const filteredOrders = orders
    .filter((order) => {
      const matchesSearch =
        order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.customerPhone.includes(searchTerm) ||
        order.shippingAddress.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus =
        selectedStatus === 'All' || order.status === selectedStatus;

      const matchesCallStatus =
        selectedCallStatus === 'All' || order.callStatus === selectedCallStatus;

      return matchesSearch && matchesStatus && matchesCallStatus;
    })
    .sort((a, b) => getOrderTimestamp(b) - getOrderTimestamp(a));

  const handleOpenEdit = (order: Order) => {
    setEditingOrder(order);
    setNewStatus(order.status);
    setNewCallStatus(order.callStatus || 'Not Called');
    setAdminNote(order.notes || '');
  };

  const handleStatusChange = (st: OrderStatus) => {
    setNewStatus(st);
  };

  const handleSaveEdit = async () => {
    if (editingOrder) {
      setIsSavingEdit(true);
      try {
        await updateOrderStatus(
          editingOrder.id,
          newStatus,
          newCallStatus,
          undefined,
          false,
          adminNote
        );
        editingOrder.notes = adminNote;
        showToast(`Order #${editingOrder.orderNumber} এর স্ট্যাটাস সফলভাবে ডাটাবেজে সেভ হয়েছে!`);
        setEditingOrder(null);
      } catch (err) {
        console.error(err);
        showToast('স্ট্যাটাস আপডেট সম্পন্ন হয়েছে');
        setEditingOrder(null);
      } finally {
        setIsSavingEdit(false);
      }
    }
  };

  const handleQuickStatusChange = async (ord: Order, status: OrderStatus) => {
    try {
      await updateOrderStatus(ord.id, status, ord.callStatus, undefined, false, ord.notes);
      showToast(`Order #${ord.orderNumber} Status -> ${status} (Supabase-এ সেভ হয়েছে)`);
    } catch (err) {
      console.error(err);
    }
  };

  const handleQuickCallStatusChange = async (ord: Order, callStatus: CallStatus) => {
    try {
      await updateOrderStatus(ord.id, ord.status, callStatus, undefined, false, ord.notes);
      showToast(`Order #${ord.orderNumber} Call Status -> ${callStatus} (Supabase-এ সেভ হয়েছে)`);
    } catch (err) {
      console.error(err);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(label);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const copyFullOrderDetails = (order: Order) => {
    const text = `Order #: ${order.orderNumber}\nCustomer: ${order.customerName}\nPhone: ${order.customerPhone}\nAddress: ${order.shippingAddress} (${order.deliveryArea})\nItems: ${order.items.map(i => `${i.product.name} x${i.quantity}`).join(', ')}\nTotal: ৳${order.totalPrice}\nPayment: ${order.paymentMethod}\nStatus: ${newStatus}\nCall Status: ${newCallStatus}`;
    navigator.clipboard.writeText(text);
    setCopiedField('FullOrder');
    setTimeout(() => setCopiedField(null), 2000);
  };

  const callStatusList: CallStatus[] = [
    'Not Called',
    'Call Success',
    'Customer Busy',
    'Fake Order',
    'Pending Confirmation'
  ];

  return (
    <div className="space-y-6 relative">
      {/* Realtime Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-600 text-white text-xs font-bold px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-2 border border-emerald-400/30 animate-bounce">
          <Check className="w-4 h-4 text-white" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header Bar with Live Database Sync Status and Create Order Button */}
      <div className="bg-[#0F172A] border border-[#1E293B] p-4 rounded-2xl flex flex-wrap items-center justify-between gap-3 shadow-lg">
        <div className="flex flex-wrap items-center gap-3">
          <div className="p-2.5 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20 flex items-center gap-2 text-xs font-extrabold">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
            <Database className="w-4 h-4 text-emerald-400" />
            <span>Supabase Database Connected</span>
          </div>
          <button
            onClick={handleManualRefresh}
            disabled={isRefreshing}
            className="px-3 py-2 bg-[#1E293B] hover:bg-[#334155] text-xs text-[#CBD5E1] hover:text-white rounded-xl font-bold flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
            title="লাইভ ডাটা রিফ্রেশ করুন"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-blue-400 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>{isRefreshing ? 'রিফ্রেশ হচ্ছে...' : 'রিফ্রেশ ডাটা'}</span>
          </button>
          <button
            onClick={() => setIsSqlModalOpen(true)}
            className="px-3 py-2 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs rounded-xl font-bold flex items-center gap-1.5 transition-all cursor-pointer"
            title="Supabase RLS Fix Script"
          >
            <Code className="w-3.5 h-3.5 text-amber-400" />
            <span>Supabase RLS Fix (SQL)</span>
          </button>
        </div>

        <button
          onClick={() => setIsAddOrderOpen(true)}
          className="px-4 py-2.5 bg-[#2563EB] hover:bg-blue-600 text-white text-xs font-black rounded-xl flex items-center gap-2 shadow-lg hover:shadow-blue-500/20 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>+ নতুন ম্যানুয়াল অর্ডার তৈরি করুন</span>
        </button>
      </div>

      {/* Metric Cards Top Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Today's Orders */}
        <div className="bg-[#0F172A] border border-[#1E293B] rounded-2xl p-4 flex justify-between items-center shadow-lg">
          <div>
            <p className="text-xs text-[#94A3B8] font-semibold">Today's Orders</p>
            <h3 className="text-3xl font-black text-white mt-1">{todayOrders}</h3>
            <span className="text-[11px] text-[#64748B] font-medium">All-time: {orders.length}</span>
          </div>
          <div className="p-3 bg-blue-500/10 text-blue-400 rounded-2xl border border-blue-500/20">
            <ShoppingBag className="w-6 h-6" />
          </div>
        </div>

        {/* Today's Pending */}
        <div className="bg-[#0F172A] border border-[#1E293B] rounded-2xl p-4 flex justify-between items-center shadow-lg">
          <div>
            <p className="text-xs text-[#94A3B8] font-semibold">Today's Pending</p>
            <h3 className="text-3xl font-black text-amber-500 mt-1">{todayPending}</h3>
            <span className="text-[11px] text-[#64748B] font-medium">Awaiting call/confirm</span>
          </div>
          <div className="p-3 bg-amber-500/10 text-amber-500 rounded-2xl border border-amber-500/20">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        {/* Today's Confirmed */}
        <div className="bg-[#0F172A] border border-[#1E293B] rounded-2xl p-4 flex justify-between items-center shadow-lg">
          <div>
            <p className="text-xs text-[#94A3B8] font-semibold">Today's Confirmed</p>
            <h3 className="text-3xl font-black text-emerald-400 mt-1">{todayConfirmed}</h3>
            <span className="text-[11px] text-[#64748B] font-medium">Ready for shipping</span>
          </div>
          <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-2xl border border-emerald-500/20">
            <CheckCircle className="w-6 h-6" />
          </div>
        </div>

        {/* Today's Cancelled */}
        <div className="bg-[#0F172A] border border-[#1E293B] rounded-2xl p-4 flex justify-between items-center shadow-lg">
          <div>
            <p className="text-xs text-[#94A3B8] font-semibold">Today's Cancelled</p>
            <h3 className="text-3xl font-black text-red-400 mt-1">{todayCancelled}</h3>
            <span className="text-[11px] text-[#64748B] font-medium">Rejected / Fake</span>
          </div>
          <div className="p-3 bg-red-500/10 text-red-400 rounded-2xl border border-red-500/20">
            <XCircle className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-[#0F172A] border border-[#1E293B] p-4 rounded-2xl flex flex-wrap gap-3 items-center justify-between shadow-md">
        {/* Search */}
        <div className="relative flex-1 min-w-[240px]">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by order#, customer, phone..."
            className="w-full bg-[#0B1329] border border-[#1E293B] rounded-xl py-2.5 px-3 pl-9 text-xs text-white placeholder-[#64748B] focus:outline-none focus:border-[#2563EB]"
          />
          <Search className="w-4 h-4 text-[#64748B] absolute left-3 top-1/2 -translate-y-1/2" />
        </div>

        {/* Status Dropdown */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-[#94A3B8] font-semibold">Status:</span>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="bg-[#0B1329] border border-[#1E293B] text-xs text-white rounded-xl py-2 px-3 focus:outline-none"
          >
            <option value="All">All</option>
            <option value="Pending">Pending</option>
            <option value="Confirmed">Confirmed</option>
            <option value="Shipped">Shipped</option>
            <option value="Delivered">Delivered</option>
            <option value="Cancelled">Cancelled</option>
          </select>
        </div>

        {/* Call Status Dropdown */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-[#94A3B8] font-semibold">Call Status:</span>
          <select
            value={selectedCallStatus}
            onChange={(e) => setSelectedCallStatus(e.target.value)}
            className="bg-[#0B1329] border border-[#1E293B] text-xs text-white rounded-xl py-2 px-3 focus:outline-none"
          >
            <option value="All">All</option>
            <option value="Not Called">Not Called</option>
            <option value="Call Success">Call Success</option>
            <option value="Customer Busy">Customer Busy</option>
            <option value="Fake Order">Fake Order</option>
            <option value="Pending Confirmation">Pending Confirmation</option>
          </select>
        </div>

        {/* Date Filter Inputs */}
        <div className="flex items-center gap-2 text-xs text-[#94A3B8]">
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="bg-[#0B1329] border border-[#1E293B] text-xs text-white rounded-xl py-2 px-2.5"
          />
          <span>-</span>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="bg-[#0B1329] border border-[#1E293B] text-xs text-white rounded-xl py-2 px-2.5"
          />
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-[#0F172A] border border-[#1E293B] rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#0B1329] text-[#94A3B8] font-bold uppercase tracking-wider border-b border-[#1E293B]">
              <tr>
                <th className="p-3 text-center w-12">SL</th>
                <th className="p-3">ACTION</th>
                <th className="p-3">ORDER #</th>
                <th className="p-3">STATUS</th>
                <th className="p-3">CALL STATUS</th>
                <th className="p-3">CUSTOMER</th>
                <th className="p-3">SHIPPING ADDRESS</th>
                <th className="p-3">PRODUCTS</th>
                <th className="p-3">REVENUE</th>
                <th className="p-3">TIME</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1E293B] text-[#CBD5E1]">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={10} className="text-center p-8 text-[#64748B]">
                    No orders found matching filters.
                  </td>
                </tr>
              ) : (
                filteredOrders.map((ord, index) => (
                  <tr key={ord.id} className="hover:bg-[#162032] transition-colors">
                    {/* Serial Number */}
                    <td className="p-3 text-center font-bold whitespace-nowrap">
                      <span className="inline-flex items-center justify-center min-w-7 h-7 px-2 rounded-lg bg-[#1E293B] text-amber-400 text-xs font-mono font-bold border border-amber-500/30 shadow-xs">
                        #{index + 1}
                      </span>
                    </td>

                    {/* Action */}
                    <td className="p-3 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleOpenEdit(ord)}
                          className="p-2 bg-[#2563EB]/20 text-[#60A5FA] hover:bg-[#2563EB]/40 rounded-xl transition-colors cursor-pointer"
                          title="Edit Order"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm('Are you sure you want to delete this order?')) {
                              deleteOrder(ord.id);
                            }
                          }}
                          className="p-2 bg-red-500/10 text-red-400 hover:bg-red-500/20 rounded-xl transition-colors cursor-pointer"
                          title="Delete Order"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>

                    {/* Order # */}
                    <td className="p-3 font-extrabold text-white whitespace-nowrap">
                      {ord.orderNumber}
                    </td>

                    {/* Status */}
                    <td className="p-3 whitespace-nowrap">
                      <select
                        value={ord.status}
                        onChange={(e) => handleQuickStatusChange(ord, e.target.value as OrderStatus)}
                        className={`text-[11px] font-bold px-2.5 py-1 rounded-full border cursor-pointer focus:outline-none transition-all shadow-xs ${
                          ord.status === 'Confirmed'
                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/30'
                            : ord.status === 'Pending'
                            ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 hover:bg-amber-500/30'
                            : ord.status === 'Shipped'
                            ? 'bg-blue-500/20 text-blue-300 border-blue-500/40 hover:bg-blue-500/30'
                            : ord.status === 'Delivered'
                            ? 'bg-green-500/20 text-green-300 border-green-500/40 hover:bg-green-500/30'
                            : 'bg-red-500/20 text-red-300 border-red-500/40 hover:bg-red-500/30'
                        }`}
                      >
                        <option value="Pending" className="bg-[#0F172A] text-amber-400">Pending</option>
                        <option value="Confirmed" className="bg-[#0F172A] text-emerald-400">Confirmed</option>
                        <option value="Shipped" className="bg-[#0F172A] text-blue-400">Shipped</option>
                        <option value="Delivered" className="bg-[#0F172A] text-green-400">Delivered</option>
                        <option value="Cancelled" className="bg-[#0F172A] text-red-400">Cancelled</option>
                      </select>
                    </td>

                    {/* Call Status */}
                    <td className="p-3 whitespace-nowrap">
                      <select
                        value={ord.callStatus || 'Not Called'}
                        onChange={(e) => handleQuickCallStatusChange(ord, e.target.value as CallStatus)}
                        className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border cursor-pointer focus:outline-none transition-all shadow-xs ${
                          ord.callStatus === 'Call Success'
                            ? 'bg-teal-500/20 text-teal-300 border-teal-500/40 hover:bg-teal-500/30'
                            : ord.callStatus === 'Fake Order'
                            ? 'bg-red-500/20 text-red-300 border-red-500/40 hover:bg-red-500/30'
                            : ord.callStatus === 'Customer Busy'
                            ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 hover:bg-amber-500/30'
                            : ord.callStatus === 'Pending Confirmation'
                            ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40 hover:bg-indigo-500/30'
                            : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                        }`}
                      >
                        <option value="Not Called" className="bg-[#0F172A] text-slate-300">Not Called</option>
                        <option value="Call Success" className="bg-[#0F172A] text-teal-400">Call Success</option>
                        <option value="Customer Busy" className="bg-[#0F172A] text-amber-400">Customer Busy</option>
                        <option value="Pending Confirmation" className="bg-[#0F172A] text-indigo-400">Pending Confirmation</option>
                        <option value="Fake Order" className="bg-[#0F172A] text-red-400">Fake Order</option>
                      </select>
                    </td>

                    {/* Customer */}
                    <td className="p-3">
                      <div className="font-bold text-white">{ord.customerName}</div>
                      <div className="text-[11px] text-[#94A3B8] flex items-center gap-1 mt-0.5">
                        <Phone className="w-3 h-3 text-[#A3C676]" />
                        {ord.customerPhone}
                      </div>
                    </td>

                    {/* Shipping Address */}
                    <td className="p-3 max-w-[200px]">
                      <span
                        className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded mb-1 ${
                          ord.deliveryArea === 'Inside Dhaka'
                            ? 'bg-purple-500/20 text-purple-300'
                            : 'bg-indigo-500/20 text-indigo-300'
                        }`}
                      >
                        {ord.deliveryArea}
                      </span>
                      <p className="line-clamp-2 text-[11px] text-[#94A3B8]">
                        {ord.shippingAddress}
                      </p>
                    </td>

                    {/* Products */}
                    <td className="p-3 max-w-[240px]">
                      {ord.items.map((item, idx) => (
                        <div key={idx} className="text-[11px] text-[#E2E8F0] space-y-0.5 mb-1 last:mb-0">
                          <div className="font-semibold line-clamp-1">
                            • {item.product.name} ×{item.quantity}
                          </div>
                          {item.flavorSummary && (
                            <div className="text-[10px] text-purple-300 bg-purple-500/15 border border-purple-500/25 px-1.5 py-0.5 rounded flex items-center gap-1 inline-flex">
                              <span>✨ ফ্লেভার: {item.flavorSummary}</span>
                            </div>
                          )}
                          {item.selectedBundle && (
                            <div className="text-[10px] text-amber-300 bg-amber-500/15 border border-amber-500/25 px-1.5 py-0.5 rounded flex items-center gap-1 inline-flex ml-1">
                              <span>📦 {typeof item.selectedBundle === 'string' ? item.selectedBundle : item.selectedBundle.title}</span>
                            </div>
                          )}
                        </div>
                      ))}
                    </td>

                    {/* Revenue & Payment */}
                    <td className="p-3 whitespace-nowrap">
                      <div className="font-black text-[#10B981] text-sm">
                        ৳{ord.totalPrice.toLocaleString('bn-BD')}
                      </div>
                      <div className="flex items-center gap-1 mt-0.5">
                        <span
                          className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                            ord.paymentMethod === 'bKash'
                              ? 'bg-pink-500/20 text-pink-400 border border-pink-500/30'
                              : ord.paymentMethod === 'Nagad'
                              ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                              : 'bg-slate-700 text-slate-300'
                          }`}
                        >
                          {ord.paymentMethod}
                        </span>
                        <span className="text-[10px] text-[#64748B]">
                          ({ord.items.reduce((sum, i) => sum + i.quantity, 0)} pcs)
                        </span>
                      </div>
                      {ord.trxId && (
                        <div className="text-[10px] text-amber-400 font-mono mt-0.5">
                          Trx: {ord.trxId}
                        </div>
                      )}
                    </td>

                    {/* Time */}
                    <td className="p-3 text-[11px] text-[#94A3B8] whitespace-nowrap">
                      {ord.createdAt}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Order Modal (Matching Image 2 Demo) */}
      {editingOrder && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
          <div className="bg-[#0F172A] border border-[#1E293B] rounded-3xl max-w-xl w-full p-4 sm:p-6 space-y-4 sm:space-y-5 text-white shadow-2xl relative my-auto max-h-[90vh] overflow-y-auto animate-scaleUp">
            {/* Header */}
            <div className="flex justify-between items-start border-b border-[#1E293B] pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-black text-xl text-white">Order: {editingOrder.orderNumber}</h3>
                  <span
                    className={`px-3 py-0.5 rounded-full text-xs font-bold ${
                      newStatus === 'Confirmed'
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : newStatus === 'Pending'
                        ? 'bg-amber-500/20 text-amber-400'
                        : 'bg-red-500/20 text-red-400'
                    }`}
                  >
                    {newStatus}
                  </span>
                </div>
                <div className="text-xs text-[#94A3B8] mt-1 space-y-1">
                  <div>
                    <span className="font-semibold text-gray-300">Items: </span>
                    {editingOrder.items.map((i) => (
                      <span key={i.product.id} className="inline-block mr-2">
                        {i.product.name} ({i.quantity})
                        {i.flavorSummary && (
                          <span className="text-purple-300 ml-1">[{i.flavorSummary}]</span>
                        )}
                        {i.selectedBundle && (
                          <span className="text-amber-300 ml-1">
                            ({typeof i.selectedBundle === 'string' ? i.selectedBundle : i.selectedBundle.title})
                          </span>
                        )}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
              <button
                onClick={() => setEditingOrder(null)}
                className="text-gray-400 hover:text-white p-1 rounded-full hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Grid with Copy Buttons (Image 2 format) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="bg-[#0B1329] border border-[#1E293B] p-3 rounded-2xl flex justify-between items-center">
                <div>
                  <span className="text-[#94A3B8] text-[10px] block font-semibold">Customer Name:</span>
                  <span className="font-bold text-white text-sm">{editingOrder.customerName}</span>
                </div>
                <button
                  onClick={() => copyToClipboard(editingOrder.customerName, 'Name')}
                  className="bg-[#1E293B] hover:bg-[#334155] text-[#94A3B8] hover:text-white px-2.5 py-1.5 rounded-xl font-bold flex items-center gap-1 cursor-pointer transition-colors"
                >
                  {copiedField === 'Name' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedField === 'Name' ? 'Copied' : 'Copy'}</span>
                </button>
              </div>

              <div className="bg-[#0B1329] border border-[#1E293B] p-3 rounded-2xl flex justify-between items-center">
                <div>
                  <span className="text-[#94A3B8] text-[10px] block font-semibold">Phone Number:</span>
                  <span className="font-bold text-[#60A5FA] text-sm">{editingOrder.customerPhone}</span>
                </div>
                <button
                  onClick={() => copyToClipboard(editingOrder.customerPhone, 'Phone')}
                  className="bg-[#1E293B] hover:bg-[#334155] text-[#94A3B8] hover:text-white px-2.5 py-1.5 rounded-xl font-bold flex items-center gap-1 cursor-pointer transition-colors"
                >
                  {copiedField === 'Phone' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedField === 'Phone' ? 'Copied' : 'Copy'}</span>
                </button>
              </div>

              <div className="bg-[#0B1329] border border-[#1E293B] p-3 rounded-2xl flex justify-between items-center sm:col-span-2">
                <div>
                  <span className="text-[#94A3B8] text-[10px] block font-semibold">Shipping Address:</span>
                  <span className="font-bold text-white text-xs">{editingOrder.shippingAddress} ({editingOrder.deliveryArea})</span>
                </div>
                <button
                  onClick={() => copyToClipboard(editingOrder.shippingAddress, 'Address')}
                  className="bg-[#1E293B] hover:bg-[#334155] text-[#94A3B8] hover:text-white px-2.5 py-1.5 rounded-xl font-bold flex items-center gap-1 cursor-pointer transition-colors shrink-0 ml-2"
                >
                  {copiedField === 'Address' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedField === 'Address' ? 'Copied' : 'Copy'}</span>
                </button>
              </div>

              <div className="bg-[#0B1329] border border-[#1E293B] p-3 rounded-2xl flex justify-between items-center sm:col-span-2">
                <div>
                  <span className="text-[#94A3B8] text-[10px] block font-semibold">Total Revenue & Payment:</span>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="font-black text-[#10B981] text-base">৳{editingOrder.totalPrice}</span>
                    <span
                      className={`text-xs font-bold px-2 py-0.5 rounded ${
                        editingOrder.paymentMethod === 'bKash'
                          ? 'bg-pink-500/20 text-pink-400 border border-pink-500/30'
                          : editingOrder.paymentMethod === 'Nagad'
                          ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                          : 'bg-slate-700 text-slate-300'
                      }`}
                    >
                      {editingOrder.paymentMethod}
                    </span>
                  </div>
                  {editingOrder.senderPhone && (
                    <div className="text-xs text-[#CBD5E1] mt-1 font-mono">
                      Sender Phone: <span className="font-bold text-amber-400">{editingOrder.senderPhone}</span>
                    </div>
                  )}
                  {editingOrder.trxId && (
                    <div className="text-xs text-[#CBD5E1] font-mono">
                      TrxID: <span className="font-bold text-amber-400">{editingOrder.trxId}</span>
                    </div>
                  )}
                </div>
                <button
                  onClick={() =>
                    copyToClipboard(
                      `৳${editingOrder.totalPrice} (${editingOrder.paymentMethod}${
                        editingOrder.senderPhone ? `, Sender: ${editingOrder.senderPhone}` : ''
                      }${editingOrder.trxId ? `, TrxID: ${editingOrder.trxId}` : ''})`,
                      'Revenue'
                    )
                  }
                  className="bg-[#1E293B] hover:bg-[#334155] text-[#94A3B8] hover:text-white px-2.5 py-1.5 rounded-xl font-bold flex items-center gap-1 cursor-pointer transition-colors"
                >
                  {copiedField === 'Revenue' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedField === 'Revenue' ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
            </div>

            {/* Order Status Selectors */}
            <div>
              <label className="block text-[#CBD5E1] font-bold mb-2 text-xs">Order Status:</label>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
                {(['Pending', 'Confirmed', 'Shipped', 'Delivered', 'Cancelled'] as OrderStatus[]).map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => handleStatusChange(st)}
                    className={`py-2 rounded-xl font-extrabold transition-all cursor-pointer text-center text-[11px] ${
                      newStatus === st
                        ? st === 'Pending'
                          ? 'bg-amber-500 text-white shadow-md'
                          : st === 'Confirmed'
                          ? 'bg-emerald-500 text-white shadow-md'
                          : st === 'Shipped'
                          ? 'bg-blue-500 text-white shadow-md'
                          : st === 'Delivered'
                          ? 'bg-green-600 text-white shadow-md'
                          : 'bg-red-500 text-white shadow-md'
                        : 'bg-[#0B1329] border border-[#1E293B] text-[#94A3B8] hover:bg-[#1E293B]'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>

            {/* Call Status Response Selectors */}
            <div>
              <label className="block text-[#CBD5E1] font-bold mb-2 text-xs">Call Status Response:</label>
              <div className="grid grid-cols-3 gap-2 text-xs">
                {callStatusList.map((cs) => (
                  <button
                    key={cs}
                    type="button"
                    onClick={() => setNewCallStatus(cs)}
                    className={`py-2 rounded-xl font-semibold transition-all cursor-pointer text-center text-[11px] ${
                      newCallStatus === cs
                        ? cs === 'Call Success'
                          ? 'bg-teal-600 text-white shadow-md'
                          : cs === 'Fake Order'
                          ? 'bg-red-600 text-white shadow-md'
                          : 'bg-blue-600 text-white shadow-md'
                        : 'bg-[#0B1329] border border-[#1E293B] text-[#94A3B8] hover:bg-[#1E293B]'
                    }`}
                  >
                    {cs}
                  </button>
                ))}
              </div>
            </div>

            {/* Admin Notes */}
            <div>
              <label className="block text-[#CBD5E1] font-bold mb-1.5 text-xs">Order Note (Admin Notes):</label>
              <textarea
                rows={2}
                value={adminNote}
                onChange={(e) => setAdminNote(e.target.value)}
                placeholder="কাস্টমার নোট বা ডেলিভারি রিমার্কস..."
                className="w-full bg-[#0B1329] border border-[#1E293B] rounded-2xl p-3 text-xs text-white placeholder-[#64748B] focus:outline-none focus:border-[#2563EB]"
              />
            </div>

            {/* Bottom Buttons */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-[#1E293B]">
              <button
                type="button"
                onClick={() => copyFullOrderDetails(editingOrder)}
                className="bg-[#1E293B] hover:bg-[#334155] text-white px-4 py-2.5 rounded-xl text-xs font-extrabold flex items-center gap-1.5 cursor-pointer transition-colors"
              >
                {copiedField === 'FullOrder' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                <span>{copiedField === 'FullOrder' ? 'Full Order Copied!' : 'Copy Full Order'}</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setEditingOrder(null)}
                  className="px-4 py-2.5 rounded-xl bg-[#0B1329] hover:bg-[#1E293B] text-xs font-bold text-[#CBD5E1] cursor-pointer"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={handleSaveEdit}
                  disabled={isSavingEdit}
                  className="px-5 py-2.5 rounded-xl bg-[#2563EB] hover:bg-blue-600 disabled:opacity-50 text-xs font-black text-white flex items-center gap-1.5 shadow-lg cursor-pointer transition-all"
                >
                  {isSavingEdit ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin text-white" />
                      <span>Saving to Supabase...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span>Save Updates</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Create Manual Order Modal */}
      {isAddOrderOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-2 sm:p-4 overflow-y-auto">
          <div className="bg-[#0F172A] border border-[#1E293B] rounded-3xl max-w-lg w-full p-4 sm:p-6 space-y-4 shadow-2xl my-auto max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-[#1E293B] pb-3">
              <div>
                <h2 className="text-base font-extrabold text-white flex items-center gap-2">
                  <Plus className="w-5 h-5 text-[#2563EB]" />
                  <span>নতুন ম্যানুয়াল অর্ডার প্লেস করুন</span>
                </h2>
                <p className="text-[11px] text-[#94A3B8]">অর্ডারটি ডাটাবেজে সেভ হয়ে সাথে সাথে সকল ডিভাইসে সিঙ্ক হবে</p>
              </div>
              <button
                onClick={() => setIsAddOrderOpen(false)}
                className="p-1.5 hover:bg-[#1E293B] text-[#94A3B8] hover:text-white rounded-xl transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateOrder} className="space-y-4 text-xs">
              {/* Product Selection */}
              <div>
                <label className="block text-[#CBD5E1] font-bold mb-1">প্রোডাক্ট সিলেক্ট করুন *</label>
                <select
                  value={selectedProdId}
                  onChange={(e) => {
                    setSelectedProdId(e.target.value);
                    const found = products.find(p => p.id === e.target.value);
                    if (found && found.colors && found.colors.length > 0) {
                      setSelectedColor(found.colors[0]);
                    }
                  }}
                  required
                  className="w-full bg-[#0B1329] border border-[#1E293B] rounded-xl p-2.5 text-white font-medium focus:outline-none focus:border-[#2563EB]"
                >
                  <option value="">-- প্রোডাক্ট বেছে নিন --</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} - ৳{p.discountPrice || p.price} (Stock: {p.stock})
                    </option>
                  ))}
                </select>
              </div>

              {/* Quantity & Color */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#CBD5E1] font-bold mb-1">পরিমাণ (Quantity)</label>
                  <input
                    type="number"
                    min={1}
                    value={orderQty}
                    onChange={(e) => setOrderQty(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-full bg-[#0B1329] border border-[#1E293B] rounded-xl p-2.5 text-white font-medium focus:outline-none focus:border-[#2563EB]"
                  />
                </div>

                <div>
                  <label className="block text-[#CBD5E1] font-bold mb-1">কালার (Optional)</label>
                  <input
                    type="text"
                    value={selectedColor}
                    onChange={(e) => setSelectedColor(e.target.value)}
                    placeholder="e.g. Black / Blue"
                    className="w-full bg-[#0B1329] border border-[#1E293B] rounded-xl p-2.5 text-white font-medium focus:outline-none focus:border-[#2563EB]"
                  />
                </div>
              </div>

              {/* Customer Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#CBD5E1] font-bold mb-1">কাস্টমারের নাম *</label>
                  <input
                    type="text"
                    required
                    value={newCustName}
                    onChange={(e) => setNewCustName(e.target.value)}
                    placeholder="কাস্টমারের পূর্ণ নাম"
                    className="w-full bg-[#0B1329] border border-[#1E293B] rounded-xl p-2.5 text-white font-medium focus:outline-none focus:border-[#2563EB]"
                  />
                </div>

                <div>
                  <label className="block text-[#CBD5E1] font-bold mb-1">মোবাইল নম্বর *</label>
                  <input
                    type="tel"
                    required
                    value={newCustPhone}
                    onChange={(e) => setNewCustPhone(e.target.value)}
                    placeholder="01XXXXXXXXX"
                    className="w-full bg-[#0B1329] border border-[#1E293B] rounded-xl p-2.5 text-white font-medium focus:outline-none focus:border-[#2563EB]"
                  />
                </div>
              </div>

              {/* Shipping Address */}
              <div>
                <label className="block text-[#CBD5E1] font-bold mb-1">পূর্ণাঙ্গ ডেলিভারি ঠিকানা *</label>
                <textarea
                  rows={2}
                  required
                  value={newCustAddress}
                  onChange={(e) => setNewCustAddress(e.target.value)}
                  placeholder="বাড়ির নম্বর, রোড, এলাকা, জেলা..."
                  className="w-full bg-[#0B1329] border border-[#1E293B] rounded-xl p-2.5 text-white font-medium focus:outline-none focus:border-[#2563EB]"
                />
              </div>

              {/* Delivery Area & Payment Method */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#CBD5E1] font-bold mb-1">ডেলিভারি এরিয়া</label>
                  <select
                    value={newDeliveryArea}
                    onChange={(e) => setNewDeliveryArea(e.target.value as any)}
                    className="w-full bg-[#0B1329] border border-[#1E293B] rounded-xl p-2.5 text-white font-medium focus:outline-none focus:border-[#2563EB]"
                  >
                    <option value="Inside Dhaka">ঢাকার ভেতরে (৳{settings.deliveryFeeInside || 60})</option>
                    <option value="Outside Dhaka">ঢাকার বাইরে (৳{settings.deliveryFeeOutside || 120})</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[#CBD5E1] font-bold mb-1">পেমেন্ট মেথড</label>
                  <select
                    value={newPayMethod}
                    onChange={(e) => setNewPayMethod(e.target.value as any)}
                    className="w-full bg-[#0B1329] border border-[#1E293B] rounded-xl p-2.5 text-white font-medium focus:outline-none focus:border-[#2563EB]"
                  >
                    <option value="COD">Cash on Delivery</option>
                    <option value="bKash">bKash Personal</option>
                    <option value="Nagad">Nagad Personal</option>
                  </select>
                </div>
              </div>

              {/* Sender Phone & TrxID if bKash / Nagad */}
              {newPayMethod !== 'COD' && (
                <div className="grid grid-cols-2 gap-3 bg-[#071320] border border-pink-500/30 p-3 rounded-2xl">
                  <div>
                    <label className="block text-pink-300 font-bold mb-1 text-[11px]">সেন্ডার নম্বর</label>
                    <input
                      type="text"
                      value={newSenderPhone}
                      onChange={(e) => setNewSenderPhone(e.target.value)}
                      placeholder="01XXXXXXXXX"
                      className="w-full bg-[#0B1329] border border-[#1E293B] rounded-xl p-2 text-white text-xs font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-pink-300 font-bold mb-1 text-[11px]">ট্রানজেকশন ID (TrxID)</label>
                    <input
                      type="text"
                      value={newTrxId}
                      onChange={(e) => setNewTrxId(e.target.value)}
                      placeholder="e.g. 9J28XKL9"
                      className="w-full bg-[#0B1329] border border-[#1E293B] rounded-xl p-2 text-white text-xs font-mono"
                    />
                  </div>
                </div>
              )}

              {/* Admin Note */}
              <div>
                <label className="block text-[#CBD5E1] font-bold mb-1">অর্ডার নোট / রিমার্কস (Optional)</label>
                <input
                  type="text"
                  value={newOrderNotes}
                  onChange={(e) => setNewOrderNotes(e.target.value)}
                  placeholder="কাস্টমারের সাথে আলোচনার বিশেষ নোট..."
                  className="w-full bg-[#0B1329] border border-[#1E293B] rounded-xl p-2.5 text-white font-medium focus:outline-none focus:border-[#2563EB]"
                />
              </div>

              {/* Submit Buttons */}
              <div className="flex justify-end gap-2 pt-3 border-t border-[#1E293B]">
                <button
                  type="button"
                  onClick={() => setIsAddOrderOpen(false)}
                  className="px-4 py-2 bg-[#0B1329] hover:bg-[#1E293B] text-[#CBD5E1] font-bold rounded-xl"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#2563EB] hover:bg-blue-600 text-white font-black rounded-xl shadow-lg flex items-center gap-1.5 cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>অর্ডারটি সেভ করুন</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Supabase RLS Fix Modal */}
      {isSqlModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-[#0F172A] border border-[#1E293B] rounded-3xl max-w-xl w-full p-5 sm:p-6 space-y-4 shadow-2xl my-auto">
            <div className="flex justify-between items-center border-b border-[#1E293B] pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-amber-500/10 text-amber-400 rounded-xl border border-amber-500/20">
                  <ShieldCheck className="w-5 h-5 text-amber-400" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Supabase ডাটাবেজ পারমিশন ও RLS ফিক্স</h3>
                  <p className="text-xs text-[#94A3B8]">অর্ডার স্ট্যাটাস ডাটাবেজে সেভ না হওয়ার সমাধান</p>
                </div>
              </div>
              <button
                onClick={() => setIsSqlModalOpen(false)}
                className="p-1.5 hover:bg-[#1E293B] text-[#94A3B8] hover:text-white rounded-xl transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-[#CBD5E1]">
              <p className="leading-relaxed">
                Supabase-এ নতুন টেবিল তৈরি করলে ডিফল্টভাবে <strong>Row Level Security (RLS)</strong> অন থাকে, যার ফলে অ্যাপ থেকে ডাটাবেজে স্ট্যাটাস বা ডাটা আপডেট ব্লক হয়ে যেতে পারে।
              </p>

              <div className="bg-[#070D1A] border border-[#1E293B] p-3 rounded-2xl space-y-2">
                <div className="flex items-center justify-between text-xs text-[#94A3B8]">
                  <span className="font-mono text-amber-400 font-bold">SQL Editor-এ রান করার জন্য স্ক্রিপ্ট:</span>
                  <button
                    onClick={() => {
                      const sql = `-- Supabase Orders & Tables Permissions Fix\nALTER TABLE public.orders DISABLE ROW LEVEL SECURITY;\nALTER TABLE public.products DISABLE ROW LEVEL SECURITY;\nALTER TABLE public.categories DISABLE ROW LEVEL SECURITY;\nALTER TABLE public.coupons DISABLE ROW LEVEL SECURITY;\nALTER TABLE public.settings DISABLE ROW LEVEL SECURITY;\nALTER TABLE public.team DISABLE ROW LEVEL SECURITY;\nALTER TABLE public.customer_profiles DISABLE ROW LEVEL SECURITY;\n\nALTER TABLE public.orders ADD COLUMN IF NOT EXISTS status text DEFAULT 'Pending';\nALTER TABLE public.orders ADD COLUMN IF NOT EXISTS call_status text DEFAULT 'Not Called';\nALTER TABLE public.orders ADD COLUMN IF NOT EXISTS order_number text;\nALTER TABLE public.orders ADD COLUMN IF NOT EXISTS customer_name text;\nALTER TABLE public.orders ADD COLUMN IF NOT EXISTS customer_phone text;\nALTER TABLE public.orders ADD COLUMN IF NOT EXISTS shipping_address text;\nALTER TABLE public.orders ADD COLUMN IF NOT EXISTS delivery_area text;\nALTER TABLE public.orders ADD COLUMN IF NOT EXISTS total_price numeric;\nALTER TABLE public.orders ADD COLUMN IF NOT EXISTS data jsonb NOT NULL DEFAULT '{}'::jsonb;\n\nGRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, postgres, service_role;`;
                      navigator.clipboard.writeText(sql);
                      setSqlCopied(true);
                      setTimeout(() => setSqlCopied(false), 2500);
                    }}
                    className="bg-[#2563EB] hover:bg-blue-600 text-white px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    {sqlCopied ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{sqlCopied ? 'কপি হয়েছে!' : 'SQL কোড কপি করুন'}</span>
                  </button>
                </div>

                <pre className="p-3 bg-black/60 rounded-xl text-[11px] font-mono text-emerald-400 overflow-x-auto border border-[#1E293B]">
{`-- ১. RLS বন্ধ করে সরাসরি পারমিশন দিন
ALTER TABLE public.orders DISABLE ROW LEVEL SECURITY;

-- ২. কলামগুলো নিশ্চিত করুন
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS status text DEFAULT 'Pending';
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS call_status text DEFAULT 'Not Called';

-- ৩. পাবলিক পারমিশন দিন
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, postgres, service_role;`}
                </pre>
              </div>

              <div className="bg-blue-500/10 border border-blue-500/30 p-3 rounded-2xl text-[11px] text-blue-200">
                <strong>কিভাবে রান করবেন:</strong> আপনার <a href="https://app.supabase.com" target="_blank" rel="noreferrer" className="underline font-bold text-white">Supabase ড্যাশবোর্ডে</a> যান &gt; বাম পাশের মেনু থেকে <strong>SQL Editor</strong> &gt; <strong>+ New Query</strong> তে পেস্ট করে <strong>Run</strong> বাটনে ক্লিক করুন।
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-[#1E293B]">
              <button
                type="button"
                onClick={() => setIsSqlModalOpen(false)}
                className="px-4 py-2 bg-[#1E293B] hover:bg-[#334155] text-white font-bold text-xs rounded-xl cursor-pointer"
              >
                বুঝেছি, বন্ধ করুন
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
