import io
import subprocess
import tempfile
import time
from pathlib import Path
import requests
from PIL import Image

BASE_URL = "http://localhost:8000/api/v1"


def generate_sample_video(output_path: Path) -> None:
    """Generates a valid 3-second 640x360 test video using FFmpeg."""
    cmd = [
        "ffmpeg",
        "-y",
        "-f",
        "lavfi",
        "-i",
        "testsrc=duration=3:size=640x360:rate=30",
        "-f",
        "lavfi",
        "-i",
        "sine=frequency=1000:duration=3",
        "-c:v",
        "libx264",
        "-pix_fmt",
        "yuv420p",
        "-c:a",
        "aac",
        str(output_path),
    ]
    res = subprocess.run(
        cmd,
        capture_output=True,
        text=True,
    )

    if res.returncode != 0:
        raise RuntimeError(
            f"Failed to generate test video: {res.stderr}"
        )


def test_media_processing_pipeline():
    """Integration test for media worker asset processing, video metadata extraction, and thumbnail generation."""
    print("=== Media Processing Worker Integration Test ===")

    session_http = requests.Session()

    # 1. Register / Login User
    user_email = f"media_proc_user_{int(time.time())}@brainrot.studio"
    user_pass = "SecurePass123!"

    print(f"1. Registering test user ({user_email})...")
    reg_resp = session_http.post(
        f"{BASE_URL}/auth/register",
        json={
            "email": user_email,
            "password": user_pass,
            "full_name": "Media Pipeline Tester",
        },
    )
    assert reg_resp.status_code == 201, f"Registration failed: {reg_resp.text}"

    login_resp = session_http.post(
        f"{BASE_URL}/auth/login",
        json={
            "email": user_email,
            "password": user_pass,
        },
    )
    assert login_resp.status_code == 200, f"Login failed: {login_resp.text}"
    token = login_resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    print("✓ Authenticated successfully.")

    # 2. Create Project & Video
    print("2. Creating Project & Video...")
    proj_resp = session_http.post(
        f"{BASE_URL}/projects",
        json={
            "name": "Media Processing Test Project",
            "description": "Media worker testing",
        },
        headers=headers,
    )
    assert proj_resp.status_code == 201, f"Project creation failed: {proj_resp.text}"
    project_id = proj_resp.json()["id"]

    vid_resp = session_http.post(
        f"{BASE_URL}/projects/{project_id}/videos",
        json={"title": "Processing Test Video"},
        headers=headers,
    )
    assert vid_resp.status_code == 201, f"Video creation failed: {vid_resp.text}"
    video_id = vid_resp.json()["id"]
    print(f"✓ Created Project ({project_id}) & Video ({video_id}).")

    # 3. Upload Sample Video Asset
    print("3. Generating sample test MP4 video...")
    with tempfile.TemporaryDirectory() as tmp_dir:
        tmp_dir_path = Path(tmp_dir)
        sample_video_path = tmp_dir_path / "sample.mp4"
        generate_sample_video(sample_video_path)

        print("4. Uploading sample MP4 video asset...")
        with open(sample_video_path, "rb") as vf:
            files = {"file": ("test_sample.mp4", vf, "video/mp4")}
            up_resp = session_http.post(
                f"{BASE_URL}/projects/{project_id}/videos/{video_id}/assets",
                files=files,
                headers=headers,
            )

        assert up_resp.status_code == 201, f"Video upload failed: {up_resp.text}"
        video_asset_data = up_resp.json()
        video_asset_id = video_asset_data["id"]

        assert video_asset_data["processing_status"] == "pending"
        assert video_asset_data["purpose"] == "original"
        print(f"✓ Video asset uploaded successfully: ID={video_asset_id}, processing_status=pending.")

        # 4. Trigger Worker Processing Function Directly
        print("5. Triggering worker process_asset execution...")
        from app.workers.jobs import process_asset

        process_asset(video_asset_id)
        print("✓ process_asset finished execution.")

        # 5. Verify Updated Metadata & Derivative Thumbnail
        print("6. Fetching updated asset details...")
        get_asset_resp = session_http.get(
            f"{BASE_URL}/projects/{project_id}/videos/{video_id}/assets/{video_asset_id}",
            headers=headers,
        )
        assert get_asset_resp.status_code == 200
        proc_asset = get_asset_resp.json()

        assert proc_asset["processing_status"] == "ready", f"Expected ready, got {proc_asset['processing_status']}"
        assert proc_asset["width"] == 640
        assert proc_asset["height"] == 360
        assert proc_asset["duration_seconds"] is not None and proc_asset["duration_seconds"] > 2.0
        assert proc_asset["thumbnail_url"] is not None
        print(f"✓ Metadata extracted: {proc_asset['width']}x{proc_asset['height']}, duration={proc_asset['duration_seconds']:.2f}s.")
        print(f"✓ Thumbnail derivative URL generated: {proc_asset['thumbnail_url'][:60]}...")

        # 6. Verify Thumbnail URL binary download
        thumb_download = requests.get(proc_asset["thumbnail_url"])
        assert thumb_download.status_code == 200
        assert len(thumb_download.content) > 0
        print("✓ Verified thumbnail image binary downloadable from S3.")

    # 7. Upload Image Asset & Test Image Dimensions
    print("7. Uploading test PNG image asset...")
    img = Image.new("RGB", (800, 600), color="blue")
    img_byte_arr = io.BytesIO()
    img.save(img_byte_arr, format="PNG")
    img_byte_arr.seek(0)

    files = {"file": ("banner.png", img_byte_arr, "image/png")}
    img_up_resp = session_http.post(
        f"{BASE_URL}/projects/{project_id}/videos/{video_id}/assets",
        files=files,
        headers=headers,
    )
    assert img_up_resp.status_code == 201
    img_asset_id = img_up_resp.json()["id"]

    process_asset(img_asset_id)

    get_img_resp = session_http.get(
        f"{BASE_URL}/projects/{project_id}/videos/{video_id}/assets/{img_asset_id}",
        headers=headers,
    )
    assert get_img_resp.status_code == 200
    proc_img = get_img_resp.json()
    assert proc_img["processing_status"] == "ready"
    assert proc_img["width"] == 800
    assert proc_img["height"] == 600
    print("✓ Image asset processed: width=800, height=600.")

    # 8. Test Retry Endpoint
    print("8. Testing Retry endpoint for asset processing...")
    retry_resp = session_http.post(
        f"{BASE_URL}/projects/{project_id}/videos/{video_id}/assets/{img_asset_id}/retry",
        headers=headers,
    )
    assert retry_resp.status_code == 200
    retried_asset = retry_resp.json()
    assert retried_asset["processing_status"] == "pending"
    print("✓ Retry endpoint successfully set asset processing_status back to pending.")

    print("\n🎉 ALL MEDIA PROCESSING WORKER INTEGRATION TESTS PASSED PERFECTLY!")


if __name__ == "__main__":
    test_media_processing_pipeline()
