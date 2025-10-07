"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ArrowUpRight,
  ArrowDownLeft,
  Clock,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { getTransactionHistory } from "@/lib/action";
import type { Transaction } from "@/lib/types/transaction";
import { useInvestorSafe } from "@/context/InvestorContext";
import { useBusinessSafe } from "@/context/BusinessContext";
import { useAuth } from "@/lib/auth";

export function TransactionHistory() {
  const { user: authUser } = useAuth();
  const investorContext = useInvestorSafe();
  const businessContext = useBusinessSafe();

  // Determine which context to use
  let cachedTransactions: Transaction[] = [];
  if (authUser?.role === "investor" && investorContext) {
    cachedTransactions = investorContext.transactions;
  } else if (authUser?.role === "business" && businessContext) {
    cachedTransactions = businessContext.transactions;
  }

  const [transactions, setTransactions] =
    useState<Transaction[]>(cachedTransactions);
  const [loading, setLoading] = useState(!cachedTransactions.length);

  // Update when cached data changes
  useEffect(() => {
    console.log(
      "[TransactionHistory] Using CACHED data:",
      cachedTransactions.length,
      "transactions"
    );
    setTransactions(cachedTransactions);
    if (cachedTransactions.length > 0) {
      setLoading(false);
    }
  }, [cachedTransactions]);

  // Fallback: Load directly if no cached data
  useEffect(() => {
    if (!cachedTransactions.length && authUser) {
      loadTransactions();
    }
  }, []);

  const loadTransactions = async () => {
    setLoading(true);
    try {
      console.log("[TransactionHistory] Fetching from database (fallback)");
      const result = await getTransactionHistory();
      if (result.success && result.data) {
        setTransactions(result.data);
      }
    } catch (error) {
      console.error("Error loading transactions:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "pending":
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case "failed":
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return null;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return (
          <Badge variant="default" className="bg-green-500">
            Completed
          </Badge>
        );
      case "pending":
        return (
          <Badge variant="default" className="bg-yellow-500">
            Pending
          </Badge>
        );
      case "failed":
        return <Badge variant="destructive">Failed</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <Card className="border-border">
        <CardHeader>
          <CardTitle>Transaction History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            Loading transactions...
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border">
      <CardHeader>
        <CardTitle>Transaction History</CardTitle>
      </CardHeader>
      <CardContent>
        {transactions.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No transactions yet
          </div>
        ) : (
          <div className="space-y-2">
            {transactions.map((transaction) => (
              <div
                key={transaction.id}
                className="flex items-center justify-between p-3 border border-border rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`p-2 rounded-full ${
                      transaction.type === "deposit"
                        ? "bg-green-500/10"
                        : "bg-blue-500/10"
                    }`}
                  >
                    {transaction.type === "deposit" ? (
                      <ArrowDownLeft className="h-4 w-4 text-green-500" />
                    ) : (
                      <ArrowUpRight className="h-4 w-4 text-blue-500" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-foreground capitalize">
                        {transaction.type}
                      </p>
                      {getStatusIcon(transaction.status)}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {formatDate(transaction.created_at)} •{" "}
                      {transaction.payment_method === "card"
                        ? "Card"
                        : "Bank Transfer"}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p
                    className={`font-semibold ${
                      transaction.type === "deposit"
                        ? "text-green-600"
                        : "text-blue-600"
                    }`}
                  >
                    {transaction.type === "deposit" ? "+" : "-"}£
                    {Number(transaction.amount).toFixed(2)}
                  </p>
                  <div className="mt-1">
                    {getStatusBadge(transaction.status)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
