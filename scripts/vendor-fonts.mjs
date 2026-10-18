import { mkdir, writeFile } from "node:fs/promises";
const root = new URL("../public/fonts/", import.meta.url);
await mkdir(root, { recursive: true });
const response = await fetch(
  "https://fonts.googleapis.com/css2?family=Inter:wght@400..700&family=Raleway:wght@400..800&display=swap",
  {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36",
    },
  },
);
if (!response.ok) throw new Error("Could not retrieve font definitions");
const css = await response.text();
for (const family of ["Inter", "Raleway"]) {
  const sections = [
    ...css.matchAll(/\/\* latin \*\/\s*(@font-face\s*\{[\s\S]*?\})/g),
  ].map((m) => m[1]);
  const block = sections.find((s) => s.includes(`font-family: '${family}'`));
  const url = block?.match(/url\(([^)]+)\)/)?.[1];
  if (!url) throw new Error(`No Latin variable font found: ${family}`);
  const font = await fetch(url);
  if (!font.ok) throw new Error(`Font download failed: ${family}`);
  await writeFile(
    new URL(`${family}-latin.woff2`, root),
    Buffer.from(await font.arrayBuffer()),
  );
  const license = await fetch(
    `https://raw.githubusercontent.com/google/fonts/main/ofl/${family.toLowerCase()}/OFL.txt`,
  );
  if (!license.ok) throw new Error(`License download failed: ${family}`);
  await writeFile(new URL(`${family}-OFL.txt`, root), await license.text());
  console.log(`Vendored ${family} Latin variable font and OFL license.`);
}
