import os
import django
from django.core.files.uploadedfile import SimpleUploadedFile

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from training.models import Course, CourseModule, CourseLesson
from core.models import Person

def verify_lesson_files():
    print("Verifying CourseLesson file and URL support...")

    # Create dummy data
    from core.models import Gender
    gender, _ = Gender.objects.get_or_create(name="Masculino")
    instructor, _ = Person.objects.get_or_create(
        first_name="Test", 
        paternal_surname="Instructor",
        defaults={'gender': gender, 'birthdate': '1990-01-01'}
    )
    course = Course.objects.create(
        name="Test Course Files",
        start_date="2024-01-01",
        end_date="2024-12-31",
        instructor=instructor
    )
    module = CourseModule.objects.create(course=course, name="Module 1")

    # Test 1: Create Lesson with URL
    print("\nTest 1: Creating Lesson with URL...")
    lesson_url = CourseLesson.objects.create(
        module=module,
        title="Lesson with URL",
        url="https://youtube.com/watch?v=123",
        order=1
    )
    if lesson_url.url == "https://youtube.com/watch?v=123":
        print("✅ URL saved correctly")
    else:
        print(f"❌ URL failed: {lesson_url.url}")

    # Test 2: Create Lesson with File
    print("\nTest 2: Creating Lesson with File...")
    file_content = b"dummy content"
    uploaded_file = SimpleUploadedFile("test_file.txt", file_content, content_type="text/plain")
    
    lesson_file = CourseLesson.objects.create(
        module=module,
        title="Lesson with File",
        file=uploaded_file,
        order=2
    )
    
    if lesson_file.file:
        print(f"✅ File saved correctly: {lesson_file.file.name}")
        # Clean up file
        if os.path.exists(lesson_file.file.path):
            os.remove(lesson_file.file.path)
    else:
        print("❌ File failed to save")

    # Cleanup DB
    course.delete()
    instructor.delete()
    print("\nCleanup complete.")

if __name__ == "__main__":
    verify_lesson_files()
