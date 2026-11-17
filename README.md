<div align="center">

# 🧭 JSON Pointer Desk

**Find a value. Keep its exact place.**

![Vue](https://img.shields.io/badge/Vue-3-42b883?style=for-the-badge&logo=vuedotjs&logoColor=ffffff)
![TypeScript](https://img.shields.io/badge/TypeScript-6-3178c6?style=for-the-badge&logo=typescript&logoColor=ffffff)
![Vite](https://img.shields.io/badge/Vite-8-646cff?style=for-the-badge&logo=vite&logoColor=ffffff)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-06b6d4?style=for-the-badge&logo=tailwindcss&logoColor=ffffff)
![License](https://img.shields.io/badge/License-MIT-777777?style=for-the-badge)

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new)

_Vue bounded JSON navigation desk with typed named component models, plain-pointer token resolution, complete value indexing, and subtree/report exports._

</div>

---

## ✨ Highlights

- **A bounded JSON document:** Inspect up to 400 values with controlled nesting, keys, strings, and canonical source size.
- **An exact address:** Navigate plain JSON Pointer tokens through object keys and zero-based array indices.
- **Typed named models:** A child form exposes independent pending name and pointer models through defineModel.
- **See each decoded step:** Inspect the resolution trail, selected type, complete selected JSON, and explicit missing-member state.
- **Useful special keys:** Handle empty keys, slashes, tildes, quotes, spaces, and own prototype-looking names without inherited-member traversal.
- **A complete map:** Browse the first 200 indexed values while full CSV includes every node and value.
- **Keep a subtree:** Download the parsed selected value as standalone JSON, complete index CSV, resolution TXT, or editable JP workspace JSON.

## 🧱 Project Structure

```text
public/
├── favicon.svg                         # Original project emblem
├── og.svg                              # Original social artwork
├── font-licenses.txt                   # Font copyright and OFL licenses
└── sample-workspace.json               # Complete importable workspace
src/
├── components/
│   ├── PointerForm.vue
│   ├── PointerIndex.vue
│   ├── DataTools.vue                   # Workspace actions and restoration
│   ├── AppDialog.vue                   # Native Teleport modal and focus lifecycle
│   ├── AppIcon.vue                     # Original inline SVG icons
│   ├── DataExchange.vue                # Validated workspace import dialog
│   └── StudioHeader.vue                # Workspace branding and actions
├── domain/
│   ├── pointer.ts                     # Pure validation, calculations, and exports
│   ├── shared.ts                       # Text and provenance helpers
│   └── validation.ts                   # Strict unknown-input guards
├── services/
│   ├── draft.ts                        # Validated device-local persistence
│   └── files.ts                        # Downloads and deterministic identities
├── App.vue                             # Workspace and editor state
├── base.css                            # Tailwind, local fonts, and control defaults
├── style.css                           # Project theme tokens
└── main.ts                             # Vue application entry
tests/
├── *.test.ts                           # Native domain/composable/export tests
└── e2e/                                # Production browser workflows
```

Root files include Vite, TypeScript, Playwright, and Prettier configuration, an npm lockfile, the MIT license, and explicit `vercel.json`. The official scaffold’s default artwork and empty `src/assets` directory are removed. The shared generic development container stays unchanged.

## 🛠 Tech Stack

| Tool                          | Role                                                                        |
| ----------------------------- | --------------------------------------------------------------------------- |
| Vue 3.5                       | Typed SFCs, component contracts, reactive state, and lifecycle management   |
| TypeScript 6                  | Checked domain structures and component/composable inputs                   |
| Vite 8                        | Development server and static production bundles                            |
| Tailwind CSS 4                | Vite plugin, theme tokens, template utilities, and responsive/state styling |
| DM Sans + Bricolage Grotesque | Locally bundled Latin variable fonts                                        |
| Node.js 24+                   | Local CLI tools and native TypeScript tests                                 |
| Playwright                    | Chromium workflows against the production build                             |

The app requires no account, backend, remote data source, or extra UI library. All dependencies and CLI tools are installed locally inside this independent project.

## 🎨 Tailwind Styling

The Vite config enables `@tailwindcss/vite`. `base.css` imports Tailwind, defines font tokens, and uses `@apply` for small native control defaults. `style.css` defines project colors through `@theme`. Actual application templates use Tailwind utilities for grid/flex layouts, spacing, typography, borders, colors, responsive behavior, focus, and visible states.

`data-ui`, `data-project`, and domain identity attributes are explicit browser hooks. There are no orphan semantic styling classes. Reserved preview/list containers and internal overflow keep neighboring panels stable when modes, selected details, or results change. All application layout and visible-state classes use Tailwind utilities. Domain SVG attributes describe artwork geometry; standalone exported documents carry their own presentation. Reduced-motion preferences shorten transitions.

Two Fontsource variable font files are bundled as hashed local assets. Their copyright and OFL text are in [font-licenses.txt](./public/font-licenses.txt). Favicon/social artwork and SVG interface icons are original project assets.

## 📦 Included Demo Data

The original **A small shelf of useful objects** includes two shelf entries, nested tags, a slash-containing label/short key, a ~note object with an empty key, a count, and null archival metadata. The initial pointer /shelf/0/tags/1 selects the string green. The index supplies canonical escaped paths for every value, including containers and the root.

The complete [sample-workspace.json](./public/sample-workspace.json) includes valid provenance and is served as a public static file. The application imports this same JSON sample for first use and confirmed restoration.

## 🚀 Local Development

Use Node.js **24 or later**:

```bash
npm ci
npm run dev
```

Vite prints the local URL and binds to `0.0.0.0` for the shared container. Inspect a production bundle with:

```bash
npm run build
npm run preview
```

## 🧩 Vue Implementation

PointerForm exposes required named defineModel<string> contracts for name and pointer, plus typed apply/root/parent events. These are pending form fields rather than direct mutations of the saved workspace. Applying validates a complete candidate. Index/root/parent actions update the saved pointer while preserving unrelated pending document and name text. Document edits also remain separate from an unapplied pointer field. Explicit workspace imports refresh every form.

The resolver implements bounded plain JSON Pointer string behavior described by [RFC 6901](https://www.rfc-editor.org/info/rfc6901/): the empty string selects the document root; slash-prefixed tokens decode ~1 before ~0. That order preserves ~01 as the literal ~1 rather than turning it into /. Object member spelling is exact, without Unicode normalization or percent decoding. Arrays require zero or a positive decimal index without leading zeroes. A - token does not reference a concrete array element.

Malformed pointer syntax rejects Apply/import and preserves the saved pointer. A syntactically valid but unresolved pointer is a normal persisted query with a visible Not found result and disabled selection export. Resolution stops at the first missing/invalid array member or scalar descent and retains its successfully resolved trace. Parent navigation removes one decoded token and re-escapes the rest canonically. This is a read-only lookup tool, without URI-fragment, JSONPath, or JSON Patch behavior.

Document validation rebuilds detached JSON arrays/plain objects, validates finite numbers and safe integer values, and bounds nodes, depth, keys, strings, and compact serialized size. Arrays cannot contain holes/undefined; non-JSON values, cycles, and nonplain objects are rejected. Object.fromEntries reconstructs own keys safely, including **proto** and constructor. Lookup uses Object.hasOwn and cannot traverse inherited prototype members. Text is rendered as text rather than HTML.

Source text uses native JSON.parse. Duplicate object keys already collapse to their last occurrence at that parse boundary, and fractional numbers use JavaScript Number semantics rather than arbitrary-precision decimal arithmetic. Source whitespace/numeric spelling is not retained; editable workspaces preserve the canonical parsed value. Unsafe integers are rejected, while users needing exact numeric text can store strings. Single-line key/pointer restrictions and size limits intentionally bound the accepted document/pointer subset.

The node index is a deterministic preorder over the rebuilt document. Each row carries a canonical pointer, type, and value. The UI shows up to 200 rows with short previews; clicking a row selects its complete value. Full CSV stores JSON-encoded pointer/value cells before CSV quoting, so controls and line breaks cannot inject raw rows or NUL bytes. Selection JSON preserves the complete parsed subtree, including false, zero, empty strings, null, arrays, and objects.

The shared modal uses `Teleport`, a unique `useId` heading, and a post-flush watcher to synchronize Vue state with native `showModal`/`close`. Escape and focus return remain native. A queued close event cannot reset a modal that has already reopened.

## 💾 Local Drafts & Data Exchange

Validated workspace data is stored under `vue-json-pointer-desk:v1`. First-use and restored data are validated before use. Invalid saved JSON/schema falls back to the sample without immediately overwriting the damaged entry. A later valid change writes a new draft. Blocked storage leaves editing and downloads usable and shows a status message.

Import parses a detached candidate and replaces the workspace only after complete validation. Failure keeps current work and the saved draft intact. Workspace JSON is limited to **120,000 characters**. Known fields are rebuilt in canonical order; unknown fields and supplied provenance are not trusted or carried into the editable domain. Project markers are recomputed from validated data. Name, canonical parsed document value, and saved pointer are persisted. Resolution traces/results, node-index arrays/previews, pending name/pointer/source fields, validation messages, and dialogs are derived or transient.

| Field                | Accepted values                                                                            |
| -------------------- | ------------------------------------------------------------------------------------------ |
| version, name        | 1; nonblank single-line title up to 80 UTF-16 units                                        |
| data                 | A valid detached JSON value: object, array, string, finite number, boolean or null         |
| Document bounds      | At most 400 values including root; root depth 0 and maximum depth 8                        |
| Keys / string values | Single-line keys 0–80 UTF-16 units; string values 0–1000 units, controls allowed in values |
| Numeric values       | Finite JavaScript numbers; integer values must be safe integers                            |
| Canonical size       | Compact JSON.stringify(data) up to 40,000 characters                                       |
| pointer              | Plain single-line pointer up to 1024 units; empty or /-prefixed, with only ~0/~1 escapes   |
| Source editor        | Input text up to 120,000 characters before JSON.parse and value validation                 |

Pointer syntax is validated separately from whether its member exists. Wrong primitives, invalid escapes, excessive data, unsupported values, unsafe integers and schema versions reject candidates. Derived rows/traces/results are not imported as authority.

Selection JSON contains only the entire selected parsed value, pretty-printed with a final newline; JP identity stays in its filename rather than altering the subtree. It is disabled for unresolved queries. Index CSV includes every canonical pointer as a JSON-string cell, type, full JSON-encoded value, and marker; container rows include complete subtrees. Resolution TXT includes the saved pointer, node count, successfully resolved tokens/types, explicit unresolved reason or complete selected JSON, and attribution. Workspace JSON preserves canonical document and saved pointer with recomputed provenance.

Download Blob URLs are revoked after download. Sample restoration uses a native confirmation dialog.

## ◈ Project Markers

- `JP` appears in the wordmark, project metadata, and workspace identity; original favicon/social artwork use a matching emblem.
- `JP-XXXXXXXX` is a deterministic 32-bit content stamp calculated with FNV-1a over UTF-8 canonical workspace JSON, excluding supplied provenance.
- JSON provenance includes the project slug, `CodeSculptor`, and the marker. Downloaded artifacts carry the appropriate identity in filenames and/or metadata/content.
- Markers help identify configurations and artifacts; they are not cryptographic signatures or tamper-proof authorship claims.
- Author metadata and the MIT license retain CodeSculptor attribution.

## 🧭 Extension Notes & Nuances

- Plain pointer strings only, without URI fragments, percent decoding, JSONPath queries, wildcard matching, or JSON Patch writes.
- Deliberately bounded single-line keys/pointers; this is not an unrestricted implementation of every JSON/Pointer input shape.
- Object spelling is exact and not normalized. Empty, space, slash and tilde keys are distinct.
- Array indices require canonical unsigned decimal spelling; - never selects an existing element.
- Native JSON.parse collapses duplicate source keys to their last occurrence before validation.
- Fractions use native JavaScript Number precision. Exact original number spelling and whitespace are not retained.
- Integer JSON values beyond Number safe-integer range are rejected; string values retain their supplied text.
- Root primitives are valid, including false, zero, empty string and null.
- Container CSV values intentionally repeat subtrees, while the row count remains bounded.
- The index shows 200 entries; direct pointers and downloads cover all 400 validated values.
- Source/document updates can leave a valid saved pointer unresolved until the user changes it.
- Extend document limits, safe own-key cloning, token semantics, complete selection, and JSON/CSV escaping together.

The application and documentation are English. At 320 px panels stack, while larger screens use the shared grid. Scrollable data regions, named native controls, visible focus styles, and a single main landmark remain available across layouts.

## ✅ Build & Checks

```bash
npm run build
npm run format:check
npm test
npx playwright install chromium
npm run test:e2e
```

`build` runs `vue-tsc` before Vite. Native tests use Node’s built-in runner. Playwright starts the current production bundle with the local preview command and does not reuse another server. Build before browser tests so they inspect current output. `npm run format` formats maintained source; dependencies, generated output, lockfiles, and browser artifacts are excluded.

Six native tests verify canonical sample resolution and every enumerated pointer round trip, plain-pointer examples and escape order, empty/slash/tilde/quote/backslash keys, canonical array indices, missing/scalar/prototype behavior, strict data/cycle/depth/size/number limits, full 400-node reports, control escaping, root primitives, detached source rebuilding, and UTF-8 stamps. Four browser workflows exercise typed form/index/root/parent actions, persisted queries, syntax versus unresolved states, independent pending forms, unsafe/broken/large document rejection, complete lossless parsed selections and safe own prototype-looking keys in real downloads.

Shared browser workflows check valid/failed imports, persistence after reload, provenance downloads, blocked/corrupt storage, confirmed sample restoration, native modal reopening/Escape/focus, real Tailwind grid behavior, named visible controls, and overflow at 320–1440 px. A separate maximum-content case downloads and re-imports the complete escaped JSON workspace at 320 px. These are local production checks, not a deployed Vercel smoke test.

## ▲ Vercel Deployment

1. Import the repository and select this project folder as the Root Directory when deploying from the shared workspace.
2. Use the committed config: `npm ci`, `npm run build`, and output folder `dist`.
3. Check the root page, public sample/artwork, and main editor after deployment.

The explicit `vercel.json` rewrites only `/` to `/index.html` and permanently redirects `/index.html` to `/`. There are no client routes requiring a catch-all rewrite. Declared routes preserve missing-resource behavior. HTML and unhashed public files revalidate; Vite’s hashed JS/CSS/font assets receive one-year immutable caching. All responses include `X-Content-Type-Options: nosniff` and `Referrer-Policy: strict-origin-when-cross-origin`. The dev command accepts Vercel’s `$PORT` with `--strictPort`.

Used fields, route compilation, and generated asset/cache behavior are checked locally against the [official Vercel configuration schema](https://openapi.vercel.sh/vercel.json). Vite preview does not emulate deployment headers. SVG social artwork is included as an editable source; platforms requiring raster cards need a rendered image and an absolute deployed image URL.

## 📄 License

[MIT](./LICENSE) · Copyright (c) 2026 **CodeSculptor**. Bundled fonts retain separate OFL licenses.
