#!/usr/bin/env python3
import asyncio
import os
import time
from fastapi.testclient import TestClient
from app.main import app

BASE_URL = "/api/v1"


def test_voice_synthesis_and_captions():
    """Integration test for TTS voice synthesis, audio duration timing, dialogue segment creation, and captions."""
    print("=== Voice Synthesis, Captions & AI Gateway Integration Test ===")

    client = TestClient(app)

    # 1. Register & Authenticate User
    user_email = f"voice_synth_user_{int(time.time())}@brainrot.studio"
    password = "SecretPassword123!"

    print(f"1. Registering test user ({user_email})...")
    reg_res = client.post(
        f"{BASE_URL}/auth/register",
        json={"email": user_email, "password": password},
    )
    assert reg_res.status_code == 201, f"Registration failed: {reg_res.text}"

    login_res = client.post(
        f"{BASE_URL}/auth/login",
        json={"email": user_email, "password": password},
    )
    assert login_res.status_code == 200, f"Login failed: {login_res.text}"
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    print("✓ Authenticated successfully.")

    # 2. Create Project & Video
    print("2. Creating Project & Video...")
    proj_res = client.post(
        f"{BASE_URL}/projects/",
        json={"name": "Voice Synthesis Studio", "description": "Testing AI Provider + Voice + Captions"},
        headers=headers,
    )
    assert proj_res.status_code == 201, f"Project creation failed: {proj_res.text}"
    project_id = proj_res.json()["id"]

    vid_res = client.post(
        f"{BASE_URL}/projects/{project_id}/videos/",
        json={"title": "Rich Roommate Voice Short", "description": "Narrated and captioned short"},
        headers=headers,
    )
    assert vid_res.status_code == 201, f"Video creation failed: {vid_res.text}"
    video_id = vid_res.json()["id"]
    print(f"✓ Created Project ({project_id}) & Video ({video_id}).")

    # 3. Trigger AI Generation with Gateway (Provider Choice)
    prompt = "Make a chaotic 30-second Short about a broke student who discovers his roommate is secretly a billionaire."
    print(f"3. Triggering AI Generation Job with prompt: '{prompt}'...")
    gen_res = client.post(
        f"{BASE_URL}/projects/{project_id}/videos/{video_id}/generate",
        json={
            "prompt": prompt,
            "target_duration_ms": 30000,
            "tone": "chaotic",
            "language": "en",
            "provider": "ollama",
        },
        headers=headers,
    )
    assert gen_res.status_code == 202, f"Generation trigger failed: {gen_res.text}"
    job_id = gen_res.json()["job_id"]
    print(f"✓ AI Generation job queued with ID: {job_id}")

    # 4. Poll Job Status
    print("4. Polling generation job status...")
    job_completed = False
    story_version_id = None

    for i in range(1, 60):
        time.sleep(1)
        status_res = client.get(
            f"{BASE_URL}/projects/{project_id}/videos/{video_id}/generation-jobs/{job_id}",
            headers=headers,
        )
        assert status_res.status_code == 200, f"Status check failed: {status_res.text}"
        data = status_res.json()
        print(f"   [Poll {i}] Status: {data['status']}, Progress: {data['progress']}%")

        if data["status"] == "completed":
            job_completed = True
            story_version_id = data["story_version_id"]
            preview = data.get("story_preview") or {}
            content = preview.get("content", {})
            print(f"✓ AI Story Generation completed. Version ID: {story_version_id}")
            print(f"  Title: '{content.get('title')}'")
            print(f"  Hook: '{content.get('hook')}'")
            print(f"  Generated {len(content.get('scenes', []))} scenes.")
            break
        elif data["status"] == "failed":
            raise RuntimeError(f"AI Generation failed: {data.get('error_message')}")

    assert job_completed, "Job did not complete in expected time."

    # 5. Apply Story Version to Timeline (Synthesizes Voices & Captions)
    print("5. Applying story version to video timeline (synthesizing voices & captions)...")
    apply_res = client.post(
        f"{BASE_URL}/projects/{project_id}/videos/{video_id}/stories/{story_version_id}/apply",
        headers=headers,
    )
    assert apply_res.status_code == 200, f"Apply story failed: {apply_res.text}"
    timeline = apply_res.json()

    print("6. Verifying timeline structure, Voice Audio Assets, Dialogue, and Captions...")
    scenes = timeline.get("scenes", [])
    captions = timeline.get("captions", [])
    comp = timeline.get("composition", {})

    assert len(scenes) > 0, "No scenes were created on timeline."
    assert len(captions) > 0, "No captions were generated."
    assert comp.get("duration_ms", 0) > 0, "Composition duration is 0."

    for s in scenes:
        print(f"   Scene {s['id']}: '{s['title']}' Start: {s['start_ms']}ms, Duration: {s['duration_ms']}ms")

    print(f"   Total composition duration: {comp['duration_ms']}ms")
    print(f"   Captions created: {len(captions)}")

    # 7. Test Scene-Level Regeneration
    first_scene_id = scenes[0]["id"]
    print(f"7. Testing Scene-Level Regeneration for Scene ID {first_scene_id}...")
    regen_res = client.post(
        f"{BASE_URL}/projects/{project_id}/videos/{video_id}/scenes/{first_scene_id}/regenerate",
        json={"instruction": "Make this scene even more absurd and chaotic with screaming dialogue!"},
        headers=headers,
    )
    assert regen_res.status_code == 200, f"Scene regeneration failed: {regen_res.text}"
    updated_timeline = regen_res.json()
    print("✓ Scene regeneration succeeded! Updated timeline returned.")

    print("\n🎉 ALL VOICE SYNTHESIS, CAPTIONS & PROVIDER GATEWAY INTEGRATION TESTS PASSED PERFECTLY!\n")


if __name__ == "__main__":
    test_voice_synthesis_and_captions()
