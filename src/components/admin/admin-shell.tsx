import type { ReactNode } from "react"

import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { TooltipProvider } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import { AdminHeader } from "./admin-header"
import { AdminSidebar } from "./admin-sidebar"
import { ImpersonationBanner } from "./impersonation-banner"

export function AdminShell({ children }: { children: ReactNode }) {
	return (
		<TooltipProvider delayDuration={200}>
			<SidebarProvider
				className={cn("[--app-wrapper-max-width:80rem]", "[--app-header-height:3rem]")}
			>
				<AdminSidebar />
				<SidebarInset className="bg-muted dark:bg-background">
					<ImpersonationBanner />
					<AdminHeader />
					<div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
						<div className="mx-auto flex w-full max-w-(--app-wrapper-max-width) flex-1 flex-col gap-6">
							{children}
						</div>
					</div>
				</SidebarInset>
			</SidebarProvider>
		</TooltipProvider>
	)
}
