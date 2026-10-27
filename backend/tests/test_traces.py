from app.db.models import DecisionTrace, CampusRequest, Student

def test_traces(client, db):
    # Create request to associate with trace
    student = db.query(Student).filter(Student.student_id == "S001").first()
    request = CampusRequest(student_id=student.student_id, request_type="leave")
    db.add(request)
    db.commit()
    
    trace = DecisionTrace(
        request_id=request.id,
        step_number=1,
        event_type="GOAL_RECEIVED",
        component="orchestrator",
        action="start",
        status="success"
    )
    db.add(trace)
    db.commit()

    response = client.get(f"/api/traces/{request.id}")
    assert response.status_code == 200
    data = response.json()
    assert len(data) > 0
    assert data[0]["event_type"] == "GOAL_RECEIVED"
