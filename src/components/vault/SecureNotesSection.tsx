"use client";

import { useState } from "react";
import { AddSecureNoteForm } from "./AddSecureNoteForm";
import { SecureNoteList } from "./SecureNoteList";

export function SecureNotesSection() {
  const [refreshKey, setRefreshKey] = useState(0);

  function handleChanged() {
    setRefreshKey((current) => current + 1);
  }

  return (
    <>
      <SecureNoteList refreshKey={refreshKey} onChanged={handleChanged} />
      <AddSecureNoteForm onCreated={async () => handleChanged()} />
    </>
  );
}