# Collapse 45 Inventory Dashboard — Photo-first prototype

## Important
The updated photographed inventory sheets are the only authoritative inventory sources in this package. The previously uploaded Excel spreadsheet was intentionally NOT used. Exact equipment transcription and compartment assignments have not been verified and are not represented as complete. No item should be considered physically present solely because it appears in a sheet.

## Included
- `index.html` dashboard with apparatus photo gallery, inventory source-sheet gallery, search and equipment entry form, local-only checklists.
- `inventory.json` source manifest and empty reviewed equipment dataset.
- `images/` deduplicated source photographs.
- `style.css`, `app.js`.

## Launch
Unzip. In the directory, run `python -m http.server 8000` and open `http://localhost:8000` in your browser. Alternatively upload all files and the images folder to a GitHub Pages repository. Opening index.html directly may prevent JSON loading.

## Next stage
Transcribe each photo carefully and cross-check each row against the original, including compartment, shelf, quantity, kit contents, missing status and notes. Populate the JSON only after review. Map apparatus compartment hotspots after physical door labels are confirmed. Have the crew verify before operational use.

## Privacy / persistence
Manual edits and checklist selections live in browser localStorage only. Export reviewed entries as JSON for backup and to incorporate into the published shared data. The site has no authentication or shared inspection backend; it is not a substitute for official apparatus inspection software.
