import { createFileRoute } from "@tanstack/react-router"

export const Route = createFileRoute("/login")({
	component: LoginPage,
})

function LoginPage() {
	return <div>Login</div>
}
