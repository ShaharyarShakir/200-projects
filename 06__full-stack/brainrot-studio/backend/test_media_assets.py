import io
import sys
import requests
import time

BASE_URL = "http://localhost:8000/api/v1"


def test_media_assets_and_storage():
    """Integration test for media asset uploads, object storage, presigned URLs, and scene assignment."""
    print("=== Media Assets & Object Storage Integration Test ===")

    # 1. User Registration & Login
    email = f"media_asset_test_{int(time.time())}@example.com"
    password = "testpassword123"

    print("1. Registering/Logging in test user...")
    resp = requests.post(f"{BASE_URL}/auth/register", json={"email": email, "password": password})
    if resp.status_code not in (201, 400):
        print(f"Error registering user: {resp.status_code} {resp.text}")
        sys.exit(1)

    login_resp = requests.post(f"{BASE_URL}/auth/login", json={"email": email, "password": password})
    if login_resp.status_code != 200:
        print(f"Error logging in: {login_resp.status_code} {login_resp.text}")
        sys.exit(1)

    token = login_resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    print("✓ Authenticated successfully.")

    # 2. Create Project & Video
    print("2. Creating test Project & Video...")
    proj_resp = requests.post(f"{BASE_URL}/projects", json={"name": "Media Asset Test Project"}, headers=headers)
    assert proj_resp.status_code == 201, f"Failed to create project: {proj_resp.text}"
    project_id = proj_resp.json()["id"]

    vid_resp = requests.post(f"{BASE_URL}/projects/{project_id}/videos", json={"title": "Asset Test Video"}, headers=headers)
    assert vid_resp.status_code == 201, f"Failed to create video: {vid_resp.text}"
    video_id = vid_resp.json()["id"]
    print(f"✓ Project created ({project_id}), Video created ({video_id}).")

    # 3. Create Scene for assignment test
    scene_resp = requests.post(f"{BASE_URL}/projects/{project_id}/videos/{video_id}/scenes", json={"dialogue": "Scene 1 dialogue"}, headers=headers)
    assert scene_resp.status_code == 201
    scene_id = scene_resp.json()["id"]

    # 4. Upload Image Asset
    print("3. Uploading Image asset (PNG)...")
    fake_png_data = b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x06\x00\x00\x00\x1f\x15c4"
    files = {"file": ("test_image.png", io.BytesIO(fake_png_data), "image/png")}
    upload_resp = requests.post(f"{BASE_URL}/projects/{project_id}/videos/{video_id}/assets", files=files, headers=headers)
    assert upload_resp.status_code == 201, f"Failed uploading image: {upload_resp.text}"
    img_asset = upload_resp.json()
    assert img_asset["asset_type"] == "image"
    assert img_asset["filename"] == "test_image.png"
    assert img_asset["status"] == "ready"
    img_asset_id = img_asset["id"]
    print(f"✓ Image asset uploaded successfully: ID={img_asset_id}, status={img_asset['status']}.")

    # 5. Upload Audio Asset
    print("4. Uploading Audio asset (MP3)...")
    fake_mp3_data = b"ID3\x03\x00\x00\x00\x00\x00\x00Fake MP3 Audio Payload Data String Header"
    files = {"file": ("narrator_voice.mp3", io.BytesIO(fake_mp3_data), "audio/mpeg")}
    upload_resp2 = requests.post(f"{BASE_URL}/projects/{project_id}/videos/{video_id}/assets", files=files, headers=headers)
    assert upload_resp2.status_code == 201, f"Failed uploading audio: {upload_resp2.text}"
    audio_asset = upload_resp2.json()
    assert audio_asset["asset_type"] == "audio"
    print(f"✓ Audio asset uploaded: ID={audio_asset['id']}.")

    # 6. Test File Type Validation (Rejection)
    print("5. Testing file validation with unsupported file type...")
    files = {"file": ("malicious.txt", io.BytesIO(b"Hello world"), "text/plain")}
    rej_resp = requests.post(f"{BASE_URL}/projects/{project_id}/videos/{video_id}/assets", files=files, headers=headers)
    assert rej_resp.status_code == 400, f"Expected 400 Bad Request, got {rej_resp.status_code}"
    print("✓ Unsupported file type correctly rejected (400 Bad Request).")

    # 7. List Assets
    print("6. Listing assets for video...")
    list_resp = requests.get(f"{BASE_URL}/projects/{project_id}/videos/{video_id}/assets", headers=headers)
    assert list_resp.status_code == 200
    assets_list = list_resp.json()
    assert len(assets_list) >= 2
    print(f"✓ Listed {len(assets_list)} assets.")

    # 8. Presigned URL & Download Verification
    print("7. Fetching presigned URL for image asset...")
    url_resp = requests.get(f"{BASE_URL}/projects/{project_id}/videos/{video_id}/assets/{img_asset_id}/url", headers=headers)
    assert url_resp.status_code == 200
    download_url = url_resp.json()["url"]
    print(f"✓ Presigned URL generated: {download_url[:60]}...")

    print("   Downloading binary object from Garage S3...")
    dl_resp = requests.get(download_url)
    assert dl_resp.status_code == 200, f"Failed to download object: {dl_resp.status_code}"
    assert dl_resp.content == fake_png_data, "Downloaded binary data does not match uploaded content!"
    print("✓ Downloaded binary content matches uploaded object byte-for-byte!")

    # 9. Assign Asset to Scene
    print("8. Assigning asset to Scene...")
    patch_resp = requests.patch(f"{BASE_URL}/projects/{project_id}/videos/{video_id}/assets/{img_asset_id}", json={"scene_id": scene_id}, headers=headers)
    assert patch_resp.status_code == 200
    assert patch_resp.json()["scene_id"] == scene_id
    print(f"✓ Asset successfully assigned to Scene {scene_id}.")

    # 10. Delete Asset
    print("9. Deleting audio asset...")
    del_resp = requests.delete(f"{BASE_URL}/projects/{project_id}/videos/{video_id}/assets/{audio_asset['id']}", headers=headers)
    assert del_resp.status_code == 204
    print("✓ Delete endpoint returned 204 No Content.")

    # Verify deleted asset is excluded from list
    list_resp2 = requests.get(f"{BASE_URL}/projects/{project_id}/videos/{video_id}/assets", headers=headers)
    remaining_ids = [a["id"] for a in list_resp2.json()]
    assert audio_asset["id"] not in remaining_ids
    print("✓ Deleted asset properly removed from asset list.")

    print("\n🎉 ALL MEDIA ASSETS & STORAGE INTEGRATION TESTS PASSED PERFECTLY!")


if __name__ == "__main__":
    test_media_assets_and_storage()
