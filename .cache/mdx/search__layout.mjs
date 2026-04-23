import {jsx as _jsx, jsxs as _jsxs} from "react/jsx-runtime";
import {useMDXComponents as _provideComponents} from "@mdx-js/react";
function _createMdxContent(props) {
  const {SearchResults, SearchSummary, SearchTabs} = {
    ..._provideComponents(),
    ...props.components
  };
  if (!SearchResults) _missingMdxReference("SearchResults", true);
  if (!SearchSummary) _missingMdxReference("SearchSummary", true);
  if (!SearchTabs) _missingMdxReference("SearchTabs", true);
  return _jsxs("div", {
    className: "canopy-search-results",
    children: [_jsx(SearchTabs, {}), _jsx(SearchSummary, {}), _jsx(SearchResults, {})]
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
