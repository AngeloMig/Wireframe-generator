"use client";

import { useState } from "react";
import { Send } from "lucide-react";
import { useAccessRequestsStore } from "@/stores/access-requests-store";
import { useSessionStore } from "@/stores/session-store";
import { toast } from "@/stores/ui-store";
import type { Project, ProjectPage, AccessRequestLevel } from "@/types";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Label, Select, Textarea } from "@/components/ui/input";

export function AccessRequestDialog({ project, page, open, onClose }: { project: Project; page: ProjectPage; open: boolean; onClose: () => void }) {
  const user = useSessionStore((state) => state.user);
  const createRequest = useAccessRequestsStore((state) => state.createRequest);
  const [level, setLevel] = useState<AccessRequestLevel>("page");
  const [reason, setReason] = useState("");

  return (
    <Dialog open={open} onClose={onClose} title="Request more access" description="Your agency will review the request before anything changes." size="sm" footer={<><Button variant="outline" onClick={onClose}>Cancel</Button><Button disabled={!reason.trim()} onClick={() => { createRequest({ projectId: project.id, requesterId: user.id, requesterName: user.name, level, pageId: page.id, reason: reason.trim() }); toast("Access request sent", "success", "The agency will review it shortly."); setReason(""); onClose(); }}><Send className="size-4" aria-hidden /> Send request</Button></>}>
      <div className="space-y-4">
        <div><Label htmlFor="access-request-level">What do you need?</Label><Select id="access-request-level" value={level} onChange={(event) => setLevel(event.target.value as AccessRequestLevel)} className="mt-1.5"><option value="page">Add or edit a page</option><option value="content">Edit page content</option><option value="builder">Build and arrange sections</option></Select></div>
        <div><Label htmlFor="access-request-reason">Why do you need access?</Label><Textarea id="access-request-reason" value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Tell the agency what you want to change…" rows={4} className="mt-1.5" /></div>
      </div>
    </Dialog>
  );
}
