// app/components/Example.tsx
import { jsx, jsxs } from "react/jsx-runtime";
function Example({
  title,
  children
}) {
  return /* @__PURE__ */ jsxs("article", { children: [
    /* @__PURE__ */ jsx("strong", { children: title }),
    /* @__PURE__ */ jsx("p", { children })
  ] });
}
export {
  Example as default
};
