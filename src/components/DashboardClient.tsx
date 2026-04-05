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
import { RSUTracker } from "@/components/dashboard/RSUTracker";
import { InsuranceTracker } from "@/components/dashboard/InsuranceTracker";
import { EducationSavings } from "@/components/dashboard/EducationSavings";
import { IncomeHistory } from "@/components/dashboard/IncomeHistory";

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
          <div className="flex items-center justify-between">
            <TabsList className="grid w-full max-w-3xl grid-cols-6">
              <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
              <TabsTrigger value="income-history">Income</TabsTrigger>
              <TabsTrigger value="rsu">RSU</TabsTrigger>
              <TabsTrigger value="insurance">Insurance</TabsTrigger>
              <TabsTrigger value="education">Education</TabsTrigger>
              <TabsTrigger value="manage">Manage</TabsTrigger>
            </TabsList>
            {data.lastSaved && (
              <span className="text-[10px] text-muted-foreground hidden sm:block">
                Saved {new Date(data.lastSaved).toLocaleTimeString()}
              </span>
            )}
          </div>

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

          <TabsContent value="income-history">
            <IncomeHistory data={data} />
          </TabsContent>

          <TabsContent value="rsu">
            <RSUTracker data={data} />
          </TabsContent>

          <TabsContent value="insurance">
            <InsuranceTracker data={data} />
          </TabsContent>

          <TabsContent value="education">
            <EducationSavings data={data} />
          </TabsContent>

          <TabsContent value="manage">
            <DataManager data={data} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
