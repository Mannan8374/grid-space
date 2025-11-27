// src/app/(main)/dashboard/[workspaceId]/page.tsx
export const dynamic = "force-dynamic";

import Allsearch from "@/components/Search/Allsearch";
import { getFolders, getWorkspaceDetails } from "@/lib/supabase/queries";
import Link from "next/link";
import { redirect } from "next/navigation";
import React from "react";

const Workspace = async ({ params }: { params: { workspaceId: string } }) => {
  const { data: workspaceFolderData, error: foldersError } = await getFolders(
    params.workspaceId
  );
  const { data, error } = await getWorkspaceDetails(params.workspaceId);
  if (error || !data.length) redirect("/dashboard");

  return (
    // ⬇️ fixed: scrollable vertical area that fills viewport
    <div className="relative h-screen overflow-y-auto p-4 space-y-8">
      <h1 className="mb-8 text-center text-3xl font-bold text-gray-900 dark:text-gray-100">
        {data[0].title}
      </h1>

      <Allsearch
        workspaceFolderData={workspaceFolderData}
        workspace_id={params.workspaceId}
      />

      <section>
        <h2 className="mb-4 text-2xl font-semibold text-gray-800 dark:text-gray-200">
          Folder in Trash
        </h2>
        <div className="flex space-x-4 overflow-x-auto pb-4">
          {workspaceFolderData &&
            workspaceFolderData
              .filter((folder) => folder.in_trash)
              .map((folder) => (
                <Link
                  key={folder.id}
                  // ⬇️ fixed: use relative route instead of env URL
                  href={`/dashboard/${params.workspaceId}/${folder.id}`}
                >
                  <div className="inline-block transform rounded-lg bg-white p-6 shadow-lg transition-transform hover:scale-105 hover:shadow-xl dark:bg-gray-800">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                      {folder.title}
                    </h3>
                  </div>
                </Link>
              ))}
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-2xl font-semibold text-gray-800 dark:text-gray-200">
          All Folders
        </h2>
        {workspaceFolderData && workspaceFolderData.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {workspaceFolderData
              .filter((folder) => !folder.in_trash)
              .map((workspace) => (
                <Link
                  key={workspace.id}
                  // ⬇️ fixed: relative route again
                  href={`/dashboard/${params.workspaceId}/${workspace.id}`}
                >
                  <div className="rounded-lg bg-white p-6 shadow-lg transition-transform hover:scale-105 hover:shadow-xl dark:bg-gray-800">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                      {workspace.title}
                    </h3>
                  </div>
                </Link>
              ))}
          </div>
        ) : (
          <p className="text-gray-700 dark:text-gray-300">
            No folders available <br />{" "}
            <span className="rounded-md bg-primary/20 px-2 py-1">
              Create One
            </span>
          </p>
        )}
      </section>
    </div>
  );
};

export default Workspace;
