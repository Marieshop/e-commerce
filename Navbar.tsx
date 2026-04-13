import { Link } from 'react-router-dom';
import { ShoppingBag, Menu, X, User } from 'lucide-react';
import { useState } from 'react';
import { Button } from './Button';

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2 font-bold text-xl">
          <ShoppingBag className="h-6 w-6 text-primary" />
          <span>BagStore Rwanda</span>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-6">
          <Link to="/" className="text-sm font-medium hover:text-primary">Home</Link>
          <Link to="/admin" className="text-sm font-medium hover:text-primary">Admin</Link>
          <Button variant="outline" size="sm" className="gap-2">
            <User className="h-4 w-4" />
            Login
          </Button>
        </div>

        {/* Mobile Nav Toggle */}
        <button className="md:hidden" onClick={() => setIsOpen(!isOpen)}>
          {isOpen ? <X /> : <Menu />}
        </button>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden border-t p-4 space-y-4 bg-background">
          <Link to="/" className="block text-sm font-medium" onClick={() => setIsOpen(false)}>Home</Link>
          <Link to="/admin" className="block text-sm font-medium" onClick={() => setIsOpen(false)}>Admin</Link>
          <Button variant="outline" size="sm" className="w-full gap-2">
            <User className="h-4 w-4" />
            Login
          </Button>
        </div>
      )}
    </nav>
  );
}
