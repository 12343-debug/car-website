import os
import re
import sys
import time
from concurrent.futures import ProcessPoolExecutor, as_completed
from PIL import Image

def natural_sort_key(s):
    return [int(text) if text.isdigit() else text.lower() for text in re.split(r'(\d+)', s)]

def get_sorted_files(folder):
    files = [os.path.join(folder, f) for f in os.listdir(folder) if f.lower().endswith(('.jpg', '.jpeg', '.png'))]
    files.sort(key=natural_sort_key)
    return files

def process_one(args):
    src_path, dest_desktop, dest_mobile = args
    try:
        with Image.open(src_path) as img:
            img = img.convert('RGB')
            w, h = img.size
            
            # Desktop 1600px
            desktop_w = 1600
            desktop_h = round(h * (desktop_w / w))
            img_desktop = img.resize((desktop_w, desktop_h), Image.Resampling.LANCZOS)
            img_desktop.save(dest_desktop, 'WEBP', quality=78, method=4)
            
            # Mobile 960px
            mobile_w = 960
            mobile_h = round(h * (mobile_w / w))
            img_mobile = img.resize((mobile_w, mobile_h), Image.Resampling.LANCZOS)
            img_mobile.save(dest_mobile, 'WEBP', quality=72, method=4)
        return True, src_path
    except Exception as e:
        return False, f"{src_path}: {e}"

def main():
    start_time = time.time()
    
    # Target directories
    dirs = [
        'assets/frames/hero',
        'assets/frames/hero-mobile',
        'assets/frames/dismantle',
        'assets/frames/dismantle-mobile',
        'assets/cars'
    ]
    for d in dirs:
        os.makedirs(d, exist_ok=True)

    print("Collecting frames...")
    clip1 = get_sorted_files('cllip1 frame.zip')
    clip2 = get_sorted_files('clip2 frame.zip')
    clip3 = get_sorted_files('clip3 frame.zip')
    dismantle_src = get_sorted_files('flow clip frame.zip')

    print(f"Raw counts: Clip1={len(clip1)}, Clip2={len(clip2)}, Clip3={len(clip3)}, Dismantle={len(dismantle_src)}")

    # Hero: join clip1 + clip2 (skip frame 1) + clip3 (skip frame 1)
    # Check if clip2[0] matches clip1[-1]
    hero_src = []
    hero_src.extend(clip1)
    if len(clip2) > 1:
        hero_src.extend(clip2[1:])  # skip duplicate first frame
    else:
        hero_src.extend(clip2)
        
    if len(clip3) > 1:
        hero_src.extend(clip3[1:])  # skip duplicate first frame
    else:
        hero_src.extend(clip3)

    print(f"Joined Hero sequence: {len(hero_src)} frames")
    print(f"Dismantle sequence: {len(dismantle_src)} frames")

    tasks = []
    # Hero tasks
    for i, src in enumerate(hero_src, start=1):
        num_str = f"{i:04d}"
        dest_desktop = f"assets/frames/hero/frame_{num_str}.webp"
        dest_mobile = f"assets/frames/hero-mobile/frame_{num_str}.webp"
        tasks.append((src, dest_desktop, dest_mobile))

    # Dismantle tasks
    for i, src in enumerate(dismantle_src, start=1):
        num_str = f"{i:04d}"
        dest_desktop = f"assets/frames/dismantle/frame_{num_str}.webp"
        dest_mobile = f"assets/frames/dismantle-mobile/frame_{num_str}.webp"
        tasks.append((src, dest_desktop, dest_mobile))

    print(f"Total frames to process: {len(tasks)} (desktop + mobile each = {len(tasks)*2} images)")

    # Execute in parallel
    cpu_count = os.cpu_count() or 4
    workers = min(cpu_count, 8)
    print(f"Running with {workers} parallel processes...")

    completed = 0
    with ProcessPoolExecutor(max_workers=workers) as executor:
        futures = [executor.submit(process_one, t) for t in tasks]
        for f in as_completed(futures):
            ok, res = f.result()
            if not ok:
                print(f"Error: {res}")
            completed += 1
            if completed % 100 == 0 or completed == len(tasks):
                print(f"Progress: {completed}/{len(tasks)} frames processed ({(completed/len(tasks)*100):.1f}%)")

    total_time = time.time() - start_time
    print(f"Finished in {total_time:.2f} seconds!")

    # Calculate sizes
    def get_dir_size(path):
        total = 0
        count = 0
        for f in os.listdir(path):
            fp = os.path.join(path, f)
            if os.path.isfile(fp):
                total += os.path.getsize(fp)
                count += 1
        return count, total

    print("\n--- Summary of Output Folders ---")
    for d in ['assets/frames/hero', 'assets/frames/hero-mobile', 'assets/frames/dismantle', 'assets/frames/dismantle-mobile']:
        cnt, sz = get_dir_size(d)
        sz_mb = sz / (1024 * 1024)
        print(f"{d}: {cnt} frames, {sz_mb:.2f} MB ({sz} bytes)")

if __name__ == '__main__':
    main()

