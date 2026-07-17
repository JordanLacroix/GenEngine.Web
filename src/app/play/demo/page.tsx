import type { Metadata } from "next";
import { DemoPlayer } from "@/features/player/ui/demo-player";

export const metadata: Metadata = { title: "Le dernier phare" };

export default function DemoPlayerPage() { return <DemoPlayer />; }
