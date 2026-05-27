import { Button } from "@/components/ui/button"
import { FEATURE_CARDS } from "../constants"

export const WelcomeStep = ({ onContinue }: { onContinue: () => void }) => {
	return (
		<main className="flex flex-1 flex-col items-center justify-center gap-10 px-4 py-16">
			<div className="max-w-lg text-center">
				<h1 className="mb-3 text-3xl font-bold tracking-tight">Welcome to PSTrack</h1>
				<p className="text-muted-foreground text-base leading-relaxed">
					One LeetCode problem a day, picked from the NeetCode 250 roadmap.
					<br />
					Solve with your group, build a streak, climb the board.
				</p>
			</div>

			<div className="grid w-full max-w-2xl grid-cols-1 gap-4 sm:grid-cols-3">
				{FEATURE_CARDS.map(({ icon: Icon, title, subtitle }) => (
					<div
						key={title}
						className="border-border/50 bg-card flex flex-col items-center gap-3 rounded-xl border p-6 text-center"
					>
						<Icon className="text-primary size-8" />
						<div>
							<p className="text-sm font-semibold">{title}</p>
							<p className="text-muted-foreground mt-0.5 text-xs">{subtitle}</p>
						</div>
					</div>
				))}
			</div>

			<div className="text-muted-foreground flex items-center gap-2 text-sm">
				<span className="inline-block size-2 rounded-full bg-green-500" />
				2,481 devs solved today · 91% retention WoW
			</div>

			<Button onClick={onContinue} size="lg" className="w-full max-w-xs">
				Get started
			</Button>
		</main>
	)
}
