from app.db.database import SessionLocal, engine, Base
from app.db.models import Student, Course, AttendanceRecord

def seed_db():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        # Check if already seeded
        if db.query(Student).first():
            print("Database already contains student records. Skipping seed.")
            return

        print("Seeding sample campus data...")
        # Students
        alice = Student(student_id="S001", name="Alice Sharma", email="alice@lpu.edu", program="B.Tech Computer Science", semester=5)
        bob = Student(student_id="S002", name="Bob Verma", email="bob@lpu.edu", program="B.Tech Information Technology", semester=3)
        db.add_all([alice, bob])
        db.commit()

        # Courses
        cse101 = Course(course_code="CSE101", course_name="Data Structures & Algorithms", faculty="Dr. Rajesh Rao")
        cse202 = Course(course_code="CSE202", course_name="Database Management Systems", faculty="Prof. Anita Desai")
        db.add_all([cse101, cse202])
        db.commit()

        # Attendance: Alice (30/40 = 75% -> Eligible), Bob (20/40 = 50% -> Ineligible)
        att_alice = AttendanceRecord(student_id=alice.student_id, course_id=cse101.id, attended_classes=30, total_classes=40)
        att_bob = AttendanceRecord(student_id=bob.student_id, course_id=cse101.id, attended_classes=20, total_classes=40)
        db.add_all([att_alice, att_bob])
        db.commit()

        print("Successfully seeded database with Alice (S001, eligible) and Bob (S002, ineligible).")
    finally:
        db.close()

if __name__ == "__main__":
    seed_db()
