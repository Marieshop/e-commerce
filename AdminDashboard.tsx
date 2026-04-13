import React, { useEffect, useState } from 'react';
import { Product, Order, StockMovement, Analytics, Expense, Income, LedgerSummary } from '../types';
import { api } from './api';
import { Button } from './Button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './Card';
import { Input } from './Input';
import { Badge } from './Badge';
import { formatPrice, cn } from './utils';
import { 
  LayoutDashboard, 
  Package, 
  ShoppingCart, 
  TrendingUp, 
  Plus, 
  Trash2, 
  Edit, 
  ArrowUpRight, 
  ArrowDownRight,
  AlertTriangle,
  ShieldCheck,
  Download,
  BookOpen,
  Wallet,
  Receipt,
  History,
  Search,
  Filter,
  FileText,
  Table as TableIcon
} from 'lucide-react';
import { toast } from 'sonner';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell,
  LineChart,
  Line
} from 'recharts';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';

export function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<'overview' | 'products' | 'orders' | 'stock' | 'ledger'>('overview');
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [stockMovements, setStockMovements] = useState<StockMovement[]>([]);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  
  // Ledger state
  const [ledgerSummary, setLedgerSummary] = useState<LedgerSummary | null>(null);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [income, setIncome] = useState<Income[]>([]);
  const [ledgerSubTab, setLedgerSubTab] = useState<'summary' | 'income' | 'expenses' | 'stock'>('summary');
  
  const [loading, setLoading] = useState(true);

  // Form states
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [stockInProduct, setStockInProduct] = useState<Product | null>(null);
  const [stockAmount, setStockAmount] = useState('');
  
  const [newProduct, setNewProduct] = useState({
    name: '',
    category: 'Abanyeshuri',
    price: '',
    cost_price: '',
    description: '',
    stock: ''
  });
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [existingImages, setExistingImages] = useState<string[]>([]);

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);

  // Ledger state
  const [newExpense, setNewExpense] = useState({ description: '', amount: '', category: 'Transport', date: '' });
  const [newIncome, setNewIncome] = useState({ source: 'Sale', amount: '', description: '', date: '' });
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [showAddIncome, setShowAddIncome] = useState(false);
  const [ledgerFilter, setLedgerFilter] = useState({ start: '', end: '', search: '' });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const handleLogin = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (password === 'admin123') {
      setIsAuthenticated(true);
      toast.success('Welcome back, Admin');
    } else {
      toast.error('Invalid password');
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="container mx-auto px-4 py-20 flex justify-center">
        <Card className="w-full max-w-md border-primary/20 shadow-2xl overflow-hidden">
          <div className="h-2 bg-primary w-full" />
          <CardHeader className="text-center pt-8">
            <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4 border border-primary/20">
              <ShieldCheck className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="text-3xl font-black tracking-tighter">ADMIN ACCESS</CardTitle>
            <CardDescription>Secure management portal for BagStore Rwanda</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 p-8">
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Access Password</label>
                <Input 
                  type="password" 
                  placeholder="••••••••" 
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="h-12 rounded-2xl border-primary/10 focus:ring-primary"
                  autoFocus
                />
              </div>
              <Button type="submit" className="w-full h-14 text-lg font-black rounded-full shadow-xl shadow-primary/20">
                Enter Dashboard
              </Button>
            </form>
            <div className="bg-secondary/50 p-4 rounded-2xl text-[10px] text-center text-muted-foreground uppercase tracking-widest border border-primary/5">
              Default Access: <span className="text-primary font-bold">admin123</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  async function loadData() {
    setLoading(true);
    try {
      const [p, o, s, a, ls, ex, inc] = await Promise.all([
        api.products.getAll(),
        api.orders.getAll(),
        api.stock.getMovements(),
        api.analytics.get(),
        api.ledger.getSummary(),
        api.ledger.expenses.getAll(),
        api.ledger.income.getAll()
      ]);
      setProducts(p);
      setOrders(o);
      setStockMovements(s);
      setAnalytics(a);
      setLedgerSummary(ls);
      setExpenses(ex);
      setIncome(inc);
    } catch (error) {
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      setSelectedFiles(prev => [...prev, ...files]);
      const previews = files.map(file => URL.createObjectURL(file as File));
      setImagePreviews(prev => [...prev, ...previews]);
    }
  };

  const removeExistingImage = (index: number) => {
    setExistingImages(prev => prev.filter((_, i) => i !== index));
  };

  const removeNewImage = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  async function handleAddProduct(e: React.FormEvent) {
    e.preventDefault();
    if (selectedFiles.length === 0 && existingImages.length === 0 && !editingProduct) return toast.error('Please select images');
    setIsSaving(true);

    const formData = new FormData();
    formData.append('name', newProduct.name);
    formData.append('category', newProduct.category);
    formData.append('price', newProduct.price);
    formData.append('cost_price', newProduct.cost_price);
    formData.append('description', newProduct.description);
    formData.append('stock', newProduct.stock);
    
    // Send the current state of existing images
    formData.append('existingImages', JSON.stringify(existingImages));

    selectedFiles.forEach(file => {
      formData.append('images', file);
    });

    try {
      if (editingProduct) {
        await api.products.update(editingProduct.id, formData);
        toast.success('Product updated successfully');
      } else {
        await api.products.create(formData);
        toast.success('Product added successfully');
      }
      setShowAddProduct(false);
      setEditingProduct(null);
      resetForm();
      loadData();
    } catch (error: any) {
      console.error('Save error details:', error);
      toast.error(`Failed to save product: ${error.message || 'Unknown error'}`);
    } finally {
      setIsSaving(false);
    }
  }

  function resetForm() {
    setNewProduct({
      name: '',
      category: 'Abanyeshuri',
      price: '',
      cost_price: '',
      description: '',
      stock: ''
    });
    setSelectedFiles([]);
    setImagePreviews([]);
    setExistingImages([]);
  }

  async function handleDeleteOrder(id: number) {
    try {
      await api.orders.delete(id);
      toast.success('Order deleted');
      loadData();
    } catch (error) {
      toast.error('Failed to delete order');
    }
  }

  async function handleDeleteProduct(id: number) {
    try {
      await api.products.delete(id);
      toast.success('Product deleted successfully');
      setConfirmDeleteId(null);
      loadData();
    } catch (error) {
      toast.error('Failed to delete product');
    }
  }

  function downloadOrders() {
    if (orders.length === 0) return toast.error('No orders to export');
    
    const headers = ['Date', 'Customer Name', 'Phone', 'Address', 'Product', 'Quantity'];
    const csvContent = [
      headers.join(','),
      ...orders.map(o => [
        new Date(o.date).toLocaleDateString(),
        o.customer_info.name,
        o.customer_info.phone,
        o.customer_info.address,
        o.product_name,
        o.quantity
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `orders_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Orders exported successfully');
  }

  async function handleStockIn(e: React.FormEvent) {
    e.preventDefault();
    if (!stockInProduct || !stockAmount) return;
    try {
      await api.stock.addStock(stockInProduct.id, parseInt(stockAmount));
      toast.success(`Added ${stockAmount} items to ${stockInProduct.name}`);
      setStockInProduct(null);
      setStockAmount('');
      loadData();
    } catch (error) {
      toast.error('Failed to update stock');
    }
  }

  async function handleAddExpense(e: React.FormEvent) {
    e.preventDefault();
    try {
      await api.ledger.expenses.create({
        ...newExpense,
        amount: parseFloat(newExpense.amount)
      });
      toast.success('Expense recorded');
      setShowAddExpense(false);
      setNewExpense({ description: '', amount: '', category: 'Transport', date: '' });
      loadData();
    } catch (error) {
      toast.error('Failed to record expense');
    }
  }

  async function handleAddIncome(e: React.FormEvent) {
    e.preventDefault();
    try {
      await api.ledger.income.create({
        ...newIncome,
        amount: parseFloat(newIncome.amount)
      });
      toast.success('Income recorded');
      setShowAddIncome(false);
      setNewIncome({ source: 'Sale', amount: '', description: '', date: '' });
      loadData();
    } catch (error) {
      toast.error('Failed to record income');
    }
  }

  async function handleDeleteExpense(id: number) {
    try {
      await api.ledger.expenses.delete(id);
      toast.success('Expense deleted');
      loadData();
    } catch (error) {
      toast.error('Failed to delete expense');
    }
  }

  async function handleDeleteIncome(id: number) {
    try {
      await api.ledger.income.delete(id);
      toast.success('Income deleted');
      loadData();
    } catch (error) {
      toast.error('Failed to delete income');
    }
  }

  function exportLedgerToPDF() {
    const doc = new jsPDF();
    doc.setFontSize(20);
    doc.text('BagStore Rwanda - Financial Report', 14, 22);
    doc.setFontSize(12);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 30);

    if (ledgerSummary) {
      doc.text(`Total Income: ${formatPrice(ledgerSummary.totalIncome)}`, 14, 45);
      doc.text(`Total Expenses: ${formatPrice(ledgerSummary.totalExpenses)}`, 14, 52);
      doc.text(`Net Profit: ${formatPrice(ledgerSummary.profit)}`, 14, 59);
      doc.text(`Stock Value: ${formatPrice(ledgerSummary.stockValue)}`, 14, 66);
    }

    // Expenses Table
    doc.text('Expenses Breakdown', 14, 80);
    (doc as any).autoTable({
      startY: 85,
      head: [['Date', 'Description', 'Category', 'Amount']],
      body: expenses.map(e => [new Date(e.date).toLocaleDateString(), e.description, e.category, formatPrice(e.amount)]),
    });

    // Income Table
    const finalY = (doc as any).lastAutoTable.finalY || 150;
    doc.text('Income Breakdown', 14, finalY + 15);
    (doc as any).autoTable({
      startY: finalY + 20,
      head: [['Date', 'Source', 'Description', 'Amount']],
      body: income.map(i => [new Date(i.date).toLocaleDateString(), i.source, i.description, formatPrice(i.amount)]),
    });

    doc.save(`ledger_report_${new Date().toISOString().split('T')[0]}.pdf`);
    toast.success('Report exported to PDF');
  }

  function exportLedgerToExcel() {
    const wb = XLSX.utils.book_new();
    
    const summaryData = [
      ['Metric', 'Value'],
      ['Total Income', ledgerSummary?.totalIncome],
      ['Total Expenses', ledgerSummary?.totalExpenses],
      ['Net Profit', ledgerSummary?.profit],
      ['Stock Value', ledgerSummary?.stockValue],
    ];
    const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(wb, wsSummary, 'Summary');

    const wsExpenses = XLSX.utils.json_to_sheet(expenses.map(e => ({
      Date: new Date(e.date).toLocaleDateString(),
      Description: e.description,
      Category: e.category,
      Amount: e.amount
    })));
    XLSX.utils.book_append_sheet(wb, wsExpenses, 'Expenses');

    const wsIncome = XLSX.utils.json_to_sheet(income.map(i => ({
      Date: new Date(i.date).toLocaleDateString(),
      Source: i.source,
      Description: i.description,
      Amount: i.amount
    })));
    XLSX.utils.book_append_sheet(wb, wsIncome, 'Income');

    XLSX.writeFile(wb, `ledger_report_${new Date().toISOString().split('T')[0]}.xlsx`);
    toast.success('Report exported to Excel');
  }

  function startEdit(product: Product) {
    setEditingProduct(product);
    setExistingImages(product.images || []);
    setNewProduct({
      name: product.name,
      category: product.category,
      price: product.price.toString(),
      cost_price: (product.cost_price || 0).toString(),
      description: product.description,
      stock: product.stock.toString()
    });
    setShowAddProduct(true);
  }

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
    </div>
  );

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar */}
        <aside className="w-full lg:w-64 space-y-2">
          <div className="p-4 mb-4 bg-primary/5 rounded-xl border border-primary/10">
            <h3 className="text-xs font-bold uppercase tracking-widest text-primary/60 mb-1">Management</h3>
            <p className="text-sm font-medium">BagStore Admin v1.0</p>
          </div>
          <Button 
            variant={activeTab === 'overview' ? 'default' : 'ghost'} 
            className={cn("w-full justify-start gap-3 h-11", activeTab === 'overview' && "shadow-lg shadow-primary/20")}
            onClick={() => setActiveTab('overview')}
          >
            <LayoutDashboard className="h-4 w-4" /> Overview
          </Button>
          <Button 
            variant={activeTab === 'products' ? 'default' : 'ghost'} 
            className={cn("w-full justify-start gap-3 h-11", activeTab === 'products' && "shadow-lg shadow-primary/20")}
            onClick={() => setActiveTab('products')}
          >
            <Package className="h-4 w-4" /> Products
          </Button>
          <Button 
            variant={activeTab === 'orders' ? 'default' : 'ghost'} 
            className={cn("w-full justify-start gap-3 h-11", activeTab === 'orders' && "shadow-lg shadow-primary/20")}
            onClick={() => setActiveTab('orders')}
          >
            <ShoppingCart className="h-4 w-4" /> Orders
          </Button>
          <Button 
            variant={activeTab === 'stock' ? 'default' : 'ghost'} 
            className={cn("w-full justify-start gap-3 h-11", activeTab === 'stock' && "shadow-lg shadow-primary/20")}
            onClick={() => setActiveTab('stock')}
          >
            <TrendingUp className="h-4 w-4" /> Stock History
          </Button>
          <Button 
            variant={activeTab === 'ledger' ? 'default' : 'ghost'} 
            className={cn("w-full justify-start gap-3 h-11", activeTab === 'ledger' && "shadow-lg shadow-primary/20")}
            onClick={() => setActiveTab('ledger')}
          >
            <BookOpen className="h-4 w-4" /> Ledger & Accounting
          </Button>
        </aside>

        {/* Main Content */}
        <main className="flex-1">
          {activeTab === 'overview' && (
            <div className="space-y-8">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <Card className="border-none bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-xl">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium opacity-80">Total Revenue</CardTitle>
                    <TrendingUp className="h-4 w-4 opacity-80" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-black">{formatPrice(analytics?.totalRevenue || 0)}</div>
                    <p className="text-[10px] mt-1 opacity-60 uppercase tracking-tighter">Lifetime earnings</p>
                  </CardContent>
                </Card>
                <Card className="border-none bg-white shadow-xl">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Total Sales</CardTitle>
                    <ShoppingCart className="h-4 w-4 text-primary" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-black">{analytics?.totalSales}</div>
                    <p className="text-[10px] mt-1 text-muted-foreground uppercase tracking-tighter">Items sold</p>
                  </CardContent>
                </Card>
                <Card className={cn("border-none shadow-xl", analytics?.lowStockCount ? "bg-destructive text-destructive-foreground" : "bg-white")}>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium opacity-80">Low Stock</CardTitle>
                    <AlertTriangle className="h-4 w-4 opacity-80" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-black">{analytics?.lowStockCount}</div>
                    <p className="text-[10px] mt-1 opacity-60 uppercase tracking-tighter">Items needing restock</p>
                  </CardContent>
                </Card>
              </div>

              <Card className="border-none shadow-xl overflow-hidden">
                <CardHeader className="bg-secondary/30">
                  <CardTitle className="flex items-center gap-2">
                    <ShoppingCart className="h-5 w-5 text-primary" /> Recent Orders
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="divide-y">
                    {orders.length > 0 ? orders.slice(0, 5).map(order => (
                      <div key={order.id} className="flex items-center justify-between p-5 hover:bg-secondary/10 transition-colors">
                        <div className="flex gap-4 items-center">
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                            {order.customer_info.name.charAt(0)}
                          </div>
                          <div>
                            <div className="font-bold text-sm">{order.product_name}</div>
                            <div className="text-xs text-muted-foreground">{order.customer_info.name} • {order.customer_info.phone}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-black text-primary">Qty: {order.quantity}</div>
                          <div className="text-[10px] text-muted-foreground uppercase">{new Date(order.date).toLocaleDateString()}</div>
                        </div>
                      </div>
                    )) : (
                      <div className="p-10 text-center text-muted-foreground">No orders yet</div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === 'products' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center bg-white p-4 rounded-2xl shadow-sm border">
                <div>
                  <h2 className="text-2xl font-black tracking-tight">Inventory</h2>
                  <p className="text-xs text-muted-foreground uppercase tracking-widest">{products.length} Products listed</p>
                </div>
                <Button onClick={() => { resetForm(); setEditingProduct(null); setShowAddProduct(true); }} className="gap-2 rounded-full px-6 shadow-lg shadow-primary/20">
                  <Plus className="h-4 w-4" /> New Product
                </Button>
              </div>

              {showAddProduct && (
                <Card className="border-primary/20 shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-4 duration-300">
                  <CardHeader className="bg-primary/5">
                    <CardTitle>{editingProduct ? 'Edit Product' : 'Add New Product'}</CardTitle>
                    <CardDescription>Fill in the details below to {editingProduct ? 'update' : 'list'} a bag.</CardDescription>
                  </CardHeader>
                  <CardContent className="p-6">
                    <form onSubmit={handleAddProduct} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-xs font-bold uppercase text-muted-foreground">Product Name</label>
                        <Input placeholder="e.g. Premium Leather Backpack" required value={newProduct.name} onChange={e => setNewProduct({...newProduct, name: e.target.value})} />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold uppercase text-muted-foreground">Category</label>
                        <select 
                          className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                          value={newProduct.category}
                          onChange={e => setNewProduct({...newProduct, category: e.target.value})}
                        >
                          <option>Abanyeshuri</option>
                          <option>Abakobwa</option>
                          <option>Urubyiruko</option>
                          <option>Abagabo</option>
                          <option>Abagore</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold uppercase text-muted-foreground">Selling Price (RWF)</label>
                        <Input type="number" placeholder="45000" required value={newProduct.price} onChange={e => setNewProduct({...newProduct, price: e.target.value})} />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold uppercase text-muted-foreground">Cost Price (RWF)</label>
                        <Input type="number" placeholder="30000" required value={newProduct.cost_price} onChange={e => setNewProduct({...newProduct, cost_price: e.target.value})} />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold uppercase text-muted-foreground">Initial Stock</label>
                        <Input type="number" placeholder="50" required value={newProduct.stock} onChange={e => setNewProduct({...newProduct, stock: e.target.value})} />
                      </div>
                      <div className="md:col-span-2 space-y-2">
                        <label className="text-xs font-bold uppercase text-muted-foreground">Description</label>
                        <textarea 
                          className="flex min-h-[100px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                          placeholder="Describe the bag's features, material, and size..."
                          required
                          value={newProduct.description}
                          onChange={e => setNewProduct({...newProduct, description: e.target.value})}
                        />
                      </div>
                      <div className="md:col-span-2 space-y-2">
                        <label className="text-xs font-bold uppercase text-muted-foreground">Product Images {editingProduct && '(Manage Gallery)'}</label>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
                          {existingImages.map((img, i) => (
                            <div key={i} className="relative aspect-square rounded-xl overflow-hidden border group/img">
                              <img src={img} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                              <div className="absolute top-1 right-1 bg-primary text-white text-[8px] px-1 rounded">Current</div>
                              <button 
                                type="button"
                                onClick={() => removeExistingImage(i)}
                                className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover/img:opacity-100 transition-opacity"
                              >
                                <Trash2 className="h-6 w-6 text-white" />
                              </button>
                            </div>
                          ))}
                          {imagePreviews.map((preview, i) => (
                            <div key={i} className="relative aspect-square rounded-xl overflow-hidden border border-primary group/img">
                              <img src={preview} className="w-full h-full object-cover" />
                              <div className="absolute top-1 right-1 bg-green-500 text-white text-[8px] px-1 rounded">New</div>
                              <button 
                                type="button"
                                onClick={() => removeNewImage(i)}
                                className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover/img:opacity-100 transition-opacity"
                              >
                                <Trash2 className="h-6 w-6 text-white" />
                              </button>
                            </div>
                          ))}
                        </div>
                        <div className="border-2 border-dashed rounded-xl p-8 text-center hover:bg-secondary/30 transition-colors cursor-pointer relative group">
                          <Input 
                            type="file" 
                            multiple 
                            accept="image/*" 
                            onChange={handleFileChange} 
                            className="absolute inset-0 opacity-0 cursor-pointer z-10"
                          />
                          <div className="flex flex-col items-center gap-2 group-hover:scale-110 transition-transform">
                            <Plus className="h-8 w-8 text-primary" />
                            <p className="text-sm font-bold text-primary">
                              {selectedFiles.length > 0 ? `${selectedFiles.length} files selected` : 'Click to upload new images'}
                            </p>
                            <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Supports JPG, PNG, WEBP</p>
                          </div>
                        </div>
                      </div>
                      <div className="md:col-span-2 flex gap-3 pt-4 border-t">
                        <Button type="submit" className="flex-1 h-12 text-lg font-bold" disabled={isSaving}>
                          {isSaving ? 'Saving...' : (editingProduct ? 'Update Product' : 'Save Product')}
                        </Button>
                        <Button type="button" variant="outline" className="flex-1 h-12" onClick={() => { setShowAddProduct(false); setEditingProduct(null); }} disabled={isSaving}>
                          Cancel
                        </Button>
                      </div>
                    </form>
                  </CardContent>
                </Card>
              )}

              {stockInProduct && (
                <Card className="border-green-200 bg-green-50 shadow-xl animate-in zoom-in-95 duration-200">
                  <CardHeader>
                    <CardTitle className="text-green-800">Restock: {stockInProduct.name}</CardTitle>
                    <CardDescription className="text-green-700/70">Current Stock: {stockInProduct.stock}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleStockIn} className="flex gap-4">
                      <Input 
                        type="number" 
                        placeholder="Quantity to add" 
                        required 
                        value={stockAmount} 
                        onChange={e => setStockAmount(e.target.value)}
                        className="bg-white border-green-200"
                      />
                      <Button type="submit" className="bg-green-600 hover:bg-green-700">Add Stock</Button>
                      <Button type="button" variant="ghost" onClick={() => setStockInProduct(null)}>Cancel</Button>
                    </form>
                  </CardContent>
                </Card>
              )}

              <div className="grid grid-cols-1 gap-4">
                {products.map(product => (
                  <div key={product.id} className="group flex flex-col sm:flex-row items-center gap-6 p-5 border rounded-2xl bg-white hover:shadow-xl transition-all duration-300">
                    <div className="relative h-24 w-24 rounded-xl overflow-hidden shadow-md">
                      <img 
                        src={product.images && product.images.length > 0 ? product.images[0] : 'https://picsum.photos/seed/bag/200/200'} 
                        className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-500" 
                        referrerPolicy="no-referrer" 
                      />
                      <div className="absolute top-1 right-1">
                        <Badge className="text-[8px] h-4 px-1">{product.category}</Badge>
                      </div>
                    </div>
                    <div className="flex-1 text-center sm:text-left">
                      <div className="font-black text-lg leading-tight">{product.name}</div>
                      <div className="flex gap-3 mt-1 justify-center sm:justify-start">
                        <div className="text-primary font-bold">{formatPrice(product.price)}</div>
                        <div className="text-muted-foreground text-xs line-through opacity-50">{formatPrice(product.cost_price || 0)}</div>
                        <div className="text-[10px] bg-green-100 text-green-700 px-2 rounded-full flex items-center font-bold">
                          Profit: {formatPrice(product.price - (product.cost_price || 0))}
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-1 mt-1">{product.description}</p>
                    </div>
                    <div className="flex flex-row sm:flex-col items-center gap-4 sm:gap-1 px-6 border-x border-dashed">
                      <div className="text-[10px] text-muted-foreground uppercase font-bold">Stock</div>
                      <div className={cn("text-2xl font-black", product.stock < 10 ? "text-destructive animate-pulse" : "text-primary")}>
                        {product.stock}
                      </div>
                      <Button variant="ghost" size="sm" className="h-6 text-[10px] text-green-600 hover:text-green-700 hover:bg-green-50" onClick={() => setStockInProduct(product)}>
                        + Restock
                      </Button>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="icon" className="rounded-full hover:bg-primary hover:text-white transition-colors" onClick={() => startEdit(product)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      {confirmDeleteId === product.id ? (
                        <div className="flex gap-1">
                          <Button variant="destructive" size="sm" className="rounded-full h-9 px-3 text-[10px] font-bold" onClick={() => handleDeleteProduct(product.id)}>
                            Confirm
                          </Button>
                          <Button variant="ghost" size="sm" className="rounded-full h-9 px-3 text-[10px] font-bold" onClick={() => setConfirmDeleteId(null)}>
                            Cancel
                          </Button>
                        </div>
                      ) : (
                        <Button variant="outline" size="icon" className="rounded-full text-destructive hover:bg-destructive hover:text-white transition-colors" onClick={() => setConfirmDeleteId(product.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'orders' && (
            <div className="space-y-6">
              <div className="bg-white p-4 rounded-2xl shadow-sm border mb-6 flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-black tracking-tight">Orders</h2>
                  <p className="text-xs text-muted-foreground uppercase tracking-widest">{orders.length} Total orders processed</p>
                </div>
                <Button variant="outline" className="rounded-full gap-2 h-10 px-6 font-bold" onClick={downloadOrders}>
                  <Download className="h-4 w-4" /> Export CSV
                </Button>
              </div>
              <div className="bg-white border rounded-2xl overflow-hidden shadow-xl">
                <table className="w-full text-sm">
                  <thead className="bg-secondary/30">
                    <tr>
                      <th className="p-5 text-left font-bold uppercase text-[10px] tracking-widest">Date</th>
                      <th className="p-5 text-left font-bold uppercase text-[10px] tracking-widest">Customer</th>
                      <th className="p-5 text-left font-bold uppercase text-[10px] tracking-widest">Product</th>
                      <th className="p-5 text-center font-bold uppercase text-[10px] tracking-widest">Qty</th>
                      <th className="p-5 text-right font-bold uppercase text-[10px] tracking-widest">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {orders.map(order => (
                      <tr key={order.id} className="hover:bg-secondary/5 transition-colors">
                        <td className="p-5 text-muted-foreground">{new Date(order.date).toLocaleDateString()}</td>
                        <td className="p-5">
                          <div className="font-bold">{order.customer_info.name}</div>
                          <div className="text-xs text-primary font-medium">{order.customer_info.phone}</div>
                          <div className="text-[10px] text-muted-foreground mt-1">{order.customer_info.address}</div>
                        </td>
                        <td className="p-5 font-medium">{order.product_name}</td>
                        <td className="p-5 text-center font-black text-primary">{order.quantity}</td>
                        <td className="p-5 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Badge variant="secondary" className="bg-green-100 text-green-700 border-none">Completed</Badge>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10" onClick={() => handleDeleteOrder(order.id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'stock' && (
            <div className="space-y-6">
              <div className="bg-white p-4 rounded-2xl shadow-sm border mb-6">
                <h2 className="text-2xl font-black tracking-tight">Stock History</h2>
                <p className="text-xs text-muted-foreground uppercase tracking-widest">Live movement logs</p>
              </div>
              <div className="space-y-3">
                {stockMovements.map(movement => (
                  <div key={movement.id} className="flex items-center justify-between p-5 border rounded-2xl bg-white hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-5">
                      <div className={cn(
                        "p-3 rounded-2xl shadow-sm",
                        movement.type === 'in' ? "bg-green-50 text-green-600 border border-green-100" : "bg-red-50 text-red-600 border border-red-100"
                      )}>
                        {movement.type === 'in' ? <ArrowDownRight className="h-5 w-5" /> : <ArrowUpRight className="h-5 w-5" />}
                      </div>
                      <div>
                        <div className="font-black text-lg leading-none mb-1">{movement.product_name}</div>
                        <div className="text-[10px] text-muted-foreground uppercase font-bold tracking-tighter">
                          {new Date(movement.date).toLocaleString()}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={cn(
                        "font-black text-2xl",
                        movement.type === 'in' ? "text-green-600" : "text-red-600"
                      )}>
                        {movement.type === 'in' ? '+' : '-'}{movement.quantity}
                      </div>
                      <div className="text-[8px] uppercase font-bold text-muted-foreground">Units</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'ledger' && (
            <div className="space-y-8 animate-in fade-in duration-500">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-[2rem] shadow-xl border border-primary/5">
                <div>
                  <h2 className="text-3xl font-black tracking-tighter">Financial Ledger</h2>
                  <p className="text-xs text-muted-foreground uppercase tracking-widest font-bold">Accounting & Record Keeping</p>
                </div>
                <div className="flex gap-3">
                  <Button variant="outline" className="rounded-full gap-2 h-11 px-6 font-bold" onClick={exportLedgerToPDF}>
                    <FileText className="h-4 w-4" /> PDF
                  </Button>
                  <Button variant="outline" className="rounded-full gap-2 h-11 px-6 font-bold" onClick={exportLedgerToExcel}>
                    <TableIcon className="h-4 w-4" /> Excel
                  </Button>
                </div>
              </div>

              {/* Ledger Sub-Tabs */}
              <div className="flex gap-2 p-1 bg-secondary/30 rounded-full w-fit">
                {(['summary', 'income', 'expenses', 'stock'] as const).map((tab) => (
                  <Button
                    key={tab}
                    variant={ledgerSubTab === tab ? 'default' : 'ghost'}
                    size="sm"
                    className={cn("rounded-full px-6 h-9 font-bold capitalize", ledgerSubTab === tab && "shadow-md")}
                    onClick={() => setLedgerSubTab(tab)}
                  >
                    {tab}
                  </Button>
                ))}
              </div>

              {ledgerSubTab === 'summary' && (
                <div className="space-y-8">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    <Card className="border-none bg-white shadow-xl hover:shadow-2xl transition-all duration-300 rounded-[2rem] overflow-hidden group">
                      <div className="h-1.5 bg-green-500 w-full" />
                      <CardHeader className="pb-2">
                        <CardTitle className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex justify-between items-center">
                          Total Income <Wallet className="h-4 w-4 text-green-500" />
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-3xl font-black text-green-600">{formatPrice(ledgerSummary?.totalIncome || 0)}</div>
                      </CardContent>
                    </Card>
                    <Card className="border-none bg-white shadow-xl hover:shadow-2xl transition-all duration-300 rounded-[2rem] overflow-hidden group">
                      <div className="h-1.5 bg-red-500 w-full" />
                      <CardHeader className="pb-2">
                        <CardTitle className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex justify-between items-center">
                          Total Expenses <Receipt className="h-4 w-4 text-red-500" />
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-3xl font-black text-red-600">{formatPrice(ledgerSummary?.totalExpenses || 0)}</div>
                      </CardContent>
                    </Card>
                    <Card className="border-none bg-white shadow-xl hover:shadow-2xl transition-all duration-300 rounded-[2rem] overflow-hidden group">
                      <div className="h-1.5 bg-primary w-full" />
                      <CardHeader className="pb-2">
                        <CardTitle className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex justify-between items-center">
                          Net Profit <TrendingUp className="h-4 w-4 text-primary" />
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-3xl font-black text-primary">{formatPrice(ledgerSummary?.profit || 0)}</div>
                      </CardContent>
                    </Card>
                    <Card className="border-none bg-white shadow-xl hover:shadow-2xl transition-all duration-300 rounded-[2rem] overflow-hidden group">
                      <div className="h-1.5 bg-blue-500 w-full" />
                      <CardHeader className="pb-2">
                        <CardTitle className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex justify-between items-center">
                          Stock Value <Package className="h-4 w-4 text-blue-500" />
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-3xl font-black text-blue-600">{formatPrice(ledgerSummary?.stockValue || 0)}</div>
                      </CardContent>
                    </Card>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <Card className="border-none shadow-xl rounded-[2.5rem] p-6 bg-white">
                      <CardHeader>
                        <CardTitle className="text-xl font-black tracking-tight">Income vs Expenses</CardTitle>
                        <CardDescription>Monthly financial performance</CardDescription>
                      </CardHeader>
                      <CardContent className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={[
                            { name: 'Income', amount: ledgerSummary?.totalIncome || 0, fill: '#10b981' },
                            { name: 'Expenses', amount: ledgerSummary?.totalExpenses || 0, fill: '#ef4444' }
                          ]}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                            <XAxis dataKey="name" axisLine={false} tickLine={false} />
                            <YAxis axisLine={false} tickLine={false} />
                            <Tooltip cursor={{ fill: '#f8f8f8' }} />
                            <Bar dataKey="amount" radius={[10, 10, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </CardContent>
                    </Card>

                    <Card className="border-none shadow-xl rounded-[2.5rem] p-6 bg-white">
                      <CardHeader>
                        <CardTitle className="text-xl font-black tracking-tight">Stock Distribution</CardTitle>
                        <CardDescription>Value by category</CardDescription>
                      </CardHeader>
                      <CardContent className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={products.reduce((acc: any[], p) => {
                                const cat = acc.find(a => a.name === p.category);
                                if (cat) cat.value += p.stock * p.cost_price;
                                else acc.push({ name: p.category, value: p.stock * p.cost_price });
                                return acc;
                              }, [])}
                              cx="50%"
                              cy="50%"
                              innerRadius={60}
                              outerRadius={100}
                              paddingAngle={5}
                              dataKey="value"
                            >
                              {['#c5a059', '#1a1a1a', '#4a4a4a', '#8a8a8a', '#d1d1d1'].map((color, index) => (
                                <Cell key={`cell-${index}`} fill={color} />
                              ))}
                            </Pie>
                            <Tooltip />
                          </PieChart>
                        </ResponsiveContainer>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              )}

              {ledgerSubTab === 'income' && (
                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <h3 className="text-xl font-black tracking-tight">Income Records</h3>
                    <Button onClick={() => setShowAddIncome(true)} className="rounded-full gap-2">
                      <Plus className="h-4 w-4" /> Add Income
                    </Button>
                  </div>

                  {showAddIncome && (
                    <Card className="border-primary/20 shadow-2xl rounded-[2rem] overflow-hidden">
                      <CardHeader className="bg-primary/5">
                        <CardTitle>Record New Income</CardTitle>
                      </CardHeader>
                      <CardContent className="p-6">
                        <form onSubmit={handleAddIncome} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <label className="text-xs font-bold uppercase text-muted-foreground">Source</label>
                            <select 
                              className="flex h-10 w-full rounded-xl border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                              value={newIncome.source}
                              onChange={e => setNewIncome({...newIncome, source: e.target.value})}
                            >
                              <option>Sale</option>
                              <option>Service</option>
                              <option>Investment</option>
                              <option>Other</option>
                            </select>
                          </div>
                          <div className="space-y-2">
                            <label className="text-xs font-bold uppercase text-muted-foreground">Amount (RWF)</label>
                            <Input type="number" required value={newIncome.amount} onChange={e => setNewIncome({...newIncome, amount: e.target.value})} />
                          </div>
                          <div className="md:col-span-2 space-y-2">
                            <label className="text-xs font-bold uppercase text-muted-foreground">Description</label>
                            <Input required value={newIncome.description} onChange={e => setNewIncome({...newIncome, description: e.target.value})} />
                          </div>
                          <div className="space-y-2">
                            <label className="text-xs font-bold uppercase text-muted-foreground">Date (Optional)</label>
                            <Input type="datetime-local" value={newIncome.date} onChange={e => setNewIncome({...newIncome, date: e.target.value})} />
                          </div>
                          <div className="md:col-span-2 flex gap-3 pt-4">
                            <Button type="submit" className="flex-1 rounded-full h-12">Save Income</Button>
                            <Button type="button" variant="outline" className="flex-1 rounded-full h-12" onClick={() => setShowAddIncome(false)}>Cancel</Button>
                          </div>
                        </form>
                      </CardContent>
                    </Card>
                  )}

                  <div className="bg-white border rounded-[2rem] overflow-hidden shadow-xl">
                    <table className="w-full text-sm">
                      <thead className="bg-secondary/30">
                        <tr>
                          <th className="p-5 text-left font-bold uppercase text-[10px] tracking-widest">Date</th>
                          <th className="p-5 text-left font-bold uppercase text-[10px] tracking-widest">Source</th>
                          <th className="p-5 text-left font-bold uppercase text-[10px] tracking-widest">Description</th>
                          <th className="p-5 text-right font-bold uppercase text-[10px] tracking-widest">Amount</th>
                          <th className="p-5 text-center font-bold uppercase text-[10px] tracking-widest">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {income.map(inc => (
                          <tr key={inc.id} className="hover:bg-secondary/5 transition-colors">
                            <td className="p-5 text-muted-foreground">{new Date(inc.date).toLocaleDateString()}</td>
                            <td className="p-5 font-bold">{inc.source}</td>
                            <td className="p-5">{inc.description}</td>
                            <td className="p-5 text-right font-black text-green-600">{formatPrice(inc.amount)}</td>
                            <td className="p-5 text-center">
                              <Button variant="ghost" size="icon" className="text-destructive rounded-full" onClick={() => handleDeleteIncome(inc.id)}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {ledgerSubTab === 'expenses' && (
                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <h3 className="text-xl font-black tracking-tight">Expense Records</h3>
                    <Button onClick={() => setShowAddExpense(true)} className="rounded-full gap-2">
                      <Plus className="h-4 w-4" /> Add Expense
                    </Button>
                  </div>

                  {showAddExpense && (
                    <Card className="border-primary/20 shadow-2xl rounded-[2rem] overflow-hidden">
                      <CardHeader className="bg-primary/5">
                        <CardTitle>Record New Expense</CardTitle>
                      </CardHeader>
                      <CardContent className="p-6">
                        <form onSubmit={handleAddExpense} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <label className="text-xs font-bold uppercase text-muted-foreground">Category</label>
                            <select 
                              className="flex h-10 w-full rounded-xl border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                              value={newExpense.category}
                              onChange={e => setNewExpense({...newExpense, category: e.target.value})}
                            >
                              <option>Transport</option>
                              <option>Purchase</option>
                              <option>Rent</option>
                              <option>Salaries</option>
                              <option>Marketing</option>
                              <option>Other</option>
                            </select>
                          </div>
                          <div className="space-y-2">
                            <label className="text-xs font-bold uppercase text-muted-foreground">Amount (RWF)</label>
                            <Input type="number" required value={newExpense.amount} onChange={e => setNewExpense({...newExpense, amount: e.target.value})} />
                          </div>
                          <div className="md:col-span-2 space-y-2">
                            <label className="text-xs font-bold uppercase text-muted-foreground">Description</label>
                            <Input required value={newExpense.description} onChange={e => setNewExpense({...newExpense, description: e.target.value})} />
                          </div>
                          <div className="space-y-2">
                            <label className="text-xs font-bold uppercase text-muted-foreground">Date (Optional)</label>
                            <Input type="datetime-local" value={newExpense.date} onChange={e => setNewExpense({...newExpense, date: e.target.value})} />
                          </div>
                          <div className="md:col-span-2 flex gap-3 pt-4">
                            <Button type="submit" className="flex-1 rounded-full h-12">Save Expense</Button>
                            <Button type="button" variant="outline" className="flex-1 rounded-full h-12" onClick={() => setShowAddExpense(false)}>Cancel</Button>
                          </div>
                        </form>
                      </CardContent>
                    </Card>
                  )}

                  <div className="bg-white border rounded-[2rem] overflow-hidden shadow-xl">
                    <table className="w-full text-sm">
                      <thead className="bg-secondary/30">
                        <tr>
                          <th className="p-5 text-left font-bold uppercase text-[10px] tracking-widest">Date</th>
                          <th className="p-5 text-left font-bold uppercase text-[10px] tracking-widest">Category</th>
                          <th className="p-5 text-left font-bold uppercase text-[10px] tracking-widest">Description</th>
                          <th className="p-5 text-right font-bold uppercase text-[10px] tracking-widest">Amount</th>
                          <th className="p-5 text-center font-bold uppercase text-[10px] tracking-widest">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {expenses.map(exp => (
                          <tr key={exp.id} className="hover:bg-secondary/5 transition-colors">
                            <td className="p-5 text-muted-foreground">{new Date(exp.date).toLocaleDateString()}</td>
                            <td className="p-5 font-bold">{exp.category}</td>
                            <td className="p-5">{exp.description}</td>
                            <td className="p-5 text-right font-black text-red-600">{formatPrice(exp.amount)}</td>
                            <td className="p-5 text-center">
                              <Button variant="ghost" size="icon" className="text-destructive rounded-full" onClick={() => handleDeleteExpense(exp.id)}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {ledgerSubTab === 'stock' && (
                <div className="space-y-6">
                  <div className="bg-white p-6 rounded-[2rem] shadow-xl border border-primary/5">
                    <h3 className="text-xl font-black tracking-tight mb-4">Stock Ledger</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="p-6 rounded-[2rem] bg-secondary/30 border border-primary/5">
                        <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Total Items</div>
                        <div className="text-3xl font-black">{products.reduce((acc, p) => acc + p.stock, 0)}</div>
                      </div>
                      <div className="p-6 rounded-[2rem] bg-secondary/30 border border-primary/5">
                        <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Stock Value (Cost)</div>
                        <div className="text-3xl font-black text-primary">{formatPrice(ledgerSummary?.stockValue || 0)}</div>
                      </div>
                      <div className="p-6 rounded-[2rem] bg-secondary/30 border border-primary/5">
                        <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Potential Revenue</div>
                        <div className="text-3xl font-black text-green-600">{formatPrice(ledgerSummary?.potentialRevenue || 0)}</div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white border rounded-[2rem] overflow-hidden shadow-xl">
                    <table className="w-full text-sm">
                      <thead className="bg-secondary/30">
                        <tr>
                          <th className="p-5 text-left font-bold uppercase text-[10px] tracking-widest">Product</th>
                          <th className="p-5 text-center font-bold uppercase text-[10px] tracking-widest">Stock</th>
                          <th className="p-5 text-right font-bold uppercase text-[10px] tracking-widest">Cost Price</th>
                          <th className="p-5 text-right font-bold uppercase text-[10px] tracking-widest">Selling Price</th>
                          <th className="p-5 text-right font-bold uppercase text-[10px] tracking-widest">Total Value</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {products.map(product => (
                          <tr key={product.id} className="hover:bg-secondary/5 transition-colors">
                            <td className="p-5 font-bold">{product.name}</td>
                            <td className="p-5 text-center font-black">{product.stock}</td>
                            <td className="p-5 text-right text-muted-foreground">{formatPrice(product.cost_price)}</td>
                            <td className="p-5 text-right text-primary font-medium">{formatPrice(product.price)}</td>
                            <td className="p-5 text-right font-black">{formatPrice(product.stock * product.cost_price)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
