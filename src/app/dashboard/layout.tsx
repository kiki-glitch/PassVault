import { VaultProvider } from "@/components/vault/VaultProvider";

export default function DashboardLayout({
    children,
}:{
    children:React.ReactNode;
}){
    return <VaultProvider>{children}</VaultProvider>;
}