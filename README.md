# steam-screenshot-backup-tool
A backup tool for Steam screenshots.

## Usage
Have **Node v10** or later installed. Using the latest [LTS version](https://nodejs.org/en/download/) is recommended.
```bash
git clone https://github.com/Salies/steam-screenshot-backup-tool # or download the zip
cd steam-screenshot-backup-tool
npm install
node app.js
```

If the program ever crashes for some reason - it may happen, for instance, when the screenshot data is being fetched - just cancel the operation and start again. The tool is configured to always pick up where it left.

**Todo list:**
* Name the files according to the date they were created (like Steam names it when the screenshots are created).
