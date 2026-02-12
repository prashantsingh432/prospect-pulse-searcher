import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Smartphone, AlertTriangle, XCircle, Activity, Shield, Ban } from "lucide-react";

interface SimDashboardProps {
  stats: {
    total: number;
    active: number;
    spam: number;
    deactivated: number;
    inactive: number;
    highRisk: number;
  };
}

export const SimDashboard: React.FC<SimDashboardProps> = ({ stats }) => {
  const cards = [
    { label: "Total SIMs", value: stats.total, icon: Smartphone, color: "text-blue-600", bg: "bg-blue-50" },
    { label: "Active", value: stats.active, icon: Activity, color: "text-green-600", bg: "bg-green-50" },
    { label: "Spam", value: stats.spam, icon: AlertTriangle, color: "text-amber-600", bg: "bg-amber-50" },
    { label: "Deactivated", value: stats.deactivated, icon: XCircle, color: "text-red-600", bg: "bg-red-50" },
    { label: "Not in Used", value: stats.inactive, icon: Ban, color: "text-gray-600", bg: "bg-gray-50" },
    { label: "High Risk", value: stats.highRisk, icon: Shield, color: "text-purple-600", bg: "bg-purple-50" },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
      {cards.map((c) => (
        <Card key={c.label} className="border-none shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">{c.label}</CardTitle>
            <div className={`p-2 rounded-lg ${c.bg}`}>
              <c.icon className={`h-4 w-4 ${c.color}`} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{c.value}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
