import {jsx as _jsx} from "react/jsx-runtime";
import {useMDXComponents as _provideComponents} from "@mdx-js/react";
function _createMdxContent(props) {
  return _jsx("div", {
    children: props.children
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
