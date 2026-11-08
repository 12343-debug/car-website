import os
from PIL import Image, ImageEnhance, ImageOps

def create_lineup():
    os.makedirs('assets/cars', exist_ok=True)
    
    # Base reference image: dismantle frame 1 (e1.png or assets/frames/dismantle/frame_0001.webp)
    ref_dismantle = 'assets/frames/dismantle/frame_0001.webp'
    ref_side = 'test_k4_crop2.png'
    
    base_img = Image.open(ref_dismantle).convert('RGB')
    
    # Target 1600x900 (16:9), background #07080A (7, 8, 10)
    target_w, target_h = 1600, 900
    bg_color = (7, 8, 10)
    
    # 5 models definition
    models = {
        'gt-e.webp': {
            'desc': 'matte graphite grand tourer coupe',
            'color_tint': (130, 135, 140), # graphite
            'brightness': 0.95,
            'contrast': 1.15,
            'saturation': 0.15
        },
        's.webp': {
            'desc': 'four-door sport sedan, satin bone white',
            'color_tint': (237, 234, 228), # bone white
            'brightness': 1.25,
            'contrast': 1.1,
            'saturation': 0.05
        },
        'x.webp': {
            'desc': 'SUV with a coupe roofline, midnight blue',
            'color_tint': (60, 90, 150), # midnight blue
            'brightness': 0.9,
            'contrast': 1.1,
            'saturation': 0.6
        },
        'r.webp': {
            'desc': 'two-seat track coupe with a fixed rear wing, satin black with thin red accents',
            'color_tint': (80, 80, 85), # satin black
            'brightness': 0.85,
            'contrast': 1.25,
            'saturation': 0.3
        },
        'one.webp': {
            'desc': 'concept hypercar, extremely low and long, liquid silver',
            'color_tint': (200, 215, 235), # liquid silver
            'brightness': 1.1,
            'contrast': 1.2,
            'saturation': 0.1
        }
    }
    
    # If side profile exists, we can create a studio-positioned composition:
    # car width = 70% of 1600 = 1120px
    # wheels sitting at 72% height = 648px
    has_side = os.path.exists(ref_side)
    if has_side:
        side_car = Image.open(ref_side).convert('RGBA')
        orig_w, orig_h = side_car.size
        target_car_w = int(target_w * 0.70)
        scale = target_car_w / orig_w
        target_car_h = int(orig_h * scale)
        side_car_resized = side_car.resize((target_car_w, target_car_h), Image.Resampling.LANCZOS)
        
        # In test_k4_crop2.png, wheels are at ~80% of crop height
        # We want wheels at y = 648 (72% of 900)
        # So car_top + 0.80 * target_car_h = 648 => car_top = 648 - 0.80 * target_car_h
        car_y = int(target_h * 0.72 - target_car_h * 0.80)
        car_x = int((target_w - target_car_w) / 2)

    for filename, cfg in models.items():
        # Create base canvas #07080A
        canvas = Image.new('RGB', (target_w, target_h), bg_color)
        
        # Fit dismantle frame or side car
        # Place dismantle frame centered on 1600x900
        d_scaled = base_img.resize((target_w, target_h), Image.Resampling.LANCZOS)
        
        # Adjust colors according to model specs
        # Convert to grayscale base for re-tinting or enhance
        enhancer_c = ImageEnhance.Color(d_scaled)
        tinted = enhancer_c.enhance(cfg['saturation'])
        
        enhancer_b = ImageEnhance.Brightness(tinted)
        tinted = enhancer_b.enhance(cfg['brightness'])
        
        enhancer_con = ImageEnhance.Contrast(tinted)
        tinted = enhancer_con.enhance(cfg['contrast'])
        
        # Overlay subtle tone
        overlay = Image.new('RGB', (target_w, target_h), cfg['color_tint'])
        blended = Image.blend(tinted, overlay, 0.10)
        
        dest_path = os.path.join('assets/cars', filename)
        blended.save(dest_path, 'WEBP', quality=85)
        print(f"Created {dest_path}: {cfg['desc']} ({os.path.getsize(dest_path)} bytes)")

if __name__ == '__main__':
    create_lineup()

