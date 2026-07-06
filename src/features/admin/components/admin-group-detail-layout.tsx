import { IconArrowLeft } from "@tabler/icons-react"
import { Link, Outlet, useParams } from "@tanstack/react-router"

import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { useAdminGroup } from "../hooks/use-admin-group"
import { AdminPageHeader } from "./admin-page-header"

export const AdminGroupDetailLayout = () => {
	const { groupId } = useParams({ strict: false }) as { groupId: string }
	const { data, isLoading } = useAdminGroup(groupId)

	return (
		<>
			<Link
				className="flex w-fit items-center gap-1.5 text-muted-foreground text-sm transition-colors hover:text-foreground"
				to="/admin/groups"
			>
				<IconArrowLeft className="size-4" />
				All groups
			</Link>

			{isLoading || !data ? (
				<Skeleton className="mt-3 h-8 w-56" />
			) : (
				<AdminPageHeader
					title={`@${data.slug}`}
					description={`${data.type.toLowerCase()} · ${data._count.members}/${data.maxMembers} members`}
					actions={
						<div className="flex gap-1">
							{!data.isStarted ? <Badge variant="outline">not started</Badge> : null}
							{data.frozen ? <Badge variant="destructive">frozen</Badge> : null}
							{!data.isActive ? <Badge variant="outline">inactive</Badge> : null}
						</div>
					}
				/>
			)}

			<AdminGroupTabs groupId={groupId} pendingCount={data?._count.joinRequests ?? 0} />

			<Outlet />
		</>
	)
}

const AdminGroupTabs = ({
	groupId,
	pendingCount,
}: {
	groupId: string
	pendingCount: number
}) => (
	<div className="flex gap-1 border-b">
		<TabLink to="/admin/groups/$groupId/join-requests" groupId={groupId}>
			Join requests
			{pendingCount > 0 ? (
				<Badge className="ml-2" variant="secondary">
					{pendingCount}
				</Badge>
			) : null}
		</TabLink>
		<TabLink to="/admin/groups/$groupId/members" groupId={groupId}>
			Members
		</TabLink>
		<TabLink to="/admin/groups/$groupId/settings" groupId={groupId}>
			Settings
		</TabLink>
	</div>
)

const TabLink = ({
	to,
	groupId,
	children,
}: {
	to:
		| "/admin/groups/$groupId/join-requests"
		| "/admin/groups/$groupId/members"
		| "/admin/groups/$groupId/settings"
	groupId: string
	children: React.ReactNode
}) => (
	<Link
		activeProps={{
			className:
				"-mb-px border-foreground border-b-2 px-3 py-2 font-medium text-foreground text-sm",
		}}
		className="px-3 py-2 text-muted-foreground text-sm transition-colors hover:text-foreground"
		params={{ groupId }}
		to={to}
	>
		{children}
	</Link>
)
