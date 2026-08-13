from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView

from .views import (
    ChangePasswordView,
    DeleteAccountView,
    LoginView,
    ProfileView,
    RegisterPushTokenView,
    RegisterView,
)

urlpatterns = [
    path('register/', RegisterView.as_view()),
    path('login/', LoginView.as_view()),
    path('refresh/', TokenRefreshView.as_view()),
    path('change-password/', ChangePasswordView.as_view()),
    path('delete-account/', DeleteAccountView.as_view()),
    path('profile/', ProfileView.as_view()),
    path('push-token/', RegisterPushTokenView.as_view()),
]
