from rest_framework import serializers
from .models import EvaluationPeriod, Competency, PerformanceReview, ReviewDetail
from core.serializers import title_case_cleaner

class EvaluationPeriodSerializer(serializers.ModelSerializer):
    class Meta: model = EvaluationPeriod; fields = '__all__'

class CompetencySerializer(serializers.ModelSerializer):
    job_titles_names = serializers.StringRelatedField(many=True, source='job_titles', read_only=True)

    class Meta: 
        model = Competency
        fields = '__all__'
    
    def validate_name(self, value):
        return title_case_cleaner(value)

class ReviewDetailSerializer(serializers.ModelSerializer):
    competency_name = serializers.CharField(source='competency.name', read_only=True)
    competency_description = serializers.CharField(source='competency.description', read_only=True)
    
    class Meta: 
        model = ReviewDetail
        fields = ['id', 'competency', 'competency_name', 'competency_description', 'score', 'comment']

class PerformanceReviewSerializer(serializers.ModelSerializer):
    # Datos de lectura enriquecidos navegando las relaciones de Employment
    employee_name = serializers.CharField(source='employment.person.__str__', read_only=True)
    employee_person_id = serializers.IntegerField(source='employment.person.id', read_only=True) # ID para validar en frontend
    
    position_name = serializers.CharField(source='employment.position.__str__', read_only=True)
    department_name = serializers.CharField(source='employment.position.department.name', read_only=True)
    
    evaluator_name = serializers.CharField(source='evaluator.__str__', read_only=True)
    evaluator_id = serializers.IntegerField(source='evaluator.id', read_only=True) # ID para validar en frontend
    
    period_name = serializers.CharField(source='period.name', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    
    # Detalles (Preguntas) anidados
    details = ReviewDetailSerializer(many=True, read_only=True)

    class Meta:
        model = PerformanceReview
        fields = '__all__'