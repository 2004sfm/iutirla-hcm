import os
import django
from datetime import date

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from training.models import Course, CourseModule, CourseLesson, CourseResource
from core.models import Person, Gender

def verify_refactor():
    print("Verifying Refactor...")

    # Ensure gender exists
    gender, _ = Gender.objects.get_or_create(name="Masculino")

    # Create Instructor
    instructor, _ = Person.objects.get_or_create(
        first_name="Test",
        paternal_surname="Instructor",
        defaults={
            "gender": gender,
            "birthdate": date(1990, 1, 1)
        }
    )

    # Create Course
    course = Course.objects.create(
        name="Refactor Test Course",
        start_date=date.today(),
        end_date=date.today(),
        instructor=instructor
    )

    # Create Module
    module = CourseModule.objects.create(
        course=course,
        name="Test Module",
        order=1
    )

    # Create Lesson
    lesson = CourseLesson.objects.create(
        module=module,
        title="Test Lesson",
        content="Lesson Content",
        order=1
    )

    # Create Resource linked to Lesson
    resource = CourseResource.objects.create(
        course=course,
        lesson=lesson,
        name="Test Resource",
        resource_type=CourseResource.Type.LINK,
        url="https://example.com"
    )

    print(f"✅ Lesson Created: {lesson}")
    print(f"✅ Resource Created: {resource}")
    print(f"✅ Resource Linked to Lesson: {resource.lesson == lesson}")

    # Verify reverse relationship
    lesson_resources = lesson.resources.all()
    print(f"✅ Lesson Resources Count: {lesson_resources.count()}")
    print(f"✅ Lesson Resource Name: {lesson_resources.first().name}")

    # Cleanup
    course.delete()
    instructor.delete()
    print("Cleanup complete.")

if __name__ == "__main__":
    verify_refactor()
