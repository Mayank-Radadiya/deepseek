import { AppSidebar } from "@/components/global/AppSidebar";
import { SidebarProvider } from "@/components/ui/sidebar";

export default function Home() {
  return (
    <>
      <div className="flex max-h-screen p-4">
        {/* Sidebar */}
        <div>
          <SidebarProvider>
            <AppSidebar />
          </SidebarProvider>
        </div>

        {/* Main Content */}
        <h1 className="text-3xl">Hello world!</h1>
      </div>
    </>
  );
}
