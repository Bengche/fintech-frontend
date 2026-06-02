"use client";

import { createContext, useContext, useState } from "react";

interface KilaCtx {
  kilaOpen: boolean;
  openKila: () => void;
  closeKila: () => void;
  kilaUnread: boolean;
  setKilaUnread: (v: boolean) => void;
}

const KilaContext = createContext<KilaCtx>({
  kilaOpen: false,
  openKila: () => {},
  closeKila: () => {},
  kilaUnread: false,
  setKilaUnread: () => {},
});

export function KilaProvider({ children }: { children: React.ReactNode }) {
  const [kilaOpen, setKilaOpen] = useState(false);
  const [kilaUnread, setKilaUnread] = useState(false);

  return (
    <KilaContext.Provider
      value={{
        kilaOpen,
        openKila: () => {
          setKilaOpen(true);
          setKilaUnread(false);
        },
        closeKila: () => setKilaOpen(false),
        kilaUnread,
        setKilaUnread,
      }}
    >
      {children}
    </KilaContext.Provider>
  );
}

export const useKila = () => useContext(KilaContext);
