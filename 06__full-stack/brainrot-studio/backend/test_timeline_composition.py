import io
import time
import requests
from PIL import Image

BASE_URL = "http://localhost:8000/api/v1"


def test_timeline_and_scene_composition():
    """Integration test for vertical 9:16 Shorts timeline creation, scene reordering, duration updates, and asset transforms."""
    print("=== Shorts Timeline & Scene Composition Integration Test ===")

    session_http = requests.Session()

    # 1. Register / Login User
    user_email = f"timeline_comp_user_{int(time.time())}@brainrot.studio"
    user_pass = "SecurePass123!"

    print(f"1. Registering test user ({user_email})...")
    reg_resp = session_http.post(
        f"{BASE_URL}/auth/register",
        json={
            "email": user_email,
            "password": user_pass,
            "full_name": "Timeline Engine Tester",
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
            "name": "Shorts Timeline Project",
            "description": "Timeline composition testing",
        },
        headers=headers,
    )
    assert proj_resp.status_code == 201
    project_id = proj_resp.json()["id"]

    vid_resp = session_http.post(
        f"{BASE_URL}/projects/{project_id}/videos",
        json={"title": "Dog Realizes He's Broke"},
        headers=headers,
    )
    assert vid_resp.status_code == 201
    video_id = vid_resp.json()["id"]
    print(f"✓ Created Project ({project_id}) & Video ({video_id}).")

    # 3. Fetch Initial Timeline
    print("3. Fetching initial timeline...")
    tl_resp = session_http.get(
        f"{BASE_URL}/projects/{project_id}/videos/{video_id}/timeline",
        headers=headers,
    )
    assert tl_resp.status_code == 200, f"Failed fetching timeline: {tl_resp.text}"
    tl_data = tl_resp.json()
    assert tl_data["composition"]["width"] == 1080
    assert tl_data["composition"]["height"] == 1920
    assert tl_data["composition"]["fps"] == 30
    assert tl_data["composition"]["duration_ms"] == 0
    assert len(tl_data["scenes"]) == 0
    print("✓ Default 9:16 (1080x1920 30FPS) composition initialized successfully.")

    # 4. Add 3 Scenes
    print("4. Adding 3 Scenes with timeline duration...")
    s1_resp = session_http.post(
        f"{BASE_URL}/projects/{project_id}/videos/{video_id}/scenes",
        json={"title": "Scene 1: Waking Up", "duration_ms": 4000},
        headers=headers,
    )
    assert s1_resp.status_code == 201
    s1_id = s1_resp.json()["id"]

    s2_resp = session_http.post(
        f"{BASE_URL}/projects/{project_id}/videos/{video_id}/scenes",
        json={"title": "Scene 2: Checking Bank Account", "duration_ms": 5000},
        headers=headers,
    )
    assert s2_resp.status_code == 201
    s2_id = s2_resp.json()["id"]

    s3_resp = session_http.post(
        f"{BASE_URL}/projects/{project_id}/videos/{video_id}/scenes",
        json={"title": "Scene 3: Panic Attack", "duration_ms": 3500},
        headers=headers,
    )
    assert s3_resp.status_code == 201
    s3_id = s3_resp.json()["id"]

    # 5. Verify Timeline & Timestamp Recalculations
    print("5. Verifying calculated scene start_ms & total composition duration...")
    tl_resp = session_http.get(
        f"{BASE_URL}/projects/{project_id}/videos/{video_id}/timeline",
        headers=headers,
    )
    assert tl_resp.status_code == 200
    tl_data = tl_resp.json()

    scenes = tl_data["scenes"]
    assert len(scenes) == 3
    assert scenes[0]["id"] == s1_id and scenes[0]["start_ms"] == 0 and scenes[0]["duration_ms"] == 4000
    assert scenes[1]["id"] == s2_id and scenes[1]["start_ms"] == 4000 and scenes[1]["duration_ms"] == 5000
    assert scenes[2]["id"] == s3_id and scenes[2]["start_ms"] == 9000 and scenes[2]["duration_ms"] == 3500
    assert tl_data["composition"]["duration_ms"] == 12500
    print("✓ Scene timestamps calculated deterministically (Total: 12500ms).")

    # 6. Reorder Scenes (Scene 3 -> Scene 1 -> Scene 2)
    print("6. Testing Scene Reordering (Scene 3 -> Scene 1 -> Scene 2)...")
    reorder_resp = session_http.patch(
        f"{BASE_URL}/projects/{project_id}/videos/{video_id}/scenes/reorder",
        json={"scene_ids": [s3_id, s1_id, s2_id]},
        headers=headers,
    )
    assert reorder_resp.status_code == 200
    reordered_scenes = reorder_resp.json()["scenes"]

    assert reordered_scenes[0]["id"] == s3_id and reordered_scenes[0]["start_ms"] == 0 and reordered_scenes[0]["duration_ms"] == 3500
    assert reordered_scenes[1]["id"] == s1_id and reordered_scenes[1]["start_ms"] == 3500 and reordered_scenes[1]["duration_ms"] == 4000
    assert reordered_scenes[2]["id"] == s2_id and reordered_scenes[2]["start_ms"] == 7500 and reordered_scenes[2]["duration_ms"] == 5000
    print("✓ Scene reordering recalculated order & timestamps correctly.")

    # 7. Update Scene Duration (Change Scene 1 duration to 7000ms)
    print("7. Testing Scene Duration Update (Scene 1 duration: 4000ms -> 7000ms)...")
    dur_resp = session_http.patch(
        f"{BASE_URL}/projects/{project_id}/videos/{video_id}/scenes/{s1_id}",
        json={"duration_ms": 7000},
        headers=headers,
    )
    assert dur_resp.status_code == 200

    tl_resp = session_http.get(
        f"{BASE_URL}/projects/{project_id}/videos/{video_id}/timeline",
        headers=headers,
    )
    assert tl_resp.status_code == 200
    tl_data = tl_resp.json()
    scenes = tl_data["scenes"]

    assert scenes[1]["id"] == s1_id and scenes[1]["duration_ms"] == 7000
    assert scenes[2]["id"] == s2_id and scenes[2]["start_ms"] == 10500
    assert tl_data["composition"]["duration_ms"] == 15500
    print("✓ Updating scene duration shifted subsequent scenes and updated composition duration (Total: 15500ms).")

    # 8. Delete Scene
    print("8. Testing Scene Deletion (Delete Scene 3)...")
    del_resp = session_http.delete(
        f"{BASE_URL}/projects/{project_id}/videos/{video_id}/scenes/{s3_id}",
        headers=headers,
    )
    assert del_resp.status_code == 204

    tl_resp = session_http.get(
        f"{BASE_URL}/projects/{project_id}/videos/{video_id}/timeline",
        headers=headers,
    )
    assert tl_resp.status_code == 200
    tl_data = tl_resp.json()
    scenes = tl_data["scenes"]
    assert len(scenes) == 2
    assert scenes[0]["id"] == s1_id and scenes[0]["start_ms"] == 0
    assert scenes[1]["id"] == s2_id and scenes[1]["start_ms"] == 7000
    assert tl_data["composition"]["duration_ms"] == 12000
    print("✓ Scene deletion automatically recalculated remaining timestamps.")

    # 9. Test Scene Assets & Transforms
    print("9. Creating asset and attaching to Scene 1 with transform...")
    img = Image.new("RGB", (400, 400), color="red")
    img_byte_arr = io.BytesIO()
    img.save(img_byte_arr, format="PNG")
    img_byte_arr.seek(0)

    up_resp = session_http.post(
        f"{BASE_URL}/projects/{project_id}/videos/{video_id}/assets",
        files={"file": ("character_dog.png", img_byte_arr, "image/png")},
        headers=headers,
    )
    assert up_resp.status_code == 201
    asset_id = up_resp.json()["id"]

    attach_resp = session_http.post(
        f"{BASE_URL}/projects/{project_id}/videos/{video_id}/scenes/{s1_id}/assets",
        json={
            "asset_id": asset_id,
            "role": "character",
            "z_index": 10,
            "x": 0.5,
            "y": 0.65,
            "scale": 0.85,
        },
        headers=headers,
    )
    assert attach_resp.status_code == 201
    scene_asset_data = attach_resp.json()
    scene_asset_id = scene_asset_data["id"]
    assert scene_asset_data["role"] == "character"

    # Update transform (User drag)
    transform_resp = session_http.patch(
        f"{BASE_URL}/projects/{project_id}/videos/{video_id}/scene-assets/{scene_asset_id}",
        json={"x": 0.62, "y": 0.71, "scale": 0.9},
        headers=headers,
    )
    assert transform_resp.status_code == 200
    updated_transform = transform_resp.json()
    assert updated_transform["x"] == 0.62
    assert updated_transform["y"] == 0.71
    assert updated_transform["scale"] == 0.9
    print("✓ Scene Asset positioning & normalized transform updates working.")

    # 10. Test Captions & Tracks
    print("10. Creating Captions & Tracks...")
    cap_resp = session_http.post(
        f"{BASE_URL}/projects/{project_id}/videos/{video_id}/captions",
        json={
            "text": "BRO HOW AM I SUPPOSED TO PAY THIS",
            "start_ms": 1000,
            "end_ms": 3500,
            "style": "meme",
        },
        headers=headers,
    )
    assert cap_resp.status_code == 201

    tr_resp = session_http.post(
        f"{BASE_URL}/projects/{project_id}/videos/{video_id}/tracks",
        json={"name": "Voiceover Track", "track_type": "audio", "order": 0},
        headers=headers,
    )
    assert tr_resp.status_code == 201

    # Verify final timeline structure
    tl_resp = session_http.get(
        f"{BASE_URL}/projects/{project_id}/videos/{video_id}/timeline",
        headers=headers,
    )
    assert tl_resp.status_code == 200
    final_tl = tl_resp.json()
    assert len(final_tl["scenes"]) == 2
    assert len(final_tl["scenes"][0]["assets"]) == 1
    assert len(final_tl["captions"]) == 1
    assert len(final_tl["tracks"]) == 1
    print("✓ Complete timeline payload verified.")

    print("\n🎉 ALL TIMELINE & SCENE COMPOSITION INTEGRATION TESTS PASSED PERFECTLY!")


if __name__ == "__main__":
    test_timeline_and_scene_composition()
