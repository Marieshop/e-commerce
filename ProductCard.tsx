import React from 'react';
import { Product } from './types';
import { Card, CardContent, CardFooter } from './Card';
import { Button } from './Button';
import { Badge } from './Badge';
import { formatPrice } from './utils';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { ShoppingCart, ArrowRight } from 'lucide-react';

interface ProductCardProps {
  product: Product;
  key?: React.Key;
}

export function ProductCard({ product }: ProductCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -10 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="group overflow-hidden border-none bg-white shadow-lg hover:shadow-2xl transition-all duration-500 rounded-[2rem] h-full flex flex-col">
        <Link to={`/product/${product.id}`} className="block relative aspect-[4/5] overflow-hidden">
          <img 
            src={product.images && product.images.length > 0 ? product.images[0] : 'https://picsum.photos/seed/bag/800/1000'} 
            alt={product.name}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-500" />
          
          <div className="absolute top-4 left-4">
            <Badge className="bg-white/90 text-black border-none backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest shadow-sm">
              {product.category}
            </Badge>
          </div>
          
          {product.stock === 0 && (
            <div className="absolute inset-0 bg-background/60 backdrop-blur-[2px] flex items-center justify-center">
              <Badge variant="destructive" className="text-lg px-6 py-2 rounded-full shadow-xl">Out of Stock</Badge>
            </div>
          )}

          <div className="absolute bottom-4 right-4 translate-y-12 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500">
            <Button size="icon" className="rounded-full h-12 w-12 shadow-xl bg-primary text-white">
              <ShoppingCart className="h-5 w-5" />
            </Button>
          </div>
        </Link>
        
        <CardContent className="p-6 flex-grow">
          <Link to={`/product/${product.id}`}>
            <h3 className="text-xl font-black tracking-tight mb-2 group-hover:text-primary transition-colors line-clamp-1">
              {product.name}
            </h3>
          </Link>
          <div className="flex items-center justify-between">
            <span className="text-2xl font-black text-primary">
              {formatPrice(product.price)}
            </span>
            <div className="flex items-center gap-1 text-[10px] font-bold text-muted-foreground uppercase tracking-tighter">
              <div className={`w-2 h-2 rounded-full ${product.stock > 0 ? 'bg-green-500' : 'bg-red-500'}`} />
              {product.stock} in stock
            </div>
          </div>
        </CardContent>
        
        <CardFooter className="px-6 pb-6 pt-0">
          <Button asChild variant="secondary" className="w-full rounded-full h-12 font-bold group/btn bg-secondary hover:bg-primary hover:text-white transition-all">
            <Link to={`/product/${product.id}`} className="flex items-center justify-center gap-2">
              View Details 
              <ArrowRight className="h-4 w-4 transition-transform group-hover/btn:translate-x-1" />
            </Link>
          </Button>
        </CardFooter>
      </Card>
    </motion.div>
  );
}
