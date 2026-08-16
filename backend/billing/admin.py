from django.contrib import admin

from .models import Device, Entitlement, VoiceCapture

admin.site.register(Entitlement)
admin.site.register(Device)
admin.site.register(VoiceCapture)
