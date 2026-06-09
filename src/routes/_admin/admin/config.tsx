import { useQuery, useQueryClient } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import { useState } from "react"
import { sileo } from "sileo"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { Textarea } from "@/components/ui/textarea"
import { AdminEmpty } from "@/features/admin/components/admin-empty"
import { AdminPageHeader } from "@/features/admin/components/admin-page-header"
import { api } from "@/lib/api"

export const Route = createFileRoute("/_admin/admin/config")({
	component: AdminConfigPage,
})

function AdminConfigPage() {
	const queryClient = useQueryClient()
	const [draft, setDraft] = useState<{
		key: string
		value: string
		description: string
	}>({ key: "", value: "", description: "" })

	const { data, isLoading } = useQuery({
		queryKey: ["admin", "system-config"],
		queryFn: async () => {
			const { data, error } = await api.v3.admin["system-config"].get()
			if (error) throw new Error("Failed to load config")
			return data
		},
	})

	const refresh = () =>
		queryClient.invalidateQueries({ queryKey: ["admin", "system-config"] })

	const handleUpsert = async (
		key: string,
		rawValue: string,
		description: string | null
	) => {
		let parsed: unknown
		try {
			parsed = JSON.parse(rawValue)
		} catch {
			parsed = rawValue
		}
		await sileo.promise(
			api.v3.admin["system-config"].put({
				key,
				value: parsed,
				description,
			}),
			{
				loading: { title: "Saving..." },
				success: { title: "Config saved" },
				error: () => ({ title: "Failed" }),
			}
		)
		setDraft({ key: "", value: "", description: "" })
		await refresh()
	}

	const items = data ?? []

	return (
		<>
			<AdminPageHeader
				title="System config"
				description="Ops knobs only - product economics live in code."
			/>

			<Card>
				<CardContent className="flex flex-col gap-3 pt-6">
					<div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
						<div className="flex flex-col gap-1.5">
							<Label htmlFor="config-key">Key</Label>
							<Input
								id="config-key"
								placeholder="signupsAllowed"
								value={draft.key}
								onChange={(e) => setDraft((d) => ({ ...d, key: e.target.value }))}
							/>
						</div>
						<div className="flex flex-col gap-1.5">
							<Label htmlFor="config-description">Description (optional)</Label>
							<Input
								id="config-description"
								value={draft.description}
								onChange={(e) => setDraft((d) => ({ ...d, description: e.target.value }))}
							/>
						</div>
					</div>
					<div className="flex flex-col gap-1.5">
						<Label htmlFor="config-value">Value (JSON)</Label>
						<Textarea
							id="config-value"
							rows={3}
							placeholder='true, 42, "hello", or {"foo": "bar"}'
							value={draft.value}
							onChange={(e) => setDraft((d) => ({ ...d, value: e.target.value }))}
						/>
					</div>
					<Button
						onClick={() =>
							handleUpsert(
								draft.key.trim(),
								draft.value,
								draft.description.trim() || null
							)
						}
						disabled={!draft.key.trim() || !draft.value.trim()}
						className="self-end"
					>
						Upsert
					</Button>
				</CardContent>
			</Card>

			{isLoading ? (
				<Skeleton className="h-32 w-full" />
			) : items.length === 0 ? (
				<AdminEmpty title="No system config keys yet" />
			) : (
				<Card>
					<CardContent className="flex flex-col divide-y">
						{items.map((row) => (
							<ConfigRow
								key={row.key}
								row={row}
								onSave={(v, d) => handleUpsert(row.key, v, d)}
							/>
						))}
					</CardContent>
				</Card>
			)}
		</>
	)
}

function ConfigRow({
	row,
	onSave,
}: {
	row: { key: string; value: unknown; description: string | null; updatedAt: Date }
	onSave: (value: string, description: string | null) => void
}) {
	const [value, setValue] = useState(JSON.stringify(row.value))
	const [description, setDescription] = useState(row.description ?? "")
	return (
		<div className="flex flex-col gap-2 py-3">
			<div className="flex items-center justify-between gap-2">
				<span className="font-mono text-sm">{row.key}</span>
				<span className="text-[10px] text-muted-foreground">
					Updated {new Date(row.updatedAt).toLocaleString()}
				</span>
			</div>
			<div className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_2fr_auto] sm:items-center">
				<Input
					value={description}
					placeholder="Description"
					onChange={(e) => setDescription(e.target.value)}
				/>
				<Input
					value={value}
					onChange={(e) => setValue(e.target.value)}
					className="font-mono text-xs"
				/>
				<Button size="sm" onClick={() => onSave(value, description.trim() || null)}>
					Save
				</Button>
			</div>
		</div>
	)
}
