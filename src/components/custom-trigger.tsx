"use client"
import { cn } from "@/lib/utils"
import { useIsMobile } from "@/hooks/use-mobile"
import { SidebarTrigger, useSidebar } from "@/components/ui/sidebar"

type Place = "sidebar" | "navbar"

export function CustomTrigger({ place }: { place: Place }) {
	const isMobile = useIsMobile()
	const { open, openMobile } = useSidebar()
	const sidebarOpen = isMobile ? openMobile : open

	return (
		<SidebarTrigger
			className={cn(
				"transition-opacity duration-0 ease-out motion-reduce:transition-none",
				!sidebarOpen &&
					place === "navbar" &&
					"0fill-mode-forwards delay-100 duration-300",
				sidebarOpen && place === "navbar" && "pointer-events-none opacity-0",
				!sidebarOpen && place === "sidebar" && "pointer-events-none opacity-0"
			)}
		/>
	)
}
