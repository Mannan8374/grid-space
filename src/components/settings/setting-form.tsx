"use client";
import React, { useEffect, useRef, useState } from "react";
import { useToast } from "../ui/use-toast";
import { useRouter } from "next/navigation";
import {
  Briefcase,
  Lock,
  LogOut,
  Plus,
  Share,
  User as UserIcon,
} from "lucide-react";
import { Separator } from "../ui/separator";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { io } from "socket.io-client";

import { v4 } from "uuid";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

import { Button } from "../ui/button";
import { ScrollArea } from "../ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Alert, AlertDescription } from "../ui/alert";
import CypressProfileIcon from "../icons/cypressProfileIcon";
import { useSupabaseUser } from "@/lib/provider/supabase-userProvider";
import { createClient } from "@/lib/supabase/client";
import { useAppState } from "@/lib/provider/state-provider";
import { User, workspace } from "@/lib/supabase/supabase.types";
import {
  addCollaborators,
  deleteWorkspace,
  getCollaborators,
  removeCollaborators,
  updateWorkspace,
} from "@/lib/supabase/queries";
import CollaboratorSearch from "../global/colloborator-search";
import LogoutButton from "../global/log-out";


const socket = io({
  path: "/api/socket/io",
});


const SettingsForm = () => {
  const { toast } = useToast();
  const router = useRouter();
  const supabase = createClient();
  const { state, workspaceId, dispatch } = useAppState();
  const [permissions, setPermissions] = useState("private");
  const [collaborators, setCollaborators] = useState<User[] | []>([]);
  const [openAlertMessage, setOpenAlertMessage] = useState(false);
  const [workspaceDetails, setWorkspaceDetails] = useState<workspace>();
  const titleTimerRef = useRef<ReturnType<typeof setTimeout>>();
  const [uploadingProfilePic, setUploadingProfilePic] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const { user } = useSupabaseUser();

  // add collaborators
  const addCollaborator = async (profile: User) => {
    if (!workspaceId) return;

    await addCollaborators([profile], workspaceId);
    setCollaborators([...collaborators, profile]);
  };

  // remove collaborators
  const removeCollaborator = async (user: User) => {
    if (!workspaceId) return;
    if (collaborators.length === 1) {
      setPermissions("private");
    }
    await removeCollaborators([user], workspaceId);
    setCollaborators(
      collaborators.filter((collaborator) => collaborator.id !== user.id)
    );
    router.refresh();
  };

  // on change name (debounced) – TypeScript-safe version
  const workspaceNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!workspaceId) return;

    const newTitle = e.target.value;
    if (!newTitle) return;

    // update local state immediately
    dispatch({
      type: "UPDATE_WORKSPACE",
      payload: { workspace: { title: newTitle }, workspaceId },
    });

    // debounce server update
    if (titleTimerRef.current) clearTimeout(titleTimerRef.current);
    titleTimerRef.current = setTimeout(async () => {
      const result = await updateWorkspace({ title: newTitle }, workspaceId);

      if (result && result.error) {
        toast({
          title: "Error updating workspace name",
          description: "Please try again.",
          variant: "destructive",
        });
      }
    }, 500);
  };

  const onChangeWorkspaceLogo = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    if (!workspaceId) return;
    const file = e.target.files?.[0];
    if (!file) return;
    const uuid = v4();
    setUploadingLogo(true);
    const { data, error } = await supabase.storage
      .from("workspace-logos")
      .upload(`workspaceLogo.${uuid}`, file, {
        cacheControl: "3600",
        upsert: true,
      });

    if (error) {
      setUploadingLogo(false);
      toast({
        title: "Error uploading workspace logo",
        description: "Please try again.",
        variant: "destructive",
      });
      return;
    }

    if (data) {
      dispatch({
        type: "UPDATE_WORKSPACE",
        payload: { workspace: { logo: data.path }, workspaceId },
      });
      await updateWorkspace({ logo: data.path }, workspaceId);
      socket.emit("workspace-logo-updated", workspaceId, data.path);
      toast({
        title: "Workspace logo updated",
        description: "Your workspace logo has been updated successfully.",
      });
    }

    setUploadingLogo(false);
  };

  const onClickAlertConfirm = async () => {
    if (!workspaceId) return;
    if (collaborators.length > 0) {
      await removeCollaborators(collaborators, workspaceId);
    }
    setPermissions("private");
    setOpenAlertMessage(false);
  };

  const onPermissionsChange = (val: string) => {
    if (val === "private") {
      setOpenAlertMessage(true);
    } else setPermissions(val);
  };

  useEffect(() => {
    const showingWorkspace = state.workspaces.find(
      (workspace) => workspace.id === workspaceId
    );
    if (showingWorkspace) setWorkspaceDetails(showingWorkspace);
  }, [workspaceId, state]);

  useEffect(() => {
    if (!workspaceId) return;
    const fetchCollaborators = async () => {
      const response = await getCollaborators(workspaceId);
      if (response.length) {
        setPermissions("shared");
        setCollaborators(response);
      }
    };
    fetchCollaborators();
  }, [workspaceId]);

  return (
    <div className="flex flex-col gap-4">
      <p className="mt-6 flex items-center gap-2">
        <Briefcase size={20} />
        Workspace
      </p>
      <Separator />
      <div className="flex flex-col gap-2">
        <Label
          htmlFor="workspaceName"
          className="text-sm text-muted-foreground"
        >
          Name
        </Label>
        <Input
          name="workspaceName"
          value={workspaceDetails ? workspaceDetails.title : " "}
          placeholder="Workspace Name"
          onChange={workspaceNameChange}
        />
        <Label
          htmlFor="workspaceLogo"
          className="text-sm text-muted-foreground"
        >
          Workspace Logo
        </Label>
        <Input
          name="workspaceLogo"
          type="file"
          accept="image/*"
          placeholder="Workspace Logo"
          onChange={onChangeWorkspaceLogo}
          disabled={uploadingLogo}
        />
      </div>
      <>
        <Label htmlFor="permissions">Permissions</Label>
        <Select onValueChange={onPermissionsChange} value={permissions}>
          <SelectTrigger className="h-26 w-full -mt-3">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectItem value="private">
                <div className="flex items-center justify-center gap-4 p-2">
                  <Lock />
                  <article className="flex flex-col text-left">
                    <span>Private</span>
                    <p>
                      Your workspace is private to you. You can choose to share
                      it later.
                    </p>
                  </article>
                </div>
              </SelectItem>
              <SelectItem value="shared">
                <div className="flex items-center justify-center gap-4 p-2">
                  <Share />
                  <article className="flex flex-col text-left">
                    <span>Shared</span>
                    <span>You can invite collaborators.</span>
                  </article>
                </div>
              </SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>

        {permissions === "shared" && (
          <div>
            <CollaboratorSearch
              existingCollaborators={collaborators}
              getCollaborator={(user) => {
                addCollaborator(user);
              }}
            >
              <Button type="button" className="mt-4 text-sm">
                <Plus />
                Add Collaborators
              </Button>
            </CollaboratorSearch>
            <div className="mt-4">
              <span className="text-sm text-muted-foreground">
                Collaborators {collaborators.length || ""}
              </span>
              <ScrollArea
                className="h-[120px] w-full overflow-y-scroll rounded-md border border-muted-foreground/20"
              >
                {collaborators.length ? (
                  collaborators.map((c) => (
                    <div
                      className="flex items-center justify-between p-4"
                      key={c.id}
                    >
                      <div className="flex items-center gap-4">
                        <Avatar>
                          <AvatarImage src="/avatars/7.png" />
                          <AvatarFallback>PJ</AvatarFallback>
                        </Avatar>
                        <div
                          className="w-[140px] overflow-hidden overflow-ellipsis text-sm text-muted-foreground sm:w-[300px]"
                        >
                          {c.email}
                        </div>
                      </div>
                      <Button
                        variant="secondary"
                        onClick={() => removeCollaborator(c)}
                      >
                        Remove
                      </Button>
                    </div>
                  ))
                ) : (
                  <div className="absolute bottom-0 left-0 right-0 top-0 flex items-center justify-center">
                    <span className="text-sm text-muted-foreground">
                      You have no collaborators
                    </span>
                  </div>
                )}
              </ScrollArea>
            </div>
          </div>
        )}
        <Alert variant={"destructive"}>
          <AlertDescription>
            Warning! deleting your workspace will permanantly delete all data
            related to this workspace.
          </AlertDescription>
          <Button
            type="submit"
            size={"sm"}
            variant={"destructive"}
            className="mt-4 border-2 border-destructive bg-destructive/40 text-sm"
            onClick={async () => {
              if (!workspaceId) return;
              await deleteWorkspace(workspaceId);
              toast({ title: "Successfully deleted your workspace" });
              dispatch({ type: "DELETE_WORKSPACE", payload: workspaceId });
              router.replace("/dashboard");
            }}
          >
            Delete Workspace
          </Button>
        </Alert>
        <p className="mt-6 flex items-center gap-2">
          <UserIcon size={20} /> Profile
          <small className="cursor-not-allowed text-muted-foreground">
            {user ? user.email : ""}
          </small>
        </p>

        <Separator />
        <div className="flex items-center">
          <Avatar>
            <AvatarImage src={""} />
            <AvatarFallback>
              <CypressProfileIcon />
            </AvatarFallback>
          </Avatar>
          <div className="ml-6 flex flex-col">
            <Label
              htmlFor="profilePicture"
              className="text-sm text-muted-foreground"
            >
              Profile Picture
            </Label>
          </div>
        </div>
        <LogoutButton>
          <div className="flex items-center">
            <LogOut />
          </div>
        </LogoutButton>

        <Separator />
      </>
      <AlertDialog open={openAlertMessage}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              Changing a Shared workspace to a Private workspace will remove all
              collaborators permanantly.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setOpenAlertMessage(false)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={onClickAlertConfirm}>
              Continue
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default SettingsForm;
