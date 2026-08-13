from rest_framework import serializers

from .models import Task


class TaskSerializer(serializers.ModelSerializer):
    class Meta:
        model = Task
        fields = ['id', 'text', 'completed', 'starred', 'order', 'created_at']
        # order changes only through the dedicated /reorder/ action, not a
        # regular PATCH, so a bulk reorder is always a full, consistent pass.
        read_only_fields = ['id', 'order', 'created_at']
