"use client";

import React, { useEffect, useState } from 'react';
import { ToolPageLayout } from '@/components/layouts/ToolPageLayout';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/contexts/AuthContext';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface DigitalProduct {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  price: number;
  original_price?: number;
  badge_text?: string;
  badge_color?: string;
  image_url: string;
  file_url: string;
  is_active: boolean;
}

export default function DigitalProductsPage() {
  const { user } = useAuth();
  const [products, setProducts] = useState<DigitalProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [purchasingId, setPurchasingId] = useState<string | null>(null);

  useEffect(() => {
    const loadProducts = async () => {
      try {
        const { data, error } = await supabase
          .from('digital_products')
          .select('*')
          .eq('is_active', true)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setProducts(data || []);
      } catch (err: any) {
        console.error('Error loading products:', err);
        setError("Failed to load digital products. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    loadProducts();
  }, []);

  const handlePurchase = async (product: DigitalProduct) => {
    setPurchasingId(product.id);
    try {
      const response = await fetch('/api/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: product.id,
          userId: user?.id,
          userEmail: user?.email
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to initiate checkout');
      }

      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error('No checkout URL received');
      }
    } catch (err: any) {
      console.error('Purchase error:', err);
      alert(err.message || "Failed to start purchase process.");
      setPurchasingId(null);
    }
  };

  return (
    <ToolPageLayout
      title="Premium Collection"
      description="Browse and access premium digital products and resources to skyrocket your growth."
      icon="💎"
    >
      <div className="min-h-[400px]">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="overflow-hidden">
                <Skeleton className="h-48 w-full" />
                <CardHeader>
                  <Skeleton className="h-6 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-1/2" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-4 w-2/3" />
                </CardContent>
                <CardFooter>
                  <Skeleton className="h-10 w-full" />
                </CardFooter>
              </Card>
            ))}
          </div>
        ) : error ? (
          <Alert variant="destructive">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : products.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">📚</div>
            <h3 className="text-xl font-bold mb-2">No products available yet</h3>
            <p className="text-muted-foreground mb-6">
              Check back soon for our latest guides and resources.
            </p>
            {/* Fallback/Hardcoded content if DB is empty, based on user request */}
            <div className="mt-8 p-6 border-2 border-dashed rounded-xl max-w-md mx-auto bg-muted/30">
              <p className="text-sm text-muted-foreground">
                Admin Note: Add products to the <code>digital_products</code> table in Supabase to see them listed here.
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map((product) => (
              <Card key={product.id} className="overflow-hidden flex flex-col h-full hover:shadow-lg transition-shadow duration-300">
                <div className="relative h-48 bg-muted">
                  {product.image_url ? (
                    <img 
                      src={product.image_url} 
                      alt={product.title} 
                      className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-secondary/10 text-secondary">
                      <span className="text-4xl">📘</span>
                    </div>
                  )}
                  {product.badge_text && (
                    <Badge 
                      className="absolute top-3 right-3 font-bold shadow-md"
                      style={{ backgroundColor: product.badge_color || '#A855F7' }}
                    >
                      {product.badge_text}
                    </Badge>
                  )}
                </div>
                
                <CardHeader>
                  <CardTitle className="line-clamp-1" title={product.title}>{product.title}</CardTitle>
                  {product.subtitle && (
                    <CardDescription className="line-clamp-1">{product.subtitle}</CardDescription>
                  )}
                </CardHeader>
                
                <CardContent className="flex-grow">
                  <p className="text-sm text-muted-foreground line-clamp-3 mb-4">
                    {product.description}
                  </p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold text-primary">
                      ${product.price}
                    </span>
                    {product.original_price && product.original_price > product.price && (
                      <span className="text-sm text-muted-foreground line-through">
                        ${product.original_price}
                      </span>
                    )}
                  </div>
                </CardContent>
                
                <CardFooter>
                  <Button 
                    className="w-full font-bold" 
                    size="lg"
                    onClick={() => handlePurchase(product)}
                    disabled={!!purchasingId}
                  >
                    {purchasingId === product.id ? (
                      <>
                        <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-b-transparent"></span>
                        Processing...
                      </>
                    ) : (
                      "Buy Now"
                    )}
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>
    </ToolPageLayout>
  );
}
