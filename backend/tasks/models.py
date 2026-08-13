from django.conf import settings
from django.db import models


class Task(models.Model):
    """A single item on today's stack. Deliberately minimal: no due dates,
    categories, or priorities — Stack is a dump list, not a planner."""

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='tasks'
    )
    text = models.CharField(max_length=280)
    completed = models.BooleanField(default=False)
    # Focus mode: up to 3 tasks starred as "today's focus" (enforced in the view).
    starred = models.BooleanField(default=False)
    # Set once the opt-in carry-forward prompt has resolved this task (brought
    # forward or skipped), so a past unfinished task is never asked about twice.
    carry_resolved = models.BooleanField(default=False)
    # Manual drag-to-reorder priority within a day (lower = higher up). Ties
    # (the common case — never manually reordered) fall back to created_at,
    # preserving the original "most recent first" behavior.
    order = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['order', '-created_at']

    def __str__(self):
        return self.text
