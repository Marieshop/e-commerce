/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import  Navbar from "./Navbar";
import  {WhatsAppButton}  from 'WhatsAppButton';
import  {HomePage}  from 'HomePage';
import {ProductPage}  from 'ProductPage';
import {AdminDashboard}  from 'AdminDashboard';
import { Toaster } from 'sonner';

export default function App() {
  return (
    <Router>
      <div className="min-h-screen bg-background font-sans antialiased">
        <Navbar />
        <main className="pb-20">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/product/:id" element={<ProductPage />} />
            <Route path="/admin" element={<AdminDashboard />} />
          </Routes>
        </main>
        <WhatsAppButton />
        <Toaster position="top-center" richColors />
      </div>
    </Router>
  );
}

