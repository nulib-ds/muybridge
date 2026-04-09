import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Theme } from "@radix-ui/themes";
import "@radix-ui/themes/styles.css";
import "./index.css";
import App from "./app/App.tsx";

createRoot(document.getElementById("root") as HTMLElement).render(
  <StrictMode>
    <Theme
      appearance="dark"
      accentColor="iris"
      grayColor="mauve"
      panelBackground="solid"
      radius="none"
      scaling="100%"
    >
      <App />
    </Theme>
  </StrictMode>,
);
