import {Fragment as _Fragment, jsx as _jsx, jsxs as _jsxs} from "react/jsx-runtime";
import {useMDXComponents as _provideComponents} from "@mdx-js/react";
function _createMdxContent(props) {
  const _components = {
    a: "a",
    blockquote: "blockquote",
    code: "code",
    del: "del",
    em: "em",
    h1: "h1",
    h2: "h2",
    h3: "h3",
    img: "img",
    input: "input",
    li: "li",
    ol: "ol",
    p: "p",
    pre: "pre",
    section: "section",
    strong: "strong",
    sup: "sup",
    table: "table",
    tbody: "tbody",
    td: "td",
    th: "th",
    thead: "thead",
    tr: "tr",
    ul: "ul",
    ..._provideComponents(),
    ...props.components
  }, {Button, ButtonWrapper, Image, Map, MapPoint, Slider, Timeline, TimelinePoint, Viewer} = _components;
  if (!Button) _missingMdxReference("Button", true);
  if (!ButtonWrapper) _missingMdxReference("ButtonWrapper", true);
  if (!Image) _missingMdxReference("Image", true);
  if (!Map) _missingMdxReference("Map", true);
  if (!MapPoint) _missingMdxReference("MapPoint", true);
  if (!Slider) _missingMdxReference("Slider", true);
  if (!Timeline) _missingMdxReference("Timeline", true);
  if (!TimelinePoint) _missingMdxReference("TimelinePoint", true);
  if (!Viewer) _missingMdxReference("Viewer", true);
  return _jsxs(_Fragment, {
    children: [_jsx(_components.h1, {
      children: "Content Example"
    }), "\n", _jsxs(_components.p, {
      children: ["This demonstration page collects a dense set of markdown formatting examples so writers can scan common patterns, review syntax in context, and adapt the snippets when drafting their own Canopy IIIF content. Use this example page to see how core you can easily add IIIF-aware components inside your markdown content and learn how to use ", _jsx(_components.a, {
        href: "https://canopy-iiif.github.io/app/docs/components/image",
        children: "Image"
      }), ", ", _jsx(_components.a, {
        href: "https://canopy-iiif.github.io/app/docs/components/viewer",
        children: "Viewer"
      }), ", ", _jsx(_components.a, {
        href: "https://canopy-iiif.github.io/app/docs/components/map",
        children: "Map"
      }), ", ", _jsx(_components.a, {
        href: "https://canopy-iiif.github.io/app/docs/components/slider",
        children: "Slider"
      }), ", and ", _jsx(_components.a, {
        href: "https://canopy-iiif.github.io/app/docs/components/timeline",
        children: "Timeline"
      }), "."]
    }), "\n", _jsxs(ButtonWrapper, {
      variant: "interstitial",
      text: "See how this page is authored",
      children: [_jsx(Button, {
        href: "https://github.com/canopy-iiif/template/blob/main/content/about/example.mdx?plain=1",
        label: "View source in GitHub"
      }), _jsx(Button, {
        href: "https://canopy-iiif.github.io/app/docs",
        label: "Browse docs",
        variant: "secondary"
      })]
    }), "\n", _jsx(_components.h2, {
      children: "Components"
    }), "\n", _jsx(_components.h3, {
      children: "Image"
    }), "\n", _jsxs(_components.p, {
      children: ["The ", _jsx(_components.code, {
        children: "<Image>"
      }), " component wraps Clover’s zoomable viewer so tiled IIIF imagery gains pan/zoom controls immediately. It’s ideal for highlighting details or pairing captions with large assets. Narratives can reference close-read details while the viewer keeps the render responsive, ensuring scholars can zoom into marginalia or annotations without leaving the flow of the prose."]
    }), "\n", _jsx(_components.p, {
      children: "Exhibits often pair short anecdotes or curatorial notes alongside a zoomed crop to guide attention. This makes the component perfect for layering storytelling over technical documentation, letting authors bridge archival description with interpretive copy in a single sweep of paragraphs."
    }), "\n", _jsx(Image, {
      src: "https://iiif.dc.library.northwestern.edu/iiif/3/3d4a01f1-664d-48aa-89b7-a887d3843644",
      isTiledImage: true,
      alt: "Lithographs of historic buildings in Lucknow, India",
      caption: "The Image component wraps Clover's zoomable viewer for IIIF Image API sources but can also render standard image URLs."
    }), "\n", _jsx(_components.h3, {
      children: "Viewer"
    }), "\n", _jsxs(_components.p, {
      children: [_jsx(_components.code, {
        children: "<Viewer>"
      }), " renders full manifests or collections via Clover, making it the go-to component for explorations that require canvases, audio/video, or multi-page navigation without leaving the document. It keeps navigation controls close at hand so readers dive into folios, listen to embedded recordings, or compare canvases while still following the surrounding essay."]
    }), "\n", _jsx(_components.p, {
      children: "Because the runtime reuses global viewer settings, editors can discuss sequencing decisions, cite particular canvases, or reference different manifestations of a work without duplicating markup. Use it when you want the narrative to feel like a guided tour that never requires a separate tab."
    }), "\n", _jsx(Viewer, {
      iiifContent: "https://api.dc.library.northwestern.edu/api/v2/works/2826e1b9-d38c-413d-b46f-4cd28d916b6d?as=iiif",
      options: {
        showTitle: true,
        informationPanel: {
          open: true,
          renderAbout: true
        }
      }
    }), "\n", _jsx(_components.h3, {
      children: "Map"
    }), "\n", _jsxs(_components.p, {
      children: ["Maps aggregate navPlace ", _jsx(_components.code, {
        children: "Point"
      }), " features and optional ", _jsx(_components.code, {
        children: "MapPoint"
      }), " callouts so geographic context sits alongside your prose. Use it for quick location overviews or to anchor itineraries. Authors can narrate journeys, trace expeditions, or compare regional clusters while markers update live, keeping spatial context woven into the storytelling."]
    }), "\n", _jsxs(_components.p, {
      children: ["When essays discuss routes or cite multiple repositories, sprinkling ", _jsx(_components.code, {
        children: "MapPoint"
      }), " entries reinforces scale and direction. The additional paragraph space lets you describe historical setting, travel logistics, or archival provenance while readers pan across the map."]
    }), "\n", _jsxs(Map, {
      children: [_jsx(MapPoint, {
        lat: "42.3763",
        lng: "-71.0603",
        title: "The Death of General Warren at the Battle of Bunker's Hill - 1775",
        summary: "A young Lieutenant Francis Rawdon, later Lord Hastings, is depicted prominently in the background, standing upon the American breastworks and waving the British ensign.",
        thumbnail: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/cf/The_Death_of_General_Warren_at_the_Battle_of_Bunker%27s_Hill.jpg/960px-The_Death_of_General_Warren_at_the_Battle_of_Bunker%27s_Hill.jpg"
      }), _jsx(MapPoint, {
        lat: "26.8709",
        lng: "80.9129",
        title: "Lucknow procession - 1814",
        summary: "Watercolour depicting Lord Francis Edward Rawdon-Hastings' party entering Lucknow on elephant back.",
        thumbnail: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/26/Lord_Hastings%27_party_entering_the_city_of_Lucknow_on_elephant_back_-_British_Library%2C_Add.Or.4749.jpg/640px-Lord_Hastings%27_party_entering_the_city_of_Lucknow_on_elephant_back_-_British_Library%2C_Add.Or.4749.jpg"
      }), _jsx(MapPoint, {
        lat: "35.8917",
        lng: "14.5050",
        title: "Tomb of Lord Hastings (d. 1826) - Valletta, Malta",
        summary: "Lord Hastings was appointed Governor of Malta in 1824, but died at sea near Naples (Napoli, Kingdom of the Two Sicilies) in 1826.",
        thumbnail: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a2/Malta_-_Valletta_-_Triq_il-Papa_Piju_V_-_Hastings_Gardens_-_Monument_to_Lord_Hastings_01_ies.jpg/960px-Malta_-_Valletta_-_Triq_il-Papa_Piju_V_-_Hastings_Gardens_-_Monument_to_Lord_Hastings_01_ies.jpg"
      })]
    }), "\n", _jsx(_components.h3, {
      children: "Timeline"
    }), "\n", _jsx(_components.p, {
      children: "The Timeline component spaces events proportionally and can cross-reference manifests, letting you mix narrative beats with IIIF resources for lightweight chronologies. Use it to anchor longer essays where context depends on precise sequencing, or to punctuate a dense narrative with milestones that remain interactive."
    }), "\n", _jsx(_components.p, {
      children: "Additional copy beneath the heading encourages readers to linger: outline curatorial themes, note historiographical debates, or call attention to metadata gaps that the timeline helps expose. It’s an easy way to pair transitional text with a structured visualization."
    }), "\n", _jsxs(Timeline, {
      title: "Empire in Moughal India",
      range: {
        start: "1750",
        end: "1900",
        granularity: "year"
      },
      steps: 50,
      height: "500px",
      children: [_jsx(TimelinePoint, {
        date: "1770",
        title: "Great Bengal Famine",
        summary: "Starvation ravaged Company-controlled Bengal."
      }), _jsx(TimelinePoint, {
        date: "1781",
        title: "Bengal Atlas published",
        summary: "James Rennell mapped Eastern India for Company campaigns.",
        referencedManifests: ["https://api.dc.library.northwestern.edu/api/v2/works/7a5dd871-d0bc-4d6f-8469-1c23a872fc29?as=iiif"]
      }), _jsx(TimelinePoint, {
        date: "1857",
        title: "Great Mutiny",
        summary: "Indian regiments rebelled across the north.",
        highlight: true,
        referencedManifests: ["https://api.dc.library.northwestern.edu/api/v2/works/c5a11577-a1f2-4288-95de-96ad616174ed?as=iiif"]
      })]
    }), "\n", _jsxs(_components.p, {
      children: ["Uniform spacing offers another editorial option when you want each beat to occupy the same amount of vertical space regardless of its date. Set ", _jsx(_components.code, {
        children: "scale=\"uniform\""
      }), " on the wrapper to keep the layout steady while still labeling points with their real timestamps."]
    }), "\n", _jsxs(Timeline, {
      title: "Curatorial milestones",
      description: "Museum-side checkpoints without proportional spacing.",
      scale: "uniform",
      height: "420px",
      children: [_jsx(TimelinePoint, {
        date: "1932",
        title: "Acquisition",
        summary: "Collection enters the museum holdings."
      }), _jsx(TimelinePoint, {
        date: "1979",
        title: "Restoration",
        summary: "Conservation team stabilizes fragile pigments."
      }), _jsx(TimelinePoint, {
        date: "1996",
        title: "Loan",
        summary: "Travels internationally for a focused exhibition."
      }), _jsx(TimelinePoint, {
        date: "2022",
        title: "Digitization",
        summary: "Captured as IIIF with new interpretation."
      })]
    }), "\n", _jsx(_components.h3, {
      children: "Slider"
    }), "\n", _jsx(_components.p, {
      children: "Sliders turn IIIF Collections or generated facet feeds into swipeable strips of cards that link back to work pages, perfect for highlighting themes without overwhelming the layout. They shine in sections where you want to highlight parallels—perhaps comparing textiles, portraits, or cartographic plates across decades—without building a bespoke gallery."
    }), "\n", _jsx(_components.p, {
      children: "Because each slide resolves to a local work page, you can write connective prose before and after the carousel, using the extra paragraph to explain why these records belong together, what facets tie them, or which metadata values curated the set."
    }), "\n", _jsx(Slider, {
      iiifContent: "https://api.dc.library.northwestern.edu/api/v2/collections/7ac5769f-a1d9-4227-a350-bf8bd8b1cddc?as=iiif"
    }), "\n", _jsx(_components.h2, {
      children: "Basic Emphasis and Structure"
    }), "\n", _jsxs(_components.p, {
      children: ["Paragraphs can mix ", _jsx(_components.em, {
        children: "italics"
      }), ", ", _jsx(_components.strong, {
        children: "bold"
      }), ", and ", _jsx(_components.strong, {
        children: _jsx(_components.em, {
          children: "bold italics"
        })
      }), " alongside ", _jsx(_components.code, {
        children: "inline code"
      }), " to highlight commands or filenames. Use ", _jsx(_components.del, {
        children: "strikethrough"
      }), " sparingly when documenting deprecated options, and remember that ", _jsx(_components.a, {
        href: "https://example.com/reference",
        children: "links to references"
      }), " can sit inline with other text. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Integer tincidunt efficitur eros, in porta mauris vel sapien sagittis, auctor feugiat orci malesuada. Vestibulum rhoncus libero eget urna bibendum, a accumsan nisl porttitor. Nulla facilisi, phasellus posuere pulvinar ligula, fermentum elementum velit."]
    }), "\n", _jsx(_components.h3, {
      children: "Nested Elements"
    }), "\n", _jsxs(_components.ol, {
      children: ["\n", _jsxs(_components.li, {
        children: ["Ordered lists keep steps clear:", "\n", _jsxs(_components.ol, {
          children: ["\n", _jsx(_components.li, {
            children: "Gather materials with curae facilisis lorem."
          }), "\n", _jsx(_components.li, {
            children: "Mix instructions and annotate with semicolons."
          }), "\n", _jsx(_components.li, {
            children: "Confirm results feel coherent."
          }), "\n"]
        }), "\n"]
      }), "\n", _jsx(_components.li, {
        children: "The second big step encourages variation with gravida ipsum."
      }), "\n", _jsxs(_components.li, {
        children: ["Final checks celebrate the finished section while referencing footnotes", _jsx(_components.sup, {
          children: _jsx(_components.a, {
            href: "#user-content-fn-1",
            id: "user-content-fnref-1",
            "data-footnote-ref": true,
            "aria-describedby": "footnote-label",
            children: "1"
          })
        }), "."]
      }), "\n"]
    }), "\n", _jsxs(_components.ul, {
      children: ["\n", _jsxs(_components.li, {
        children: ["Unordered lists highlight key takeaways:", "\n", _jsxs(_components.ul, {
          children: ["\n", _jsx(_components.li, {
            children: "Combine typography tricks."
          }), "\n", _jsx(_components.li, {
            children: "Sprinkle latin filler where helpful."
          }), "\n", _jsx(_components.li, {
            children: "Repeat motifs to boost rhythm."
          }), "\n"]
        }), "\n"]
      }), "\n", _jsx(_components.li, {
        children: "Mixing ordered and unordered structures demonstrates interplay."
      }), "\n"]
    }), "\n", _jsxs(_components.blockquote, {
      children: ["\n", _jsx(_components.p, {
        children: "Blockquotes introduce context or testimonials. \"Praesent feugiat molestie risus, sed tempor nibh pulvinar at,\" according to a helpful reviewer, who praised the structured approach to formatting."
      }), "\n"]
    }), "\n", _jsx(_components.h3, {
      children: "Images and Captions"
    }), "\n", _jsx(_components.p, {
      children: _jsx(_components.img, {
        src: "https://picsum.photos/seed/canopy-gradient/800/360",
        alt: "Soft gradient abstract art"
      })
    }), "\n", _jsx(_components.p, {
      children: _jsx(_components.img, {
        src: "https://picsum.photos/seed/canopy-stacks/800/360",
        alt: "Stacked archival boxes"
      })
    }), "\n", _jsx(_components.p, {
      children: "The preceding pair of image embeds illustrate that multiple figures may appear in one section, each with descriptive alt text to maintain accessibility. Fusce eget tortor tellus, et imperdiet tortor. Aenean sed lorem egestas, elementum risus sed, interdum lacus."
    }), "\n", _jsx(_components.h2, {
      children: "Tables and Definition Lists"
    }), "\n", _jsxs(_components.table, {
      children: [_jsx(_components.thead, {
        children: _jsxs(_components.tr, {
          children: [_jsx(_components.th, {
            children: "Feature"
          }), _jsx(_components.th, {
            children: "Syntax"
          }), _jsx(_components.th, {
            children: "Notes"
          })]
        })
      }), _jsxs(_components.tbody, {
        children: [_jsxs(_components.tr, {
          children: [_jsx(_components.td, {
            children: "Tables"
          }), _jsx(_components.td, {
            children: _jsx(_components.code, {
              children: "| col |"
            })
          }), _jsx(_components.td, {
            children: "Align columns with header separators."
          })]
        }), _jsxs(_components.tr, {
          children: [_jsx(_components.td, {
            children: "Footnotes"
          }), _jsx(_components.td, {
            children: _jsx(_components.code, {
              children: "[^1]"
            })
          }), _jsx(_components.td, {
            children: "Place the reference, then define it later."
          })]
        }), _jsxs(_components.tr, {
          children: [_jsx(_components.td, {
            children: "Images"
          }), _jsx(_components.td, {
            children: _jsx(_components.code, {
              children: "![alt](url)"
            })
          }), _jsx(_components.td, {
            children: "Provide helpful descriptions."
          })]
        }), _jsxs(_components.tr, {
          children: [_jsx(_components.td, {
            children: "Code"
          }), _jsx(_components.td, {
            children: _jsx(_components.code, {
              children: "```lang ```"
            })
          }), _jsx(_components.td, {
            children: "Choose a language hint for clarity."
          })]
        })]
      })]
    }), "\n", _jsx(_components.p, {
      children: "Term\n: Definition lists offer another way to link concepts with details, lorem ipsum dolor sit amet consectetur adipiscing elit."
    }), "\n", _jsx(_components.p, {
      children: "Another Term\n: Add additional explanation to keep momentum, maecenas id posuere orci varius natoque penatibus magnis parturient."
    }), "\n", _jsx(_components.h2, {
      children: "Code Blocks"
    }), "\n", _jsx(_components.pre, {
      children: _jsx(_components.code, {
        className: "language-txt",
        children: "## Sample Code Block\n\nAdd a code block with triple backticks, specify a language for syntax highlighting\nand include optional filename and copy attributes for enhanced display.\n"
      })
    }), "\n", _jsx(_components.h3, {
      children: "Task Lists & Callouts"
    }), "\n", _jsxs(_components.ul, {
      className: "contains-task-list",
      children: ["\n", _jsxs(_components.li, {
        className: "task-list-item",
        children: [_jsx(_components.input, {
          type: "checkbox",
          checked: true,
          disabled: true
        }), " ", "Capture checklists that double as project trackers."]
      }), "\n", _jsxs(_components.li, {
        className: "task-list-item",
        children: [_jsx(_components.input, {
          type: "checkbox",
          disabled: true
        }), " ", "Keep at least one open item for future edits."]
      }), "\n", _jsxs(_components.li, {
        className: "task-list-item",
        children: [_jsx(_components.input, {
          type: "checkbox",
          checked: true,
          disabled: true
        }), " ", "Demonstrate GitHub flavored markdown compatibility."]
      }), "\n"]
    }), "\n", _jsxs(_components.blockquote, {
      children: ["\n", _jsxs(_components.p, {
        children: [_jsx(_components.strong, {
          children: "Note:"
        }), " Donec fermentum libero et laoreet dictum. Integer hendrerit efficitur nisl, sed convallis sem."]
      }), "\n"]
    }), "\n", _jsx(_components.h2, {
      children: "Long Form Content"
    }), "\n", _jsx(_components.h3, {
      children: "Paragraph Section"
    }), "\n", _jsx(_components.p, {
      children: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vivamus scelerisque, mi sed lacinia posuere, nulla augue aliquet arcu, nec pharetra augue nisi non erat. Nunc a augue ultricies risus tempor volutpat. Mauris non metus ac neque interdum porta, curabitur laoreet. Integer posuere interdum sem, ac porttitor arcu pellentesque id. Duis elementum dui vitae magna fermentum, non euismod tellus ullamcorper. Sed vehicula libero vel sapien tempor sodales. Maecenas in lectus ac felis hendrerit congue non nec lectus. Vestibulum ante ipsum primis in faucibus orci luctus et ultrices posuere cubilia curae; Integer blandit mauris id ligula porttitor, eget rutrum magna convallis. Phasellus facilisis elit sed felis aliquet convallis. Donec sit amet luctus odio, eget dignissim justo. Ut consequat ipsum sed arcu commodo finibus a nec libero. Duis at ligula porttitor, dapibus ex sit amet, ullamcorper neque."
    }), "\n", _jsx(_components.p, {
      children: "Proin venenatis fermentum vulputate. Sed tristique elit libero, sed efficitur quam aliquam id. Sed risus magna, aliquam id ex ac, gravida luctus mi. Vestibulum viverra aliquam mi eget tincidunt. Pellentesque eu egestas risus. Nam facilisis viverra nibh, id gravida augue malesuada ac. Ut sagittis pretium leo, eget sollicitudin arcu facilisis in. Pellentesque vel imperdiet dui. Integer ut lorem et justo rhoncus faucibus consectetur ut velit. Sed sed condimentum sem. Etiam tempor sagittis odio quis tincidunt. Nam nec volutpat ex. Fusce aliquam vestibulum mauris, ac lobortis tellus facilisis non. Mauris facilisis tincidunt neque, eget fermentum sapien fringilla sed. Pellentesque sollicitudin, enim ac elementum luctus, lacus nisi lacinia erat, vitae dapibus nisi diam vitae est."
    }), "\n", _jsxs(Timeline, {
      title: "Road to Indian Independence",
      range: {
        start: "1910",
        end: "1950",
        granularity: "year"
      },
      height: "700px",
      children: [_jsx(TimelinePoint, {
        date: "1919",
        title: "Jallianwala Bagh Massacre",
        summary: "British troops fired on peaceful protestors in Amritsar, accelerating nationalist resistance."
      }), _jsx(TimelinePoint, {
        date: "1920",
        title: "Non-Cooperation Movement",
        summary: "Gandhi led a mass boycott of British institutions, making the movement nationwide."
      }), _jsx(TimelinePoint, {
        date: "1930",
        title: "Salt March (Dandi March)",
        summary: "Gandhi led a 240-mile march to the sea to protest the British salt tax, sparking civil disobedience."
      }), _jsx(TimelinePoint, {
        date: "1942",
        title: "Quit India Movement",
        summary: "The Congress Party demanded immediate British withdrawal; mass arrests followed but pressure intensified."
      }), _jsx(TimelinePoint, {
        date: "1947",
        highlight: true,
        title: "Independence & Partition",
        summary: "British rule ended; India and Pakistan were created amid mass migration and violence."
      })]
    }), "\n", _jsx(_components.h3, {
      children: "Another Paragraph Section"
    }), "\n", _jsx(_components.p, {
      children: "Curabitur lobortis risus velit, quis sagittis sem dignissim non. Phasellus feugiat massa et lacus facilisis viverra. Donec metus quam, lacinia sed gravida eget, ullamcorper nec dui. Vivamus faucibus tortor sit amet libero venenatis accumsan. Vivamus mattis, nisl quis laoreet bibendum, velit ligula laoreet magna, ac interdum dui turpis a arcu. Aenean diam velit, convallis nec gravida sed, maximus ultrices erat. Integer scelerisque orci metus, condimentum ultricies ligula varius vel. Pellentesque semper eros sit amet hendrerit imperdiet. Proin porttitor bibendum augue vitae imperdiet. Nam vulputate nisi maximus facilisis porttitor. Suspendisse imperdiet mauris vitae metus ornare tristique. Integer posuere aliquam lorem non ultrices. Vestibulum facilisis sodales commodo. Duis vestibulum mauris nec sem suscipit tincidunt. Suspendisse porttitor orci pellentesque augue commodo tempus."
    }), "\n", _jsx(Image, {
      src: "https://iiif.dc.library.northwestern.edu/iiif/3/3d4a01f1-664d-48aa-89b7-a887d3843644",
      isTiledImage: true,
      alt: "Lithographs of historic buildings in Lucknow, India",
      caption: "The Image component wraps Clover's zoomable viewer for IIIF Image API sources but can also render standard image URLs."
    }), "\n", _jsxs(_components.p, {
      children: ["Aliquam et lectus lacinia, vestibulum lectus sed, dignissim ipsum. Nullam tincidunt feugiat dapibus. Duis pharetra nisl justo, id hendrerit odio pretium id. Donec dignissim vulputate arcu vitae cursus. Cras pretium fringilla risus, eget viverra quam suscipit a. In eu scelerisque arcu. Sed viverra, risus vitae aliquet gravida, risus lectus tincidunt justo, quis aliquet lectus augue ut odio. Aenean elementum diam urna. Ut sed gravida velit. Suspendisse lacus eros, vulputate at risus nec, laoreet sollicitudin leo. Vivamus scelerisque dignissim volutpat. Nullam bibendum ante ante, ac faucibus justo interdum vitae. Sed vitae dictum ligula, nec faucibus augue. Vivamus quis ante diam.", _jsx(_components.sup, {
        children: _jsx(_components.a, {
          href: "#user-content-fn-3",
          id: "user-content-fnref-3",
          "data-footnote-ref": true,
          "aria-describedby": "footnote-label",
          children: "2"
        })
      })]
    }), "\n", _jsx(_components.h2, {
      children: "Tabled Content"
    }), "\n", _jsxs(_components.table, {
      children: [_jsx(_components.thead, {
        children: _jsxs(_components.tr, {
          children: [_jsx(_components.th, {
            children: "Category"
          }), _jsx(_components.th, {
            children: "Description"
          }), _jsx(_components.th, {
            children: "Example"
          })]
        })
      }), _jsxs(_components.tbody, {
        children: [_jsxs(_components.tr, {
          children: [_jsx(_components.td, {
            children: "Highlight"
          }), _jsx(_components.td, {
            children: "Donec vulputate ligula nisl, a pulvinar enim rhoncus sed."
          }), _jsx(_components.td, {
            children: _jsx(_components.code, {
              children: "highlighted()"
            })
          })]
        }), _jsxs(_components.tr, {
          children: [_jsx(_components.td, {
            children: "Reference"
          }), _jsx(_components.td, {
            children: "Nulla pellentesque erat id ligula dictum, gravida porttitor nisi efficitur."
          }), _jsx(_components.td, {
            children: "Reference text"
          })]
        }), _jsxs(_components.tr, {
          children: [_jsx(_components.td, {
            children: "Context"
          }), _jsx(_components.td, {
            children: "Suspendisse nunc neque, pellentesque ac massa sed, posuere varius dui."
          }), _jsx(_components.td, {
            children: "Contextual cues"
          })]
        }), _jsxs(_components.tr, {
          children: [_jsx(_components.td, {
            children: "Outcome"
          }), _jsx(_components.td, {
            children: "Etiam posuere velit nec massa aliquet condimentum."
          }), _jsx(_components.td, {
            children: "Success path"
          })]
        })]
      })]
    }), "\n", _jsxs(_components.p, {
      children: ["Praesent ornare arcu vitae nibh convallis cursus. Pellentesque ac neque risus. Nulla facilisi. Sed nisl lorem, mollis a odio sit amet, dictum ultricies mauris. Suspendisse eget ipsum nec sem commodo eleifend. Nulla pharetra ante eu dui porttitor pellentesque. Vestibulum lacinia purus vitae arcu aliquam, vitae ultrices mi pellentesque. Praesent feugiat est sed odio laoreet tempus. Etiam vestibulum aliquet risus, id porta leo suscipit eget.", _jsx(_components.sup, {
        children: _jsx(_components.a, {
          href: "#user-content-fn-5",
          id: "user-content-fnref-5",
          "data-footnote-ref": true,
          "aria-describedby": "footnote-label",
          children: "3"
        })
      })]
    }), "\n", _jsx(_components.h2, {
      children: "Detailed Walkthroughs"
    }), "\n", _jsx(_components.h3, {
      children: "Step-by-Step Narrative"
    }), "\n", _jsxs(_components.ol, {
      children: ["\n", _jsx(_components.li, {
        children: "Begin with a precise description that explains the workflow and ties every action back to a practical goal; lorem ipsum dolor sit amet, consectetur adipiscing elit. Fusce hendrerit turpis sed lacus porta, id suscipit urna faucibus."
      }), "\n", _jsx(_components.li, {
        children: "Analyze context by referencing supporting material and by sprinkling in clarifying statements, etiam laoreet nulla nec condimentum egestas."
      }), "\n", _jsx(_components.li, {
        children: "Execute the sequence, verifying that each sub-step remains legible; proin ullamcorper semper elit, ut varius purus varius at."
      }), "\n", _jsx(_components.li, {
        children: "Wrap up with reflections, morbi ac arcu hendrerit, ornare ipsum non, rutrum lectus."
      }), "\n"]
    }), "\n", _jsx(_components.h3, {
      children: "Supporting Paragraphs"
    }), "\n", _jsx(_components.p, {
      children: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vivamus sed sapien dui. Proin molestie volutpat venenatis. Pellentesque efficitur luctus nibh quis luctus. Nullam odio odio, posuere fermentum pretium eget, fermentum vitae lectus. Duis a ipsum augue. Pellentesque eu dui ac odio feugiat euismod vitae vitae neque. Donec massa nisl, pellentesque eget metus fermentum, vehicula cursus tellus. Suspendisse venenatis justo nisi, in laoreet neque feugiat quis. Curabitur auctor interdum facilisis. Nulla vel convallis magna. Vestibulum aliquet sapien quis ante vehicula, vitae vulputate est fermentum. Pellentesque hendrerit, dui vel accumsan ornare, neque massa dictum erat, ac imperdiet mauris nulla at lorem."
    }), "\n", _jsx(_components.p, {
      children: "Sed posuere fermentum lacus, efficitur tincidunt mauris luctus eget. Etiam sed tempor erat. Etiam vel gravida leo, vel elementum ipsum. Integer consequat sagittis sem id blandit. Pellentesque rutrum sed ante non molestie. Suspendisse rhoncus urna at urna molestie, ut faucibus dui porttitor. Suspendisse potenti. Fusce et dictum enim. Donec pulvinar quam non leo interdum malesuada. Phasellus consectetur lacus non dolor placerat, at tempor urna interdum. Phasellus tempor facilisis iaculis. Pellentesque pharetra convallis libero non dignissim."
    }), "\n", _jsxs(_components.table, {
      children: [_jsx(_components.thead, {
        children: _jsxs(_components.tr, {
          children: [_jsx(_components.th, {
            children: "Phase"
          }), _jsx(_components.th, {
            children: "Focus"
          }), _jsx(_components.th, {
            children: "Outcome"
          })]
        })
      }), _jsxs(_components.tbody, {
        children: [_jsxs(_components.tr, {
          children: [_jsx(_components.td, {
            children: "Discover"
          }), _jsx(_components.td, {
            children: "Audit the existing IIIF content inventory."
          }), _jsx(_components.td, {
            children: "Notebook of manifests"
          })]
        }), _jsxs(_components.tr, {
          children: [_jsx(_components.td, {
            children: "Plan"
          }), _jsx(_components.td, {
            children: "Define metadata priorities and markdown sections."
          }), _jsx(_components.td, {
            children: "Structured outline"
          })]
        }), _jsxs(_components.tr, {
          children: [_jsx(_components.td, {
            children: "Build"
          }), _jsx(_components.td, {
            children: "Compose MDX, integrate components, review styling."
          }), _jsx(_components.td, {
            children: "Drafted site"
          })]
        }), _jsxs(_components.tr, {
          children: [_jsx(_components.td, {
            children: "Validate"
          }), _jsx(_components.td, {
            children: "Preview locally and gather reviewer feedback."
          }), _jsx(_components.td, {
            children: "Approved launch"
          })]
        })]
      })]
    }), "\n", _jsx(_components.h3, {
      children: "Variations on Formatting"
    }), "\n", _jsxs(_components.ul, {
      children: ["\n", _jsxs(_components.li, {
        children: [_jsx(_components.strong, {
          children: "Bold statements"
        }), " stress an argument amid the flowing lorem ipsum pattern."]
      }), "\n", _jsxs(_components.li, {
        children: [_jsx(_components.em, {
          children: "Italic commentary"
        }), " signals a conceptual aside that still matters."]
      }), "\n", _jsxs(_components.li, {
        children: [_jsx(_components.code, {
          children: "inline snippets"
        }), " highlight commands or props like ", _jsx(_components.code, {
          children: "iiifContent"
        }), "."]
      }), "\n", _jsxs(_components.li, {
        children: ["Combination text such as ", _jsx(_components.strong, {
          children: _jsx(_components.em, {
            children: "bold italic cues"
          })
        }), " works for design tokens like ", _jsx(_components.code, {
          children: "bg-brand"
        }), "."]
      }), "\n"]
    }), "\n", _jsxs(_components.ol, {
      children: ["\n", _jsxs(_components.li, {
        children: [_jsx(_components.code, {
          children: "Ordered"
        }), " sequences remain useful when presenting API request steps."]
      }), "\n", _jsx(_components.li, {
        children: "Long enumerations may include supporting details that reference the earlier sections for continuity."
      }), "\n", _jsxs(_components.li, {
        children: ["Inline formulas such as ", _jsx(_components.code, {
          children: "n = a^2 + b^2"
        }), " survive inside a list without disruption."]
      }), "\n"]
    }), "\n", _jsx(_components.h2, {
      children: "Footnote Practice and References"
    }), "\n", _jsxs(_components.p, {
      children: ["Content that cites sources can place footnote markers at convenient pauses. Donec efficitur augue ut lacus tristique, sed facilisis massa facilisis. Nulla imperdiet nisi sed ante lacinia gravida. Nullam imperdiet nisl id orci varius malesuada. Sed iaculis nisl in nulla imperdiet, semper pulvinar nibh finibus. Pellentesque dictum arcu lorem, vitae tempor leo mollis id. Mauris finibus orci sit amet ante tristique accumsan. Vestibulum rutrum tellus sit amet sollicitudin tempor", _jsx(_components.sup, {
        children: _jsx(_components.a, {
          href: "#user-content-fn-2",
          id: "user-content-fnref-2",
          "data-footnote-ref": true,
          "aria-describedby": "footnote-label",
          children: "4"
        })
      }), ", and ut cursus arcu dolor, in euismod sem rutrum non."]
    }), "\n", _jsx(_components.p, {
      children: "Curabitur rutrum congue maximus. Donec pharetra quam ac pretium blandit. Nam interdum erat ac eros blandit, at maximus orci accumsan. Sed at fermentum odio. Praesent eu libero eu ipsum tempor luctus sed eget est. Maecenas felis ipsum, suscipit eget iaculis in, dapibus non nibh. Cras fermentum augue eget augue convallis porta. Sed eget placerat libero, eget lacinia leo. Mauris lobortis tincidunt velit nec vulputate. Vestibulum lacus quam, iaculis sit amet dictum eget, consequat at eros."
    }), "\n", _jsx(_components.h3, {
      children: "Closing Thoughts"
    }), "\n", _jsxs(_components.p, {
      children: ["The concluding section reaffirms that markdown offers countless expressive opportunities, from inline styling to interactive lists. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed nisl purus, mollis sed neque vel, commodo porttitor metus. Sed facilisis nisi sit amet justo aliquet, non porttitor odio luctus. Integer tincidunt diam nec mi pulvinar, in sed felis faucibus. Morbi fermentum lacus sit amet ligula bibendum malesuada. Vestibulum ac urna libero. Sed posuere et ipsum in eleifend. Duis imperdiet aliquet enim optio. Pellentesque augue arcu, gravida in sagittis vitae, malesuada varius justo. Duis vestibulum odio non ligula vehicula pellentesque. Integer volutpat iaculis orci, sed feugiat magna varius vitae.", _jsx(_components.sup, {
        children: _jsx(_components.a, {
          href: "#user-content-fn-6",
          id: "user-content-fnref-6",
          "data-footnote-ref": true,
          "aria-describedby": "footnote-label",
          children: "5"
        })
      })]
    }), "\n", _jsxs(_components.section, {
      "data-footnotes": true,
      className: "footnotes",
      children: [_jsx(_components.h2, {
        className: "sr-only",
        id: "footnote-label",
        children: "Footnotes"
      }), "\n", _jsxs(_components.ol, {
        children: ["\n", _jsxs(_components.li, {
          id: "user-content-fn-1",
          children: ["\n", _jsxs(_components.p, {
            children: ["Syntax rules apply equally to MDX frontmatter, markup, and component usage; clarity beats brevity when sharing instructions. ", _jsx(_components.a, {
              href: "#user-content-fnref-1",
              "data-footnote-backref": "",
              "aria-label": "Back to reference 1",
              className: "data-footnote-backref",
              children: "↩"
            })]
          }), "\n"]
        }), "\n", _jsxs(_components.li, {
          id: "user-content-fn-3",
          children: ["\n", _jsxs(_components.p, {
            children: [_jsx(_components.strong, {
              children: "Deep dive:"
            }), " This paragraph evokes the slow-burn rhythm of a reference chapter; ", _jsx(_components.em, {
              children: "notice how the cadence mirrors documentation specs"
            }), " while the surrounding prose maintains a measured, academic register that rewards careful reading. The observation underscores how rhetorical pacing nudges readers toward methodological thinking. ", _jsx(_components.a, {
              href: "#user-content-fnref-3",
              "data-footnote-backref": "",
              "aria-label": "Back to reference 2",
              className: "data-footnote-backref",
              children: "↩"
            })]
          }), "\n"]
        }), "\n", _jsxs(_components.li, {
          id: "user-content-fn-5",
          children: ["\n", _jsxs(_components.p, {
            children: [_jsx(_components.strong, {
              children: "Diagram reminder:"
            }), " Think of multi-column comparisons as living spreadsheets; italic callouts like ", _jsx(_components.em, {
              children: "per-column nuance"
            }), " keep design guidelines precise while maintaining descriptive integrity. This analytical framing mirrors techniques from information science curricula where tables are treated as miniature arguments. ", _jsx(_components.a, {
              href: "#user-content-fnref-5",
              "data-footnote-backref": "",
              "aria-label": "Back to reference 3",
              className: "data-footnote-backref",
              children: "↩"
            })]
          }), "\n"]
        }), "\n", _jsxs(_components.li, {
          id: "user-content-fn-2",
          children: ["\n", _jsxs(_components.p, {
            children: ["Etiam bibendum condimentum quam vitae aliquet. Donec blandit tortor tortor, id sollicitudin ligula interdum sit amet. ", _jsx(_components.a, {
              href: "#user-content-fnref-2",
              "data-footnote-backref": "",
              "aria-label": "Back to reference 4",
              className: "data-footnote-backref",
              children: "↩"
            })]
          }), "\n"]
        }), "\n", _jsxs(_components.li, {
          id: "user-content-fn-6",
          children: ["\n", _jsxs(_components.p, {
            children: ["Final aside: markdown closing sections benefit from a touch of narrative; weave bold emphasis (", _jsx(_components.strong, {
              children: "celebrate the craft"
            }), ") with explicit references to deployment contexts so the conclusion feels connected to real-world pipelines. In many editorial workflows, this reflective turn also sets the stage for peer review or user testing. ", _jsx(_components.a, {
              href: "#user-content-fnref-6",
              "data-footnote-backref": "",
              "aria-label": "Back to reference 5",
              className: "data-footnote-backref",
              children: "↩"
            })]
          }), "\n"]
        }), "\n"]
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
