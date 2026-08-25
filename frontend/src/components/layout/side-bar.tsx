import { BarChart3, History, LoaderCircle, PcCase, PlaySquare } from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";

import {
    Sidebar,
    SidebarContent,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarRail,
} from "@/components/ui/sidebar";

const navItems = [
    {
        title: "Summary",
        href: "/",
        icon: BarChart3,
    },
    {
        title: "Workers",
        href: "/workers",
        icon: PcCase,
    },
    {
        title: "Processes",
        href: "/processes",
        icon: LoaderCircle,
    },
    {
        title: "Executions",
        href: "/executions",
        icon: PlaySquare,
    },
    {
        title: "Actions",
        href: "/actions",
        icon: History,
    },
];

export function SideBar() {
    const { pathname } = useLocation();

    return (
        <Sidebar
            collapsible="icon"
            variant="floating"
            className="left-4 top-[5.25rem] h-[calc(100svh-6.25rem)] p-0 sm:left-6"
        >
            <SidebarContent>
                <SidebarGroup>
                    <SidebarGroupLabel>Navigation</SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            {navItems.map((item) => (
                                <SidebarMenuItem key={item.href}>
                                    <SidebarMenuButton
                                        asChild
                                        isActive={item.href === "/" ? pathname === "/" : pathname.startsWith(item.href)}
                                        tooltip={item.title}
                                    >
                                        <NavLink to={item.href} end={item.href === "/"}>
                                            <item.icon />
                                            <span>{item.title}</span>
                                        </NavLink>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            ))}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
            </SidebarContent>
            <SidebarRail />
        </Sidebar>
    );
}
