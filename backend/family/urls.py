from django.urls import path

from .views import (
    CreateGroupStackView,
    GroupInviteListView,
    GroupMemberProfileView,
    GroupStackDetailView,
    GroupTaskDetailView,
    GroupTaskListView,
    LeaveGroupStackView,
    MyGroupStacksView,
    NudgeGroupTaskView,
    RespondGroupInviteView,
    SendGroupInviteView,
)

urlpatterns = [
    path('mine/', MyGroupStacksView.as_view()),
    path('create/', CreateGroupStackView.as_view()),
    path('invites/', GroupInviteListView.as_view()),
    path('invites/<int:invite_id>/respond/', RespondGroupInviteView.as_view()),
    path('<int:stack_id>/', GroupStackDetailView.as_view()),
    path('<int:stack_id>/leave/', LeaveGroupStackView.as_view()),
    path('<int:stack_id>/invite/', SendGroupInviteView.as_view()),
    path('<int:stack_id>/tasks/', GroupTaskListView.as_view()),
    path('<int:stack_id>/tasks/<int:task_id>/', GroupTaskDetailView.as_view()),
    path('<int:stack_id>/tasks/<int:task_id>/nudge/', NudgeGroupTaskView.as_view()),
    path('<int:stack_id>/members/<int:user_id>/profile/', GroupMemberProfileView.as_view()),
]
