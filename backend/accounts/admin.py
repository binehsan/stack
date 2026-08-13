from django.contrib import admin

from .models import Profile, PushToken

admin.site.register(Profile)
admin.site.register(PushToken)
