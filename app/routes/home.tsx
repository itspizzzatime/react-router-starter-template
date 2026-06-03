import type { Route } from "./+types/home";
import { Dashboard } from "../welcome/dashboard";

export function meta({}: Route.MetaArgs) {
	return [
		{ title: "Dashboard" },
		{ name: "description", content: "SIR Epidemic Model Dashboard" },
	];
}

export function loader({ context }: Route.LoaderArgs) {
	return { message: context.cloudflare.env.VALUE_FROM_CLOUDFLARE };
}

export default function Home({ loaderData }: Route.ComponentProps) {
	return <Dashboard />;
}
