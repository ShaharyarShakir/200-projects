import time
from fastapi.testclient import TestClient
from app.main import app

BASE_URL = "/api/v1"


def test_ai_story_generation():
    """Integration test for AI Story & Scene Generation via Ollama/Gemini gateway and applying to video timeline."""
    print("=== AI Story & Scene Generation Layer Integration Test ===")

    client = TestClient(app)

    # 1. Register / Login Test User
    user_email = f"ai_story_user_{int(time.time())}@brainrot.studio"
    user_pass = "SecurePass123!"

    print(f"1. Registering test user ({user_email})...")
    reg_resp = client.post(
        f"{BASE_URL}/auth/register",
        json={
            "email": user_email,
            "password": user_pass,
            "full_name": "AI Pipeline Tester",
        },
    )
    assert reg_resp.status_code == 201, f"Registration failed: {reg_resp.text}"

    login_resp = client.post(
        f"{BASE_URL}/auth/login",
        json={"email": user_email, "password": user_pass},
    )
    assert login_resp.status_code == 200, f"Login failed: {login_resp.text}"
    token = login_resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    print("✓ Authenticated successfully.")

    # 2. Create Project & Video
    print("2. Creating Project & Video...")
    proj_resp = client.post(
        f"{BASE_URL}/projects",
        json={"name": "AI Story Test Project", "description": "LangGraph AI Generation Testing"},
        headers=headers,
    )
    assert proj_resp.status_code == 201
    project_id = proj_resp.json()["id"]

    vid_resp = client.post(
        f"{BASE_URL}/projects/{project_id}/videos",
        json={"title": "Secretly Rich Roommate Short"},
        headers=headers,
    )
    assert vid_resp.status_code == 201
    video_id = vid_resp.json()["id"]
    print(f"✓ Created Project ({project_id}) & Video ({video_id}).")

    # 3. Trigger AI Story Generation Job
    prompt_text = "Make a 30 second brainrot story about a broke college student who discovers his roommate is secretly rich."
    print(f"3. Triggering AI Generation Job with prompt: '{prompt_text}'...")
    gen_resp = client.post(
        f"{BASE_URL}/projects/{project_id}/videos/{video_id}/generate",
        json={
            "prompt": prompt_text,
            "target_duration_ms": 30000,
            "tone": "chaotic",
            "language": "en",
        },
        headers=headers,
    )
    assert gen_resp.status_code == 202, f"Failed queueing generation job: {gen_resp.text}"
    job_data = gen_resp.json()
    job_id = job_data["job_id"]
    print(f"✓ AI Generation job queued with ID: {job_id}")

    # 4. Poll Job Status
    print("4. Polling generation job status...")
    completed = False
    story_version_id = None
    story_preview = None

    for i in range(15):
        time.sleep(1)
        status_resp = client.get(
            f"{BASE_URL}/projects/{project_id}/videos/{video_id}/generation-jobs/{job_id}",
            headers=headers,
        )
        assert status_resp.status_code == 200, f"Error getting job status: {status_resp.text}"
        job_info = status_resp.json()
        print(f"   [Poll {i+1}] Status: {job_info['status']}, Progress: {job_info['progress']}%")

        if job_info["status"] == "completed":
            completed = True
            story_version_id = job_info["story_version_id"]
            story_preview = job_info["story_preview"]
            break
        elif job_info["status"] == "failed":
            raise AssertionError(f"AI Generation Job failed: {job_info.get('error_message')}")

    assert completed, "Generation job timed out."
    assert story_version_id is not None
    assert story_preview is not None
    print(f"✓ AI Story Generation completed. Generated version ID: {story_version_id}")
    print(f"  Title: '{story_preview['content']['title']}'")
    print(f"  Hook: '{story_preview['content']['hook']}'")
    print(f"  Generated {len(story_preview['content']['scenes'])} scenes.")

    # 5. Apply Story Version to Timeline
    print("5. Applying generated story version to video timeline...")
    apply_resp = client.post(
        f"{BASE_URL}/projects/{project_id}/videos/{video_id}/stories/{story_version_id}/apply",
        headers=headers,
    )
    assert apply_resp.status_code == 200, f"Failed applying story version: {apply_resp.text}"
    tl_data = apply_resp.json()

    # 6. Verify Timeline Integration
    print("6. Verifying calculated scenes, durations, and captions in database timeline...")
    scenes = tl_data["scenes"]
    captions = tl_data["captions"]
    comp = tl_data["composition"]

    assert len(scenes) == len(story_preview['content']['scenes'])
    assert comp["duration_ms"] > 0
    assert scenes[0]["start_ms"] == 0
    assert len(captions) > 0

    print("✓ Timeline updated successfully from AI Story output:")
    for sc in scenes:
        print(f"   Scene S{sc['order']+1}: {sc['title']} ({sc['duration_ms']}ms) Start: {sc['start_ms']}ms")
    print(f"   Total composition duration: {comp['duration_ms']}ms")
    print(f"   Captions created: {len(captions)}")

    print("\n🎉 ALL AI STORY & SCENE GENERATION TESTS PASSED PERFECTLY!")


if __name__ == "__main__":
    test_ai_story_generation()
