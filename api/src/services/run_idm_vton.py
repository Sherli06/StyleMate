"""
StyleMate IDM-VTON Free Inference Runner
Calls the hosted yisol/IDM-VTON Gradio API to perform zero-cost virtual try-on.
Supports JSON payload file or CLI arguments to handle large base64 data URIs.
"""

import sys
import os
import ssl
import json
import base64
import argparse
import urllib.request

# Bypass TLS verification for local dev SSL proxy environments
ssl._create_default_https_context = ssl._create_unverified_context

def save_input_to_file(source_str, dest_path):
    """Saves a URL, base64 data URI, or local file path to a local destination file."""
    if not source_str:
        raise ValueError("Image source string is empty")

    source_str = source_str.strip()

    # Data URI
    if source_str.startswith('data:image/'):
        header, encoded = source_str.split(',', 1)
        data = base64.b64decode(encoded)
        with open(dest_path, 'wb') as f:
            f.write(data)
        return dest_path

    # Local file path
    if os.path.exists(source_str):
        import shutil
        shutil.copyfile(source_str, dest_path)
        return dest_path

    # HTTP / HTTPS URL
    if source_str.startswith('http://') or source_str.startswith('https://'):
        req = urllib.request.Request(
            source_str,
            headers={'User-Agent': 'StyleMate/1.0'}
        )
        with urllib.request.urlopen(req, timeout=30) as response, open(dest_path, 'wb') as out_file:
            out_file.write(response.read())
        return dest_path

    raise ValueError(f"Unrecognized image source format: {source_str[:50]}...")

def main():
    parser = argparse.ArgumentParser(description="Run IDM-VTON try-on inference via Gradio")
    parser.add_argument("--payload-file", help="Path to JSON file containing {model, garment, output, description, steps, seed}")
    parser.add_argument("--model", help="Model image URL, data URI, or file path")
    parser.add_argument("--garment", help="Garment image URL, data URI, or file path")
    parser.add_argument("--output", help="Destination path for generated PNG")
    parser.add_argument("--description", default="A fashion garment piece", help="Garment description")
    parser.add_argument("--steps", type=int, default=25, help="Denoising steps (15-30)")
    parser.add_argument("--seed", type=int, default=42, help="Seed")

    args = parser.parse_args()

    if args.payload_file and os.path.exists(args.payload_file):
        with open(args.payload_file, 'r', encoding='utf-8') as pf:
            payload = json.load(pf)
        model = payload.get("model")
        garment = payload.get("garment")
        output = payload.get("output")
        description = payload.get("description", "A fashion garment piece")
        steps = max(20, int(payload.get("steps", 20)))
        seed = int(payload.get("seed", 42))
        auto_crop = bool(payload.get("auto_crop", True))
    else:
        model = args.model
        garment = args.garment
        output = args.output
        description = args.description
        steps = args.steps
        seed = args.seed
        auto_crop = True

    if not model or not garment or not output:
        print(json.dumps({"success": False, "error": "model, garment, and output must be specified"}))
        sys.exit(1)

    temp_dir = os.path.join(os.path.dirname(os.path.abspath(output)), "tmp_vton")
    os.makedirs(temp_dir, exist_ok=True)

    model_tmp = os.path.join(temp_dir, f"model_{os.getpid()}.jpg")
    garment_tmp = os.path.join(temp_dir, f"garment_{os.getpid()}.jpg")

    try:
        # Prepare inputs
        save_input_to_file(model, model_tmp)
        save_input_to_file(garment, garment_tmp)

        from gradio_client import Client, handle_file

        hf_token = (os.environ.get("HF_TOKEN") or os.environ.get("HUGGING_FACE_HUB_TOKEN") or "").strip() or None
        space_name = (os.environ.get("IDM_VTON_SPACE") or "yisol/IDM-VTON").strip() or "yisol/IDM-VTON"

        client = Client(space_name, token=hf_token, ssl_verify=False)

        result = client.predict(
            dict={
                "background": handle_file(model_tmp),
                "layers": [],
                "composite": None
            },
            garm_img=handle_file(garment_tmp),
            garment_des=description,
            is_checked=True,
            is_checked_crop=auto_crop,
            denoise_steps=steps,
            seed=seed,
            api_name="/tryon"
        )

        output_path = result[0] if isinstance(result, (list, tuple)) else result
        if not output_path or not os.path.exists(output_path):
            raise RuntimeError(f"Output image was not created by IDM-VTON: {result}")

        os.makedirs(os.path.dirname(os.path.abspath(output)), exist_ok=True)

        import shutil
        shutil.copyfile(output_path, output)

        print(json.dumps({
            "success": True,
            "output_file": os.path.abspath(output)
        }))

    except Exception as e:
        print(json.dumps({
            "success": False,
            "error": str(e)
        }))
        sys.exit(1)

    finally:
        for p in (model_tmp, garment_tmp):
            try:
                if os.path.exists(p):
                    os.remove(p)
            except Exception:
                pass

if __name__ == "__main__":
    main()
