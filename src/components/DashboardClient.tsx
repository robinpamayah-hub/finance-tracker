"use client";

import { useAuth } from "@/lib/auth";
import { useFinanceData } from "@/lib/storage";
import { LoginPage } from "@/components/LoginPage";
import { Header } from "@/components/layout/Header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SummaryCards } from "@/components/dashboard/SummaryCards";
import { CashFlowChart } from "@/components/dashboard/CashFlowChart";
import { ExpenseBreakdown } from "@/components/dashboard/ExpenseBreakdown";
import { BudgetAnalysis } from "@/components/dashboard/BudgetAnalysis";
import { BillCalendar } from "@/components/dashboard/BillCalendar";
import { DebtCards } from "@/components/dashboard/DebtCards";
import { DataManager } from "@/components/manage/DataManager";
import { FinancialAlerts } from "@/components/dashboard/FinancialAlerts";

export function DashboardClient() {
  const auth = useAuth();
  const data = useFinanceData();

  if (!auth.isLoaded) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!auth.isAuthenticated) {
    return (
      <LoginPage
        isSetup={auth.isSetup}
        error={auth.error}
        onLogin={auth.login}
        onCreatePassword={auth.createPassword}
      />
    );
  }

  if (!data.isLoaded) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header onLogout={auth.logout} />
      <main className="container mx-auto px-4 py-6">
        <Tabs defaultValue="dashboard" className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="manage">Manage Data</TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-6">
            <FinancialAlerts summary={data.summary} calendarEntries={data.calendarEntries} />
            <SummaryCards summary={data.summary} />
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <CashFlowChart summary={data.summary} />
              <ExpenseBreakdown summary={data.summary} />
              <BudgetAnalysis
                budgetBreakdown={data.budgetBreakdown}
                totalIncome={data.summary.totalMonthlyIncome}
              />
              <BillCalendar entries={data.calendarEntries} />
            </div>
            <DebtCards
              creditCards={data.creditCards}
              affirmPlans={data.affirmPlans}
              onUpdateCreditCard={data.updateCreditCard}
              onUpdateAffirmPlan={data.updateAffirmPlan}
            />
          </TabsContent>

          <TabsContent value="manage">
            <DataManager data={data} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
