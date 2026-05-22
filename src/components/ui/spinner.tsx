export function FullScreenSpinner() {
	return (
		<div className="flex h-screen items-center justify-center">
			<div className="h-8 w-8 animate-spin rounded-full border-4 border-muted border-t-primary" />
		</div>
	)
}
