from rest_framework import serializers


class EntitlementSerializer(serializers.Serializer):
    """Read-only output shape for GET /api/billing/entitlement/. Serializes
    a plain dict assembled in the view (not a ModelSerializer over
    Entitlement directly) since most of these fields — groups_founded,
    devices, voice_captures_used, voice_reset_at — are computed from other
    apps' data, not columns on the model."""

    is_pro = serializers.BooleanField()
    status = serializers.CharField()
    expires_at = serializers.DateTimeField(allow_null=True)
    is_lifetime = serializers.BooleanField()
    groups_founded = serializers.IntegerField()
    groups_founded_limit = serializers.IntegerField(allow_null=True)
    devices = serializers.IntegerField()
    devices_limit = serializers.IntegerField(allow_null=True)
    voice_captures_used = serializers.IntegerField()
    voice_captures_limit = serializers.IntegerField(allow_null=True)
    voice_reset_at = serializers.DateTimeField()
