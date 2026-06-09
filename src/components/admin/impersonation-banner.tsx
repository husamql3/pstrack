import { IconAlertTriangle } from "@tabler/icons-react"
import { useQueryClient } from "@tanstack/react-query"
import { useNavigate } from "@tanstack/react-router"

import { Button } from "@/components/ui/button"
import { api } from "@/lib/api"
import { authClient, useSession } from "@/lib/auth-client"

type SessionWithImpersonation = {
	user?: { username?: string | null; name?: string | null; id?: string }
	session?: { impersonatedBy?: string | null; createdAt?: string }
}

export function ImpersonationBanner() {
	const { data } = useSession()
	const navigate = useNavigate()
	const queryClient = useQueryClient()

	const impersonatedBy = (data as SessionWithImpersonation | null)?.session
		?.impersonatedBy
	const targetName =
		(data as SessionWithImpersonation | null)?.user?.username ||
		(data as SessionWithImpersonation | null)?.user?.name ||
		"unknown"
	const targetId = (data as SessionWithImpersonation | null)?.user?.id

	if (!impersonatedBy) return null

	const handleStop = async () => {
		const startedAt = (data as SessionWithImpersonation | null)?.session?.createdAt
		const durationMs = startedAt
			? Math.max(0, Date.now() - new Date(startedAt).getTime())
			: undefined
		await authClient.admin.stopImpersonating()
		if (targetId) {
			await api.v3.admin.users({ id: targetId })["impersonate-end-audit"].post({
				durationMs,
			})
		}
		await queryClient.invalidateQueries()
		await navigate({ to: "/admin/users" })
	}

	return (
		<div className="sticky top-0 z-50 flex items-center justify-between gap-3 border-destructive/40 border-b bg-destructive/10 px-4 py-2 text-destructive">
			<div className="flex items-center gap-2 font-medium text-sm">
				<IconAlertTriangle className="size-4" />
				<span>
					Impersonating <strong>@{targetName}</strong>
				</span>
			</div>
			<Button
				size="sm"
				variant="outline"
				className="border-destructive/40 text-destructive hover:bg-destructive/10"
				onClick={handleStop}
			>
				Stop impersonating
			</Button>
		</div>
	)
}
