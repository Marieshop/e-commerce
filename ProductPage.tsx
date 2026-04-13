import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Product } from './types';
import { api } from './api';
import { Button } from './Button';
import { Badge } from './Badge';
import { Input } from './Input';
import { formatPrice, cn } from './utils';
import { ChevronLeft, ShoppingCart, Truck, ShieldCheck, ArrowRight, Copy, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';

export function ProductPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [showOrderForm, setShowOrderForm] = useState(false);
  const [orderData, setOrderData] = useState({
    name: '',
    phone: '',
    address: '',
    quantity: 1
  });
  const [copied, setCopied] = useState(false);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success('Number copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  useEffect(() => {
    if (id) loadProduct(parseInt(id));
  }, [id]);

  async function loadProduct(productId: number) {
    try {
      const data = await api.products.getOne(productId);
      setProduct(data);
    } catch (error) {
      console.error('Failed to load product:', error);
      toast.error('Product not found');
      navigate('/');
    } finally {
      setLoading(false);
    }
  }

  async function handleOrder(e: React.FormEvent) {
    e.preventDefault();
    if (!product) return;

    try {
      await api.orders.create({
        product_id: product.id,
        quantity: orderData.quantity,
        customer_info: {
          name: orderData.name,
          phone: orderData.phone,
          address: orderData.address
        }
      });
      toast.success('Order placed successfully! We will contact you soon.');
      setShowOrderForm(false);
      loadProduct(product.id); // Refresh stock
    } catch (error: any) {
      toast.error(error.message || 'Failed to place order');
    }
  }

  if (loading) return <div className="container mx-auto p-8 text-center">Loading...</div>;
  if (!product) return null;

  return (
    <div className="container mx-auto px-4 py-12">
      <Button variant="ghost" onClick={() => navigate(-1)} className="mb-8 gap-2 hover:bg-primary/10 rounded-full">
        <ChevronLeft className="h-4 w-4" /> Back to Collection
      </Button>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
        {/* Images Section */}
        <div className="space-y-6">
          <div className="aspect-[4/5] rounded-[3rem] overflow-hidden bg-secondary shadow-2xl border-none">
            <AnimatePresence mode="wait">
              <motion.img
                key={selectedImage}
                initial={{ opacity: 0, scale: 1.1 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.5 }}
                src={product.images[selectedImage]}
                alt={product.name}
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </AnimatePresence>
          </div>
          <div className="flex gap-4 overflow-x-auto pb-4 px-2">
            {product.images.map((img, i) => (
              <button
                key={i}
                onClick={() => setSelectedImage(i)}
                className={cn(
                  "relative h-24 w-24 rounded-2xl overflow-hidden border-2 transition-all shrink-0",
                  selectedImage === i ? "border-primary shadow-xl scale-105" : "border-transparent opacity-50 hover:opacity-100"
                )}
              >
                <img src={img} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              </button>
            ))}
          </div>
        </div>

        {/* Details Section */}
        <div className="flex flex-col justify-center">
          <div className="mb-6">
            <Badge className="bg-primary/10 text-primary border-none px-4 py-1 rounded-full text-xs font-bold uppercase tracking-widest mb-4">
              {product.category}
            </Badge>
            <h1 className="text-5xl md:text-6xl font-black tracking-tighter mb-4 leading-tight">
              {product.name}
            </h1>
            <div className="text-4xl font-black text-primary mb-8">
              {formatPrice(product.price)}
            </div>
          </div>
          
          <div className="prose prose-stone mb-10">
            <p className="text-muted-foreground text-xl leading-relaxed font-light">
              {product.description}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-12">
            <div className="flex flex-col items-center text-center p-6 rounded-[2rem] bg-secondary/50 border border-primary/5">
              <Truck className="h-6 w-6 text-primary mb-2" />
              <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Delivery</div>
              <div className="text-xs font-bold">Fast & Secure</div>
            </div>
            <div className="flex flex-col items-center text-center p-6 rounded-[2rem] bg-secondary/50 border border-primary/5">
              <ShieldCheck className="h-6 w-6 text-primary mb-2" />
              <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Quality</div>
              <div className="text-xs font-bold">Premium Grade</div>
            </div>
            <div className="flex flex-col items-center text-center p-6 rounded-[2rem] bg-secondary/50 border border-primary/5">
              <ShoppingCart className="h-6 w-6 text-primary mb-2" />
              <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Availability</div>
              <div className="text-xs font-bold">{product.stock} in Stock</div>
            </div>
          </div>

          <div className="mb-8 p-6 rounded-[2rem] bg-primary/5 border border-primary/10">
            <h4 className="text-xs font-bold uppercase tracking-widest text-primary mb-3">Payment Details</h4>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Momo Number:</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-black">0782541992</span>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 rounded-full hover:bg-primary/10" 
                    onClick={() => copyToClipboard('0782541992')}
                  >
                    {copied ? <Check className="h-3 w-3 text-green-600" /> : <Copy className="h-3 w-3 text-primary" />}
                  </Button>
                </div>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Account Name:</span>
                <span className="text-sm font-black">NYIRANSHIMIYIMANA Marie Jeanne</span>
              </div>
            </div>
          </div>

          {!showOrderForm ? (
            <Button 
              size="lg" 
              className="w-full h-16 text-xl font-black gap-3 rounded-full shadow-2xl shadow-primary/30 transition-transform hover:scale-[1.02] active:scale-[0.98]"
              disabled={product.stock === 0}
              onClick={() => setShowOrderForm(true)}
            >
              {product.stock > 0 ? (
                <>Reserve Now <ArrowRight className="h-6 w-6" /></>
              ) : (
                'Currently Out of Stock'
              )}
            </Button>
          ) : (
            <motion.form 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              onSubmit={handleOrder} 
              className="space-y-6 p-8 border-none rounded-[3rem] bg-white shadow-2xl relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-2 bg-primary" />
              <h3 className="font-black text-2xl mb-6 tracking-tight">Complete Your Order</h3>
              
              <div className="p-4 bg-primary/5 rounded-2xl border border-primary/10 mb-6">
                <div className="text-[10px] font-bold uppercase tracking-widest text-primary mb-2">Payment Information</div>
                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-muted-foreground">Momo Number:</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-black text-primary">0782541992</span>
                      <Button 
                        type="button"
                        variant="ghost" 
                        size="icon" 
                        className="h-6 w-6 rounded-full hover:bg-primary/20" 
                        onClick={() => copyToClipboard('0782541992')}
                      >
                        {copied ? <Check className="h-3 w-3 text-green-600" /> : <Copy className="h-3 w-3 text-primary" />}
                      </Button>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-muted-foreground">Name:</span>
                    <span className="text-sm font-black text-primary">NYIRANSHIMIYIMANA Marie Jeanne</span>
                  </div>
                </div>
                <p className="text-[10px] text-muted-foreground mt-3 italic">
                  * Please pay before or upon delivery as agreed.
                </p>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Full Name</label>
                  <Input 
                    required 
                    placeholder="Enter your name"
                    className="h-12 rounded-2xl border-primary/10 focus:ring-primary"
                    value={orderData.name}
                    onChange={e => setOrderData({...orderData, name: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Phone Number</label>
                  <Input 
                    required 
                    placeholder="078..."
                    className="h-12 rounded-2xl border-primary/10 focus:ring-primary"
                    value={orderData.phone}
                    onChange={e => setOrderData({...orderData, phone: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Delivery Address</label>
                  <Input 
                    required 
                    placeholder="Where should we deliver?"
                    className="h-12 rounded-2xl border-primary/10 focus:ring-primary"
                    value={orderData.address}
                    onChange={e => setOrderData({...orderData, address: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Quantity</label>
                  <Input 
                    type="number" 
                    min="1" 
                    max={product.stock}
                    required 
                    className="h-12 rounded-2xl border-primary/10 focus:ring-primary"
                    value={orderData.quantity}
                    onChange={e => setOrderData({...orderData, quantity: parseInt(e.target.value)})}
                  />
                </div>
              </div>
              <div className="flex gap-4 pt-6">
                <Button type="button" variant="ghost" className="flex-1 h-14 rounded-full font-bold" onClick={() => setShowOrderForm(false)}>
                  Cancel
                </Button>
                <Button type="submit" className="flex-1 h-14 rounded-full font-black shadow-xl shadow-primary/20">
                  Place Order
                </Button>
              </div>
            </motion.form>
          )}
        </div>
      </div>
    </div>
  );
}
