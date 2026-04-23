import {Fragment as _Fragment, jsx as _jsx, jsxs as _jsxs} from "react/jsx-runtime";
import {useMDXComponents as _provideComponents} from "@mdx-js/react";
import {CanopyDiagram} from "@canopy-iiif/app/ui/server";
function _createMdxContent(props) {
  const _components = {
    a: "a",
    code: "code",
    em: "em",
    h1: "h1",
    h2: "h2",
    li: "li",
    p: "p",
    strong: "strong",
    ul: "ul",
    ..._provideComponents(),
    ...props.components
  }, {Button, ButtonWrapper, Image, ReferencedItems} = _components;
  if (!Button) _missingMdxReference("Button", true);
  if (!ButtonWrapper) _missingMdxReference("ButtonWrapper", true);
  if (!Image) _missingMdxReference("Image", true);
  if (!ReferencedItems) _missingMdxReference("ReferencedItems", true);
  return _jsxs(_Fragment, {
    children: [_jsx(_components.h1, {
      children: "About"
    }), "\n", _jsxs(_components.p, {
      children: ["Using ", _jsx(_components.a, {
        href: "https://iiif.io/api/presentation/3.0/#21-defined-types",
        children: "IIIF collections and manifests"
      }), " as a data source, Canopy IIIF (Canopy) generates a scholarly digital projects platform that transforms provided digital collections into an accessible, discoverable research environment. Built on modern web standards and leveraging the interoperability of IIIF, Canopy creates static sites that extend existing IIIF resources while providing advanced localized search capabilities, contextual navigation, and customizable presentation layers."]
    }), "\n", _jsxs(ButtonWrapper, {
      variant: "interstitial",
      text: "Have an idea for a project?",
      children: [_jsx(Button, {
        href: "/about/get-started",
        label: "Get started"
      }), _jsx(Button, {
        href: "https://canopy-iiif.github.io/app/docs/",
        label: "Read documentation",
        variant: "secondary"
      })]
    }), "\n", _jsx(_components.h2, {
      children: "Overview"
    }), "\n", _jsx(_components.p, {
      children: "Picture a scenario where we have three providers with digitized items relating to a famous individual:"
    }), "\n", _jsxs(_components.ul, {
      children: ["\n", _jsxs(_components.li, {
        children: [_jsx(_components.em, {
          children: "30 manifests"
        }), " of manuscripts from ", _jsx(_components.strong, {
          children: "Collection A"
        }), ";"]
      }), "\n", _jsxs(_components.li, {
        children: [_jsx(_components.em, {
          children: "15 manifests"
        }), " of portraits from ", _jsx(_components.strong, {
          children: "Collection B"
        }), ";"]
      }), "\n", _jsxs(_components.li, {
        children: ["and ", _jsx(_components.em, {
          children: "5 manifests"
        }), " of scrapbooks sourced ", _jsx(_components.strong, {
          children: "directly"
        }), " and not part of structured collection."]
      }), "\n"]
    }), "\n", _jsx(_components.p, {
      children: "A team is tasked with building out a unified digital project for these items that allows users to browse their content, as well as interact with contextual essays, timelines, and maps. By using Canopy, implementers can quickly stand-up a working project with every manifest becoming its own work page, authored Markdown files providing context, and both streams feeding a shared search index before everything is written out to static HTML, CSS, and data assets. The diagram below walks through that pipeline so you can see how these raw manifests become a ready-to-host digital project."
    }), "\n", _jsx(CanopyDiagram, {}), "\n", _jsxs(_components.p, {
      children: ["Comprehensive ", _jsx(_components.a, {
        href: "https://canopy-iiif.github.io/app/docs/",
        children: "documentation"
      }), " is integrated into the application and serves as both a development guide and a demonstration of Canopy's potential for digital scholarship and humanities projects. To highlight what Canopy can do, this paragraph is authored in markdown from ", _jsx(_components.a, {
        href: "https://github.com/canopy-iiif/template/blob/main/content/about/index.mdx?plain=1",
        children: "a simple text file"
      }), " and below is an example of an ", _jsx(_components.code, {
        children: "<Image>"
      }), " component rendering a IIIF image resource along with an inline annotation and caption. This same image is provided by Northwestern University Libraries as a ", _jsx(_components.a, {
        href: "https://api.dc.library.northwestern.edu/api/v2/works/4bdb5a22-6c7f-498d-8e6e-e49ea9bc4778?as=iiif",
        children: "IIIF Manifest"
      }), " from their ", _jsx(_components.a, {
        href: "https://dc.library.northwestern.edu/items/4bdb5a22-6c7f-498d-8e6e-e49ea9bc4778",
        children: "Digital Collections platform"
      }), " and ", _jsx(_components.a, {
        href: "https://canopy-iiif.github.io/app/works/the-town-and-pass-of-boondi-in-rajpootana.html",
        children: "aggregated into this project"
      }), " as a static page during the Canopy build process."]
    }), "\n", _jsx(Image, {
      src: "https://iiif.dc.library.northwestern.edu/iiif/3/138a94b0-175a-4152-98c7-df58661ce7d5",
      isTiledImage: true,
      height: "500px",
      alt: "Painting of the The town & pass of Boondi, in Rajpootana",
      caption: "The town & pass of Boondi, in Rajpootana - Situated on a southern slope of a hill at the end of a long range, the town of Boondi was the capital of the Rajput principality of that name. The palace of the Raja is a large masonry stone building about half way up the hill, according to Grindlay, with a kind of fortification extending to the top.",
      annotations: [{
        annotation: {
          id: "https://iiif.dc.library.northwestern.edu/iiif/3/f7409acd-e3f9-496a-b733-81f46d4ffa4f/annotation/0",
          type: "Annotation",
          motivation: ["tagging"],
          body: [{
            id: "https://iiif.dc.library.northwestern.edu/iiif/3/f7409acd-e3f9-496a-b733-81f46d4ffa4f/annotation/0/body/0",
            type: "TextualBody",
            value: "Five individuals traveling."
          }],
          target: {
            type: "SpecificResource",
            source: {
              id: "https://iiif.dc.library.northwestern.edu/iiif/3/f7409acd-e3f9-496a-b733-81f46d4ffa4f/canvas/1",
              type: "Canvas"
            },
            selector: {
              type: "FragmentSelector",
              value: "xywh=1900,4050,1500,1000"
            }
          }
        },
        targetIndex: 0
      }]
    }), "\n", _jsxs(_components.p, {
      children: ["As authors create content using Markdown, they can reference the source material directly within the text using the ", _jsx(_components.code, {
        children: "<ReferencedItems />"
      }), " component below. This component dynamically generates a list of all IIIF Manifests that have been explicitly referenced within the markdown content of the page."]
    }), "\n", _jsx(ReferencedItems, {}), "\n", _jsx(_components.h2, {
      children: "Colophon"
    }), "\n", _jsxs(_components.p, {
      children: ["Canopy was created by ", _jsx(_components.a, {
        href: "https://github.com/mathewjordan",
        children: "Mat Jordan"
      }), " ", _jsx(_components.em, {
        children: "(Northwestern University)"
      }), " and ", _jsx(_components.a, {
        href: "https://github.com/markpbaggett",
        children: "Mark Baggett"
      }), " ", _jsx(_components.em, {
        children: "(Texas A&M University)"
      }), " as a method to quickly build exhibit style digital humanities projects that extend existing digital collections using IIIF Collections and Manifests. It continues to be an active open-source initiative of ", _jsx(_components.a, {
        href: "https://www.library.northwestern.edu/",
        children: "Northwestern University Libraries"
      }), ", where it supports digital scholarship in many forms. This example site is built from the ", _jsx(_components.a, {
        href: "https://dc.library.northwestern.edu/collections/94536627-cfdf-413c-852b-0cb16d986da3",
        children: "Donald K. Adams and Lawrence D. Stewart Collection of Prints"
      }), " and the ", _jsx(_components.a, {
        href: "https://dc.library.northwestern.edu/collections/7ac5769f-a1d9-4227-a350-bf8bd8b1cddc",
        children: "Indian Paintings on Mica"
      }), " collection hosted by Northwestern University Libraries' ", _jsx(_components.a, {
        href: "https://dc.library.northwestern.edu/",
        children: "Digital Collections"
      }), "."]
    }), "\n", _jsxs(_components.p, {
      children: ["Canopy uses the ", _jsx(_components.a, {
        href: "https://iiif.io/api/presentation/3.0/",
        children: "IIIF Presentation API"
      }), " to deliver rich media from providing institutions, ", _jsx(_components.a, {
        href: "https://mdxjs.com/",
        children: "Markdown as MDX"
      }), " for authoring contextual content and layout, ", _jsx(_components.a, {
        href: "https://tailwindcss.com/",
        children: "TailwindCSS"
      }), " for the user interface, and a static ", _jsx(_components.a, {
        href: "https://github.com/nextapps-de/flexsearch",
        children: "FlexSearch"
      }), " index for search. Easy aggregation and retrieval of IIIF resources is made possible by the ", _jsx(_components.a, {
        href: "https://github.com/IIIF-Commons/iiif-helpers",
        children: "IIIF helpers"
      }), " developed by ", _jsx(_components.a, {
        href: "https://github.com/stephenwf",
        children: "Stephen Fraser"
      }), ". In addition, ", _jsx(_components.a, {
        href: "https://github.com/samvera-labs/clover-iiif",
        children: "Clover IIIF"
      }), ", developed by Northwestern University Libraries with contributions from other institutions, is integral to Canopy and provides the rendering of IIIF resources, annotations, and metadata throughout the interface."]
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
