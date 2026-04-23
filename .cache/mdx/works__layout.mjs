/*<Container>
<Scroll
iiifContent={props.manifest.id}
options={{
offset: 16,
figure: {
aspectRatio: 1,
display: "thumbnail",
width: "200px",
},
}}
/>
</Container>*/
import {Fragment as _Fragment, jsx as _jsx, jsxs as _jsxs} from "react/jsx-runtime";
import {useMDXComponents as _provideComponents} from "@mdx-js/react";
import {Label, Summary, Metadata, RequiredStatement, References} from "@canopy-iiif/app/ui/server";
function _createMdxContent(props) {
  const {Container, Id, RelatedItems, Viewer} = {
    ..._provideComponents(),
    ...props.components
  };
  if (!Container) _missingMdxReference("Container", true);
  if (!Id) _missingMdxReference("Id", true);
  if (!RelatedItems) _missingMdxReference("RelatedItems", true);
  if (!Viewer) _missingMdxReference("Viewer", true);
  return _jsxs(_Fragment, {
    children: [_jsxs(Container, {
      variant: "wide",
      className: "canopy-work--layout",
      children: [_jsx("div", {
        className: "canopy-work--primary",
        children: _jsx(Viewer, {
          iiifContent: props.manifest.id
        })
      }), _jsxs("div", {
        className: "canopy-work--secondary",
        children: [_jsxs("header", {
          children: [_jsx(Label, {
            manifest: props.manifest,
            as: "h1"
          }), _jsx(Summary, {
            manifest: props.manifest,
            as: "p",
            className: "canopy-lead"
          })]
        }), _jsxs("div", {
          children: [_jsx(References, {}), _jsx(Metadata, {
            manifest: props.manifest
          }), _jsx(RequiredStatement, {
            manifest: props.manifest
          }), _jsx(Id, {
            id: props.manifest.id
          })]
        })]
      })]
    }), "\n", "\n", _jsxs(Container, {
      children: [_jsx("h2", {
        children: "Related Items"
      }), _jsx(RelatedItems, {
        iiifContent: props.manifest.id,
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
