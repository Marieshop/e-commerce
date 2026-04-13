import { useEffect, useState } from 'react';
import  Product  from './types';
import  {api}  from "./api";
import  {ProductCard}  from './ProductCard';
import  {CategoryFilter}  from './CategoryFilter';
import  {Input}  from './Input';
import  {Button}  from './Button';
import { Search, ShoppingBag } from 'lucide-react';

export function HomePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProducts();
  }, []);

  useEffect(() => {
    let result = products;
    
    if (selectedCategory !== 'All') {
      result = result.filter(p => p.category === selectedCategory);
    }
    
    if (searchQuery) {
      result = result.filter(p => 
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    setFilteredProducts(result);
  }, [selectedCategory, searchQuery, products]);

  async function loadProducts() {
    try {
      const data = await api.products.getAll();
      setProducts(data);
      setFilteredProducts(data);
    } catch (error) {
      console.error('Failed to load products:', error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative h-[60vh] flex items-center justify-center overflow-hidden bg-black text-white mb-12">
        <div className="absolute inset-0 z-0">
          <img 
            src="https://picsum.photos/seed/luxury-bag/1920/1080?blur=2" 
            className="w-full h-full object-cover opacity-50"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent" />
        </div>
        
        <div className="container mx-auto px-4 relative z-10 text-center">
          <h1 className="text-5xl md:text-8xl font-black tracking-tighter mb-6 animate-in fade-in slide-in-from-bottom-8 duration-1000">
            BAGSTORE <span className="text-primary italic">RWANDA</span>
          </h1>
          <p className="text-xl md:text-2xl text-white/80 max-w-2xl mx-auto font-light tracking-wide mb-8 animate-in fade-in slide-in-from-bottom-12 duration-1000 delay-200">
            Elevate your style with our curated collection of premium bags for every occasion.
          </p>
          <div className="flex justify-center gap-4 animate-in fade-in slide-in-from-bottom-16 duration-1000 delay-500">
            <Button size="lg" className="rounded-full px-8 h-14 text-lg font-bold shadow-2xl shadow-primary/40">
              Shop Collection
            </Button>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4 pb-20">
        <div className="flex flex-col md:flex-row gap-6 items-center justify-between mb-12">
          <div>
            <h2 className="text-3xl font-black tracking-tight mb-2">OUR COLLECTION</h2>
            <div className="h-1 w-20 bg-primary rounded-full" />
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
            <CategoryFilter 
              selectedCategory={selectedCategory} 
              onSelect={setSelectedCategory} 
            />
            
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search bags..." 
                className="pl-10 h-11 rounded-full border-primary/20 focus:ring-primary"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-[450px] rounded-3xl bg-muted animate-pulse" />
            ))}
          </div>
        ) : filteredProducts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {filteredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="text-center py-32 bg-secondary/30 rounded-[3rem] border-2 border-dashed border-primary/10">
            <ShoppingBag className="h-20 w-20 mx-auto text-primary mb-6 opacity-20" />
            <h3 className="text-2xl font-bold mb-2">No bags found</h3>
            <p className="text-muted-foreground">Try adjusting your search or category filter.</p>
          </div>
        )}
      </div>
    </div>
  );
}
