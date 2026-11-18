"use client";

import { Send } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { TextField } from "@/components/ui/text-field";
import { useToast } from "@/components/ui/toaster";

/** Buttons that open each toast kind (AC-10). */
export function ToastDemo() {
  const { toast } = useToast();
  return (
    <div className="flex flex-wrap gap-3">
      <Button
        variant="secondary"
        onClick={() =>
          toast({
            kind: "success",
            title: "Message sent",
            description: "I'll reply within two working days.",
          })
        }
      >
        Success toast
      </Button>
      <Button
        variant="secondary"
        onClick={() =>
          toast({ kind: "info", title: "Link copied", description: "Paste it anywhere." })
        }
      >
        Info toast
      </Button>
      <Button
        variant="secondary"
        onClick={() =>
          toast({
            kind: "error",
            title: "Your message did not send",
            description: "Check your connection and try again. Nothing was lost.",
          })
        }
      >
        Error toast
      </Button>
    </div>
  );
}

/** A modal with a small form, to check focus, Escape, and focus return (AC-9). */
export function ModalDemo() {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  return (
    <>
      <div className="flex flex-wrap gap-3">
        <Button onClick={() => setOpen(true)}>Open modal</Button>
      </div>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Request details"
        description="Tell me who you are and I'll send the full case study."
        closeOnBackdrop
      >
        <form
          className="grid gap-4"
          onSubmit={(event) => {
            event.preventDefault();
            setOpen(false);
            toast({ kind: "success", title: "Request sent", description: "This is a demo." });
          }}
        >
          <TextField label="Your email" name="demo-email" type="email" required />
          <div className="flex flex-wrap justify-end gap-3">
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" iconEnd={<Send aria-hidden="true" className="size-4" />}>
              Send request
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}

/** A button that goes pending for two seconds, to show the loading state (AC-11). */
export function PendingDemo() {
  const [pending, setPending] = useState(false);
  return (
    <Button
      pending={pending}
      onClick={() => {
        setPending(true);
        window.setTimeout(() => setPending(false), 2000);
      }}
    >
      {pending ? "Sending" : "Click to send"}
    </Button>
  );
}
