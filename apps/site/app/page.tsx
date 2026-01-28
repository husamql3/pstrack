import { Pill, PillIndicator } from "@/components/pill";

function Home() {
	return (
		<div className="h-full w-full flex items-center justify-center flex-col gap-4 px-4 py-12 bg-zinc-950">
			<Pill className="z-50 text-[10px] md:text-xs bg-zinc-950/90 border border-zinc-800 text-zinc-50 backdrop-blur-sm shadow-lg">
				<PillIndicator variant="warning" pulse />
				Building Something Cool
			</Pill>

			<div className="max-w-4xl z-50 w-full space-y-4">
				<h1 className="pointer-events-none leading-9 md:leading-17 z-50 bg-linear-to-b bg-clip-text text-center text-3xl sm:text-4xl md:text-6xl font-semibold whitespace-pre-wrap text-transparent from-white to-zinc-500/90">
					Level Up Your
					<br />
					Problem-Solving Game.
				</h1>

				<h2 className="pointer-events-none z-50 bg-linear-to-b bg-clip-text text-center text-sm sm:text-lg md:text-xl leading-relaxed font-medium whitespace-pre-wrap text-transparent from-white to-zinc-500/90 max-w-2xl mx-auto">
					The platform that helps you solve, track, and grow.
				</h2>
			</div>
		</div>
	);
}

export default Home;
