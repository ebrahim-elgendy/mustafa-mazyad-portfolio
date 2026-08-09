import { readFile, readdir, mkdtemp, mkdir, writeFile } from "fs/promises";
import { tmpdir } from "os";
import path from "path";
import { fileURLToPath } from "url";
import { execFile } from "child_process";
import { promisify } from "util";
import sharp from "sharp";

const run = promisify(execFile);

// Resolve relative to this script's own location, not process.cwd() — this
// script gets invoked from different working directories (project root when
// run directly, the pipeline scratch dir when run from process_all.sh).
const PROJECT_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");

const rawDir = process.argv[2];
const mediaPrefix = process.argv[3]; // e.g. "corporate/al-dar" -> public/media/corporate/al-dar
const kind = process.argv[4]; // "photo" | "video"
const categorySlug = process.argv[5];
const subSlug = process.argv[6];
const genDir = path.join(PROJECT_ROOT, "lib/data/generated");
const mediaDir = path.join(PROJECT_ROOT, "public/media", mediaPrefix);
const outJson = path.join(genDir, `${categorySlug}__${kind}__${subSlug}.json`);
await mkdir(genDir, { recursive: true });
await mkdir(mediaDir, { recursive: true });

function localUrl(filename) {
  return "/" + ["media", ...mediaPrefix.split("/"), filename].map(encodeURIComponent).join("/");
}

const tmp = await mkdtemp(path.join(tmpdir(), "proc-"));
const files = (await readdir(rawDir)).filter((f) => !f.startsWith("."));
const results = [];

// Guards against distinct source files whose output name would collide (e.g.
// "4.mov" and "4.mp4" both stem to "4.mp4") — silently overwriting one with
// the other on disk. Disambiguates by suffixing the source extension.
const usedNames = new Set();
function reserveName(candidate, sourceExt) {
  if (!usedNames.has(candidate)) {
    usedNames.add(candidate);
    return candidate;
  }
  const stem = candidate.replace(/\.[^.]+$/, "");
  const disambiguated = `${stem}-${sourceExt.replace(/^\./, "").toLowerCase()}.mp4`;
  usedNames.add(disambiguated);
  return disambiguated;
}

for (const file of files) {
  const srcPath = path.join(rawDir, file);
  try {
    if (kind === "photo") {
      // sips silently truncates decoding on some 100MP+ source JPEGs (GFX100 II
      // originals) — it still writes a well-formed file, just with the bottom
      // portion flat gray. sharp doesn't have this failure mode.
      const srcBuf = await readFile(srcPath);
      const buf = await sharp(srcBuf, { limitInputPixels: false })
        .rotate()
        .resize({ width: 2400, height: 2400, fit: "inside", withoutEnlargement: true })
        .jpeg({ quality: 82 })
        .toBuffer();
      const { width: w, height: h } = await sharp(buf).metadata();
      const outName = reserveName(file, path.extname(file));
      await writeFile(path.join(mediaDir, outName), buf);
      const url = localUrl(outName);
      results.push({ filename: file, url, width: w, height: h, sizeMB: +(buf.length / 1048576).toFixed(2) });
      console.log(`OK photo ${file} -> ${url} (${w}x${h})`);
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
      const outName = reserveName(`${stem}.mp4`, path.extname(file));
      await writeFile(path.join(mediaDir, outName), buf);
      const url = localUrl(outName);

      // Poster frame — the .mp4 itself isn't a decodable <img> src, so the
      // gallery thumbnail needs an actual extracted frame.
      const posterStem = outName.replace(/\.mp4$/, "");
      const posterTmp = path.join(tmp, `${posterStem}-poster.jpg`);
      await run("ffmpeg", ["-y", "-ss", "00:00:00.5", "-i", outPath, "-frames:v", "1", posterTmp]);
      const posterName = `${posterStem}-poster.jpg`;
      await writeFile(path.join(mediaDir, posterName), await readFile(posterTmp));
      const posterUrl = localUrl(posterName);

      results.push({
        filename: file,
        webFilename: outName,
        url,
        posterUrl,
        width: w,
        height: h,
        sizeMB: +(buf.length / 1048576).toFixed(2),
      });
      console.log(`OK video ${file} -> ${url} (${w}x${h}), poster -> ${posterUrl}`);
    }
  } catch (err) {
    console.error(`FAIL ${file}: ${err.message}`);
    results.push({ filename: file, error: err.message });
  }
}

await writeFile(outJson, JSON.stringify(results, null, 2));
console.log(`Wrote ${results.length} entries to ${outJson}`);
