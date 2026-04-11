import { LabWorkspaceShell } from "../components/LabWorkspaceShell";

export default function LabsLayout({ children }: { children: React.ReactNode }) {
  return <LabWorkspaceShell>{children}</LabWorkspaceShell>;
}
