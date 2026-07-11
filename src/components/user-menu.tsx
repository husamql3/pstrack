import {
	IconLifebuoy,
	IconLogin,
	IconLogout,
	IconSelector,
	IconSettings,
	IconUserCircle,
} from "@tabler/icons-react"
import { Link, useNavigate, useRouter } from "@tanstack/react-router"

import { FeedbackMenuItem } from "@/components/feedback-menu-item"
import { Button } from "@/components/ui/button"
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ProBadge } from "@/components/ui/pro-badge"
import { Skeleton } from "@/components/ui/skeleton"
import { HashAvatar } from "@/features/onboarding/components/hash-avatar"
import { signOut, useSession } from "@/lib/auth-client"

export function UserMenu() {
	const { data: session, isPending } = useSession()
	const navigate = useNavigate()
	const router = useRouter()

	const user = session?.user
	const displayName = user?.username ?? user?.name ?? user?.email ?? "User"
	const initials = (user?.name ?? "?")
		.split(" ")
		.map((n) => n[0])
		.join("")
		.slice(0, 2)
		.toUpperCase()

	const handleLogout = () => {
		signOut({
			fetchOptions: {
				onSuccess: async () => {
					await router.invalidate()
					await navigate({ to: "/login" })
				},
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

	if (!isPending && !user) {
		return (
			<Button asChild variant="outline" size="sm">
				<Link to="/login">
					<IconLogin aria-hidden="true" />
					Login
				</Link>
			</Button>
		)
	}

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button variant="outline" className="ml-auto w-52" size="lg">
					{isPending ? (
						<Skeleton className="size-4 shrink-0 rounded-full" />
					) : (
						<HashAvatar
							username={user?.username ?? initials}
							size={16}
							isPro={!!user?.isPro}
						/>
					)}
					{isPending ? (
						<Skeleton className="h-4 w-20" />
					) : (
						<span className="truncate font-medium text-sm">{displayName}</span>
					)}
					<IconSelector className="ml-auto opacity-60" aria-hidden="true" />
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent className="w-60" align="start" sideOffset={8}>
				<div className="flex items-center gap-3 px-1 pt-1.5 pb-2.5">
					{isPending ? (
						<>
							<Skeleton className="size-8 shrink-0 rounded-full" />
							<div className="flex min-w-0 flex-1 flex-col gap-2">
								<Skeleton className="h-4 w-28" />
								<Skeleton className="h-3 w-36" />
							</div>
						</>
					) : (
						<>
							<HashAvatar
								username={user?.username ?? initials}
								size={32}
								isPro={!!user?.isPro}
							/>
							<div className="flex min-w-0 flex-col gap-0.5">
								<div className="flex min-w-0 items-center gap-1.5">
									<span className="truncate font-medium text-foreground text-sm">
										{user?.name ?? displayName}
									</span>
									{!!user?.isPro && <ProBadge />}
								</div>
								<span className="truncate text-muted-foreground text-xs">
									{user?.email}
								</span>
							</div>
						</>
					)}
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
					<FeedbackMenuItem />
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
