import { createFileRoute } from "@tanstack/react-router"

import {
	PublicProfile,
	PublicProfileNotFound,
	PublicProfileSkeleton,
} from "@/features/profile/components/public-profile"
import { usePublicProfile } from "@/features/profile/hooks/use-public-profile"

export const Route = createFileRoute("/$username")({
	component: PublicProfileRoute,
})

function PublicProfileRoute() {
	const { username } = Route.useParams()
	const { data, isLoading } = usePublicProfile(username)

	if (isLoading) return <PublicProfileSkeleton />
	if (!data) return <PublicProfileNotFound username={username} />
	return <PublicProfile profile={data} />
}
