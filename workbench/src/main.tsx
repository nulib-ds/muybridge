import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Theme } from "@radix-ui/themes";
import "@radix-ui/themes/styles.css";
import "./index.css";
import App from "./app/App.tsx";

createRoot(document.getElementById("root") as HTMLElement).render(
  <StrictMode>
    <Theme appearance="light" accentColor="indigo" grayColor="slate" scaling="100%">
      <App />
    </Theme>
  </StrictMode>,
);
