import { IconDeviceLaptop } from "@tabler/icons-react"
import { sileo } from "sileo"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import {
	useRevokeOtherSessions,
	useRevokeSession,
	useSessions,
} from "../../hooks/use-sessions"
import { errorDescription, formatDate } from "../../utils"
import { SectionCard } from "../section-card"

export const SessionsSection = () => {
	const { data, isLoading } = useSessions()
	const revoke = useRevokeSession()
	const revokeOthers = useRevokeOtherSessions()

	const otherSessionsCount = (data ?? []).filter((s) => !s.isCurrent).length

	const handleRevoke = async (id: string) => {
		await sileo.promise(revoke.mutateAsync(id), {
			loading: { title: "Revoking session..." },
			success: { title: "Session revoked" },
			error: (err) => ({
				title: "Couldn't revoke session",
				description: errorDescription(err),
			}),
		})
	}

	const handleRevokeOthers = async () => {
		await sileo.promise(revokeOthers.mutateAsync(), {
			loading: { title: "Signing out other sessions..." },
			success: { title: "Other sessions signed out" },
			error: (err) => ({
				title: "Couldn't sign out others",
				description: errorDescription(err),
			}),
		})
	}

	return (
		<SectionCard
			title="Active sessions"
			description="Devices currently signed in to your account."
		>
			<div className="flex flex-col gap-3">
				{isLoading && <Skeleton className="h-20 w-full" />}
				{!isLoading && (
					<ul className="flex flex-col gap-2">
						{(data ?? []).map((session) => (
							<li
								key={session.id}
								className="flex items-center gap-3 rounded-md border border-border px-3 py-2.5"
							>
								<IconDeviceLaptop
									className="size-4 text-muted-foreground"
									aria-hidden="true"
								/>
								<div className="min-w-0 flex-1">
									<div className="flex items-center gap-2">
										<span className="truncate text-sm">
											{session.userAgent ?? "Unknown device"}
										</span>
										{session.isCurrent && (
											<Badge variant="secondary" className="shrink-0">
												This device
											</Badge>
										)}
									</div>
									<p className="text-muted-foreground text-xs">
										{session.ipAddress ?? "-"} · last active{" "}
										{formatDate(session.updatedAt) ?? "-"}
									</p>
								</div>
								{!session.isCurrent && (
									<Button
										variant="ghost"
										size="sm"
										disabled={revoke.isPending}
										onClick={() => handleRevoke(session.id)}
									>
										Revoke
									</Button>
								)}
							</li>
						))}
					</ul>
				)}

				{otherSessionsCount > 0 && (
					<div>
						<Button
							variant="outline"
							size="sm"
							disabled={revokeOthers.isPending}
							onClick={handleRevokeOthers}
						>
							Sign out of all other sessions
						</Button>
					</div>
				)}
			</div>
		</SectionCard>
	)
}
