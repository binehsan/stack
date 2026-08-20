export default {
  page: { title: 'Settings' },

  profile: {
    heading: 'Profile',
    description: 'Your avatar, username, and account email.',
    usernameLabel: 'Username',
    usernamePlaceholder: 'username',
    usernameUpdated: 'Username updated.',
    saveUsername: 'Save username',
    emailLabel: 'Email',
    errors: {
      failedLoad: 'Failed to load profile.',
      usernameEmpty: 'Username cannot be empty.',
      failedUpdate: 'Failed to update username.',
    },
  },

  avatarUpload: {
    yourAvatar: 'Your avatar',
    uploading: 'Uploading…',
    changeAvatar: 'Change avatar',
    failedUpload: 'Failed to upload avatar.',
  },

  stats: {
    heading: 'Your stats',
    description: 'Streaks and totals, updated live.',
    hotStreak: 'Hot Streak',
    day: 'day',
    days: 'days',
    recordStreak: 'Record Streak',
    tasksCrushed: 'Tasks Crushed',
    stackSessions: 'Stack Sessions',
    bestDayEver: 'Best Day Ever',
  },

  notifications: {
    heading: 'Notifications',
    description: 'Group invites and nudges, pushed to this device.',
    unsupported: "This browser doesn't support push notifications for installed apps.",
    blocked: 'Notifications are blocked for Stack in your browser settings — enable them there to turn this on.',
    pushNotifications: 'Push notifications',
    on: 'On',
    off: 'Off',
    turnOff: 'Turn off',
    turnOn: 'Turn on',
  },

  appearance: {
    heading: 'Appearance',
    description: 'Pick a color family and light/dark mode.',
    mode: 'Mode',
    changeMode: 'Change mode',
    modeSystem: 'Matches your device',
    modeLight: 'Light',
    modeDark: 'Dark',
  },

  themeFamily: {
    classic: 'Classic',
    purple: 'Purple',
    forest: 'Forest Green',
    alpine: 'Alpine Blue',
  },

  language: {
    heading: 'Language',
    description: 'Choose the language Stack is displayed in.',
  },

  account: {
    heading: 'Account',
    description: 'Change your password, or delete your account.',
    currentPassword: 'Current password',
    newPassword: 'New password',
    confirmNewPassword: 'Confirm new password',
    passwordChanged: 'Password changed.',
    changePassword: 'Change password',
    errors: {
      fillAll: 'Fill in all password fields.',
      mismatch: "New passwords don't match.",
      failedChange: 'Failed to change password.',
    },
  },

  dangerZone: {
    heading: 'Danger zone',
    description: "Deleting your account permanently removes your tasks, group stacks, and profile. This can't be undone.",
    password: 'Password',
    confirmPassword: 'Confirm your password',
    deleteAccount: 'Delete account',
    confirmPrompt: 'Are you absolutely sure? This is permanent.',
    cancel: 'Cancel',
    yesDelete: 'Yes, delete my account',
    enterPasswordError: 'Enter your password to confirm.',
    confirmDialogText: 'This permanently deletes your account, tasks, and group stacks. This cannot be undone. Continue?',
    failedDelete: 'Failed to delete account.',
  },

  credit: 'App by Muhammad Amen Ehsan',
};
