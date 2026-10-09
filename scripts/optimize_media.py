import os
import re
from PIL import Image

def slugify(s):
    s = s.lower()
    s = re.sub(r'[\(\)\:\&\,]', '', s)
    s = re.sub(r'[\s_]+', '-', s)
    s = re.sub(r'-+', '-', s)
    return s.strip('-')

def optimize_image(src_path, dst_path, max_dim=1920, quality=80):
    os.makedirs(os.path.dirname(dst_path), exist_ok=True)
    with Image.open(src_path) as im:
        if im.mode in ('RGBA', 'LA') and dst_path.endswith(('.jpg', '.jpeg')):
            im = im.convert('RGB')
        im_copy = im.copy()
        if max_dim:
            im_copy.thumbnail((max_dim, max_dim), Image.Resampling.LANCZOS)
        im_copy.save(dst_path, 'WEBP', quality=quality)
    print(f"Optimized: {src_path} ({os.path.getsize(src_path)} bytes) -> {dst_path} ({os.path.getsize(dst_path)} bytes)")

def create_thumbnail(src_path, dst_path, width=400, quality=80):
    os.makedirs(os.path.dirname(dst_path), exist_ok=True)
    with Image.open(src_path) as im:
        aspect = im.height / im.width
        height = int(width * aspect)
        thumb = im.copy()
        thumb.thumbnail((width, height), Image.Resampling.LANCZOS)
        thumb.save(dst_path, 'WEBP', quality=quality)
    print(f"Thumbnail: {src_path} -> {dst_path} ({os.path.getsize(dst_path)} bytes)")

def process_dashboard():
    dash_dir = 'public/media/images/dashboard'
    mapping = {
        '5-Day Roadmap(Day 1: Arrival & Screening).jpg': 'day-1-screening.webp',
        '5-Day Roadmap(Day 2: Psychologist Day).jpg': 'day-2-psychologist.webp',
        '5-Day Roadmap(Day 3: GTO Tasks (Indoor & Out)).jpg': 'day-3-gto.webp',
        '5-Day Roadmap(Day 4: Individual Tasks & Interview).jpg': 'day-4-individual.webp',
        '5-Day Roadmap(Day 5: Conference & Results).jpg': 'day-5-conference.webp',
        'dashboard.jpg': 'dashboard.webp',
        'wat simulator.jpg': 'wat-simulator.webp',
        'SCT Simulator.jpg': 'sct-simulator.webp',
        'SRT Trainer.jpg': 'srt-trainer.webp',
        'GTO Obstacles.jpg': 'gto-obstacles.webp',
        'Complaints and Ideas.jpg': 'complaints-and-ideas.webp',
    }

    for orig_name, new_name in mapping.items():
        orig_file = os.path.join(dash_dir, orig_name)
        new_file = os.path.join(dash_dir, new_name)
        if os.path.exists(orig_file):
            optimize_image(orig_file, new_file, max_dim=1600, quality=82)

    # Delete the 5 unused roadmap jpgs
    unused_5 = [
        '5-Day Roadmap(Day 1: Arrival & Screening).jpg',
        '5-Day Roadmap(Day 2: Psychologist Day).jpg',
        '5-Day Roadmap(Day 3: GTO Tasks (Indoor & Out)).jpg',
        '5-Day Roadmap(Day 4: Individual Tasks & Interview).jpg',
        '5-Day Roadmap(Day 5: Conference & Results).jpg',
    ]
    for f in unused_5:
        p = os.path.join(dash_dir, f)
        if os.path.exists(p):
            os.remove(p)
            print(f"Deleted dead weight JPG: {p}")

def process_wat_guides():
    wat_dir = 'public/media/images/tests-guides/wat'
    thumb_dir = os.path.join(wat_dir, 'thumbnails')
    os.makedirs(thumb_dir, exist_ok=True)

    files = [f for f in os.listdir(wat_dir) if os.path.isfile(os.path.join(wat_dir, f)) and not f.startswith('.')]
    for fname in files:
        src = os.path.join(wat_dir, fname)
        base_name, ext = os.path.splitext(fname)
        
        # If PNG or large JPG, convert to webp version
        webp_full = os.path.join(wat_dir, base_name + '.webp')
        if ext.lower() == '.png' or (ext.lower() in ('.jpg', '.jpeg') and os.path.getsize(src) > 500_000):
            optimize_image(src, webp_full, max_dim=1920, quality=80)
            if ext.lower() == '.png':
                os.remove(src)
                print(f"Removed heavy PNG: {src}")

        # Always make thumbnail
        source_for_thumb = webp_full if os.path.exists(webp_full) else src
        thumb_path = os.path.join(thumb_dir, base_name + '.webp')
        create_thumbnail(source_for_thumb, thumb_path, width=400, quality=80)

def process_other_guides():
    dirs = [
        'public/media/images/tests-guides/SRT',
        'public/media/images/tests-guides/Essay',
        'public/media/images/tests-guides/Deputy Interview guide',
        'public/media/images/tests-guides/Deputy Interview guide/Interview Dressing',
        'public/media/images/tests-guides/Deputy Interview guide/Interview Questions',
    ]
    for d in dirs:
        if not os.path.exists(d):
            continue
        thumb_dir = os.path.join(d, 'thumbnails')
        os.makedirs(thumb_dir, exist_ok=True)
        files = [f for f in os.listdir(d) if os.path.isfile(os.path.join(d, f)) and not f.startswith('.')]
        for fname in files:
            src = os.path.join(d, fname)
            base_name, ext = os.path.splitext(fname)
            thumb_path = os.path.join(thumb_dir, base_name + '.webp')
            create_thumbnail(src, thumb_path, width=400, quality=80)

if __name__ == '__main__':
    print("=== Processing Dashboard Images ===")
    process_dashboard()
    print("=== Processing WAT Guide Images ===")
    process_wat_guides()
    print("=== Processing Other Guide Images ===")
    process_other_guides()
    print("=== Done ===")
