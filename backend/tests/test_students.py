def test_get_students(client):
    response = client.get("/api/students/")
    assert response.status_code == 200
    data = response.json()
    assert len(data) > 0
    assert data[0]["student_id"] == "S001"

def test_get_student_by_id(client):
    response = client.get("/api/students/S001")
    assert response.status_code == 200
    assert response.json()["name"] == "Alice"

def test_get_student_not_found(client):
    response = client.get("/api/students/S999")
    assert response.status_code == 404

def test_get_student_attendance(client):
    response = client.get("/api/students/S001/attendance")
    assert response.status_code == 200
    data = response.json()
    assert len(data) > 0
    assert data[0]["attended_classes"] == 30

def test_get_student_courses(client):
    response = client.get("/api/students/S001/courses")
    assert response.status_code == 200
    data = response.json()
    assert len(data) > 0
    assert data[0]["course_code"] == "CSE101"
