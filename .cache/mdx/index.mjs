import {Fragment as _Fragment, jsx as _jsx, jsxs as _jsxs} from "react/jsx-runtime";
import {useMDXComponents as _provideComponents} from "@mdx-js/react";
function _createMdxContent(props) {
  const _components = {
    code: "code",
    h2: "h2",
    h3: "h3",
    li: "li",
    p: "p",
    ul: "ul",
    ..._provideComponents(),
    ...props.components
  }, {Container, Interstitials, RelatedItems} = _components;
  if (!Container) _missingMdxReference("Container", true);
  if (!Interstitials) _missingMdxReference("Interstitials", false);
  if (!Interstitials.Hero) _missingMdxReference("Interstitials.Hero", true);
  if (!RelatedItems) _missingMdxReference("RelatedItems", true);
  return _jsxs(_Fragment, {
    children: [_jsx(Interstitials.Hero, {
      headline: "Use this Canopy IIIF template to create a new digital project",
      description: "This starter is yours to configure, add context to, and publish a collection that fits your project.",
      background: "theme",
      random: true,
      links: [{
        href: "/about/get-started",
        title: "Get Started",
        type: "primary"
      }, {
        href: "https://canopy-iiif.github.io/app/docs/",
        title: "Read documentation",
        type: "secondary"
      }]
    }), "\n", _jsxs(Container, {
      children: [_jsx(_components.h2, {
        children: "Getting started"
      }), _jsx(_components.p, {
        children: "Canopy IIIF is an open-source static site generator designed for IIIF collections. This template is ready for your collection, context, and publishing."
      }), _jsx(_components.h3, {
        children: "Point to your collection"
      }), _jsxs(_components.ul, {
        children: ["\n", _jsxs(_components.li, {
          children: ["Open ", _jsx(_components.code, {
            children: "canopy.yml"
          }), " and set ", _jsx(_components.code, {
            children: "collection"
          }), " to the IIIF Collection you want to feature."]
        }), "\n", _jsxs(_components.li, {
          children: ["Review ", _jsx(_components.code, {
            children: "metadata"
          }), " and ", _jsx(_components.code, {
            children: "featured"
          }), " entries—adjust them to suit the facets and works you want to highlight."]
        }), "\n"]
      }), _jsx(_components.h3, {
        children: "Tune layouts and pages"
      }), _jsxs(_components.ul, {
        children: ["\n", _jsxs(_components.li, {
          children: ["Customize ", _jsx(_components.code, {
            children: "content/index.mdx"
          }), ", ", _jsx(_components.code, {
            children: "content/about/"
          }), ", and add new folders under ", _jsx(_components.code, {
            children: "content/"
          }), " for exhibits or guides."]
        }), "\n", _jsxs(_components.li, {
          children: ["Modify ", _jsx(_components.code, {
            children: "content/works/_layout.mdx"
          }), " to control how individual manifests render."]
        }), "\n", _jsxs(_components.li, {
          children: ["Update ", _jsx(_components.code, {
            children: "content/_app.mdx"
          }), " to adjust site-wide structure."]
        }), "\n", _jsx(_components.li, {
          children: "Browse the component catalog and usage patterns in the docs to extend the narrative beyond default manifests."
        }), "\n"]
      }), _jsx(RelatedItems, {
        top: 3
      })]
    })]
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
