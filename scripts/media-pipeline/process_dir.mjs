import { put } from "@vercel/blob";
import { readFile, readdir, mkdtemp, mkdir, writeFile } from "fs/promises";
import { tmpdir } from "os";
import path from "path";
import { fileURLToPath } from "url";
import { execFile } from "child_process";
import { promisify } from "util";

const run = promisify(execFile);

// Resolve relative to this script's own location, not process.cwd() — this
// script gets invoked from different working directories (project root when
// run directly, the pipeline scratch dir when run from process_all.sh).
const PROJECT_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const rawDir = process.argv[2];
const blobPrefix = process.argv[3];
const kind = process.argv[4]; // "photo" | "video"
const categorySlug = process.argv[5];
const subSlug = process.argv[6];
const genDir = path.join(PROJECT_ROOT, "lib/data/generated");
const outJson = path.join(genDir, `${categorySlug}__${kind}__${subSlug}.json`);
await mkdir(genDir, { recursive: true });

const tmp = await mkdtemp(path.join(tmpdir(), "proc-"));
const files = (await readdir(rawDir)).filter((f) => !f.startsWith("."));
const results = [];

for (const file of files) {
  const srcPath = path.join(rawDir, file);
  try {
    if (kind === "photo") {
      const outPath = path.join(tmp, file);
      await run("sips", ["-Z", "2400", "-s", "format", "jpeg", "-s", "formatOptions", "82", srcPath, "--out", outPath]);
      const { stdout } = await run("sips", ["-g", "pixelWidth", "-g", "pixelHeight", outPath]);
      const w = parseInt(stdout.match(/pixelWidth:\s*(\d+)/)?.[1] ?? "0", 10);
      const h = parseInt(stdout.match(/pixelHeight:\s*(\d+)/)?.[1] ?? "0", 10);
      const buf = await readFile(outPath);
      const blob = await put(`${blobPrefix}/${file}`, buf, {
        access: "public",
        contentType: "image/jpeg",
        addRandomSuffix: false,
        allowOverwrite: true,
      });
      results.push({ filename: file, url: blob.url, width: w, height: h, sizeMB: +(buf.length / 1048576).toFixed(2) });
      console.log(`OK photo ${file} -> ${blob.url} (${w}x${h})`);
    } else {
      const stem = file.replace(/\.[^.]+$/, "");
      const outPath = path.join(tmp, `${stem}.mp4`);
      await run("ffmpeg", [
        "-y", "-i", srcPath,
        "-c:v", "h264_videotoolbox", "-b:v", "4M", "-maxrate", "6M", "-bufsize", "8M",
        "-vf", "scale='min(1920,iw)':-2",
        "-c:a", "aac", "-b:a", "128k", "-movflags", "+faststart",
        outPath,
      ]);
      const { stdout } = await run("ffprobe", [
        "-v", "error", "-select_streams", "v:0",
        "-show_entries", "stream=width,height",
        "-of", "csv=p=0", outPath,
      ]);
      const [w, h] = stdout.trim().split(",").map(Number);
      const buf = await readFile(outPath);
      const blob = await put(`${blobPrefix}/${stem}.mp4`, buf, {
        access: "public",
        contentType: "video/mp4",
        addRandomSuffix: false,
        allowOverwrite: true,
      });
      results.push({ filename: file, webFilename: `${stem}.mp4`, url: blob.url, width: w, height: h, sizeMB: +(buf.length / 1048576).toFixed(2) });
      console.log(`OK video ${file} -> ${blob.url} (${w}x${h})`);
    }
  } catch (err) {
    console.error(`FAIL ${file}: ${err.message}`);
    results.push({ filename: file, error: err.message });
  }
}

await writeFile(outJson, JSON.stringify(results, null, 2));
console.log(`Wrote ${results.length} entries to ${outJson}`);
