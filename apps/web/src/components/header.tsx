import { Link } from "@tanstack/react-router";
import { Settings } from "lucide-react";
import { useState } from "react";

import { ApiKeySettings } from "./api-key-settings";
import { ModeToggle } from "./mode-toggle";
import UserMenu from "./user-menu";

export default function Header() {
	const [settingsOpen, setSettingsOpen] = useState(false);

	const links = [
		{ to: "/", label: "Home" },
		{ to: "/dashboard", label: "Dashboard" },
	] as const;

	return (
		<div>
			<div className="flex flex-row items-center justify-between px-2 py-1">
				<nav className="flex gap-4 text-lg">
					{links.map(({ to, label }) => {
						return (
							<Link key={to} to={to}>
								{label}
							</Link>
						);
					})}
				</nav>
				<div className="flex items-center gap-2">
					<button
						type="button"
						className="btn-icon"
						onClick={() => setSettingsOpen(true)}
						aria-label="الإعدادات"
					>
						<Settings />
					</button>
					<ModeToggle />
					<UserMenu />
				</div>
			</div>
			<hr />
			<ApiKeySettings
				isOpen={settingsOpen}
				onClose={() => setSettingsOpen(false)}
			/>
		</div>
	);
}
