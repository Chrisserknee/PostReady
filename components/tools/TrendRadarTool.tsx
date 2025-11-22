"use client";

import React, { useState, useEffect } from 'react';
import { SelectField } from "@/components/SelectField";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface Trend {
  title: string;
  description: string;
  engagementLevel: string;
  reachPotential: string;
}

export function TrendRadarTool() {
  const [category, setCategory] = useState("General");
  const [trends, setTrends] = useState<Trend[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchTrends = async (selectedCategory: string) => {
    setIsLoading(true);
    setError("");
    
    try {
      const response = await fetch('/api/trends', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ category: selectedCategory })
      });

      if (!response.ok) {
        throw new Error('Failed to fetch trends');
      }

      const data = await response.json();
      setTrends(data.trends || []);
    } catch (err: any) {
      console.error('Trend fetch error:', err);
      setError(err.message || 'Failed to load trends. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Initial fetch
    fetchTrends("General");
  }, []);

  const handleRefresh = () => {
    fetchTrends(category);
  };

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>Real-Time Trend Monitor</CardTitle>
          <CardDescription>Discover what's going viral right now in your niche.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 items-end">
            <div className="flex-1 w-full">
              <SelectField
                label="Category / Niche"
                value={category}
                onChange={(val) => {
                  setCategory(val);
                  fetchTrends(val);
                }}
                options={[
                  "General",
                  "Technology",
                  "Fashion & Beauty",
                  "Health & Fitness",
                  "Food & Cooking",
                  "Business & Finance",
                  "Gaming",
                  "Travel",
                  "Entertainment"
                ]}
                required
              />
            </div>
            <Button 
              onClick={handleRefresh}
              disabled={isLoading}
              className="w-full sm:w-auto py-6 font-bold"
              size="lg"
            >
              {isLoading ? (
                <>
                  <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-b-transparent"></span>
                  Scanning...
                </>
              ) : (
                "🔄 Refresh Trends"
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {error && (
        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-6 md:grid-cols-2 animate-fade-in">
        {isLoading ? (
          [1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardContent className="p-6 space-y-4">
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
                <div className="flex gap-2 mt-4">
                  <Skeleton className="h-6 w-20 rounded-full" />
                  <Skeleton className="h-6 w-20 rounded-full" />
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          trends.map((trend, index) => (
            <Card key={index} className="border-2 hover:border-primary/50 transition-all hover:scale-[1.02]">
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-3">
                  <Badge variant={
                    trend.engagementLevel.includes('Hot') || trend.engagementLevel.includes('🔥') ? 'destructive' : 
                    trend.engagementLevel.includes('Rising') || trend.engagementLevel.includes('📈') ? 'default' : 'secondary'
                  }>
                    {trend.engagementLevel}
                  </Badge>
                  <span className="text-sm font-bold text-emerald-500">
                    {trend.reachPotential} Potential
                  </span>
                </div>
                
                <h3 className="text-xl font-bold mb-2">{trend.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {trend.description}
                </p>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}


