"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

export default function ArticlesPage() {
  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Articles</h1>
          <p className="text-gray-500 mt-1">Processed articles from your content pipeline</p>
        </div>
        <Button variant="primary">Create Article</Button>
      </div>

      <Card padding="lg">
        <CardHeader>
          <CardTitle>Article Library</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500">Your processed articles will appear here.</p>
        </CardContent>
      </Card>
    </div>
  );
}
