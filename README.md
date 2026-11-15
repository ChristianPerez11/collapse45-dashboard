# Collapse 45 — interactive inventory dashboard (v2)

This is a **prototype**, not a department-approved operational inventory or inspection record.

## Upload to GitHub

1. Open `ChristianPerez11/collapse45-dashboard` and select the `main` branch.
2. Upload the **contents of this folder** (not the containing folder) to the root of the repository, including the `images/` directory. Replace `index.html`, `style.css`, `app.js`, `inventory.json` and `README.md` when GitHub prompts you.
3. Commit the changes. In **Settings → Pages**, select **Deploy from a branch**, branch **main**, folder **/(root)**, and save. **Note:** GitHub Pages websites are publicly accessible; a private repository does not make the published Pages site private. Confirm department permission before hosting apparatus photographs or inventory documents publicly.
4. Open `https://ChristianPerez11.github.io/collapse45-dashboard/` after Pages finishes deploying. If you cannot deploy due to repository/account settings, use a local server instead.

## App features
- Driver, passenger, front, rear illustrated vehicle views
- Clickable provisional compartment markers; drag in Calibrate mode to align markers to the actual doors
- Right-side compartment panel; search, list, locally saved reviewed equipment records
- Local check mode (not an official inspection record)
- Original updated inventory source sheets and apparatus photo gallery in Specs
- Reviewable JSON import and export of equipment records
- Responsive phone layout, dark and light modes

## Important inventory caveats
- `inventory.json` retains the updated photographed inventory sheets as authoritative sources. The old Excel spreadsheet is excluded.
- The equipment `items` array is **empty** until source-sheet content is carefully transcribed and reviewed; no equipment presence is implied by the illustration.
- Compartment marker positions in `app.js` are **provisional** and do not certify that a physical door has the displayed label. Calibrate and confirm each one with an actual truck walkthrough.
- Browser local storage saves marker positions, equipment edits, and checks **only on that device/browser**. Other firefighters will not see those updates, and browser cleanup can erase them. Use Export JSON to back up changes; import reviewed entries on other devices or commit them to the authoritative `inventory.json` after proper review.
- The four images are mockup illustrations, not photographs. The photos in Specs remain the official visual references supplied for this prototype.

## Folder layout
```
index.html
style.css
app.js
inventory.json
README.md
images/
  collapse45-driver.png
  collapse45-passenger.png
  collapse45-front.png
  collapse45-rear.png
  IMG_0241(1).jpeg ... (apparatus photo references)
  IMG_0249.jpeg ... (inventory source sheets)
```
