from django.urls import path

from .views import EntitlementView, RevenueCatWebhookView, VoiceCaptureView

urlpatterns = [
    path('entitlement/', EntitlementView.as_view()),
    path('revenuecat-webhook/', RevenueCatWebhookView.as_view()),
    path('voice-capture/', VoiceCaptureView.as_view()),
]
