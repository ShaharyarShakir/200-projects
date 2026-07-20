from django.urls import path
from .views import ELDGenerateView, ELDDetailView, ELDPDFExportView

app_name = 'eld'

urlpatterns = [
    path('generate', ELDGenerateView.as_view(), name='eld_generate'),
    path('generate/', ELDGenerateView.as_view(), name='eld_generate_slash'),
    path('<uuid:trip_id>/pdf', ELDPDFExportView.as_view(), name='eld_pdf_export'),
    path('<str:trip_id>/pdf', ELDPDFExportView.as_view(), name='eld_pdf_export_str'),
    path('<uuid:trip_id>', ELDDetailView.as_view(), name='eld_detail'),
    path('<str:trip_id>', ELDDetailView.as_view(), name='eld_detail_str'),
]
