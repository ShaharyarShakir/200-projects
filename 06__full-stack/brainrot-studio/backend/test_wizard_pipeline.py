#!/usr/bin/env python3
import time
import pytest
from fastapi.testclient import TestClient
from app.main import app

BASE_URL = "/api/v1"

def test_wizard_end_to_end_flow():
    client = TestClient(app)

    # 1. Register & Login test user
    user_email = f"wizard_user_{int(time.time())}@brainrot.studio"
    password = "TestPassword123!"

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

    # 2. Fetch characters and niches
    res_chars = client.get(f"{BASE_URL}/characters", headers=headers)
    assert res_chars.status_code == 200
    chars = res_chars.json()
    assert len(chars) >= 2
    char_ids = [chars[0]["id"], chars[1]["id"]]

    res_niches = client.get(f"{BASE_URL}/niches", headers=headers)
    assert res_niches.status_code == 200
    niches = res_niches.json()
    assert len(niches) >= 1

    # 3. Create Project
    res_proj = client.post(
        f"{BASE_URL}/projects",
        headers=headers,
        json={"name": "Wizard Test Project"},
    )
    assert res_proj.status_code == 201
    project_id = res_proj.json()["id"]

    # 4. Create generation session
    res_sess = client.post(
        f"{BASE_URL}/generation-sessions",
        headers=headers,
        json={"project_id": project_id},
    )
    assert res_sess.status_code == 200
    sess_data = res_sess.json()
    session_id = sess_data["id"]
    assert sess_data["current_step"] == 1

    # 5. Save character & niche selections
    res_patch = client.patch(
        f"{BASE_URL}/generation-sessions/{session_id}",
        headers=headers,
        json={"current_step": 2, "character_ids": char_ids, "niche": "Comedy"},
    )
    assert res_patch.status_code == 200

    # 6. Generate AI Topics
    res_topics = client.post(f"{BASE_URL}/generation-sessions/{session_id}/topics", headers=headers)
    print("TOPICS RESPONSE:", res_topics.status_code, res_topics.text)
    assert res_topics.status_code == 200
    topics = res_topics.json()
    assert len(topics) >= 1
    selected_topic_id = topics[0]["id"]

    # 7. Select Topic
    res_select = client.post(
        f"{BASE_URL}/generation-sessions/{session_id}/select-topic",
        headers=headers,
        json={"topic_id": selected_topic_id},
    )
    assert res_select.status_code == 200

    # 8. Generate AI Script
    res_script = client.post(f"{BASE_URL}/generation-sessions/{session_id}/script", headers=headers)
    assert res_script.status_code == 200
    script = res_script.json()
    assert len(script["scenes"]) >= 1

    # 9. Single Scene AI Regeneration
    res_regen = client.patch(
        f"{BASE_URL}/generation-sessions/{session_id}/script/scenes/0",
        headers=headers,
        json={"instruction": "Make the line more dramatic"},
    )
    assert res_regen.status_code == 200
    regen_scene = res_regen.json()
    assert regen_scene["scene_number"] == 1

    # 10. Generate Video Style Config from Prompt
    res_style = client.post(
        f"{BASE_URL}/generation-sessions/{session_id}/style",
        headers=headers,
        json={"prompt": "Yellow bold pop captions with thick dark outline"},
    )
    assert res_style.status_code == 200
    style_cfg = res_style.json()
    assert "font_family" in style_cfg

    # 11. Trigger Render to compile video timeline
    res_render = client.post(f"{BASE_URL}/generation-sessions/{session_id}/render", headers=headers)
    assert res_render.status_code == 200
    render_out = res_render.json()
    assert render_out["status"] == "rendering"
    assert "video_id" in render_out
