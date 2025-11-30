from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import AllowAny

class EducationOptionsViewSet(viewsets.ViewSet):
    """
    ViewSet público para opciones de educación utilizadas en el formulario dinámico.
    """
    permission_classes = [AllowAny]
    
    def list(self, request):
        from talent.models import EducationLevel, FieldOfStudy
        
        levels = EducationLevel.objects.all().values('id', 'name')
        fields = FieldOfStudy.objects.all().values('id', 'name')
        
        return Response({
            'levels': list(levels),
            'fields': list(fields)
        })


class PhoneCarrierCodeOptionsViewSet(viewsets.ViewSet):
    """
    Opciones para códigos de operadora
    """
    permission_classes = [AllowAny]
    
    def list(self, request):
        from core.models import PhoneCarrierCode
        
        # Obtener todos los códigos ordenados
        carrier_codes = PhoneCarrierCode.objects.select_related('carrier').all().order_by('code')
        
        # Formatear para el frontend
        codes_list = []
        for code in carrier_codes:
            carrier_name = code.carrier.name if code.carrier else code.type
            codes_list.append({
                'id': code.id,
                'code': code.code,
                'carrier': carrier_name,
                'display': f"{code.code} ({carrier_name})"
            })
        
        return Response(codes_list)
