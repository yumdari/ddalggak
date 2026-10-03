import type { Metadata } from "next";
import Workspace from "./_components/Workspace";
import { service } from "./meta";

export const metadata: Metadata = { title: `${service.name} - 딸각` };

export default function OpportunitiesPage() {
  return <Workspace />;
}
