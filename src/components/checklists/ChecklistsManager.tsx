import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChecklistList } from "./ChecklistList";
import { TemplateList } from "./TemplateList";
import { ChecklistStats } from "./ChecklistStats";
import { ListChecks, LayoutTemplate, BarChart3 } from "lucide-react";

export function ChecklistsManager() {
  const [activeTab, setActiveTab] = useState("checklists");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl font-bold text-foreground">
          Motor de Checklists
        </h1>
        <p className="text-muted-foreground mt-1">
          Gerencie obrigações e prazos com inteligência
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3 lg:w-auto lg:inline-grid">
          <TabsTrigger value="checklists" className="gap-2">
            <ListChecks className="w-4 h-4" />
            <span className="hidden sm:inline">Checklists</span>
          </TabsTrigger>
          <TabsTrigger value="templates" className="gap-2">
            <LayoutTemplate className="w-4 h-4" />
            <span className="hidden sm:inline">Templates</span>
          </TabsTrigger>
          <TabsTrigger value="monitor" className="gap-2">
            <BarChart3 className="w-4 h-4" />
            <span className="hidden sm:inline">Monitor</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="checklists" className="mt-6">
          <ChecklistList />
        </TabsContent>

        <TabsContent value="templates" className="mt-6">
          <TemplateList />
        </TabsContent>

        <TabsContent value="monitor" className="mt-6">
          <ChecklistStats />
        </TabsContent>
      </Tabs>
    </div>
  );
}
