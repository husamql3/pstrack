import {
	IconBuilding,
	IconLifebuoy,
	IconLogout,
	IconPhone,
	IconSelector,
	IconSettings,
} from "@tabler/icons-react"
import { useNavigate } from "@tanstack/react-router"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { HashAvatar } from "@/features/onboarding/components/hash-avatar"
import { signOut, useSession } from "@/lib/auth-client"

export function UserMenu() {
	const { data: session } = useSession()
	const navigate = useNavigate()

	const user = session?.user
	const displayName = user?.username ?? user?.name ?? "…"
	const initials = (user?.name ?? "?")
		.split(" ")
		.map((n) => n[0])
		.join("")
		.slice(0, 2)
		.toUpperCase()

	const handleLogout = () => {
		signOut({
			fetchOptions: {
				onSuccess: () => navigate({ to: "/login" }),
			},
		})
	}

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button variant="outline" className="w-40 ml-auto" size="lg">
					<HashAvatar username={user?.username ?? initials} size={16} />
					<span className="text-sm font-medium">{displayName}</span>
					<IconSelector className="ml-auto opacity-60" aria-hidden="true" />
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent className="w-60" align="start" sideOffset={8}>
				<div className="flex items-center gap-3 px-1 pt-1.5 pb-2.5">
					<HashAvatar username={user?.username ?? initials} size={32} />
					<div className="flex flex-col">
						<span className="text-foreground text-sm font-medium">
							{user?.name ?? "…"}
						</span>
						<span className="text-muted-foreground text-xs">{user?.email ?? "…"}</span>
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
				<DropdownMenuItem variant="destructive" onClick={handleLogout}>
					<IconLogout aria-hidden="true" />
					Logout
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	)
}
