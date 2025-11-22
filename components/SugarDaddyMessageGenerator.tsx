import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { SugarDaddyMessageGeneratorTool } from "@/components/tools/SugarDaddyMessageGeneratorTool";

export function SugarDaddyMessageGenerator() {
  return (
    <Card className="w-full border-2 shadow-md animate-fade-in">
      <CardHeader>
        <div className="flex items-center gap-3">
          <span className="text-3xl">💸</span>
          <div>
            <CardTitle className="text-2xl font-bold">Sugar Daddy Message Generator</CardTitle>
            <CardDescription>
              Generate persuasive messages for requesting financial support tailored to your situation and relationship dynamic.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <SugarDaddyMessageGeneratorTool />
    </Card>
  );
}
