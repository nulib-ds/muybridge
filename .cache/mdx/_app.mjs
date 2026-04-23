import {Fragment as _Fragment, jsx as _jsx, jsxs as _jsxs} from "react/jsx-runtime";
import {useMDXComponents as _provideComponents} from "@mdx-js/react";
import {Meta, Stylesheet} from "@canopy-iiif/app/head";
import {CanopyHeader, CanopyFooter} from "@canopy-iiif/app/ui/server";
export function Head() {
  return _jsxs(_Fragment, {
    children: [_jsx(Meta, {}), _jsx(Stylesheet, {}), _jsx("link", {
      rel: "preconnect",
      href: "https://fonts.googleapis.com"
    }), _jsx("link", {
      rel: "preconnect",
      href: "https://fonts.gstatic.com",
      crossOrigin: "true"
    }), _jsx("link", {
      href: "https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght,SOFT,WONK@0,9..144,300..600,50,0..1;1,9..144,300..600,50,0..1&display=swap",
      rel: "stylesheet"
    })]
  });
}
export function App({children}) {
  return _jsxs(_Fragment, {
    children: [_jsx(CanopyHeader, {
      logo: Logo
    }), _jsx("main", {
      children: children
    }), _jsx(CanopyFooter, {
      children: _jsx("p", {
        children: "Copyright 2025 Site Title, MIT License. A Canopy IIIF Project."
      })
    })]
  });
}
export const Logo = () => _jsxs("svg", {
  xmlns: "http://www.w3.org/2000/svg",
  viewBox: "0 0 500 500",
  children: [_jsx("circle", {
    className: "canopy-logo-backlight",
    cx: "250",
    cy: "250",
    r: "250"
  }), _jsx("path", {
    className: "canopy-logo-overlay",
    d: "M125,33.45C50.28,76.68,0,157.47,0,250s50.28,173.32,125,216.55c74.72-43.23,125-124.01,125-216.55S199.72,76.68,125,33.45Z"
  })]
});
function _createMdxContent(props) {
  return _jsx(_Fragment, {});
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
