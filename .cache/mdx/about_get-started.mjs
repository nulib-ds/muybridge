import {Fragment as _Fragment, jsx as _jsx, jsxs as _jsxs} from "react/jsx-runtime";
import {useMDXComponents as _provideComponents} from "@mdx-js/react";
function _createMdxContent(props) {
  const _components = {
    a: "a",
    code: "code",
    em: "em",
    h1: "h1",
    h2: "h2",
    li: "li",
    ol: "ol",
    p: "p",
    pre: "pre",
    strong: "strong",
    table: "table",
    tbody: "tbody",
    td: "td",
    th: "th",
    thead: "thead",
    tr: "tr",
    ul: "ul",
    ..._provideComponents(),
    ...props.components
  }, {Button, ButtonWrapper} = _components;
  if (!Button) _missingMdxReference("Button", true);
  if (!ButtonWrapper) _missingMdxReference("ButtonWrapper", true);
  return _jsxs(_Fragment, {
    children: [_jsx(_components.h1, {
      children: "Get Started"
    }), "\n", _jsx(_components.p, {
      children: "Stand up a Canopy project in just a few minutes: use the template, drop in your IIIF materials, and let GitHub Pages do the heavy lifting. This walkthrough keeps everything inside the browser so you can focus on getting to work building your narratives and leaving advanced customization for later."
    }), "\n", _jsxs(ButtonWrapper, {
      variant: "interstitial",
      text: "Build a new project from the template",
      children: [_jsx(Button, {
        href: "https://github.com/canopy-iiif/template",
        label: "canopy-iiif/template"
      }), _jsx(Button, {
        href: "https://canopy-iiif.github.io/app/docs/",
        label: "Documentation",
        variant: "secondary"
      })]
    }), "\n", _jsx(_components.h2, {
      children: "1. Create a new repository"
    }), "\n", _jsxs(_components.ol, {
      children: ["\n", _jsxs(_components.li, {
        children: ["Visit the ", _jsx(_components.strong, {
          children: _jsx(_components.a, {
            href: "https://github.com/canopy-iiif/template",
            children: "canopy-iiif/template"
          })
        }), " repository."]
      }), "\n", _jsx(_components.li, {
        children: "Be sure to login to GitHub if you haven’t already."
      }), "\n", _jsxs(_components.li, {
        children: ["Click ", _jsx(_components.strong, {
          children: "Use this template"
        }), " → ", _jsx(_components.strong, {
          children: "Create a new repository"
        }), "."]
      }), "\n", _jsxs(_components.li, {
        children: ["In the ", _jsx(_components.strong, {
          children: "General"
        }), " section choose your GitHub account or organization and give the repository a name (for example ", _jsx(_components.em, {
          children: "my-canopy-site"
        }), ")"]
      }), "\n", _jsxs(_components.li, {
        children: ["Under the ", _jsx(_components.strong, {
          children: "Configuration"
        }), ", choose the visibility as ", _jsx(_components.em, {
          children: "Public"
        }), " so Pages can publish."]
      }), "\n", _jsxs(_components.li, {
        children: ["Click ", _jsx(_components.strong, {
          children: "Create repository"
        }), ". GitHub then copies the template and wires up the workflows for you."]
      }), "\n"]
    }), "\n", _jsx(_components.h2, {
      children: "2. Publish with GitHub Pages"
    }), "\n", _jsxs(_components.p, {
      children: ["The template ships with a GitHub Pages workflow (", _jsx(_components.code, {
        children: ".github/workflows/pages.yml"
      }), ") that will host your project without requirement of a server. After each commit to ", _jsx(_components.code, {
        children: "main"
      }), " it will build and deploy your site automatically. To enable Pages for the first time:"]
    }), "\n", _jsxs(_components.ol, {
      children: ["\n", _jsxs(_components.li, {
        children: ["Go to ", _jsx(_components.strong, {
          children: "Settings → Pages"
        }), " in your new repository."]
      }), "\n", _jsxs(_components.li, {
        children: ["In the Build and deployment section, ensure ", _jsx(_components.strong, {
          children: "GitHub Actions"
        }), " is selected as the source (this may be already set)."]
      }), "\n", _jsxs(_components.li, {
        children: ["Navigate back to the ", _jsx(_components.strong, {
          children: "Code"
        }), " tab of your repository and select the ", _jsx(_components.em, {
          children: "gear"
        }), " icon ⚙️ next to the ", _jsx(_components.em, {
          children: "About"
        }), " section in the aside of the page."]
      }), "\n", _jsxs(_components.li, {
        children: ["Select the ", _jsx(_components.strong, {
          children: "Use your GitHub Pages website"
        }), " option and your unique site URL will appear."]
      }), "\n", _jsx(_components.li, {
        children: "Click Save changes and you will see link to your site populate in the About section."
      }), "\n"]
    }), "\n", _jsx(_components.p, {
      children: "That URL will be your public and published Canopy deployment hosted entirely by GitHub Pages. We now need to configure it to point to your IIIF collection and manifests to trigger a rebuild of Canopy."
    }), "\n", _jsxs(_components.h2, {
      children: ["3. Configure ", _jsx(_components.code, {
        children: "canopy.yml"
      })]
    }), "\n", _jsx(_components.pre, {
      children: _jsx(_components.code, {
        className: "language-yaml",
        children: "title: Zanzibar\ncollection:\n  - https://api.dc.library.northwestern.edu/api/v2/collections/073ad358-d5e9-495b-8cb5-58bd5ec4c189?as=iiif\nmanifest:\n  - https://api.dc.library.northwestern.edu/api/v2/works/a13433ae-fc9f-429a-82ed-f810c5680200?as=iiif\n  - https://api.dc.library.northwestern.edu/api/v2/works/fdaee3f6-ead3-4880-9969-1ce820e8581c?as=iiif\n  - https://api.dc.library.northwestern.edu/api/v2/works/261c3823-c82e-43b7-bba8-41046ce3a3dd?as=iiif\nmetadata:\n  - Subject\n  - Genre\nfeatured:\n  - https://api.dc.library.northwestern.edu/api/v2/works/38d10b34-26e0-49f5-a696-455a86f1d28f?as=iiif\n  - https://api.dc.library.northwestern.edu/api/v2/works/1d208792-6355-43df-99e1-ec5c965ee915?as=iiif\n  - https://api.dc.library.northwestern.edu/api/v2/works/a13433ae-fc9f-429a-82ed-f810c5680200?as=iiif\n  - https://api.dc.library.northwestern.edu/api/v2/works/fdaee3f6-ead3-4880-9969-1ce820e8581c?as=iiif\n"
      })
    }), "\n", _jsxs(_components.p, {
      children: ["Every template includes ", _jsx(_components.code, {
        children: "canopy.yml"
      }), " at the repository root. This single file drives the build of your Canopy site. Open it and replace the demo collection and featured manifests with your own. There are many other configuration options available (", _jsx(_components.a, {
        href: "https://canopy-iiif.github.io/app/docs/",
        children: "see documentation"
      }), "); but to get the most out of Canopy, you will want to set the following:"]
    }), "\n", _jsxs(_components.table, {
      children: [_jsx(_components.thead, {
        children: _jsxs(_components.tr, {
          children: [_jsx(_components.th, {
            children: "Syntax"
          }), _jsx(_components.th, {
            children: "Purpose"
          }), _jsx(_components.th, {})]
        })
      }), _jsxs(_components.tbody, {
        children: [_jsxs(_components.tr, {
          children: [_jsx(_components.td, {
            children: _jsx(_components.code, {
              children: "title"
            })
          }), _jsx(_components.td, {
            children: "The global site title."
          }), _jsx(_components.td, {
            children: "Optional"
          })]
        }), _jsxs(_components.tr, {
          children: [_jsx(_components.td, {
            children: _jsx(_components.code, {
              children: "collection"
            })
          }), _jsx(_components.td, {
            children: "A list of IIIF Collection URI(s) that Canopy will ingest."
          }), _jsx(_components.td, {
            children: "Optional"
          })]
        }), _jsxs(_components.tr, {
          children: [_jsx(_components.td, {
            children: _jsx(_components.code, {
              children: "manifest"
            })
          }), _jsx(_components.td, {
            children: "A list of IIIF Manifest URI(s) to add in addition to those in the Collection(s) above."
          }), _jsx(_components.td, {
            children: "Optional"
          })]
        }), _jsxs(_components.tr, {
          children: [_jsx(_components.td, {
            children: _jsx(_components.code, {
              children: "featured"
            })
          }), _jsx(_components.td, {
            children: "A list of IIIF Manifest URI(s) to highlight on the homepage."
          }), _jsx(_components.td, {
            children: "Optional"
          })]
        }), _jsxs(_components.tr, {
          children: [_jsx(_components.td, {
            children: _jsx(_components.code, {
              children: "metadata"
            })
          }), _jsx(_components.td, {
            children: "A list of Metadata label names you want to turn into search facets and UI components in your project."
          }), _jsx(_components.td, {
            children: "Optional"
          })]
        })]
      })]
    }), "\n", _jsxs(_components.ol, {
      children: ["\n", _jsxs(_components.li, {
        children: ["From the ", _jsx(_components.strong, {
          children: "Code"
        }), " tab, click the ", _jsx(_components.code, {
          children: "canopy.yml"
        }), " file to open it in the file viewer. Then click the pencil icon ✏️ in the upper right to edit the file directly in GitHub’s web editor."]
      }), "\n", _jsxs(_components.li, {
        children: ["Replace the demo URIs under ", _jsx(_components.code, {
          children: "collection"
        }), " and ", _jsx(_components.code, {
          children: "featured"
        }), " with your own Collection(s), Manifest(s), and desired metadata facets."]
      }), "\n", _jsxs(_components.li, {
        children: ["Click the ", _jsx(_components.strong, {
          children: "Commit changes"
        }), " button above the file viewer, and then confirm the commit again to save your changes and trigger a rebuild."]
      }), "\n"]
    }), "\n", _jsx(_components.h2, {
      children: "4. Visit your new site"
    }), "\n", _jsxs(_components.p, {
      children: ["After a few moments, your GitHub Actions workflow will complete building and deploying your site. You can monitor the progress by clicking the ", _jsx(_components.strong, {
        children: "Actions"
      }), " tab in your repository. Once the workflow completes successfully, visit your GitHub Pages URL (found in ", _jsx(_components.strong, {
        children: "Settings → Pages"
      }), " or the ", _jsx(_components.strong, {
        children: "About"
      }), " section of your repository) to see your new Canopy site live!"]
    }), "\n", _jsx(_components.h2, {
      children: "What’s next?"
    }), "\n", _jsxs(_components.ul, {
      children: ["\n", _jsxs(_components.li, {
        children: ["Configure your ", _jsx(_components.code, {
          children: "theme"
        }), " in ", _jsx(_components.code, {
          children: "canopy.yml"
        }), " to customize the look and feel and explore customizing further with ", _jsx(_components.code, {
          children: "TailwindCSS"
        }), " in ", _jsx(_components.code, {
          children: "/app/styles"
        }), "."]
      }), "\n", _jsxs(_components.li, {
        children: ["Create your own contextual pages under ", _jsx(_components.code, {
          children: "content/"
        }), " and link to manifests via ", _jsx(_components.code, {
          children: "referencedManifests"
        }), " frontmatter."]
      }), "\n", _jsxs(_components.li, {
        children: ["Add components referencing items in your collections using ", _jsx(_components.code, {
          children: "<Viewer />"
        }), ", ", _jsx(_components.code, {
          children: "<Image />"
        }), ", and ", _jsx(_components.code, {
          children: "<ReferencedItems />"
        }), " to enrich the storytelling."]
      }), "\n"]
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
