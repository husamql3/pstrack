import { AppHeader } from "@/components/app-header"
import { AppSidebar } from "@/components/app-sidebar"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { cn } from "@/lib/utils"

export function AppShell({ children }: { children: React.ReactNode }) {
	return (
		<SidebarProvider
			className={cn("[--app-wrapper-max-width:80rem]", "[--app-header-height:3rem]")}
		>
			<AppSidebar />
			<SidebarInset className="bg-muted dark:bg-background">
				<AppHeader />
				<div
					className={cn(
						"flex flex-1 flex-col p-4 md:p-6",
						"mx-auto w-full max-w-(--app-wrapper-max-width)"
					)}
				>
					{children}
				</div>
			</SidebarInset>
		</SidebarProvider>
	)
}
