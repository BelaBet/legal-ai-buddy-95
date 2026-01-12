import { useState } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { StatsCards } from "@/components/dashboard/StatsCards";
import { RecentDocuments } from "@/components/dashboard/RecentDocuments";
import { UpcomingDeadlines } from "@/components/dashboard/UpcomingDeadlines";
import { QuickActions } from "@/components/dashboard/QuickActions";
import { AIChat } from "@/components/assistant/AIChat";
import { PDFReader } from "@/components/pdf/PDFReader";
import { DocumentCreator } from "@/components/documents/DocumentCreator";
import { CasesManager } from "@/components/cases/CasesManager";
import { CalendarView } from "@/components/calendar/CalendarView";
import { ProfilePage } from "@/components/profile/ProfilePage";
import { FeatureRequestForm } from "@/components/features/FeatureRequestForm";
import { IntegrationsPage } from "@/pages/Integrations";
import { AdminUsersPage } from "@/components/admin/AdminUsersPage";
import { SettingsPage } from "@/components/settings/SettingsPage";
import { useAuth } from "@/contexts/AuthContext";

const Index = () => {
  const [activeTab, setActiveTab] = useState("dashboard");
  const { profile } = useAuth();

  const renderContent = () => {
    switch (activeTab) {
      case "dashboard":
        return (
          <div className="space-y-6">
            <div>
              <h1 className="font-serif text-3xl font-bold text-foreground">
                Bem-vindo, {profile?.full_name?.split(" ")[0] || "Advogado"}!
              </h1>
              <p className="text-muted-foreground mt-1">
                Seu assistente jurídico inteligente
              </p>
            </div>
            <StatsCards />
            <QuickActions onTabChange={setActiveTab} />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <RecentDocuments />
              <UpcomingDeadlines />
            </div>
          </div>
        );
      case "assistant":
        return <AIChat />;
      case "pdf-reader":
        return <PDFReader />;
      case "documents":
        return <DocumentCreator />;
      case "cases":
        return <CasesManager />;
      case "calendar":
        return <CalendarView />;
      case "profile":
        return <ProfilePage />;
      case "feature-request":
        return <FeatureRequestForm />;
      case "integrations":
        return <IntegrationsPage />;
      case "admin":
        return <AdminUsersPage />;
      case "settings":
      case "notifications":
      case "billing":
        return <SettingsPage />;
      case "sales":
        return <div className="text-center py-20 text-muted-foreground">Página de Vendas em construção...</div>;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />
      <main className="ml-64 p-8">
        {renderContent()}
      </main>
    </div>
  );
};

export default Index;
