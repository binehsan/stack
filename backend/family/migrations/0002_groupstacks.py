import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('family', '0001_initial'),
    ]

    operations = [
        # Rename model classes/tables. RenameModel updates every FK `to=`
        # reference pointing at these models automatically (same app).
        migrations.RenameModel(old_name='FamilyStack', new_name='GroupStack'),
        migrations.RenameModel(old_name='FamilyMembership', new_name='GroupMembership'),
        migrations.RenameModel(old_name='FamilyInvite', new_name='GroupInvite'),
        migrations.RenameModel(old_name='FamilyTask', new_name='GroupTask'),

        # A user can now belong to any number of group stacks — the old
        # OneToOneField (at most one stack per user) becomes a plain FK.
        # SQLite rebuilds the table to drop the implied UNIQUE constraint;
        # existing single-membership rows trivially satisfy the looser FK.
        migrations.AlterField(
            model_name='groupmembership',
            name='user',
            field=models.ForeignKey(
                on_delete=django.db.models.deletion.CASCADE,
                related_name='group_memberships',
                to=settings.AUTH_USER_MODEL,
            ),
        ),
        # DB-level backstop against joining the same stack twice (previously
        # only enforced by application logic checking before invite/accept).
        migrations.AddConstraint(
            model_name='groupmembership',
            constraint=models.UniqueConstraint(
                fields=('stack', 'user'), name='unique_membership_per_stack'
            ),
        ),

        migrations.AddField(
            model_name='groupstack',
            name='image',
            field=models.ImageField(blank=True, null=True, upload_to='group_stacks/'),
        ),

        # related_name renames — no DB schema impact (Python-side reverse
        # accessor names only), kept in sync so `makemigrations` doesn't
        # flag these as pending changes later.
        migrations.AlterField(
            model_name='groupstack',
            name='created_by',
            field=models.ForeignKey(
                on_delete=django.db.models.deletion.CASCADE,
                related_name='owned_group_stacks',
                to=settings.AUTH_USER_MODEL,
            ),
        ),
        migrations.AlterField(
            model_name='groupinvite',
            name='invited_by',
            field=models.ForeignKey(
                on_delete=django.db.models.deletion.CASCADE,
                related_name='group_invites_sent',
                to=settings.AUTH_USER_MODEL,
            ),
        ),
        migrations.AlterField(
            model_name='groupinvite',
            name='invited_user',
            field=models.ForeignKey(
                on_delete=django.db.models.deletion.CASCADE,
                related_name='group_invites_received',
                to=settings.AUTH_USER_MODEL,
            ),
        ),
        migrations.AlterField(
            model_name='grouptask',
            name='created_by',
            field=models.ForeignKey(
                on_delete=django.db.models.deletion.CASCADE,
                related_name='created_group_tasks',
                to=settings.AUTH_USER_MODEL,
            ),
        ),
        migrations.AlterField(
            model_name='grouptask',
            name='assigned_to',
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name='assigned_group_tasks',
                to=settings.AUTH_USER_MODEL,
            ),
        ),
    ]
