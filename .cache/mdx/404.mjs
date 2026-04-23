import {jsx as _jsx, jsxs as _jsxs} from "react/jsx-runtime";
import {useMDXComponents as _provideComponents} from "@mdx-js/react";
function _createMdxContent(props) {
  const _components = {
    h1: "h1",
    p: "p",
    ..._provideComponents(),
    ...props.components
  }, {Container, RelatedItems} = _components;
  if (!Container) _missingMdxReference("Container", true);
  if (!RelatedItems) _missingMdxReference("RelatedItems", true);
  return _jsxs(Container, {
    variant: "wide",
    children: [_jsx(_components.h1, {
      children: "Page not found"
    }), _jsx(_components.p, {
      children: "Sorry, the page you are looking for does not exist."
    }), _jsx(RelatedItems, {})]
  });
}
export default function MDXContent(props = {}) {
  const {wrapper: MDXLayout} = {
    ..._provideComponents(),
    ...props.components
  };
  return MDXLayout ? _jsx(MDXLayout, {
    ...props,
    children: _jsx(_createMdxContent, {
      ...props
    })
  }) : _createMdxContent(props);
}
function _missingMdxReference(id, component) {
  throw new Error("Expected " + (component ? "component" : "object") + " `" + id + "` to be defined: you likely forgot to import, pass, or provide it.");
}
