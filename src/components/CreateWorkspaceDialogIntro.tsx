import { AppDialogNotice } from "@/components/app/AppDialogNotice";

export const CreateWorkspaceDialogIntro = () => {
  return (
    <AppDialogNotice>
      Workspaces use Git worktrees so each branch can run in its own folder.
    </AppDialogNotice>
  );
};
