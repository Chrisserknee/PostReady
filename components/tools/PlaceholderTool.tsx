import React from 'react';
import { CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from 'next/link';

interface PlaceholderToolProps {
  name: string;
  description: string;
}

export function PlaceholderTool({ name, description }: PlaceholderToolProps) {
  return (
    <CardContent className="p-12 flex flex-col items-center justify-center text-center space-y-6">
      <div className="bg-primary/10 p-6 rounded-full">
        <span className="text-4xl">🚧</span>
      </div>
      <div className="space-y-2">
        <h2 className="text-2xl font-bold">{name}</h2>
        <p className="text-muted-foreground max-w-md mx-auto">
          {description}
        </p>
        <p className="text-sm text-muted-foreground mt-4">
          This tool is currently being updated with our new design system. check back soon!
        </p>
      </div>
      <Link href="/">
        <Button variant="outline">Back to Home</Button>
      </Link>
    </CardContent>
  );
}

