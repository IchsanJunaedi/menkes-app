"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Users, FileText, Activity, LogOut, Settings } from "lucide-react";
import { signOut } from "next-auth/react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const navItems = [
    { name: "Patients", href: "/patients", icon: Users },
    { name: "Encounters", href: "/encounters", icon: Activity },
    { name: "Documents", href: "/documents", icon: FileText },
    { name: "Settings", href: "/settings", icon: Settings },
];

export default function Sidebar() {
    const pathname = usePathname();

    return (
        <aside className="w-64 border-r bg-card flex flex-col justify-between h-full">
            <div>
                <div className="p-6">
                    <h2 className="text-2xl font-bold tracking-tight text-primary">SehatKu EHR</h2>
                </div>
                <nav className="space-y-1 px-4">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = pathname.startsWith(item.href);
                        return (
                            <Link key={item.name} href={item.href}>
                                <span
                                    className={cn(
                                        "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                                        isActive
                                            ? "bg-primary text-primary-foreground hover:bg-primary/90"
                                            : "text-muted-foreground hover:bg-muted hover:text-foreground"
                                    )}
                                >
                                    <Icon className="h-5 w-5" />
                                    {item.name}
                                </span>
                            </Link>
                        );
                    })}
                </nav>
            </div>

            <div className="p-4 border-t">
                <Button
                    variant="outline"
                    className="w-full justify-start gap-3"
                    onClick={() => signOut({ callbackUrl: "/" })}
                >
                    <LogOut className="h-4 w-4" />
                    Sign Out
                </Button>
            </div>
        </aside>
    );
}
