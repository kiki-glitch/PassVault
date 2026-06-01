"use client";

import { useState } from "react";
import { AddPasswordForm } from "./AddPasswordForm";
import { VaultItemList } from "./VaultItemList";
import { refresh } from "next/cache";

export function VaultDashboardSection(){
    const [refreshKey, setRefreshKey] = useState(0);

    async function handleCreated() {
        setRefreshKey((current) => current + 1);
    }

    return(
        <>
            <VaultItemList key={refreshKey} />
            <AddPasswordForm onCreated={handleCreated} />
        </>
    );
}