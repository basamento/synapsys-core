import { Home, LoaderCircle, PcCase } from "lucide-react";
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
        title: "Home",
        href: "/",
        icon: Home,
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
];

export function SideBar() {
    const { pathname } = useLocation();

    return (
        <Sidebar
            collapsible="icon"
            variant="floating"
            className="left-4 top-[5.25rem] h-[calc(100svh-6.25rem)] p-0 sm:left-6"
        >
            {/* <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <div className="flex items-center gap-2">
                            <SidebarMenuButton size="lg" tooltip="Synapsys" className="flex-1">
                                <div className="flex aspect-square size-8 items-center justify-center rounded-md bg-sidebar-primary text-sidebar-primary-foreground">
                                    S
                                </div>
                                <span className="font-semibold">Synapsys</span>
                            </SidebarMenuButton>
                        </div>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader> */}

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
