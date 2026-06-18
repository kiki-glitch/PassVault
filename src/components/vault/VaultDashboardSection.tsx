"use client";

import { useState } from "react";
import { AddPasswordForm } from "./AddPasswordForm";
import { CsvImportPanel } from "./CsvImportPanel";
import { VaultItemList } from "./VaultItemList";

export function VaultDashboardSection(){
    const [refreshKey, setRefreshKey] = useState(0);

    async function handleCreated() {
        setRefreshKey((current) => current + 1);
    }

    return(
        <>
            <VaultItemList key={refreshKey} />
            <AddPasswordForm onCreated={handleCreated} />
            <CsvImportPanel onImported={handleCreated} />
        </>
    );
}