import { Link } from "@tanstack/react-router"

import { Button } from "@/components/ui/button"
import { MENU_ITEMS } from "@/features/home/constants"

export const NavItems = () => {
	return (
		<ul className="flex gap-1 max-lg:flex-col">
			{MENU_ITEMS.map((item) => (
				<li key={item.name}>
					<Button
						asChild
						variant="ghost"
						size="sm"
						className="w-full max-lg:h-12 max-lg:justify-start max-lg:text-lg"
					>
						<Link to={item.href} className="text-base">
							<span>{item.name}</span>
						</Link>
					</Button>
				</li>
			))}
		</ul>
	)
}
