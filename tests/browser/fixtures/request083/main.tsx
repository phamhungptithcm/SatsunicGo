import React from "react";
import "../../../../src/styles/global.css";
import "../../../../src/styles/public-ux.css";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { RequestForm } from "../../../../src/features/requests/RequestForm";
Object.assign(window, { fixtureSignIns: 0 });
createRoot(document.getElementById("root")!).render(
  <BrowserRouter>
    <main id="main">
      <RequestForm
        user={null}
        signIn={async () => {
          const w = window as unknown as { fixtureSignIns: number };
          w.fixtureSignIns++;
        }}
      />
    </main>
  </BrowserRouter>,
);
