"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { FileText, Plus } from "lucide-react";

export default function ArticlesPage() {
  return (
    <AppShell>
      <PageHeader
        title="Articles"
        subtitle="Processed articles from your content pipeline"
        actions={
          <Button size="sm">
            <Plus className="w-4 h-4" />
            Create Article
          </Button>
        }
      />

      <Card padding="lg">
        <CardHeader>
          <CardTitle>Article Library</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
            <FileText className="w-12 h-12 text-gray-300 mb-4" />
            <p className="text-gray-500">Your processed articles will appear here.</p>
          </div>
        </CardContent>
      </Card>
    </AppShell>
  );
}
