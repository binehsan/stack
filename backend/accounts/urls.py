from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView

from .views import (
    ChangePasswordView,
    DeleteAccountView,
    LoginView,
    PasswordResetConfirmView,
    PasswordResetRequestView,
    ProfileView,
    RegisterPushTokenView,
    RegisterView,
    RegisterWebPushSubscriptionView,
    UnregisterWebPushSubscriptionView,
)

urlpatterns = [
    path('register/', RegisterView.as_view()),
    path('login/', LoginView.as_view()),
    path('refresh/', TokenRefreshView.as_view()),
    path('change-password/', ChangePasswordView.as_view()),
    path('password-reset/', PasswordResetRequestView.as_view()),
    path('password-reset-confirm/', PasswordResetConfirmView.as_view()),
    path('delete-account/', DeleteAccountView.as_view()),
    path('profile/', ProfileView.as_view()),
    path('push-token/', RegisterPushTokenView.as_view()),
    path('web-push-subscribe/', RegisterWebPushSubscriptionView.as_view()),
    path('web-push-unsubscribe/', UnregisterWebPushSubscriptionView.as_view()),
]
