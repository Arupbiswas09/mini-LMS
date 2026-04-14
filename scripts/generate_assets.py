#!/usr/bin/env python3
"""
Mini LMS — Asset Pipeline
Resizes and copies generated brand assets into the correct Expo asset paths.
"""
from PIL import Image
import os, shutil

BRAIN = "/Users/arup/.gemini/antigravity/brain/3bbc70a0-eb73-496d-9c24-538538c5d404"
DEST  = "/Users/arup/Desktop/mini-LMS/lms-app/assets/images"

TARGETS = [
    # (source_file, dest_file, size)
    ("lms_app_icon_1776149574632.png",      "icon.png",           1024),
    ("lms_favicon_1776149750274.png",       "favicon.png",          48),
    ("lms_adaptive_icon_1776149810581.png", "adaptive-icon.png",  1024),
    ("lms_splash_icon_1776149846942.png",   "splash-icon.png",    1024),
]

os.makedirs(DEST, exist_ok=True)

print("\n🎨  Mini LMS — Asset Pipeline\n")
for src_name, dst_name, size in TARGETS:
    src_path = os.path.join(BRAIN, src_name)
    dst_path = os.path.join(DEST, dst_name)
    img = Image.open(src_path).convert("RGBA")
    img = img.resize((size, size), Image.LANCZOS)
    img.save(dst_path, "PNG", optimize=True)
    kb = os.path.getsize(dst_path) / 1024
    print(f"  ✓  {dst_name:30s}  ({size}x{size})  {kb:.1f} KB")

print("\n✅  All assets written to assets/images/\n")
