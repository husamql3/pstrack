import {
	IconBuilding,
	IconCheck,
	IconLifebuoy,
	IconLogout,
	IconPhone,
	IconSelector,
	IconSettings,
} from "@tabler/icons-react"
import { useState } from "react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuSub,
	DropdownMenuSubContent,
	DropdownMenuSubTrigger,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"

const statuses = [
	{ value: "available", label: "Available", color: "bg-green-500" },
	{ value: "away", label: "Away", color: "bg-amber-500" },
	{ value: "busy", label: "Busy", color: "bg-red-500" },
	{ value: "offline", label: "Offline", color: "bg-gray-400" },
]

export function UserMenu() {
	const [status, setStatus] = useState("available")

	const activeStatus = statuses.find((s) => s.value === status) || statuses[0]

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button variant="outline" className="w-40 ml-auto" size="lg">
					<Avatar className="size-4">
						<AvatarImage src="https://github.com/shadcn.png" />
						<AvatarFallback>CN</AvatarFallback>
					</Avatar>
					<span className="text-sm font-medium">shadcn</span>

					<IconSelector className="ml-auto opacity-60" aria-hidden="true" />
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent className="w-60" align="start" sideOffset={8}>
				<div className="flex items-center gap-3 px-1 pt-1.5 pb-2.5">
					<Avatar className="size-8">
						<AvatarImage src="https://github.com/shadcn.png" />
						<AvatarFallback>CN</AvatarFallback>
					</Avatar>
					<div className="flex flex-col">
						<span className="text-foreground text-sm font-medium">shadcn</span>
						<span className="text-muted-foreground text-xs">ui@shadcn.com</span>
					</div>
				</div>

				<DropdownMenuGroup>
					<DropdownMenuItem
						onSelect={(e) => e.preventDefault()}
						className="justify-between"
					>
						<span className="flex items-center gap-2">
							<IconBuilding aria-hidden="true" />
							Your Companies
						</span>
						<Badge variant="secondary" className="rounded-full px-1.5">
							12
						</Badge>
					</DropdownMenuItem>
					<DropdownMenuItem
						onSelect={(e) => e.preventDefault()}
						className="justify-between"
					>
						<span className="flex items-center gap-2">
							<IconPhone aria-hidden="true" />
							Your Numbers
						</span>
						<Badge variant="secondary" className="rounded-full px-1.5">
							2
						</Badge>
					</DropdownMenuItem>
				</DropdownMenuGroup>
				<DropdownMenuSub>
					<DropdownMenuSubTrigger>
						<span className="flex items-center gap-2">
							<span className={cn("size-2 rounded-full", activeStatus.color)} />
							{activeStatus.label}
						</span>
					</DropdownMenuSubTrigger>
					<DropdownMenuSubContent className="w-40">
						{statuses.map((s) => (
							<DropdownMenuItem
								key={s.value}
								onClick={() => setStatus(s.value)}
								className="justify-between"
							>
								<span className="flex items-center gap-2">
									<span className={`size-2 rounded-full ${s.color}`} />
									{s.label}
								</span>
								{status === s.value && (
									<IconCheck
										className="text-muted-foreground size-4"
										aria-hidden="true"
									/>
								)}
							</DropdownMenuItem>
						))}
					</DropdownMenuSubContent>
				</DropdownMenuSub>
				<DropdownMenuSeparator />
				<DropdownMenuGroup>
					<DropdownMenuItem>
						<IconSettings aria-hidden="true" />
						Settings
					</DropdownMenuItem>
					<DropdownMenuItem>
						<IconLifebuoy aria-hidden="true" />
						Help Center
					</DropdownMenuItem>
				</DropdownMenuGroup>
				<DropdownMenuSeparator />
				<DropdownMenuItem variant="destructive">
					<IconLogout aria-hidden="true" />
					Logout
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	)
}
