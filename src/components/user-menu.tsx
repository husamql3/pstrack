import {
	IconLifebuoy,
	IconLogout,
	IconSelector,
	IconSettings,
	IconSparkles,
	IconUserCircle,
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

	const goToProfile = () => {
		if (!user?.username) return
		navigate({ to: "/$username", params: { username: user.username } })
	}

	const goToSettings = () => {
		navigate({ to: "/settings/account" })
	}

	const goToHelp = () => {
		navigate({ to: "/help" })
	}

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button variant="outline" className="ml-auto w-40" size="lg">
					<HashAvatar username={user?.username ?? initials} size={16} />
					<span className="font-medium text-sm">{displayName}</span>
					{user?.isPro && (
						<Badge variant="secondary" className="ml-1 gap-0.5 px-1.5">
							<IconSparkles className="size-3" aria-hidden="true" />
							Pro
						</Badge>
					)}
					<IconSelector className="ml-auto opacity-60" aria-hidden="true" />
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent className="w-60" align="start" sideOffset={8}>
				<div className="flex items-center gap-3 px-1 pt-1.5 pb-2.5">
					<HashAvatar username={user?.username ?? initials} size={32} />
					<div className="flex min-w-0 flex-col">
						<div className="flex items-center gap-1.5">
							<span className="truncate font-medium text-foreground text-sm">
								{user?.name ?? "…"}
							</span>
							{user?.isPro && (
								<Badge variant="secondary" className="shrink-0 gap-0.5 px-1.5">
									<IconSparkles className="size-3" aria-hidden="true" />
									Pro
								</Badge>
							)}
						</div>
						<span className="truncate text-muted-foreground text-xs">
							{user?.email ?? "…"}
						</span>
					</div>
				</div>

				<DropdownMenuGroup>
					<DropdownMenuItem onSelect={goToProfile} disabled={!user?.username}>
						<IconUserCircle aria-hidden="true" />
						View profile
					</DropdownMenuItem>
					<DropdownMenuItem onSelect={goToSettings}>
						<IconSettings aria-hidden="true" />
						Settings
					</DropdownMenuItem>
					<DropdownMenuItem onSelect={goToHelp}>
						<IconLifebuoy aria-hidden="true" />
						Help &amp; FAQ
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
