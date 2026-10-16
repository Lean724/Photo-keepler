# Photo Keepler

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Platform](https://img.shields.io/badge/Platform-Windows%20%7C%20Linux%20%7C%20macOS-informational)](#platforms)
[![C++](https://img.shields.io/badge/C++-20-00599C?logo=c%2B%2B)](CMakeLists.txt)
[![Qt](https://img.shields.io/badge/Qt-6.5+-41CD52?logo=qt)](CMakeLists.txt)
[![Offline](https://img.shields.io/badge/Network-100%25%20Offline-success)](#privacy--offline-guarantee)

> **Photo Keepler** (*Photo Keeper* + *Johannes Kepler*) is a high-performance, strictly offline desktop and web application designed to review, classify, analyze, and organize large photo collections (100,000+ files) with speed, determinism, and safety.

---

## Key Highlights

- **100% Offline & Private:** Zero network requests, zero telemetry, and zero neural AI models. Everything runs locally on your machine using fast, deterministic algorithms.
- **Lightning-Fast Keyboard Curation:** Rapid single-photo and filmstrip review using customizable keyboard shortcuts (`A` to Keep, `D` to Discard, Arrow keys to navigate) with optional auto-advance.
- **Non-Destructive Guarantee:** Discarded files are backed up to a dedicated discard directory. Original files are **never** automatically overwritten or permanently deleted.
- **Chronological Organization:** Approved photos are sorted into clean directory structures (`Approved/YYYY/MM/filename.ext`) strictly based on genuine EXIF capture timestamps. Photos missing valid dates remain pending for manual assignment.
- **Deterministic Name Collision Resolution:** Existing file names are automatically given sequential numbers (`photo (1).jpg`) — never blindly overwritten.
- **Exact & Visual Duplicate Detection:**
  - **Exact Duplicates:** 256-bit cryptographic SHA-256 binary hash matching.
  - **Visual Duplicates:** 64-bit difference hash (dHash) and perceptual hash with adjustable Hamming distance thresholds for detecting recompressed or resized shots.
- **Burst Sequence Clustering:** Groups consecutive shots captured within a configurable temporal window (default 5s) and lets you pick the hero shot in one click.
- **Focus & Sharpness Analysis:** Classic discrete 3×3 Laplacian variance calculated over normalized resolution images to spot blurry or out-of-focus captures without AI hallucination.
- **RAW, JPEG & Sidecar Pairing:** Automatically detects base-name associations between RAW digital negatives (`.CR3`, `.NEF`, `.ARW`, `.DNG`), camera JPEGs, and `.xmp` metadata sidecars to keep them together.
- **Batch Simulator & Multiplatform Scripts:** Preview every source-to-destination path before moving a single byte. Export verified Bash (`.sh`) or PowerShell (`.ps1`) execution scripts for multi-terabyte drives.
- **Audit Log & Undo:** Persistent event journal with support for reverting safe operations.

---

## Architecture Overview

Photo Keepler is engineered with a modular separation of presentation, analysis algorithms, catalog persistence, and file operations:

```
photo-keepler/
├── CMakeLists.txt              # Native C++ / Qt 6 build system
├── README.md                   # Project documentation
├── docs/
│   ├── ARCHITECTURE.md         # Detailed software design
│   ├── DEPENDENCIES.md         # Audited libraries and licenses
│   └── SECURITY.md             # File integrity & offline invariant
├── src/
│   ├── catalog/                # SQLite metadata repository & incremental scanner
│   ├── analysis/               # SHA-256, dHash, Laplacian variance, burst clustering
│   ├── file_operations/        # Safe copy/move planner, collision resolver & journal
│   ├── metadata/               # EXIF, IPTC & sidecar parser
│   └── ui/                     # Responsive workstation interface (ES & EN)
```

---

## Supported Formats

| Category | Extensions | Decoding Method |
|---|---|---|
| **Standard Images** | `.jpg`, `.jpeg`, `.png`, `.webp`, `.avif`, `.bmp`, `.gif` | Native OS / Web Canvas Decoders |
| **High Dynamic Range** | `.tif`, `.tiff`, `.heic`, `.heif` | `libheif` / Exiv2 |
| **RAW Camera Negatives** | `.cr2`, `.cr3`, `.nef`, `.nrw`, `.arw`, `.srf`, `.sr2`, `.dng`, `.raf`, `.orf`, `.rw2`, `.pef`, `.srw` | `LibRaw` embedded preview & sensor pipeline |
| **Sidecars** | `.xmp`, `.xml`, `.aae` | Text & XML metadata parser |

---

## Getting Started

### 1. Web Workstation (Cross-platform)

The repository includes a web client with HTML5 File System Access support, running completely in-browser without any server-side upload:

```bash
# Clone the repository
git clone https://github.com/your-username/photo-keepler.git
cd photo-keepler

# Install dependencies
npm install

# Start local workstation
npm run dev
```

Open your browser at `http://localhost:3000`.

### 2. Native Desktop App (C++ & Qt 6)

For high-volume multi-terabyte processing on Windows, Linux, or macOS:

#### Prerequisites
- **C++ Compiler:** GCC 12+, Clang 15+, or MSVC 2022+ (C++20 standard)
- **CMake:** Version 3.22 or higher
- **Qt 6:** Modules `Core`, `Gui`, `Widgets`, `Sql`, `Concurrent` (6.5 LTS recommended)
- **Dependencies:** `SQLite3`, `libraw`, `exiv2`, `libheif`

#### Build Instructions
```bash
mkdir build && cd build
cmake .. -DCMAKE_BUILD_TYPE=Release
cmake --build . --config Release -j$(nproc)

# Run Photo Keepler
./photo-keepler
```

---

## Keyboard Shortcuts

| Shortcut | Action |
|---|---|
| <kbd>A</kbd> | Keep / Approve current photo |
| <kbd>D</kbd> | Discard current photo (safely copied to Discards) |
| <kbd>R</kbd> | Reset decision back to Pending |
| <kbd>←</kbd> | Navigate to previous photo |
| <kbd>→</kbd> | Navigate to next photo |
| <kbd>+</kbd> / <kbd>-</kbd> | Zoom in / Zoom out |

*(Shortcuts and labels are fully customizable in the Settings dialog).*

---

## Privacy & Offline Guarantee

Photo Keepler was conceived under a strict zero-network privacy mandate:
1. No telemetry or usage trackers.
2. No auto-update downloaders in the background.
3. No remote cloud synchronization.
4. No machine learning inferencing or neural network dependencies.

All indexing, thumbnails, hashing, and operations execute exclusively against your local storage.

---

## License

This project is licensed under the [MIT License](LICENSE).
Third-party dependencies (Qt 6, SQLite, LibRaw, Exiv2) follow their respective licenses (LGPLv3, Public Domain, CDDL/LGPL, GPLv2).
