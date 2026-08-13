from django.conf import settings
from django.db import models


class GroupStack(models.Model):
    """A shared, ongoing task list for a group (not day-scoped like the
    personal Stack — group responsibilities don't reset at midnight). Users
    can belong to any number of these at once (e.g. one for family, one for
    friends) — there's no fixed "type", just a name and members."""

    name = models.CharField(max_length=60)
    image = models.ImageField(upload_to='group_stacks/', null=True, blank=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='owned_group_stacks'
    )
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name


class GroupMembership(models.Model):
    stack = models.ForeignKey(GroupStack, on_delete=models.CASCADE, related_name='memberships')
    # A regular FK, not OneToOne: a user can belong to any number of group
    # stacks at once (unlike the old single-family-stack constraint).
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='group_memberships'
    )
    joined_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=['stack', 'user'], name='unique_membership_per_stack')
        ]


class GroupInvite(models.Model):
    STATUS_PENDING = 'pending'
    STATUS_ACCEPTED = 'accepted'
    STATUS_DECLINED = 'declined'
    STATUS_CHOICES = [
        (STATUS_PENDING, 'Pending'),
        (STATUS_ACCEPTED, 'Accepted'),
        (STATUS_DECLINED, 'Declined'),
    ]

    stack = models.ForeignKey(GroupStack, on_delete=models.CASCADE, related_name='invites')
    invited_user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='group_invites_received'
    )
    invited_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='group_invites_sent'
    )
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default=STATUS_PENDING)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=['stack', 'invited_user'],
                condition=models.Q(status='pending'),
                name='unique_pending_invite_per_user_stack',
            )
        ]


class GroupTask(models.Model):
    stack = models.ForeignKey(GroupStack, on_delete=models.CASCADE, related_name='tasks')
    text = models.CharField(max_length=280)
    completed = models.BooleanField(default=False)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='created_group_tasks'
    )
    # "Nudged" onto someone — null means unassigned/shared.
    assigned_to = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='assigned_group_tasks',
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return self.text
