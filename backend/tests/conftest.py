import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.main import app
from app.db.database import Base, get_db
from app.db.models import Student, Course, AttendanceRecord

# Use in-memory SQLite for testing
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL, 
    connect_args={"check_same_thread": False},
    poolclass=StaticPool
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

@pytest.fixture(scope="module")
def db():
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    
    # Seed data
    s1 = Student(student_id="S001", name="Alice", email="alice@lpu.edu", program="B.Tech CS", semester=5)
    s2 = Student(student_id="S002", name="Bob", email="bob@lpu.edu", program="B.Tech IT", semester=3)
    c1 = Course(course_code="CSE101", course_name="Intro to CS", faculty="Dr. Bob")
    
    db.add(s1)
    db.add(s2)
    db.add(c1)
    db.commit() # commit first to get course_id
    
    a1 = AttendanceRecord(student_id=s1.student_id, course_id=c1.id, attended_classes=30, total_classes=40)
    a2 = AttendanceRecord(student_id=s2.student_id, course_id=c1.id, attended_classes=20, total_classes=40)
    
    db.add(a1)
    db.add(a2)
    db.commit()
    
    yield db
    db.close()
    Base.metadata.drop_all(bind=engine)

@pytest.fixture(scope="module")
def client(db):
    def override_get_db():
        try:
            yield db
        finally:
            pass
    
    app.dependency_overrides[get_db] = override_get_db
    yield TestClient(app)
    del app.dependency_overrides[get_db]
