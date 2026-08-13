from django.contrib import admin

from .models import GroupInvite, GroupMembership, GroupStack, GroupTask

admin.site.register(GroupStack)
admin.site.register(GroupMembership)
admin.site.register(GroupInvite)
admin.site.register(GroupTask)
