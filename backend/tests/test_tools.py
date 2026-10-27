def test_list_tools(client):
    response = client.get("/api/tools/")
    assert response.status_code == 200
    data = response.json()
    assert len(data) > 0
    names = [t["name"] for t in data]
    assert "get_student_profile" in names

def test_get_tool(client):
    response = client.get("/api/tools/get_student_profile")
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "get_student_profile"

def test_get_tool_not_found(client):
    response = client.get("/api/tools/non_existent_tool")
    assert response.status_code == 404
