import { useQuery, useQueryClient } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import { useState } from "react"
import { sileo } from "sileo"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { Switch } from "@/components/ui/switch"
import { AdminEmpty } from "@/features/admin/components/admin-empty"
import { AdminPageHeader } from "@/features/admin/components/admin-page-header"
import { api } from "@/lib/api"

export const Route = createFileRoute("/_admin/admin/flags")({
	component: AdminFlagsPage,
})

function AdminFlagsPage() {
	const queryClient = useQueryClient()
	const [newKey, setNewKey] = useState("")
	const [newDescription, setNewDescription] = useState("")

	const { data, isLoading } = useQuery({
		queryKey: ["admin", "feature-flags"],
		queryFn: async () => {
			const { data, error } = await api.v4.admin["feature-flags"].get()
			if (error) throw new Error("Failed to load flags")
			return data
		},
	})

	const refresh = () =>
		queryClient.invalidateQueries({ queryKey: ["admin", "feature-flags"] })

	const handleToggle = async (key: string, enabled: boolean) => {
		await sileo.promise(api.v4.admin["feature-flags"]({ key }).patch({ enabled }), {
			loading: { title: "Updating..." },
			success: { title: enabled ? "Flag enabled" : "Flag disabled" },
			error: () => ({ title: "Failed" }),
		})
		await refresh()
	}

	const handleCreate = async () => {
		if (!newKey.trim()) return
		await sileo.promise(
			api.v4.admin["feature-flags"].post({
				key: newKey.trim(),
				enabled: false,
				description: newDescription.trim() || null,
			}),
			{
				loading: { title: "Creating..." },
				success: { title: "Flag created" },
				error: (err) => ({
					title: "Failed",
					description: err instanceof Error ? err.message : "Try again",
				}),
			}
		)
		setNewKey("")
		setNewDescription("")
		await refresh()
	}

	const items = data ?? []

	return (
		<>
			<AdminPageHeader
				title="Feature flags"
				description="Toggle features at runtime without a redeploy"
			/>

			<Card>
				<CardContent className="flex flex-col gap-3 pt-6 sm:flex-row sm:items-end">
					<div className="flex flex-col gap-1.5 sm:w-64">
						<Label htmlFor="new-flag-key">Key</Label>
						<Input
							id="new-flag-key"
							placeholder="my_feature_enabled"
							value={newKey}
							onChange={(e) => setNewKey(e.target.value)}
						/>
					</div>
					<div className="flex flex-1 flex-col gap-1.5">
						<Label htmlFor="new-flag-desc">Description (optional)</Label>
						<Input
							id="new-flag-desc"
							value={newDescription}
							onChange={(e) => setNewDescription(e.target.value)}
						/>
					</div>
					<Button onClick={handleCreate} disabled={!newKey.trim()}>
						Create flag
					</Button>
				</CardContent>
			</Card>

			{isLoading ? (
				<Skeleton className="h-32 w-full" />
			) : items.length === 0 ? (
				<AdminEmpty title="No feature flags yet" description="Create one above" />
			) : (
				<Card>
					<CardContent className="flex flex-col divide-y">
						{items.map((flag) => (
							<div
								key={flag.key}
								className="flex items-center justify-between gap-4 py-3"
							>
								<div className="flex flex-col">
									<span className="font-mono text-sm">{flag.key}</span>
									{flag.description ? (
										<span className="text-muted-foreground text-xs">
											{flag.description}
										</span>
									) : null}
									<span className="text-[10px] text-muted-foreground">
										Updated {new Date(flag.updatedAt).toLocaleString()}
									</span>
								</div>
								<Switch
									checked={flag.enabled}
									onCheckedChange={(v) => handleToggle(flag.key, v)}
								/>
							</div>
						))}
					</CardContent>
				</Card>
			)}
		</>
	)
}
